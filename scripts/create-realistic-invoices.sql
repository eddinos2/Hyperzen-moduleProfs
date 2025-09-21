-- ===========================================
-- CRÉATION DE FACTURES FICTIVES RÉALISTES
-- ===========================================
-- Génère des factures réalistes pour les 180 professeurs
-- avec des données cohérentes et variées

-- ===========================================
-- DONNÉES DE BASE POUR LES FACTURES
-- ===========================================

-- Filieres et classes réalistes
WITH filieres_classes AS (
  SELECT unnest(ARRAY[
    'BTS SIO|SIO1', 'BTS SIO|SIO2', 'BTS MCO|MCO1', 'BTS MCO|MCO2',
    'BTS NDRC|NDRC1', 'BTS NDRC|NDRC2', 'BTS CG|CG1', 'BTS CG|CG2',
    'BTS GPME|GPME1', 'BTS GPME|GPME2', 'BTS SAM|SAM1', 'BTS SAM|SAM2',
    'BTS PI|PI1', 'BTS PI|PI2', 'BTS FED|FED1', 'BTS FED|FED2',
    'BTS TC|TC1', 'BTS TC|TC2', 'BTS CI|CI1', 'BTS CI|CI2'
  ]) AS filiere_classe
),
-- Intitulés de cours réalistes
cours_titles AS (
  SELECT unnest(ARRAY[
    'Programmation Java', 'Base de données', 'Réseaux informatiques', 'Systèmes d''exploitation',
    'Développement web', 'Cybersécurité', 'Gestion de projet', 'Communication professionnelle',
    'Marketing digital', 'Communication commerciale', 'Négociation vente', 'Relation client',
    'Comptabilité générale', 'Gestion fiscale', 'Contrôle de gestion', 'Paie et social',
    'Gestion de projet', 'Communication interne', 'Ressources humaines', 'Management',
    'Support client', 'Gestion administrative', 'Communication téléphonique', 'Qualité service',
    'Gestion de production', 'Maintenance industrielle', 'Qualité sécurité environnement', 'Logistique',
    'Transport routier', 'Logistique transport', 'Supply chain', 'Gestion des flux',
    'Commerce international', 'Douanes et réglementation', 'Transport multimodal', 'Négociation internationale'
  ]) AS intitule
),
-- Périodes de facturation (6 derniers mois)
periodes AS (
  SELECT unnest(ARRAY[
    '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'
  ]) AS month_year
),
-- Statuts de factures avec répartition réaliste
status_distribution AS (
  SELECT unnest(ARRAY[
    'pending', 'pending', 'pending', 'pending', 'pending',  -- 50% pending
    'prevalidated', 'prevalidated', 'prevalidated',         -- 30% prevalidated  
    'validated', 'validated',                               -- 20% validated
    'paid'                                                  -- 10% paid
  ]) AS status
)

-- ===========================================
-- FONCTION POUR GÉNÉRER DES HEURES ALÉATOIRES
-- ===========================================

