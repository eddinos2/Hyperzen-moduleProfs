import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditSimple() {
  console.log('🔍 AUDIT SIMPLE DE LA BASE DE DONNÉES');
  console.log('=====================================\n');

  try {
    // 1. Test de connexion de base
    console.log('📋 1. TEST CONNEXION');
    console.log('-------------------');
    console.log('🔗 URL:', process.env.VITE_SUPABASE_URL);
    console.log('🔑 Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

    // 2. Test des tables principales
    console.log('\n📋 2. TABLES PRINCIPALES');
    console.log('------------------------');
    
    // Test campus
    const { data: campus, error: campusError } = await supabase
      .from('campus')
      .select('*');
    
    if (campusError) {
      console.log('❌ Campus error:', campusError.message);
    } else {
      console.log(`✅ Campus: ${campus?.length || 0} trouvés`);
      campus?.forEach(c => {
        console.log(`   🏢 ${c.name} - ${c.address} (ID: ${c.id})`);
      });
    }

    // Test profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log(`✅ Profiles: ${profiles?.length || 0} trouvés`);
      profiles?.forEach(p => {
        console.log(`   👤 ${p.email} - ${p.first_name} ${p.last_name} (${p.role}) - Campus: ${p.campus_id || 'Aucun'}`);
      });
    }

    // 3. Test des relations
    console.log('\n📋 3. TEST RELATIONS');
    console.log('--------------------');
    
    const { data: profilesWithCampus, error: relationError } = await supabase
      .from('profiles')
      .select(`
        *,
        campus:campus_id(name, address)
      `);
    
    if (relationError) {
      console.log('❌ Relation error:', relationError.message);
      console.log('🔍 Détails:', relationError);
    } else {
      console.log(`✅ Relations: ${profilesWithCampus?.length || 0} testées`);
      profilesWithCampus?.forEach(p => {
        const campusName = p.campus?.name || 'Aucun';
        console.log(`   👤 ${p.email} → 🏢 ${campusName}`);
      });
    }

    // 4. Test création d'un utilisateur
    console.log('\n📋 4. TEST CRÉATION UTILISATEUR');
    console.log('-------------------------------');
    
    const testEmail = `test.audit.${Date.now()}@test.com`;
    console.log(`📧 Test avec: ${testEmail}`);
    
    // Créer l'utilisateur auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Audit'
      }
    });
    
    if (authError) {
      console.log('❌ Auth creation error:', authError.message);
    } else {
      console.log('✅ Utilisateur auth créé:', authUser.user.id);
      
      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: testEmail,
          first_name: 'Test',
          last_name: 'Audit',
          role: 'ENSEIGNANT',
          campus_id: campus?.[0]?.id || null
        });
      
      if (profileError) {
        console.log('❌ Profile creation error:', profileError.message);
        console.log('🔍 Détails:', profileError);
      } else {
        console.log('✅ Profil créé avec succès');
        
        // Test de la relation
        const { data: testProfile, error: testError } = await supabase
          .from('profiles')
          .select(`
            *,
            campus:campus_id(name, address)
          `)
          .eq('id', authUser.user.id)
          .single();
        
        if (testError) {
          console.log('❌ Test relation error:', testError.message);
        } else {
          console.log('✅ Relation testée:', testProfile.campus?.name || 'Aucun campus');
        }
      }
      
      // Nettoyage
      await supabase.from('profiles').delete().eq('id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.log('🧹 Utilisateur de test supprimé');
    }

    // 5. Vérification des types
    console.log('\n📋 5. VÉRIFICATION TYPES');
    console.log('-------------------------');
    
    // Test insertion avec différents rôles
    const testRoles = ['SUPER_ADMIN', 'DIRECTEUR_CAMPUS', 'COMPTABLE', 'ENSEIGNANT'];
    
    for (const role of testRoles) {
      console.log(`🔍 Test rôle: ${role}`);
      
      const { data: testUser, error: testAuthError } = await supabase.auth.admin.createUser({
        email: `test.${role.toLowerCase()}.${Date.now()}@test.com`,
        password: 'password123',
        email_confirm: true
      });
      
      if (testAuthError) {
        console.log(`   ❌ Auth error pour ${role}:`, testAuthError.message);
      } else {
        const { error: testProfileError } = await supabase
          .from('profiles')
          .insert({
            id: testUser.user.id,
            email: `test.${role.toLowerCase()}.${Date.now()}@test.com`,
            first_name: 'Test',
            last_name: role,
            role: role,
            campus_id: role === 'DIRECTEUR_CAMPUS' ? campus?.[0]?.id : null
          });
        
        if (testProfileError) {
          console.log(`   ❌ Profile error pour ${role}:`, testProfileError.message);
        } else {
          console.log(`   ✅ ${role} créé avec succès`);
        }
        
        // Nettoyage
        await supabase.from('profiles').delete().eq('id', testUser.user.id);
        await supabase.auth.admin.deleteUser(testUser.user.id);
      }
    }

    console.log('\n🎯 RÉSUMÉ');
    console.log('==========');
    console.log('✅ Audit terminé');
    console.log('💡 Vérifiez les résultats ci-dessus');

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

auditSimple();
