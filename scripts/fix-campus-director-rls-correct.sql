-- Corriger les politiques RLS pour les directeurs de campus
-- Les directeurs ne doivent pouvoir modifier que les lignes de leur propre campus

-- Créer les nouvelles politiques correctes
CREATE POLICY "Campus directors can update their campus invoice lines"
ON public.invoice_lines FOR UPDATE
TO authenticated
USING (
  get_user_role() = 'DIRECTEUR_CAMPUS' AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.campus_id = invoice_lines.campus_id
  )
);

CREATE POLICY "Campus directors can read their campus invoice lines"
ON public.invoice_lines FOR SELECT
TO authenticated
USING (
  get_user_role() = 'DIRECTEUR_CAMPUS' AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.campus_id = invoice_lines.campus_id
  )
);

-- Vérifier les politiques créées
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'invoice_lines' 
AND policyname LIKE '%director%'
ORDER BY policyname;
