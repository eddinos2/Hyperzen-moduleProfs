-- ===========================================
-- TEST COMPLET AVEC DONNÉES MASSIVES
-- ===========================================
-- Script de vérification et test du système avec 180 professeurs

-- ===========================================
-- VÉRIFICATIONS DE BASE
-- ===========================================

DO $$
DECLARE
  total_profiles INTEGER;
  total_teachers INTEGER;
  total_invoices INTEGER;
  total_lines INTEGER;
  total_amount NUMERIC(10,2);
BEGIN
  RAISE NOTICE '=== VÉRIFICATIONS DE BASE ===';
  
  -- Compter les profils
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  RAISE NOTICE '👥 Total profils: %', total_profiles;
  
  -- Compter les enseignants
  SELECT COUNT(*) INTO total_teachers FROM profiles WHERE role = 'ENSEIGNANT';
  RAISE NOTICE '🎓 Total enseignants: %', total_teachers;
  
  -- Compter les factures
  SELECT COUNT(*) INTO total_invoices FROM invoices;
  RAISE NOTICE '📄 Total factures: %', total_invoices;
  
  -- Compter les lignes
  SELECT COUNT(*) INTO total_lines FROM invoice_lines;
  RAISE NOTICE '📝 Total lignes de facture: %', total_lines;
  
  -- Montant total
  SELECT COALESCE(SUM(total_amount), 0) INTO total_amount FROM invoices;
  RAISE NOTICE '💰 Montant total: %€', total_amount;
  
  RAISE NOTICE '';
END $$;

-- ===========================================
-- VÉRIFICATION DES CONTRAINTES
-- ===========================================

DO $$
DECLARE
  constraint_violations INTEGER;
  orphaned_lines INTEGER;
  invalid_campus INTEGER;
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES CONTRAINTES ===';
  
  -- Vérifier les lignes orphelines
  SELECT COUNT(*) INTO orphaned_lines
  FROM invoice_lines il
  LEFT JOIN invoices i ON il.invoice_id = i.id
  WHERE i.id IS NULL;
  
  IF orphaned_lines > 0 THEN
    RAISE WARNING '⚠️  % lignes de facture orphelines détectées!', orphaned_lines;
  ELSE
    RAISE NOTICE '✅ Aucune ligne orpheline';
  END IF;
  
  -- Vérifier les campus invalides dans les lignes
  SELECT COUNT(*) INTO invalid_campus
  FROM invoice_lines il
  WHERE il.campus NOT IN (SELECT name FROM campus);
  
  IF invalid_campus > 0 THEN
    RAISE WARNING '⚠️  % lignes avec campus invalide!', invalid_campus;
  ELSE
    RAISE NOTICE '✅ Tous les campus sont valides';
  END IF;
  
  -- Vérifier les contraintes d'unicité
  SELECT COUNT(*) INTO constraint_violations
  FROM (
    SELECT enseignant_id, month_year, COUNT(*) as count
    FROM invoices
    GROUP BY enseignant_id, month_year
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF constraint_violations > 0 THEN
    RAISE WARNING '⚠️  % violations de contrainte unique (enseignant_id, month_year)!', constraint_violations;
  ELSE
    RAISE NOTICE '✅ Aucune violation de contrainte unique';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ===========================================
-- VÉRIFICATION DES DONNÉES RÉALISTES
-- ===========================================

DO $$
DECLARE
  avg_hours_per_invoice NUMERIC(4,2);
  avg_amount_per_invoice NUMERIC(10,2);
  avg_amount_per_line NUMERIC(8,2);
  teachers_without_invoices INTEGER;
  teachers_with_multiple_invoices INTEGER;
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES DONNÉES RÉALISTES ===';
  
  -- Moyenne d'heures par facture
  SELECT AVG(line_count) INTO avg_hours_per_invoice
  FROM (
    SELECT COUNT(*) as line_count
    FROM invoice_lines
    GROUP BY invoice_id
  ) invoice_line_counts;
  
  RAISE NOTICE '📊 Moyenne lignes par facture: %', avg_hours_per_invoice;
  
  -- Moyenne montant par facture
  SELECT AVG(total_amount) INTO avg_amount_per_invoice FROM invoices;
  RAISE NOTICE '💰 Moyenne montant par facture: %€', avg_amount_per_invoice;
  
  -- Moyenne montant par ligne
  SELECT AVG(total_ttc) INTO avg_amount_per_line FROM invoice_lines;
  RAISE NOTICE '💵 Moyenne montant par ligne: %€', avg_amount_per_line;
  
  -- Enseignants sans facture
  SELECT COUNT(*) INTO teachers_without_invoices
  FROM profiles p
  WHERE p.role = 'ENSEIGNANT'
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.enseignant_id = p.id);
  
  IF teachers_without_invoices > 0 THEN
    RAISE WARNING '⚠️  % enseignants sans facture!', teachers_without_invoices;
  ELSE
    RAISE NOTICE '✅ Tous les enseignants ont au moins une facture';
  END IF;
  
  -- Enseignants avec plusieurs factures
  SELECT COUNT(*) INTO teachers_with_multiple_invoices
  FROM (
    SELECT enseignant_id, COUNT(*) as invoice_count
    FROM invoices
    GROUP BY enseignant_id
    HAVING COUNT(*) > 1
  ) multiple_invoices;
  
  RAISE NOTICE '📈 Enseignants avec plusieurs factures: %', teachers_with_multiple_invoices;
  
  RAISE NOTICE '';
