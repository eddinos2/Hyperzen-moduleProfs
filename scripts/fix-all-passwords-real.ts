#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixAllPasswords() {
  console.log('🔧 CORRECTION DES MOTS DE PASSE');
  console.log('=================================');
  
  try {
    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erreur récupération utilisateurs:', usersError.message);
      return;
    }
    
    console.log(`📊 ${users.users.length} utilisateurs trouvés`);
    
    const testAccounts = [
      'prof.durand2@aurlom.com',
      'directeur.picpus@aurlom.com',
      'prof.martin1@aurlom.com',
      'directeur.roquette@aurlom.com'
    ];
    
    console.log('\n🔧 CORRECTION DES MOTS DE PASSE:');
    console.log('==================================');
    
    for (const email of testAccounts) {
      const user = users.users.find(u => u.email === email);
      
      if (user) {
        console.log(`\n👤 ${email}:`);
        
        // Mettre à jour le mot de passe
        const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            password: 'password123',
            email_confirm: true
          }
        );
        
        if (updateError) {
          console.log(`   ❌ Erreur: ${updateError.message}`);
        } else {
          console.log(`   ✅ Mot de passe mis à jour: password123`);
        }
      } else {
        console.log(`\n❌ ${email}: Utilisateur non trouvé`);
      }
    }
    
    console.log('\n🧪 TEST DES CONNEXIONS:');
    console.log('========================');
    
    // Test avec supabase client normal
    const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I');
    
    for (const email of testAccounts) {
      console.log(`\n🔐 Test connexion: ${email}`);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123'
      });
      
      if (authError) {
        console.log(`   ❌ Échec: ${authError.message}`);
      } else {
        console.log(`   ✅ Succès: ${authData.user.email}`);
        await supabase.auth.signOut();
      }
    }
    
    console.log('\n🎉 RÉSUMÉ DES COMPTES DE TEST:');
    console.log('===============================');
    console.log('🎓 PROFESSEUR:');
    console.log('   Email: prof.durand2@aurlom.com');
    console.log('   Mot de passe: password123');
    console.log('');
    console.log('👨‍💼 DIRECTEUR:');
    console.log('   Email: directeur.picpus@aurlom.com');
    console.log('   Mot de passe: password123');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

fixAllPasswords();
