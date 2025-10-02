# Guide de Redirection JWT - Impact Auto

## Vue d'ensemble

Ce guide explique comment implémenter la redirection automatique vers la page de login quand le JWT Token n'est pas trouvé ou est expiré.

## Fonctionnalités implémentées

### 1. Backend (API Symfony)

#### SupplyController.php
- Vérification JWT dans toutes les méthodes admin
- Retour d'erreur 401 avec message explicite quand le token est manquant
- Message d'erreur standardisé : "JWT Token not found. Please login to access this resource."

#### Configuration de sécurité
- Le firewall API est configuré pour utiliser JWT
- Les routes `/api` nécessitent une authentification complète
- Les routes de login sont publiques

### 2. Frontend (JavaScript)

#### ApiService.js
- **handleAuthError()** : Gère les erreurs d'authentification
  - Supprime le token expiré du localStorage
  - Affiche une notification à l'utilisateur
  - Redirige automatiquement vers `/login-simple.html` après 2 secondes

- **checkTokenValidity()** : Vérifie la présence du token
- **validateTokenBeforeRequest()** : Valide le token avant chaque requête API
- **isAuthenticated()** : Vérifie l'état d'authentification

#### AuthGuard.js
- **AuthGuard** : Classe de protection globale
  - Vérifie l'authentification au chargement de chaque page
  - Écoute les changements de localStorage
  - Redirige automatiquement si l'utilisateur n'est pas authentifié
  - Ignore les pages de login

## Utilisation

### 1. Intégration dans une page

```html
<!-- Inclure les scripts nécessaires -->
<script src="js/services/ApiService.js"></script>
<script src="js/auth/auth-guard.js"></script>
```

L'AuthGuard se charge automatiquement et protège la page.

### 2. Vérification manuelle

```javascript
// Vérifier si l'utilisateur est authentifié
if (window.apiService.isAuthenticated()) {
    // L'utilisateur est connecté
} else {
    // L'utilisateur n'est pas connecté
}

// Forcer la vérification
window.authGuard.forceCheck();
```

### 3. Gestion des erreurs dans les composants Vue.js

```javascript
// Dans un composant Vue.js
async loadData() {
    try {
        const data = await window.apiService.getUsers();
        // Traiter les données
    } catch (error) {
        // L'ApiService gère automatiquement la redirection
        console.error('Erreur:', error.message);
    }
}
```

## Pages de test

### test-jwt-redirect.html
Page de test complète pour vérifier le fonctionnement :
- Test de l'API sans token
- Test de l'API avec token
- Simulation de connexion/déconnexion
- Logs en temps réel

## Messages d'erreur

### Backend
- **401 Unauthorized** : "JWT Token not found. Please login to access this resource."
- **403 Forbidden** : "Access denied to tenant"
- **500 Internal Server Error** : Erreurs de serveur

### Frontend
- **Token manquant** : "Aucun token d'authentification trouvé. Redirection vers la page de connexion..."
- **Token expiré** : "Session expirée. Redirection vers la page de connexion..."
- **Erreur API** : Messages d'erreur spécifiques selon le contexte

## Configuration

### URLs de redirection
- Page de login par défaut : `/login-simple.html`
- Délai de redirection : 2 secondes
- Notification d'erreur : 5 secondes

### Pages exclues de la vérification
- Pages contenant "login" dans l'URL
- Pages contenant "auth" dans l'URL
- Page d'accueil (`/` ou `/index.html`)

## Dépannage

### Problèmes courants

1. **Redirection en boucle**
   - Vérifier que la page de login est bien exclue de la vérification
   - S'assurer que l'URL de redirection est correcte

2. **Token non supprimé**
   - Vérifier que `localStorage.removeItem('auth_token')` est appelé
   - Nettoyer aussi `current_user` et `current_tenant`

3. **Notifications non affichées**
   - Vérifier que les styles CSS sont chargés
   - Contrôler la console pour les erreurs JavaScript

### Debug

```javascript
// Activer les logs de debug
console.log('Token actuel:', localStorage.getItem('auth_token'));
console.log('Authentifié:', window.apiService.isAuthenticated());
console.log('AuthGuard actif:', !!window.authGuard);
```

## Sécurité

### Bonnes pratiques
- Toujours vérifier l'authentification côté serveur
- Ne pas faire confiance uniquement au frontend
- Utiliser HTTPS en production
- Implémenter un refresh token si nécessaire

### Limitations
- Les tokens JWT sont stockés dans localStorage (vulnérable aux attaques XSS)
- Pas de refresh automatique des tokens expirés
- Redirection basique sans gestion d'état complexe

## Évolutions futures

1. **Refresh Token** : Implémenter un système de refresh automatique
2. **Session Storage** : Utiliser sessionStorage au lieu de localStorage
3. **Intercepteurs** : Ajouter des intercepteurs pour toutes les requêtes
4. **Gestion d'état** : Intégrer avec un système de gestion d'état global
5. **Notifications avancées** : Améliorer le système de notifications
