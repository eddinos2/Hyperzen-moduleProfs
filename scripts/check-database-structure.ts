#!/usr/bin/env npx tsx

/**
 * Vérification de la structure de la base de données Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tulhrtkpxbmqzwshaojc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bGhydGtwYXhibXF6d3NoYW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0NDY3MywiZXhwIjoyMDcyODIwNjczfQ.bTBnYr3ANqfEVJ3YYC2SuapE-MYzy_KiXIv16Ef48nU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  console.log('🔍 Vérification de la structure de la base de données');
  console.log('====================================================\n');

  try {
    // Test avec la clé service role
    console.log('1️⃣ Test de connexion avec service role...');
    
    // Vérifier les tables existantes
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('❌ Impossible de récupérer les tables via RPC');
      console.log('   Erreur:', tablesError.message);
    } else {
      console.log('✅ Tables trouvées:', tables);
    }

    console.log('\n2️⃣ Test direct des tables...');
    
    // Test profiles
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        console.log('❌ Table profiles:', profilesError.message);
      } else {
        console.log('✅ Table profiles: OK');
        console.log('   Structure:', profiles?.[0] ? Object.keys(profiles[0]) : 'Aucune donnée');
      }
    } catch (err) {
      console.log('❌ Table profiles: Erreur inattendue');
    }

    // Test campus
    try {
      const { data: campuses, error: campusesError } = await supabase
        .from('campus')
        .select('*')
        .limit(1);
      
      if (campusesError) {
        console.log('❌ Table campus:', campusesError.message);
      } else {
        console.log('✅ Table campus: OK');
        console.log('   Structure:', campuses?.[0] ? Object.keys(campuses[0]) : 'Aucune donnée');
      }
    } catch (err) {
      console.log('❌ Table campus: Erreur inattendue');
    }

    // Test invoices
    try {
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .limit(1);
      
      if (invoicesError) {
        console.log('❌ Table invoices:', invoicesError.message);
      } else {
        console.log('✅ Table invoices: OK');
        console.log('   Structure:', invoices?.[0] ? Object.keys(invoices[0]) : 'Aucune donnée');
      }
    } catch (err) {
      console.log('❌ Table invoices: Erreur inattendue');
    }

    console.log('\n3️⃣ Test des RPC functions...');
    
    const rpcFunctions = [
      'get_personnel_enriched',
      'create_user_profile',
      'assign_director_to_campus'
    ];

    for (const func of rpcFunctions) {
      try {
        // Test simple de l'existence de la fonction
        const { data, error } = await supabase.rpc(func, {});
        
        if (error) {
          console.log(`❌ RPC ${func}: ${error.message}`);
        } else {
          console.log(`✅ RPC ${func}: OK`);
        }
      } catch (err) {
        console.log(`❌ RPC ${func}: Erreur inattendue`);
      }
    }

    console.log('\n4️⃣ Informations générales...');
    
    // Compter les enregistrements
    const { data: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (!profileCountError) {
      console.log(`📊 Nombre de profiles: ${profileCount?.length || 0}`);
    }

    const { data: campusCount, error: campusCountError } = await supabase
      .from('campus')
      .select('*', { count: 'exact', head: true });
    
    if (!campusCountError) {
      console.log(`📊 Nombre de campus: ${campusCount?.length || 0}`);
    }

    console.log('\n🎉 Vérification terminée !');

  } catch (error) {
    console.log('❌ Erreur inattendue:', error);
  }
}

checkDatabaseStructure();
