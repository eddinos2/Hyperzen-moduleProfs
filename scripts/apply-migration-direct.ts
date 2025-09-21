import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('🔧 Application directe de la migration...');
  
  try {
    const sql = fs.readFileSync('supabase/migrations/20250115000001_test_rpc_functions.sql', 'utf8');
    
    // Exécuter le SQL complet
    const { error } = await supabase
      .rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('❌ Erreur migration:', error.message);
      
      // Essayer une approche alternative - créer les fonctions une par une
      console.log('🔄 Tentative alternative...');
      
      const functions = [
        {
          name: 'prevalidate_invoice_test',
          sql: `
            CREATE OR REPLACE FUNCTION prevalidate_invoice_test(
              p_invoice_id UUID,
              p_director_id UUID,
              p_line_ids UUID[] DEFAULT NULL
            )
            RETURNS JSON AS $$
            DECLARE
              v_director profiles%ROWTYPE;
              v_invoice invoices%ROWTYPE;
              v_updated_lines INTEGER := 0;
            BEGIN
              SELECT * INTO v_director FROM profiles WHERE id = p_director_id AND role = 'DIRECTEUR_CAMPUS';
              IF NOT FOUND THEN
                RETURN json_build_object('success', false, 'message', 'Directeur non trouvé');
              END IF;
              
              SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
              IF NOT FOUND THEN
                RETURN json_build_object('success', false, 'message', 'Facture non trouvée');
              END IF;
              
              IF v_invoice.campus_id != v_director.campus_id THEN
                RETURN json_build_object('success', false, 'message', 'Facture ne correspond pas au campus du directeur');
              END IF;
              
              IF p_line_ids IS NOT NULL THEN
                UPDATE invoice_lines
                SET status = 'prevalidated', prevalidated_by = p_director_id, prevalidated_at = NOW()
                WHERE invoice_id = p_invoice_id AND id = ANY(p_line_ids);
                GET DIAGNOSTICS v_updated_lines = ROW_COUNT;
              ELSE
                UPDATE invoice_lines
                SET status = 'prevalidated', prevalidated_by = p_director_id, prevalidated_at = NOW()
                WHERE invoice_id = p_invoice_id;
                GET DIAGNOSTICS v_updated_lines = ROW_COUNT;
              END IF;
              
              UPDATE invoices
              SET status = 'prevalidated', prevalidated_by = p_director_id, prevalidated_at = NOW()
              WHERE id = p_invoice_id;
              
              RETURN json_build_object('success', true, 'message', 'Facture prévalidée avec succès', 'updated_lines', v_updated_lines);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `
        }
      ];
      
      for (const func of functions) {
        console.log(`📝 Création de ${func.name}...`);
        
        const { error: funcError } = await supabase
          .rpc('exec_sql', { sql_query: func.sql });
        
        if (funcError) {
          console.log(`❌ Erreur ${func.name}:`, funcError.message);
        } else {
          console.log(`✅ ${func.name} créée`);
        }
      }
      
    } else {
      console.log('✅ Migration appliquée avec succès');
    }
    
  } catch (err) {
    console.log('❌ Erreur:', err);
  }
}

applyMigration();
