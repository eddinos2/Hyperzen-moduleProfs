import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMultipleProfessors() {
  console.log('👨‍🏫 CRÉATION DE MULTIPLES PROFESSEURS');
  console.log('=====================================');

  try {
    // 1. Récupérer tous les campus
    const { data: campuses, error: campusError } = await supabase
      .from('campus')
      .select('*');

    if (campusError) {
      throw new Error(`Erreur récupération campus: ${campusError.message}`);
    }

    // 2. Créer 3 professeurs par campus
    const professors = [];
    const professorData = [
      { first: 'Jean', last: 'Dupont', subject: 'Mathématiques' },
      { first: 'Marie', last: 'Martin', subject: 'Français' },
      { first: 'Pierre', last: 'Durand', subject: 'Histoire' },
      { first: 'Sophie', last: 'Leroy', subject: 'Sciences' },
      { first: 'Antoine', last: 'Moreau', subject: 'Anglais' },
      { first: 'Claire', last: 'Petit', subject: 'Géographie' }
    ];

    for (const campus of campuses) {
      console.log(`\n🏢 Campus: ${campus.name}`);
      
      for (let i = 0; i < 3; i++) {
        const prof = professorData[i];
        const email = `prof.${prof.last.toLowerCase()}.${campus.name.toLowerCase().replace(/\s+/g, '')}@test.com`;
        
        console.log(`   👨‍🏫 Création: ${prof.first} ${prof.last} (${prof.subject})`);
        
        // Vérifier d'abord si l'utilisateur existe déjà dans profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
        
        let userData;
        
        if (existingProfile) {
          console.log(`     ✅ Utilisateur existant trouvé: ${existingProfile.id}`);
          userData = { id: existingProfile.id };
        } else {
          // Créer l'utilisateur
          const { data: newUserData, error: userError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'password123',
            email_confirm: true,
            user_metadata: {
              role: 'ENSEIGNANT',
              campus_id: campus.id,
              campus_name: campus.name,
              subject: prof.subject
            }
          });

          if (userError) {
            console.log(`     ❌ Erreur création utilisateur: ${userError.message}`);
            continue;
          }
          
          userData = newUserData;
          console.log(`     ✅ Utilisateur créé: ${userData.id}`);
        }

        // Créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userData.id,
            email: email,
            first_name: prof.first,
            last_name: prof.last,
            role: 'ENSEIGNANT',
            campus_id: campus.id
          }, { onConflict: 'id' });

        if (profileError) {
          console.log(`     ❌ Erreur profil: ${profileError.message}`);
          continue;
        }

        professors.push({
          id: userData.id,
          email: email,
          name: `${prof.first} ${prof.last}`,
          subject: prof.subject,
          campus: campus.name,
          campus_id: campus.id
        });

        console.log(`     ✅ Créé: ${email}`);
      }
    }

    console.log(`\n🎯 RÉSULTAT: ${professors.length} professeurs créés`);
    console.log('\n📊 Répartition par campus:');
    
    const campusGroups = professors.reduce((acc, prof) => {
      if (!acc[prof.campus]) acc[prof.campus] = [];
      acc[prof.campus].push(prof);
      return acc;
    }, {});

    Object.entries(campusGroups).forEach(([campus, profs]) => {
      console.log(`\n🏢 ${campus}:`);
      profs.forEach(prof => {
        console.log(`   - ${prof.name} (${prof.subject}) - ${prof.email}`);
      });
    });

    return professors;

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécution
createMultipleProfessors()
  .then(() => {
    console.log('\n🎉 Création des professeurs terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec:', error);
    process.exit(1);
  });
