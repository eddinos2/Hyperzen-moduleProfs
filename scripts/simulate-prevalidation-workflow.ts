#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulatePrevalidationWorkflow() {
  console.log('🎯 SIMULATION PRÉVALIDATION WORKFLOW');
  console.log('====================================');
  
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
    
    // 2. Récupérer les directeurs
    const { data: directors, error: directorsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, campus_id')
      .eq('role', 'DIRECTEUR_CAMPUS')
      .limit(4);
    
    if (directorsError) {
      console.log('❌ Erreur récupération directeurs:', directorsError.message);
      return;
    }
    
    console.log(`\n👔 ${directors.length} directeurs récupérés:`);
    directors.forEach((director, index) => {
      console.log(`   ${index + 1}. ${director.first_name} ${director.last_name} (${director.email})`);
    });
    
    // 3. Récupérer quelques lignes de facture
    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select(`
        id,
        invoice_id,
        intitule,
        date_cours,
        quantite_heures,
        total_ttc,
        campus_id,
        prevalidated_by
      `)
      .is('prevalidated_by', null)
      .limit(12);
    
    if (linesError) {
      console.log('❌ Erreur récupération lignes:', linesError.message);
      return;
    }
    
    console.log(`\n📋 ${lines.length} lignes non prévalidées trouvées:`);
    lines.forEach((line, index) => {
      console.log(`   ${index + 1}. ${line.intitule} - ${line.quantite_heures}h - ${line.total_ttc}€ - Campus: ${line.campus_id}`);
    });
    
    // 4. Simuler la prévalidation par différents directeurs
    console.log('\n🔄 SIMULATION PRÉVALIDATION PAR DIRECTEURS');
    console.log('==========================================');
    
    const prevalidations = [];
    
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i];
      const directorIndex = i % directors.length;
      const director = directors[directorIndex];
      
      console.log(`\n👔 Directeur ${director.first_name} ${director.last_name} prévalide:`);
      console.log(`   📝 ${line.intitule} - ${line.quantite_heures}h - ${line.total_ttc}€`);
      
      // Simuler la prévalidation
      const { error: updateError } = await supabase
        .from('invoice_lines')
        .update({
          prevalidated_by: director.id,
          prevalidated_at: new Date().toISOString(),
          observations: `Prévalidé par ${director.first_name} ${director.last_name} - Campus ${director.campus_id}`
        })
        .eq('id', line.id);
      
      if (updateError) {
        console.log(`❌ Erreur prévalidation:`, updateError.message);
      } else {
        console.log(`✅ Ligne prévalidée avec succès`);
        prevalidations.push({
          line: line.intitule,
          director: `${director.first_name} ${director.last_name}`,
          amount: line.total_ttc
        });
      }
    }
    
    // 5. Vérifier les résultats
    console.log('\n📊 VÉRIFICATION DES RÉSULTATS');
    console.log('=============================');
    
    const { data: updatedLines, error: updatedLinesError } = await supabase
      .from('invoice_lines')
      .select(`
        id,
        intitule,
        date_cours,
        quantite_heures,
        total_ttc,
        prevalidated_by,
        prevalidated_at,
        observations,
        prevalidated_by_info:profiles!prevalidated_by(first_name, last_name, email),
        campus_info:campus!campus_id(name)
      `)
      .in('id', lines.map(line => line.id))
      .not('prevalidated_by', 'is', null);
    
    if (updatedLinesError) {
      console.log('❌ Erreur vérification:', updatedLinesError.message);
      return;
    }
    
    console.log(`\n✅ ${updatedLines.length} lignes prévalidées trouvées:`);
    
    updatedLines.forEach((line, index) => {
      console.log(`\n   ${index + 1}. ${line.intitule} (${line.date_cours})`);
      console.log(`      📊 Heures: ${line.quantite_heures}h - Montant: ${line.total_ttc}€`);
      console.log(`      🏢 Campus: ${line.campus_info?.name || 'N/A'}`);
      console.log(`      👔 Prévalidé par: ${line.prevalidated_by_info?.first_name} ${line.prevalidated_by_info?.last_name}`);
      console.log(`      📅 Date: ${line.prevalidated_at ? new Date(line.prevalidated_at).toLocaleString('fr-FR') : 'N/A'}`);
      console.log(`      💬 Observations: ${line.observations || 'Aucune'}`);
    });
    
    // 6. Statistiques par directeur
    console.log('\n📈 STATISTIQUES PAR DIRECTEUR');
    console.log('=============================');
    
    const directorStats = {};
    updatedLines.forEach(line => {
      const directorName = `${line.prevalidated_by_info?.first_name} ${line.prevalidated_by_info?.last_name}`;
      if (!directorStats[directorName]) {
        directorStats[directorName] = {
          lines: 0,
          totalAmount: 0,
          totalHours: 0
        };
      }
      directorStats[directorName].lines++;
      directorStats[directorName].totalAmount += parseFloat(line.total_ttc);
      directorStats[directorName].totalHours += parseFloat(line.quantite_heures);
    });
    
    Object.entries(directorStats).forEach(([directorName, stats]) => {
      console.log(`\n👔 ${directorName}:`);
      console.log(`   📋 Lignes prévalidées: ${stats.lines}`);
      console.log(`   ⏰ Total heures: ${stats.totalHours}h`);
      console.log(`   💰 Montant total: ${stats.totalAmount.toFixed(2)}€`);
    });
    
    // 7. Simulation de l'affichage dans le panel super admin
    console.log('\n🖥️ SIMULATION PANEL SUPER ADMIN');
    console.log('===============================');
    
    console.log('✅ Dans le panel super admin, les colonnes "Prévalidé par" affichent maintenant:');
    updatedLines.slice(0, 5).forEach((line, index) => {
      console.log(`\n   ${index + 1}. ${line.intitule}`);
      console.log(`      👔 ${line.prevalidated_by_info?.first_name} ${line.prevalidated_by_info?.last_name}`);
      console.log(`      📅 ${line.prevalidated_at ? new Date(line.prevalidated_at).toLocaleDateString('fr-FR') : 'N/A'}`);
      console.log(`      💬 ${line.observations ? line.observations.substring(0, 50) + '...' : 'Aucune observation'}`);
    });
    
    console.log('\n🎉 SIMULATION WORKFLOW TERMINÉE !');
    console.log('=================================');
    console.log(`✅ ${updatedLines.length} lignes prévalidées par ${Object.keys(directorStats).length} directeurs`);
    console.log('✅ Colonnes "Prévalidé par" remplies dans le panel super admin');
    console.log('✅ Traçabilité complète des actions');
    console.log('✅ Observations des directeurs enregistrées');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

simulatePrevalidationWorkflow();
