# 🔧 Guide de Dépannage - Hyperzen ModuleProfs

## Problèmes Courants et Solutions

### 1. Docker Desktop non démarré

**Symptôme** :
```
failed to inspect service: error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/containers/...
Docker Desktop is a prerequisite for local development.
```

**Solution** :
1. Ouvrir Docker Desktop depuis le menu Démarrer
2. Attendre que l'icône Docker soit verte dans la barre des tâches
3. Relancer `npm run db:start`

**Vérification** :
```bash
docker info
# Doit afficher "Server:" avec des informations, pas d'erreur
```

### 2. Ports déjà utilisés

**Symptôme** :
```
Error: listen EADDRINUSE: address already in use :::54321
```

**Solution** :
```bash
# Arrêter Supabase
npm run db:stop

# Vérifier les ports utilisés
netstat -an | findstr :54321
netstat -an | findstr :54322
netstat -an | findstr :54323

# Tuer les processus si nécessaire
taskkill /F /PID <PID_NUMBER>

# Relancer
npm run db:start
```

### 3. Migrations en conflit

**Symptôme** :
```
ERROR: relation "table_name" already exists
```

**Solution** :
```bash
# Voir l'état des migrations
npm run db:list

# Réinitialiser complètement
npm run db:reset

# Si problème persiste, vérifier les fichiers de migration
```

### 4. Variables d'environnement manquantes

**Symptôme** :
```
❌ VITE_SUPABASE_URL: MANQUANTE
```

**Solution** :
```bash
# Copier le fichier d'exemple
cp env.example .env.local

# Éditer .env.local avec les vraies valeurs
# Récupérer les URLs via : npm run db:status
```

### 5. Supabase CLI non trouvé

**Symptôme** :
```
'supabase' n'est pas reconnu comme nom d'applet de commande
```

**Solution** :
```bash
# Vérifier l'installation
supabase --version

# Si non trouvé, réinstaller via Scoop
scoop install supabase

# Vérifier le PATH
echo $env:PATH
```

### 6. Erreurs de permissions

**Symptôme** :
```
Error: EPERM: operation not permitted
```

**Solution** :
```bash
# Exécuter PowerShell en tant qu'administrateur
# Ou vérifier les permissions du dossier
```

### 7. Connexion Supabase échoue

**Symptôme** :
```
❌ Erreur de connexion Supabase: ...
```

**Solution** :
```bash
# Vérifier que Supabase est démarré
npm run db:status

# Vérifier les URLs dans .env.local
# Redémarrer Supabase
npm run db:stop
npm run db:start
```

## Commandes de Diagnostic

### Vérifier l'état du système
```bash
# Vérifier l'environnement
npm run check:env

# Vérifier Docker
docker info

# Vérifier Supabase
npm run db:status

# Vérifier les migrations
npm run db:list
```

### Nettoyer et redémarrer
```bash
# Arrêter tout
npm run db:stop

# Nettoyer Docker (si nécessaire)
docker system prune -f

# Redémarrer
npm run db:start
npm run db:reset
```

### Logs et débogage
```bash
# Voir les logs Supabase
supabase logs

# Voir les logs Docker
docker logs supabase_db_hyperzen-moduleprofs

# Mode debug
VITE_DEBUG_MODE=true npm run dev
```

## Contacts et Support

- **Documentation** : README.md, SETUP.md
- **Issues** : Créer une issue sur le repository
- **Logs** : Vérifier la console et Supabase Studio (http://localhost:54323)
