-- Création directe de 180 professeurs avec INSERT
-- Correction du cast UUID pour campus_id

-- Noms français réalistes
WITH professor_data AS (
  SELECT 
    unnest(ARRAY[
      'Jean', 'Marie', 'Pierre', 'Michel', 'Alain', 'Philippe', 'André', 'Jacques', 'Daniel', 'Bernard',
      'Claude', 'François', 'Marcel', 'Robert', 'Henri', 'Roger', 'Paul', 'Louis', 'Jean-Pierre', 'Jean-Paul',
      'Jean-Claude', 'Jean-Louis', 'Jean-Marc', 'Jean-François', 'Jean-Philippe', 'Jean-Christophe', 'Jean-Luc', 'Jean-Yves',
      'Anne', 'Sylvie', 'Nathalie', 'Isabelle', 'Martine', 'Christine', 'Françoise', 'Monique', 'Catherine', 'Nicole',
      'Chantal', 'Brigitte', 'Danielle', 'Jacqueline', 'Suzanne', 'Hélène', 'Claire', 'Véronique', 'Patricia', 'Dominique'
    ]) as first_name,
    unnest(ARRAY[
      'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent',
      'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard',
      'André', 'Lefèvre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier',
      'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin', 'Morin',
      'Mathieu', 'Clement', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine', 'Chevalier', 'Robin', 'Masson', 'Sanchez'
    ]) as last_name,
    unnest(ARRAY[
      '0f65143e-6f1a-4824-b5bc-465213219360', -- Roquette
      '5d4422f4-0eb0-43f0-8051-0bde6de43398', -- Picpus
      'c0f0bc7b-19d5-4f73-b986-9fd1e7ea120c', -- Sentier
      '2fbfaff1-3f6c-4ffe-8137-863545be000f', -- Douai
      '3d3e4453-e980-488f-8b3b-1844c4e172bf', -- Saint-Sébastien
      '3c9ef881-6f2f-49ff-a87a-fb05594a56e4', -- Jaurès
      '1642e4c1-218c-4b88-8646-bc729096cd66', -- Parmentier
      'c828c921-68fd-42eb-9d85-dfb5ffa4e618'  -- Boulogne
    ])::uuid as campus_id,
    generate_series(1, 180) as idx
),
professors_with_email AS (
  SELECT 
    gen_random_uuid() as id,
    first_name,
    last_name,
    campus_id,
    idx,
    LOWER(REPLACE(first_name, '-', '')) || '.' || LOWER(REPLACE(last_name, '-', '')) || '.' || idx || '@aurlom.com' as email
  FROM professor_data
  ORDER BY RANDOM()
  LIMIT 180
)

-- Insérer directement dans la table profiles
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
  id,
  email,
  first_name,
  last_name,
  'ENSEIGNANT'::app_role,
  campus_id,
  NOW(),
  NOW()
FROM professors_with_email;

-- Vérifier le résultat
SELECT 
  COUNT(*) as total_professeurs,
  COUNT(DISTINCT campus_id) as campus_avec_profs
FROM profiles 
WHERE role = 'ENSEIGNANT';

-- Afficher la répartition par campus
SELECT 
  c.name as campus_name,
  COUNT(p.id) as nb_professeurs
FROM campus c
LEFT JOIN profiles p ON c.id = p.campus_id AND p.role = 'ENSEIGNANT'
GROUP BY c.id, c.name
ORDER BY nb_professeurs DESC;

-- Afficher quelques exemples
SELECT 
  first_name,
  last_name,
  email,
  c.name as campus_name
FROM profiles p
LEFT JOIN campus c ON p.campus_id = c.id
WHERE p.role = 'ENSEIGNANT'
ORDER BY p.created_at DESC
LIMIT 10;
