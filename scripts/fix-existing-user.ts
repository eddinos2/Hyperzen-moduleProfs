import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixExistingUser() {
  console.log('🔍 RÉPARATION UTILISATEUR EXISTANT');
  console.log('==================================\n');

  try {
    // 1. Lister les utilisateurs auth existants
    console.log('📋 1. UTILISATEURS AUTH EXISTANTS');
    console.log('--------------------------------');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erreur liste utilisateurs:', usersError.message);
      return;
    }
    
    console.log(`✅ Utilisateurs auth trouvés: ${users.users.length}`);
    users.users.forEach(user => {
      console.log(`   🔐 ${user.email} - ${user.id}`);
    });

    // 2. Trouver houssam@aurlom.com
    const houssamUser = users.users.find(u => u.email === 'houssam@aurlom.com');
    
    if (!houssamUser) {
      console.log('❌ Utilisateur houssam@aurlom.com non trouvé');
      return;
    }
    
    console.log(`\n📋 2. RÉPARATION PROFIL POUR ${houssamUser.email}`);
    console.log('-----------------------------------------------');
    console.log(`ID utilisateur: ${houssamUser.id}`);

    // 3. Créer le profil manquant
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: houssamUser.id,
        email: 'houssam@aurlom.com',
        first_name: 'Houssam',
        last_name: 'Admin',
        role: 'SUPER_ADMIN',
        campus_id: null
      });
    
    if (profileError) {
      console.log('❌ Erreur création profil:', profileError.message);
    } else {
      console.log('✅ Profil créé avec succès');
    }

    // 4. Vérification
    console.log('\n📋 3. VÉRIFICATION');
    console.log('------------------');
    
    const { data: profile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', houssamUser.id)
      .single();
    
    if (profileCheckError) {
      console.log('❌ Erreur vérification profil:', profileCheckError.message);
    } else {
      console.log('✅ Profil vérifié:');
      console.log(`   Email: ${profile.email}`);
      console.log(`   Nom: ${profile.first_name} ${profile.last_name}`);
      console.log(`   Rôle: ${profile.role}`);
    }

    console.log('\n🎯 RÉSULTAT');
    console.log('============');
    console.log('✅ Utilisateur réparé avec succès');
    console.log('💡 Vous pouvez maintenant vous reconnecter avec:');
    console.log('   Email: houssam@aurlom.com');
    console.log('   Mot de passe: password123');

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

fixExistingUser();
