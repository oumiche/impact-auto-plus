#!/bin/bash

# Script de déploiement du fix JWT
echo "🚀 Déploiement du fix JWT pour Impact Auto..."

# Aller dans le répertoire backend
cd /var/www/html/impact-auto/backend

echo "📁 Répertoire courant: $(pwd)"

# 1. Créer le répertoire JWT
echo "📂 Création du répertoire JWT..."
mkdir -p config/jwt

# 2. Générer les clés JWT
echo "🔑 Génération des clés JWT..."

# Générer la clé privée
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096 -pass pass:impact-auto-jwt-passphrase

# Générer la clé publique
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout -passin pass:impact-auto-jwt-passphrase

# 3. Définir les permissions
echo "🔐 Configuration des permissions..."
chmod 600 config/jwt/private.pem
chmod 644 config/jwt/public.pem

# 4. Vérifier que les fichiers existent
echo "✅ Vérification des clés générées..."
if [ -f "config/jwt/private.pem" ] && [ -f "config/jwt/public.pem" ]; then
    echo "✅ Clés JWT générées avec succès !"
    echo "📁 Clé privée: config/jwt/private.pem"
    echo "📁 Clé publique: config/jwt/public.pem"
    echo "🔐 Passphrase: impact-auto-jwt-passphrase"
else
    echo "❌ Erreur lors de la génération des clés JWT"
    exit 1
fi

# 5. Vérifier le fichier .env
echo "🔧 Vérification de la configuration .env..."
if [ -f ".env" ]; then
    echo "📄 Fichier .env trouvé"
    
    # Ajouter les variables JWT si elles n'existent pas
    if ! grep -q "JWT_SECRET_KEY" .env; then
        echo "➕ Ajout des variables JWT au fichier .env..."
        echo "" >> .env
        echo "# JWT Configuration" >> .env
        echo "JWT_SECRET_KEY=/var/www/html/impact-auto/backend/config/jwt/private.pem" >> .env
        echo "JWT_PUBLIC_KEY=/var/www/html/impact-auto/backend/config/jwt/public.pem" >> .env
        echo "JWT_PASSPHRASE=impact-auto-jwt-passphrase" >> .env
        echo "✅ Variables JWT ajoutées au fichier .env"
    else
        echo "✅ Variables JWT déjà présentes dans .env"
        echo "🔄 Mise à jour des chemins JWT vers les chemins absolus..."
        # Remplacer les chemins relatifs par les chemins absolus
        sed -i 's|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=/var/www/html/impact-auto/backend/config/jwt/private.pem|g' .env
        sed -i 's|JWT_PUBLIC_KEY=.*|JWT_PUBLIC_KEY=/var/www/html/impact-auto/backend/config/jwt/public.pem|g' .env
        sed -i 's|JWT_PASSPHRASE=.*|JWT_PASSPHRASE=impact-auto-jwt-passphrase|g' .env
        echo "✅ Chemins JWT mis à jour"
    fi
else
    echo "⚠️  Fichier .env non trouvé - création..."
    cat > .env << EOF
# JWT Configuration
JWT_SECRET_KEY=/var/www/html/impact-auto/backend/config/jwt/private.pem
JWT_PUBLIC_KEY=/var/www/html/impact-auto/backend/config/jwt/public.pem
JWT_PASSPHRASE=impact-auto-jwt-passphrase
EOF
    echo "✅ Fichier .env créé avec la configuration JWT"
fi

# 6. Nettoyer le cache Symfony
echo "🧹 Nettoyage du cache Symfony..."
if command -v php &> /dev/null; then
    php bin/console cache:clear --env=prod --no-debug
    echo "✅ Cache Symfony nettoyé"
else
    echo "⚠️  PHP non trouvé - nettoyage manuel du cache nécessaire"
fi

# 7. Redémarrer les services
echo "🔄 Redémarrage des services..."
if command -v systemctl &> /dev/null; then
    # Redémarrer PHP-FPM
    if systemctl is-active --quiet php*-fpm; then
        sudo systemctl restart php*-fpm
        echo "✅ PHP-FPM redémarré"
    fi
    
    # Redémarrer Nginx
    if systemctl is-active --quiet nginx; then
        sudo systemctl restart nginx
        echo "✅ Nginx redémarré"
    fi
else
    echo "⚠️  systemctl non disponible - redémarrage manuel des services nécessaire"
fi

echo ""
echo "🎉 Déploiement du fix JWT terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Tester l'endpoint de debug : https://iautobackend.zeddev01.com/api/tenants/debug-jwt"
echo "2. Tester la connexion complète depuis le frontend"
echo "3. Vérifier que l'erreur 'JWT Token not found' est résolue"
echo ""
echo "🔍 En cas de problème, vérifier :"
echo "- Les permissions des fichiers JWT (600 pour private.pem, 644 pour public.pem)"
echo "- Les variables d'environnement dans .env"
echo "- Les logs du serveur web"
