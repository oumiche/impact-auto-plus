# Guide d'Implémentation - Système de Recherche Avancée

## Vue d'ensemble

Ce guide vous permet d'implémenter le système de recherche avancée avec autocomplétion côté serveur dans n'importe quelle vue Vue.js de l'application.

## Étapes d'implémentation

### 1. Structure HTML de Base

```html
<div class="form-group">
    <label for="entity-search">Entité *</label>
    <div class="searchable-select">
        <input 
            type="text" 
            id="entity-search"
            v-model="entitySearchTerm"
            @input="searchEntities"
            @focus="onEntityFocus"
            @blur="hideEntityDropdown"
            placeholder="Rechercher une entité..."
            :style="{ display: selectedEntity ? 'none' : 'block' }"
            required
        >
        
        <!-- Dropdown des résultats -->
        <div v-if="showEntityDropdown && entitySearchResults.length > 0" class="dropdown-results">
            <div 
                v-for="entity in entitySearchResults" 
                :key="entity.id"
                class="dropdown-item entity-item"
                @click="selectEntity(entity)"
            >
                <div class="entity-info-dropdown">
                    <div class="entity-main">{{ entity.displayName }}</div>
                    <div class="entity-details-dropdown">
                        <span v-if="entity.field1">{{ entity.field1 }}</span>
                        <span v-if="entity.field2">{{ entity.field2 }}</span>
                        <span v-if="entity.field3">{{ entity.field3 }}</span>
                    </div>
                </div>
                <button 
                    type="button" 
                    class="entity-details-btn"
                    @click.stop="showEntityDetails(entity)"
                    title="Voir les détails"
                >
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        </div>
        
        <!-- Élément sélectionné -->
        <div v-if="selectedEntity" class="selected-item">
            <span>{{ selectedEntity.displayName }}</span>
            <div class="selected-item-actions">
                <button type="button" @click="showEntityDetails(selectedEntity)" class="details-btn" title="Voir les détails">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button type="button" @click="clearEntity" class="clear-btn" title="Supprimer la sélection">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
</div>
```

### 2. Propriétés de Données

```javascript
data() {
    return {
        // Recherche
        entitySearchTerm: '',
        entitySearchResults: [],
        showEntityDropdown: false,
        selectedEntity: null,
        entitySearchTimeout: null,
        
        // Modal de détails
        showEntityDetailsModal: false,
        selectedEntityForDetails: null,
        
        // Formulaires
        form: {
            entityId: '',
            // ... autres champs
        }
    };
}
```

### 3. Méthodes JavaScript

#### Recherche avec Debounce
```javascript
async searchEntities() {
    clearTimeout(this.entitySearchTimeout);
    this.entitySearchTimeout = setTimeout(async () => {
        if (this.entitySearchTerm.length < 2) {
            this.entitySearchResults = [];
            return;
        }
        
        try {
            const response = await window.apiService.getEntities(
                null, 
                this.entitySearchTerm, 
                'active', 
                1, 
                20
            );
            if (response.success) {
                this.entitySearchResults = response.data;
            }
        } catch (error) {
            console.error('Erreur lors de la recherche d\'entités:', error);
            this.entitySearchResults = [];
        }
    }, 300);
}
```

#### Chargement Initial au Focus
```javascript
async onEntityFocus() {
    this.showEntityDropdown = true;
    // Si pas de résultats et pas de terme de recherche, charger les 5 premiers
    if (this.entitySearchResults.length === 0 && !this.entitySearchTerm) {
        await this.loadInitialEntities();
    }
}

async loadInitialEntities() {
    try {
        const response = await window.apiService.getEntities(
            null, 
            '', 
            'active', 
            1, 
            5
        );
        if (response.success) {
            this.entitySearchResults = response.data;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des entités initiales:', error);
        this.entitySearchResults = [];
    }
}
```

#### Gestion des Sélections
```javascript
selectEntity(entity) {
    this.selectedEntity = entity;
    this.form.entityId = entity.id;
    this.entitySearchTerm = '';
    this.showEntityDropdown = false;
    this.entitySearchResults = [];
}

clearEntity() {
    this.selectedEntity = null;
    this.form.entityId = '';
    this.entitySearchTerm = '';
    this.entitySearchResults = [];
}

hideEntityDropdown() {
    setTimeout(() => {
        this.showEntityDropdown = false;
    }, 200);
}
```

#### Modal de Détails
```javascript
showEntityDetails(entity) {
    this.selectedEntityForDetails = entity;
    this.showEntityDetailsModal = true;
}

closeEntityDetailsModal() {
    this.showEntityDetailsModal = false;
    this.selectedEntityForDetails = null;
}

selectEntityFromDetails() {
    if (this.selectedEntityForDetails) {
        this.selectEntity(this.selectedEntityForDetails);
        this.closeEntityDetailsModal();
    }
}
```

