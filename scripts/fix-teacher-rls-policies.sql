-- Correction des politiques RLS pour les professeurs
-- Les professeurs doivent pouvoir voir leurs propres factures

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Teachers can view own invoices" ON public.invoices;

-- Créer une nouvelle politique pour les professeurs
CREATE POLICY "Teachers can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  auth.uid() = enseignant_id
);

-- Vérifier que la politique existe
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'invoices' 
AND policyname = 'Teachers can view own invoices';
