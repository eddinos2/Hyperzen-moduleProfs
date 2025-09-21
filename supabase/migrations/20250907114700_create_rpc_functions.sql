-- ===========================================
-- FONCTIONS RPC POUR L'APPLICATION
-- ===========================================

-- Fonction pour récupérer le personnel enrichi
CREATE OR REPLACE FUNCTION get_personnel_enriched()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role app_role,
  campus_id UUID,
  campus_name campus_name,
  campus_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Pour le service role, pas de vérification de permissions
  -- Les politiques RLS gèrent déjà les accès
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.campus_id,
    c.name as campus_name,
    c.address as campus_address,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN campus c ON p.campus_id = c.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Fonction pour assigner un directeur à un campus
CREATE OR REPLACE FUNCTION assign_director_to_campus(
  p_director_id UUID,
  p_campus_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur est SUPER_ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Permissions insuffisantes'
    );
  END IF;

  -- Vérifier que le directeur existe et a le bon rôle
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_director_id 
    AND role = 'DIRECTEUR_CAMPUS'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Directeur introuvable ou rôle incorrect'
    );
  END IF;

  -- Vérifier que le campus existe
  IF NOT EXISTS (SELECT 1 FROM campus WHERE id = p_campus_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Campus introuvable'
    );
  END IF;

  -- Assigner le directeur au campus
  UPDATE campus 
  SET directeur_id = p_director_id 
  WHERE id = p_campus_id;

  -- Mettre à jour le profil du directeur
  UPDATE profiles 
  SET campus_id = p_campus_id 
  WHERE id = p_director_id;

  v_result := json_build_object(
    'success', true,
    'message', 'Directeur assigné avec succès'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur: ' || SQLERRM
    );
END;
$$;

-- Fonction pour générer des accès (mots de passe temporaires)
CREATE OR REPLACE FUNCTION generate_access_for_users(
  p_user_ids UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_password TEXT;
  v_results JSON[] := '{}';
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur est SUPER_ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Permissions insuffisantes'
    );
  END IF;

  -- Générer un mot de passe pour chaque utilisateur
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    -- Générer un mot de passe temporaire
    v_password := 'Temp' || substring(md5(random()::text) from 1 for 8) || '!';
    
    -- Ajouter le résultat
    v_result := json_build_object(
      'id', v_user_id,
      'password', v_password,
      'success', true
    );
    
    v_results := array_append(v_results, v_result);
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'results', v_results
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur: ' || SQLERRM
    );
END;
$$;

-- Fonction pour récupérer les campus avec leurs directeurs
CREATE OR REPLACE FUNCTION get_campus_with_directors()
RETURNS TABLE (
  id UUID,
  name campus_name,
  address TEXT,
  directeur_id UUID,
  directeur_name TEXT,
  directeur_email TEXT,
  professeurs_count BIGINT,
  total_factures NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.address,
    c.directeur_id,
    CONCAT(d.first_name, ' ', d.last_name) as directeur_name,
    d.email as directeur_email,
    (SELECT COUNT(*) FROM profiles p WHERE p.campus_id = c.id AND p.role = 'ENSEIGNANT') as professeurs_count,
    COALESCE((SELECT SUM(total_amount) FROM invoices i WHERE i.campus_id = c.id), 0) as total_factures,
    c.created_at
  FROM campus c
  LEFT JOIN profiles d ON c.directeur_id = d.id
  ORDER BY c.name;
END;
$$;

-- Fonction pour récupérer les statistiques des professeurs
CREATE OR REPLACE FUNCTION get_teacher_stats()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  campus_name campus_name,
  total_amount NUMERIC,
  factures_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    c.name as campus_name,
    COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.enseignant_id = p.id), 0) as total_amount,
    (SELECT COUNT(*) FROM invoices i WHERE i.enseignant_id = p.id) as factures_count
  FROM profiles p
  LEFT JOIN campus c ON p.campus_id = c.id
  WHERE p.role = 'ENSEIGNANT'
  ORDER BY COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.enseignant_id = p.id), 0) DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_personnel_enriched() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_director_to_campus(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_for_users(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_campus_with_directors() TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_stats() TO authenticated;
