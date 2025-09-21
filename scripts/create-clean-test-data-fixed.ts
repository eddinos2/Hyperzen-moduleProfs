import { createClient } from '@supabase/supabase-js';

// Clés Supabase local Docker
const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0MjYyNDQwMDA5MiwiZXhwIjoxNzk5Mzg0NDAwMDkyfQ.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

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

// Professeurs avec assignations campus
const professeursData = [
  // Campus Roquette
  { name: 'Professeur Martin', email: 'prof.martin@aurlom.com', campus: 'Roquette' },
  { name: 'Professeur David', email: 'prof.david@aurlom.com', campus: 'Roquette' },
  { name: 'Professeur Lefebvre', email: 'prof.lefebvre@aurlom.com', campus: 'Roquette' },
  
  // Campus Picpus
  { name: 'Professeur Dubois', email: 'prof.dubois@aurlom.com', campus: 'Picpus' },
  { name: 'Professeur Moreau', email: 'prof.moreau@aurlom.com', campus: 'Picpus' },
  
  // Campus Sentier
  { name: 'Professeur Bernard', email: 'prof.bernard@aurlom.com', campus: 'Sentier' },
  { name: 'Professeur Petit', email: 'prof.petit@aurlom.com', campus: 'Sentier' },
  
  // Campus Douai
  { name: 'Professeur Robert', email: 'prof.robert@aurlom.com', campus: 'Douai' },
  { name: 'Professeur Richard', email: 'prof.richard@aurlom.com', campus: 'Douai' },
  
  // Campus Saint-Sébastien
  { name: 'Professeur Durand', email: 'prof.durand@aurlom.com', campus: 'Saint-Sébastien' },
  
  // Campus Jaurès
  { name: 'Professeur Leroy', email: 'prof.leroy@aurlom.com', campus: 'Jaurès' },
  { name: 'Professeur Moreau2', email: 'prof.moreau2@aurlom.com', campus: 'Jaurès' },
  
  // Campus Parmentier
  { name: 'Professeur Simon', email: 'prof.simon@aurlom.com', campus: 'Parmentier' },
  
  // Campus Boulogne
  { name: 'Professeur Michel', email: 'prof.michel@aurlom.com', campus: 'Boulogne' },
  { name: 'Professeur Laurent', email: 'prof.laurent@aurlom.com', campus: 'Boulogne' }
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

      console.log(`✅ ${prof.name} créé et assigné à ${prof.campus}`);

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
    .select('id, first_name, last_name, campus_id')
    .eq('role', 'ENSEIGNANT');

  if (profError || !professors) {
    console.error('❌ Erreur récupération professeurs:', profError);
    return;
  }

  console.log(`📊 ${professors.length} professeurs trouvés`);

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
        
        const filiere = ['Informatique', 'Gestion', 'Commerce', 'Marketing', 'Communication'][Math.floor(Math.random() * 5)];
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
    
    const { data: profileStats } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .not('role', 'is', null);
    
    const { data: invoiceStats } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .not('status', 'is', null);
    
    console.log('Profiles créés:', profileStats?.length || 0);
    console.log('Factures créées:', invoiceStats?.length || 0);
    
    console.log('\n✅ Données de test créées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

main();
