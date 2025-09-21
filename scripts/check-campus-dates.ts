import { createClient } from '@supabase/supabase-js';

// Configuration directe pour les scripts Node.js
const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkCampusDates() {
  console.log('🏫 VÉRIFICATION DES DATES CAMPUS');
  console.log('================================');

  try {
    // 1. Récupérer les campus avec la fonction RPC
    console.log(`\n📋 1. TEST FONCTION RPC GET_CAMPUS_WITH_DIRECTORS`);
    console.log('---------------------------------------------------');
    
    const { data: campusRPC, error: rpcError } = await supabaseAdmin
      .rpc('get_campus_with_directors');

    if (rpcError) {
      console.error(`❌ Erreur RPC campus:`, rpcError.message);
      return;
    }

    console.log(`✅ ${campusRPC.length} campus récupérés via RPC`);
    
    // Vérifier la structure des données
    const firstCampus = campusRPC[0];
    console.log(`\n📋 2. STRUCTURE DES DONNÉES RPC`);
    console.log('--------------------------------');
    console.log(`✅ Champs disponibles:`);
    console.log(`   - id: ${firstCampus.id}`);
    console.log(`   - name: ${firstCampus.name}`);
    console.log(`   - address: ${firstCampus.address}`);
    console.log(`   - directeur_id: ${firstCampus.directeur_id || 'null'}`);
    console.log(`   - directeur_name: ${firstCampus.directeur_name || 'null'}`);
    console.log(`   - directeur_email: ${firstCampus.directeur_email || 'null'}`);
    console.log(`   - professeurs_count: ${firstCampus.professeurs_count}`);
    console.log(`   - total_factures: ${firstCampus.total_factures}`);

    // 2. Récupérer les campus directement de la table
    console.log(`\n📋 3. TEST TABLE CAMPUS DIRECTE`);
    console.log('---------------------------------');
    
    const { data: campusDirect, error: directError } = await supabaseAdmin
      .from('campus')
      .select('*')
      .order('name');

    if (directError) {
      console.error(`❌ Erreur récupération directe campus:`, directError.message);
      return;
    }

    console.log(`✅ ${campusDirect.length} campus récupérés directement`);
    
    // Vérifier les dates
    console.log(`\n📋 4. VÉRIFICATION DES DATES`);
    console.log('-----------------------------');
    
    campusDirect.forEach((campus, index) => {
      console.log(`${index + 1}. ${campus.name}`);
      console.log(`   - created_at: ${campus.created_at}`);
      console.log(`   - updated_at: ${campus.updated_at}`);
      
      // Tester si les dates sont valides
      if (campus.created_at) {
        const createdDate = new Date(campus.created_at);
        const isValidCreated = !isNaN(createdDate.getTime());
        console.log(`   - created_at valide: ${isValidCreated}`);
      } else {
        console.log(`   - created_at: NULL`);
      }
      
      if (campus.updated_at) {
        const updatedDate = new Date(campus.updated_at);
        const isValidUpdated = !isNaN(updatedDate.getTime());
        console.log(`   - updated_at valide: ${isValidUpdated}`);
      } else {
        console.log(`   - updated_at: NULL`);
      }
    });

    // 3. Corriger les dates invalides si nécessaire
    console.log(`\n📋 5. CORRECTION DES DATES INVALIDES`);
    console.log('------------------------------------');
    
    const now = new Date().toISOString();
    let correctedCount = 0;
    
    for (const campus of campusDirect) {
      let needsUpdate = false;
      const updateData: any = {};
      
      if (!campus.created_at || isNaN(new Date(campus.created_at).getTime())) {
        updateData.created_at = now;
        needsUpdate = true;
        console.log(`   - ${campus.name}: Correction created_at`);
      }
      
      if (!campus.updated_at || isNaN(new Date(campus.updated_at).getTime())) {
        updateData.updated_at = now;
        needsUpdate = true;
        console.log(`   - ${campus.name}: Correction updated_at`);
      }
      
      if (needsUpdate) {
        const { error: updateError } = await supabaseAdmin
          .from('campus')
          .update(updateData)
          .eq('id', campus.id);
          
        if (updateError) {
          console.error(`❌ Erreur mise à jour ${campus.name}:`, updateError.message);
        } else {
          console.log(`✅ ${campus.name}: Dates corrigées`);
          correctedCount++;
        }
      }
    }
    
    if (correctedCount === 0) {
      console.log(`✅ Toutes les dates sont valides`);
    } else {
      console.log(`✅ ${correctedCount} campus corrigés`);
    }

    console.log(`\n🎉 VÉRIFICATION TERMINÉE !`);
    console.log('==========================');
    console.log(`✅ Campus RPC: ${campusRPC.length} récupérés`);
    console.log(`✅ Campus direct: ${campusDirect.length} récupérés`);
    console.log(`✅ Dates corrigées: ${correctedCount}`);
    console.log(`✅ CampusPage devrait maintenant fonctionner`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkCampusDates();
