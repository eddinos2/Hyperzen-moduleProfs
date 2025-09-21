# 🎓 Hyperzen - Module Professeurs

## 📋 Vue d'ensemble

**Hyperzen Module Professeurs** est un système complet de gestion des factures et du personnel enseignant pour les établissements éducatifs. Ce projet utilise Supabase comme backend et React/Vite comme frontend, avec un système de rôles sophistiqué et des fonctionnalités avancées de gestion des factures.

## 🏗️ Architecture du projet

### Frontend (React + Vite + TypeScript)
- **Framework** : React 18 avec TypeScript
- **Build Tool** : Vite
- **Styling** : Tailwind CSS avec thème néo-brutaliste
- **State Management** : React Query pour la gestion des données
- **Routing** : React Router avec protection des routes par rôle

### Backend (Supabase)
- **Database** : PostgreSQL avec RLS (Row Level Security)
- **Auth** : Supabase Auth avec JWT
- **API** : REST API auto-générée + fonctions RPC personnalisées
- **Storage** : Supabase Storage pour les fichiers

## 🎯 Fonctionnalités principales

### 👥 Gestion des utilisateurs
- **4 rôles** : SUPER_ADMIN, COMPTABLE, DIRECTEUR_CAMPUS, ENSEIGNANT
- **8 campus** : Boulogne, Douai, Jaurès, Parmentier, Picpus, Roquette, Saint-Sébastien, Sentier
- **Profiles complets** avec assignation automatique aux campus

### 📄 Gestion des factures
- **Workflow complet** : Création → Prévalidation → Validation → Paiement
- **Lignes de détail** avec cours, horaires, filières et montants
- **Statuts multiples** : pending, prevalidated, validated, rejected, paid
- **Calculs automatiques** des totaux et heures

### 📊 Tableaux de bord
- **Dashboard personnalisé** selon le rôle
- **KPIs métier** : montants, factures en attente, statistiques
- **Graphiques** et visualisations des données

### 🔐 Sécurité
- **RLS (Row Level Security)** sur toutes les tables sensibles
- **Politiques granulaires** basées sur les rôles et campus
- **Validation des permissions** à tous les niveaux

## 🗄️ Structure de la base de données

### Tables principales
- `profiles` - Utilisateurs du système (180 professeurs fictifs)
- `campus` - 8 campus avec directeurs assignés
- `invoices` - Factures des enseignants (300-540 factures)
- `invoice_lines` - Lignes de détail des factures (900-2700 lignes)
- `audit_logs` - Logs d'audit des actions

### Types personnalisés
- `app_role` : SUPER_ADMIN, COMPTABLE, DIRECTEUR_CAMPUS, ENSEIGNANT
- `campus_name` : Les 8 campus disponibles
- `invoice_status` : pending, prevalidated, validated, rejected, paid

## 🚀 Installation et configuration

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase
- PostgreSQL client (optionnel)

### Installation
```bash
# Cloner le repository
git clone https://github.com/eddinos2/Hyperzen-moduleProfs.git
cd Hyperzen-moduleProfs

# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env
# Éditer .env avec vos clés Supabase
```

### Configuration Supabase
```bash
# Variables d'environnement requises
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

### Déploiement des migrations
```bash
# Lier le projet local à Supabase
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push

# Créer les données de test (180 professeurs + factures)
.\scripts\run-massive-data-creation.ps1
```

## 📁 Structure du projet

```
Hyperzen-moduleProfs/
├── src/
│   ├── components/          # Composants React réutilisables
│   ├── hooks/              # Hooks personnalisés pour Supabase
│   ├── pages/              # Pages de l'application
│   ├── lib/                # Utilitaires et configuration
│   └── App.tsx             # Composant principal
├── scripts/                # Scripts SQL et utilitaires
│   ├── create-180-professors.sql    # Génération 180 professeurs
│   ├── create-realistic-invoices.sql # Génération factures
│   ├── test-massive-data.sql        # Tests et vérifications
│   └── run-massive-data-creation.ps1 # Script d'exécution
├── supabase/
│   ├── migrations/         # Migrations de base de données
│   └── config.toml         # Configuration Supabase
└── public/                 # Fichiers statiques
```

## 🧪 Données de test

Le projet inclut un système complet de génération de données de test :

### 180 Professeurs fictifs
- Noms français réalistes
- Répartition équilibrée sur les 8 campus
- Emails format : `prof.prenom.nom@aurlom.com`
- Mot de passe : `Test123!`

### Factures réalistes
- 300-540 factures générées
- 6 périodes (août 2024 - janvier 2025)
- Filières BTS réalistes (SIO, MCO, NDRC, CG, etc.)
- Horaires et montants cohérents

### Utilisation des scripts
```bash
# Tout générer (recommandé)
.\scripts\run-massive-data-creation.ps1

