-- Ajouter des colonnes de traçabilité aux lignes de facture

-- 1. Colonne pour savoir qui a soumis la ligne (professeur)
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id);

-- 2. Colonne pour savoir qui a prévalidé la ligne (directeur)
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS prevalidated_by uuid REFERENCES profiles(id);

-- 3. Colonne pour la date de prévalidation
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS prevalidated_at timestamp with time zone;

-- 4. Colonne pour les observations du directeur
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS observations text;

-- 5. Colonne pour savoir sur quel campus la ligne a été effectuée (plus précis que le campus de la facture)
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES campus(id);

-- 6. Commentaires sur les colonnes ajoutées
COMMENT ON COLUMN invoice_lines.submitted_by IS 'Professeur qui a soumis cette ligne de facture';
COMMENT ON COLUMN invoice_lines.prevalidated_by IS 'Directeur qui a prévalidé cette ligne de facture';
COMMENT ON COLUMN invoice_lines.prevalidated_at IS 'Date et heure de prévalidation de cette ligne';
COMMENT ON COLUMN invoice_lines.observations IS 'Observations du directeur sur cette ligne de facture';
COMMENT ON COLUMN invoice_lines.campus_id IS 'Campus sur lequel cette ligne a été effectuée';

-- 7. Mettre à jour les lignes existantes avec les données par défaut
UPDATE invoice_lines 
SET 
  submitted_by = (
    SELECT i.enseignant_id 
    FROM invoices i 
    WHERE i.id = invoice_lines.invoice_id
  ),
  campus_id = (
    SELECT i.campus_id 
    FROM invoices i 
    WHERE i.id = invoice_lines.invoice_id
  )
WHERE submitted_by IS NULL OR campus_id IS NULL;

-- 8. Ajouter des politiques RLS pour les nouvelles colonnes
CREATE POLICY "Users can read submitted_by in invoice_lines" 
ON invoice_lines 
FOR SELECT 
TO authenticated 
USING (
  submitted_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() 
    AND (p.role = 'SUPER_ADMIN' OR p.role = 'COMPTABLE')
  )
);

CREATE POLICY "Users can read prevalidated_by in invoice_lines" 
ON invoice_lines 
FOR SELECT 
TO authenticated 
USING (
  prevalidated_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() 
    AND (p.role = 'SUPER_ADMIN' OR p.role = 'COMPTABLE')
  )
);
