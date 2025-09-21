# 📋 DOCUMENTATION COMPLÈTE DU SCHÉMA BASE DE DONNÉES

## 🏗️ STRUCTURE GÉNÉRALE

### Tables principales
- `profiles` - Utilisateurs du système
- `campus` - Campus de l'établissement  
- `invoices` - Factures des enseignants
- `invoice_lines` - Lignes de détail des factures
- `audit_logs` - Logs d'audit des actions
- `import_professeurs` - Données d'import des professeurs

---

## 👤 TABLE `profiles`

### Colonnes
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, NOT NULL | Référence vers `auth.users(id)` |
| `email` | `text` | NOT NULL, UNIQUE | Email de l'utilisateur |
| `first_name` | `text` | NOT NULL | Prénom |
| `last_name` | `text` | NOT NULL | Nom de famille |
| `role` | `app_role` | NOT NULL, DEFAULT 'ENSEIGNANT' | Rôle utilisateur |
| `campus_id` | `uuid` | NULLABLE | Référence vers `campus(id)` |
| `created_at` | `timestamptz` | DEFAULT now() | Date de création |
| `updated_at` | `timestamptz` | DEFAULT now() | Date de mise à jour |

### Clés étrangères
- `profiles_id_fkey`: `id` → `auth.users(id)` ON DELETE CASCADE
- `profiles_campus_id_fkey`: `campus_id` → `campus(id)` ON DELETE SET NULL

### Index
- `profiles_pkey`: PRIMARY KEY sur `id`
- `profiles_email_key`: UNIQUE sur `email`

### Politiques RLS
- **Service role**: Accès complet (bypass RLS)
- **Users can read own profile**: Lecture de son propre profil
- **Users can update own profile**: Modification de son propre profil

---

## 🏢 TABLE `campus`

### Colonnes
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, NOT NULL | Identifiant unique |
| `name` | `campus_name` | NOT NULL, UNIQUE | Nom du campus (enum) |
| `address` | `text` | NOT NULL | Adresse du campus |
| `directeur_id` | `uuid` | NULLABLE | Référence vers `profiles(id)` |
| `created_at` | `timestamptz` | DEFAULT now() | Date de création |

### Clés étrangères
- `campus_directeur_id_fkey`: `directeur_id` → `profiles(id)` ON DELETE SET NULL

### Index
- `campus_pkey`: PRIMARY KEY sur `id`
- `campus_name_key`: UNIQUE sur `name`

### Politiques RLS
- **Everyone can read campus**: Lecture pour tous les utilisateurs authentifiés
- **Service role**: Accès complet (bypass RLS)

---

## 📄 TABLE `invoices`

### Colonnes
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, NOT NULL | Identifiant unique |
| `enseignant_id` | `uuid` | NOT NULL | Référence vers `profiles(id)` |
| `campus_id` | `uuid` | NOT NULL | Référence vers `campus(id)` |
| `month_year` | `text` | NOT NULL | Mois/année de la facture |
| `status` | `invoice_status` | NOT NULL, DEFAULT 'pending' | Statut de la facture |
| `total_amount` | `numeric(10,2)` | NOT NULL, DEFAULT 0.00 | Montant total |
| `prevalidated_by` | `uuid` | NULLABLE | Qui a prévalidé |
| `prevalidated_at` | `timestamptz` | NULLABLE | Quand prévalidé |
| `validated_by` | `uuid` | NULLABLE | Qui a validé |
| `validated_at` | `timestamptz` | NULLABLE | Quand validé |
| `payment_date` | `timestamptz` | NULLABLE | Date de paiement |
| `paid_by` | `uuid` | NULLABLE | Qui a payé |
| `created_at` | `timestamptz` | DEFAULT now() | Date de création |
| `updated_at` | `timestamptz` | DEFAULT now() | Date de mise à jour |

### Clés étrangères
- `invoices_enseignant_id_fkey`: `enseignant_id` → `profiles(id)` ON DELETE CASCADE
- `invoices_campus_id_fkey`: `campus_id` → `campus(id)`
- `invoices_prevalidated_by_fkey`: `prevalidated_by` → `profiles(id)`
- `invoices_validated_by_fkey`: `validated_by` → `profiles(id)`
- `invoices_paid_by_fkey`: `paid_by` → `profiles(id)`

### Index
- `invoices_pkey`: PRIMARY KEY sur `id`
- `invoices_enseignant_id_month_year_key`: UNIQUE sur `(enseignant_id, month_year)`

### Politiques RLS
- **Admins can read all invoices**: SUPER_ADMIN et COMPTABLE peuvent lire toutes les factures
- **Admins can update all invoices**: SUPER_ADMIN et COMPTABLE peuvent modifier toutes les factures
- **Campus directors can read their campus invoices**: DIRECTEUR_CAMPUS peut lire les factures de son campus
- **Service role**: Accès complet (bypass RLS)
- **Teachers can create own invoices**: Les enseignants peuvent créer leurs factures
- **Teachers can update own pending invoices**: Les enseignants peuvent modifier leurs factures en attente

---

