#!/bin/bash

# Script pour générer les clés JWT sur le serveur de production
echo "🔑 Génération des clés JWT..."

# Aller dans le répertoire backend
cd /var/www/html/impact-auto/backend

# Créer le répertoire s'il n'existe pas
mkdir -p config/jwt

# Générer la clé privée
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096 -pass pass:impact-auto-jwt-passphrase

# Générer la clé publique
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout -passin pass:impact-auto-jwt-passphrase

# Définir les permissions
chmod 600 config/jwt/private.pem
chmod 644 config/jwt/public.pem

echo "✅ Clés JWT générées avec succès !"
echo "📁 Clé privée: config/jwt/private.pem"
echo "📁 Clé publique: config/jwt/public.pem"
echo "🔐 Passphrase: impact-auto-jwt-passphrase"
