#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPrevalidationData() {
  console.log('🔍 VÉRIFICATION DES DONNÉES DE PRÉVALIDATION');
  console.log('============================================');
  
  try {
    // Connexion super admin pour voir toutes les données
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'houssam@aurlom.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Erreur connexion:', authError.message);
      return;
    }
    
    console.log('✅ Super admin connecté');
    
    // Récupérer les lignes prévalidées avec toutes les relations
    const { data: prevalidatedLines, error: linesError } = await supabase
      .from('invoice_lines')
      .select(`
        id,
        intitule,
        campus_id,
        prevalidated_by,
        prevalidated_at,
        observations,
        status,
        campus_info:campus!campus_id(name),
        prevalidated_by_info:profiles!prevalidated_by(first_name, last_name)
      `)
      .not('prevalidated_by', 'is', null)
      .order('prevalidated_at', { ascending: false });
    
    if (linesError) {
      console.log('❌ Erreur récupération lignes:', linesError.message);
      return;
    }
    
    console.log(`\n📊 ${prevalidatedLines.length} lignes prévalidées trouvées`);
    
    prevalidatedLines.forEach((line, index) => {
      console.log(`\n${index + 1}. Ligne: ${line.intitule}`);
      console.log(`   Campus ID: ${line.campus_id}`);
      console.log(`   Campus Name: ${line.campus_info?.name || 'N/A'}`);
      console.log(`   Prévalidé par ID: ${line.prevalidated_by}`);
      console.log(`   Prévalidé par: ${line.prevalidated_by_info?.first_name || 'N/A'} ${line.prevalidated_by_info?.last_name || 'N/A'}`);
      console.log(`   Date: ${line.prevalidated_at}`);
      console.log(`   Observations: ${line.observations || 'Aucune'}`);
      console.log(`   Status: ${line.status}`);
    });
    
    // Vérifier les données brutes
    console.log('\n🔍 VÉRIFICATION DONNÉES BRUTES');
    console.log('==============================');
    
    const { data: rawLines, error: rawError } = await supabase
      .from('invoice_lines')
      .select('*')
      .not('prevalidated_by', 'is', null)
      .limit(3);
    
    if (rawError) {
      console.log('❌ Erreur données brutes:', rawError.message);
      return;
    }
    
    rawLines.forEach((line, index) => {
      console.log(`\n${index + 1}. Ligne brute:`);
      console.log(`   ID: ${line.id}`);
      console.log(`   Campus ID: ${line.campus_id}`);
      console.log(`   Prévalidé par: ${line.prevalidated_by}`);
      console.log(`   Observations: ${line.observations}`);
      console.log(`   Status: ${line.status}`);
    });
    
    // Test de la requête exacte utilisée par le frontend
    console.log('\n🧪 TEST REQUÊTE FRONTEND');
    console.log('========================');
    
    const invoiceId = prevalidatedLines[0]?.invoice_id;
    if (invoiceId) {
      const { data: frontendLines, error: frontendError } = await supabase
        .from('invoice_lines')
        .select(`
          *,
          campus_info:campus!campus_id(name),
          submitted_by_info:profiles!submitted_by(first_name, last_name),
          prevalidated_by_info:profiles!prevalidated_by(first_name, last_name)
        `)
        .eq('invoice_id', invoiceId)
        .order('date_cours', { ascending: true });
      
      if (frontendError) {
        console.log('❌ Erreur requête frontend:', frontendError.message);
        return;
      }
      
      console.log(`\n📋 Lignes pour facture ${invoiceId}:`);
      frontendLines.forEach((line, index) => {
        console.log(`\n${index + 1}. ${line.intitule}`);
        console.log(`   Campus: ${line.campus_info?.name || 'N/A'} (ID: ${line.campus_id})`);
        console.log(`   Prévalidé par: ${line.prevalidated_by_info?.first_name || 'N/A'} ${line.prevalidated_by_info?.last_name || 'N/A'}`);
        console.log(`   Observations: ${line.observations || 'Aucune'}`);
        console.log(`   Status: ${line.status}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

checkPrevalidationData();
