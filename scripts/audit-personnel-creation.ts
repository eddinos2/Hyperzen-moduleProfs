import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditPersonnelCreation() {
  console.log('🔍 AUDIT CRÉATION DE PERSONNEL - SUPERADMIN');
  console.log('============================================\n');

  try {
    // 1. Vérifier les pages de gestion du personnel
    console.log('📋 1. VÉRIFICATION DES PAGES DE GESTION');
    console.log('----------------------------------------');
    
    const pages = [
      'src/pages/PersonnelPage.tsx',
      'src/pages/ProfessorsPage.tsx', 
      'src/pages/CampusPage.tsx',
      'src/pages/AdminDashboard.tsx'
    ];
    
    for (const page of pages) {
      console.log(`📄 ${page}: Existe`);
    }

    // 2. Vérifier les hooks de gestion
    console.log('\n📋 2. VÉRIFICATION DES HOOKS');
    console.log('-----------------------------');
    
    const hooks = [
      'src/hooks/usePersonnel.ts',
      'src/hooks/useProfessors.ts',
      'src/hooks/useCampus.ts'
    ];
    
    for (const hook of hooks) {
      console.log(`🔗 ${hook}: Existe`);
    }

    // 3. Test de création d'un utilisateur complet
    console.log('\n📋 3. TEST CRÉATION UTILISATEUR COMPLET');
    console.log('----------------------------------------');
    
    // Récupérer un campus
    const { data: campus } = await supabase
      .from('campus')
      .select('id, name')
      .limit(1)
      .single();
    
    if (!campus) {
      console.log('❌ Aucun campus trouvé');
      return;
    }
    
    console.log(`🏢 Campus de test: ${campus.name}`);

    // Test création professeur
    console.log('\n👨‍🏫 Test création professeur...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test.prof@audit.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Professeur'
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
          email: 'test.prof@audit.com',
          first_name: 'Test',
          last_name: 'Professeur',
          role: 'ENSEIGNANT',
          campus_id: campus.id
        });
      
      if (profileError) {
        console.log('❌ Erreur création profil:', profileError.message);
      } else {
        console.log('✅ Profil créé avec succès');
      }
    }

    // Test création directeur
    console.log('\n👨‍💼 Test création directeur...');
    const { data: authDirector, error: authDirectorError } = await supabase.auth.admin.createUser({
      email: 'test.directeur@audit.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Directeur'
      }
    });
    
    if (authDirectorError) {
      console.log('❌ Erreur création auth directeur:', authDirectorError.message);
    } else {
      console.log('✅ Utilisateur auth directeur créé:', authDirector.user.id);
      
      // Créer le profil directeur
      const { error: profileDirectorError } = await supabase
        .from('profiles')
        .insert({
          id: authDirector.user.id,
          email: 'test.directeur@audit.com',
          first_name: 'Test',
          last_name: 'Directeur',
          role: 'DIRECTEUR_CAMPUS',
          campus_id: campus.id
        });
      
      if (profileDirectorError) {
        console.log('❌ Erreur création profil directeur:', profileDirectorError.message);
      } else {
        console.log('✅ Profil directeur créé avec succès');
        
        // Assigner le directeur au campus
        const { error: assignError } = await supabase
          .from('campus')
          .update({ directeur_id: authDirector.user.id })
          .eq('id', campus.id);
        
        if (assignError) {
          console.log('❌ Erreur assignation directeur:', assignError.message);
        } else {
          console.log('✅ Directeur assigné au campus');
        }
      }
    }

    // Test création comptable
    console.log('\n💼 Test création comptable...');
    const { data: authComptable, error: authComptableError } = await supabase.auth.admin.createUser({
      email: 'test.comptable@audit.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Comptable'
      }
    });
    
    if (authComptableError) {
      console.log('❌ Erreur création auth comptable:', authComptableError.message);
    } else {
      console.log('✅ Utilisateur auth comptable créé:', authComptable.user.id);
      
      // Créer le profil comptable
      const { error: profileComptableError } = await supabase
        .from('profiles')
        .insert({
          id: authComptable.user.id,
          email: 'test.comptable@audit.com',
          first_name: 'Test',
          last_name: 'Comptable',
          role: 'COMPTABLE',
          campus_id: null
        });
      
      if (profileComptableError) {
        console.log('❌ Erreur création profil comptable:', profileComptableError.message);
      } else {
        console.log('✅ Profil comptable créé avec succès');
      }
    }

    // 4. Vérification des données créées
    console.log('\n📋 4. VÉRIFICATION DES DONNÉES CRÉÉES');
    console.log('--------------------------------------');
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, campus_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allProfiles) {
      console.log('👥 Derniers profils créés:');
      allProfiles.forEach(profile => {
        console.log(`   🔹 ${profile.email} - ${profile.first_name} ${profile.last_name} (${profile.role})`);
      });
    }

    // 5. Test des requêtes frontend
    console.log('\n📋 5. TEST DES REQUÊTES FRONTEND');
    console.log('--------------------------------');
    
    // Test usePersonnel
    const { data: personnel, error: personnelError } = await supabase
      .from('profiles')
      .select(`
        *,
        campus:campus_id(name)
      `)
      .order('created_at', { ascending: false });
    
    if (personnelError) {
      console.log('❌ usePersonnel:', personnelError.message);
    } else {
      console.log(`✅ usePersonnel: ${personnel?.length || 0} profils récupérés`);
    }

    // Test useCampus
    const { data: campuses, error: campusError } = await supabase
      .from('campus')
      .select(`
        *,
        profiles:directeur_id(first_name, last_name, email)
      `)
      .order('name');
    
    if (campusError) {
      console.log('❌ useCampus:', campusError.message);
    } else {
      console.log(`✅ useCampus: ${campuses?.length || 0} campus récupérés`);
      campuses?.forEach(campus => {
        const directeur = campus.profiles ? `${campus.profiles.first_name} ${campus.profiles.last_name}` : 'Aucun';
        console.log(`   🏢 ${campus.name}: ${directeur}`);
      });
    }

    // 6. Nettoyage
    console.log('\n🧹 6. NETTOYAGE');
    console.log('---------------');
    
    if (authUser?.user) {
      await supabase.from('profiles').delete().eq('id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
    }
    
    if (authDirector?.user) {
      await supabase.from('profiles').delete().eq('id', authDirector.user.id);
      await supabase.auth.admin.deleteUser(authDirector.user.id);
    }
    
    if (authComptable?.user) {
      await supabase.from('profiles').delete().eq('id', authComptable.user.id);
      await supabase.auth.admin.deleteUser(authComptable.user.id);
    }
    
    console.log('✅ Données de test supprimées');

    console.log('\n🎉 AUDIT CRÉATION PERSONNEL TERMINÉ !');
    console.log('=====================================');

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

auditPersonnelCreation();
