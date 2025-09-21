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

async function createValidatedInvoices() {
  console.log('🔧 Création de factures validées pour test...');
  
  try {
    // 1. Récupérer le super admin
    const { data: superAdmin, error: superAdminError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('role', 'SUPER_ADMIN')
      .limit(1)
      .single();
    
    if (superAdminError) {
      console.log('❌ Erreur récupération super admin:', superAdminError.message);
      return;
    }
    
    console.log(`✅ Super admin trouvé: ${superAdmin.email}`);
    
    // 2. Récupérer quelques factures prévalidées
    const { data: factures, error: facturesError } = await supabaseAdmin
      .from('invoices')
      .select('id, total_amount, month_year')
      .eq('status', 'prevalidated')
      .limit(3);
    
    if (facturesError) {
      console.log('❌ Erreur récupération factures:', facturesError.message);
      return;
    }
    
    console.log(`✅ ${factures.length} factures prévalidées trouvées`);
    
    // 3. Valider les factures
    for (const facture of factures) {
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'validated',
          validated_by: superAdmin.id,
          validated_at: new Date().toISOString()
        })
        .eq('id', facture.id);
      
      if (updateError) {
        console.log(`❌ Erreur validation facture ${facture.id}:`, updateError.message);
      } else {
        console.log(`✅ Facture validée: ${facture.month_year} - ${facture.total_amount}€`);
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
    
    console.log('\n🎉 FACTURES VALIDÉES CRÉÉES !');
    console.log('Le super admin peut maintenant tester le système de paiement.');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

createValidatedInvoices();
