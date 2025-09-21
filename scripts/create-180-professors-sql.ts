import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

// Pour Docker local, utiliser la clé service_role locale
const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0MjYyNDQwMDA5MiwiZXhwIjoxNzk5Mzg0NDAwMDkyfQ.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Noms français réalistes pour les professeurs
const firstNames = [
  'Jean', 'Marie', 'Pierre', 'Michel', 'Alain', 'Philippe', 'André', 'Jacques', 'Daniel', 'Bernard',
  'Claude', 'François', 'Marcel', 'Robert', 'Henri', 'Roger', 'Paul', 'Louis', 'Jean-Pierre', 'Jean-Paul',
  'Jean-Claude', 'Jean-Louis', 'Jean-Marc', 'Jean-François', 'Jean-Philippe', 'Jean-Christophe', 'Jean-Luc', 'Jean-Yves',
  'Anne', 'Sylvie', 'Nathalie', 'Isabelle', 'Martine', 'Christine', 'Françoise', 'Monique', 'Catherine', 'Nicole',
  'Chantal', 'Brigitte', 'Danielle', 'Jacqueline', 'Suzanne', 'Hélène', 'Claire', 'Véronique', 'Patricia', 'Dominique'
];

const lastNames = [
  'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent',
  'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard',
  'André', 'Lefèvre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier',
  'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin', 'Morin',
  'Mathieu', 'Clement', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine', 'Chevalier', 'Robin', 'Masson', 'Sanchez'
];

// Campus disponibles
const campusIds = [
  '0f65143e-6f1a-4824-b5bc-465213219360', // Roquette
  '5d4422f4-0eb0-43f0-8051-0bde6de43398', // Picpus
  'c0f0bc7b-19d5-4f73-b986-9fd1e7ea120c', // Sentier
  '2fbfaff1-3f6c-4ffe-8137-863545be000f', // Douai
  '3d3e4453-e980-488f-8b3b-1844c4e172bf', // Saint-Sébastien
  '3c9ef881-6f2f-49ff-a87a-fb05594a56e4', // Jaurès
  '1642e4c1-218c-4b88-8646-bc729096cd66', // Parmentier
  'c828c921-68fd-42eb-9d85-dfb5ffa4e618'  // Boulogne
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomEmail(firstName: string, lastName: string, index: number): string {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `prof.${cleanFirstName}.${cleanLastName}.${index}@aurlom.com`;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createProfessors() {
  console.log('🎓 Création de 180 professeurs avec SQL direct...');
  
  const professors = [];
  
  for (let i = 1; i <= 180; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = generateRandomEmail(firstName, lastName, i);
    const campusId = getRandomElement(campusIds);
    
    professors.push({
      id: generateUUID(),
      firstName,
      lastName,
      email,
      campusId,
      password: 'password123'
    });
  }
  
  console.log(`📊 Répartition par campus:`);
  const campusCounts: Record<string, number> = {};
  professors.forEach(prof => {
    campusCounts[prof.campusId] = (campusCounts[prof.campusId] || 0) + 1;
  });
  
  for (const [campusId, count] of Object.entries(campusCounts)) {
    console.log(`  Campus ${campusId}: ${count} professeurs`);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Créer les professeurs par lots de 20
  const batchSize = 20;
  for (let i = 0; i < professors.length; i += batchSize) {
    const batch = professors.slice(i, i + batchSize);
    console.log(`📦 Traitement du lot ${Math.floor(i/batchSize) + 1}/${Math.ceil(professors.length/batchSize)} (${batch.length} professeurs)`);
    
    // Préparer les données pour l'insertion
    const profilesData = batch.map(prof => ({
      id: prof.id,
      email: prof.email,
      first_name: prof.firstName,
      last_name: prof.lastName,
      role: 'ENSEIGNANT',
      campus_id: prof.campusId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    try {
      // Insérer les profils directement
      const { error: profilesError } = await supabase
        .from('profiles')
        .insert(profilesData);

      if (profilesError) {
        console.error(`❌ Erreur insertion profils:`, profilesError.message);
        errorCount += batch.length;
      } else {
        console.log(`✅ ${batch.length} professeurs insérés avec succès`);
        successCount += batch.length;
      }
    } catch (error) {
      console.error(`💥 Exception insertion:`, error);
      errorCount += batch.length;
    }
    
    // Pause entre les lots
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`🎉 Création terminée ! Succès: ${successCount}, Erreurs: ${errorCount}`);
  
  // Vérifier le résultat
  const { data: totalProfs, error: countError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('role', 'ENSEIGNANT');
    
  if (!countError) {
    console.log(`📈 Total professeurs en base: ${totalProfs?.length || 0}`);
  }
  
  // Afficher quelques exemples
  const { data: sampleProfs } = await supabase
    .from('profiles')
    .select('email, first_name, last_name, campus_id')
    .eq('role', 'ENSEIGNANT')
    .limit(5);
    
  if (sampleProfs) {
    console.log('\n📋 Exemples de professeurs créés:');
    sampleProfs.forEach(prof => {
      console.log(`  - ${prof.first_name} ${prof.last_name} (${prof.email})`);
    });
  }
}

// Exécution
createProfessors().catch(console.error);
