import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestData() {
  console.log('🔍 CRÉATION DONNÉES DE TEST');
  console.log('============================\n');

  try {
    // 1. Créer les campus
    console.log('📋 1. CRÉATION CAMPUS');
    console.log('---------------------');
    
    const campuses = [
      { name: 'Roquette', address: '48 rue de la Roquette, 75011 Paris' },
      { name: 'Picpus', address: '146 rue de Picpus, 75012 Paris' },
      { name: 'Sentier', address: '43 rue du Sentier, 75002 Paris' },
      { name: 'Douai', address: '69 rue de Douai, 75009 Paris' },
      { name: 'Saint-Sébastien', address: '45 rue Saint-Sébastien, 75011 Paris' },
      { name: 'Jaurès', address: '118 avenue Jean-Jaurès, 75019 Paris' },
      { name: 'Parmentier', address: '16 avenue Parmentier, 75011 Paris' },
      { name: 'Boulogne', address: '59 rue de Billancourt, 92100 Boulogne' }
    ];

    for (const campus of campuses) {
      const { error } = await supabase
        .from('campus')
        .insert(campus);
      
      if (error) {
        console.log(`❌ Erreur campus ${campus.name}:`, error.message);
      } else {
        console.log(`✅ Campus ${campus.name} créé`);
      }
    }

    // 2. Créer un super admin
    console.log('\n📋 2. CRÉATION SUPER ADMIN');
    console.log('--------------------------');
    
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
      
      // Créer le profil
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
        console.log('✅ Profil super admin créé');
      }
    }

    // 3. Créer un professeur
    console.log('\n📋 3. CRÉATION PROFESSEUR');
    console.log('-------------------------');
    
    const { data: campus } = await supabase
      .from('campus')
      .select('id')
      .eq('name', 'Jaurès')
      .single();
    
    if (campus) {
      const { data: profUser, error: profError } = await supabase.auth.admin.createUser({
        email: 'prof.martin@aurlom.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          first_name: 'Jean',
          last_name: 'Martin'
        }
      });

      if (profError) {
        console.log('❌ Erreur création prof:', profError.message);
      } else {
        console.log('✅ Professeur auth créé:', profUser.user.id);
        
        // Créer le profil
        const { error: profProfileError } = await supabase
          .from('profiles')
          .insert({
            id: profUser.user.id,
            email: 'prof.martin@aurlom.com',
            first_name: 'Jean',
            last_name: 'Martin',
            role: 'ENSEIGNANT',
            campus_id: campus.id
          });
        
        if (profProfileError) {
          console.log('❌ Erreur création profil prof:', profProfileError.message);
        } else {
          console.log('✅ Profil professeur créé');
        }
      }
    }

    // 4. Vérification finale
    console.log('\n📋 4. VÉRIFICATION FINALE');
    console.log('-------------------------');
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*');
    
    const { data: allCampus } = await supabase
      .from('campus')
      .select('*');
    
    console.log(`✅ Profils créés: ${allProfiles?.length || 0}`);
    console.log(`✅ Campus créés: ${allCampus?.length || 0}`);
    
    console.log('\n🎉 DONNÉES DE TEST CRÉÉES !');
    console.log('============================');
    console.log('Vous pouvez maintenant tester la création de personnel via l\'interface');

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

createTestData();
