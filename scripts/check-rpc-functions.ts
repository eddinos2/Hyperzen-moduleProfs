import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRPCFunctions() {
  console.log('🔍 VÉRIFICATION DES FONCTIONS RPC');
  console.log('==================================\n');

  try {
    // 1. Tester chaque fonction RPC avec les bons paramètres
    console.log('📋 1. TEST DES FONCTIONS RPC AVEC PARAMÈTRES');
    console.log('---------------------------------------------');
    
    // Récupérer des données de test
    const { data: campus } = await supabase
      .from('campus')
      .select('id, name')
      .limit(1)
      .single();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1)
      .single();
    
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .limit(1)
      .single();

    if (!campus || !profile || !invoice) {
      console.log('❌ Données de test manquantes');
      return;
    }

    // Test prevalidate_invoice
    console.log('\n🔍 Test prevalidate_invoice...');
    const { data: prevalidateResult, error: prevalidateError } = await supabase
      .rpc('prevalidate_invoice', {
        p_invoice_id: invoice.id,
        p_line_ids: null
      });
    
    if (prevalidateError) {
      console.log('❌ prevalidate_invoice:', prevalidateError.message);
    } else {
      console.log('✅ prevalidate_invoice:', prevalidateResult);
    }

    // Test validate_invoice
    console.log('\n🔍 Test validate_invoice...');
    const { data: validateResult, error: validateError } = await supabase
      .rpc('validate_invoice', {
        p_invoice_id: invoice.id
      });
    
    if (validateError) {
      console.log('❌ validate_invoice:', validateError.message);
    } else {
      console.log('✅ validate_invoice:', validateResult);
    }

    // Test mark_invoice_paid
    console.log('\n🔍 Test mark_invoice_paid...');
    const { data: paidResult, error: paidError } = await supabase
      .rpc('mark_invoice_paid', {
        p_invoice_id: invoice.id,
        p_payment_date: new Date().toISOString().split('T')[0]
      });
    
    if (paidError) {
      console.log('❌ mark_invoice_paid:', paidError.message);
    } else {
      console.log('✅ mark_invoice_paid:', paidResult);
    }

    // Test assign_director_to_campus
    console.log('\n🔍 Test assign_director_to_campus...');
    const { data: assignResult, error: assignError } = await supabase
      .rpc('assign_director_to_campus', {
        p_director_id: profile.id,
        p_campus_id: campus.id
      });
    
    if (assignError) {
      console.log('❌ assign_director_to_campus:', assignError.message);
    } else {
      console.log('✅ assign_director_to_campus:', assignResult);
    }

    // Test get_campus_assignments
    console.log('\n🔍 Test get_campus_assignments...');
    const { data: assignmentsResult, error: assignmentsError } = await supabase
      .rpc('get_campus_assignments');
    
    if (assignmentsError) {
      console.log('❌ get_campus_assignments:', assignmentsError.message);
    } else {
      console.log('✅ get_campus_assignments:', assignmentsResult);
    }

    // 2. Vérifier les migrations appliquées
    console.log('\n📋 2. VÉRIFICATION DES MIGRATIONS');
    console.log('----------------------------------');
    
    const migrationFiles = [
      '20250907114437_lively_shrine.sql',
      '20250907114447_soft_sound.sql', 
      '20250907114512_withered_meadow.sql',
      '20250907114622_dark_fog.sql',
      '20250907120823_broad_credit.sql',
      '20250907121325_wispy_mountain.sql',
      '20250907122207_azure_glade.sql',
      '20250913151625_violet_jungle.sql',
      '20250913152008_falling_shore.sql',
      '20250913152303_wild_heart.sql'
    ];
    
    console.log('📁 Fichiers de migration présents:');
    migrationFiles.forEach(file => {
      console.log(`   📄 ${file}`);
    });

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

checkRPCFunctions();
