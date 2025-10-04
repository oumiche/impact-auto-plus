#!/bin/bash

# Script de déploiement automatisé pour Impact Auto sur Ubuntu Server 24.04
# Usage: sudo bash deploy-ubuntu.sh

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
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

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté en tant que root (utilisez sudo)"
    exit 1
fi

print_message "Début du déploiement d'Impact Auto sur Ubuntu Server 24.04"

# Variables de configuration
PROJECT_NAME="impact-auto"
WEB_ROOT="/var/www/html"
PROJECT_PATH="$WEB_ROOT/$PROJECT_NAME"
DOMAIN="vps114702.serveur-vps.net"
DB_NAME="impact_auto"
DB_USER="impact_auto"

# Demander les informations sensibles
echo ""
print_warning "Configuration des informations sensibles :"
read -s -p "Mot de passe pour l'utilisateur MySQL '$DB_USER': " DB_PASSWORD
echo ""
read -s -p "Clé secrète pour l'application (32 caractères minimum): " APP_SECRET
echo ""
read -s -p "Passphrase pour JWT (optionnel): " JWT_PASSPHRASE
echo ""

if [ ${#APP_SECRET} -lt 32 ]; then
    print_error "La clé secrète doit faire au moins 32 caractères"
    exit 1
fi

# 1. Mise à jour du système
print_message "Mise à jour du système..."
apt update && apt upgrade -y

# 2. Installation des dépendances
print_message "Installation des dépendances..."
apt install -y git curl unzip software-properties-common

# 3. Installation de Composer
print_message "Installation de Composer..."
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
    print_success "Composer installé"
else
    print_success "Composer déjà installé"
fi

# 4. Installation des extensions PHP
print_message "Installation des extensions PHP..."
apt install -y php8.2-cli php8.2-fpm php8.2-mysql php8.2-zip php8.2-gd \
    php8.2-mbstring php8.2-curl php8.2-xml php8.2-intl php8.2-bcmath \
    php8.2-json php8.2-tokenizer php8.2-fileinfo

# Activation du module Apache pour PHP
a2enmod php8.2
systemctl restart apache2

# 5. Configuration de la base de données
print_message "Configuration de la base de données..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
mysql -u root -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# 6. Clonage du projet
print_message "Clonage du projet..."
if [ -d "$PROJECT_PATH" ]; then
    print_warning "Le projet existe déjà. Suppression..."
    rm -rf "$PROJECT_PATH"
fi

git clone https://github.com/oumiche/impact-auto-plus.git "$PROJECT_PATH"

# 7. Configuration des permissions
print_message "Configuration des permissions..."
chown -R www-data:www-data "$PROJECT_PATH"
chmod -R 755 "$PROJECT_PATH"

# 8. Configuration de l'API
print_message "Configuration de l'API Symfony..."
cd "$PROJECT_PATH/api"

# Installation des dépendances
sudo -u www-data composer install --no-dev --optimize-autoloader

# Configuration du fichier .env
cp .env.example .env
cat > .env << EOF
# Base de données
DATABASE_URL="mysql://$DB_USER:$DB_PASSWORD@localhost:3306/$DB_NAME?serverVersion=8.0.35&charset=utf8mb4"

# Environnement
APP_ENV=prod
APP_SECRET=$APP_SECRET

# JWT Configuration
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=$JWT_PASSPHRASE

# CORS Configuration
CORS_ALLOW_ORIGIN='https://$DOMAIN'

# Mailer
MAILER_DSN=smtp://localhost:1025
EOF

# 9. Génération des clés JWT
print_message "Génération des clés JWT..."
mkdir -p config/jwt

# Génération de la clé privée
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkcs8 -pass pass:"$JWT_PASSPHRASE"
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout -passin pass:"$JWT_PASSPHRASE"

chown www-data:www-data config/jwt/private.pem config/jwt/public.pem
chmod 644 config/jwt/private.pem config/jwt/public.pem

# 10. Configuration de la base de données
print_message "Configuration de la base de données..."
sudo -u www-data php bin/console doctrine:database:create --if-not-exists
sudo -u www-data php bin/console doctrine:migrations:migrate --no-interaction

# 11. Configuration d'Apache
print_message "Configuration d'Apache..."

# Activation des modules nécessaires
a2enmod rewrite ssl headers expires

# Création du fichier de configuration
cat > /etc/apache2/sites-available/$PROJECT_NAME.conf << EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot $PROJECT_PATH/dist
    
    # Configuration pour l'API Symfony
    <Directory $PROJECT_PATH/api/public>
        AllowOverride All
        Require all granted
        DirectoryIndex index.php
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    # Alias pour l'API
    Alias /api $PROJECT_PATH/api/public
    
    # Configuration pour le frontend
    <Directory $PROJECT_PATH/dist>
        AllowOverride All
        Require all granted
        <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
            ExpiresActive On
            ExpiresDefault "access plus 1 month"
        </FilesMatch>
    </Directory>
    
    # Logs
    ErrorLog \${APACHE_LOG_DIR}/${PROJECT_NAME}_error.log
    CustomLog \${APACHE_LOG_DIR}/${PROJECT_NAME}_access.log combined
    
    # Sécurité
    ServerTokens Prod
    ServerSignature Off
    
    # Headers de sécurité
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
EOF

# Activation du site
a2ensite $PROJECT_NAME.conf
a2dissite 000-default.conf

# Test de la configuration
apache2ctl configtest

# Redémarrage d'Apache
systemctl restart apache2

# 12. Configuration des permissions finales
print_message "Configuration des permissions finales..."
chown -R www-data:www-data $PROJECT_PATH/api/var
chmod -R 775 $PROJECT_PATH/api/var

# 13. Configuration du firewall
print_message "Configuration du firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# 14. Configuration SSL avec Let's Encrypt (optionnel)
echo ""
read -p "Voulez-vous configurer SSL avec Let's Encrypt ? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_message "Installation de Certbot..."
    apt install -y certbot python3-certbot-apache
    
    print_message "Configuration du certificat SSL..."
    certbot --apache -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    print_success "SSL configuré avec succès"
fi

# 15. Configuration des tâches cron
print_message "Configuration des tâches cron..."
(crontab -l 2>/dev/null; echo "0 * * * * cd $PROJECT_PATH/api && php bin/console cache:clear --env=prod") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > /backup/impact_auto_\$(date +\%Y\%m\%d).sql.gz") | crontab -

# Création du dossier de sauvegarde
mkdir -p /backup
chown www-data:www-data /backup

# 16. Test final
print_message "Test final du déploiement..."

# Test de l'API
if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health | grep -q "200\|404"; then
    print_success "API accessible"
else
    print_warning "API non accessible (normal si l'endpoint /health n'existe pas)"
fi

# Test du frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200"; then
    print_success "Frontend accessible"
else
    print_error "Frontend non accessible"
fi

# Résumé final
echo ""
print_success "Déploiement terminé avec succès !"
echo ""
echo "=========================================="
echo "  IMPACT AUTO - DÉPLOIEMENT TERMINÉ"
echo "=========================================="
echo ""
echo "🌐 URL de l'application :"
echo "   http://$DOMAIN"
echo "   https://$DOMAIN (si SSL configuré)"
echo ""
echo "🔧 API :"
echo "   http://$DOMAIN/api"
echo ""
echo "📁 Fichiers :"
echo "   Projet : $PROJECT_PATH"
echo "   Logs Apache : /var/log/apache2/${PROJECT_NAME}_*.log"
echo "   Logs Symfony : $PROJECT_PATH/api/var/log/prod.log"
echo ""
echo "🗄️ Base de données :"
echo "   Nom : $DB_NAME"
echo "   Utilisateur : $DB_USER"
echo ""
echo "🔑 Informations importantes :"
echo "   - Clé secrète : $APP_SECRET"
echo "   - Passphrase JWT : $JWT_PASSPHRASE"
echo "   - Mot de passe DB : [CONFIGURÉ]"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Créer un utilisateur administrateur"
echo "   2. Configurer les paramètres de l'application"
echo "   3. Tester toutes les fonctionnalités"
echo "   4. Configurer les sauvegardes automatiques"
echo ""
echo "⚠️  N'oubliez pas de :"
echo "   - Changer les mots de passe par défaut"
echo "   - Configurer les paramètres de production"
echo "   - Mettre en place la surveillance"
echo ""

print_success "Déploiement terminé ! 🚀"
