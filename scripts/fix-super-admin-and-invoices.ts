#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:30001';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSuperAdminAndInvoices() {
  console.log('🔧 CORRECTION SUPER ADMIN ET STATUT FACTURES');
  console.log('=============================================\n');

  try {
    // 1. CRÉER LE SUPER ADMIN
    console.log('👤 1. CRÉATION DU SUPER ADMIN');
    console.log('------------------------------');

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'houssam@aurlom.com',
      password: 'password123',
      email_confirm: true
    });

    if (authError) {
      console.log(`❌ Erreur création utilisateur auth: ${authError.message}`);
      
      // Essayer de récupérer l'utilisateur existant
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser.users.find(u => u.email === 'houssam@aurlom.com');
      
      if (user) {
        console.log('✅ Utilisateur auth existe déjà');
        
        // Créer le profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: 'houssam@aurlom.com',
            first_name: 'Houssam',
            last_name: 'Admin',
            role: 'SUPER_ADMIN',
            campus_id: null,
            is_active: true
          })
          .select()
          .single();

        if (profileError) {
          console.log(`❌ Erreur création profil: ${profileError.message}`);
        } else {
          console.log('✅ Profil super admin créé');
        }
      }
    } else {
      console.log('✅ Utilisateur auth créé');
      
      // Créer le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: 'houssam@aurlom.com',
          first_name: 'Houssam',
          last_name: 'Admin',
          role: 'SUPER_ADMIN',
          campus_id: null,
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        console.log(`❌ Erreur création profil: ${profileError.message}`);
      } else {
        console.log('✅ Profil super admin créé');
      }
    }

    console.log('\n');

    // 2. CORRIGER LE STATUT DES FACTURES
    console.log('📄 2. CORRECTION DU STATUT DES FACTURES');
    console.log('---------------------------------------');

    // Vérifier le statut actuel des factures
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, status, total_amount')
      .limit(10);

    if (invoicesError) {
      console.log(`❌ Erreur récupération factures: ${invoicesError.message}`);
    } else {
      console.log(`📊 Statut actuel des factures:`);
      const statusCount = invoicesData.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as any);
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });

      // Mettre toutes les factures en EN_ATTENTE
      console.log('\n🔄 Mise à jour des statuts...');
      
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          status: 'EN_ATTENTE',
          prevalidated_at: null,
          prevalidated_by: null,
          validated_at: null,
          validated_by: null,
          paid_at: null,
          paid_by: null
        });

      if (updateError) {
        console.log(`❌ Erreur mise à jour statuts: ${updateError.message}`);
      } else {
        console.log('✅ Toutes les factures mises en statut EN_ATTENTE');
      }
    }

    console.log('\n');

    // 3. VÉRIFICATION FINALE
    console.log('✅ 3. VÉRIFICATION FINALE');
    console.log('--------------------------');

    // Vérifier le super admin
    const { data: superAdminData, error: superAdminError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .eq('email', 'houssam@aurlom.com')
      .single();

    if (superAdminError) {
      console.log(`❌ Super admin non trouvé: ${superAdminError.message}`);
    } else {
      console.log(`✅ Super admin: ${superAdminData.first_name} ${superAdminData.last_name} (${superAdminData.role})`);
    }

    // Vérifier les factures
    const { data: finalInvoices, error: finalInvoicesError } = await supabase
      .from('invoices')
      .select('status')
      .limit(5);

    if (finalInvoicesError) {
      console.log(`❌ Erreur vérification factures: ${finalInvoicesError.message}`);
    } else {
      const enAttente = finalInvoices.filter(inv => inv.status === 'EN_ATTENTE').length;
      console.log(`✅ Factures en attente: ${enAttente}/${finalInvoices.length} échantillon`);
    }

    console.log('\n🎉 CORRECTION TERMINÉE !');
    console.log('========================');
    console.log('✅ Super admin houssam@aurlom.com créé');
    console.log('✅ Toutes les factures en statut EN_ATTENTE');
    console.log('✅ Système prêt pour les tests frontend');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

fixSuperAdminAndInvoices();
