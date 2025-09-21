import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

async function verifyTeacherInvoicesAdmin() {
  console.log('🔍 Vérification des factures du professeur (avec admin key)');
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
    console.log(`   ID: ${teacher.id}`);
    console.log(`   Nom: ${teacher.first_name} ${teacher.last_name}`);
    console.log(`   Email: ${teacher.email}`);

    // 2. Récupérer TOUTES les factures du professeur (avec admin key)
    console.log('\n2️⃣ Récupération de toutes les factures du professeur...');
    const { data: allInvoices, error: allError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('enseignant_id', teacher.id);

    if (allError) {
      console.log('❌ Erreur récupération factures:', allError.message);
    } else {
      console.log(`✅ Factures trouvées: ${allInvoices?.length || 0}`);
      allInvoices?.forEach((invoice, index) => {
        console.log(`   ${index + 1}. ${invoice.month_year} - ${invoice.total_amount}€ (${invoice.status}) - ${invoice.created_at}`);
      });
    }

    // 3. Récupérer les factures avec les relations (comme le fait useInvoices)
    console.log('\n3️⃣ Récupération avec relations (comme useInvoices)...');
    const { data: invoicesWithRelations, error: relationsError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        profiles:enseignant_id(first_name, last_name, email),
        campus:campus_id(name),
        prevalidated_profile:profiles!invoices_prevalidated_by_fkey(first_name, last_name),
        validated_profile:profiles!invoices_validated_by_fkey(first_name, last_name),
        paid_profile:profiles!invoices_paid_by_fkey(first_name, last_name)
      `)
      .eq('enseignant_id', teacher.id);

    if (relationsError) {
      console.log('❌ Erreur récupération avec relations:', relationsError.message);
    } else {
      console.log(`✅ Factures avec relations: ${invoicesWithRelations?.length || 0}`);
      invoicesWithRelations?.forEach((invoice, index) => {
        console.log(`   ${index + 1}. ${invoice.month_year} - ${invoice.total_amount}€ (${invoice.status}) - ${invoice.campus?.name}`);
      });
    }

    // 4. Calculer les statistiques
    console.log('\n4️⃣ Calcul des statistiques...');
    const currentMonth = '2026-02';
    const currentMonthInvoices = allInvoices?.filter(i => i.month_year === currentMonth) || [];
    
    const stats = {
      totalInvoices: allInvoices?.length || 0,
      currentMonthInvoices: currentMonthInvoices.length,
      totalAmount: allInvoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
      currentMonthAmount: currentMonthInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      paidAmount: allInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
    };

    console.log('📊 Statistiques:');
    console.log(`   Total factures: ${stats.totalInvoices}`);
    console.log(`   Factures ce mois (${currentMonth}): ${stats.currentMonthInvoices}`);
    console.log(`   Montant total: ${stats.totalAmount.toFixed(2)}€`);
    console.log(`   Montant ce mois: ${stats.currentMonthAmount.toFixed(2)}€`);
    console.log(`   Montant payé: ${stats.paidAmount.toFixed(2)}€`);

    const totalHours = stats.totalAmount / 60;
    const currentMonthHours = stats.currentMonthAmount / 60;
    
    console.log(`   Heures totales: ${totalHours.toFixed(1)}h`);
    console.log(`   Heures ce mois: ${currentMonthHours.toFixed(1)}h`);

    // 5. Vérifier les lignes de facture
    console.log('\n5️⃣ Vérification des lignes de facture...');
    const { data: invoiceLines, error: linesError } = await supabaseAdmin
      .from('invoice_lines')
      .select('*')
      .in('invoice_id', allInvoices?.map(i => i.id) || []);

    if (linesError) {
      console.log('❌ Erreur récupération lignes:', linesError.message);
    } else {
      console.log(`✅ Lignes de facture: ${invoiceLines?.length || 0}`);
      invoiceLines?.forEach((line, index) => {
        console.log(`   ${index + 1}. ${line.intitule} - ${line.quantite_heures}h - ${line.prix_unitaire}€`);
      });
    }

    console.log('\n✅ RÉSUMÉ:');
    console.log('Le professeur Martin a:');
    console.log(`✅ ${stats.totalInvoices} factures au total`);
    console.log(`✅ ${stats.currentMonthInvoices} factures ce mois`);
    console.log(`✅ ${stats.totalAmount.toFixed(2)}€ de montant total`);
    console.log(`✅ ${stats.paidAmount.toFixed(2)}€ déjà payés`);
    console.log(`✅ ${totalHours.toFixed(1)}h d'enseignement total`);

    console.log('\n📋 Le dashboard devrait maintenant afficher ces données !');
    console.log('Testez en vous connectant avec: prof.martin1@aurlom.com / password123');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

verifyTeacherInvoicesAdmin();
