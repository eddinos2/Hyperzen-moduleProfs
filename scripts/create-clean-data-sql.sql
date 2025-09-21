-- 🧹 NETTOYAGE ET CRÉATION DE DONNÉES DE TEST PROPRES
-- Supprimer tout sauf superadmin, directeurs et campus

-- Supprimer toutes les factures et leurs lignes
DELETE FROM invoice_lines;
DELETE FROM invoices;

-- Supprimer tous les profils sauf SUPER_ADMIN et DIRECTEUR_CAMPUS
DELETE FROM profiles WHERE role NOT IN ('SUPER_ADMIN', 'DIRECTEUR_CAMPUS');

-- Supprimer les utilisateurs auth correspondants (sauf superadmin)
DELETE FROM auth.users WHERE id NOT IN (
  SELECT p.id FROM profiles p WHERE p.role = 'SUPER_ADMIN'
);

-- Créer les directeurs de campus avec leurs profils et assignations
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES 
  -- Directeur Roquette
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.roquette@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false),
  
  -- Directeur Picpus
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.picpus@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Directeur Sentier
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.sentier@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Directeur Douai
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.douai@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Directeur Saint-Sébastien
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.saint-sebastien@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Directeur Jaurès
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.jaures@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Directeur Parmentier
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.parmentier@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Directeur Boulogne
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.boulogne@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW());

-- Créer les profils des directeurs
WITH director_auth AS (
  SELECT id, email FROM auth.users WHERE email LIKE 'directeur.%@aurlom.com'
)
INSERT INTO profiles (id, email, first_name, last_name, role)
SELECT 
  da.id,
  da.email,
  CASE 
    WHEN da.email = 'directeur.roquette@aurlom.com' THEN 'Directeur'
    WHEN da.email = 'directeur.picpus@aurlom.com' THEN 'Directeur'
    WHEN da.email = 'directeur.sentier@aurlom.com' THEN 'Directeur'
    WHEN da.email = 'directeur.douai@aurlom.com' THEN 'Directeur'
    WHEN da.email = 'directeur.saint-sebastien@aurlom.com' THEN 'Directeur'
    WHEN da.email = 'directeur.jaures@aurlom.com' THEN 'Directeur'
    WHEN da.email = 'directeur.parmentier@aurlom.com' THEN 'Directeur'
    WHEN da.email = 'directeur.boulogne@aurlom.com' THEN 'Directeur'
  END as first_name,
  CASE 
    WHEN da.email = 'directeur.roquette@aurlom.com' THEN 'Roquette'
    WHEN da.email = 'directeur.picpus@aurlom.com' THEN 'Picpus'
    WHEN da.email = 'directeur.sentier@aurlom.com' THEN 'Sentier'
    WHEN da.email = 'directeur.douai@aurlom.com' THEN 'Douai'
    WHEN da.email = 'directeur.saint-sebastien@aurlom.com' THEN 'Saint-Sébastien'
    WHEN da.email = 'directeur.jaures@aurlom.com' THEN 'Jaurès'
    WHEN da.email = 'directeur.parmentier@aurlom.com' THEN 'Parmentier'
    WHEN da.email = 'directeur.boulogne@aurlom.com' THEN 'Boulogne'
  END as last_name,
  'DIRECTEUR_CAMPUS'::app_role
FROM director_auth da;

-- Assigner les directeurs aux campus
UPDATE campus SET directeur_id = p.id 
FROM profiles p 
WHERE p.role = 'DIRECTEUR_CAMPUS' 
AND (
  (p.last_name = 'Roquette' AND campus.name = 'Roquette') OR
  (p.last_name = 'Picpus' AND campus.name = 'Picpus') OR
  (p.last_name = 'Sentier' AND campus.name = 'Sentier') OR
  (p.last_name = 'Douai' AND campus.name = 'Douai') OR
  (p.last_name = 'Saint-Sébastien' AND campus.name = 'Saint-Sébastien') OR
  (p.last_name = 'Jaurès' AND campus.name = 'Jaurès') OR
  (p.last_name = 'Parmentier' AND campus.name = 'Parmentier') OR
  (p.last_name = 'Boulogne' AND campus.name = 'Boulogne')
);

-- Créer les professeurs
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmed_at)
VALUES 
  -- Campus Roquette
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.martin@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.david@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.lefebvre@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Campus Picpus
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.dubois@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.moreau@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Campus Sentier
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.bernard@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.petit@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Campus Douai
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.robert@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.richard@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Campus Saint-Sébastien
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.durand@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Campus Jaurès
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.leroy@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.moreau2@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Campus Parmentier
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.simon@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  
  -- Campus Boulogne
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.michel@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.laurent@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW());

