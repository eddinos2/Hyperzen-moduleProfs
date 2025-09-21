-- ===========================================
-- CRÉATION DE 180 PROFESSEURS FICTIFS
-- ===========================================
-- Script SQL direct pour éviter les problèmes de clés JWT
-- Génère 180 professeurs avec répartition réaliste sur tous les campus

-- ===========================================
-- DONNÉES DE BASE
-- ===========================================

-- Noms français courants
WITH noms AS (
  SELECT unnest(ARRAY[
    'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois',
    'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David',
    'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine',
    'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre', 'Mercier', 'Blanc',
    'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Garcia',
    'Perrin', 'Robin', 'Clement', 'Morin', 'Nicolas', 'Henry', 'Roussel', 'Mathieu',
    'Gautier', 'Masson', 'Marchand', 'Duval', 'Denis', 'Dumont', 'Marie', 'Lemaire',
    'Noel', 'Meyer', 'Dufour', 'Meunier', 'Brun', 'Blanchard', 'Giraud', 'Joly',
    'Riviere', 'Lucas', 'Brunet', 'Gaillard', 'Barbier', 'Arnaud', 'Martinez', 'Gerard',
    'Roche', 'Renard', 'Charpentier', 'Colin', 'Vidal', 'Lopez', 'Philippe', 'Pierre',
    'Gonzalez', 'Fernandez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera',
    'Gomez', 'Diaz', 'Cruz', 'Ortiz', 'Gutierrez', 'Chavez', 'Ramos', 'Ruiz',
    'Herrera', 'Jimenez', 'Morales', 'Alvarez', 'Medina', 'Castillo', 'Romero', 'Hernandez'
  ]) AS nom
),
prenoms AS (
  SELECT unnest(ARRAY[
    'Jean', 'Pierre', 'Michel', 'Philippe', 'Alain', 'Bernard', 'André', 'Daniel',
    'Claude', 'François', 'Jacques', 'Robert', 'Henri', 'Paul', 'Gérard', 'Louis',
    'Marcel', 'Jean-Pierre', 'Jean-Claude', 'Jean-Paul', 'Jean-Jacques', 'Jean-Michel',
    'Jean-François', 'Jean-Luc', 'Jean-Philippe', 'Jean-Christophe', 'Jean-Baptiste',
    'Marie', 'Nathalie', 'Isabelle', 'Sylvie', 'Françoise', 'Monique', 'Christine',
    'Catherine', 'Martine', 'Nicole', 'Chantal', 'Sandrine', 'Valérie', 'Stéphanie',
    'Caroline', 'Céline', 'Pascale', 'Véronique', 'Sophie', 'Patricia', 'Dominique',
    'Brigitte', 'Annie', 'Claudine', 'Éliane', 'Hélène', 'Jacqueline', 'Michelle',
    'Danielle', 'Béatrice', 'Agnès', 'Sylviane', 'Élisabeth', 'Marie-Claire', 'Marie-France',
    'Marie-Christine', 'Marie-Thérèse', 'Marie-Anne', 'Marie-Hélène', 'Marie-Laure',
    'Anne-Marie', 'Anne-Sophie', 'Anne-Claire', 'Anne-Laure', 'Claire-Marie', 'Sophie-Marie',
    'Julie', 'Camille', 'Sarah', 'Emma', 'Léa', 'Manon', 'Chloé', 'Laura', 'Léonie',
    'Clara', 'Inès', 'Louise', 'Léna', 'Zoé', 'Alice', 'Anna', 'Océane', 'Lucie',
    'Pauline', 'Margaux', 'Lola', 'Éva', 'Romane', 'Mélissa', 'Amélie', 'Émilie',
    'Juliette', 'Mathilde', 'Victoria', 'Audrey', 'Aurélie', 'Célia', 'Élise', 'Morgane',
    'Marion', 'Noémie', 'Élisa', 'Laurie', 'Mélanie', 'Caroline', 'Clémence', 'Justine'
  ]) AS prenom
),
campus_list AS (
  SELECT unnest(ARRAY[
    'Boulogne', 'Douai', 'Jaurès', 'Parmentier', 'Picpus', 'Roquette', 'Saint-Sébastien', 'Sentier'
  ]) AS campus_name
),
-- Générer 180 combinaisons aléatoires
professors_data AS (
  SELECT 
    row_number() OVER () as id,
    'prof.' || lower(replace(prenom, ' ', '')) || '.' || lower(nom) || '@aurlom.com' as email,
    prenom as first_name,
    nom as last_name,
    campus_name,
    'Test123!' as password
  FROM 
    noms 
    CROSS JOIN prenoms 
    CROSS JOIN campus_list
  LIMIT 180
)

-- ===========================================
-- CRÉATION DES PROFESSEURS
-- ===========================================

INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  campus_id,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  pd.email,
  pd.first_name,
  pd.last_name,
  'ENSEIGNANT'::app_role,
  c.id as campus_id,
  NOW() as created_at,
  NOW() as updated_at
FROM professors_data pd
JOIN campus c ON c.name::text = pd.campus_name
ON CONFLICT (email) DO NOTHING;

-- ===========================================
-- STATISTIQUES DE CRÉATION
-- ===========================================

DO $$
DECLARE
  total_professors INTEGER;
  campus_stats RECORD;
BEGIN
  -- Compter le total
  SELECT COUNT(*) INTO total_professors 
  FROM profiles 
  WHERE role = 'ENSEIGNANT';
  
  RAISE NOTICE '=== CRÉATION DES 180 PROFESSEURS ===';
  RAISE NOTICE 'Total professeurs créés: %', total_professors;
  RAISE NOTICE '';
  
  -- Statistiques par campus
  RAISE NOTICE 'Répartition par campus:';
  FOR campus_stats IN 
    SELECT 
      c.name as campus_name,
      COUNT(p.id) as professor_count
    FROM campus c
    LEFT JOIN profiles p ON p.campus_id = c.id AND p.role = 'ENSEIGNANT'
    GROUP BY c.id, c.name
    ORDER BY c.name
  LOOP
    RAISE NOTICE '  %: % professeurs', campus_stats.campus_name, campus_stats.professor_count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Création terminée avec succès !';
  RAISE NOTICE '📧 Tous les emails suivent le format: prof.prenom.nom@aurlom.com';
  RAISE NOTICE '🔑 Mot de passe par défaut: Test123!';
  
END $$;

-- ===========================================
-- VÉRIFICATION DES DONNÉES
-- ===========================================

-- Vérifier qu'il n'y a pas de doublons
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, COUNT(*) as count
    FROM profiles 
    WHERE role = 'ENSEIGNANT'
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING '⚠️  Attention: % emails en doublon détectés!', duplicate_count;
  ELSE
    RAISE NOTICE '✅ Aucun doublon détecté';
  END IF;
END $$;

-- Vérifier la répartition
DO $$
DECLARE
  min_per_campus INTEGER;
  max_per_campus INTEGER;
BEGIN
  SELECT MIN(count), MAX(count) INTO min_per_campus, max_per_campus
  FROM (
    SELECT COUNT(*) as count
    FROM profiles p
    JOIN campus c ON p.campus_id = c.id
    WHERE p.role = 'ENSEIGNANT'
    GROUP BY c.id
  ) campus_counts;
  
  RAISE NOTICE '📊 Répartition: min=% professeurs, max=% professeurs par campus', min_per_campus, max_per_campus;
  
  IF max_per_campus - min_per_campus > 5 THEN
    RAISE WARNING '⚠️  Répartition déséquilibrée (écart > 5)';
  ELSE
    RAISE NOTICE '✅ Répartition équilibrée';
  END IF;
END $$;