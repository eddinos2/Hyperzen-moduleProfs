-- ===========================================
-- DONNÉES INITIALES - SEED
-- ===========================================

-- Note: Les campus sont déjà créés dans la migration
-- Ce fichier contient les données de test optionnelles

-- ===========================================
-- FONCTIONS UTILITAIRES POUR LES TESTS
-- ===========================================

-- Fonction pour créer un utilisateur de test
CREATE OR REPLACE FUNCTION create_test_user(
  p_email TEXT,
  p_password TEXT DEFAULT 'password123',
  p_first_name TEXT DEFAULT 'Test',
  p_last_name TEXT DEFAULT 'User',
  p_role app_role DEFAULT 'ENSEIGNANT',
  p_campus_name campus_name DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_campus_id UUID;
  v_result JSON;
BEGIN
  -- Générer un UUID pour l'utilisateur
  v_user_id := gen_random_uuid();
  
  -- Récupérer l'ID du campus si spécifié
  IF p_campus_name IS NOT NULL THEN
    SELECT id INTO v_campus_id FROM campus WHERE name = p_campus_name;
  END IF;
  
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
    p_role,
    v_campus_id,
    NOW(),
    NOW()
  );
  
  -- Si c'est un directeur, l'assigner au campus
  IF p_role = 'DIRECTEUR_CAMPUS' AND v_campus_id IS NOT NULL THEN
    UPDATE campus 
    SET directeur_id = v_user_id 
    WHERE id = v_campus_id;
  END IF;
  
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'role', p_role,
    'campus_id', v_campus_id
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

-- ===========================================
-- DONNÉES DE TEST (OPTIONNELLES)
-- ===========================================

-- Créer un super admin de test
-- SELECT create_test_user(
--   'admin@aurlom.com',
--   'admin123',
--   'Super',
--   'Admin',
--   'SUPER_ADMIN'
-- );

-- Créer un directeur de test pour le campus Jaurès
-- SELECT create_test_user(
--   'directeur.jaures@aurlom.com',
--   'directeur123',
--   'Jean',
--   'Dupont',
--   'DIRECTEUR_CAMPUS',
--   'Jaurès'
-- );

-- Créer un professeur de test
-- SELECT create_test_user(
--   'professeur.test@aurlom.com',
--   'prof123',
--   'Marie',
--   'Martin',
--   'ENSEIGNANT',
--   'Roquette'
-- );

-- ===========================================
-- MESSAGES D'INFORMATION
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'Seed data loaded successfully!';
  RAISE NOTICE 'Campus created: %', (SELECT COUNT(*) FROM campus);
  RAISE NOTICE 'Profiles created: %', (SELECT COUNT(*) FROM profiles);
END $$;
