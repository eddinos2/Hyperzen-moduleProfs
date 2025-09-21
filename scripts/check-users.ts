import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUsers() {
  console.log('🔍 VÉRIFICATION UTILISATEURS');
  console.log('============================\n');

  try {
    // 1. Vérifier les profils
    console.log('📋 1. PROFILS DISPONIBLES');
    console.log('-------------------------');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.log('❌ Erreur profils:', profilesError.message);
    } else {
      console.log(`✅ Profils trouvés: ${profiles?.length || 0}`);
      profiles?.forEach(profile => {
        console.log(`   👤 ${profile.email} - ${profile.first_name} ${profile.last_name} (${profile.role})`);
        console.log(`      ID: ${profile.id}`);
      });
    }

    // 2. Vérifier les utilisateurs auth
    console.log('\n📋 2. UTILISATEURS AUTH');
    console.log('----------------------');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erreur utilisateurs auth:', usersError.message);
    } else {
      console.log(`✅ Utilisateurs auth trouvés: ${users.users.length}`);
      users.users.forEach(user => {
        console.log(`   🔐 ${user.email} - ${user.id}`);
        console.log(`      Créé: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`      Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
      });
    }

    // 3. Recommandations
    console.log('\n🎯 RECOMMANDATIONS');
    console.log('==================');
    
    if (profiles && profiles.length > 0) {
      const superAdmin = profiles.find(p => p.role === 'SUPER_ADMIN');
      if (superAdmin) {
        console.log(`✅ Connectez-vous avec: ${superAdmin.email}`);
        console.log(`   Mot de passe: password123`);
      } else {
        console.log('❌ Aucun super admin trouvé');
      }
    } else {
      console.log('❌ Aucun profil trouvé');
    }

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

checkUsers();