### 4. Modal de Détails HTML

```html
<!-- Modal de détails de l'entité -->
<div v-if="showEntityDetailsModal" class="modal-overlay" @click="closeEntityDetailsModal">
    <div class="modal-content modal-sm" @click.stop>
        <div class="modal-header">
            <h3>Détails de l'entité</h3>
            <button class="close-btn" @click="closeEntityDetailsModal">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="modal-body" v-if="selectedEntityForDetails">
            <div class="entity-details-content">
                <div class="detail-row">
                    <label>Nom:</label>
                    <span>{{ selectedEntityForDetails.name }}</span>
                </div>
                <div class="detail-row" v-if="selectedEntityForDetails.field1">
                    <label>Champ 1:</label>
                    <span>{{ selectedEntityForDetails.field1 }}</span>
                </div>
                <div class="detail-row" v-if="selectedEntityForDetails.field2">
                    <label>Champ 2:</label>
                    <span>{{ selectedEntityForDetails.field2 }}</span>
                </div>
                <div class="detail-row">
                    <label>Statut:</label>
                    <span :class="['status-badge', 'status-' + selectedEntityForDetails.status]">
                        {{ getEntityStatusLabel(selectedEntityForDetails.status) }}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="closeEntityDetailsModal">
                Fermer
            </button>
            <button type="button" class="btn btn-primary" @click="selectEntityFromDetails">
                Sélectionner cette entité
            </button>
        </div>
    </div>
</div>
```

### 5. Méthodes Utilitaires

```javascript
getEntityStatusLabel(status) {
    const labels = {
        'active': 'Actif',
        'inactive': 'Inactif',
        'pending': 'En attente',
        'completed': 'Terminé'
    };
    return labels[status] || status;
}

// Réinitialisation du formulaire
resetForm() {
    this.form = {
        entityId: '',
        // ... autres champs
    };
    
    // Réinitialiser les champs de recherche
    this.selectedEntity = null;
    this.entitySearchTerm = '';
    this.entitySearchResults = [];
    this.showEntityDropdown = false;
}
```

### 6. Styles CSS Requis

```css
/* Styles pour les composants de recherche */
.searchable-select {
    position: relative;
    width: 100%;
}

.searchable-select input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background-color: white;
}

.searchable-select input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.dropdown-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:hover {
    background-color: #f8f9fa;
}

.dropdown-item:last-child {
    border-bottom: none;
}

.entity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
}

.entity-info-dropdown {
    flex: 1;
}

.entity-main {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.entity-details-dropdown {
    font-size: 12px;
    color: #7f8c8d;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.entity-details-dropdown span {
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.entity-details-btn {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    margin-left: 8px;
    transition: all 0.2s ease;
}

.entity-details-btn:hover {
    background-color: #e3f2fd;
    color: #0056b3;
}

.entity-details-btn i {
    font-size: 14px;
}

.selected-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 4px;
    margin-top: -1px;
    font-size: 14px;
    position: relative;
    z-index: 1;
}

.selected-item span {
    flex: 1;
    color: #1976d2;
    font-weight: 500;
}

.selected-item-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.details-btn {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.details-btn:hover {
    background-color: #e3f2fd;
    color: #0056b3;
}

.details-btn i {
    font-size: 12px;
}

.clear-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    transition: all 0.2s ease;
}

.clear-btn:hover {
    background-color: #f0f0f0;
    color: #333;
}

.clear-btn i {
    font-size: 12px;
}

/* Styles pour la modal de détails */
.entity-details-content {
    padding: 16px 0;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-row label {
    font-weight: 600;
    color: #2c3e50;
    min-width: 140px;
    margin: 0;
}

.detail-row span {
    color: #495057;
    text-align: right;
    flex: 1;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-active {
    background: #e8f5e8;
    color: #2e7d32;
}

.status-inactive {
    background: #ffebee;
    color: #d32f2f;
}
```

## Configuration par Entité

### Exemple : Recherche de Clients

```javascript
// Dans data()
clientSearchTerm: '',
clientSearchResults: [],
showClientDropdown: false,
selectedClient: null,
clientSearchTimeout: null,

// Méthodes
async searchClients() {
    clearTimeout(this.clientSearchTimeout);
    this.clientSearchTimeout = setTimeout(async () => {
        if (this.clientSearchTerm.length < 2) {
            this.clientSearchResults = [];
            return;
        }
        
        try {
            const response = await window.apiService.getClients(
                null, 
                this.clientSearchTerm, 
                'active', 
                1, 
                20
            );
            if (response.success) {
                this.clientSearchResults = response.data;
            }
        } catch (error) {
            console.error('Erreur lors de la recherche de clients:', error);
            this.clientSearchResults = [];
        }
    }, 300);
}
```

