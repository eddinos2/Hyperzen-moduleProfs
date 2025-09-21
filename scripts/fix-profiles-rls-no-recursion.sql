-- Corriger les politiques RLS sur profiles pour éviter la récursion infinie
-- Supprimer les politiques qui utilisent des fonctions helper

-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Campus directors can read their campus profiles" ON public.profiles;
DROP POLICY IF EXISTS "Comptables can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;

-- Créer des politiques simples sans fonctions helper
CREATE POLICY "Campus directors can read their campus profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campus c 
    WHERE c.directeur_id = auth.uid() 
    AND profiles.campus_id = c.id
  )
);

CREATE POLICY "Comptables can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'COMPTABLE'
  )
);

CREATE POLICY "Super admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'SUPER_ADMIN'
  )
);

-- Vérifier les politiques créées
SELECT 
  policyname, 
  cmd, 
  substring(qual, 1, 80) as qual_preview
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