-- Créer une fonction pour générer des heures de cours réalistes
CREATE OR REPLACE FUNCTION generate_realistic_hours()
RETURNS TABLE(
  heure_debut TIME,
  heure_fin TIME,
  quantite_heures NUMERIC(4,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_hour INTEGER;
  start_minute INTEGER;
  duration_hours INTEGER;
  duration_minutes INTEGER;
BEGIN
  -- Heures de cours typiques: 8h30-10h, 10h15-11h45, 13h30-15h, 15h15-16h45, etc.
  start_hour := CASE floor(random() * 4)::INTEGER
    WHEN 0 THEN 8
    WHEN 1 THEN 10  
    WHEN 2 THEN 13
    ELSE 15
  END;
  
  start_minute := CASE 
    WHEN start_hour = 8 THEN 30
    WHEN start_hour = 10 THEN 15
    WHEN start_hour = 13 THEN 30
    ELSE 15
  END;
  
  -- Durée: 1h30, 2h, ou 2h30
  duration_hours := CASE floor(random() * 3)::INTEGER
    WHEN 0 THEN 1
    WHEN 1 THEN 2
    ELSE 2
  END;
  
  duration_minutes := CASE floor(random() * 2)::INTEGER
    WHEN 0 THEN 30
    ELSE 0
  END;
  
  heure_debut := (start_hour || ':' || lpad(start_minute::TEXT, 2, '0'))::TIME;
  heure_fin := ((start_hour + duration_hours) || ':' || lpad((start_minute + duration_minutes)::TEXT, 2, '0'))::TIME;
  quantite_heures := duration_hours + (duration_minutes / 60.0);
  
  RETURN NEXT;
END;
$$;

-- ===========================================
-- CRÉATION DES FACTURES
-- ===========================================

DO $$
DECLARE
  professor RECORD;
  invoice_count INTEGER := 0;
  line_count INTEGER := 0;
  current_invoice_id UUID;
  current_status invoice_status;
  current_month_year TEXT;
  total_amount NUMERIC(10,2);
  lines_per_invoice INTEGER;
  course_data RECORD;
  prix_unitaire NUMERIC(8,2);
BEGIN
  RAISE NOTICE '🚀 Génération des factures fictives...';
  
  -- Pour chaque professeur, créer 1-3 factures
  FOR professor IN 
    SELECT p.id, p.email, p.first_name, p.last_name, c.name as campus_name
    FROM profiles p
    JOIN campus c ON p.campus_id = c.id
    WHERE p.role = 'ENSEIGNANT'
    ORDER BY random()
  LOOP
    -- Nombre de factures pour ce professeur (1-3)
    invoice_count := floor(random() * 3 + 1)::INTEGER;
    
    FOR i IN 1..invoice_count LOOP
      -- Période aléatoire
      current_month_year := (ARRAY['2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'])[floor(random() * 6 + 1)];
      
      -- Statut avec répartition réaliste
      current_status := (ARRAY['pending', 'pending', 'pending', 'pending', 'pending', 
                               'prevalidated', 'prevalidated', 'prevalidated',
                               'validated', 'validated', 'paid'])[floor(random() * 11 + 1)]::invoice_status;
      
      -- Créer la facture
      INSERT INTO invoices (
        id,
        enseignant_id,
        campus_id,
        month_year,
        status,
        total_amount,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        professor.id,
        (SELECT id FROM campus WHERE name::text = professor.campus_name),
        current_month_year,
        current_status,
        0.00, -- Sera calculé après
        NOW(),
        NOW()
      ) RETURNING id INTO current_invoice_id;
      
      -- Nombre de lignes par facture (3-8)
      lines_per_invoice := floor(random() * 6 + 3)::INTEGER;
      total_amount := 0.00;
      
      -- Créer les lignes de facture
      FOR j IN 1..lines_per_invoice LOOP
        -- Récupérer des données aléatoires
        SELECT 
          split_part(fc.filiere_classe, '|', 1) as filiere,
          split_part(fc.filiere_classe, '|', 2) as classe,
          ct.intitule
        INTO course_data
        FROM filieres_classes fc, cours_titles ct
        ORDER BY random()
        LIMIT 1;
        
        -- Prix unitaire réaliste (50-80€/h)
        prix_unitaire := (floor(random() * 31 + 50))::NUMERIC(8,2);
        
        -- Générer les heures
        SELECT 
          heure_debut,
          heure_fin, 
          quantite_heures
        INTO course_data
        FROM generate_realistic_hours();
        
        -- Date de cours dans le mois
        INSERT INTO invoice_lines (
          id,
          invoice_id,
          date_cours,
          heure_debut,
          heure_fin,
          campus,
          filiere,
          classe,
          intitule,
          retard,
          quantite_heures,
          prix_unitaire,
          total_ttc,
          status,
          created_at
        ) VALUES (
          gen_random_uuid(),
          current_invoice_id,
          current_month_year || '-' || lpad(floor(random() * 28 + 1)::TEXT, 2, '0'),
          course_data.heure_debut,
          course_data.heure_fin,
          professor.campus_name::campus_name,
          course_data.filiere,
          course_data.classe,
          course_data.intitule,
          (random() < 0.1), -- 10% de retard
          course_data.quantite_heures,
          prix_unitaire,
          course_data.quantite_heures * prix_unitaire,
          current_status,
          NOW()
        );
        
        total_amount := total_amount + (course_data.quantite_heures * prix_unitaire);
        line_count := line_count + 1;
      END LOOP;
      
      -- Mettre à jour le montant total de la facture
      UPDATE invoices 
      SET total_amount = total_amount
      WHERE id = current_invoice_id;
      
      -- Ajouter les métadonnées de validation si nécessaire
      IF current_status IN ('prevalidated', 'validated', 'paid') THEN
        UPDATE invoices 
        SET 
          prevalidated_by = professor.id,
          prevalidated_at = NOW() - (random() * 30)::INTEGER * INTERVAL '1 day'
        WHERE id = current_invoice_id;
      END IF;
      
      IF current_status IN ('validated', 'paid') THEN
        UPDATE invoices 
        SET 
          validated_by = professor.id,
          validated_at = NOW() - (random() * 15)::INTEGER * INTERVAL '1 day'
        WHERE id = current_invoice_id;
      END IF;
      
      IF current_status = 'paid' THEN
        UPDATE invoices 
        SET 
          paid_by = professor.id,
          payment_date = NOW() - (random() * 7)::INTEGER * INTERVAL '1 day'
        WHERE id = current_invoice_id;
      END IF;
      
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Génération terminée !';
  RAISE NOTICE '📊 Statistiques:';
  RAISE NOTICE '  - Factures créées: %', (SELECT COUNT(*) FROM invoices);
  RAISE NOTICE '  - Lignes créées: %', line_count;
  
END $$;

-- ===========================================
-- STATISTIQUES FINALES
-- ===========================================

DO $$
DECLARE
  total_invoices INTEGER;
  total_lines INTEGER;
  total_amount NUMERIC(10,2);
  status_stats RECORD;
  campus_stats RECORD;
BEGIN
  SELECT 
    COUNT(*) as invoice_count,
    SUM(total_amount) as total_amount
  INTO total_invoices, total_amount
  FROM invoices;
  
  SELECT COUNT(*) INTO total_lines FROM invoice_lines;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== STATISTIQUES FINALES ===';
  RAISE NOTICE '📄 Total factures: %', total_invoices;
  RAISE NOTICE '📝 Total lignes: %', total_lines;
  RAISE NOTICE '💰 Montant total: %€', total_amount;
  RAISE NOTICE '';
  
  -- Répartition par statut
  RAISE NOTICE '📊 Répartition par statut:';
  FOR status_stats IN 
    SELECT status, COUNT(*) as count, SUM(total_amount) as amount
    FROM invoices
    GROUP BY status
    ORDER BY status
  LOOP
    RAISE NOTICE '  %: % factures (%€)', status_stats.status, status_stats.count, status_stats.amount;
  END LOOP;
  
  RAISE NOTICE '';
  
  -- Répartition par campus
  RAISE NOTICE '🏢 Répartition par campus:';
  FOR campus_stats IN 
    SELECT 
      c.name as campus_name,
      COUNT(i.id) as invoice_count,
      SUM(i.total_amount) as total_amount
    FROM campus c
    LEFT JOIN invoices i ON i.campus_id = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name
  LOOP
    RAISE NOTICE '  %: % factures (%€)', campus_stats.campus_name, campus_stats.invoice_count, campus_stats.total_amount;
  END LOOP;
  
END $$;

-- Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS generate_realistic_hours();
