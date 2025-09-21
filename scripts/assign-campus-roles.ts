#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:30001';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignDirectorsToCampus() {
  console.log('🏢 ASSIGNATION DES DIRECTEURS AUX CAMPUS');
  console.log('==========================================\n');

  try {
    // Récupérer tous les campus
    const { data: campuses, error: campusError } = await supabase
      .from('campus')
      .select('id, name')
      .order('name');

    if (campusError) throw campusError;
    console.log(`✅ ${campuses.length} campus récupérés`);

    // Récupérer tous les directeurs
    const { data: directors, error: directorError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('role', 'DIRECTEUR_CAMPUS')
      .order('email');

    if (directorError) throw directorError;
    console.log(`✅ ${directors.length} directeurs récupérés\n`);

    // Assigner chaque directeur à son campus correspondant
    for (let i = 0; i < Math.min(campuses.length, directors.length); i++) {
      const campus = campuses[i];
      const director = directors[i];

      const { error: updateError } = await supabase
        .from('campus')
        .update({ directeur_id: director.id })
        .eq('id', campus.id);

      if (updateError) {
        console.log(`❌ Erreur assignation ${campus.name}: ${updateError.message}`);
      } else {
        console.log(`✅ ${director.first_name} ${director.last_name} assigné à ${campus.name}`);
      }
    }

    console.log('\n📋 VÉRIFICATION FINALE');
    console.log('------------------------');
    
    const { data: finalCampuses, error: finalError } = await supabase
      .from('campus')
      .select(`
        id, name, directeur_id,
        profiles!directeur_id (first_name, last_name, email)
      `)
      .order('name');

    if (finalError) throw finalError;

    finalCampuses.forEach(campus => {
      const director = campus.profiles;
      if (director) {
        console.log(`✅ ${campus.name}: ${director.first_name} ${director.last_name} (${director.email})`);
      } else {
        console.log(`❌ ${campus.name}: Aucun directeur assigné`);
      }
    });

    console.log('\n🎉 ASSIGNATION TERMINÉE !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

assignDirectorsToCampus();
