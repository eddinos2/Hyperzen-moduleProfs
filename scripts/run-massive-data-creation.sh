#!/bin/bash

# ===========================================
# SCRIPT DE CRÉATION DES DONNÉES MASSIVES
# ===========================================
# Script simple pour exécuter la création de 180 professeurs
# et leurs factures fictives

set -e  # Arrêter en cas d'erreur

echo "🚀 DÉMARRAGE DE LA CRÉATION DES DONNÉES MASSIVES"
echo "⏰ $(date)"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    echo "💡 Utilisez: cd /chemin/vers/projet && scripts/run-massive-data-creation.sh"
    exit 1
fi

# Vérifier que Supabase est configuré
if [ ! -f ".env" ] && [ -z "$SUPABASE_URL" ]; then
    echo "❌ Erreur: Variables d'environnement Supabase manquantes"
    echo "💡 Copiez .env.example vers .env et configurez vos clés"
    exit 1
fi

echo "✅ Vérifications préliminaires OK"
echo ""

# Afficher les options
echo "📋 OPTIONS DISPONIBLES:"
echo "1. Créer seulement les 180 professeurs"
echo "2. Créer les professeurs + factures"
echo "3. Exécuter les tests complets"
echo "4. Tout exécuter (recommandé)"
echo ""

read -p "Choisissez une option (1-4): " choice

case $choice in
    1)
        echo "🎓 Création des 180 professeurs..."
        supabase db reset --db-url "$SUPABASE_URL" < scripts/create-180-professors.sql
        ;;
    2)
        echo "🎓 Création des 180 professeurs + factures..."
        supabase db reset --db-url "$SUPABASE_URL" < scripts/create-180-professors.sql
        supabase db reset --db-url "$SUPABASE_URL" < scripts/create-realistic-invoices.sql
        ;;
    3)
        echo "🧪 Exécution des tests complets..."
        supabase db reset --db-url "$SUPABASE_URL" < scripts/test-massive-data.sql
        ;;
    4)
        echo "🚀 Exécution complète (recommandé)..."
        supabase db reset --db-url "$SUPABASE_URL" < scripts/create-complete-massive-data.sql
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac

echo ""
echo "🎉 TERMINÉ !"
echo "⏰ $(date)"
echo ""
echo "📊 VÉRIFICATIONS RAPIDES:"
echo "Nombre de professeurs: $(supabase db reset --db-url "$SUPABASE_URL" -c "SELECT COUNT(*) FROM profiles WHERE role = 'ENSEIGNANT';")"
echo "Nombre de factures: $(supabase db reset --db-url "$SUPABASE_URL" -c "SELECT COUNT(*) FROM invoices;")"
echo ""
echo "🔗 Connectez-vous à votre application pour tester !"
