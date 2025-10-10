#!/bin/bash

# Script pour corriger la configuration Virtual Host Apache
echo "🔧 Correction de la configuration Virtual Host Apache..."

# Aller dans le répertoire backend
cd /var/www/html/impact-auto/backend

echo "📁 Répertoire courant: $(pwd)"

# 1. Sauvegarder la configuration actuelle
echo "💾 Sauvegarde de la configuration actuelle..."
sudo cp /etc/apache2/sites-available/iautobackend.zeddev01.conf /etc/apache2/sites-available/iautobackend.zeddev01.conf.backup
echo "✅ Configuration sauvegardée"

# 2. Créer la nouvelle configuration Virtual Host
echo "📄 Création de la nouvelle configuration Virtual Host..."
sudo tee /etc/apache2/sites-available/iautobackend.zeddev01.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName iautobackend.zeddev01.com
    ServerAlias www.iautobackend.zeddev01.com
    ServerAdmin contact@zeddev01.com
    DocumentRoot /var/www/html/impact-auto/backend/public

    <Directory /var/www/html/impact-auto/backend/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        FallbackResource /index.php
    </Directory>

    # 🔑 FIX JWT - Configuration pour les headers Authorization
    SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
    
    # 🌐 CORS géré par Symfony (nelmio_cors) - pas de duplication

    ErrorLog ${APACHE_LOG_DIR}/iautobackend.zeddev01.com-error.log
    CustomLog ${APACHE_LOG_DIR}/iautobackend.zeddev01.com-access.log combined

    # Sécurité
    # ServerTokens Prod
    # ServerSignature Off
    
    # Headers de sécurité
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
</VirtualHost>
EOF

echo "✅ Nouvelle configuration Virtual Host créée"

# 3. Activer les modules Apache nécessaires
echo "🔧 Activation des modules Apache..."
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod env
echo "✅ Modules Apache activés"

# 4. Tester la configuration Apache
echo "🧪 Test de la configuration Apache..."
sudo apache2ctl configtest
if [ $? -eq 0 ]; then
    echo "✅ Configuration Apache valide"
else
    echo "❌ Erreur dans la configuration Apache"
    echo "🔄 Restauration de la configuration précédente..."
    sudo cp /etc/apache2/sites-available/iautobackend.zeddev01.conf.backup /etc/apache2/sites-available/iautobackend.zeddev01.conf
    exit 1
fi

# 5. Redémarrer Apache
echo "🔄 Redémarrage d'Apache..."
sudo systemctl restart apache2
if [ $? -eq 0 ]; then
    echo "✅ Apache redémarré avec succès"
else
    echo "❌ Erreur lors du redémarrage d'Apache"
    exit 1
fi

echo ""
echo "🎉 Configuration Virtual Host Apache corrigée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Tester l'endpoint de debug : https://iautobackend.zeddev01.com/api/tenants/debug-jwt"
echo "2. Vérifier que authorization_present: 'YES'"
echo "3. Tester la connexion complète"
echo ""
echo "🔍 Si le problème persiste, vérifier :"
echo "- Les logs Apache : sudo tail -f /var/log/apache2/error.log"
echo "- Les modules Apache : sudo apache2ctl -M | grep -E '(rewrite|headers|env)'"
