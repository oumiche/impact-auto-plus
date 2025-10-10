# Système de Confirmations Centralisé - Impact Auto

## Vue d'ensemble

Le système de confirmations centralisé permet d'afficher des boîtes de confirmation cohérentes et professionnelles dans toute l'application Impact Auto. Il est basé sur un service JavaScript et un mixin Vue.js pour faciliter l'utilisation.

## Fichiers du système

- `js/confirmation-service.js` - Service principal de gestion des confirmations
- `js/components/ConfirmationMixin.js` - Mixin Vue.js pour faciliter l'utilisation
- `js/app-includes.js` - Inclut automatiquement les fichiers nécessaires

## Utilisation dans les composants Vue

### Option 1: Fonctions globales (Recommandé)

Les fonctions de confirmation sont disponibles globalement et peuvent être utilisées directement :

```javascript
// Dans n'importe quel composant Vue
const confirmed = await window.confirmWarning({
    title: 'Avertissement',
    message: 'Êtes-vous sûr de vouloir continuer ?'
});

if (confirmed) {
    // Action confirmée
}
```

### Option 2: Méthodes dans le composant

Ajoutez les méthodes de confirmation directement dans vos composants :

```javascript
const MonComposant = {
    methods: {
        // ... autres méthodes
        
        async deleteItem(item) {
            const confirmed = await this.$confirmDelete(item.name);
            if (confirmed) {
                // Supprimer l'élément
            }
        }
    }
};
```

### Option 3: Utiliser le mixin (si compatible)

```javascript
const MonComposant = {
    mixins: [window.ConfirmationMixin],
    // ... reste du composant
};
```

## Types de confirmations

### Confirmations de base

```javascript
// Avertissement (défaut)
const confirmed = await window.confirmWarning({
    title: 'Avertissement',
    message: 'Cette action peut avoir des conséquences.'
});

// Danger
const confirmed = await window.confirmDanger({
    title: 'Action dangereuse',
    message: 'Cette action est risquée.'
});

// Information
const confirmed = await window.confirmInfo({
    title: 'Information',
    message: 'Voulez-vous continuer ?'
});

// Succès
const confirmed = await window.confirmSuccess({
    title: 'Confirmation',
    message: 'L\'opération s\'est bien déroulée.'
});

// Destructive (pour les suppressions)
const confirmed = await window.confirmDestructive({
    title: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    details: {
        title: 'Attention',
        content: 'Cette action est irréversible.'
    }
});
```

### Fonctions utilitaires

```javascript
// Suppression avec détails automatiques
const confirmed = await window.confirmDelete('Nom de l\'élément');

// Modification
const confirmed = await window.confirmEdit('Nom de l\'élément');

// Action personnalisée
const confirmed = await window.confirmAction('Archiver', 'Nom de l\'élément');
```

## Options disponibles

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `title` | string | 'Confirmation' | Titre de la confirmation |
| `message` | string | 'Êtes-vous sûr de vouloir continuer ?' | Message principal |
| `type` | string | 'warning' | Type de confirmation (warning, danger, info, success) |
| `destructive` | boolean | false | Si la confirmation est destructive |
| `details` | object | null | Détails supplémentaires |
| `details.title` | string | null | Titre des détails |
| `details.content` | string | null | Contenu des détails |
| `buttons` | object | {} | Configuration des boutons |
| `buttons.confirm` | string | 'Confirmer' | Texte du bouton de confirmation |
| `buttons.cancel` | string | 'Annuler' | Texte du bouton d'annulation |

## Exemples d'utilisation

### Suppression d'un élément

```javascript
async deleteIntervention(intervention) {
    const confirmed = await window.confirmDestructive({
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer l'intervention "${intervention.title}" ?`,
        details: {
            title: 'Détails',
            content: `Véhicule: ${intervention.vehicle.plateNumber}`
        },
        buttons: {
            confirm: 'Supprimer',
            cancel: 'Annuler'
        }
    });

    if (confirmed) {
        await this.performDelete(intervention);
    }
}
```

### Modification avec avertissement

```javascript
async modifySettings() {
    const confirmed = await window.confirmWarning({
        title: 'Modification des paramètres',
        message: 'Ces modifications affecteront tous les utilisateurs.',
        details: {
            title: 'Impact',
            content: '• Tous les utilisateurs seront déconnectés\n• Les configurations seront réinitialisées'
        }
    });

    if (confirmed) {
        await this.saveSettings();
    }
}
```

### Confirmation avec détails complexes

```javascript
async executeComplexOperation() {
    const confirmed = await window.confirm({
        title: 'Opération critique',
        message: 'Cette opération va affecter plusieurs systèmes.',
        type: 'danger',
        details: {
            title: 'Systèmes concernés',
            content: '• Base de données principale\n• Système de sauvegarde\n• Interface utilisateur'
        },
        buttons: {
            confirm: 'Exécuter',
            cancel: 'Annuler'
        }
    });

    if (confirmed) {
        await this.executeOperation();
    }
}
```

## Gestion des promesses

Toutes les fonctions de confirmation retournent une Promise qui se résout avec un booléen :

```javascript
// Avec async/await (recommandé)
async handleAction() {
    const confirmed = await window.confirmWarning({
        message: 'Continuer ?'
    });
    
    if (confirmed) {
        // Action confirmée
    } else {
        // Action annulée
    }
}

// Avec .then()
window.confirmWarning({
    message: 'Continuer ?'
}).then(confirmed => {
    if (confirmed) {
        // Action confirmée
    }
});
```

## Styles et animations

Le système inclut automatiquement :
- Design professionnel avec fond blanc et bordures colorées
- Animations fluides d'entrée et de sortie
- Design responsive pour mobile
- Icônes colorées selon le type
- Boutons avec états hover
- Support du clavier (Escape pour fermer)

## Types et couleurs

- **Warning** : Orange, icône triangle d'exclamation
- **Danger** : Rouge, icône cercle d'exclamation  
- **Info** : Bleu, icône cercle d'information
- **Success** : Vert, icône cercle de validation
- **Destructive** : Rouge avec style spécial pour les suppressions

## Bonnes pratiques

1. **Utilisez le bon type** selon la gravité de l'action
2. **Ajoutez des détails** pour les actions importantes
3. **Utilisez des textes clairs** pour les boutons
4. **Préférez `confirmDestructive`** pour les suppressions
5. **Utilisez les fonctions utilitaires** quand approprié
6. **Gérez les promesses** avec async/await

## Migration depuis l'ancien système

Si vous avez des composants utilisant des modals de confirmation personnalisées :

```javascript
// Ancien
this.showDeleteModal = true;
// ... gestion de la modal

// Nouveau
const confirmed = await window.confirmDelete('Nom de l\'élément');
if (confirmed) {
    // Action
}
```

## Dépannage

### Les confirmations ne s'affichent pas
- Vérifiez que `confirmation-service.js` est chargé
- Vérifiez que vous utilisez `await` avec les fonctions
- Consultez la console pour les erreurs JavaScript

### Styles incorrects
- Vérifiez que `app-includes.js` est chargé
- Les styles sont injectés automatiquement par le service

### Promesses qui ne se résolvent pas
- Vérifiez que vous utilisez `await` ou `.then()`
- Assurez-vous que la fonction est `async` si vous utilisez `await`
