# Système de Notifications Centralisé - Impact Auto

## Vue d'ensemble

Le système de notifications centralisé permet d'afficher des notifications cohérentes et élégantes dans toute l'application Impact Auto. Il est basé sur un service JavaScript et un mixin Vue.js pour faciliter l'utilisation.

## Fichiers du système

- `js/notification-service.js` - Service principal de gestion des notifications
- `js/components/NotificationMixin.js` - Mixin Vue.js pour faciliter l'utilisation
- `js/app-includes.js` - Inclut automatiquement les fichiers nécessaires

## Utilisation dans les composants Vue

### Option 1: Fonctions globales (Recommandé)

Les fonctions de notification sont disponibles globalement et peuvent être utilisées directement :

```javascript
// Dans n'importe quel composant Vue
window.notifySuccess('Opération réussie !');
window.notifyError('Une erreur est survenue');
window.notifyApiError(error, 'Erreur de chargement');
```

### Option 2: Méthodes dans le composant

Ajoutez les méthodes de notification directement dans vos composants :

```javascript
const MonComposant = {
    methods: {
        // ... autres méthodes
        
        // Méthodes de notification
        $notifySuccess(message, options = {}) {
            return window.notifySuccess(message, options);
        },
        
        $notifyError(message, options = {}) {
            return window.notifyError(message, options);
        },
        
        $notifyApiError(error, defaultMessage = 'Une erreur est survenue') {
            return window.notifyApiError(error, defaultMessage);
        }
    }
};
```

### Option 3: Utiliser le mixin (si compatible)

```javascript
const MonComposant = {
    mixins: [window.NotificationMixin],
    // ... reste du composant
};
```

### 2. Utiliser les méthodes de notification

#### Notifications simples
```javascript
// Avec les fonctions globales (recommandé)
window.notifySuccess('Opération réussie !');
window.notifyError('Une erreur est survenue');
window.notifyWarning('Attention, vérifiez vos données');
window.notifyInfo('Information importante');

// Ou avec les méthodes du composant
this.$notifySuccess('Opération réussie !');
this.$notifyError('Une erreur est survenue');
this.$notifyWarning('Attention, vérifiez vos données');
this.$notifyInfo('Information importante');
```

#### Notifications avec options
```javascript
// Avec les fonctions globales
window.notifySuccess('Sauvegardé !', { duration: 3000 });
window.notifyError('Erreur critique', { closable: false });
window.notifyInfo('Chargement...', { progress: false });
window.notify('Message', 'info', { icon: 'fas fa-star' });

// Ou avec les méthodes du composant
this.$notifySuccess('Sauvegardé !', { duration: 3000 });
this.$notifyError('Erreur critique', { closable: false });
this.$notifyInfo('Chargement...', { progress: false });
this.$notify('Message', 'info', { icon: 'fas fa-star' });
```

#### Gestion des erreurs API
```javascript
try {
    const response = await window.apiService.request('/api/data');
    window.notifyApiSuccess('Données chargées avec succès');
    // ou this.$notifyApiSuccess('Données chargées avec succès');
} catch (error) {
    // Gère automatiquement les différents types d'erreurs
    window.notifyApiError(error, 'Erreur lors du chargement');
    // ou this.$notifyApiError(error, 'Erreur lors du chargement');
}
```

### 3. Contrôle des notifications

```javascript
// Supprimer une notification spécifique
const notificationId = this.$notifyInfo('Message temporaire');
this.$removeNotification(notificationId);

// Supprimer toutes les notifications
this.$clearNotifications();
```

## Utilisation directe du service (sans Vue)

```javascript
// Accès direct au service
window.notificationService.success('Message de succès');
window.notificationService.error('Message d\'erreur');
window.notificationService.warning('Message d\'avertissement');
window.notificationService.info('Message d\'information');

// Avec options
window.notificationService.show('Message', 'success', {
    duration: 5000,
    closable: true,
    progress: true,
    icon: 'fas fa-check'
});

// Suppression
window.notificationService.remove(notificationId);
window.notificationService.removeAll();
```

## Options disponibles

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `duration` | number | 5000 | Durée d'affichage en millisecondes (0 = permanent) |
| `closable` | boolean | true | Permet de fermer la notification manuellement |
| `progress` | boolean | true | Affiche une barre de progression |
| `icon` | string | auto | Icône personnalisée (classe Font Awesome) |

## Types de notifications

- **success** : Vert, icône check-circle
- **error** : Rouge, icône exclamation-circle
- **warning** : Jaune, icône exclamation-triangle
- **info** : Bleu, icône info-circle

## Styles et animations

Le système inclut automatiquement :
- Animations d'entrée et de sortie fluides
- Design responsive pour mobile
- Barre de progression animée
- Effets de transparence et ombres
- Position fixe en haut à droite

## Configuration globale

Le service peut être configuré via ses propriétés :

```javascript
// Modifier la durée par défaut
window.notificationService.defaultDuration = 3000;

// Modifier le nombre maximum de notifications
window.notificationService.maxNotifications = 3;
```

## Bonnes pratiques

1. **Utilisez les méthodes du mixin** plutôt que le service direct dans les composants Vue
2. **Préférez `$notifyApiError`** pour les erreurs d'API (gestion automatique des formats d'erreur)
3. **Utilisez des messages clairs et concis**
4. **Ne surchargez pas l'utilisateur** avec trop de notifications simultanées
5. **Utilisez des durées appropriées** selon l'importance du message

## Migration depuis l'ancien système

Si vous avez des composants utilisant l'ancienne méthode `showNotification`, remplacez :

```javascript
// Ancien
this.showNotification('Message', 'success');

// Nouveau
this.$notifySuccess('Message');
```

## Dépannage

### Les notifications ne s'affichent pas
- Vérifiez que `notification-service.js` est chargé
- Vérifiez que le mixin est ajouté au composant
- Consultez la console pour les erreurs JavaScript

### Styles incorrects
- Vérifiez que `app-includes.js` est chargé
- Les styles sont injectés automatiquement par le service

### Notifications qui se chevauchent
- Le système limite automatiquement le nombre de notifications
- Les plus anciennes sont supprimées automatiquement
