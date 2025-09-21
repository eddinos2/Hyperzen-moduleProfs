# 🚀 CRÉATION DE DONNÉES MASSIVES - 180 PROFESSEURS

## 📋 Vue d'ensemble

Ce dossier contient les scripts pour créer un environnement de test complet avec **180 professeurs fictifs** et leurs factures réalistes. Cette approche utilise du **SQL direct** pour éviter les problèmes de clés JWT que vous rencontrez avec les APIs.

## 📁 Fichiers inclus

### Scripts SQL principaux
- **`create-180-professors.sql`** - Crée 180 professeurs avec répartition équilibrée sur tous les campus
- **`create-realistic-invoices.sql`** - Génère des factures fictives réalistes pour tous les professeurs
- **`test-massive-data.sql`** - Tests complets et vérifications du système
- **`create-complete-massive-data.sql`** - Script principal qui exécute tout dans l'ordre

### Scripts d'exécution
- **`run-massive-data-creation.ps1`** - Script PowerShell pour Windows
- **`run-massive-data-creation.sh`** - Script Bash pour Linux/Mac

## 🎯 Objectifs

✅ **Créer 180 professeurs fictifs** avec des noms français réalistes  
✅ **Répartir équitablement** sur les 8 campus  
✅ **Générer des factures réalistes** avec des données cohérentes  
✅ **Tester les performances** avec des données massives  
✅ **Détecter les anomalies** et problèmes potentiels  

## 🚀 Utilisation rapide

### Windows (PowerShell)
```powershell
# Tout exécuter (recommandé)
.\scripts\run-massive-data-creation.ps1

# Ou avec des options spécifiques
.\scripts\run-massive-data-creation.ps1 -Action teachers  # Seulement professeurs
.\scripts\run-massive-data-creation.ps1 -Action invoices  # Seulement factures
.\scripts\run-massive-data-creation.ps1 -Action test      # Seulement tests
```

### Linux/Mac (Bash)
```bash
# Rendre le script exécutable
chmod +x scripts/run-massive-data-creation.sh

# Tout exécuter
./scripts/run-massive-data-creation.sh
```

### SQL direct
```sql
-- Exécuter dans l'ordre :
\i scripts/create-180-professors.sql
\i scripts/create-realistic-invoices.sql
\i scripts/test-massive-data.sql
```

## 📊 Données générées

### Professeurs (180)
- **Emails** : `prof.prenom.nom@aurlom.com`
- **Mot de passe** : `Test123!`
- **Répartition** : ~22-23 professeurs par campus
- **Noms** : Combinaisons réalistes de prénoms et noms français

### Factures (300-540)
- **Périodes** : 6 derniers mois (août 2024 - janvier 2025)
- **Statuts** : 50% pending, 30% prevalidated, 20% validated, 10% paid
- **Lignes** : 3-8 lignes par facture
- **Montants** : 50-80€/heure, 1.5-2.5h par cours

### Données réalistes
- **Filieres** : BTS SIO, MCO, NDRC, CG, GPME, SAM, PI, FED, TC, CI
- **Classes** : SIO1, SIO2, MCO1, MCO2, etc.
- **Cours** : Programmation Java, Base de données, Marketing, etc.
- **Horaires** : 8h30-10h, 10h15-11h45, 13h30-15h, 15h15-16h45

## 🔍 Vérifications automatiques

Le script de test vérifie :
- ✅ **Contraintes** : Pas de doublons, clés étrangères valides
- ✅ **Données** : Montants positifs, dates valides, heures cohérentes
- ✅ **Performances** : Temps d'exécution des requêtes complexes
- ✅ **RLS** : Vérification des politiques de sécurité
- ✅ **Anomalies** : Détection automatique des problèmes

## 📈 Statistiques attendues

Après exécution complète :
- **180 professeurs** répartis sur 8 campus
- **300-540 factures** selon la génération aléatoire
- **900-2700 lignes de facture**
- **Montant total** : 50,000-100,000€ environ

## ⚠️ Prérequis

1. **Variables d'environnement** configurées :
   ```bash
   SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
   ```

2. **Base de données** initialisée avec les migrations

3. **Outils** installés :
   - `psql` (PostgreSQL client)
   - `supabase` CLI (optionnel)

## 🛠️ Dépannage

### Erreur de connexion
```bash
# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Erreur de permissions
```bash
# Vérifier que la clé service role est correcte
# Elle doit commencer par "eyJ..." et être très longue
```

### Erreur de tables manquantes
```bash
# Exécuter les migrations d'abord
supabase db push
```

## 📝 Personnalisation

### Modifier le nombre de professeurs
Éditez `create-180-professors.sql` et changez :
```sql
LIMIT 180  -- Changer ce nombre
```

### Modifier les campus
Éditez la liste dans `create-180-professors.sql` :
```sql
SELECT unnest(ARRAY[
  'Boulogne', 'Douai', 'Jaurès', 'Parmentier', 
  'Picpus', 'Roquette', 'Saint-Sébastien', 'Sentier'
]) AS campus_name
```

### Modifier les filières
Éditez `create-realistic-invoices.sql` :
```sql
WITH filieres_classes AS (
  SELECT unnest(ARRAY[
    'BTS SIO|SIO1', 'BTS MCO|MCO1', 
    -- Ajouter vos filières
  ]) AS filiere_classe
)
```

## 🎉 Résultat attendu

Après exécution, vous aurez :
- Un environnement de test complet et réaliste
- Des données massives pour tester les performances
- Un système prêt pour les tests frontend
- Des statistiques détaillées sur la santé du système

**Votre application sera prête pour les tests avec des données massives !** 🚀
