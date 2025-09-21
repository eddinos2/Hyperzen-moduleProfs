#!/usr/bin/env npx tsx

/**
 * Script de configuration Supabase
 * 
 * Ce script vous aide à configurer votre projet Supabase
 * avec les bonnes clés et URLs.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Configuration Supabase');
console.log('========================\n');

// Template de configuration
const supabaseTemplate = `import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - REMPLACER PAR VOS VRAIES VALEURS
const supabaseUrl = 'VOTRE_URL_SUPABASE_ICI';
const supabaseAnonKey = 'VOTRE_CLE_ANON_ICI';
const supabaseServiceKey = 'VOTRE_CLE_SERVICE_ROLE_ICI';

console.log('🔧 Supabase config:', { 
  url: supabaseUrl ? 'SET' : 'MISSING', 
  key: supabaseAnonKey ? 'SET' : 'MISSING',
  serviceKey: supabaseServiceKey ? 'SET' : 'MISSING'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin pour les opérations de création d'utilisateurs
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Types pour TypeScript
export type AppRole = 'SUPER_ADMIN' | 'DIRECTEUR_CAMPUS' | 'COMPTABLE' | 'ENSEIGNANT';
export type InvoiceStatus = 'pending' | 'prevalidated' | 'validated' | 'paid' | 'rejected';
export type CampusName = 'Roquette' | 'Picpus' | 'Sentier' | 'Douai' | 'Saint-Sébastien' | 'Jaurès' | 'Parmentier' | 'Boulogne';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AppRole;
  campus_id?: string;
  campus?: Campus;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: string;
  name: CampusName;
  address: string;
  directeur_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  enseignant_id: string;
  campus_id: string;
  month_year: string;
  status: InvoiceStatus;
  total_amount: number;
  prevalidated_by?: string;
  prevalidated_at?: string;
  validated_by?: string;
  validated_at?: string;
  payment_date?: string;
  paid_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  date_cours: string;
  heure_debut: string;
  heure_fin: string;
  campus: CampusName;
  filiere: string;
  classe: string;
  intitule: string;
  retard: boolean;
  quantite_heures: number;
  prix_unitaire: number;
  total_ttc: number;
  status: InvoiceStatus;
  created_at: string;
}`;

console.log('📋 Instructions de configuration :\n');
console.log('1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard');
console.log('2. Sélectionnez votre projet');
console.log('3. Allez dans Settings > API');
console.log('4. Copiez les informations suivantes :\n');

console.log('   🔗 URL du projet :');
console.log('      (exemple: https://votre-projet.supabase.co)\n');

console.log('   🔑 Clé publique (anon) :');
console.log('      (commence par eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)\n');

console.log('   🔐 Clé secrète (service_role) :');
console.log('      (commence par eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)\n');

console.log('5. Envoyez-moi ces 3 informations pour que je puisse configurer votre application\n');

console.log('💡 Alternative :');
console.log('   Vous pouvez aussi modifier directement le fichier src/lib/supabase.ts');
console.log('   et remplacer les valeurs hardcodées par vos vraies clés.\n');

console.log('⚠️  Sécurité :');
console.log('   - Ne partagez JAMAIS votre clé service_role publiquement');
console.log('   - La clé anon peut être exposée côté client');
console.log('   - La clé service_role doit rester secrète\n');

// Créer un backup du fichier actuel
try {
  const currentFile = join(process.cwd(), 'src/lib/supabase.ts');
  const backupFile = join(process.cwd(), 'src/lib/supabase.ts.backup');
  
  const currentContent = readFileSync(currentFile, 'utf8');
  writeFileSync(backupFile, currentContent);
  
  console.log('✅ Backup créé : src/lib/supabase.ts.backup');
  console.log('📝 Template prêt pour la configuration\n');
} catch (error) {
  console.log('❌ Erreur lors de la création du backup:', error);
}

console.log('🚀 Une fois configuré, redémarrez l\'application avec : npm run dev');
