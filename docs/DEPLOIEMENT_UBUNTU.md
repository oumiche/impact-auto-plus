# Guide de Déploiement - Impact Auto sur Ubuntu Server 24.04

## 📋 Informations du Serveur

- **OS :** Ubuntu Server 24.04 LTS
- **Stack :** LAMP (Linux, Apache, MySQL, PHP)
- **URL :** https://vps114702.serveur-vps.net/
- **Projet :** Impact Auto - Optimisation de Parc Automobile

## 🎯 Objectif

Déployer l'application Impact Auto sur un serveur Ubuntu avec LAMP déjà installé, sans Docker.

## 📋 Prérequis

### Vérification de l'installation LAMP

```bash
# Vérifier Apache
sudo systemctl status apache2

# Vérifier MySQL/MariaDB
sudo systemctl status mysql

# Vérifier PHP
php --version
```

### Versions requises

- **PHP :** 8.2+ (avec extensions : pdo, pdo_mysql, mbstring, xml, curl, zip, gd, intl)
- **MySQL/MariaDB :** 8.0+
- **Apache :** 2.4+
- **Composer :** 2.0+

## 🚀 Étapes de Déploiement

### 1. Préparation du serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Git si pas déjà installé
sudo apt install git -y

# Installer Composer si pas déjà installé
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Vérifier l'installation de Composer
composer --version
```

### 2. Installation des extensions PHP requises

```bash
# Installer les extensions PHP nécessaires
sudo apt install php8.2-cli php8.2-fpm php8.2-mysql php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-intl php8.2-bcmath php8.2-json php8.2-tokenizer php8.2-fileinfo -y

# Activer le module Apache pour PHP
sudo a2enmod php8.2

# Redémarrer Apache
sudo systemctl restart apache2
```

### 3. Configuration de la base de données

```bash
# Se connecter à MySQL
sudo mysql -u root -p

# Créer la base de données et l'utilisateur
CREATE DATABASE impact_auto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'impact_auto'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON impact_auto.* TO 'impact_auto'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Cloner et configurer le projet

```bash
# Se placer dans le répertoire web d'Apache
cd /var/www/html

# Cloner le repository (remplacer par votre URL de repository)
sudo git clone https://github.com/oumiche/impact-auto-plus.git impact-auto

# Changer les permissions
sudo chown -R www-data:www-data /var/www/html/impact-auto
sudo chmod -R 755 /var/www/html/impact-auto
```

### 5. Configuration de l'API Symfony

```bash
# Se placer dans le dossier API
cd /var/www/html/impact-auto/api

# Installer les dépendances Composer
sudo -u www-data composer install --no-dev --optimize-autoloader

# Copier et configurer le fichier .env
sudo cp .env.example .env

# Éditer le fichier .env
sudo nano .env
```

#### Configuration du fichier .env

```env
# Base de données
DATABASE_URL="mysql://impact_auto:votre_mot_de_passe_securise@localhost:3306/impact_auto?serverVersion=8.0.35&charset=utf8mb4"

# Environnement
APP_ENV=prod
APP_SECRET=generer_une_cle_secrete_longue_et_aleatoire

# JWT Configuration
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=votre_passphrase_jwt

# CORS Configuration
CORS_ALLOW_ORIGIN='https://vps114702.serveur-vps.net'

# Mailer (optionnel)
MAILER_DSN=smtp://localhost:1025
```

### 6. Génération des clés JWT

```bash
# Créer le dossier pour les clés JWT
sudo mkdir -p /var/www/html/impact-auto/api/config/jwt

# Générer les clés JWT
sudo openssl genpkey -out /var/www/html/impact-auto/api/config/jwt/private.pem -aes256 -algorithm rsa -pkcs8 -pass pass:votre_passphrase_jwt
sudo openssl pkey -in /var/www/html/impact-auto/api/config/jwt/private.pem -out /var/www/html/impact-auto/api/config/jwt/public.pem -pubout -passin pass:votre_passphrase_jwt

# Changer les permissions
sudo chown www-data:www-data /var/www/html/impact-auto/api/config/jwt/private.pem
sudo chown www-data:www-data /var/www/html/impact-auto/api/config/jwt/public.pem
sudo chmod 644 /var/www/html/impact-auto/api/config/jwt/private.pem
sudo chmod 644 /var/www/html/impact-auto/api/config/jwt/public.pem
```

