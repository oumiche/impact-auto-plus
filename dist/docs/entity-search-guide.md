# Guide des Composants de Recherche d'Entités

Ce guide explique comment utiliser les composants de recherche unifiés pour toutes les entités de l'application.

## 🎯 Vue d'ensemble

Nous avons créé une architecture modulaire pour la recherche d'entités :

1. **EntitySearch** - Composant générique de base
2. **Composants spécialisés** - Pour chaque type d'entité
3. **Configuration centralisée** - Dans `entity-configs.js`

## 📦 Composants disponibles

### 1. EntitySearch (Générique)
Composant de base pour toute recherche d'entité.

```javascript
// Utilisation basique
<EntitySearch
    v-model="selectedItem"
    :items="availableItems"
    :loading="loading"
    placeholder="Rechercher..."
    @search="onSearch"
    @clear="onClear"
/>
```

### 2. Composants spécialisés

#### VehicleSearch
```javascript
<VehicleSearch
    v-model="selectedVehicle"
    :items="availableVehicles"
    :loading="loading"
    @search="onVehicleSearch"
    @clear="clearVehicle"
/>
```

#### InterventionSearchAdvanced
```javascript
<InterventionSearchAdvanced
    v-model="selectedIntervention"
    :items="availableInterventions"
    :loading="loading"
    @search="onInterventionSearch"
    @clear="clearIntervention"
/>
```

#### QuoteSearch
```javascript
<QuoteSearch
    v-model="selectedQuote"
    :items="availableQuotes"
    :loading="loading"
    @search="onQuoteSearch"
    @clear="clearQuote"
/>
```

#### InvoiceSearch
```javascript
<InvoiceSearch
    v-model="selectedInvoice"
    :items="availableInvoices"
    :loading="loading"
    @search="onInvoiceSearch"
    @clear="clearInvoice"
/>
```

#### GarageSearch (existant)
```javascript
<GarageSearch
    v-model="selectedGarage"
    :items="availableGarages"
    :loading="loading"
    @search="onGarageSearch"
    @clear="clearGarage"
/>
```

#### CustomerSearch
```javascript
<CustomerSearch
    v-model="selectedCustomer"
    :items="availableCustomers"
    :loading="loading"
    @search="onCustomerSearch"
    @clear="clearCustomer"
/>
```

#### SupplySearch
```javascript
<SupplySearch
    v-model="selectedSupply"
    :items="availableSupplies"
    :loading="loading"
    @search="onSupplySearch"
    @clear="clearSupply"
/>
```

## 🔧 Configuration des composants

### Props communes
- `v-model` - Valeur sélectionnée (objet)
- `:items` - Liste des éléments disponibles
- `:loading` - État de chargement
- `placeholder` - Texte du placeholder
- `:required` - Champ obligatoire
- `:disabled` - Désactiver le composant
- `:showClear` - Afficher le bouton de suppression

### Événements
- `@search` - Recherche lancée (string)
- `@clear` - Élément désélectionné
- `@input` - Élément sélectionné (objet)

## 📋 Exemple d'utilisation complète

```javascript
// Dans votre composant Vue
export default {
    components: {
        VehicleSearch: window.VehicleSearch,
        InterventionSearchAdvanced: window.InterventionSearchAdvanced,
        QuoteSearch: window.QuoteSearch
    },
    
    data() {
        return {
            selectedVehicle: null,
            selectedIntervention: null,
            selectedQuote: null,
            availableVehicles: [],
            availableInterventions: [],
            availableQuotes: [],
            loading: false
        }
    },
    
    methods: {
        async onVehicleSearch(searchTerm) {
            this.loading = true;
            try {
                const response = await this.loadVehicles(searchTerm);
                this.availableVehicles = response.data;
            } finally {
                this.loading = false;
            }
        },
        
        clearVehicle() {
            this.selectedVehicle = null;
        },
        
        // Autres méthodes similaires...
    }
}
```

## 🎨 Personnalisation avec EntitySearch

Pour des cas d'usage spécifiques, vous pouvez utiliser `EntitySearch` avec une configuration personnalisée :

```javascript
<EntitySearch
    v-model="selectedItem"
    :items="customItems"
    :display-config="{
        primary: 'customField',
        secondary: 'description',
        tertiary: 'status'
    }"
    :search-fields="['customField', 'description', 'category']"
    search-icon="fas fa-custom-icon"
    placeholder="Recherche personnalisée..."
    @search="onCustomSearch"
/>
```

## 🏗️ Création de nouveaux composants

Pour créer un nouveau composant de recherche :

1. **Utiliser la configuration existante** :
```javascript
const MyEntitySearch = window.createEntitySearchComponent('myEntity', {
    // Props personnalisées
});
```

2. **Ou créer manuellement** :
```javascript
const MyEntitySearch = {
    name: 'MyEntitySearch',
    extends: window.EntitySearch,
    props: {
        placeholder: {
            type: String,
            default: 'Rechercher mon entité...'
        }
    },
    computed: {
        displayConfig() {
            return {
                primary: 'name',
                secondary: 'description'
            };
        },
        searchFields() {
            return ['name', 'description', 'category'];
        }
    }
};
```

## 🔄 Migration depuis l'ancien système

Pour migrer du code existant vers les nouveaux composants :

1. **Remplacer le HTML** :
```html
<!-- Avant -->
<div class="intervention-search-container">
    <input class="intervention-search-input">
    <!-- ... beaucoup de HTML ... -->
</div>

<!-- Après -->
<InterventionSearchAdvanced
    v-model="selectedIntervention"
    :items="availableInterventions"
    @search="onInterventionSearch"
/>
```

2. **Simplifier les méthodes** :
```javascript
// Avant - beaucoup de méthodes
toggleInterventionSearch() { /* ... */ }
closeInterventionSearch() { /* ... */ }
// ... etc

// Après - seulement les méthodes nécessaires
onInterventionSearch(searchTerm) {
    this.loadInterventions(searchTerm);
}
```

## 📊 Avantages

- ✅ **Code DRY** - Pas de duplication
- ✅ **Maintenance centralisée** - Un seul endroit pour les corrections
- ✅ **Cohérence** - Interface uniforme
- ✅ **Performance** - Composants optimisés
- ✅ **Flexibilité** - Configuration personnalisable
- ✅ **Évolutivité** - Facile d'ajouter de nouvelles entités

## 🚀 Prochaines étapes

1. Migrer tous les formulaires existants
2. Ajouter de nouvelles entités selon les besoins
3. Optimiser les performances avec la pagination
4. Ajouter des fonctionnalités avancées (filtres, tri, etc.)
