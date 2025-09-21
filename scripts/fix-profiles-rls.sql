-- Ajouter une politique RLS pour permettre aux super admins de lire tous les profils
CREATE POLICY "Super admins can read all profiles" 
ON profiles 
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
CREATE POLICY "Comptables can read all profiles" 
ON profiles 
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

-- Ajouter une politique pour les directeurs de campus
CREATE POLICY "Campus directors can read their campus profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    JOIN campus c ON c.directeur_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'DIRECTEUR_CAMPUS'
    AND profiles.campus_id = c.id
  )
);
