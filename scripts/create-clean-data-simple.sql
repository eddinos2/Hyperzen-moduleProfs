-- 🧹 NETTOYAGE ET CRÉATION DE DONNÉES DE TEST PROPRES
-- Supprimer tout sauf superadmin et campus

-- Supprimer toutes les factures et leurs lignes
DELETE FROM invoice_lines;
DELETE FROM invoices;

-- Supprimer tous les profils sauf SUPER_ADMIN
DELETE FROM profiles WHERE role != 'SUPER_ADMIN';

-- Supprimer les utilisateurs auth correspondants (sauf superadmin)
DELETE FROM auth.users WHERE id NOT IN (
  SELECT p.id FROM profiles p WHERE p.role = 'SUPER_ADMIN'
);

-- Créer les directeurs avec des UUIDs fixes pour éviter les problèmes
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.roquette@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.picpus@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.sentier@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'directeur.douai@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false);

-- Créer les profils des directeurs
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'directeur.roquette@aurlom.com', 'Directeur', 'Roquette', 'DIRECTEUR_CAMPUS'),
  ('22222222-2222-2222-2222-222222222222', 'directeur.picpus@aurlom.com', 'Directeur', 'Picpus', 'DIRECTEUR_CAMPUS'),
  ('33333333-3333-3333-3333-333333333333', 'directeur.sentier@aurlom.com', 'Directeur', 'Sentier', 'DIRECTEUR_CAMPUS'),
  ('44444444-4444-4444-4444-444444444444', 'directeur.douai@aurlom.com', 'Directeur', 'Douai', 'DIRECTEUR_CAMPUS');

-- Assigner les directeurs aux campus
UPDATE campus SET directeur_id = '11111111-1111-1111-1111-111111111111' WHERE name = 'Roquette';
UPDATE campus SET directeur_id = '22222222-2222-2222-2222-222222222222' WHERE name = 'Picpus';
UPDATE campus SET directeur_id = '33333333-3333-3333-3333-333333333333' WHERE name = 'Sentier';
UPDATE campus SET directeur_id = '44444444-4444-4444-4444-444444444444' WHERE name = 'Douai';

-- Créer quelques professeurs
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.martin@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.david@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prof.lefebvre@aurlom.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false);

-- Créer les profils des professeurs
INSERT INTO profiles (id, email, first_name, last_name, role, campus_id)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'prof.martin@aurlom.com', 'Martin', 'Professeur', 'ENSEIGNANT', (SELECT id FROM campus WHERE name = 'Roquette')),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'prof.david@aurlom.com', 'David', 'Professeur', 'ENSEIGNANT', (SELECT id FROM campus WHERE name = 'Roquette')),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'prof.lefebvre@aurlom.com', 'Lefebvre', 'Professeur', 'ENSEIGNANT', (SELECT id FROM campus WHERE name = 'Picpus'));

-- Créer quelques factures de test
INSERT INTO invoices (enseignant_id, campus_id, month_year, total_amount, status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM campus WHERE name = 'Roquette'), '2024-09', 450.00, 'pending'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM campus WHERE name = 'Roquette'), '2024-10', 380.00, 'prevalidated'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM campus WHERE name = 'Picpus'), '2024-11', 520.00, 'validated');

-- Créer quelques lignes de facture (en utilisant les bonnes colonnes d'après la doc)
INSERT INTO invoice_lines (invoice_id, date_cours, heure_debut, heure_fin, campus, filiere, classe, intitule, retard, quantite_heures, prix_unitaire, total_ttc, status)
SELECT 
  i.id,
  '2024-09-15'::date,
  '09:00'::time,
  '11:00'::time,
  'Roquette'::campus_name,
  'Informatique',
  'L3',
  'Cours Informatique - 2h',
  false,
  2.0,
  25.00,
  50.00,
  'pending'::invoice_status
FROM invoices i 
WHERE i.enseignant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
LIMIT 1;

-- Vérification finale
SELECT '✅ Données créées avec succès !' as status;
SELECT 'Profiles:' as table_name, role, COUNT(*) as count FROM profiles GROUP BY role;
SELECT 'Factures:' as table_name, status, COUNT(*) as count FROM invoices GROUP BY status;
SELECT 'Campus avec directeurs:' as table_name, name, (directeur_id IS NOT NULL) as has_director FROM campus;
