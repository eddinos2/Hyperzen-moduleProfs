-- Créer les fonctions helper pour les politiques RLS

-- Fonction pour récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Fonction pour vérifier si l'utilisateur est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql STABLE;

-- Fonction pour vérifier si l'utilisateur est comptable
CREATE OR REPLACE FUNCTION public.is_comptable()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'COMPTABLE'
  );
$$ LANGUAGE sql STABLE;

-- Fonction pour vérifier si l'utilisateur est directeur de campus
CREATE OR REPLACE FUNCTION public.is_campus_director()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'DIRECTEUR_CAMPUS'
  );
$$ LANGUAGE sql STABLE;

-- Vérifier que les fonctions sont créées
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc 
WHERE proname IN ('get_user_role', 'is_super_admin', 'is_comptable', 'is_campus_director')
ORDER BY proname;
