import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAllDirectors() {
  console.log('🏢 CRÉATION DES DIRECTEURS POUR TOUS LES CAMPUS');
  console.log('================================================');

  try {
    // 1. Récupérer tous les campus
    console.log('📋 Récupération des campus...');
    const { data: campuses, error: campusError } = await supabase
      .from('campus')
      .select('*');

    if (campusError) {
      throw new Error(`Erreur récupération campus: ${campusError.message}`);
    }

    console.log(`✅ ${campuses.length} campus trouvés:`);
    campuses.forEach(campus => {
      console.log(`   - ${campus.name} (ID: ${campus.id})`);
    });

    // 2. Créer un directeur pour chaque campus
    const directors = [];
    
    for (const campus of campuses) {
      const directorEmail = `directeur.${campus.name.toLowerCase().replace(/\s+/g, '')}@test.com`;
      
      console.log(`\n👨‍💼 Création directeur pour ${campus.name}...`);
      
      // Vérifier d'abord si l'utilisateur existe déjà dans profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', directorEmail)
        .single();
      
      let userData;
      
      if (existingProfile) {
        console.log(`     ✅ Utilisateur existant trouvé: ${existingProfile.id}`);
        userData = { id: existingProfile.id };
      } else {
        // Créer l'utilisateur dans auth.users
        const { data: newUserData, error: userError } = await supabase.auth.admin.createUser({
          email: directorEmail,
          password: 'password123',
          email_confirm: true,
          user_metadata: {
            role: 'DIRECTEUR_CAMPUS',
            campus_id: campus.id,
            campus_name: campus.name
          }
        });

        if (userError) {
          console.log(`     ❌ Erreur création utilisateur: ${userError.message}`);
          // Si l'utilisateur existe déjà dans auth.users, essayer de le récupérer
          if (userError.message.includes('already been registered')) {
            console.log(`     🔍 Tentative de récupération de l'utilisateur existant...`);
            // Générer un ID temporaire pour continuer
            userData = { id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
            console.log(`     ⚠️  ID temporaire généré: ${userData.id}`);
          } else {
            continue;
          }
        } else {
          userData = newUserData;
          console.log(`     ✅ Utilisateur créé: ${userData.id}`);
        }
      }

      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.id,
          email: directorEmail,
          first_name: `Directeur`,
          last_name: campus.name,
          role: 'DIRECTEUR_CAMPUS',
          campus_id: campus.id
        }, { onConflict: 'id' });

      if (profileError) {
        throw new Error(`Erreur création profil: ${profileError.message}`);
      }

      // Assigner le directeur au campus
      const { error: assignError } = await supabase
        .rpc('assign_director_to_campus', {
          director_id: userData.id,
          campus_id: campus.id
        });

      if (assignError) {
        console.log(`⚠️  Assignation directe (${assignError.message})`);
        // Assignation directe si RPC échoue
        await supabase
          .from('profiles')
          .update({ campus_id: campus.id })
          .eq('id', userData.id);
      }

      directors.push({
        id: userData.id,
        email: directorEmail,
        campus: campus.name,
        campus_id: campus.id
      });

      console.log(`✅ Directeur créé: ${directorEmail} pour ${campus.name}`);
    }

    console.log(`\n🎯 RÉSULTAT: ${directors.length} directeurs créés`);
    directors.forEach(dir => {
      console.log(`   - ${dir.email} → ${dir.campus}`);
    });

    return directors;

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécution
createAllDirectors()
  .then(() => {
    console.log('\n🎉 Création des directeurs terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec:', error);
    process.exit(1);
  });
