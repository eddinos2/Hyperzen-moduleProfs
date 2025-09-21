#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:30001';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPrevalidatedInvoices() {
  console.log('🔧 Création de factures prévalidées pour test...');
  
  try {
    // 1. Récupérer un directeur
    const { data: directeur, error: directeurError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, campus_id')
      .eq('role', 'DIRECTEUR_CAMPUS')
      .not('campus_id', 'is', null)
      .limit(1)
      .single();
    
    if (directeurError) {
      console.log('❌ Erreur récupération directeur:', directeurError.message);
      return;
    }
    
    console.log(`✅ Directeur trouvé: ${directeur.email} (Campus: ${directeur.campus_id})`);
    
    // 2. Récupérer quelques factures en attente du campus du directeur
    const { data: factures, error: facturesError } = await supabaseAdmin
      .from('invoices')
      .select('id, total_amount, month_year, enseignant_id')
      .eq('campus_id', directeur.campus_id)
      .eq('status', 'pending')
      .limit(5);
    
    if (facturesError) {
      console.log('❌ Erreur récupération factures:', facturesError.message);
      return;
    }
    
    console.log(`✅ ${factures.length} factures trouvées pour prévalidation`);
    
    // 3. Prévalider les factures
    for (const facture of factures) {
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'prevalidated',
          prevalidated_by: directeur.id,
          prevalidated_at: new Date().toISOString()
        })
        .eq('id', facture.id);
      
      if (updateError) {
        console.log(`❌ Erreur prévalidation facture ${facture.id}:`, updateError.message);
      } else {
        console.log(`✅ Facture prévalidée: ${facture.month_year} - ${facture.total_amount}€`);
      }
    }
    
    // 4. Vérification finale
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .not('status', 'is', null);
    
    if (statsError) {
      console.log('❌ Erreur récupération stats:', statsError.message);
      return;
    }
    
    const statusCounts = stats.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log('========================');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    console.log('\n🎉 FACTURES PRÉVALIDÉES CRÉÉES !');
    console.log('Le super admin devrait maintenant voir des factures à valider.');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

createPrevalidatedInvoices();
