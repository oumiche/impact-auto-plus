# Migration - Panneau de filtres latéral

**Date**: 11 octobre 2025  
**Durée**: ~1 heure  
**Objectif**: Implémenter un panneau de filtres latéral moderne pour la section Suivi

---

## ✅ Composant créé

### FilterPanel.vue
**Emplacement**: `frontend-vue/src/components/common/FilterPanel.vue`

**Fonctionnalités**:
- ✅ Panneau latéral fixe à droite (400px)
- ✅ Animation slide-in depuis la droite
- ✅ Overlay semi-transparent (fermeture au clic)
- ✅ Header avec titre + compteur de filtres actifs
- ✅ Body scrollable pour le contenu
- ✅ Footer avec 2 boutons:
  - "Réinitialiser" (reset)
  - "Appliquer" (apply + fermeture)
- ✅ Responsive (pleine largeur sur mobile)

**Props**:
- `modelValue` (Boolean) - Afficher/masquer
- `activeFiltersCount` (Number) - Nombre de filtres actifs

**Events**:
- `@update:modelValue` - Fermeture
- `@apply` - Appliquer les filtres
- `@reset` - Réinitialiser les filtres

**Slot**:
- Default slot pour le contenu des filtres

---

## 🎨 Design Pattern

### Barre de recherche + Bouton filtres

```vue
<div class="search-filters-bar">
  <SearchBar v-model="searchQuery" @search="handleSearch" />
  <button @click="showFiltersPanel = true" class="btn-filters">
    <i class="fas fa-filter"></i>
    Filtres
    <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
  </button>
</div>
```

**Caractéristiques**:
- SearchBar prend toute la largeur (flex: 1)
- Bouton Filtres à droite avec badge de comptage
- Badge bleu avec nombre de filtres actifs

### Panneau de filtres

```vue
<FilterPanel
  v-model="showFiltersPanel"
  :active-filters-count="activeFiltersCount"
  @apply="applyFilters"
  @reset="resetFilters"
>
  <!-- Filtres spécifiques -->
  <div class="filter-section">
    <label class="filter-label">...</label>
    <select v-model="..." class="filter-control">...</select>
  </div>
  
  <!-- Marque (commun) -->
  <div class="filter-section">
    <label class="filter-label">Marque</label>
    <BrandSelectorSearch v-model="filters.brandId" @change="handleBrandChange" />
  </div>
  
  <!-- Modèle (commun) -->
  <div class="filter-section">
    <label class="filter-label">Modèle</label>
    <ModelSelector v-model="filters.modelId" :brand-id="filters.brandId" :disabled="!filters.brandId" />
    <small v-if="!filters.brandId" class="filter-hint">Sélectionnez d'abord une marque</small>
  </div>
  
  <!-- Période (commun) -->
  <div class="filter-section">
    <label class="filter-label">Période</label>
    <div class="date-range">
      <div class="date-input-group">
        <label class="date-label">Date début</label>
        <input type="date" v-model="filters.dateStart" :max="filters.dateEnd || null" class="filter-control" />
      </div>
      <div class="date-input-group">
        <label class="date-label">Date fin</label>
        <input type="date" v-model="filters.dateEnd" :min="filters.dateStart || null" class="filter-control" />
      </div>
    </div>
  </div>
</FilterPanel>
```

---

## 📦 Filtres communs (toutes les pages)

### 1. Marque
- **Composant**: `BrandSelectorSearch`
- **Recherche**: Server-side
- **Event**: `@change="handleBrandChange"` → Reset du modèle

### 2. Modèle  
- **Composant**: `ModelSelector`
- **Props**: `:brand-id="filters.brandId"` (cascading)
- **Disabled**: Si aucune marque sélectionnée
- **Hint**: "Sélectionnez d'abord une marque"

### 3. Période
- **Dates**: `dateStart` et `dateEnd`
- **Validation**: dateStart ≤ dateEnd
- **Type**: `input[type="date"]`

---

## 📄 Pages migrées

### ✅ VehicleInterventions.vue (100%)

**Filtres spécifiques**:
- Statut (12 options du workflow)
- Priorité (4 niveaux)

**Filtres communs**:
- Marque
- Modèle
- Période

**État**:
```javascript
const filters = ref({
  status: 'all',
  priority: 'all',
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.status !== 'all') count++
  if (filters.value.priority !== 'all') count++
  if (filters.value.brandId) count++
  if (filters.value.modelId) count++
  if (filters.value.dateStart) count++
  if (filters.value.dateEnd) count++
  return count
})
```