### 7. Configuration de la base de données

```bash
# Exécuter les migrations
sudo -u www-data php bin/console doctrine:database:create --if-not-exists
sudo -u www-data php bin/console doctrine:migrations:migrate --no-interaction

# Vérifier le statut des migrations
sudo -u www-data php bin/console doctrine:migrations:status
```

### 8. Configuration d'Apache

#### Créer le fichier de configuration Apache

```bash
sudo nano /etc/apache2/sites-available/impact-auto.conf
```

#### Contenu du fichier de configuration

```apache
<VirtualHost *:80>
    ServerName vps114702.serveur-vps.net
    ServerAlias www.vps114702.serveur-vps.net
    DocumentRoot /var/www/html/impact-auto/dist
    
    # Configuration pour l'API Symfony
    <Directory /var/www/html/impact-auto/api/public>
        AllowOverride All
        Require all granted
        
        # Configuration pour Symfony
        DirectoryIndex index.php
        
        # Réécriture d'URL
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    # Alias pour l'API
    Alias /api /var/www/html/impact-auto/api/public
    
    # Configuration pour le frontend
    <Directory /var/www/html/impact-auto/dist>
        AllowOverride All
        Require all granted
        
        # Configuration pour les fichiers statiques
        <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
            ExpiresActive On
            ExpiresDefault "access plus 1 month"
        </FilesMatch>
    </Directory>
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/impact-auto_error.log
    CustomLog ${APACHE_LOG_DIR}/impact-auto_access.log combined
    
    # Sécurité
    ServerTokens Prod
    ServerSignature Off
    
    # Headers de sécurité
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
</VirtualHost>

# Configuration HTTPS (si SSL configuré)
<VirtualHost *:443>
    ServerName vps114702.serveur-vps.net
    ServerAlias www.vps114702.serveur-vps.net
    DocumentRoot /var/www/html/impact-auto/dist
    
    # Configuration SSL (à adapter selon votre certificat)
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Même configuration que HTTP
    <Directory /var/www/html/impact-auto/api/public>
        AllowOverride All
        Require all granted
        DirectoryIndex index.php
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    Alias /api /var/www/html/impact-auto/api/public
    
    <Directory /var/www/html/impact-auto/dist>
        AllowOverride All
        Require all granted
        <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
            ExpiresActive On
            ExpiresDefault "access plus 1 month"
        </FilesMatch>
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/impact-auto_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/impact-auto_ssl_access.log combined
</VirtualHost>
```

### 9. Activation du site et des modules

```bash
# Activer les modules Apache nécessaires
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod expires

# Activer le site
sudo a2ensite impact-auto.conf

# Désactiver le site par défaut (optionnel)
sudo a2dissite 000-default.conf

# Tester la configuration
sudo apache2ctl configtest

# Redémarrer Apache
sudo systemctl restart apache2
```

### 10. Configuration des permissions

```bash
# Permissions pour le dossier API
sudo chown -R www-data:www-data /var/www/html/impact-auto/api/var
sudo chmod -R 775 /var/www/html/impact-auto/api/var

# Permissions pour les logs
sudo chown -R www-data:www-data /var/www/html/impact-auto/api/var/log
sudo chmod -R 775 /var/www/html/impact-auto/api/var/log

# Permissions pour le cache
sudo chown -R www-data:www-data /var/www/html/impact-auto/api/var/cache
sudo chmod -R 775 /var/www/html/impact-auto/api/var/cache
```

### 11. Configuration du firewall (optionnel)

```bash
# Installer et configurer UFW
sudo ufw enable

# Autoriser SSH
sudo ufw allow ssh

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Vérifier le statut
sudo ufw status
```

### 12. Configuration SSL avec Let's Encrypt (recommandé)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-apache -y

