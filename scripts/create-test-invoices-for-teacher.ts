import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

async function createTestInvoicesForTeacher() {
  console.log('📝 Création de factures de test pour le professeur Martin');
  console.log('=======================================================\n');

  try {
    // 1. Récupérer le professeur Martin
    console.log('1️⃣ Récupération du professeur Martin...');
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, campus_id')
      .eq('email', 'prof.martin1@aurlom.com')
      .single();

    if (teacherError) {
      console.log('❌ Erreur récupération professeur:', teacherError.message);
      return;
    }

    console.log('✅ Professeur récupéré:');
    console.log(`   Nom: ${teacher.first_name} ${teacher.last_name}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Campus ID: ${teacher.campus_id}`);

    // 2. Récupérer le campus
    const { data: campus, error: campusError } = await supabaseAdmin
      .from('campus')
      .select('id, name')
      .eq('id', teacher.campus_id)
      .single();

    if (campusError) {
      console.log('❌ Erreur récupération campus:', campusError.message);
      return;
    }

    console.log(`✅ Campus: ${campus.name}`);

    // 3. Créer des factures de test
    console.log('\n2️⃣ Création des factures de test...');
    
    const testInvoices = [
      {
        enseignant_id: teacher.id,
        campus_id: teacher.campus_id,
        month_year: '2026-02',
        status: 'submitted',
        total_amount: 360,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        enseignant_id: teacher.id,
        campus_id: teacher.campus_id,
        month_year: '2026-02',
        status: 'prevalidated',
        total_amount: 240,
        created_at: new Date(Date.now() - 86400000).toISOString(), // Hier
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        enseignant_id: teacher.id,
        campus_id: teacher.campus_id,
        month_year: '2026-01',
        status: 'paid',
        total_amount: 480,
        created_at: new Date(Date.now() - 172800000).toISOString(), // Il y a 2 jours
        updated_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    const createdInvoices = [];
    
    for (const invoice of testInvoices) {
      const { data: createdInvoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert(invoice)
        .select()
        .single();

      if (invoiceError) {
        console.log(`❌ Erreur création facture:`, invoiceError.message);
      } else {
        console.log(`✅ Facture créée: ${createdInvoice.month_year} - ${createdInvoice.total_amount}€ (${createdInvoice.status})`);
        createdInvoices.push(createdInvoice);
      }
    }

    // 4. Créer des lignes de facture pour chaque facture
    console.log('\n3️⃣ Création des lignes de facture...');
    
    for (const invoice of createdInvoices) {
      const invoiceLines = [
        {
          invoice_id: invoice.id,
          campus_id: teacher.campus_id,
          intitule: 'Cours de mathématiques',
          quantite_heures: 3,
          prix_unitaire: 60,
          date_cours: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          invoice_id: invoice.id,
          campus_id: teacher.campus_id,
          intitule: 'Cours de français',
          quantite_heures: 2,
          prix_unitaire: 60,
          date_cours: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date().toISOString()
        }
      ];

      for (const line of invoiceLines) {
        const { error: lineError } = await supabaseAdmin
          .from('invoice_lines')
          .insert(line);

        if (lineError) {
          console.log(`❌ Erreur création ligne:`, lineError.message);
        } else {
          console.log(`✅ Ligne créée: ${line.intitule} - ${line.quantite_heures}h - ${line.prix_unitaire}€`);
        }
      }
    }

    // 5. Vérifier les factures créées
    console.log('\n4️⃣ Vérification des factures créées...');
    const { data: finalInvoices, error: finalError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        profiles:enseignant_id(first_name, last_name),
        campus:campus_id(name)
      `)
      .eq('enseignant_id', teacher.id);

    if (finalError) {
      console.log('❌ Erreur récupération factures finales:', finalError.message);
    } else {
      console.log(`✅ Factures finales: ${finalInvoices?.length || 0}`);
      finalInvoices?.forEach((invoice, index) => {
        console.log(`   ${index + 1}. ${invoice.month_year} - ${invoice.total_amount}€ (${invoice.status}) - ${invoice.campus?.name}`);
      });
    }

    // 6. Calculer les nouvelles statistiques
    console.log('\n5️⃣ Nouvelles statistiques...');
    const currentMonth = '2026-02';
    const currentMonthInvoices = finalInvoices?.filter(i => i.month_year === currentMonth) || [];
    
    const stats = {
      totalInvoices: finalInvoices?.length || 0,
      currentMonthInvoices: currentMonthInvoices.length,
      totalAmount: finalInvoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
      currentMonthAmount: currentMonthInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      paidAmount: finalInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
    };

    console.log('📊 Statistiques mises à jour:');
    console.log(`   Total factures: ${stats.totalInvoices}`);
    console.log(`   Factures ce mois: ${stats.currentMonthInvoices}`);
    console.log(`   Montant total: ${stats.totalAmount.toFixed(2)}€`);
    console.log(`   Montant ce mois: ${stats.currentMonthAmount.toFixed(2)}€`);
    console.log(`   Montant payé: ${stats.paidAmount.toFixed(2)}€`);

    const totalHours = stats.totalAmount / 60;
    const currentMonthHours = stats.currentMonthAmount / 60;
    
    console.log(`   Heures totales: ${totalHours.toFixed(1)}h`);
    console.log(`   Heures ce mois: ${currentMonthHours.toFixed(1)}h`);

    console.log('\n🎉 Factures de test créées avec succès !');
    console.log('Le professeur Martin devrait maintenant voir:');
    console.log('✅ 3 factures dans son dashboard');
    console.log('✅ Des statistiques avec des montants');
    console.log('✅ Des heures calculées');
    console.log('✅ Des factures récentes');

    console.log('\n📋 Test du dashboard:');
    console.log('1. Connectez-vous avec: prof.martin1@aurlom.com / password123');
    console.log('2. Allez sur le dashboard');
    console.log('3. Vérifiez que vous voyez maintenant des données');
    console.log('4. Testez l\'import CSV pour ajouter d\'autres factures');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createTestInvoicesForTeacher();