**Méthodes**:
```javascript
const applyFilters = () => {
  pagination.value.currentPage = 1
  loadInterventions()
}

const resetFilters = () => {
  filters.value = {
    status: 'all',
    priority: 'all',
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadInterventions()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}
```

---

### ✅ InterventionPrediagnostics.vue (100%)

**Filtres spécifiques**:
- Expert (SimpleSelector - Collaborateurs)

**Filtres communs**:
- Marque
- Modèle
- Période

---

### ⏳ Pages restantes (À compléter)

**À appliquer le même pattern sur**:
- InterventionQuotes.vue (+ filtre Garage, Statut validé)
- InterventionWorkAuthorizations.vue (+ filtre Collaborateur, Statut validé)
- InterventionReceptionReports.vue (+ filtre Satisfaction, État véhicule)
- InterventionInvoices.vue (+ filtre Statut paiement, Période)

---

## 🎨 Styles ajoutés

### Dans `crud-styles.scss`

**Styles globaux** (réutilisables dans toutes les pages):
- `.search-filters-bar` - Container flex
- `.btn-filters` - Bouton avec badge
- `.filter-badge` - Badge de comptage
- `.filter-section` - Section de filtre
- `.filter-label` - Label de filtre
- `.filter-control` - Input/select
- `.filter-hint` - Texte d'aide
- `.date-range` - Container de dates
- `.date-input-group` - Groupe date
- `.date-label` - Label de date

**Total**: ~110 lignes de SCSS réutilisables

---

## 🎯 Utilisation

### Dans chaque page

#### 1. Imports
```javascript
import FilterPanel from '@/components/common/FilterPanel.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
```

#### 2. État
```javascript
const showFiltersPanel = ref(false)

const filters = ref({
  // Filtres spécifiques à la page
  status: 'all',
  
  // Filtres communs
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

const activeFiltersCount = computed(() => {
  let count = 0
  // Compter tous les filtres actifs
  if (filters.value.status !== 'all') count++
  if (filters.value.brandId) count++
  if (filters.value.modelId) count++
  if (filters.value.dateStart) count++
  if (filters.value.dateEnd) count++
  return count
})
```

#### 3. Méthodes
```javascript
const applyFilters = () => {
  pagination.value.currentPage = 1
  loadData() // loadInterventions, loadQuotes, etc.
}

const resetFilters = () => {
  filters.value = {
    // Réinitialiser tous les filtres
    status: 'all',
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadData()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}
```

#### 4. loadData (API params)
```javascript
// Filtres communs
if (filters.value.brandId) {
  params.brandId = filters.value.brandId
}
if (filters.value.modelId) {
  params.modelId = filters.value.modelId
}
if (filters.value.dateStart) {
  params.dateStart = filters.value.dateStart
}
if (filters.value.dateEnd) {
  params.dateEnd = filters.value.dateEnd
}
```

---

## ✅ Avantages du nouveau système

### UX améliorée
- ✅ **Interface plus propre** (pas de filtres partout)
- ✅ **Recherche rapide** (champ principal)
- ✅ **Filtres avancés** à la demande (panneau)
- ✅ **Compteur visuel** (nombre de filtres actifs)
- ✅ **Réinitialisation facile** (bouton)

### Fonctionnalités
- ✅ **Filtrage par marque/modèle** (cascading)
- ✅ **Filtrage par période** (date début/fin)
- ✅ **Tous les filtres spécifiques** préservés
- ✅ **Application différée** (bouton Appliquer)

### Technique
- ✅ **Composant réutilisable**
- ✅ **Styles centralisés** (crud-styles.scss)
- ✅ **Animations fluides** (slide-in, fade)
- ✅ **Responsive** (mobile-friendly)

---

## 📊 État d'avancement

### ✅ Complété (2/6)
- [x] VehicleInterventions.vue
- [x] InterventionPrediagnostics.vue

### ⏳ En cours (4/6)
- [ ] InterventionQuotes.vue
- [ ] InterventionWorkAuthorizations.vue
- [ ] InterventionReceptionReports.vue
- [ ] InterventionInvoices.vue

---

## 🎯 Prochaines étapes

**Option A**: Continuer et appliquer aux 4 pages restantes (~30 min)  
**Option B**: Tester d'abord sur les 2 pages actuelles  
**Option C**: Documenter et passer à autre chose  

---

Le nouveau système de filtres est **beaucoup plus moderne et professionnel** ! 🚀

