import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:30001';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0MjYyNDQwMDA5MiwiZXhwIjoxNzk5Mzg0NDAwMDkyfQ.8gZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8YjZ8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Données des campus avec leurs directeurs
const campusData = [
  { name: 'Roquette', directeur: 'directeur.roquette@aurlom.com', directeurName: 'Directeur Roquette' },
  { name: 'Picpus', directeur: 'directeur.picpus@aurlom.com', directeurName: 'Directeur Picpus' },
  { name: 'Sentier', directeur: 'directeur.sentier@aurlom.com', directeurName: 'Directeur Sentier' },
  { name: 'Douai', directeur: 'directeur.douai@aurlom.com', directeurName: 'Directeur Douai' },
  { name: 'Saint-Sébastien', directeur: 'directeur.saint-sebastien@aurlom.com', directeurName: 'Directeur Saint-Sébastien' },
  { name: 'Jaurès', directeur: 'directeur.jaures@aurlom.com', directeurName: 'Directeur Jaurès' },
  { name: 'Parmentier', directeur: 'directeur.parmentier@aurlom.com', directeurName: 'Directeur Parmentier' },
  { name: 'Boulogne', directeur: 'directeur.boulogne@aurlom.com', directeurName: 'Directeur Boulogne' }
];

// Filières disponibles
const filieres = [
  'Informatique',
  'Gestion',
  'Commerce',
  'Marketing',
  'Communication',
  'Ressources Humaines',
  'Finance',
  'Comptabilité',
  'Droit',
  'Langues'
];

// Professeurs avec assignations campus et filières
const professeursData = [
  // Campus Roquette
  { name: 'Professeur Martin', email: 'prof.martin@aurlom.com', campus: 'Roquette', filieres: ['Informatique', 'Gestion'] },
  { name: 'Professeur David', email: 'prof.david@aurlom.com', campus: 'Roquette', filieres: ['Commerce', 'Marketing'] },
  { name: 'Professeur Lefebvre', email: 'prof.lefebvre@aurlom.com', campus: 'Roquette', filieres: ['Communication', 'Langues'] },
  
  // Campus Picpus
  { name: 'Professeur Dubois', email: 'prof.dubois@aurlom.com', campus: 'Picpus', filieres: ['Finance', 'Comptabilité'] },
  { name: 'Professeur Moreau', email: 'prof.moreau@aurlom.com', campus: 'Picpus', filieres: ['Droit', 'Ressources Humaines'] },
  
  // Campus Sentier
  { name: 'Professeur Bernard', email: 'prof.bernard@aurlom.com', campus: 'Sentier', filieres: ['Informatique', 'Marketing'] },
  { name: 'Professeur Petit', email: 'prof.petit@aurlom.com', campus: 'Sentier', filieres: ['Gestion', 'Commerce'] },
  
  // Campus Douai
  { name: 'Professeur Robert', email: 'prof.robert@aurlom.com', campus: 'Douai', filieres: ['Communication', 'Finance'] },
  { name: 'Professeur Richard', email: 'prof.richard@aurlom.com', campus: 'Douai', filieres: ['Langues', 'Droit'] },
  
  // Campus Saint-Sébastien
  { name: 'Professeur Durand', email: 'prof.durand@aurlom.com', campus: 'Saint-Sébastien', filieres: ['Ressources Humaines', 'Comptabilité'] },
  
  // Campus Jaurès
  { name: 'Professeur Leroy', email: 'prof.leroy@aurlom.com', campus: 'Jaurès', filieres: ['Informatique', 'Gestion'] },
  { name: 'Professeur Moreau', email: 'prof.moreau2@aurlom.com', campus: 'Jaurès', filieres: ['Marketing', 'Commerce'] },
  
  // Campus Parmentier
  { name: 'Professeur Simon', email: 'prof.simon@aurlom.com', campus: 'Parmentier', filieres: ['Communication', 'Langues'] },
  
  // Campus Boulogne
  { name: 'Professeur Michel', email: 'prof.michel@aurlom.com', campus: 'Boulogne', filieres: ['Finance', 'Droit'] },
  { name: 'Professeur Laurent', email: 'prof.laurent@aurlom.com', campus: 'Boulogne', filieres: ['Ressources Humaines', 'Comptabilité'] }
];

