import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyTestFunctions() {
  console.log('🔧 Application des fonctions RPC de test...');
  
  try {
    // Fonction de prévalidation pour les tests
    const prevalidateSQL = `
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
        -- Vérifier que le directeur existe
        SELECT * INTO v_director FROM profiles WHERE id = p_director_id AND role = 'DIRECTEUR_CAMPUS';
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'message', 'Directeur non trouvé');
        END IF;
        
        -- Get invoice
        SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'message', 'Facture non trouvée');
        END IF;
        
        -- Vérifier que la facture appartient au campus du directeur
        IF v_invoice.campus_id != v_director.campus_id THEN
          RETURN json_build_object('success', false, 'message', 'Facture ne correspond pas au campus du directeur');
        END IF;
        
        -- Prévalider les lignes spécifiées ou toutes les lignes
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
        
        -- Mettre à jour la facture
        UPDATE invoices
        SET status = 'prevalidated', prevalidated_by = p_director_id, prevalidated_at = NOW()
        WHERE id = p_invoice_id;
        
        RETURN json_build_object(
          'success', true,
          'message', 'Facture prévalidée avec succès',
          'updated_lines', v_updated_lines
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Fonction de validation pour les tests
    const validateSQL = `
      CREATE OR REPLACE FUNCTION validate_invoice_test(
        p_invoice_id UUID,
        p_comptable_id UUID
      )
      RETURNS JSON AS $$
      DECLARE
        v_invoice invoices%ROWTYPE;
        v_comptable profiles%ROWTYPE;
      BEGIN
        -- Vérifier que le comptable existe
        SELECT * INTO v_comptable FROM profiles WHERE id = p_comptable_id AND role = 'COMPTABLE';
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'message', 'Comptable non trouvé');
        END IF;
        
        -- Get invoice
        SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'message', 'Facture non trouvée');
        END IF;
        
        -- Vérifier que la facture est prévalidée
        IF v_invoice.status != 'prevalidated' THEN
          RETURN json_build_object('success', false, 'message', 'Facture doit être prévalidée avant validation');
        END IF;
        
        -- Valider la facture
        UPDATE invoices
        SET status = 'validated', validated_by = p_comptable_id, validated_at = NOW()
        WHERE id = p_invoice_id;
        
        -- Valider toutes les lignes
        UPDATE invoice_lines
        SET status = 'validated', validated_by = p_comptable_id, validated_at = NOW()
        WHERE invoice_id = p_invoice_id;
        
        RETURN json_build_object(
          'success', true,
          'message', 'Facture validée avec succès'
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Fonction de paiement pour les tests
    const paymentSQL = `
      CREATE OR REPLACE FUNCTION mark_invoice_paid_test(
        p_invoice_id UUID,
        p_paid_by UUID,
        p_payment_date DATE DEFAULT CURRENT_DATE
      )
      RETURNS JSON AS $$
      DECLARE
        v_invoice invoices%ROWTYPE;
        v_user profiles%ROWTYPE;
      BEGIN
        -- Vérifier que l'utilisateur existe
        SELECT * INTO v_user FROM profiles WHERE id = p_paid_by AND role IN ('COMPTABLE', 'SUPER_ADMIN');
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'message', 'Utilisateur non autorisé');
        END IF;
        
        -- Get invoice
        SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'message', 'Facture non trouvée');
        END IF;
        
        -- Vérifier que la facture est validée
        IF v_invoice.status != 'validated' THEN
          RETURN json_build_object('success', false, 'message', 'Facture doit être validée avant paiement');
        END IF;
        
        -- Marquer comme payée
        UPDATE invoices
        SET status = 'paid', paid_by = p_paid_by, paid_at = p_payment_date
        WHERE id = p_invoice_id;
        
        -- Marquer toutes les lignes comme payées
        UPDATE invoice_lines
        SET status = 'paid', paid_by = p_paid_by, paid_at = p_payment_date
        WHERE invoice_id = p_invoice_id;
        
        RETURN json_build_object(
          'success', true,
          'message', 'Facture marquée comme payée avec succès'
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Appliquer les fonctions une par une
    const functions = [
      { name: 'prevalidate_invoice_test', sql: prevalidateSQL },
      { name: 'validate_invoice_test', sql: validateSQL },
      { name: 'mark_invoice_paid_test', sql: paymentSQL }
    ];
    
    for (const func of functions) {
      console.log(`📝 Création de ${func.name}...`);
      
      // Utiliser une requête SQL directe via la connexion
      const { error } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', func.name);
      
      if (error) {
        console.log(`❌ Erreur vérification ${func.name}:`, error.message);
        continue;
      }
      
      // Exécuter le SQL via une requête brute
      const { error: execError } = await supabase
        .rpc('exec', { sql: func.sql });
      
      if (execError) {
        console.log(`❌ Erreur création ${func.name}:`, execError.message);
      } else {
        console.log(`✅ ${func.name} créée avec succès`);
      }
    }
    
    console.log('🎉 Fonctions RPC de test appliquées');
    
  } catch (err) {
    console.log('❌ Erreur:', err);
  }
}

applyTestFunctions();
