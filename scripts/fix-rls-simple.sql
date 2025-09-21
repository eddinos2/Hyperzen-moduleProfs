-- Supprimer les politiques problématiques et les recréer de manière simple

-- Supprimer les politiques existantes pour les directeurs
DROP POLICY IF EXISTS "Campus directors can update their campus invoice lines" ON public.invoice_lines;
DROP POLICY IF EXISTS "Campus directors can read their campus invoice lines" ON public.invoice_lines;

-- Créer des politiques simples sans fonctions helper
CREATE POLICY "Campus directors can update their campus invoice lines"
ON public.invoice_lines FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND p.campus_id = invoice_lines.campus_id
  )
);

CREATE POLICY "Campus directors can read their campus invoice lines"
ON public.invoice_lines FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND p.campus_id = invoice_lines.campus_id
  )
);

-- Vérifier les politiques créées
SELECT 
  policyname, 
  cmd, 
  substring(qual, 1, 100) as qual_preview
FROM pg_policies 
WHERE tablename = 'invoice_lines' 
AND policyname LIKE '%director%'
ORDER BY policyname;
