# Guide des Styles Unifiés pour Tableaux

## Vue d'ensemble

Le fichier `css/unified-tables.css` fournit un système de styles unifié pour tous les tableaux de l'application Impact Auto. Cela garantit une cohérence visuelle et une maintenance simplifiée.

## Classes Principales

### Conteneur de Tableau
```html
<div class="data-table-container">
    <table class="data-table">
        <!-- Contenu du tableau -->
    </table>
</div>
```

### Boutons d'Action
```html
<div class="table-actions">
    <button class="btn btn-primary btn-sm">Modifier</button>
    <button class="btn btn-success btn-sm">Approuver</button>
    <button class="btn btn-danger btn-sm">Supprimer</button>
</div>
```

### Badges de Statut
```html
<span class="status-badge status-approved">Approuvé</span>
<span class="status-badge status-pending">En attente</span>
<span class="status-badge status-expired">Expiré</span>
```

### Codes d'Entité
```html
<code class="entity-code">QUO-2024-001</code>
```

## Classes de Boutons Disponibles

- `btn-primary` - Bouton principal (bleu)
- `btn-success` - Bouton de succès (vert)
- `btn-warning` - Bouton d'avertissement (jaune)
- `btn-danger` - Bouton de danger (rouge)
- `btn-secondary` - Bouton secondaire (gris)
- `btn-outline` - Bouton avec contour

### Tailles
- `btn-sm` - Petit
- Par défaut - Normal

## Classes de Statut Disponibles

### Statuts de Succès
- `status-approved`
- `status-completed`
- `status-success`

### Statuts d'Avertissement
- `status-pending`
- `status-in_progress`
- `status-warning`

### Statuts d'Erreur
- `status-expired`
- `status-cancelled`
- `status-danger`
- `status-error`

### Statuts d'Information
- `status-reported`
- `status-info`

### Statuts Neutres
- `status-closed`

## Classes d'Information

### Véhicules
```html
<div class="vehicle-info">
    <div class="vehicle-details">Toyota Corolla</div>
    <div class="vehicle-plate">AB-123-CD</div>
</div>
```

### Interventions
```html
<div class="intervention-info">
    <div class="intervention-title">Réparation moteur</div>
    <div class="intervention-desc">Description détaillée</div>
</div>
```

### Montants
```html
<div class="amount-total">150 000 F CFA</div>
<div class="amount-details">
    <div class="amount-detail">HT: 125 000</div>
    <div class="amount-detail">TVA: 25 000</div>
</div>
```

### Dates
```html
<div class="date-info">15/01/2024</div>
```

## Checkboxes

```html
<td class="checkbox-cell">
    <input type="checkbox" class="table-checkbox">
</td>
```

## États Spéciaux

### Ligne Sélectionnée
```html
<tr class="selected">
    <!-- Contenu -->
</tr>
```

### Ligne en Chargement
```html
<tr class="loading">
    <!-- Contenu -->
</tr>
```

### Message Vide
```html
<div class="empty-table-message">
    <i class="fas fa-inbox"></i>
    <h3>Aucune donnée</h3>
    <p>Aucun élément trouvé</p>
</div>
```

### Indicateur de Chargement
```html
<div class="table-loading">
    <i class="fas fa-spinner"></i>
    Chargement...
</div>
```

## Pagination

```html
<div class="table-pagination">
    <div class="pagination-info">
        Affichage de 1 à 10 sur 50 résultats
    </div>
    <div class="pagination-controls">
        <button class="pagination-btn" disabled>Précédent</button>
        <button class="pagination-btn active">1</button>
        <button class="pagination-btn">2</button>
        <button class="pagination-btn">3</button>
        <button class="pagination-btn">Suivant</button>
    </div>
</div>
```

## Responsive

Les styles s'adaptent automatiquement aux différentes tailles d'écran :

- **Desktop** : Affichage complet
- **Tablette** : Défilement horizontal si nécessaire
- **Mobile** : Boutons plus petits, texte réduit

## Migration

Pour migrer un tableau existant :

1. Remplacer `quote-actions` par `table-actions`
2. Utiliser les classes de boutons unifiées
3. Utiliser les classes de statut unifiées
4. Supprimer les styles redondants du CSS spécifique
5. Garder seulement les styles spécifiques (largeurs de colonnes, etc.)

## Exemple Complet

```html
<div class="data-table-container">
    <table class="data-table">
        <thead>
            <tr>
                <th><input type="checkbox" class="select-all-checkbox"></th>
                <th>Numéro</th>
                <th>Statut</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="checkbox-cell">
                    <input type="checkbox" class="table-checkbox">
                </td>
                <td>
                    <code class="entity-code">QUO-2024-001</code>
                </td>
                <td>
                    <span class="status-badge status-approved">Approuvé</span>
                </td>
                <td class="actions-cell">
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

## Maintenance

Pour ajouter de nouveaux styles :

1. Modifier `css/unified-tables.css`
2. Tester sur plusieurs pages
3. Mettre à jour cette documentation
4. Informer l'équipe des changements

## Avantages

- ✅ **Cohérence visuelle** sur toute l'application
- ✅ **Maintenance simplifiée** avec un seul fichier CSS
- ✅ **Responsive automatique** pour tous les tableaux
- ✅ **Performance améliorée** avec moins de CSS redondant
- ✅ **Facilité d'utilisation** avec des classes standardisées
