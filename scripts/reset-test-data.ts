import { createClient } from '@supabase/supabase-js';

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  console.error('\nVeuillez définir ces variables dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetTestData() {
  console.log('🧹 Nettoyage des données de test...\n');

  try {
    // 1. Supprimer les lignes de factures de test
    console.log('📄 Suppression des lignes de factures...');
    const { error: linesError } = await supabase
      .from('invoice_lines')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer toutes les lignes

    if (linesError) {
      console.error('❌ Erreur suppression lignes:', linesError.message);
    } else {
      console.log('✅ Lignes de factures supprimées');
    }

    // 2. Supprimer les factures de test
    console.log('🧾 Suppression des factures...');
    const { error: invoicesError } = await supabase
      .from('invoices')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer toutes les factures

    if (invoicesError) {
      console.error('❌ Erreur suppression factures:', invoicesError.message);
    } else {
      console.log('✅ Factures supprimées');
    }

    // 3. Supprimer les logs d'audit
    console.log('📋 Suppression des logs d\'audit...');
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (auditError) {
      console.error('❌ Erreur suppression audit:', auditError.message);
    } else {
      console.log('✅ Logs d\'audit supprimés');
    }

    // 4. Réinitialiser les directeurs de campus
    console.log('🏢 Réinitialisation des directeurs de campus...');
    const { error: campusError } = await supabase
      .from('campus')
      .update({ directeur_id: null })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (campusError) {
      console.error('❌ Erreur réinitialisation campus:', campusError.message);
    } else {
      console.log('✅ Directeurs de campus réinitialisés');
    }

    // 5. Supprimer les profils de test (sauf super admin)
    console.log('👥 Suppression des profils de test...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '5dd9163c-5834-436e-9a1d-4009c1636d27'); // Garder le super admin

    if (profilesError) {
      console.error('❌ Erreur suppression profils:', profilesError.message);
    } else {
      console.log('✅ Profils de test supprimés');
    }

    // 6. Supprimer les utilisateurs auth (sauf super admin)
    console.log('🔐 Suppression des utilisateurs auth...');
    
    // Récupérer tous les utilisateurs
    const { data: users, error: getUsersError } = await supabase.auth.admin.listUsers();
    
    if (getUsersError) {
      console.error('❌ Erreur récupération utilisateurs:', getUsersError.message);
    } else {
      for (const user of users.users) {
        if (user.id !== '5dd9163c-5834-436e-9a1d-4009c1636d27') { // Garder le super admin
          const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
          if (deleteUserError) {
            console.error(`❌ Erreur suppression utilisateur ${user.email}:`, deleteUserError.message);
          }
        }
      }
      console.log('✅ Utilisateurs auth supprimés');
    }

    console.log('\n🎉 Nettoyage terminé !');
    console.log('💡 Vous pouvez maintenant recréer les comptes de test avec : npm run create-test-accounts');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
resetTestData().catch(console.error);