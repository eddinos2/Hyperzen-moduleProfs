# 🚀 Guide d'Installation - Hyperzen ModuleProfs

## Prérequis

### 1. Node.js et npm
- **Node.js** 18+ (recommandé : LTS)
- **npm** (inclus avec Node.js)

### 2. Supabase CLI
**⚠️ IMPORTANT** : L'installation globale via `npm install -g supabase` n'est PAS supportée.

#### Option A : Installation via Scoop (Windows - Recommandé)
```bash
# Installer Scoop si pas déjà fait
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Installer Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Option B : Installation via Chocolatey (Windows)
```bash
# Installer Chocolatey si pas déjà fait
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Installer Supabase CLI
choco install supabase
```

#### Option C : Téléchargement direct
1. Aller sur https://github.com/supabase/cli/releases
2. Télécharger `supabase_windows_amd64.zip`
3. Extraire et ajouter au PATH

### 3. Docker Desktop
- **Docker Desktop** (requis pour Supabase local)
- Télécharger depuis https://www.docker.com/products/docker-desktop/

## Installation du Projet

### 1. Cloner et installer les dépendances
```bash
# Cloner le projet (si pas déjà fait)
git clone <repository-url>
cd hyperzen-moduleprofs

# Installer les dépendances principales
npm install

# Installer les dépendances des scripts
cd scripts
npm install
cd ..
```

### 2. Configuration de l'environnement
```bash
# Copier le fichier d'exemple
cp env.example .env.local

# Éditer .env.local avec vos valeurs
# (Les valeurs par défaut fonctionnent pour le développement local)
```

### 3. Démarrer Supabase local
```bash
# Vérifier que Supabase CLI est installé
supabase --version

# Démarrer l'environnement local
npm run db:start

# Vérifier le statut
npm run db:status
```

### 4. Appliquer les migrations
```bash
# Réinitialiser la DB avec toutes les migrations
npm run db:reset

# Ou appliquer les migrations une par une
npm run db:up
```

### 5. Créer les données de test
```bash
# Créer les utilisateurs et données de test
npm run seed
```

### 6. Démarrer l'application
```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera disponible sur http://localhost:5173
```

## Vérification de l'installation

### 1. Tester la configuration
```bash
# Vérifier que l'environnement est correctement configuré
npm run check:env
```

### 2. Tester les workflows
```bash
# Tester les workflows complets
npm run test-workflow-complete

# Tester les permissions par rôle
npm run test-pov

# Tester l'isolation des campus
npm run test-campus-isolation
```

### 3. Accéder à Supabase Studio
- URL : http://localhost:54323
- Interface web pour gérer la base de données
- Voir les tables, exécuter des requêtes, etc.

## Scripts Disponibles

### Gestion de la base de données
- `npm run db:start` - Démarrer Supabase local
- `npm run db:stop` - Arrêter Supabase local
- `npm run db:status` - Voir le statut des services
- `npm run db:reset` - Réinitialiser la DB (migrations + seed)
- `npm run db:diff` - Générer une migration à partir des changements
- `npm run db:up` - Appliquer les migrations
- `npm run db:list` - Lister les migrations

### Développement
- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire l'application
- `npm run lint` - Linter le code
- `npm run typecheck` - Vérifier les types TypeScript

### Tests et données
- `npm run seed` - Créer les données de test
- `npm run check:env` - Vérifier la configuration
- `npm run test-workflow-complete` - Test workflow complet
- `npm run test-pov` - Test permissions par rôle
- `npm run test-campus-isolation` - Test isolation campus

## Dépannage

### Problème : Supabase CLI non trouvé
```bash
# Vérifier l'installation
supabase --version

# Si non trouvé, réinstaller via Scoop ou Chocolatey
# Vérifier que le PATH contient le répertoire d'installation
```

### Problème : Docker non démarré
```bash
# Démarrer Docker Desktop
# Attendre que Docker soit complètement démarré
# Puis relancer : npm run db:start
```

### Problème : Port déjà utilisé
```bash
# Arrêter les services
npm run db:stop

# Vérifier les ports utilisés
netstat -an | findstr :54321
netstat -an | findstr :54322
netstat -an | findstr :54323

# Tuer les processus si nécessaire
# Puis relancer : npm run db:start
```

### Problème : Migrations en conflit
```bash
# Voir l'état des migrations
npm run db:list

# Réinitialiser complètement
npm run db:reset

# Si problème persiste, vérifier les fichiers de migration
```

## Support

- **Documentation** : Voir README.md
- **Issues** : Créer une issue sur le repository
- **Logs** : Vérifier les logs dans la console et Supabase Studio
