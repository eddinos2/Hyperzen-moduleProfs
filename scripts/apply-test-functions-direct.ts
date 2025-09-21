import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyTestFunctions() {
  console.log('🔧 Application des fonctions RPC de test...');
  
  try {
    // Lire le fichier de migration
    const sql = fs.readFileSync('supabase/migrations/20250115000000_test_rpc_functions.sql', 'utf8');
    
    // Appliquer le SQL complet en une fois
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('❌ Erreur application:', error.message);
      
      // Essayer une approche alternative avec des requêtes individuelles
      console.log('🔄 Tentative alternative...');
      
      // Fonction de prévalidation
      const prevalidateSQL = `
        CREATE OR REPLACE FUNCTION prevalidate_invoice_test(
          p_director_id UUID,
          p_invoice_id UUID,
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
      
      const { error: prevalidateError } = await supabase.rpc('exec_sql', { sql_query: prevalidateSQL });
      if (prevalidateError) {
        console.log('❌ Erreur prévalidation:', prevalidateError.message);
      } else {
        console.log('✅ Fonction prevalidate_invoice_test créée');
      }
      
      // Fonction de validation
      const validateSQL = `
        CREATE OR REPLACE FUNCTION validate_invoice_test(
          p_comptable_id UUID,
          p_invoice_id UUID
        )
        RETURNS JSON AS $$
        DECLARE
          v_comptable profiles%ROWTYPE;
          v_invoice invoices%ROWTYPE;
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
      
      const { error: validateError } = await supabase.rpc('exec_sql', { sql_query: validateSQL });
      if (validateError) {
        console.log('❌ Erreur validation:', validateError.message);
      } else {
        console.log('✅ Fonction validate_invoice_test créée');
      }
      
      // Fonction de paiement
      const paymentSQL = `
        CREATE OR REPLACE FUNCTION mark_invoice_paid_test(
          p_paid_by UUID,
          p_invoice_id UUID,
          p_payment_date DATE DEFAULT CURRENT_DATE
        )
        RETURNS JSON AS $$
        DECLARE
          v_user profiles%ROWTYPE;
          v_invoice invoices%ROWTYPE;
        BEGIN
          -- Vérifier que l'utilisateur existe
          SELECT * INTO v_user FROM profiles WHERE id = p_paid_by;
          
          IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'message', 'Utilisateur non trouvé');
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
      
      const { error: paymentError } = await supabase.rpc('exec_sql', { sql_query: paymentSQL });
      if (paymentError) {
        console.log('❌ Erreur paiement:', paymentError.message);
      } else {
        console.log('✅ Fonction mark_invoice_paid_test créée');
      }
      
    } else {
      console.log('✅ Fonctions RPC de test appliquées avec succès');
    }
    
  } catch (err) {
    console.log('❌ Erreur:', err);
  }
}

applyTestFunctions();