# Obtenir le certificat SSL
sudo certbot --apache -d vps114702.serveur-vps.net -d www.vps114702.serveur-vps.net

# Tester le renouvellement automatique
sudo certbot renew --dry-run
```

## 🔧 Configuration Post-Déploiement

### 1. Créer un utilisateur administrateur

```bash
# Se placer dans le dossier API
cd /var/www/html/impact-auto/api

# Créer un utilisateur administrateur (si commande disponible)
sudo -u www-data php bin/console app:create-admin
```

### 2. Configuration des tâches cron (optionnel)

```bash
# Éditer le crontab
sudo crontab -e

# Ajouter les tâches suivantes :
# Nettoyage du cache toutes les heures
0 * * * * cd /var/www/html/impact-auto/api && php bin/console cache:clear --env=prod

# Renouvellement SSL Let's Encrypt (si configuré)
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Configuration des logs

```bash
# Configurer la rotation des logs
sudo nano /etc/logrotate.d/impact-auto
```

Contenu du fichier de rotation :

```
/var/log/apache2/impact-auto*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        /bin/systemctl reload apache2 > /dev/null 2>&1 || true
    endscript
}
```

## 🧪 Tests de Déploiement

### 1. Test de l'API

```bash
# Test de l'endpoint de santé (si disponible)
curl -X GET https://vps114702.serveur-vps.net/api/health

# Test de l'authentification
curl -X POST https://vps114702.serveur-vps.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### 2. Test du Frontend

- Ouvrir https://vps114702.serveur-vps.net/ dans un navigateur
- Vérifier que la page se charge correctement
- Tester la connexion utilisateur

### 3. Test des fonctionnalités principales

- Connexion utilisateur
- Gestion des véhicules
- Création d'interventions
- Gestion des devis et autorisations
- Facturation et rapports de réception

## 🔍 Monitoring et Maintenance

### 1. Surveillance des logs

```bash
# Logs Apache
sudo tail -f /var/log/apache2/impact-auto_error.log
sudo tail -f /var/log/apache2/impact-auto_access.log

# Logs Symfony
sudo tail -f /var/www/html/impact-auto/api/var/log/prod.log
```

### 2. Surveillance des performances

```bash
# Utilisation du disque
df -h

# Utilisation de la mémoire
free -h

# Processus Apache
ps aux | grep apache2

# Connexions MySQL
sudo mysql -e "SHOW PROCESSLIST;"
```

### 3. Sauvegarde de la base de données

```bash
# Script de sauvegarde quotidienne
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u impact_auto -p impact_auto > /backup/impact_auto_$DATE.sql
gzip /backup/impact_auto_$DATE.sql

# Garder seulement les 7 dernières sauvegardes
find /backup -name "impact_auto_*.sql.gz" -mtime +7 -delete
```

## 🚨 Dépannage

### Problèmes courants

1. **Erreur 500 - Internal Server Error**
   ```bash
   # Vérifier les logs Apache
   sudo tail -f /var/log/apache2/error.log
   
   # Vérifier les permissions
   sudo chown -R www-data:www-data /var/www/html/impact-auto
   ```

2. **Erreur de base de données**
   ```bash
   # Vérifier la connexion
   sudo mysql -u impact_auto -p impact_auto
   
   # Vérifier les migrations
   sudo -u www-data php bin/console doctrine:migrations:status
   ```

3. **Problème de cache**
   ```bash
   # Nettoyer le cache
   sudo -u www-data php bin/console cache:clear --env=prod
   
   # Réchauffer le cache
   sudo -u www-data php bin/console cache:warmup --env=prod
   ```

## 📞 Support

En cas de problème, vérifier :
1. Les logs Apache et Symfony
2. Les permissions des fichiers
3. La configuration de la base de données
4. La configuration SSL
5. Les modules Apache activés

---

**Note :** Ce guide suppose que LAMP est déjà installé et configuré sur Ubuntu Server 24.04. Adaptez les chemins et configurations selon votre environnement spécifique.

**Sécurité :** Assurez-vous de changer tous les mots de passe par défaut et de configurer correctement SSL pour la production.
