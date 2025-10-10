# Mise à jour des pages de données de base

## Pages à mettre à jour

Toutes les pages suivantes doivent avoir :
- ✅ SearchBar avec recherche côté serveur (debounce 500ms)
- ✅ Pagination côté serveur
- ✅ Notifications (success/error)

### Liste des pages

1. ✅ **Marques** - Fait
2. ✅ **Modeles** - Fait
3. ⏳ **VehicleCategories**
4. ⏳ **VehicleColors**
5. ⏳ **FuelTypes**
6. ⏳ **LicenceTypes**
7. ⏳ **SupplyCategories**
8. ⏳ **InterventionTypes**

## Template de structure

### HTML
```vue
<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouveau XXX</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher..." @search="handleSearch" />
      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      <div v-else-if="items.length > 0">
        <div class="items-grid">
          <!-- Items -->
        </div>
        <Pagination 
          :current-page="pagination.page" 
          :total-pages="pagination.totalPages" 
          :total="pagination.total" 
          @page-change="handlePageChange" 
        />
      </div>
      <div v-else class="empty-state">...</div>
    </div>
  </DefaultLayout>
</template>
```

### Script
```javascript
import { ref, onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'

const { success, error } = useNotification()
const searchQuery = ref('')
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 })

let searchTimeout = null

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadItems()
  }, 500)
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadItems()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const loadItems = async () => {
  try {
    loading.value = true
    const params = { page: pagination.value.page, limit: pagination.value.limit }
    if (searchQuery.value) params.search = searchQuery.value
    
    const response = await apiService.getXXX(params)
    items.value = response.data || []
    if (response.pagination) {
      pagination.value.total = response.pagination.total
      pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages
    }
  } catch (err) {
    console.error('Error:', err)
    error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}
```

## Endpoints backend

Tous les endpoints de référence supportent déjà :
- `?page=1`
- `?limit=12`
- `?search=query`

Exemple : `/api/reference/vehicle-categories?page=1&limit=12&search=SUV`

