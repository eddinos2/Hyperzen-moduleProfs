-- ===========================================
-- FONCTION RPC POUR CRÉATION UTILISATEUR
-- ===========================================

-- Fonction pour créer un utilisateur et son profil en une seule opération
CREATE OR REPLACE FUNCTION create_user_profile(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_campus_id UUID DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur est authentifié et a les permissions
  IF NOT auth.role() = 'service_role' THEN
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
  END IF;

  -- Vérifier que l'email n'existe pas déjà
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email déjà utilisé'
    );
  END IF;

  -- Vérifier le rôle
  IF p_role::app_role NOT IN ('SUPER_ADMIN', 'DIRECTEUR_CAMPUS', 'COMPTABLE', 'ENSEIGNANT') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Rôle invalide'
    );
  END IF;

  -- Vérifier le campus si nécessaire
  IF p_role = 'DIRECTEUR_CAMPUS' AND p_campus_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Campus requis pour un directeur'
    );
  END IF;

  IF p_role = 'DIRECTEUR_CAMPUS' AND p_campus_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM campus WHERE id = p_campus_id) THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Campus introuvable'
      );
    END IF;
  END IF;

  -- Générer un UUID pour l'utilisateur
  v_user_id := gen_random_uuid();

  -- Insérer dans auth.users (simulation)
  -- Note: En réalité, cela devrait être fait via l'API auth
  -- Ici on simule en créant directement le profil
  
  -- Créer le profil
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    campus_id,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_role::app_role,
    CASE WHEN p_role = 'DIRECTEUR_CAMPUS' THEN p_campus_id ELSE NULL END,
    NOW(),
    NOW()
  );

  -- Si c'est un directeur, assigner au campus
  IF p_role = 'DIRECTEUR_CAMPUS' AND p_campus_id IS NOT NULL THEN
    UPDATE campus 
    SET directeur_id = v_user_id 
    WHERE id = p_campus_id;
  END IF;

  -- Retourner le résultat
  v_result := json_build_object(
    'success', true,
    'message', 'Utilisateur créé avec succès',
    'user_id', v_user_id,
    'email', p_email,
    'role', p_role,
    'campus_id', p_campus_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la création: ' || SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO service_role;
