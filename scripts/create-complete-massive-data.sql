-- ===========================================
-- SCRIPT PRINCIPAL - CRÉATION DONNÉES MASSIVES
-- ===========================================
-- Ce script exécute tous les autres scripts dans le bon ordre
-- pour créer un environnement de test complet avec 180 professeurs

-- ===========================================
-- CONFIGURATION ET VÉRIFICATIONS PRÉLIMINAIRES
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '🚀 DÉMARRAGE DE LA CRÉATION DES DONNÉES MASSIVES';
  RAISE NOTICE '⏰ Heure de début: %', NOW();
  RAISE NOTICE '';
  
  -- Vérifier que les tables existent
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION '❌ Table profiles non trouvée. Veuillez exécuter les migrations d''abord.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campus') THEN
    RAISE EXCEPTION '❌ Table campus non trouvée. Veuillez exécuter les migrations d''abord.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    RAISE EXCEPTION '❌ Table invoices non trouvée. Veuillez exécuter les migrations d''abord.';
  END IF;
  
  RAISE NOTICE '✅ Vérifications préliminaires OK';
  RAISE NOTICE '';
END $$;

-- ===========================================
-- NETTOYAGE (OPTIONNEL)
-- ===========================================

DO $$
DECLARE
  existing_teachers INTEGER;
  existing_invoices INTEGER;
BEGIN
  RAISE NOTICE '=== NETTOYAGE (OPTIONNEL) ===';
  
  -- Compter les données existantes
  SELECT COUNT(*) INTO existing_teachers FROM profiles WHERE role = 'ENSEIGNANT';
  SELECT COUNT(*) INTO existing_invoices FROM invoices;
  
  RAISE NOTICE '📊 Données existantes:';
  RAISE NOTICE '  - Enseignants: %', existing_teachers;
  RAISE NOTICE '  - Factures: %', existing_invoices;
  
  IF existing_teachers > 0 OR existing_invoices > 0 THEN
    RAISE NOTICE '⚠️  Des données existent déjà.';
    RAISE NOTICE '💡 Pour nettoyer, décommentez les lignes ci-dessous:';
    RAISE NOTICE '   -- DELETE FROM invoice_lines;';
    RAISE NOTICE '   -- DELETE FROM invoices;';
    RAISE NOTICE '   -- DELETE FROM profiles WHERE role = ''ENSEIGNANT'';';
    RAISE NOTICE '';
  END IF;
  
  -- Décommenter ces lignes pour nettoyer
  -- DELETE FROM invoice_lines;
  -- DELETE FROM invoices;
  -- DELETE FROM profiles WHERE role = 'ENSEIGNANT';
  
END $$;

-- ===========================================
-- ÉTAPE 1: CRÉATION DES 180 PROFESSEURS
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '=== ÉTAPE 1: CRÉATION DES 180 PROFESSEURS ===';
  RAISE NOTICE '⏱️  Début: %', clock_timestamp();
END $$;

-- Inclure le script de création des professeurs
\i scripts/create-180-professors.sql

DO $$
BEGIN
  RAISE NOTICE '✅ Étape 1 terminée à: %', clock_timestamp();
  RAISE NOTICE '';
END $$;

-- ===========================================
-- ÉTAPE 2: CRÉATION DES FACTURES RÉALISTES
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '=== ÉTAPE 2: CRÉATION DES FACTURES RÉALISTES ===';
  RAISE NOTICE '⏱️  Début: %', clock_timestamp();
END $$;

-- Inclure le script de création des factures
\i scripts/create-realistic-invoices.sql

DO $$
BEGIN
  RAISE NOTICE '✅ Étape 2 terminée à: %', clock_timestamp();
  RAISE NOTICE '';
END $$;

-- ===========================================
-- ÉTAPE 3: TESTS ET VÉRIFICATIONS
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '=== ÉTAPE 3: TESTS ET VÉRIFICATIONS ===';
  RAISE NOTICE '⏱️  Début: %', clock_timestamp();
END $$;

-- Inclure le script de test
\i scripts/test-massive-data.sql

DO $$
BEGIN
  RAISE NOTICE '✅ Étape 3 terminée à: %', clock_timestamp();
  RAISE NOTICE '';
END $$;

-- ===========================================
-- RÉSUMÉ FINAL ET RECOMMANDATIONS
-- ===========================================

DO $$
DECLARE
  total_duration INTERVAL;
  start_time TIMESTAMP;
BEGIN
  start_time := clock_timestamp();
  
  RAISE NOTICE '=== RÉSUMÉ FINAL ===';
  RAISE NOTICE '⏰ Heure de fin: %', NOW();
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PROCHAINES ÉTAPES RECOMMANDÉES:';
  RAISE NOTICE '1. Tester le frontend avec ces données massives';
  RAISE NOTICE '2. Vérifier les performances des requêtes';
  RAISE NOTICE '3. Tester le workflow complet (création → validation → paiement)';
  RAISE NOTICE '4. Identifier et corriger les goulots d''étranglement';
  RAISE NOTICE '';
  
  RAISE NOTICE '🔧 COMMANDES UTILES:';
  RAISE NOTICE '-- Voir tous les professeurs: SELECT COUNT(*) FROM profiles WHERE role = ''ENSEIGNANT'';';
  RAISE NOTICE '-- Voir les factures par statut: SELECT status, COUNT(*) FROM invoices GROUP BY status;';
  RAISE NOTICE '-- Voir les montants par campus: SELECT c.name, SUM(i.total_amount) FROM campus c LEFT JOIN invoices i ON c.id = i.campus_id GROUP BY c.id, c.name;';
  RAISE NOTICE '';
  
  RAISE NOTICE '🎉 CRÉATION DES DONNÉES MASSIVES TERMINÉE !';
  
END $$;
