import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestFunctions() {
  console.log('🔧 Création des fonctions RPC de test...');
  
  try {
    // Créer la fonction de prévalidation
    console.log('📝 Création de prevalidate_invoice_test...');
    
    const { error: prevalidateError } = await supabase
      .from('pg_proc')
      .insert({
        proname: 'prevalidate_invoice_test',
        proargtypes: ['uuid', 'uuid', 'uuid[]'],
        prorettype: 'json',
        prosrc: `
          DECLARE
            v_director profiles%ROWTYPE;
            v_invoice invoices%ROWTYPE;
            v_updated_lines INTEGER := 0;
          BEGIN
            -- Vérifier que le directeur existe
            SELECT * INTO v_director FROM profiles WHERE id = $1 AND role = 'DIRECTEUR_CAMPUS';
            
            IF NOT FOUND THEN
              RETURN json_build_object('success', false, 'message', 'Directeur non trouvé');
            END IF;
            
            -- Get invoice
            SELECT * INTO v_invoice FROM invoices WHERE id = $2;
            
            IF NOT FOUND THEN
              RETURN json_build_object('success', false, 'message', 'Facture non trouvée');
            END IF;
            
            -- Vérifier que la facture appartient au campus du directeur
            IF v_invoice.campus_id != v_director.campus_id THEN
              RETURN json_build_object('success', false, 'message', 'Facture ne correspond pas au campus du directeur');
            END IF;
            
            -- Prévalider les lignes spécifiées ou toutes les lignes
            IF $3 IS NOT NULL THEN
              UPDATE invoice_lines
              SET status = 'prevalidated', prevalidated_by = $1, prevalidated_at = NOW()
              WHERE invoice_id = $2 AND id = ANY($3);
              
              GET DIAGNOSTICS v_updated_lines = ROW_COUNT;
            ELSE
              UPDATE invoice_lines
              SET status = 'prevalidated', prevalidated_by = $1, prevalidated_at = NOW()
              WHERE invoice_id = $2;
              
              GET DIAGNOSTICS v_updated_lines = ROW_COUNT;
            END IF;
            
            -- Mettre à jour la facture
            UPDATE invoices
            SET status = 'prevalidated', prevalidated_by = $1, prevalidated_at = NOW()
            WHERE id = $2;
            
            RETURN json_build_object(
              'success', true,
              'message', 'Facture prévalidée avec succès',
              'updated_lines', v_updated_lines
            );
          END;
        `,
        prolang: 'plpgsql',
        prokind: 'f',
        prosecdef: true
      });
    
    if (prevalidateError) {
      console.log('❌ Erreur prévalidation:', prevalidateError.message);
    } else {
      console.log('✅ Fonction prevalidate_invoice_test créée');
    }
    
    // Test simple des fonctions existantes
    console.log('🧪 Test des fonctions existantes...');
    
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%invoice%');
    
    if (functionsError) {
      console.log('❌ Erreur liste fonctions:', functionsError.message);
    } else {
      console.log('📋 Fonctions existantes:', functions?.map(f => f.proname) || []);
    }
    
  } catch (err) {
    console.log('❌ Erreur:', err);
  }
}

createTestFunctions();
