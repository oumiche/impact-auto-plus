#!/bin/bash

# Script pour remplacer Vue.js CDN par Vue.js local dans tous les fichiers HTML
# Usage: bash scripts/update-vue-local.sh

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_message "Mise à jour de Vue.js CDN vers Vue.js local..."

# Télécharger Vue.js si pas déjà présent
if [ ! -f "dist/js/vue.global.prod.js" ]; then
    print_message "Téléchargement de Vue.js..."
    cd dist/js
    curl -L -o vue.global.prod.js https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js
    curl -L -o vue.global.js https://unpkg.com/vue@3.4.21/dist/vue.global.js
    cd ../..
    print_success "Vue.js téléchargé"
fi

# Liste des fichiers HTML à modifier
HTML_FILES=(
    "dist/index.html"
    "dist/intervention-quotes.html"
    "dist/intervention-quote-create.html"
    "dist/intervention-quote-edit.html"
    "dist/intervention-work-authorizations.html"
    "dist/intervention-work-authorization-create.html"
    "dist/intervention-work-authorization-edit.html"
    "dist/intervention-invoices.html"
    "dist/intervention-invoice-create.html"
    "dist/intervention-invoice-edit.html"
    "dist/intervention-invoice-view.html"
    "dist/intervention-reception-reports.html"
    "dist/intervention-reception-report-create.html"
    "dist/intervention-reception-report-edit.html"
    "dist/intervention-reception-report-view.html"
    "dist/dashboard-vue.html"
    "dist/parametres-vue.html"
    "dist/users-vue.html"
    "dist/vehicles-vue.html"
)

# Patterns de remplacement
PATTERNS=(
    's|https://unpkg.com/vue@3/dist/vue.global.prod.js|js/vue.global.prod.js|g'
    's|https://unpkg.com/vue@3/dist/vue.global.js|js/vue.global.js|g'
    's|https://unpkg.com/vue@[0-9.]*/dist/vue.global.prod.js|js/vue.global.prod.js|g'
    's|https://unpkg.com/vue@[0-9.]*/dist/vue.global.js|js/vue.global.js|g'
)

# Fonction pour mettre à jour un fichier
update_file() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        print_warning "Fichier non trouvé: $file"
        return
    fi
    
    print_message "Mise à jour de: $file"
    
    # Créer une sauvegarde
    cp "$file" "$file.bak"
    
    # Appliquer tous les patterns de remplacement
    for pattern in "${PATTERNS[@]}"; do
        sed -i "$pattern" "$file"
    done
    
    # Vérifier si des changements ont été faits
    if ! diff -q "$file" "$file.bak" > /dev/null; then
        print_success "Mis à jour: $file"
    else
        print_message "Aucun changement: $file"
        rm "$file.bak"
    fi
}

# Mettre à jour tous les fichiers
for file in "${HTML_FILES[@]}"; do
    update_file "$file"
done

print_success "Mise à jour terminée !"
print_message "Vue.js est maintenant hébergé localement dans dist/js/"
print_message "Avantages:"
print_message "  ✅ Pas de dépendance CDN externe"
print_message "  ✅ Performance améliorée"
print_message "  ✅ Fonctionnement hors ligne"
print_message "  ✅ Sécurité renforcée"
print_message "  ✅ Même logique sans compilation"

# Afficher les fichiers Vue.js
echo ""
print_message "Fichiers Vue.js disponibles:"
ls -la dist/js/vue.global*.js 2>/dev/null || print_warning "Fichiers Vue.js non trouvés dans dist/js/"

echo ""
print_message "Pour revenir au CDN, utilisez: bash scripts/update-vue-cdn.sh"
