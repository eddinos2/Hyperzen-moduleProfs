#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findRealAccounts() {
  console.log('🔍 RECHERCHE DES VRAIS COMPTES');
  console.log('===============================');
  
  try {
    // Connexion super admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'houssam@aurlom.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Erreur connexion:', authError.message);
      return;
    }
    
    console.log('✅ Super admin connecté');
    
    // Récupérer tous les profils
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, campus_id')
      .order('role, first_name');
    
    if (profilesError) {
      console.log('❌ Erreur récupération profils:', profilesError.message);
      return;
    }
    
    console.log(`\n📊 ${profiles.length} profils trouvés`);
    
    // Grouper par rôle
    const byRole = profiles.reduce((acc, profile) => {
      if (!acc[profile.role]) acc[profile.role] = [];
      acc[profile.role].push(profile);
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log('\n👨‍🏫 PROFESSEURS DISPONIBLES:');
    console.log('============================');
    
    if (byRole['ENSEIGNANT']) {
      byRole['ENSEIGNANT'].forEach((prof, index) => {
        console.log(`${index + 1}. ${prof.first_name} ${prof.last_name}`);
        console.log(`   Email: ${prof.email}`);
        console.log(`   Campus ID: ${prof.campus_id}`);
        console.log(`   Mot de passe: password123`);
        console.log('');
      });
    } else {
      console.log('❌ Aucun professeur trouvé');
    }
    
    console.log('\n👨‍💼 DIRECTEURS DISPONIBLES:');
    console.log('============================');
    
    if (byRole['DIRECTEUR_CAMPUS']) {
      byRole['DIRECTEUR_CAMPUS'].forEach((director, index) => {
        console.log(`${index + 1}. ${director.first_name} ${director.last_name}`);
        console.log(`   Email: ${director.email}`);
        console.log(`   Campus ID: ${director.campus_id}`);
        console.log(`   Mot de passe: password123`);
        console.log('');
      });
    } else {
      console.log('❌ Aucun directeur trouvé');
    }
    
    console.log('\n🔑 COMPTES DE TEST RECOMMANDÉS:');
    console.log('===============================');
    
    // Recommander des comptes pour tester
    const recommendedProfessor = byRole['ENSEIGNANT']?.[0];
    const recommendedDirector = byRole['DIRECTEUR_CAMPUS']?.[0];
    
    if (recommendedProfessor) {
      console.log('🎓 PROFESSEUR:');
      console.log(`   Email: ${recommendedProfessor.email}`);
      console.log(`   Mot de passe: password123`);
      console.log(`   Nom: ${recommendedProfessor.first_name} ${recommendedProfessor.last_name}`);
    }
    
    if (recommendedDirector) {
      console.log('\n👨‍💼 DIRECTEUR:');
      console.log(`   Email: ${recommendedDirector.email}`);
      console.log(`   Mot de passe: password123`);
      console.log(`   Nom: ${recommendedDirector.first_name} ${recommendedDirector.last_name}`);
    }
    
    // Test de connexion avec un professeur
    if (recommendedProfessor) {
      console.log('\n🧪 TEST CONNEXION PROFESSEUR:');
      console.log('==============================');
      
      await supabase.auth.signOut();
      
      const { data: profAuth, error: profAuthError } = await supabase.auth.signInWithPassword({
        email: recommendedProfessor.email,
        password: 'password123'
      });
      
      if (profAuthError) {
        console.log(`❌ Erreur connexion professeur: ${profAuthError.message}`);
      } else {
        console.log(`✅ Connexion réussie: ${recommendedProfessor.first_name} ${recommendedProfessor.last_name}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

findRealAccounts();
