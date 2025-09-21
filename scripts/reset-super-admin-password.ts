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

async function resetSuperAdminPassword() {
  console.log('🔧 Réinitialisation du mot de passe super admin...');
  
  const email = 'houssam@aurlom.com';
  const newPassword = 'admin123';
  
  try {
    // 1. Mettre à jour le mot de passe
    console.log('1. Mise à jour du mot de passe...');
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      '60243936-1158-4399-97ba-74f8cd2fa160',
      { password: newPassword }
    );
    
    if (error) {
      console.log('❌ Erreur mise à jour mot de passe:', error.message);
      return;
    }
    
    console.log('✅ Mot de passe mis à jour avec succès');
    
    // 2. Test de connexion
    console.log('2. Test de connexion...');
    const supabaseTest = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I');
    
    const { data: loginData, error: loginError } = await supabaseTest.auth.signInWithPassword({
      email,
      password: newPassword
    });
    
    if (loginError) {
      console.log('❌ Erreur test connexion:', loginError.message);
      return;
    }
    
    console.log('✅ Test de connexion réussi');
    console.log('✅ Super admin prêt:');
    console.log('   Email:', email);
    console.log('   Mot de passe:', newPassword);
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

resetSuperAdminPassword();
