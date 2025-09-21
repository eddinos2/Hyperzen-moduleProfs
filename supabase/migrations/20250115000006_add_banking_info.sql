-- ===========================================
-- AJOUT DES INFORMATIONS BANCAIRES ET DRIVE
-- ===========================================

-- Ajouter les colonnes pour les informations bancaires et Drive
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bic TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS drive_invoice_link TEXT,
ADD COLUMN IF NOT EXISTS rib_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rib_confirmed_by UUID REFERENCES profiles(id);

-- Ajouter des contraintes de validation
ALTER TABLE profiles 
ADD CONSTRAINT profiles_iban_format CHECK (
  iban IS NULL OR iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$'
);

ALTER TABLE profiles 
ADD CONSTRAINT profiles_bic_format CHECK (
  bic IS NULL OR bic ~ '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'
);

-- Index pour les recherches sur les liens Drive
CREATE INDEX IF NOT EXISTS idx_profiles_drive_link ON profiles(drive_invoice_link) 
WHERE drive_invoice_link IS NOT NULL;

-- Index pour les recherches sur les RIBs confirmés
CREATE INDEX IF NOT EXISTS idx_profiles_rib_confirmed ON profiles(rib_confirmed_at) 
WHERE rib_confirmed_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.iban IS 'IBAN du compte bancaire (format international)';
COMMENT ON COLUMN profiles.bic IS 'Code BIC/SWIFT de la banque';
COMMENT ON COLUMN profiles.bank_name IS 'Nom de la banque';
COMMENT ON COLUMN profiles.account_holder IS 'Nom du titulaire du compte';
COMMENT ON COLUMN profiles.drive_invoice_link IS 'Lien Google Drive vers la facture originale';
COMMENT ON COLUMN profiles.rib_confirmed_at IS 'Date de confirmation du RIB';
COMMENT ON COLUMN profiles.rib_confirmed_by IS 'ID de la personne ayant confirmé le RIB';

-- Politique RLS pour les informations bancaires (accès restreint)
CREATE POLICY "Users can read own banking info"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

-- Politique pour la mise à jour des infos bancaires (propre profil seulement)
CREATE POLICY "Users can update own banking info"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour les admins (lecture complète)
CREATE POLICY "Admins can read all banking info"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );
