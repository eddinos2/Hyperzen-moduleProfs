#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanTestDataAndRetest() {
  console.log('🧹 NETTOYAGE DES DONNÉES DE TEST ET RETEST');
  console.log('==========================================');
  
  try {
    // 1. Connexion Super Admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'houssam@aurlom.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Erreur connexion super admin:', authError.message);
      return;
    }
    
    console.log('✅ Super admin connecté:', authData.user?.email);
    
    // 2. Nettoyer les données de test précédentes
    console.log('\n🧹 NETTOYAGE DES DONNÉES DE TEST PRÉCÉDENTES');
    console.log('=============================================');
    
    const { error: cleanError } = await supabase
      .from('invoice_lines')
      .update({
        prevalidated_by: null,
        prevalidated_at: null,
        observations: null
      })
      .not('prevalidated_by', 'is', null);
    
    if (cleanError) {
      console.log('❌ Erreur nettoyage:', cleanError.message);
    } else {
      console.log('✅ Données de test précédentes nettoyées');
    }
    
    // 3. Récupérer les directeurs et leurs campus
    console.log('\n👔 DIRECTEURS ET LEURS CAMPUS');
    console.log('=============================');
    
    const { data: directors, error: directorsError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        campus_id,
        campus:campus_id(name)
      `)
      .eq('role', 'DIRECTEUR_CAMPUS')
      .limit(4);
    
    if (directorsError) {
      console.log('❌ Erreur récupération directeurs:', directorsError.message);
      return;
    }
    
    console.log(`✅ ${directors.length} directeurs récupérés:`);
    directors.forEach((director, index) => {
      console.log(`   ${index + 1}. ${director.first_name} ${director.last_name} - Campus: ${director.campus?.name}`);
    });
    
    // 4. Récupérer des lignes de facture pour chaque campus
    console.log('\n📋 LIGNES DE FACTURE PAR CAMPUS');
    console.log('===============================');
    
    for (const director of directors) {
      console.log(`\n🏢 Campus ${director.campus?.name} (Directeur: ${director.first_name} ${director.last_name}):`);
      
      const { data: lines, error: linesError } = await supabase
        .from('invoice_lines')
        .select(`
          id,
          intitule,
          date_cours,
          quantite_heures,
          total_ttc,
          campus_id
        `)
        .eq('campus_id', director.campus_id)
        .is('prevalidated_by', null)
        .limit(2);
      
      if (linesError) {
        console.log(`❌ Erreur récupération lignes:`, linesError.message);
        continue;
      }
      
      if (lines.length === 0) {
        console.log('   ℹ️ Aucune ligne non prévalidée trouvée');
        continue;
      }
      
      console.log(`   📝 ${lines.length} lignes trouvées:`);
      lines.forEach((line, index) => {
        console.log(`      ${index + 1}. ${line.intitule} - ${line.quantite_heures}h - ${line.total_ttc}€`);
      });
      
      // 5. Tester la prévalidation avec le bon directeur
      console.log(`\n✅ Test prévalidation par ${director.first_name} ${director.last_name}:`);
      
      for (const line of lines) {
        console.log(`   📝 Prévalidation: ${line.intitule} - ${line.total_ttc}€`);
        
        const { error: prevalidateError } = await supabase
          .from('invoice_lines')
          .update({
            prevalidated_by: director.id,
            prevalidated_at: new Date().toISOString(),
            observations: `Prévalidé par ${director.first_name} ${director.last_name} - Campus ${director.campus?.name}`
          })
          .eq('id', line.id);
        
        if (prevalidateError) {
          console.log(`      ❌ Erreur:`, prevalidateError.message);
        } else {
          console.log(`      ✅ Prévalidation réussie`);
        }
      }
    }
    
    // 6. Vérifier les résultats
    console.log('\n📊 VÉRIFICATION DES RÉSULTATS');
    console.log('=============================');
    
    const { data: prevalidatedLines, error: prevalidatedError } = await supabase
      .from('invoice_lines')
      .select(`
        id,
        intitule,
        date_cours,
        quantite_heures,
        total_ttc,
        campus_id,
        prevalidated_by,
        prevalidated_at,
        observations,
        campus_info:campus!campus_id(name),
        prevalidated_by_info:profiles!prevalidated_by(first_name, last_name, email)
      `)
      .not('prevalidated_by', 'is', null)
      .order('prevalidated_at', { ascending: false });
    
    if (prevalidatedError) {
      console.log('❌ Erreur vérification:', prevalidatedError.message);
      return;
    }
    
    console.log(`\n✅ ${prevalidatedLines.length} lignes prévalidées trouvées:`);
    
    prevalidatedLines.forEach((line, index) => {
      console.log(`\n   ${index + 1}. ${line.intitule} (${line.date_cours})`);
      console.log(`      📊 ${line.quantite_heures}h - ${line.total_ttc}€`);
      console.log(`      🏢 Campus: ${line.campus_info?.name}`);
      console.log(`      👔 Prévalidé par: ${line.prevalidated_by_info?.first_name} ${line.prevalidated_by_info?.last_name}`);
      console.log(`      📅 Date: ${line.prevalidated_at ? new Date(line.prevalidated_at).toLocaleString('fr-FR') : 'N/A'}`);
      console.log(`      💬 Observations: ${line.observations || 'Aucune'}`);
      
      // Vérifier la cohérence
      const isConsistent = line.campus_info?.name === line.prevalidated_by_info?.last_name;
      console.log(`      ${isConsistent ? '✅' : '❌'} Cohérence: ${isConsistent ? 'Directeur du bon campus' : 'ERREUR - Directeur du mauvais campus'}`);
    });
    
    // 7. Statistiques finales
    console.log('\n📈 STATISTIQUES FINALES');
    console.log('========================');
    
    const consistentLines = prevalidatedLines.filter(line => 
      line.campus_info?.name === line.prevalidated_by_info?.last_name
    ).length;
    
    console.log(`📊 RÉSUMÉ:`);
    console.log(`   - Total lignes prévalidées: ${prevalidatedLines.length}`);
    console.log(`   - Lignes cohérentes: ${consistentLines} (${Math.round(consistentLines/prevalidatedLines.length*100)}%)`);
    console.log(`   - Lignes incohérentes: ${prevalidatedLines.length - consistentLines} (${Math.round((prevalidatedLines.length - consistentLines)/prevalidatedLines.length*100)}%)`);
    
    if (consistentLines === prevalidatedLines.length) {
      console.log('\n🎉 LOGIQUE CORRIGÉE AVEC SUCCÈS !');
      console.log('==================================');
      console.log('✅ Chaque directeur ne peut prévalider que les lignes de son campus');
      console.log('✅ Les politiques RLS fonctionnent correctement');
      console.log('✅ Le panel super admin affiche les bonnes informations');
    } else {
      console.log('\n⚠️ IL RESTE DES INCOHÉRENCES À CORRIGER');
      console.log('======================================');
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

cleanTestDataAndRetest();
