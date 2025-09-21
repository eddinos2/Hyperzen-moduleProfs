import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Vérification de la structure des tables');
  console.log('==========================================\n');

  try {
    // 1. Test des colonnes de invoice_lines
    console.log('1️⃣ Structure de invoice_lines...');
    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select('*')
      .limit(1);
    
    if (linesError) {
      console.log('❌ Erreur invoice_lines:', linesError.message);
    } else {
      console.log('✅ Colonnes disponibles dans invoice_lines:');
      if (lines && lines.length > 0) {
        Object.keys(lines[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
      } else {
        console.log('   (Aucune donnée pour analyser la structure)');
      }
    }

    // 2. Test des colonnes de invoices
    console.log('\n2️⃣ Structure de invoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (invoicesError) {
      console.log('❌ Erreur invoices:', invoicesError.message);
    } else {
      console.log('✅ Colonnes disponibles dans invoices:');
      if (invoices && invoices.length > 0) {
        Object.keys(invoices[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
      } else {
        console.log('   (Aucune donnée pour analyser la structure)');
      }
    }

    // 3. Test des colonnes de profiles
    console.log('\n3️⃣ Structure de profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Erreur profiles:', profilesError.message);
    } else {
      console.log('✅ Colonnes disponibles dans profiles:');
      if (profiles && profiles.length > 0) {
        Object.keys(profiles[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
      } else {
        console.log('   (Aucune donnée pour analyser la structure)');
      }
    }

    // 4. Test des colonnes de campus
    console.log('\n4️⃣ Structure de campus...');
    const { data: campuses, error: campusesError } = await supabase
      .from('campus')
      .select('*')
      .limit(1);
    
    if (campusesError) {
      console.log('❌ Erreur campus:', campusesError.message);
    } else {
      console.log('✅ Colonnes disponibles dans campus:');
      if (campuses && campuses.length > 0) {
        Object.keys(campuses[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
      } else {
        console.log('   (Aucune donnée pour analyser la structure)');
      }
    }

    console.log('\n🎉 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTableStructure();
