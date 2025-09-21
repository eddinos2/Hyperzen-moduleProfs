import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:30001';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0MjYyNDQwMDA5MiwiZXhwIjoxNzk5Mzg0NDAwMDkyfQ.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

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

const subjects = [
  'Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie', 'Sciences Physiques', 'Chimie', 'Biologie',
  'Économie', 'Gestion', 'Informatique', 'Électronique', 'Mécanique', 'Électricité', 'Comptabilité', 'Marketing',
  'Communication', 'Droit', 'Management', 'Ressources Humaines', 'Stratégie', 'Finance', 'Audit', 'Contrôle de Gestion',
  'Statistiques', 'Probabilités', 'Algèbre', 'Analyse', 'Géométrie', 'Physique Quantique', 'Thermodynamique',
  'Mécanique des Fluides', 'Résistance des Matériaux', 'Automatique', 'Robotique', 'Intelligence Artificielle',
  'Base de Données', 'Programmation', 'Réseaux', 'Sécurité Informatique', 'Développement Web', 'Design Graphique'
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

async function createProfessors() {
  console.log('🎓 Création de 180 professeurs...');
  
  const professors = [];
  const batchSize = 10; // Réduire la taille des lots
  
  for (let i = 1; i <= 180; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = generateRandomEmail(firstName, lastName, i);
    const campusId = getRandomElement(campusIds);
    const subject = getRandomElement(subjects);
    
    professors.push({
      firstName,
      lastName,
      email,
      campusId,
      subject,
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
  
  // Créer les professeurs par lots
  for (let i = 0; i < professors.length; i += batchSize) {
    const batch = professors.slice(i, i + batchSize);
    console.log(`📦 Traitement du lot ${Math.floor(i/batchSize) + 1}/${Math.ceil(professors.length/batchSize)} (${batch.length} professeurs)`);
    
    for (const prof of batch) {
      try {
        // Créer l'utilisateur avec l'API admin
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: prof.email,
          password: prof.password,
          email_confirm: true
        });

        if (authError) {
          console.error(`❌ Erreur auth ${prof.email}:`, authError.message);
          errorCount++;
          continue;
        }

        if (!authData.user) {
          console.error(`❌ Pas d'utilisateur créé pour ${prof.email}`);
          errorCount++;
          continue;
        }

        // Créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: prof.email,
            first_name: prof.firstName,
            last_name: prof.lastName,
            role: 'ENSEIGNANT',
            campus_id: prof.campusId
          });

        if (profileError) {
          console.error(`❌ Erreur profil ${prof.email}:`, profileError.message);
          errorCount++;
        } else {
          console.log(`✅ Professeur créé: ${prof.firstName} ${prof.lastName} (${prof.email}) - Campus: ${prof.campusId}`);
          successCount++;
        }
      } catch (error) {
        console.error(`💥 Exception création ${prof.email}:`, error);
        errorCount++;
      }
    }
    
    // Pause entre les lots
    await new Promise(resolve => setTimeout(resolve, 200));
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
}

// Exécution
createProfessors().catch(console.error);
