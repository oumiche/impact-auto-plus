# Serveur de Développement Filegator

## Démarrage rapide

### Option 1: Script automatique (recommandé)
```bash
# Double-clic sur le fichier start.bat
# ou en ligne de commande:
start.bat
```

### Option 2: Commandes npm
```bash
# Installer les dépendances (première fois seulement)
npm install

# Démarrer le serveur
npm run dev    # avec live-server (rechargement automatique)
npm start      # avec http-server (plus simple)
```

### Option 3: Commandes directes
```bash
# Avec http-server
npx http-server -p 8080 -o -c-1 --cors

# Avec live-server (rechargement automatique)
npx live-server --port=8080 --cors
```

## URLs disponibles

- **Dashboard Vue.js**: http://localhost:8080/dashboard-vue-classic.html
- **Paramètres Vue.js**: http://localhost:8080/parametres-vue-simple.html
- **Login**: http://localhost:8080/login.html
- **Test serveur**: http://localhost:8080/test-server.html
- **Index**: http://localhost:8080/index.html

## Fonctionnalités

- ✅ **CORS activé** pour les requêtes API
- ✅ **Cache désactivé** (`-c-1`) pour le développement
- ✅ **Ouverture automatique** du navigateur (`-o`)
- ✅ **Support des modules ES6** (.mjs, .vue)
- ✅ **Types MIME corrects** pour tous les fichiers

## Production

En production, utilisez Apache ou Nginx avec le fichier `.htaccess` fourni qui configure :
- Types MIME pour Vue.js et modules ES6
- Headers CORS
- Cache et compression
- Redirection des erreurs

## Dépannage

Si le port 8080 est occupé :
```bash
# Vérifier les processus
netstat -an | findstr :8080

# Arrêter les processus Node.js
taskkill /f /im node.exe

# Utiliser un autre port
npx http-server -p 8081 -o -c-1 --cors
```