### Exemple : Recherche de Fournisseurs

```javascript
// Dans data()
supplierSearchTerm: '',
supplierSearchResults: [],
showSupplierDropdown: false,
selectedSupplier: null,
supplierSearchTimeout: null,

// Méthodes
async searchSuppliers() {
    clearTimeout(this.supplierSearchTimeout);
    this.supplierSearchTimeout = setTimeout(async () => {
        if (this.supplierSearchTerm.length < 2) {
            this.supplierSearchResults = [];
            return;
        }
        
        try {
            const response = await window.apiService.getSuppliers(
                null, 
                this.supplierSearchTerm, 
                'active', 
                1, 
                20
            );
            if (response.success) {
                this.supplierSearchResults = response.data;
            }
        } catch (error) {
            console.error('Erreur lors de la recherche de fournisseurs:', error);
            this.supplierSearchResults = [];
        }
    }, 300);
}
```

## Checklist d'Implémentation

### ✅ HTML
- [ ] Structure de base avec `searchable-select`
- [ ] Input avec événements `@input`, `@focus`, `@blur`
- [ ] Dropdown des résultats avec `v-for`
- [ ] Élément sélectionné avec boutons d'action
- [ ] Modal de détails complète

### ✅ JavaScript
- [ ] Propriétés de données pour la recherche
- [ ] Méthode de recherche avec debounce
- [ ] Chargement initial au focus
- [ ] Gestion des sélections
- [ ] Modal de détails
- [ ] Réinitialisation du formulaire

### ✅ CSS
- [ ] Styles de base pour `searchable-select`
- [ ] Dropdown et éléments de liste
- [ ] Éléments sélectionnés
- [ ] Boutons d'action
- [ ] Modal de détails

### ✅ API
- [ ] Endpoint de recherche côté serveur
- [ ] Format de données cohérent
- [ ] Gestion des erreurs
- [ ] Pagination et limites

## Bonnes Pratiques

### Performance
- **Debounce** : Toujours utiliser un délai de 300ms
- **Limite** : Maximum 20 résultats par recherche
- **Nettoyage** : Vider les résultats après sélection

### UX
- **Chargement initial** : 5 éléments au focus
- **Feedback visuel** : États de chargement et erreurs
- **Accessibilité** : Navigation clavier et ARIA

### Code
- **Nommage** : Préfixer avec le nom de l'entité
- **Réutilisabilité** : Créer des composants réutilisables
- **Documentation** : Commenter les méthodes complexes

## Dépannage

### Problèmes Courants

#### La recherche ne fonctionne pas
```javascript
// Vérifier la méthode API
console.log('Recherche:', this.entitySearchTerm);
console.log('Résultats:', this.entitySearchResults);
```

#### Affichage incorrect
```javascript
// Vérifier la structure des données
console.log('Entité sélectionnée:', this.selectedEntity);
console.log('Données API:', response.data);
```

#### Performance lente
- Réduire la limite de résultats
- Augmenter le debounce
- Optimiser les requêtes API

## Exemples Complets

### Recherche de Produits
```html
<div class="form-group">
    <label for="product-search">Produit *</label>
    <div class="searchable-select">
        <input 
            type="text" 
            id="product-search"
            v-model="productSearchTerm"
            @input="searchProducts"
            @focus="onProductFocus"
            @blur="hideProductDropdown"
            placeholder="Rechercher un produit..."
            :style="{ display: selectedProduct ? 'none' : 'block' }"
            required
        >
        
        <div v-if="showProductDropdown && productSearchResults.length > 0" class="dropdown-results">
            <div 
                v-for="product in productSearchResults" 
                :key="product.id"
                class="dropdown-item product-item"
                @click="selectProduct(product)"
            >
                <div class="product-info-dropdown">
                    <div class="product-main">{{ product.name }} - {{ product.reference }}</div>
                    <div class="product-details-dropdown">
                        <span v-if="product.category">{{ product.category.name }}</span>
                        <span v-if="product.price">{{ product.price }}€</span>
                        <span v-if="product.stock">Stock: {{ product.stock }}</span>
                    </div>
                </div>
                <button 
                    type="button" 
                    class="product-details-btn"
                    @click.stop="showProductDetails(product)"
                    title="Voir les détails"
                >
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        </div>
        
        <div v-if="selectedProduct" class="selected-item">
            <span>{{ selectedProduct.name }} - {{ selectedProduct.reference }}</span>
            <div class="selected-item-actions">
                <button type="button" @click="showProductDetails(selectedProduct)" class="details-btn" title="Voir les détails">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button type="button" @click="clearProduct" class="clear-btn" title="Supprimer la sélection">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
</div>
```

Cette documentation vous permet d'implémenter facilement le système de recherche avancée dans n'importe quelle vue de l'application ! 🎉