async function createDirectors() {
  console.log('🏢 Création des directeurs de campus...');
  
  for (const campus of campusData) {
    try {
      // Créer l'utilisateur auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: campus.directeur,
        password: 'password123',
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Erreur création auth pour ${campus.directeur}:`, authError);
        continue;
      }

      // Créer le profil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: campus.directeur,
          first_name: campus.directeurName.split(' ')[0],
          last_name: campus.directeurName.split(' ')[1],
          role: 'DIRECTEUR_CAMPUS'
        });

      if (profileError) {
        console.error(`❌ Erreur création profil pour ${campus.directeur}:`, profileError);
        continue;
      }

      // Assigner le directeur au campus
      const { error: campusError } = await supabaseAdmin
        .from('campus')
        .update({ directeur_id: authUser.user.id })
        .eq('name', campus.name);

      if (campusError) {
        console.error(`❌ Erreur assignation campus pour ${campus.directeur}:`, campusError);
      } else {
        console.log(`✅ ${campus.directeurName} créé et assigné à ${campus.name}`);
      }

    } catch (error) {
      console.error(`❌ Erreur générale pour ${campus.directeur}:`, error);
    }
  }
}

async function createProfessors() {
  console.log('👨‍🏫 Création des professeurs...');
  
  for (const prof of professeursData) {
    try {
      // Créer l'utilisateur auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: prof.email,
        password: 'password123',
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Erreur création auth pour ${prof.email}:`, authError);
        continue;
      }

      // Récupérer l'ID du campus
      const { data: campus, error: campusError } = await supabaseAdmin
        .from('campus')
        .select('id')
        .eq('name', prof.campus)
        .single();

      if (campusError || !campus) {
        console.error(`❌ Campus ${prof.campus} non trouvé:`, campusError);
        continue;
      }

      // Créer le profil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: prof.email,
          first_name: prof.name.split(' ')[1],
          last_name: prof.name.split(' ')[0],
          role: 'ENSEIGNANT',
          campus_id: campus.id
        });

      if (profileError) {
        console.error(`❌ Erreur création profil pour ${prof.email}:`, profileError);
        continue;
      }

      console.log(`✅ ${prof.name} créé et assigné à ${prof.campus} (filières: ${prof.filieres.join(', ')})`);

    } catch (error) {
      console.error(`❌ Erreur générale pour ${prof.email}:`, error);
    }
  }
}

async function createInvoices() {
  console.log('📄 Création des factures...');
  
  // Récupérer tous les professeurs
  const { data: professors, error: profError } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, campus_id, campus:campus(name)')
    .eq('role', 'ENSEIGNANT');

  if (profError || !professors) {
    console.error('❌ Erreur récupération professeurs:', profError);
    return;
  }

  // Créer des factures pour chaque professeur (2-3 factures par prof)
  for (const prof of professors) {
    const numInvoices = Math.floor(Math.random() * 2) + 2; // 2-3 factures
    
    for (let i = 0; i < numInvoices; i++) {
      const monthYear = `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`;
      const numLines = Math.floor(Math.random() * 3) + 2; // 2-4 lignes par facture
      
      // Créer la facture
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          enseignant_id: prof.id,
          campus_id: prof.campus_id,
          month_year: monthYear,
          total_amount: 0, // Sera calculé
          status: 'pending'
        })
        .select()
        .single();

      if (invoiceError || !invoice) {
        console.error(`❌ Erreur création facture pour ${prof.first_name}:`, invoiceError);
        continue;
      }

      let totalAmount = 0;
      
      // Créer les lignes de facture
      for (let j = 0; j < numLines; j++) {
        const heures = Math.floor(Math.random() * 10) + 5; // 5-14 heures
        const tarif = Math.floor(Math.random() * 20) + 30; // 30-49€/h
        const montant = heures * tarif;
        totalAmount += montant;
        
        const filiere = filieres[Math.floor(Math.random() * filieres.length)];
        const dateCours = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        
        const { error: lineError } = await supabaseAdmin
          .from('invoice_lines')
          .insert({
            invoice_id: invoice.id,
            quantite_heures: heures,
            prix_unitaire: tarif,
            montant: montant,
            date_cours: dateCours.toISOString().split('T')[0],
            campus_id: prof.campus_id,
            intitule: `Cours ${filiere} - ${heures}h`,
            filiere: filiere
          });

        if (lineError) {
          console.error(`❌ Erreur création ligne facture:`, lineError);
        }
      }

      // Mettre à jour le montant total
      await supabaseAdmin
        .from('invoices')
        .update({ total_amount: totalAmount })
        .eq('id', invoice.id);

      // Assigner des statuts différents
      const statuses = ['pending', 'prevalidated', 'validated', 'paid'];
      const weights = [50, 25, 15, 10]; // 50% pending, 25% prevalidated, etc.
      const randomStatus = weightedRandom(statuses, weights);
      
      await supabaseAdmin
        .from('invoices')
        .update({ status: randomStatus })
        .eq('id', invoice.id);

      console.log(`✅ Facture ${invoice.id} créée pour ${prof.first_name} ${prof.last_name} - ${totalAmount}€ (${randomStatus})`);
    }
  }
}

function weightedRandom(items: string[], weights: number[]): string {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

async function main() {
  console.log('🚀 Création de données de test complètes et propres...\n');
  
  try {
    await createDirectors();
    console.log('');
    
    await createProfessors();
    console.log('');
    
    await createInvoices();
    console.log('');
    
    // Vérification finale
    console.log('📊 Vérification finale:');
    
    const { data: stats } = await supabaseAdmin
      .from('profiles')
      .select('role', { count: 'exact' });
    
    const { data: invoiceStats } = await supabaseAdmin
      .from('invoices')
      .select('status', { count: 'exact' });
    
    console.log('Profiles par rôle:', stats);
    console.log('Factures par statut:', invoiceStats);
    
    console.log('\n✅ Données de test créées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

main();
