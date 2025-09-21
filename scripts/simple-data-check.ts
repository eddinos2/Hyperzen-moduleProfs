import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleDataCheck() {
  console.log('🔍 Vérification simple des données');
  console.log('=====================================\n');

  try {
    // 1. Test des profiles
    console.log('1️⃣ Profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, campus_id, created_at')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Erreur profiles:', profilesError.message);
    } else {
      console.log(`✅ ${profiles?.length || 0} profiles trouvés (limité à 5)`);
      profiles?.forEach(profile => {
        console.log(`   - ${profile.first_name} ${profile.last_name} (${profile.role})`);
      });
    }
    
    // 2. Test des campus
    console.log('\n2️⃣ Campus...');
    const { data: campuses, error: campusesError } = await supabase
      .from('campus')
      .select('id, name, created_at')
      .limit(5);
    
    if (campusesError) {
      console.log('❌ Erreur campus:', campusesError.message);
    } else {
      console.log(`✅ ${campuses?.length || 0} campus trouvés (limité à 5)`);
      campuses?.forEach(campus => {
        console.log(`   - ${campus.name}`);
      });
    }
    
    // 3. Test des factures
    console.log('\n3️⃣ Factures...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, status, created_at, campus_id, total_amount, enseignant_id')
      .limit(5);
    
    if (invoicesError) {
      console.log('❌ Erreur invoices:', invoicesError.message);
    } else {
      console.log(`✅ ${invoices?.length || 0} factures trouvées (limité à 5)`);
      invoices?.forEach(invoice => {
        console.log(`   - Facture ${invoice.id} (${invoice.status}) - ${invoice.total_amount}€`);
      });
    }
    
    // 4. Test des lignes de facture
    console.log('\n4️⃣ Lignes de facture...');
    const { data: invoiceLines, error: invoiceLinesError } = await supabase
      .from('invoice_lines')
      .select('id, invoice_id, quantite_heures, date_cours, campus_id')
      .limit(5);
    
    if (invoiceLinesError) {
      console.log('❌ Erreur invoice_lines:', invoiceLinesError.message);
    } else {
      console.log(`✅ ${invoiceLines?.length || 0} lignes de facture trouvées (limité à 5)`);
      invoiceLines?.forEach(line => {
        console.log(`   - Ligne ${line.id} - ${line.quantite_heures}h`);
      });
    }
    
    console.log('\n🎉 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

simpleDataCheck();
