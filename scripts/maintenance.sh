#!/bin/bash

# Script de maintenance pour Impact Auto
# Usage: sudo bash maintenance.sh [option]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_PATH="/var/www/html/impact-auto"
DOMAIN="vps114702.serveur-vps.net"

print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [option]"
    echo ""
    echo "Options disponibles :"
    echo "  status      - Afficher le statut des services"
    echo "  backup      - Créer une sauvegarde de la base de données"
    echo "  restore     - Restaurer la base de données depuis une sauvegarde"
    echo "  update      - Mettre à jour le code depuis Git"
    echo "  migrate     - Exécuter les migrations de base de données"
    echo "  cache       - Nettoyer le cache"
    echo "  logs        - Afficher les logs récents"
    echo "  restart     - Redémarrer les services"
    echo "  ssl-renew   - Renouveler le certificat SSL"
    echo "  monitor     - Afficher les statistiques système"
    echo "  health      - Vérifier la santé de l'application"
    echo ""
}

# Vérification du statut des services
check_status() {
    print_message "Vérification du statut des services..."
    
    echo "=== Apache ==="
    systemctl is-active apache2 && print_success "Apache : Actif" || print_error "Apache : Inactif"
    
    echo "=== MySQL ==="
    systemctl is-active mysql && print_success "MySQL : Actif" || print_error "MySQL : Inactif"
    
    echo "=== PHP ==="
    php --version | head -1
    
    echo "=== Espace disque ==="
    df -h /
    
    echo "=== Mémoire ==="
    free -h
    
    echo "=== Processus Apache ==="
    ps aux | grep apache2 | grep -v grep | wc -l | xargs echo "Processus Apache actifs :"
}

