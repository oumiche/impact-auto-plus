#!/bin/bash

# Script pour corriger la configuration Apache pour les headers JWT
echo "🔧 Correction de la configuration Apache pour les headers Authorization..."

# Aller dans le répertoire backend
cd /var/www/html/impact-auto/backend

echo "📁 Répertoire courant: $(pwd)"

# 1. Créer le fichier .htaccess dans public/
echo "📄 Création du fichier .htaccess..."
cat > public/.htaccess << 'EOF'
# Configuration Apache pour Impact Auto
RewriteEngine On

# Permettre les headers Authorization
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]

# Headers CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, Accept, X-Requested-With, Origin"
Header always set Access-Control-Allow-Credentials "true"

# Gestion des requêtes OPTIONS (preflight)
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Redirection vers index.php pour Symfony
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
EOF

echo "✅ Fichier .htaccess créé dans public/"

# 2. Vérifier les modules Apache nécessaires
echo "🔍 Vérification des modules Apache..."
if command -v apache2ctl &> /dev/null; then
    echo "📋 Modules Apache nécessaires :"
    echo "- mod_rewrite (pour les redirections)"
    echo "- mod_headers (pour les headers CORS)"
    echo ""
    echo "Pour activer les modules :"
    echo "sudo a2enmod rewrite"
    echo "sudo a2enmod headers"
    echo "sudo systemctl restart apache2"
else
    echo "⚠️  Apache2ctl non trouvé - vérification manuelle nécessaire"
fi

# 3. Vérifier les permissions
echo "🔐 Vérification des permissions..."
chmod 644 public/.htaccess
echo "✅ Permissions du fichier .htaccess configurées"

# 4. Redémarrer Apache
echo "🔄 Redémarrage d'Apache..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart apache2
    echo "✅ Apache redémarré"
else
    echo "⚠️  systemctl non disponible - redémarrage manuel d'Apache nécessaire"
fi

echo ""
echo "🎉 Configuration Apache terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Tester l'endpoint de debug : https://iautobackend.zeddev01.com/api/tenants/debug-jwt"
echo "2. Vérifier que authorization_present: 'YES'"
echo "3. Tester la connexion complète"
echo ""
echo "🔍 Si le problème persiste, vérifier :"
echo "- Les modules Apache (rewrite, headers)"
echo "- La configuration du Virtual Host"
echo "- Les logs d'Apache (/var/log/apache2/error.log)"
