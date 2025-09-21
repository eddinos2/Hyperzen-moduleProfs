import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Local (Docker) - Clés actuelles
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:30001';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Clé service role - Local
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🔧 Supabase config:', { 
  url: supabaseUrl ? 'SET' : 'MISSING', 
  key: supabaseAnonKey ? 'SET' : 'MISSING',
  serviceKey: supabaseServiceKey ? 'SET' : 'MISSING'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin pour les opérations de création d'utilisateurs
// Utilisation d'un client séparé pour éviter les conflits
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
}