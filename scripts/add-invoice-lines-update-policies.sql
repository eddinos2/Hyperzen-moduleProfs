-- Ajouter des politiques pour permettre la mise à jour des lignes de facture

-- 1. Directeurs de campus peuvent mettre à jour les lignes de leur campus
CREATE POLICY "Campus directors can update their campus invoice lines" 
ON invoice_lines 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    JOIN campus c ON c.directeur_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND invoice_lines.campus_id = c.id
  )
);

-- 2. Super admins peuvent mettre à jour toutes les lignes
CREATE POLICY "Super admins can update all invoice lines" 
ON invoice_lines 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'SUPER_ADMIN'
  )
);

-- 3. Comptables peuvent mettre à jour toutes les lignes
CREATE POLICY "Comptables can update all invoice lines" 
ON invoice_lines 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'COMPTABLE'
  )
);

-- 4. Professeurs peuvent mettre à jour leurs propres lignes
CREATE POLICY "Teachers can update their own invoice lines" 
ON invoice_lines 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'ENSEIGNANT'
    AND invoice_lines.submitted_by = p.id
  )
);
