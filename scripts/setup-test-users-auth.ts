import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTestUsersWithAuth() {
  console.log('🚀 CONFIGURATION DES UTILISATEURS DE TEST AVEC AUTH');
  console.log('===================================================');

  try {
    // 1. Récupérer tous les campus
    console.log('\n📋 1. RÉCUPÉRATION DES CAMPUS');
    const { data: campuses, error: campusError } = await supabase
      .from('campus')
      .select('*');

    if (campusError) {
      throw new Error(`Erreur récupération campus: ${campusError.message}`);
    }

    console.log(`✅ ${campuses.length} campus trouvés`);

    // 2. Créer les directeurs (un par campus)
    console.log('\n👨‍💼 2. CRÉATION DES DIRECTEURS');
    const directors = [];
    
    for (const campus of campuses) {
      const directorEmail = `directeur.${campus.name.toLowerCase().replace(/\s+/g, '')}@test.com`;
      
      console.log(`\n   🏢 Campus: ${campus.name}`);
      console.log(`   📧 Email: ${directorEmail}`);
      
      // Vérifier si le profil existe déjà
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', directorEmail)
        .single();
      
      if (existingProfile) {
        console.log(`   ✅ Directeur existe déjà: ${existingProfile.id}`);
        directors.push({
          id: existingProfile.id,
          email: directorEmail,
          campus: campus.name,
          campus_id: campus.id
        });
      } else {
        try {
          // Créer l'utilisateur dans auth.users
          const { data: userData, error: userError } = await supabase.auth.admin.createUser({
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
            console.log(`   ❌ Erreur création utilisateur: ${userError.message}`);
            continue;
          }

          // Créer le profil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userData.user.id,
              email: directorEmail,
              first_name: 'Directeur',
              last_name: campus.name,
              role: 'DIRECTEUR_CAMPUS',
              campus_id: campus.id
            })
            .select()
            .single();

          if (profileError) {
            console.log(`   ❌ Erreur création profil: ${profileError.message}`);
            // Nettoyer l'utilisateur créé
            await supabase.auth.admin.deleteUser(userData.user.id);
            continue;
          }

          directors.push({
            id: profile.id,
            email: directorEmail,
            campus: campus.name,
            campus_id: campus.id
          });
          
          console.log(`   ✅ Directeur créé: ${profile.id}`);
        } catch (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
          continue;
        }
      }
    }

    // 3. Créer les professeurs (3 par campus)
    console.log('\n👨‍🏫 3. CRÉATION DES PROFESSEURS');
    const professors = [];
    const professorData = [
      { first: 'Jean', last: 'Dupont', subject: 'Mathématiques' },
      { first: 'Marie', last: 'Martin', subject: 'Français' },
      { first: 'Pierre', last: 'Durand', subject: 'Histoire' }
    ];

    for (const campus of campuses) {
      console.log(`\n   🏢 Campus: ${campus.name}`);
      
      for (let i = 0; i < 3; i++) {
        const prof = professorData[i];
        const email = `prof.${prof.last.toLowerCase()}.${campus.name.toLowerCase().replace(/\s+/g, '')}@test.com`;
        
        console.log(`   👨‍🏫 ${prof.first} ${prof.last} (${prof.subject})`);
        
        // Vérifier si le profil existe déjà
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
        
        if (existingProfile) {
          console.log(`     ✅ Existe déjà: ${existingProfile.id}`);
          professors.push({
            id: existingProfile.id,
            email: email,
            name: `${prof.first} ${prof.last}`,
            subject: prof.subject,
            campus: campus.name,
            campus_id: campus.id
          });
        } else {
          try {
            // Créer l'utilisateur dans auth.users
            const { data: userData, error: userError } = await supabase.auth.admin.createUser({
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

            // Créer le profil
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                email: email,
                first_name: prof.first,
                last_name: prof.last,
                role: 'ENSEIGNANT',
                campus_id: campus.id
              })
              .select()
              .single();

            if (profileError) {
              console.log(`     ❌ Erreur création profil: ${profileError.message}`);
              // Nettoyer l'utilisateur créé
              await supabase.auth.admin.deleteUser(userData.user.id);
              continue;
            }

            professors.push({
              id: profile.id,
              email: email,
              name: `${prof.first} ${prof.last}`,
              subject: prof.subject,
              campus: campus.name,
              campus_id: campus.id
            });
            
            console.log(`     ✅ Créé: ${profile.id}`);
          } catch (error) {
            console.log(`     ❌ Erreur: ${error.message}`);
            continue;
          }
        }
      }
    }

    // 4. Créer des comptables
    console.log('\n💰 4. CRÉATION DES COMPTABLES');
    const comptables = [];
    const comptableData = [
      { first: 'Sophie', last: 'Leroy', email: 'comptable.leroy@test.com' },
      { first: 'Antoine', last: 'Moreau', email: 'comptable.moreau@test.com' }
    ];

    for (let i = 0; i < comptableData.length; i++) {
      const comptable = comptableData[i];
      
      console.log(`   💼 ${comptable.first} ${comptable.last}`);
      
      // Vérifier si le profil existe déjà
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', comptable.email)
        .single();
      
      if (existingProfile) {
        console.log(`     ✅ Existe déjà: ${existingProfile.id}`);
        comptables.push({
          id: existingProfile.id,
          email: comptable.email,
          name: `${comptable.first} ${comptable.last}`
        });
      } else {
        try {
          // Créer l'utilisateur dans auth.users
          const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: comptable.email,
            password: 'password123',
            email_confirm: true,
            user_metadata: {
              role: 'COMPTABLE'
            }
          });

          if (userError) {
            console.log(`     ❌ Erreur création utilisateur: ${userError.message}`);
            continue;
          }

          // Créer le profil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userData.user.id,
              email: comptable.email,
              first_name: comptable.first,
              last_name: comptable.last,
              role: 'COMPTABLE',
              campus_id: null
            })
            .select()
            .single();

          if (profileError) {
            console.log(`     ❌ Erreur création profil: ${profileError.message}`);
            // Nettoyer l'utilisateur créé
            await supabase.auth.admin.deleteUser(userData.user.id);
            continue;
          }

          comptables.push({
            id: profile.id,
            email: comptable.email,
            name: `${comptable.first} ${comptable.last}`
          });
          
          console.log(`     ✅ Créé: ${profile.id}`);
        } catch (error) {
          console.log(`     ❌ Erreur: ${error.message}`);
          continue;
        }
      }
    }

    // 5. Résumé final
    console.log('\n📊 RÉSUMÉ FINAL');
    console.log('================');
    console.log(`✅ Directeurs créés: ${directors.length}/${campuses.length}`);
    console.log(`✅ Professeurs créés: ${professors.length}/${campuses.length * 3}`);
    console.log(`✅ Comptables créés: ${comptables.length}/${comptableData.length}`);
    
    console.log('\n👥 DIRECTEURS:');
    directors.forEach(dir => {
      console.log(`   - ${dir.email} → ${dir.campus}`);
    });
    
    console.log('\n👨‍🏫 PROFESSEURS (par campus):');
    const campusGroups = professors.reduce((acc, prof) => {
      if (!acc[prof.campus]) acc[prof.campus] = [];
      acc[prof.campus].push(prof);
      return acc;
    }, {});
    
    Object.entries(campusGroups).forEach(([campus, profs]) => {
      console.log(`\n   🏢 ${campus}:`);
      profs.forEach(prof => {
        console.log(`     - ${prof.name} (${prof.subject}) - ${prof.email}`);
      });
    });
    
    console.log('\n💰 COMPTABLES:');
    comptables.forEach(comptable => {
      console.log(`   - ${comptable.name} - ${comptable.email}`);
    });

    console.log('\n🎉 CONFIGURATION TERMINÉE !');
    console.log('Tous les utilisateurs de test sont prêts pour les tests à grande échelle.');

    return { directors, professors, comptables };

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécution
setupTestUsersWithAuth()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec:', error);
    process.exit(1);
  });
