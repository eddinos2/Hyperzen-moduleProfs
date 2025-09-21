/*
  # Création des tables principales

  1. Nouvelles Tables
    - `profiles` : Profils utilisateurs étendus avec rôles et campus
    - `campus` : Informations des campus avec directeurs
    - `invoices` : Factures des enseignants
    - `invoice_lines` : Lignes de détail des factures
    - `audit_logs` : Logs d'audit pour traçabilité
    - `import_professeurs` : Table staging pour l'onboarding massif

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies basées sur les rôles et relations campus
*/

-- Table des campus (créée en premier)
CREATE TABLE IF NOT EXISTS campus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name campus_name UNIQUE NOT NULL,
  address text NOT NULL,
  directeur_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Table des profils utilisateurs étendus
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role app_role NOT NULL DEFAULT 'ENSEIGNANT',
  campus_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ajouter les contraintes de clés étrangères
ALTER TABLE profiles 
ADD CONSTRAINT profiles_campus_id_fkey 
FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE SET NULL;

ALTER TABLE campus 
ADD CONSTRAINT campus_directeur_id_fkey 
FOREIGN KEY (directeur_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Table des factures
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enseignant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id uuid NOT NULL REFERENCES campus(id),
  month_year text NOT NULL, -- Format "YYYY-MM"
  status invoice_status NOT NULL DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  prevalidated_by uuid REFERENCES profiles(id),
  prevalidated_at timestamptz,
  validated_by uuid REFERENCES profiles(id),
  validated_at timestamptz,
  payment_date timestamptz,
  paid_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte unicité par enseignant/mois
  UNIQUE(enseignant_id, month_year)
);

-- Table des lignes de facture
CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  date_cours date NOT NULL,
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,
  campus campus_name NOT NULL,
  filiere text NOT NULL,
  classe text NOT NULL,
  intitule text NOT NULL,
  retard boolean DEFAULT false,
  quantite_heures numeric(4,2) NOT NULL,
  prix_unitaire numeric(8,2) NOT NULL,
  total_ttc numeric(10,2) NOT NULL,
  status invoice_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Table des logs d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  actor_id uuid REFERENCES profiles(id),
  action audit_action NOT NULL,
  prev_status invoice_status,
  new_status invoice_status,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table de staging pour import massif professeurs
CREATE TABLE IF NOT EXISTS import_professeurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  campus text NOT NULL,
  filieres text,
  statut text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices  
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_professeurs ENABLE ROW LEVEL SECURITY;