END $$;

-- ===========================================
-- TEST DES PERFORMANCES
-- ===========================================

DO $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  query_duration INTERVAL;
BEGIN
  RAISE NOTICE '=== TEST DES PERFORMANCES ===';
  
  -- Test 1: Requête complexe avec jointures
  start_time := clock_timestamp();
  
  PERFORM COUNT(*)
  FROM invoices i
  JOIN profiles p ON i.enseignant_id = p.id
  JOIN campus c ON i.campus_id = c.id
  JOIN invoice_lines il ON i.id = il.invoice_id
  WHERE i.status = 'pending'
  AND p.role = 'ENSEIGNANT';
  
  end_time := clock_timestamp();
  query_duration := end_time - start_time;
  RAISE NOTICE '⏱️  Requête complexe: %ms', EXTRACT(MILLISECONDS FROM query_duration);
  
  -- Test 2: Agrégation par campus
  start_time := clock_timestamp();
  
  PERFORM 
    c.name,
    COUNT(i.id) as invoice_count,
    SUM(i.total_amount) as total_amount
  FROM campus c
  LEFT JOIN invoices i ON i.campus_id = c.id
  GROUP BY c.id, c.name;
  
  end_time := clock_timestamp();
  query_duration := end_time - start_time;
  RAISE NOTICE '⏱️  Agrégation par campus: %ms', EXTRACT(MILLISECONDS FROM query_duration);
  
  -- Test 3: Recherche par nom
  start_time := clock_timestamp();
  
  PERFORM COUNT(*)
  FROM profiles p
  WHERE p.first_name ILIKE '%jean%'
  OR p.last_name ILIKE '%martin%';
  
  end_time := clock_timestamp();
  query_duration := end_time - start_time;
  RAISE NOTICE '⏱️  Recherche par nom: %ms', EXTRACT(MILLISECONDS FROM query_duration);
  
  RAISE NOTICE '';
END $$;

-- ===========================================
-- VÉRIFICATION DES RLS
-- ===========================================

DO $$
DECLARE
  rls_enabled_tables TEXT[];
  table_name TEXT;
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES RLS ===';
  
  -- Vérifier que RLS est activé sur les tables sensibles
  SELECT ARRAY['profiles', 'invoices', 'invoice_lines'] INTO rls_enabled_tables;
  
  FOREACH table_name IN ARRAY rls_enabled_tables
  LOOP
    IF EXISTS (
      SELECT 1 
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' 
      AND c.relname = table_name
      AND c.relrowsecurity = true
    ) THEN
      RAISE NOTICE '✅ RLS activé sur %', table_name;
    ELSE
      RAISE WARNING '⚠️  RLS NON activé sur %!', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- ===========================================
-- DÉTECTION D'ANOMALIES
-- ===========================================

