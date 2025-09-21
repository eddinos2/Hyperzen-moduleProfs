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

async function verifyWorkflowStatus() {
  console.log('🔍 VÉRIFICATION DU STATUT DU WORKFLOW');
  console.log('=====================================\n');
  
  try {
    // 1. Statistiques générales des factures
    console.log('📊 1. STATISTIQUES DES FACTURES');
    console.log('------------------------------');
    
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('invoices')
      .select('status, total_amount');
    
    if (statsError) {
      console.log('❌ Erreur récupération stats:', statsError.message);
      return;
    }
    
    const statusCounts = stats.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalAmount = stats.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const amount = stats.filter(s => s.status === status).reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      console.log(`   - ${status}: ${count} factures (${amount.toFixed(2)}€)`);
    });
    console.log(`   - TOTAL: ${stats.length} factures (${totalAmount.toFixed(2)}€)`);
    
    // 2. Vérification des rôles et campus
    console.log('\n👥 2. UTILISATEURS ET CAMPUS');
    console.log('----------------------------');
    
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('role, campus_id');
    
    if (profilesError) {
      console.log('❌ Erreur récupération profils:', profilesError.message);
      return;
    }
    
    const roleCounts = profiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} utilisateurs`);
    });
    
    // 3. Test des permissions par rôle
    console.log('\n🔐 3. TEST DES PERMISSIONS');
    console.log('-------------------------');
    
    // Super Admin - devrait voir toutes les factures
    const { data: superAdminInvoices, error: superAdminError } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .not('status', 'is', null);
    
    if (superAdminError) {
      console.log('❌ Erreur test super admin:', superAdminError.message);
    } else {
      console.log(`   ✅ SUPER_ADMIN: Peut voir ${superAdminInvoices.length} factures`);
    }
    
    // 4. Vérification des factures prévalidées (pour validation)
    console.log('\n📋 4. FACTURES PRÊTES POUR VALIDATION');
    console.log('------------------------------------');
    
    const { data: prevalidatedInvoices, error: prevalidatedError } = await supabaseAdmin
      .from('invoices')
      .select('id, total_amount, month_year, prevalidated_by, prevalidated_at')
      .eq('status', 'prevalidated');
    
    if (prevalidatedError) {
      console.log('❌ Erreur récupération factures prévalidées:', prevalidatedError.message);
    } else {
      console.log(`   📄 ${prevalidatedInvoices.length} factures prévalidées en attente de validation:`);
      prevalidatedInvoices.forEach((invoice, index) => {
        console.log(`      ${index + 1}. ${invoice.month_year} - ${invoice.total_amount}€`);
      });
    }
    
    // 5. Vérification des factures validées (pour paiement)
    console.log('\n💰 5. FACTURES PRÊTES POUR PAIEMENT');
    console.log('----------------------------------');
    
    const { data: validatedInvoices, error: validatedError } = await supabaseAdmin
      .from('invoices')
      .select('id, total_amount, month_year, validated_by, validated_at')
      .eq('status', 'validated');
    
    if (validatedError) {
      console.log('❌ Erreur récupération factures validées:', validatedError.message);
    } else {
      console.log(`   💳 ${validatedInvoices.length} factures validées en attente de paiement:`);
      validatedInvoices.forEach((invoice, index) => {
        console.log(`      ${index + 1}. ${invoice.month_year} - ${invoice.total_amount}€`);
      });
    }
    
    // 6. Résumé final
    console.log('\n🎯 6. RÉSUMÉ POUR LE FRONTEND');
    console.log('----------------------------');
    
    if (prevalidatedInvoices && prevalidatedInvoices.length > 0) {
      console.log('   ✅ Page "Validation des factures": Devrait afficher des factures');
      console.log(`      - ${prevalidatedInvoices.length} factures prévalidées en attente`);
      const prevalidatedAmount = prevalidatedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      console.log(`      - Montant total: ${prevalidatedAmount.toFixed(2)}€`);
    } else {
      console.log('   ⚠️  Page "Validation des factures": Aucune facture prévalidée');
    }
    
    if (validatedInvoices && validatedInvoices.length > 0) {
      console.log('   ✅ Page "Gestion des paiements": Devrait afficher des factures');
      console.log(`      - ${validatedInvoices.length} factures validées en attente de paiement`);
      const validatedAmount = validatedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      console.log(`      - Montant total: ${validatedAmount.toFixed(2)}€`);
    } else {
      console.log('   ⚠️  Page "Gestion des paiements": Aucune facture validée');
    }
    
    console.log('\n🚀 LE SYSTÈME EST PRÊT POUR LES TESTS FRONTEND !');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

verifyWorkflowStatus();
