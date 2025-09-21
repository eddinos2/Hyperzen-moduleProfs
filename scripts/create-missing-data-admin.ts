import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMissingDataAdmin() {
  console.log('🔧 Création des données manquantes (Admin)');
  console.log('==========================================\n');

  try {
    // 1. Créer les campus avec le service role
    console.log('1️⃣ Création des campus...');
    const campuses = [
      { name: 'Roquette', address: '48 rue de la Roquette, 75011 Paris' },
      { name: 'Picpus', address: '35 avenue de Picpus, 75012 Paris' },
      { name: 'Sentier', address: '12 rue du Sentier, 75002 Paris' },
      { name: 'Douai', address: '8 rue de Douai, 75009 Paris' },
      { name: 'Saint-Sébastien', address: '25 rue Saint-Sébastien, 75011 Paris' },
      { name: 'Jaurès', address: '15 place de Jaurès, 75019 Paris' },
      { name: 'Parmentier', address: '42 rue Parmentier, 75011 Paris' },
      { name: 'Boulogne', address: '18 avenue de Boulogne, 92100 Boulogne-Billancourt' }
    ];

    const createdCampuses = [];
    for (const campus of campuses) {
      const { data, error } = await supabaseAdmin
        .from('campus')
        .insert(campus)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erreur création campus ${campus.name}:`, error.message);
      } else {
        console.log(`✅ Campus ${campus.name} créé`);
        createdCampuses.push(data);
      }
    }

    console.log(`✅ ${createdCampuses.length} campus créés`);

    // 2. Assigner les directeurs aux campus
    console.log('\n2️⃣ Assignment des directeurs aux campus...');
    const { data: directors, error: directorsError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'DIRECTEUR_CAMPUS');
    
    if (directorsError) {
      console.log('❌ Erreur récupération directeurs:', directorsError.message);
      return;
    }

    console.log(`✅ ${directors?.length || 0} directeurs trouvés`);

    // Assigner chaque directeur à un campus
    if (directors && createdCampuses.length > 0) {
      for (let i = 0; i < Math.min(directors.length, createdCampuses.length); i++) {
        const director = directors[i];
        const campus = createdCampuses[i];
        
        const { error } = await supabaseAdmin
          .from('campus')
          .update({ directeur_id: director.id })
          .eq('id', campus.id);
        
        if (error) {
          console.log(`❌ Erreur assignment ${director.first_name} → ${campus.name}:`, error.message);
        } else {
          console.log(`✅ ${director.first_name} assigné à ${campus.name}`);
        }
      }
    }

    // 3. Créer des factures de test
    console.log('\n3️⃣ Création de factures de test...');
    const { data: professors, error: professorsError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, campus_id')
      .eq('role', 'ENSEIGNANT');
    
    if (professorsError) {
      console.log('❌ Erreur récupération professeurs:', professorsError.message);
      return;
    }

    console.log(`✅ ${professors?.length || 0} professeurs trouvés`);

    if (professors && createdCampuses.length > 0) {
      // Créer quelques factures pour chaque professeur
      for (const professor of professors.slice(0, 5)) { // Limiter à 5 professeurs
        const campus = createdCampuses[Math.floor(Math.random() * createdCampuses.length)];
        
        const invoice = {
          enseignant_id: professor.id,
          campus_id: campus.id,
          status: Math.random() > 0.5 ? 'submitted' : 'prevalidated',
          total_amount: Math.floor(Math.random() * 1000) + 500,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { data: createdInvoice, error: invoiceError } = await supabaseAdmin
          .from('invoices')
          .insert(invoice)
          .select()
          .single();
        
        if (invoiceError) {
          console.log(`❌ Erreur création facture pour ${professor.first_name}:`, invoiceError.message);
        } else {
          console.log(`✅ Facture créée pour ${professor.first_name} - ${invoice.total_amount}€`);
          
          // Créer des lignes de facture
          const lines = [
            {
              invoice_id: createdInvoice.id,
              campus_id: campus.id,
              intitule: 'Cours de mathématiques',
              quantite_heures: 2,
              prix_unitaire: 50,
              total_ttc: 100,
              date_cours: new Date().toISOString().split('T')[0]
            },
            {
              invoice_id: createdInvoice.id,
              campus_id: campus.id,
              intitule: 'Cours de physique',
              quantite_heures: 3,
              prix_unitaire: 60,
              total_ttc: 180,
              date_cours: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          ];

          for (const line of lines) {
            const { error: lineError } = await supabaseAdmin
              .from('invoice_lines')
              .insert(line);
            
            if (lineError) {
              console.log(`❌ Erreur création ligne pour ${professor.first_name}:`, lineError.message);
            } else {
              console.log(`   ✅ Ligne créée: ${line.intitule} (${line.quantite_heures}h)`);
            }
          }
        }
      }
    }

    console.log('\n🎉 Données manquantes créées avec succès !');
    
    // 5. Vérification finale
    console.log('\n📊 Vérification finale...');
    const { data: finalCampuses } = await supabase.from('campus').select('id, name, directeur_id');
    const { data: finalInvoices } = await supabase.from('invoices').select('id, status, total_amount');
    const { data: finalLines } = await supabase.from('invoice_lines').select('id, quantite_heures');
    
    console.log(`✅ Campus: ${finalCampuses?.length || 0}`);
    console.log(`✅ Factures: ${finalInvoices?.length || 0}`);
    console.log(`✅ Lignes de facture: ${finalLines?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createMissingDataAdmin();
