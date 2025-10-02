# Guide du Système de Login JWT - Impact Auto

## Vue d'ensemble

Ce guide explique le fonctionnement du système de login JWT intégré avec la redirection automatique vers la page de connexion.

## Fichiers impliqués

### Backend (API Symfony)
- `api/src/Controller/SupplyController.php` - Vérifications JWT dans les contrôleurs
- `api/config/packages/security.yaml` - Configuration de sécurité JWT

### Frontend (JavaScript)
- `dist/login.html` - Page de connexion principale
- `dist/js/auth/login.js` - Logique de connexion
- `dist/js/services/ApiService.js` - Service API avec gestion JWT
- `dist/js/auth/auth-guard.js` - Protection globale des pages

## Fonctionnalités du Login

### 1. Page de Login (`login.html`)

#### Interface utilisateur
- Formulaire de connexion avec email/username et mot de passe
- Gestion des erreurs avec messages explicites
- Bouton de déconnexion si l'utilisateur est déjà connecté
- Informations de test intégrées

#### Fonctionnalités
- **Détection d'authentification existante** : Redirige automatiquement si déjà connecté
- **Validation des champs** : Vérification côté client
- **Gestion d'erreurs robuste** : Messages spécifiques selon le type d'erreur
- **Redirection intelligente** : Vers le dashboard ou sélection de tenant

### 2. Logique de Connexion (`login.js`)

#### Méthodes principales

```javascript
// Vérification de l'authentification existante
checkExistingAuth()

// Gestion de la soumission du formulaire
handleSubmit(e)

// Gestion du succès de connexion
handleLoginSuccess(data)

// Déconnexion de l'utilisateur
logout()
```

#### Gestion des erreurs
- **401 Unauthorized** : "Email ou mot de passe incorrect"
- **403 Forbidden** : "Accès refusé. Vérifiez vos permissions"
- **500 Internal Server Error** : "Erreur du serveur. Veuillez réessayer plus tard"
- **Erreurs réseau** : "Erreur de connexion. Vérifiez votre connexion internet"

### 3. Intégration avec AuthGuard

Le système de login s'intègre parfaitement avec l'AuthGuard :

```javascript
// L'AuthGuard vérifie automatiquement l'authentification
// au chargement de chaque page (sauf les pages de login)

// Redirection automatique si pas de token
window.authGuard.forceCheck();
```

## Flux de connexion

### 1. Accès à la page de login
```
Utilisateur → login.html
    ↓
Vérification si déjà connecté
    ↓
Si connecté → Redirection vers dashboard
Si non connecté → Affichage du formulaire
```

### 2. Processus de connexion
```
Saisie des identifiants
    ↓
Validation côté client
    ↓
Appel API /api/login_check
    ↓
Si succès → Stockage du token
    ↓
Redirection vers dashboard/tenant selection
```

### 3. Gestion des erreurs
```
Erreur de connexion
    ↓
Affichage du message d'erreur
    ↓
Formulaire reste accessible
    ↓
Possibilité de réessayer
```

## Configuration

### Identifiants de test
- **Email** : `admin@impact-auto.com`
- **Mot de passe** : `admin123`

### URLs de redirection
- **Dashboard** : `/dashboard-vue.html`
- **Sélection tenant** : `/tenant-selection.html`
- **Login** : `/login.html`

### Délais
- **Redirection après connexion** : 1.5 secondes
- **Redirection si déjà connecté** : 2 secondes
- **Redirection après déconnexion** : 1.5 secondes

## Pages de test

### test-login-jwt.html
Page de test complète pour le système de login :
- Test de connexion avec différents identifiants
- Test d'appels API après connexion
- Simulation d'expiration de token
- Logs détaillés en temps réel

### test-jwt-redirect.html
Page de test pour la redirection JWT :
- Test de l'API sans token
- Test de l'API avec token
- Simulation de connexion/déconnexion

## Utilisation

### 1. Connexion normale
1. Aller sur `/login.html`
2. Saisir les identifiants
3. Cliquer sur "Se connecter"
4. Attendre la redirection automatique

### 2. Test de connexion
1. Aller sur `/test-login-jwt.html`
2. Utiliser les identifiants de test
3. Observer les logs et résultats

### 3. Déconnexion
- **Via le bouton** : Si déjà connecté, un bouton de déconnexion apparaît
- **Via l'API** : `window.apiService.logout()`
- **Via localStorage** : Supprimer `auth_token`

## Sécurité

### Bonnes pratiques implémentées
- Validation côté client ET serveur
- Messages d'erreur génériques (pas d'informations sensibles)
- Suppression complète des données de session
- Vérification de l'authentification avant chaque requête API

### Limitations
- Les tokens sont stockés dans localStorage
- Pas de refresh automatique des tokens
- Pas de chiffrement des données de session

## Dépannage

### Problèmes courants

1. **Connexion échoue toujours**
   - Vérifier que l'API Symfony est démarrée
   - Contrôler les logs du serveur
   - Vérifier les identifiants de test

2. **Redirection en boucle**
   - Vérifier que l'URL de redirection est correcte
   - S'assurer que le token est bien stocké
   - Contrôler les erreurs dans la console

3. **Token non reconnu**
   - Vérifier le format du token JWT
   - Contrôler la configuration de sécurité Symfony
   - S'assurer que le token est envoyé dans les headers

### Debug

```javascript
// Vérifier l'état de l'authentification
console.log('Token:', localStorage.getItem('auth_token'));
console.log('Authentifié:', window.apiService.isAuthenticated());
console.log('User:', localStorage.getItem('current_user'));

// Forcer la vérification
window.authGuard.forceCheck();
```

## Évolutions futures

1. **Refresh Token** : Implémenter un système de refresh automatique
2. **Remember Me** : Gestion de la persistance de session
3. **2FA** : Authentification à deux facteurs
4. **SSO** : Single Sign-On avec d'autres systèmes
5. **Biométrie** : Authentification biométrique (si supportée par le navigateur)
