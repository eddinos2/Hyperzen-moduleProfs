import { createClient } from '@supabase/supabase-js';

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  console.error('\nVeuillez définir ces variables dans votre fichier .env');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface TestAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'DIRECTEUR_CAMPUS' | 'COMPTABLE' | 'ENSEIGNANT';
  campusName?: string;
}

const testAccounts: TestAccount[] = [
  {
    email: 'directeur.roquette@aurlom.com',
    password: 'Test123!',
    firstName: 'Marie',
    lastName: 'Directeur',
    role: 'DIRECTEUR_CAMPUS',
    campusName: 'Roquette'
  },
  {
    email: 'directeur.picpus@aurlom.com',
    password: 'Test123!',
    firstName: 'Pierre',
    lastName: 'Directeur',
    role: 'DIRECTEUR_CAMPUS',
    campusName: 'Picpus'
  },
  {
    email: 'comptable@aurlom.com',
    password: 'Test123!',
    firstName: 'Sophie',
    lastName: 'Comptable',
    role: 'COMPTABLE'
  },
  {
    email: 'prof.martin@aurlom.com',
    password: 'Test123!',
    firstName: 'Jean',
    lastName: 'Martin',
    role: 'ENSEIGNANT',
    campusName: 'Roquette'
  },
  {
    email: 'prof.durand@aurlom.com',
    password: 'Test123!',
    firstName: 'Claire',
    lastName: 'Durand',
    role: 'ENSEIGNANT',
    campusName: 'Picpus'
  },
  {
    email: 'prof.bernard@aurlom.com',
    password: 'Test123!',
    firstName: 'Michel',
    lastName: 'Bernard',
    role: 'ENSEIGNANT',
    campusName: 'Sentier'
  }
];

async function createTestAccounts() {
  console.log('🚀 Création des comptes de test...\n');

  for (const account of testAccounts) {
    try {
      console.log(`📧 Création de ${account.email}...`);

      // 1. Créer l'utilisateur dans auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          first_name: account.firstName,
          last_name: account.lastName
        }
      });

      if (authError) {
        console.error(`❌ Erreur auth pour ${account.email}:`, authError.message);
        continue;
      }

      if (!authUser.user) {
        console.error(`❌ Pas d'utilisateur créé pour ${account.email}`);
        continue;
      }

      // 2. Récupérer l'ID du campus si nécessaire
      let campusId = null;
      if (account.campusName) {
        const { data: campus, error: campusError } = await supabase
          .from('campus')
          .select('id')
          .eq('name', account.campusName)
          .single();

        if (campusError) {
          console.error(`❌ Campus ${account.campusName} non trouvé:`, campusError.message);
          continue;
        }
        campusId = campus.id;
      }

      // 3. Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: account.email,
          first_name: account.firstName,
          last_name: account.lastName,
          role: account.role,
          campus_id: campusId
        });

      if (profileError) {
        console.error(`❌ Erreur profil pour ${account.email}:`, profileError.message);
        continue;
      }

      // 4. Si c'est un directeur de campus, mettre à jour le campus
      if (account.role === 'DIRECTEUR_CAMPUS' && campusId) {
        const { error: updateCampusError } = await supabase
          .from('campus')
          .update({ directeur_id: authUser.user.id })
          .eq('id', campusId);

        if (updateCampusError) {
          console.error(`❌ Erreur mise à jour campus:`, updateCampusError.message);
        }
      }

      console.log(`✅ ${account.email} créé avec succès (${account.role})`);

    } catch (error) {
      console.error(`❌ Erreur générale pour ${account.email}:`, error);
    }
  }

  console.log('\n🎉 Création des comptes terminée !');
  console.log('\n📋 Récapitulatif des comptes créés :');
  console.log('┌─────────────────────────────────────┬─────────────────┬──────────────────┐');
  console.log('│ Email                               │ Mot de passe    │ Rôle             │');
  console.log('├─────────────────────────────────────┼─────────────────┼──────────────────┤');
  
  testAccounts.forEach(account => {
    const role = account.role.replace('_', ' ');
    console.log(`│ ${account.email.padEnd(35)} │ ${account.password.padEnd(15)} │ ${role.padEnd(16)} │`);
  });
  
  console.log('└─────────────────────────────────────┴─────────────────┴──────────────────┘');
}

// Exécuter le script
createTestAccounts().catch(console.error);