DO $$
DECLARE
  negative_amounts INTEGER;
  zero_amounts INTEGER;
  invalid_dates INTEGER;
  future_dates INTEGER;
  invalid_hours INTEGER;
BEGIN
  RAISE NOTICE '=== DÉTECTION D''ANOMALIES ===';
  
  -- Montants négatifs
  SELECT COUNT(*) INTO negative_amounts
  FROM invoice_lines
  WHERE total_ttc < 0 OR prix_unitaire < 0 OR quantite_heures < 0;
  
  IF negative_amounts > 0 THEN
    RAISE WARNING '⚠️  % lignes avec montants négatifs!', negative_amounts;
  ELSE
    RAISE NOTICE '✅ Aucun montant négatif';
  END IF;
  
  -- Montants nuls
  SELECT COUNT(*) INTO zero_amounts
  FROM invoice_lines
  WHERE total_ttc = 0 OR prix_unitaire = 0 OR quantite_heures = 0;
  
  IF zero_amounts > 0 THEN
    RAISE WARNING '⚠️  % lignes avec montants nuls!', zero_amounts;
  ELSE
    RAISE NOTICE '✅ Aucun montant nul';
  END IF;
  
  -- Dates invalides
  SELECT COUNT(*) INTO invalid_dates
  FROM invoice_lines
  WHERE date_cours IS NULL OR date_cours < '2020-01-01';
  
  IF invalid_dates > 0 THEN
    RAISE WARNING '⚠️  % lignes avec dates invalides!', invalid_dates;
  ELSE
    RAISE NOTICE '✅ Toutes les dates sont valides';
  END IF;
  
  -- Dates futures
  SELECT COUNT(*) INTO future_dates
  FROM invoice_lines
  WHERE date_cours > CURRENT_DATE;
  
  IF future_dates > 0 THEN
    RAISE WARNING '⚠️  % lignes avec dates futures!', future_dates;
  ELSE
    RAISE NOTICE '✅ Aucune date future';
  END IF;
  
  -- Heures invalides
  SELECT COUNT(*) INTO invalid_hours
  FROM invoice_lines
  WHERE heure_debut >= heure_fin;
  
  IF invalid_hours > 0 THEN
    RAISE WARNING '⚠️  % lignes avec heures invalides!', invalid_hours;
  ELSE
    RAISE NOTICE '✅ Toutes les heures sont valides';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ===========================================
-- RÉSUMÉ FINAL
-- ===========================================

DO $$
DECLARE
  system_health_score INTEGER := 0;
  total_checks INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RÉSUMÉ FINAL ===';
  
  -- Calculer un score de santé du système
  total_checks := 10;
  
  -- Vérifications positives (+1 point chacune)
  IF (SELECT COUNT(*) FROM profiles WHERE role = 'ENSEIGNANT') >= 180 THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM invoices) > 0 THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM invoice_lines) > 0 THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM invoice_lines WHERE total_ttc < 0) THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM invoice_lines WHERE heure_debut >= heure_fin) THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM profiles WHERE role = 'ENSEIGNANT' AND campus_id IS NOT NULL) >= 180 THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM invoices 
    GROUP BY enseignant_id, month_year 
    HAVING COUNT(*) > 1
  ) THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM invoice_lines il LEFT JOIN invoices i ON il.invoice_id = i.id WHERE i.id IS NULL) = 0 THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM invoice_lines WHERE date_cours IS NULL) = 0 THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM invoice_lines WHERE campus NOT IN (SELECT name FROM campus)) = 0 THEN
    system_health_score := system_health_score + 1;
  END IF;
  
  RAISE NOTICE '🏥 Score de santé du système: %/%', system_health_score, total_checks;
  
  IF system_health_score >= 9 THEN
    RAISE NOTICE '🎉 SYSTÈME EN EXCELLENT ÉTAT !';
  ELSIF system_health_score >= 7 THEN
    RAISE NOTICE '✅ Système en bon état';
  ELSIF system_health_score >= 5 THEN
    RAISE NOTICE '⚠️  Système avec quelques problèmes mineurs';
  ELSE
    RAISE NOTICE '❌ Système nécessite une attention immédiate';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Le système est prêt pour les tests avec données massives !';
  
END $$;
