# ===========================================
# SCRIPT POWERSHELL - CRÉATION DES DONNÉES MASSIVES
# ===========================================
# Script PowerShell pour exécuter la création de 180 professeurs
# et leurs factures fictives sur Windows

param(
    [string]$Action = "all",
    [string]$SupabaseUrl = $env:SUPABASE_URL,
    [string]$SupabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

# Configuration des couleurs pour la console
$Host.UI.RawUI.ForegroundColor = "White"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Info { Write-ColorOutput Cyan $args }

# Vérifications préliminaires
Write-Info "🚀 DÉMARRAGE DE LA CRÉATION DES DONNÉES MASSIVES"
Write-Info "⏰ $(Get-Date)"
Write-Info ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "supabase/config.toml")) {
    Write-Error "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    Write-Info "💡 Utilisez: cd C:\chemin\vers\projet && .\scripts\run-massive-data-creation.ps1"
    exit 1
}

# Vérifier les variables d'environnement
if (-not $SupabaseUrl) {
    Write-Error "❌ Erreur: Variable SUPABASE_URL manquante"
    Write-Info "💡 Définissez SUPABASE_URL dans votre environnement ou passez -SupabaseUrl"
    exit 1
}

if (-not $SupabaseKey) {
    Write-Error "❌ Erreur: Variable SUPABASE_SERVICE_ROLE_KEY manquante"
    Write-Info "💡 Définissez SUPABASE_SERVICE_ROLE_KEY dans votre environnement ou passez -SupabaseKey"
    exit 1
}

Write-Success "✅ Vérifications préliminaires OK"
Write-Info ""

# Fonction pour exécuter du SQL
function Invoke-SupabaseSQL {
    param(
        [string]$SqlFile,
        [string]$Description
    )
    
    Write-Info "🔄 $Description..."
    Write-Info "📁 Fichier: $SqlFile"
    
    if (-not (Test-Path $SqlFile)) {
        Write-Error "❌ Fichier non trouvé: $SqlFile"
        return $false
    }
    
    try {
        # Utiliser psql pour exécuter le SQL
        $env:PGPASSWORD = $SupabaseKey
        $connectionString = $SupabaseUrl -replace "https://", "" -replace "/rest/v1", ""
        
        # Extraire les informations de connexion
        if ($connectionString -match "([^.]+)\.supabase\.co") {
            $projectRef = $matches[1]
            $dbUrl = "postgresql://postgres:$SupabaseKey@db.$projectRef.supabase.co:5432/postgres"
        } else {
            Write-Error "❌ Impossible de parser l'URL Supabase"
            return $false
        }
        
        # Exécuter le script SQL
        $result = psql $dbUrl -f $SqlFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ $Description terminé avec succès"
            Write-Info $result
            return $true
        } else {
            Write-Error "❌ Erreur lors de l'exécution: $result"
            return $false
        }
    }
    catch {
        Write-Error "❌ Exception: $($_.Exception.Message)"
        return $false
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Fonction pour afficher les statistiques
function Show-Statistics {
    Write-Info "📊 STATISTIQUES:"
    
    try {
        $env:PGPASSWORD = $SupabaseKey
        $connectionString = $SupabaseUrl -replace "https://", "" -replace "/rest/v1", ""
        
        if ($connectionString -match "([^.]+)\.supabase\.co") {
            $projectRef = $matches[1]
            $dbUrl = "postgresql://postgres:$SupabaseKey@db.$projectRef.supabase.co:5432/postgres"
        }
        
        $teachers = psql $dbUrl -t -c "SELECT COUNT(*) FROM profiles WHERE role = 'ENSEIGNANT';" 2>$null
        $invoices = psql $dbUrl -t -c "SELECT COUNT(*) FROM invoices;" 2>$null
        $lines = psql $dbUrl -t -c "SELECT COUNT(*) FROM invoice_lines;" 2>$null
        
        Write-Info "👥 Professeurs: $($teachers.Trim())"
        Write-Info "📄 Factures: $($invoices.Trim())"
        Write-Info "📝 Lignes de facture: $($lines.Trim())"
    }
    catch {
        Write-Warning "⚠️  Impossible de récupérer les statistiques"
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Exécution selon l'action demandée
switch ($Action.ToLower()) {
    "teachers" {
        Write-Info "🎓 Création des 180 professeurs..."
        if (Invoke-SupabaseSQL "scripts/create-180-professors.sql" "Création des professeurs") {
            Show-Statistics
        }
    }
    "invoices" {
        Write-Info "📄 Création des factures réalistes..."
        if (Invoke-SupabaseSQL "scripts/create-realistic-invoices.sql" "Création des factures") {
            Show-Statistics
        }
    }
    "test" {
        Write-Info "🧪 Exécution des tests complets..."
        if (Invoke-SupabaseSQL "scripts/test-massive-data.sql" "Tests et vérifications") {
            Write-Success "✅ Tests terminés"
        }
    }
    "all" {
        Write-Info "🚀 Exécution complète (recommandé)..."
        
        # Étape 1: Professeurs
        if (-not (Invoke-SupabaseSQL "scripts/create-180-professors.sql" "Création des professeurs")) {
            Write-Error "❌ Échec de la création des professeurs"
            exit 1
        }
        
        Write-Info ""
        
        # Étape 2: Factures
        if (-not (Invoke-SupabaseSQL "scripts/create-realistic-invoices.sql" "Création des factures")) {
            Write-Error "❌ Échec de la création des factures"
            exit 1
        }
        
        Write-Info ""
        
        # Étape 3: Tests
        if (-not (Invoke-SupabaseSQL "scripts/test-massive-data.sql" "Tests et vérifications")) {
            Write-Warning "⚠️  Certains tests ont échoué, mais les données sont créées"
        }
        
        Show-Statistics
    }
    default {
        Write-Error "❌ Action invalide: $Action"
        Write-Info "Actions disponibles: teachers, invoices, test, all"
        exit 1
    }
}

Write-Info ""
Write-Success "🎉 TERMINÉ !"
Write-Info "⏰ $(Get-Date)"
Write-Info ""
Write-Info "🔗 Connectez-vous à votre application pour tester !"
Write-Info ""
Write-Info "💡 COMMANDES UTILES:"
Write-Info "   - Créer seulement les professeurs: .\scripts\run-massive-data-creation.ps1 -Action teachers"
Write-Info "   - Créer seulement les factures: .\scripts\run-massive-data-creation.ps1 -Action invoices"
Write-Info "   - Exécuter les tests: .\scripts\run-massive-data-creation.ps1 -Action test"
Write-Info "   - Tout exécuter: .\scripts\run-massive-data-creation.ps1 -Action all"
