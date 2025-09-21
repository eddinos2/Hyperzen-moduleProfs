import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditFrontend() {
  console.log('🔍 AUDIT COMPLET DU FRONTEND');
  console.log('============================\n');

  try {
    // 1. Test des requêtes principales du frontend
    console.log('📋 1. TEST DES REQUÊTES FRONTEND');
    console.log('--------------------------------');
    
    // Test useInvoices (requête principale)
    console.log('🔍 Test useInvoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        profiles:enseignant_id(first_name, last_name, email),
        campus:campus_id(name),
        prevalidated_profile:profiles!invoices_prevalidated_by_fkey(first_name, last_name),
        validated_profile:profiles!invoices_validated_by_fkey(first_name, last_name),
        paid_profile:profiles!invoices_paid_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });
    
    if (invoicesError) {
      console.log('❌ useInvoices: ', invoicesError.message);
    } else {
      console.log(`✅ useInvoices: ${invoices?.length || 0} factures récupérées`);
      if (invoices && invoices.length > 0) {
        console.log('   📊 Colonnes disponibles:', Object.keys(invoices[0]).join(', '));
      }
    }

    // Test usePersonnel
    console.log('\n🔍 Test usePersonnel...');
    const { data: personnel, error: personnelError } = await supabase
      .from('profiles')
      .select(`
        *,
        campus:campus_id(name)
      `)
      .order('created_at', { ascending: false });
    
    if (personnelError) {
      console.log('❌ usePersonnel: ', personnelError.message);
    } else {
      console.log(`✅ usePersonnel: ${personnel?.length || 0} profils récupérés`);
    }

    // Test useCampus
    console.log('\n🔍 Test useCampus...');
    const { data: campuses, error: campusError } = await supabase
      .from('campus')
      .select('*')
      .order('name');
    
    if (campusError) {
      console.log('❌ useCampus: ', campusError.message);
    } else {
      console.log(`✅ useCampus: ${campuses?.length || 0} campus récupérés`);
    }

    // 2. Test des mutations (création, mise à jour)
    console.log('\n📝 2. TEST DES MUTATIONS');
    console.log('------------------------');
    
    // Test création d'une facture de test
    console.log('🔍 Test création facture...');
    const testInvoice = {
      enseignant_id: personnel?.[0]?.id || 'test-id',
      campus_id: campuses?.[0]?.id || 'test-campus-id',
      month_year: '2025-01',
      total_amount: 100.00
    };
    
    const { data: newInvoice, error: createError } = await supabase
      .from('invoices')
      .insert(testInvoice)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Création facture: ', createError.message);
    } else {
      console.log('✅ Création facture: OK');
      
      // Test création de lignes
      console.log('🔍 Test création lignes...');
      const testLines = [
        {
          invoice_id: newInvoice.id,
          date_cours: '2025-01-15',
          heure_debut: '09:00:00',
          heure_fin: '11:00:00',
          campus: 'Picpus',
          filiere: 'TEST',
          classe: 'TEST1',
          intitule: 'Cours test',
          quantite_heures: 2.0,
          prix_unitaire: 50.00,
          total_ttc: 100.00
        }
      ];
      
      const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(testLines);
      
      if (linesError) {
        console.log('❌ Création lignes: ', linesError.message);
      } else {
        console.log('✅ Création lignes: OK');
      }
      
      // Nettoyage
      await supabase.from('invoice_lines').delete().eq('invoice_id', newInvoice.id);
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      console.log('🧹 Données de test supprimées');
    }

    // 3. Test des fonctions RPC utilisées par le frontend
    console.log('\n⚙️  3. TEST DES FONCTIONS RPC FRONTEND');
    console.log('--------------------------------------');
    
    // Test avec des paramètres réels
    if (invoices && invoices.length > 0) {
      const testInvoiceId = invoices[0].id;
      
      // Test prevalidate_invoice
      console.log('🔍 Test prevalidate_invoice...');
      const { error: prevalidateError } = await supabase
        .rpc('prevalidate_invoice', {
          p_invoice_id: testInvoiceId,
          p_line_ids: null
        });
      
      if (prevalidateError) {
        console.log('❌ prevalidate_invoice: ', prevalidateError.message);
      } else {
        console.log('✅ prevalidate_invoice: OK');
      }
      
      // Test validate_invoice
      console.log('🔍 Test validate_invoice...');
      const { error: validateError } = await supabase
        .rpc('validate_invoice', {
          p_invoice_id: testInvoiceId
        });
      
      if (validateError) {
        console.log('❌ validate_invoice: ', validateError.message);
      } else {
        console.log('✅ validate_invoice: OK');
      }
    }

    // 4. Test des permissions par rôle
    console.log('\n🔐 4. TEST DES PERMISSIONS');
    console.log('--------------------------');
    
    // Simuler différents rôles
    const roles = ['SUPER_ADMIN', 'DIRECTEUR_CAMPUS', 'COMPTABLE', 'ENSEIGNANT'];
    
    for (const role of roles) {
      console.log(`\n👤 Test permissions pour ${role}:`);
      
      // Filtrer les factures selon le rôle
      let query = supabase.from('invoices').select('*');
      
      if (role === 'ENSEIGNANT') {
        query = query.eq('enseignant_id', personnel?.[0]?.id || 'test-id');
      } else if (role === 'DIRECTEUR_CAMPUS') {
        query = query.eq('campus_id', campuses?.[0]?.id || 'test-campus-id');
      }
      // SUPER_ADMIN et COMPTABLE voient tout
      
      const { data: roleInvoices, error: roleError } = await query;
      
      if (roleError) {
        console.log(`   ❌ ${role}: ${roleError.message}`);
      } else {
        console.log(`   ✅ ${role}: ${roleInvoices?.length || 0} factures visibles`);
      }
    }

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

auditFrontend();