# Ou étape par étape
.\scripts\run-massive-data-creation.ps1 -Action teachers  # 180 professeurs
.\scripts\run-massive-data-creation.ps1 -Action invoices  # Factures
.\scripts\run-massive-data-creation.ps1 -Action test      # Tests
```

## 🔧 Développement

### Commandes disponibles
```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run preview          # Prévisualisation du build

# Tests et qualité
npm run lint             # Linting ESLint
npm run type-check       # Vérification TypeScript

# Base de données
supabase start           # Démarrer Supabase local
supabase db reset        # Reset de la base
supabase db push         # Appliquer les migrations
```

### Workflow de développement
1. **Modifications locales** → Tests avec `npm run dev`
2. **Migrations** → `supabase db push`
3. **Tests complets** → `.\scripts\run-massive-data-creation.ps1 -Action test`
4. **Déploiement** → Push vers GitHub

## 📊 Comptes de test

### Super Admin
- **Email** : `houssam@aurlom.com`
- **Mot de passe** : `1313ImIm.`
- **Accès** : Toutes les fonctionnalités

### Comptables
- **Email** : `comptable@aurlom.com`
- **Mot de passe** : `Test123!`
- **Accès** : Validation et paiement des factures

### Directeurs de Campus
- **Email** : `directeur.roquette@aurlom.com`
- **Mot de passe** : `Test123!`
- **Accès** : Prévalidation des factures de leur campus

### Professeurs
- **Email** : `prof.martin@aurlom.com`
- **Mot de passe** : `Test123!`
- **Accès** : Création et gestion de leurs factures

## 🚨 Statut actuel

### ✅ Terminé et fonctionnel
- Architecture complète (Frontend + Backend)
- Système d'authentification et rôles
- Gestion des factures avec workflow complet
- Tableaux de bord personnalisés
- Génération de données massives (180 professeurs)
- Tests et vérifications automatiques
- Documentation complète

### 🔄 En cours de développement
- Tests frontend avec données massives
- Optimisations de performance
- Détection et correction d'anomalies
- Amélioration de l'UX

### 📋 Prochaines étapes
- Déploiement en production
- Tests de charge avec données massives
- Optimisation des requêtes SQL
- Amélioration des graphiques et KPIs

## 🛠️ Technologies utilisées

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool moderne
- **Tailwind CSS** - Framework CSS
- **React Query** - Gestion des données
- **React Router** - Navigation
- **Lucide React** - Icônes

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Base de données
- **Row Level Security** - Sécurité au niveau des lignes
- **JWT** - Authentification
- **REST API** - API automatique
- **RPC Functions** - Fonctions personnalisées

### Outils de développement
- **ESLint** - Linting
- **Prettier** - Formatage
- **Git** - Versioning
- **GitHub** - Repository

## 📞 Support et contribution

### Documentation
- **Schéma DB** : `SCHEMA_DOCUMENTATION.md`
- **Scripts** : `scripts/README-MASSIVE-DATA.md`
- **Setup** : `SETUP.md`
- **Troubleshooting** : `TROUBLESHOOTING.md`

### Contact
- **Développeur** : Houssam (eddinos2)
- **Email** : houssam@aurlom.com
- **GitHub** : https://github.com/eddinos2

## 📄 Licence

Ce projet est développé pour Aurlom et est destiné à un usage interne.

---

**🎉 Le système est prêt pour la production avec 180 professeurs fictifs et des données massives !**