-- Créer les profils des professeurs
WITH professor_auth AS (
  SELECT id, email FROM auth.users WHERE email LIKE 'prof.%@aurlom.com'
)
INSERT INTO profiles (id, email, first_name, last_name, role, campus_id)
SELECT 
  pa.id,
  pa.email,
  CASE 
    WHEN pa.email = 'prof.martin@aurlom.com' THEN 'Martin'
    WHEN pa.email = 'prof.david@aurlom.com' THEN 'David'
    WHEN pa.email = 'prof.lefebvre@aurlom.com' THEN 'Lefebvre'
    WHEN pa.email = 'prof.dubois@aurlom.com' THEN 'Dubois'
    WHEN pa.email = 'prof.moreau@aurlom.com' THEN 'Moreau'
    WHEN pa.email = 'prof.bernard@aurlom.com' THEN 'Bernard'
    WHEN pa.email = 'prof.petit@aurlom.com' THEN 'Petit'
    WHEN pa.email = 'prof.robert@aurlom.com' THEN 'Robert'
    WHEN pa.email = 'prof.richard@aurlom.com' THEN 'Richard'
    WHEN pa.email = 'prof.durand@aurlom.com' THEN 'Durand'
    WHEN pa.email = 'prof.leroy@aurlom.com' THEN 'Leroy'
    WHEN pa.email = 'prof.moreau2@aurlom.com' THEN 'Moreau2'
    WHEN pa.email = 'prof.simon@aurlom.com' THEN 'Simon'
    WHEN pa.email = 'prof.michel@aurlom.com' THEN 'Michel'
    WHEN pa.email = 'prof.laurent@aurlom.com' THEN 'Laurent'
  END as first_name,
  'Professeur' as last_name,
  'ENSEIGNANT'::app_role,
  CASE 
    WHEN pa.email IN ('prof.martin@aurlom.com', 'prof.david@aurlom.com', 'prof.lefebvre@aurlom.com') THEN (SELECT id FROM campus WHERE name = 'Roquette')
    WHEN pa.email IN ('prof.dubois@aurlom.com', 'prof.moreau@aurlom.com') THEN (SELECT id FROM campus WHERE name = 'Picpus')
    WHEN pa.email IN ('prof.bernard@aurlom.com', 'prof.petit@aurlom.com') THEN (SELECT id FROM campus WHERE name = 'Sentier')
    WHEN pa.email IN ('prof.robert@aurlom.com', 'prof.richard@aurlom.com') THEN (SELECT id FROM campus WHERE name = 'Douai')
    WHEN pa.email = 'prof.durand@aurlom.com' THEN (SELECT id FROM campus WHERE name = 'Saint-Sébastien')
    WHEN pa.email IN ('prof.leroy@aurlom.com', 'prof.moreau2@aurlom.com') THEN (SELECT id FROM campus WHERE name = 'Jaurès')
    WHEN pa.email = 'prof.simon@aurlom.com' THEN (SELECT id FROM campus WHERE name = 'Parmentier')
    WHEN pa.email IN ('prof.michel@aurlom.com', 'prof.laurent@aurlom.com') THEN (SELECT id FROM campus WHERE name = 'Boulogne')
  END as campus_id
FROM professor_auth pa;

-- Créer des factures de test avec différents statuts
WITH professors AS (
  SELECT p.id, p.first_name, p.campus_id, c.name as campus_name
  FROM profiles p
  JOIN campus c ON c.id = p.campus_id
  WHERE p.role = 'ENSEIGNANT'
)
INSERT INTO invoices (enseignant_id, campus_id, month_year, total_amount, status)
SELECT 
  p.id,
  p.campus_id,
  '2024-' || LPAD((random() * 12 + 1)::int::text, 2, '0'),
  0, -- Sera calculé après
  CASE 
    WHEN random() < 0.5 THEN 'pending'::invoice_status
    WHEN random() < 0.75 THEN 'prevalidated'::invoice_status
    WHEN random() < 0.9 THEN 'validated'::invoice_status
    ELSE 'paid'::invoice_status
  END
FROM professors p
CROSS JOIN generate_series(1, 2 + (random() * 2)::int) -- 2-3 factures par prof
LIMIT 50; -- Limiter à 50 factures pour éviter trop de données

-- Créer les lignes de facture
WITH invoice_data AS (
  SELECT i.id as invoice_id, i.enseignant_id, i.campus_id, i.status
  FROM invoices i
)
INSERT INTO invoice_lines (invoice_id, quantite_heures, prix_unitaire, montant, date_cours, campus_id, intitule, filiere)
SELECT 
  id.invoice_id,
  (5 + random() * 10)::int as quantite_heures, -- 5-14 heures
  (30 + random() * 20)::int as prix_unitaire, -- 30-49€/h
  ((5 + random() * 10) * (30 + random() * 20))::int as montant,
  (CURRENT_DATE - (random() * 365)::int)::date as date_cours,
  id.campus_id,
  'Cours ' || 
  CASE (random() * 5)::int
    WHEN 0 THEN 'Informatique'
    WHEN 1 THEN 'Gestion'
    WHEN 2 THEN 'Commerce'
    WHEN 3 THEN 'Marketing'
    ELSE 'Communication'
  END || ' - ' || (5 + random() * 10)::int || 'h' as intitule,
  CASE (random() * 5)::int
    WHEN 0 THEN 'Informatique'
    WHEN 1 THEN 'Gestion'
    WHEN 2 THEN 'Commerce'
    WHEN 3 THEN 'Marketing'
    ELSE 'Communication'
  END as filiere
FROM invoice_data id
CROSS JOIN generate_series(1, 2 + (random() * 3)::int) -- 2-4 lignes par facture
LIMIT 150; -- Limiter à 150 lignes

-- Mettre à jour les montants totaux des factures
UPDATE invoices 
SET total_amount = (
  SELECT COALESCE(SUM(montant), 0) 
  FROM invoice_lines 
  WHERE invoice_lines.invoice_id = invoices.id
);

-- Vérification finale
SELECT '✅ Données créées avec succès !' as status;
SELECT 'Profiles:' as table_name, role, COUNT(*) as count FROM profiles GROUP BY role;
SELECT 'Factures:' as table_name, status, COUNT(*) as count FROM invoices GROUP BY status;
SELECT 'Campus avec directeurs:' as table_name, name, (directeur_id IS NOT NULL) as has_director FROM campus;
