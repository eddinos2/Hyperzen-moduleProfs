import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

async function checkDataAdmin() {
  console.log('🔍 Vérification des données avec service role');
  console.log('=============================================\n');

  try {
    // 1. Campus avec service role
    console.log('1️⃣ Campus (service role)...');
    const { data: campuses, error: campusesError } = await supabaseAdmin
      .from('campus')
      .select('id, name, directeur_id');
    
    if (campusesError) {
      console.log('❌ Erreur campus:', campusesError.message);
    } else {
      console.log(`✅ ${campuses?.length || 0} campus trouvés`);
      campuses?.forEach(campus => {
        console.log(`   - ${campus.name} (directeur: ${campus.directeur_id ? 'OUI' : 'NON'})`);
      });
    }
    
    // 2. Factures avec service role
    console.log('\n2️⃣ Factures (service role)...');
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id, status, total_amount, enseignant_id, campus_id');
    
    if (invoicesError) {
      console.log('❌ Erreur invoices:', invoicesError.message);
    } else {
      console.log(`✅ ${invoices?.length || 0} factures trouvées`);
      invoices?.forEach(invoice => {
        console.log(`   - Facture ${invoice.id.substring(0, 8)}... (${invoice.status}) - ${invoice.total_amount}€`);
      });
    }

    // 3. Lignes de facture avec service role
    console.log('\n3️⃣ Lignes de facture (service role)...');
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('invoice_lines')
      .select('id, invoice_id, intitule, quantite_heures, prix_unitaire, total_ttc')
      .limit(10);
    
    if (linesError) {
      console.log('❌ Erreur invoice_lines:', linesError.message);
    } else {
      console.log(`✅ ${lines?.length || 0} lignes de facture trouvées (limité à 10)`);
      lines?.forEach(line => {
        console.log(`   - ${line.intitule} (${line.quantite_heures}h) - ${line.total_ttc}€`);
      });
    }

    // 4. Profiles avec service role
    console.log('\n4️⃣ Profiles (service role)...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, campus_id');
    
    if (profilesError) {
      console.log('❌ Erreur profiles:', profilesError.message);
    } else {
      console.log(`✅ ${profiles?.length || 0} profiles trouvés`);
      const roleCounts = profiles?.reduce((acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('   Répartition par rôle:', roleCounts);
    }

    console.log('\n🎉 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkDataAdmin();
