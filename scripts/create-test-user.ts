import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestUser() {
  console.log('🔍 CRÉATION UTILISATEUR DE TEST');
  console.log('===============================\n');

  try {
    // 1. Créer l'utilisateur auth
    console.log('📋 1. CRÉATION UTILISATEUR AUTH');
    console.log('-------------------------------');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'houssam@aurlom.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Houssam',
        last_name: 'Admin'
      }
    });

    if (authError) {
      console.log('❌ Erreur création auth:', authError.message);
    } else {
      console.log('✅ Utilisateur auth créé:', authUser.user.id);
      console.log('📧 Email:', authUser.user.email);
    }

    // 2. Créer le profil
    console.log('\n📋 2. CRÉATION PROFIL');
    console.log('--------------------');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
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

    // 3. Vérification
    console.log('\n📋 3. VÉRIFICATION');
    console.log('------------------');
    
    const { data: profile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();
    
    if (profileCheckError) {
      console.log('❌ Erreur vérification profil:', profileCheckError.message);
    } else {
      console.log('✅ Profil vérifié:', profile.email, profile.role);
    }

    console.log('\n🎯 RÉSULTAT');
    console.log('============');
    console.log('✅ Utilisateur de test créé avec succès');
    console.log('💡 Vous pouvez maintenant vous connecter avec:');
    console.log('   Email: houssam@aurlom.com');
    console.log('   Mot de passe: password123');

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

createTestUser();
