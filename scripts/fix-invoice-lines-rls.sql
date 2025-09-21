-- Ajouter une politique RLS pour permettre aux super admins de lire toutes les lignes de facture
CREATE POLICY "Super admins can read all invoice lines" 
ON invoice_lines 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'SUPER_ADMIN'
  )
);

-- Ajouter aussi une politique pour les comptables
CREATE POLICY "Comptables can read all invoice lines" 
ON invoice_lines 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'COMPTABLE'
  )
);