# Sauvegarde de la base de données
backup_database() {
    print_message "Création d'une sauvegarde de la base de données..."
    
    BACKUP_DIR="/backup"
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/impact_auto_$DATE.sql"
    
    mkdir -p "$BACKUP_DIR"
    
    # Lire les informations de connexion depuis le fichier .env
    if [ -f "$PROJECT_PATH/api/.env" ]; then
        DB_URL=$(grep DATABASE_URL "$PROJECT_PATH/api/.env" | cut -d'=' -f2 | tr -d '"')
        DB_NAME=$(echo $DB_URL | sed 's/.*\/\([^?]*\).*/\1/')
        DB_USER=$(echo $DB_URL | sed 's/.*\/\/\([^:]*\):.*/\1/')
        DB_PASS=$(echo $DB_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
    else
        print_error "Fichier .env non trouvé"
        exit 1
    fi
    
    mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"
    gzip "$BACKUP_FILE"
    
    # Garder seulement les 7 dernières sauvegardes
    find "$BACKUP_DIR" -name "impact_auto_*.sql.gz" -mtime +7 -delete
    
    print_success "Sauvegarde créée : ${BACKUP_FILE}.gz"
}

# Restauration de la base de données
restore_database() {
    print_message "Restauration de la base de données..."
    
    BACKUP_DIR="/backup"
    
    if [ -z "$1" ]; then
        echo "Sauvegardes disponibles :"
        ls -la "$BACKUP_DIR"/impact_auto_*.sql.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
        echo ""
        read -p "Nom du fichier de sauvegarde (sans .gz) : " BACKUP_FILE
    else
        BACKUP_FILE="$1"
    fi
    
    if [ ! -f "${BACKUP_FILE}.gz" ]; then
        print_error "Fichier de sauvegarde non trouvé : ${BACKUP_FILE}.gz"
        exit 1
    fi
    
    # Lire les informations de connexion
    DB_URL=$(grep DATABASE_URL "$PROJECT_PATH/api/.env" | cut -d'=' -f2 | tr -d '"')
    DB_NAME=$(echo $DB_URL | sed 's/.*\/\([^?]*\).*/\1/')
    DB_USER=$(echo $DB_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
    DB_PASS=$(echo $DB_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
    
    print_warning "ATTENTION : Cette opération va écraser la base de données actuelle !"
    read -p "Êtes-vous sûr de vouloir continuer ? (y/N) : " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gunzip -c "${BACKUP_FILE}.gz" | mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
        print_success "Base de données restaurée depuis : ${BACKUP_FILE}.gz"
    else
        print_message "Restauration annulée"
    fi
}

# Mise à jour du code
update_code() {
    print_message "Mise à jour du code depuis Git..."
    
    cd "$PROJECT_PATH"
    
    # Sauvegarde avant mise à jour
    backup_database
    
    # Mise à jour depuis Git
    sudo -u www-data git pull origin main
    
    # Mise à jour des dépendances
    cd "$PROJECT_PATH/api"
    sudo -u www-data composer install --no-dev --optimize-autoloader
    
    # Exécution des migrations
    sudo -u www-data php bin/console doctrine:migrations:migrate --no-interaction
    
    # Nettoyage du cache
    sudo -u www-data php bin/console cache:clear --env=prod
    sudo -u www-data php bin/console cache:warmup --env=prod
    
    print_success "Code mis à jour avec succès"
}

# Exécution des migrations
run_migrations() {
    print_message "Exécution des migrations de base de données..."
    
    cd "$PROJECT_PATH/api"
    sudo -u www-data php bin/console doctrine:migrations:migrate --no-interaction
    
    print_success "Migrations exécutées"
}

# Nettoyage du cache
clear_cache() {
    print_message "Nettoyage du cache..."
    
    cd "$PROJECT_PATH/api"
    sudo -u www-data php bin/console cache:clear --env=prod
    sudo -u www-data php bin/console cache:warmup --env=prod
    
    print_success "Cache nettoyé et réchauffé"
}

# Affichage des logs
show_logs() {
    print_message "Affichage des logs récents..."
    
    echo "=== Logs Apache (erreurs) ==="
    tail -20 /var/log/apache2/impact-auto_error.log 2>/dev/null || echo "Aucun log d'erreur Apache"
    
    echo ""
    echo "=== Logs Apache (accès) ==="
    tail -20 /var/log/apache2/impact-auto_access.log 2>/dev/null || echo "Aucun log d'accès Apache"
    
    echo ""
    echo "=== Logs Symfony ==="
    tail -20 "$PROJECT_PATH/api/var/log/prod.log" 2>/dev/null || echo "Aucun log Symfony"
}

# Redémarrage des services
restart_services() {
    print_message "Redémarrage des services..."
    
    systemctl restart apache2
    systemctl restart mysql
    
    print_success "Services redémarrés"
}

# Renouvellement SSL
renew_ssl() {
    print_message "Renouvellement du certificat SSL..."
    
    if command -v certbot &> /dev/null; then
        certbot renew --quiet
        systemctl reload apache2
        print_success "Certificat SSL renouvelé"
    else
        print_error "Certbot non installé"
    fi
}

# Monitoring système
system_monitor() {
    print_message "Statistiques système..."
    
    echo "=== Utilisation CPU ==="
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU utilisé : " 100 - $1 "%"}'
    
    echo ""
    echo "=== Utilisation mémoire ==="
    free -h
    
    echo ""
    echo "=== Utilisation disque ==="
    df -h
    
    echo ""
    echo "=== Processus Apache ==="
    ps aux | grep apache2 | grep -v grep | wc -l | xargs echo "Processus Apache :"
    
    echo ""
    echo "=== Connexions MySQL ==="
    mysql -e "SHOW STATUS LIKE 'Threads_connected';" 2>/dev/null || echo "MySQL non accessible"
    
    echo ""
    echo "=== Charge système ==="
    uptime
}

# Vérification de la santé de l'application
health_check() {
    print_message "Vérification de la santé de l'application..."
    
    # Test de l'API
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
        print_success "API accessible (HTTP $HTTP_CODE)"
    else
        print_error "API non accessible (HTTP $HTTP_CODE)"
    fi
    
    # Test du frontend
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Frontend accessible (HTTP $HTTP_CODE)"
    else
        print_error "Frontend non accessible (HTTP $HTTP_CODE)"
    fi
    
    # Test de la base de données
    cd "$PROJECT_PATH/api"
    if sudo -u www-data php bin/console doctrine:database:create --if-not-exists > /dev/null 2>&1; then
        print_success "Base de données accessible"
    else
        print_error "Base de données non accessible"
    fi
    
    # Vérification des permissions
    if [ -w "$PROJECT_PATH/api/var" ]; then
        print_success "Permissions correctes"
    else
        print_error "Problème de permissions"
    fi
}

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté en tant que root (utilisez sudo)"
    exit 1
fi

# Traitement des arguments
case "${1:-}" in
    status)
        check_status
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    update)
        update_code
        ;;
    migrate)
        run_migrations
        ;;
    cache)
        clear_cache
        ;;
    logs)
        show_logs
        ;;
    restart)
        restart_services
        ;;
    ssl-renew)
        renew_ssl
        ;;
    monitor)
        system_monitor
        ;;
    health)
        health_check
        ;;
    *)
        show_help
        ;;
esac