## 📝 TABLE `invoice_lines`

### Colonnes
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, NOT NULL | Identifiant unique |
| `invoice_id` | `uuid` | NOT NULL | Référence vers `invoices(id)` |
| `date_cours` | `date` | NOT NULL | Date du cours |
| `heure_debut` | `time` | NOT NULL | Heure de début |
| `heure_fin` | `time` | NOT NULL | Heure de fin |
| `campus` | `campus_name` | NOT NULL | Campus du cours |
| `filiere` | `text` | NOT NULL | Filière |
| `classe` | `text` | NOT NULL | Classe |
| `intitule` | `text` | NOT NULL | Intitulé du cours |
| `retard` | `boolean` | DEFAULT false | Retard |
| `quantite_heures` | `numeric(4,2)` | NOT NULL | Nombre d'heures |
| `prix_unitaire` | `numeric(8,2)` | NOT NULL | Prix unitaire |
| `total_ttc` | `numeric(10,2)` | NOT NULL | Total TTC |
| `status` | `invoice_status` | DEFAULT 'pending' | Statut de la ligne |
| `created_at` | `timestamptz` | DEFAULT now() | Date de création |

### Clés étrangères
- `invoice_lines_invoice_id_fkey`: `invoice_id` → `invoices(id)` ON DELETE CASCADE

### Index
- `invoice_lines_pkey`: PRIMARY KEY sur `id`

### Politiques RLS
- **Campus directors can read their campus invoice lines**: DIRECTEUR_CAMPUS peut lire les lignes de son campus
- **Service role**: Accès complet (bypass RLS)
- **Teachers can create own invoice lines**: Les enseignants peuvent créer leurs lignes de facture

---

## 🏷️ TYPES ENUM

### `app_role`
- `COMPTABLE` - Comptable
- `DIRECTEUR_CAMPUS` - Directeur de campus
- `ENSEIGNANT` - Enseignant
- `SUPER_ADMIN` - Super administrateur

### `campus_name`
- `Boulogne`
- `Douai`
- `Jaurès`
- `Parmentier`
- `Picpus`
- `Roquette`
- `Saint-Sébastien`
- `Sentier`

### `invoice_status`
- `paid` - Payée
- `pending` - En attente
- `prevalidated` - Prévalidée
- `rejected` - Rejetée
- `validated` - Validée

### `audit_action`
- `created` - Créé
- `imported` - Importé
- `paid` - Payé
- `prevalidated` - Prévalidé
- `rejected` - Rejeté
- `updated` - Mis à jour
- `validated` - Validé

---

## ⚙️ FONCTIONS RPC

### Fonctions principales
- `get_personnel_enriched()` - Récupère le personnel avec informations enrichies
- `create_user_profile()` - Crée un utilisateur et son profil
- `assign_director_to_campus()` - Assigne un directeur à un campus
- `get_campus_with_directors()` - Récupère les campus avec leurs directeurs
- `get_teacher_stats()` - Récupère les statistiques des enseignants

---

## 🔐 SÉCURITÉ ET RLS

### Principe général
- **Service role**: Bypass complet de RLS pour les opérations admin
- **Authenticated users**: Accès restreint basé sur le rôle et l'appartenance
- **Ownership**: Les utilisateurs peuvent accéder à leurs propres données
- **Role-based**: Accès différentié selon le rôle (SUPER_ADMIN, COMPTABLE, DIRECTEUR_CAMPUS, ENSEIGNANT)

### Workflow de validation des factures
1. **ENSEIGNANT**: Crée et modifie ses factures en statut `pending`
2. **DIRECTEUR_CAMPUS**: Préválide les factures de son campus (`prevalidated`)
3. **SUPER_ADMIN/COMPTABLE**: Valide les factures prévalidées (`validated`)
4. **SUPER_ADMIN/COMPTABLE**: Marque comme payées (`paid`)

---

## 📊 RELATIONS PRINCIPALES

```
auth.users (1) ←→ (1) profiles (N) ←→ (1) campus
                     ↓
                   invoices (N) ←→ (1) invoice_lines
```

### Contraintes importantes
- Un utilisateur ne peut avoir qu'un seul profil
- Un campus ne peut avoir qu'un seul directeur
- Une facture appartient à un enseignant et un campus
- Les lignes de facture sont liées à une facture
- Contrainte unique sur `(enseignant_id, month_year)` pour éviter les doublons

---

## 🚀 UTILISATION RECOMMANDÉE

### Pour les scripts
- Utiliser le `service_role` pour les opérations admin
- Respecter les contraintes de clés étrangères
- Utiliser les fonctions RPC pour les requêtes complexes

### Pour le frontend
- Utiliser les hooks personnalisés (`usePersonnel`, `useCampus`, etc.)
- Respecter les politiques RLS
- Gérer les erreurs de permissions gracieusement

### Noms de colonnes corrects
- `enseignant_id` (pas `teacher_id`)
- `directeur_id` (pas `director_id`)
- `prevalidated_by`, `validated_by`, `paid_by`
- `campus_name` (enum, pas `name` dans les campus)
