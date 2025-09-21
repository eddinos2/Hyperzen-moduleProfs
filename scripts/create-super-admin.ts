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

async function createSuperAdmin() {
  console.log('🔧 Création du compte super admin...');
  
  const email = 'houssam@aurlom.com';
  const password = 'admin123';
  
  try {
    // 1. Créer l'utilisateur dans auth.users
    console.log('1. Création de l\'utilisateur auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Erreur création auth:', authError.message);
      return;
    }
    
    console.log('✅ Utilisateur auth créé:', authData.user?.id);
    
    // 2. Créer le profil
    console.log('2. Création du profil...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user!.id,
        email,
        first_name: 'Houssam',
        last_name: 'Admin',
        role: 'SUPER_ADMIN'
      });
    
    if (profileError) {
      console.log('❌ Erreur création profil:', profileError.message);
      return;
    }
    
    console.log('✅ Profil créé avec succès');
    
    // 3. Vérification
    console.log('3. Vérification...');
    const { data: profile, error: verifyError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (verifyError) {
      console.log('❌ Erreur vérification:', verifyError.message);
      return;
    }
    
    console.log('✅ Super admin créé avec succès:');
    console.log('   Email:', profile.email);
    console.log('   Nom:', profile.first_name, profile.last_name);
    console.log('   Rôle:', profile.role);
    console.log('   ID:', profile.id);
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

createSuperAdmin();
