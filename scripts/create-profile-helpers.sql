-- Fonction pour vérifier si l'utilisateur est super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  );
$$;

-- Fonction pour vérifier si l'utilisateur est comptable
CREATE OR REPLACE FUNCTION is_comptable()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'COMPTABLE'
  );
$$;

-- Fonction pour vérifier si l'utilisateur est directeur de campus
CREATE OR REPLACE FUNCTION is_directeur_campus()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'DIRECTEUR_CAMPUS'
  );
$$;
