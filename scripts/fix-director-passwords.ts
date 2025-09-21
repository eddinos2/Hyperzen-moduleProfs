#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixDirectorPasswords() {
  console.log('🔧 Correction des mots de passe des directeurs...');
  
  const directors = [
    'directeur.roquette@aurlom.com',
    'directeur.picpus@aurlom.com',
    'directeur.sentier@aurlom.com',
    'directeur.douai@aurlom.com',
    'directeur.saint-sebastien@aurlom.com',
    'directeur.jaures@aurlom.com',
    'directeur.parmentier@aurlom.com',
    'directeur.boulogne@aurlom.com'
  ];
  
  for (const email of directors) {
    console.log(`\n📧 Traitement: ${email}`);
    
    try {
      // Récupérer l'utilisateur
      const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (searchError) {
        console.log(`❌ Erreur recherche: ${searchError.message}`);
        continue;
      }
      
      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        console.log(`❌ Utilisateur non trouvé: ${email}`);
        continue;
      }
      
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: 'password123' }
      );
      
      if (updateError) {
        console.log(`❌ Erreur mise à jour: ${updateError.message}`);
      } else {
        console.log(`✅ ${email} - Mot de passe: password123`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur générale: ${error}`);
    }
  }
  
  console.log('\n🎉 Correction des mots de passe des directeurs terminée !');
}

fixDirectorPasswords();
