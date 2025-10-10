# 🔧 Fix JWT Authentication - Instructions de déploiement

## 🚨 Problème identifié
1. **Clés JWT manquantes** sur le serveur de production
2. **Headers Authorization bloqués** par Apache (problème découvert)

Ces deux problèmes causent l'erreur "JWT Token not found".

## ✅ Solution

### 1. Déploiement automatisé (Recommandé)

```bash
# Se connecter au serveur de production
ssh user@iautobackend.zeddev01.com

# Aller dans le répertoire de l'application
cd /var/www/html/impact-auto/backend

# Copier le script de déploiement (depuis votre machine locale)
# ou le créer directement sur le serveur

# Exécuter le script de déploiement
chmod +x scripts/deploy-jwt-fix.sh
./scripts/deploy-jwt-fix.sh
```

### 2. Déploiement manuel (Alternative)

```bash
# Se connecter au serveur de production
ssh user@iautobackend.zeddev01.com

# Aller dans le répertoire de l'application
cd /var/www/html/impact-auto/backend

# Créer le répertoire JWT
mkdir -p config/jwt

# Générer la clé privée
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096 -pass pass:02e86590fec76a48fbd3039b731c37bee3e8fd9dc8e347e6643c6c2e1426982a

# Générer la clé publique
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout -passin pass:02e86590fec76a48fbd3039b731c37bee3e8fd9dc8e347e6643c6c2e1426982a

# Définir les permissions
chmod 600 config/jwt/private.pem
chmod 644 config/jwt/public.pem
```

### 3. Configurer les variables d'environnement

Ajouter dans le fichier `.env` du serveur (le script automatisé le fait automatiquement) :

```bash
# JWT Configuration
JWT_SECRET_KEY=/var/www/html/impact-auto/backend/config/jwt/private.pem
JWT_PUBLIC_KEY=/var/www/html/impact-auto/backend/config/jwt/public.pem
JWT_PASSPHRASE=impact-auto-jwt-passphrase
```

**Important** : Utiliser le **chemin absolu** et non `%kernel.project_dir%` pour éviter les problèmes de résolution de chemin.

### 4. Redémarrer le serveur

```bash
# Redémarrer PHP-FPM ou le serveur web
sudo systemctl restart php*-fpm
sudo systemctl restart nginx
```

### 5. Vérifier la configuration

Tester l'endpoint de debug : `https://iautobackend.zeddev01.com/api/tenants/debug-jwt`

Devrait retourner :
```json
{
  "success": true,
  "jwt_config": {
    "secret_key_exists": "YES",
    "public_key_exists": "YES",
    "passphrase_set": "YES"
  }
}
```

## 🧪 6. Test final

### 6. Fix Apache pour les headers Authorization

```bash
# Se connecter au serveur de production
ssh user@iautobackend.zeddev01.com

# Aller dans le répertoire de l'application
cd /var/www/html/impact-auto/backend

# Exécuter le script de fix Apache
chmod +x scripts/fix-apache-headers.sh
./scripts/fix-apache-headers.sh
```

### 7. Test final

Après déploiement, tester la connexion complète :
1. Se connecter avec `admin@impactauto.com`
2. Vérifier que `/api/tenants` fonctionne
3. Confirmer l'affichage des tenants

## 📝 Notes

- **Passphrase** : `impact-auto-jwt-passphrase`
- **Algorithme** : RSA 4096 bits
- **Permissions** : Clé privée 600, clé publique 644
