#!/usr/bin/env tsx

/**
 * Script de seed pour la base de données
 * Crée les données de base nécessaires au fonctionnement de l'application
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:30001',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface CampusData {
  name: string;
  address: string;
}

const campusData: CampusData[] = [
  { name: 'Roquette', address: '48 rue de la Roquette, 75011 Paris' },
  { name: 'Picpus', address: '12 avenue de Picpus, 75012 Paris' },
  { name: 'Sentier', address: '8 rue du Sentier, 75002 Paris' },
  { name: 'Douai', address: '15 place de Douai, 59000 Lille' },
  { name: 'Saint-Sébastien', address: '22 rue de Saint-Sébastien, 75011 Paris' },
  { name: 'Jaurès', address: '30 avenue Jean Jaurès, 75019 Paris' },
  { name: 'Parmentier', address: '45 rue Parmentier, 75011 Paris' },
  { name: 'Boulogne', address: '18 rue de Boulogne, 92100 Boulogne-Billancourt' }
];

async function seedCampus(): Promise<void> {
  console.log('🏫 Création des campus...');
  
  for (const campus of campusData) {
    const { error } = await supabase
      .from('campus')
      .upsert({
        name: campus.name,
        address: campus.address
      }, { onConflict: 'name' });
    
    if (error) {
      console.error(`❌ Erreur création campus ${campus.name}:`, error.message);
    } else {
      console.log(`✅ Campus ${campus.name} créé/mis à jour`);
    }
  }
}

async function seedTestUsers(): Promise<void> {
  console.log('👥 Création des utilisateurs de test...');
  
  const testUsers = [
    {
      email: 'houssam@aurlom.com',
      password: '1313ImIm.',
      first_name: 'Houssam',
      last_name: 'Admin',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'comptable@aurlom.com',
      password: 'Test123!',
      first_name: 'Marie',
      last_name: 'Comptable',
      role: 'COMPTABLE'
    },
    {
      email: 'directeur.roquette@aurlom.com',
      password: 'Test123!',
      first_name: 'Jean',
      last_name: 'Directeur',
      role: 'DIRECTEUR_CAMPUS'
    },
    {
      email: 'prof.martin@aurlom.com',
      password: 'Test123!',
      first_name: 'Pierre',
      last_name: 'Martin',
      role: 'ENSEIGNANT'
    }
  ];

  for (const user of testUsers) {
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email);
    
    let authData;
    if (existingUser.user) {
      console.log(`✅ Utilisateur ${user.email} existe déjà`);
      authData = { user: existingUser.user };
    } else {
      // Créer l'utilisateur dans auth.users
      const { data: newAuthData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Erreur création auth ${user.email}:`, authError.message);
        continue;
      }
      authData = newAuthData;
    }

    // Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`❌ Erreur création profil ${user.email}:`, profileError.message);
    } else {
      console.log(`✅ Utilisateur ${user.email} créé (${user.role})`);
    }
  }
}

async function assignDirectorsToCampus(): Promise<void> {
  console.log('🎯 Assignation des directeurs aux campus...');
  
  // Récupérer le directeur de Roquette
  const { data: directeur } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'directeur.roquette@aurlom.com')
    .single();

  if (directeur) {
    // Récupérer le campus Roquette
    const { data: campus } = await supabase
      .from('campus')
      .select('id')
      .eq('name', 'Roquette')
      .single();

    if (campus) {
      // Assigner le directeur au campus
      const { error } = await supabase.rpc('assign_director_to_campus', {
        p_director_id: directeur.id,
        p_campus_id: campus.id
      });

      if (error) {
        console.error('❌ Erreur assignation directeur:', error.message);
      } else {
        console.log('✅ Directeur assigné au campus Roquette');
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('🌱 Démarrage du seed de la base de données...\n');

  try {
    await seedCampus();
    console.log('');
    
    await seedTestUsers();
    console.log('');
    
    await assignDirectorsToCampus();
    console.log('');
    
    console.log('✅ Seed terminé avec succès !');
    console.log('\n📋 Comptes de test créés :');
    console.log('- houssam@aurlom.com (SUPER_ADMIN)');
    console.log('- comptable@aurlom.com (COMPTABLE)');
    console.log('- directeur.roquette@aurlom.com (DIRECTEUR_CAMPUS)');
    console.log('- prof.martin@aurlom.com (ENSEIGNANT)');
    console.log('\n🔗 Connectez-vous à l\'application pour tester !');
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Exécuter le seed
main();
