#!/usr/bin/env tsx

/**
 * Script de validation de l'environnement
 * Vérifie que toutes les variables d'environnement nécessaires sont présentes
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
config();

interface EnvCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  description: string;
}

const envChecks: EnvCheck[] = [
  {
    name: 'VITE_SUPABASE_URL',
    value: process.env.VITE_SUPABASE_URL,
    required: true,
    description: 'URL de l\'instance Supabase'
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    value: process.env.VITE_SUPABASE_ANON_KEY,
    required: true,
    description: 'Clé anonyme Supabase'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    required: true,
    description: 'Clé service role Supabase (scripts admin)'
  },
  {
    name: 'VITE_APP_NAME',
    value: process.env.VITE_APP_NAME,
    required: false,
    description: 'Nom de l\'application'
  },
  {
    name: 'VITE_DEBUG_MODE',
    value: process.env.VITE_DEBUG_MODE,
    required: false,
    description: 'Mode debug'
  }
];

function checkEnvironment(): void {
  console.log('🔍 Vérification de l\'environnement...\n');

  let hasErrors = false;
  let hasWarnings = false;

  // Vérifier chaque variable
  for (const check of envChecks) {
    const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
    const message = check.value ? 'Définie' : (check.required ? 'MANQUANTE' : 'Optionnelle');
    
    console.log(`${status} ${check.name}: ${message}`);
    console.log(`   ${check.description}`);
    
    if (check.required && !check.value) {
      hasErrors = true;
    } else if (!check.required && !check.value) {
      hasWarnings = true;
    }
    console.log('');
  }

  // Vérifier la connexion Supabase
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    console.log('🔗 Test de connexion Supabase...');
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Test simple de connexion
      supabase.from('profiles').select('count').limit(1).then(({ error }) => {
        if (error) {
          console.log('❌ Erreur de connexion Supabase:', error.message);
          hasErrors = true;
        } else {
          console.log('✅ Connexion Supabase OK');
        }
      });
    } catch (error) {
      console.log('❌ Erreur de configuration Supabase:', error);
      hasErrors = true;
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ ERREURS DÉTECTÉES - Configuration incomplète');
    console.log('\n📋 Actions requises :');
    console.log('1. Copier env.example vers .env.local');
    console.log('2. Démarrer Supabase local : npm run db:start');
    console.log('3. Récupérer les URLs : npm run db:status');
    console.log('4. Mettre à jour .env.local avec les vraies valeurs');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  AVERTISSEMENTS - Configuration partielle');
    console.log('L\'application devrait fonctionner mais certaines fonctionnalités peuvent être limitées.');
  } else {
    console.log('✅ CONFIGURATION OK - Prêt pour le développement');
  }
  console.log('='.repeat(50));
}

// Exécuter la vérification
checkEnvironment();
