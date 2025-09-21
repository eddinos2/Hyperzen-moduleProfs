import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditDBDirect() {
  console.log('🔍 AUDIT DIRECT DE LA DB LOCALE');
  console.log('================================\n');

  try {
    // 1. Test de connexion et tables principales
    console.log('📋 1. TEST DE CONNEXION ET TABLES');
    console.log('----------------------------------');
    
    const tables = ['profiles', 'campus', 'invoices', 'invoice_lines', 'audit_logs'];
    
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Table accessible`);
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   📊 Colonnes: ${columns.join(', ')}`);
        }
      }
    }

    // 2. Comptage des données
    console.log('\n📊 2. COMPTAGE DES DONNÉES');
    console.log('---------------------------');
    
    for (const tableName of tables) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`📄 ${tableName}: ${count || 0} enregistrements`);
      }
    }

    // 3. Détail des colonnes par échantillonnage
    console.log('\n🔍 3. DÉTAIL DES COLONNES (par échantillonnage)');
    console.log('-----------------------------------------------');
    
    // Profiles
    const { data: profileSample } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileSample && profileSample.length > 0) {
      console.log('👥 PROFILES:');
      Object.keys(profileSample[0]).forEach(col => {
        const value = profileSample[0][col];
        const type = typeof value;
        console.log(`   🔹 ${col}: ${type} (ex: ${value})`);
      });
    }

    // Campus
    const { data: campusSample } = await supabase
      .from('campus')
      .select('*')
      .limit(1);
    
    if (campusSample && campusSample.length > 0) {
      console.log('\n🏢 CAMPUS:');
      Object.keys(campusSample[0]).forEach(col => {
        const value = campusSample[0][col];
        const type = typeof value;
        console.log(`   🔹 ${col}: ${type} (ex: ${value})`);
      });
    }

    // Invoices
    const { data: invoiceSample } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (invoiceSample && invoiceSample.length > 0) {
      console.log('\n📄 INVOICES:');
      Object.keys(invoiceSample[0]).forEach(col => {
        const value = invoiceSample[0][col];
        const type = typeof value;
        console.log(`   🔹 ${col}: ${type} (ex: ${value})`);
      });
    }

    // Invoice Lines
    const { data: lineSample } = await supabase
      .from('invoice_lines')
      .select('*')
      .limit(1);
    
    if (lineSample && lineSample.length > 0) {
      console.log('\n📋 INVOICE_LINES:');
      Object.keys(lineSample[0]).forEach(col => {
        const value = lineSample[0][col];
        const type = typeof value;
        console.log(`   🔹 ${col}: ${type} (ex: ${value})`);
      });
    }

    // 4. Test des relations
    console.log('\n🔗 4. TEST DES RELATIONS');
    console.log('-------------------------');
    
    // Test relation profiles -> campus
    const { data: profileWithCampus } = await supabase
      .from('profiles')
      .select('*, campus:campus_id(name)')
      .limit(1);
    
    if (profileWithCampus && profileWithCampus.length > 0) {
      console.log('✅ Relation profiles -> campus: OK');
    } else {
      console.log('❌ Relation profiles -> campus: KO');
    }

    // Test relation invoices -> profiles
    const { data: invoiceWithProfile } = await supabase
      .from('invoices')
      .select('*, profiles:enseignant_id(first_name, last_name)')
      .limit(1);
    
    if (invoiceWithProfile && invoiceWithProfile.length > 0) {
      console.log('✅ Relation invoices -> profiles: OK');
    } else {
      console.log('❌ Relation invoices -> profiles: KO');
    }

    // Test relation invoices -> campus
    const { data: invoiceWithCampus } = await supabase
      .from('invoices')
      .select('*, campus:campus_id(name)')
      .limit(1);
    
    if (invoiceWithCampus && invoiceWithCampus.length > 0) {
      console.log('✅ Relation invoices -> campus: OK');
    } else {
      console.log('❌ Relation invoices -> campus: KO');
    }

    // 5. Test des fonctions RPC
    console.log('\n⚙️  5. TEST DES FONCTIONS RPC');
    console.log('-----------------------------');
    
    const rpcFunctions = [
      'prevalidate_invoice',
      'validate_invoice', 
      'mark_invoice_paid',
      'assign_director_to_campus',
      'get_campus_assignments'
    ];
    
    for (const funcName of rpcFunctions) {
      try {
        const { error } = await supabase.rpc(funcName, {});
        if (error) {
          console.log(`❌ ${funcName}: ${error.message}`);
        } else {
          console.log(`✅ ${funcName}: Disponible`);
        }
      } catch (err) {
        console.log(`❌ ${funcName}: ${err.message}`);
      }
    }

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

auditDBDirect();
