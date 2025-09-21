-- ===========================================
-- DÉPLACEMENT RIB ET DRIVE VERS INVOICES
-- ===========================================

-- Supprimer les colonnes de profiles (elles appartiennent aux factures)
ALTER TABLE profiles 
DROP COLUMN IF EXISTS iban,
DROP COLUMN IF EXISTS bic,
DROP COLUMN IF EXISTS bank_name,
DROP COLUMN IF EXISTS account_holder,
DROP COLUMN IF EXISTS drive_invoice_link,
DROP COLUMN IF EXISTS rib_confirmed_at,
DROP COLUMN IF EXISTS rib_confirmed_by;

-- Ajouter les colonnes à invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bic TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS drive_invoice_link TEXT,
ADD COLUMN IF NOT EXISTS rib_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rib_confirmed_by UUID REFERENCES profiles(id);

-- Contraintes de validation pour invoices
ALTER TABLE invoices 
ADD CONSTRAINT invoices_iban_format CHECK (
  iban IS NULL OR iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$'
);

ALTER TABLE invoices 
ADD CONSTRAINT invoices_bic_format CHECK (
  bic IS NULL OR bic ~ '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'
);

-- Index pour les recherches sur les liens Drive par facture
CREATE INDEX IF NOT EXISTS idx_invoices_drive_link ON invoices(drive_invoice_link) 
WHERE drive_invoice_link IS NOT NULL;

-- Index pour les recherches sur les RIBs confirmés par facture
CREATE INDEX IF NOT EXISTS idx_invoices_rib_confirmed ON invoices(rib_confirmed_at) 
WHERE rib_confirmed_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN invoices.iban IS 'IBAN du compte bancaire pour cette facture mensuelle';
COMMENT ON COLUMN invoices.bic IS 'Code BIC/SWIFT de la banque pour cette facture';
COMMENT ON COLUMN invoices.bank_name IS 'Nom de la banque pour cette facture';
COMMENT ON COLUMN invoices.account_holder IS 'Nom du titulaire du compte pour cette facture';
COMMENT ON COLUMN invoices.drive_invoice_link IS 'Lien Google Drive vers la facture originale de ce mois';
COMMENT ON COLUMN invoices.rib_confirmed_at IS 'Date de confirmation du RIB pour cette facture';
COMMENT ON COLUMN invoices.rib_confirmed_by IS 'ID de la personne ayant confirmé le RIB pour cette facture';

-- Politiques RLS pour les informations bancaires des factures
CREATE POLICY "Users can read own invoice banking info"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    enseignant_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );

-- Politique pour la mise à jour des infos bancaires des factures
CREATE POLICY "Teachers can update own invoice banking info"
  ON invoices FOR UPDATE
  TO authenticated
  USING (enseignant_id = auth.uid())
  WITH CHECK (enseignant_id = auth.uid());

-- Politique pour les admins (lecture complète des infos bancaires)
CREATE POLICY "Admins can read all invoice banking info"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SUPER_ADMIN', 'COMPTABLE')
    )
  );
