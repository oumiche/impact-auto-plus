# TODO - Application du FilterPanel aux 4 pages restantes

**Pages complétées**: 2/6 ✅  
**Pages restantes**: 4/6 ⏳

---

## ✅ Pages déjà migrées

1. **VehicleInterventions.vue** ✅
2. **InterventionPrediagnostics.vue** ✅

---

## ⏳ Pages à migrer

Pour chaque page, suivre ce pattern :

### 1️⃣ Imports à ajouter

```javascript
import FilterPanel from '@/components/common/FilterPanel.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
```

### 2️⃣ État à ajouter

```javascript
const showFiltersPanel = ref(false)

// Ajouter aux filtres existants :
const filters = ref({
  // ... filtres existants ...
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

// Ajouter computed :
const activeFiltersCount = computed(() => {
  let count = 0
  // Compter TOUS les filtres actifs (existants + nouveaux)
  if (filters.value.XXX !== 'all') count++  // filtres spécifiques
  if (filters.value.brandId) count++
  if (filters.value.modelId) count++
  if (filters.value.dateStart) count++
  if (filters.value.dateEnd) count++
  return count
})
```

### 3️⃣ Méthodes à ajouter/modifier

```javascript
// Remplacer handleFilterChange par :
const applyFilters = () => {
  pagination.value.currentPage = 1
  loadXXX() // loadQuotes, loadAuthorizations, etc.
}

// Ajouter :
const resetFilters = () => {
  filters.value = {
    // TOUS les filtres à leurs valeurs par défaut
    XXX: 'all',
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadXXX()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}
```

### 4️⃣ Dans loadXXX, ajouter params

```javascript
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

## 📋 Détails par page

### InterventionQuotes.vue

**Filtres spécifiques**:
- validated ('all', 'pending', 'validated')
- garageId (SimpleSelector)

**Pattern de filtres dans FilterPanel**:
```vue
<!-- Statut -->
<div class="filter-section">
  <label class="filter-label">Statut</label>
  <select v-model="filters.validated" class="filter-control">
    <option value="all">Tous</option>
    <option value="pending">En attente</option>
    <option value="validated">Validés</option>
  </select>
</div>

<!-- Garage -->
<div class="filter-section">
  <label class="filter-label">Garage</label>
  <SimpleSelector v-model="filters.garageId" api-method="getGarages" placeholder="Tous les garages" />
</div>

<!-- + Marque + Modèle + Période -->
```

---

### InterventionWorkAuthorizations.vue

**Filtres spécifiques**:
- authorizedById (SimpleSelector - Collaborateurs)
- validated ('all', 'pending', 'validated')

**Pattern de filtres dans FilterPanel**:
```vue
<!-- Statut -->
<div class="filter-section">
  <label class="filter-label">Statut</label>
  <select v-model="filters.validated" class="filter-control">
    <option value="all">Tous</option>
    <option value="pending">En attente</option>
    <option value="validated">Validées</option>
  </select>
</div>

<!-- Collaborateur -->
<div class="filter-section">
  <label class="filter-label">Autorisé par</label>
  <SimpleSelector v-model="filters.authorizedById" api-method="getCollaborateurs" placeholder="Tous" />
</div>

<!-- + Marque + Modèle + Période -->
```

---

### InterventionReceptionReports.vue

**Filtres spécifiques**:
- satisfaction ('all', 'excellent', 'good', 'average', 'poor')
- vehicleReady ('all', 'ready', 'not_ready')

**Pattern de filtres dans FilterPanel**:
```vue
<!-- Satisfaction -->
<div class="filter-section">
  <label class="filter-label">Satisfaction</label>
  <select v-model="filters.satisfaction" class="filter-control">
    <option value="all">Toutes</option>
    <option value="excellent">Excellente</option>
    <option value="good">Bonne</option>
    <option value="average">Moyenne</option>
    <option value="poor">Mauvaise</option>
  </select>
</div>

<!-- État véhicule -->
<div class="filter-section">
  <label class="filter-label">État véhicule</label>
  <select v-model="filters.vehicleReady" class="filter-control">
    <option value="all">Tous</option>
    <option value="ready">Prêt</option>
    <option value="not_ready">Non prêt</option>
  </select>
</div>

<!-- + Marque + Modèle + Période -->
```

---

### InterventionInvoices.vue

**Filtres spécifiques**:
- paymentStatus ('all', 'draft', 'pending', 'partial', 'paid', 'overdue')
- period ('all', 'today', 'week', 'month', 'year') - À REMPLACER par dateStart/dateEnd

**Pattern de filtres dans FilterPanel**:
```vue
<!-- Statut paiement -->
<div class="filter-section">
  <label class="filter-label">Statut</label>
  <select v-model="filters.paymentStatus" class="filter-control">
    <option value="all">Tous</option>
    <option value="draft">Brouillon</option>
    <option value="pending">En attente</option>
    <option value="partial">Paiement partiel</option>
    <option value="paid">Payée</option>
    <option value="overdue">En retard</option>
  </select>
</div>

<!-- + Marque + Modèle + Période (remplace le filtre 'period' existant) -->
```

---

## 🎯 Actions requises

Pour CHAQUE page restante (4 pages) :

1. ✅ Remplacer la section `<div class="filters">` par `<div class="search-filters-bar">` + `<FilterPanel>`
2. ✅ Ajouter les imports (FilterPanel, BrandSelectorSearch, ModelSelector)
3. ✅ Ajouter `showFiltersPanel` au state
4. ✅ Ajouter `brandId`, `modelId`, `dateStart`, `dateEnd` aux filtres
5. ✅ Créer `activeFiltersCount` computed
6. ✅ Remplacer `handleFilterChange` par `applyFilters`
7. ✅ Ajouter `resetFilters` et `handleBrandChange`
8. ✅ Ajouter les nouveaux params dans `loadXXX`

**Estimation**: 5-10 minutes par page = 20-40 minutes total

---

## 💡 Recommandation

**Option A**: Je continue et termine les 4 pages maintenant (~30 min)  
**Option B**: Vous testez les 2 pages déjà migrées et je continue après  
**Option C**: Je crée un script/helper pour automatiser

Que préférez-vous ?

