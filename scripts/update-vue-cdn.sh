#!/bin/bash

# Script pour remplacer Vue.js local par Vue.js CDN dans tous les fichiers HTML
# Usage: bash scripts/update-vue-cdn.sh

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

print_message "Mise à jour de Vue.js local vers Vue.js CDN..."

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

# Patterns de remplacement (local vers CDN)
PATTERNS=(
    's|js/vue.global.prod.js|https://unpkg.com/vue@3/dist/vue.global.prod.js|g'
    's|js/vue.global.js|https://unpkg.com/vue@3/dist/vue.global.js|g'
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
print_message "Vue.js utilise maintenant le CDN"
print_message "Avantages CDN:"
print_message "  ✅ Cache partagé entre sites"
print_message "  ✅ Mise à jour automatique"
print_message "  ✅ Moins d'espace disque"

echo ""
print_message "Pour revenir au local, utilisez: bash scripts/update-vue-local.sh"
