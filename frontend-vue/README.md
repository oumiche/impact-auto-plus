# Impact Auto Plus - Frontend Vue.js

Application frontend moderne construite avec Vue.js 3, Vue Router et Pinia.

## 🚀 Technologies

- **Vue.js 3** - Framework JavaScript progressif
- **Vue Router 4** - Routing côté client
- **Pinia** - Gestion d'état
- **Axios** - Client HTTP
- **Vite** - Build tool ultra-rapide
- **Sass** - Préprocesseur CSS

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

## 🏗️ Structure du projet

```
src/
├── views/              # Pages (routes)
│   ├── auth/          # Pages d'authentification
│   ├── Dashboard.vue
│   ├── Garages.vue
│   ├── Vehicles.vue
│   ├── Supplies.vue
│   └── Users.vue
├── components/         # Composants réutilisables
├── stores/            # Stores Pinia
│   ├── auth.js
│   └── tenant.js
├── services/          # Services API
│   └── api.service.js
├── router/            # Configuration des routes
│   └── index.js
└── assets/            # Assets statiques
    └── styles/
```

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env.development` :

```bash
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Impact Auto Plus
VITE_APP_ENV=development
```

Créer un fichier `.env.production` :

```bash
VITE_API_URL=https://iautobackend.zeddev01.com/api
VITE_APP_NAME=Impact Auto Plus
VITE_APP_ENV=production
```

## 🚦 Routes

- `/login` - Page de connexion
- `/tenant-selection` - Sélection de l'organisation
- `/dashboard` - Tableau de bord
- `/garages` - Gestion des garages
- `/vehicles` - Gestion des véhicules
- `/supplies` - Gestion des fournitures
- `/users` - Gestion des utilisateurs (admin)

## 🔐 Authentification

L'authentification est gérée via JWT (JSON Web Token).

Le token est stocké dans `localStorage` et automatiquement ajouté aux requêtes API via un intercepteur Axios.

## 📝 Développement

### Ajouter une nouvelle page

1. Créer le composant dans `src/views/`
2. Ajouter la route dans `src/router/index.js`
3. Configurer les guards de navigation si nécessaire

### Ajouter un nouveau store

1. Créer le fichier dans `src/stores/`
2. Utiliser `defineStore` de Pinia
3. Importer et utiliser dans les composants

## 🚀 Déploiement

```bash
# Build de production
npm run build

# Les fichiers sont générés dans le dossier dist/
# Déployer le contenu de dist/ sur le serveur
```

## 📚 Documentation

Voir `docs/MIGRATION_VUE_JS.md` pour plus de détails sur la migration et l'architecture.

## 🤝 Contribution

1. Créer une branche pour votre fonctionnalité
2. Commiter vos changements
3. Créer une Pull Request

## 📄 Licence

Propriétaire - Impact Auto Plus

