-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Comptables can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Campus directors can read their campus profiles" ON profiles;

-- Créer des politiques utilisant les fonctions helper
CREATE POLICY "Super admins can read all profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (is_super_admin());

CREATE POLICY "Comptables can read all profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (is_comptable());

CREATE POLICY "Campus directors can read their campus profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  is_directeur_campus() AND
  EXISTS (
    SELECT 1 
    FROM campus c
    WHERE c.directeur_id = auth.uid()
    AND profiles.campus_id = c.id
  )
);
