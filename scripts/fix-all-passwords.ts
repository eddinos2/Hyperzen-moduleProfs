#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAllPasswords() {
  console.log('🔧 Correction de tous les mots de passe...');
  
  const accounts = [
    { email: 'houssam@aurlom.com', password: 'admin123', role: 'SUPER_ADMIN' },
    { email: 'directeur.jaures@aurlom.com', password: 'password123', role: 'DIRECTEUR_CAMPUS' },
    { email: 'prof.martin1@aurlom.com', password: 'password123', role: 'ENSEIGNANT' }
  ];
  
  for (const account of accounts) {
    try {
      console.log(`\n📧 Traitement: ${account.email}`);
      
      // 1. Récupérer l'ID de l'utilisateur
      const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', account.email)
        .single();
      
      if (userError) {
        console.log(`❌ Utilisateur non trouvé: ${account.email}`);
        continue;
      }
      
      // 2. Mettre à jour le mot de passe
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.id,
        { password: account.password }
      );
      
      if (passwordError) {
        console.log(`❌ Erreur mot de passe: ${passwordError.message}`);
        continue;
      }
      
      // 3. Test de connexion
      const supabaseTest = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I');
      
      const { error: loginError } = await supabaseTest.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });
      
      if (loginError) {
        console.log(`❌ Test connexion échoué: ${loginError.message}`);
      } else {
        console.log(`✅ ${account.email} - Mot de passe: ${account.password}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur pour ${account.email}:`, error);
    }
  }
  
  console.log('\n🎉 Correction des mots de passe terminée !');
  console.log('\n📋 COMPTES DE TEST PRÊTS:');
  console.log('========================');
  console.log('Super Admin: houssam@aurlom.com / admin123');
  console.log('Directeur: directeur.jaures@aurlom.com / password123');
  console.log('Professeur: prof.martin1@aurlom.com / password123');
}

fixAllPasswords();
