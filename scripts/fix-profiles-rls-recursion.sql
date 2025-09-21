-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Comptables can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Campus directors can read their campus profiles" ON profiles;

-- Créer des politiques non récursives en utilisant current_setting
CREATE POLICY "Super admins can read all profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'SUPER_ADMIN'
);

CREATE POLICY "Comptables can read all profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'COMPTABLE'
);

-- Pour les directeurs, on utilise une approche différente
-- Ils peuvent lire les profils de leur campus via une fonction
CREATE POLICY "Campus directors can read their campus profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM campus c
    WHERE c.directeur_id = auth.uid()
    AND profiles.campus_id = c.id
  )
);
