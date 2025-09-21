import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyJauresDirector() {
  console.log('🔍 VÉRIFICATION DIRECTEUR JAURÈS');
  console.log('=================================\n');

  try {
    // 1. Vérifier le campus Jaurès
    console.log('📋 1. VÉRIFICATION CAMPUS JAURÈS');
    console.log('---------------------------------');
    
    const { data: jauresCampus, error: campusError } = await supabase
      .from('campus')
      .select('*')
      .eq('name', 'Jaurès')
      .single();
    
    if (campusError) {
      console.log('❌ Erreur campus Jaurès:', campusError.message);
      return;
    }
    
    console.log('✅ Campus Jaurès trouvé:', jauresCampus.name);
    console.log('📍 Adresse:', jauresCampus.address);
    console.log('👤 Directeur actuel:', jauresCampus.directeur_id || 'Aucun');

    // 2. Vérifier les directeurs assignés à Jaurès
    console.log('\n📋 2. VÉRIFICATION DIRECTEURS JAURÈS');
    console.log('------------------------------------');
    
    const { data: jauresDirectors, error: directorsError } = await supabase
      .from('profiles')
      .select(`
        *,
        campus:campus_id(name)
      `)
      .eq('role', 'DIRECTEUR_CAMPUS')
      .eq('campus_id', jauresCampus.id);
    
    if (directorsError) {
      console.log('❌ Erreur directeurs:', directorsError.message);
    } else {
      console.log(`✅ Directeurs Jaurès: ${jauresDirectors?.length || 0} trouvés`);
      jauresDirectors?.forEach(director => {
        console.log(`   👤 ${director.first_name} ${director.last_name} (${director.email})`);
      });
    }

    // 3. Vérifier tous les campus et leurs directeurs
    console.log('\n📋 3. VÉRIFICATION TOUS LES CAMPUS');
    console.log('----------------------------------');
    
    const { data: allCampus, error: allCampusError } = await supabase
      .from('campus')
      .select(`
        *,
        profiles:directeur_id(first_name, last_name, email)
      `)
      .order('name');
    
    if (allCampusError) {
      console.log('❌ Erreur tous campus:', allCampusError.message);
    } else {
      console.log('🏢 État des campus:');
      allCampus?.forEach(campus => {
        const directeur = campus.profiles ? 
          `${campus.profiles.first_name} ${campus.profiles.last_name}` : 
          'Aucun';
        const status = campus.profiles ? '✅' : '❌';
        console.log(`   ${status} ${campus.name}: ${directeur}`);
      });
    }

    // 4. Statistiques générales
    console.log('\n📋 4. STATISTIQUES GÉNÉRALES');
    console.log('----------------------------');
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('role, campus_id')
      .not('role', 'is', null);
    
    if (allProfiles) {
      const stats = allProfiles.reduce((acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('👥 Répartition des rôles:');
      Object.entries(stats).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });
    }

    console.log('\n🎯 RÉSULTAT');
    console.log('============');
    
    if (jauresCampus.directeur_id) {
      console.log('✅ Jaurès a un directeur assigné !');
    } else {
      console.log('❌ Jaurès n\'a pas de directeur assigné');
      console.log('💡 Utilisez l\'interface pour créer et assigner un directeur');
    }

  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

verifyJauresDirector();
