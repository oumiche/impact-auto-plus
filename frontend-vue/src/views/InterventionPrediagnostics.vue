<template>
  <DefaultLayout>
    <template #header>
      <h1>Prédiagnostics</h1>
      <p>Gérez les prédiagnostics techniques des interventions</p>
    </template>

    <template #header-actions>
      <button @click="goToCreate" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouveau prédiagnostic
      </button>
    </template>

    <!-- Recherche et bouton filtres -->
    <div class="search-filters-bar">
      <SearchBar 
        v-model="searchQuery" 
        placeholder="Rechercher par intervention, expert..."
        @search="handleSearch"
      />
      <button @click="showFiltersPanel = true" class="btn-filters">
        <i class="fas fa-filter"></i>
        Filtres
        <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
      </button>
    </div>

    <!-- Panneau de filtres latéral -->
    <FilterPanel
      v-model="showFiltersPanel"
      :active-filters-count="activeFiltersCount"
      @apply="applyFilters"
      @reset="resetFilters"
    >
      <!-- Expert -->
      <div class="filter-section">
        <label class="filter-label">Expert</label>
        <SimpleSelector
          v-model="filters.expertId"
          api-method="getCollaborateurs"
          placeholder="Tous les experts"
        />
      </div>

      <!-- Marque -->
      <div class="filter-section">
        <label class="filter-label">Marque</label>
        <BrandSelectorSearch
          v-model="filters.brandId"
          @change="handleBrandChange"
        />
      </div>

      <!-- Modèle -->
      <div class="filter-section">
        <label class="filter-label">Modèle</label>
        <ModelSelector
          v-model="filters.modelId"
          :brand-id="filters.brandId"
          :disabled="!filters.brandId"
        />
        <small v-if="!filters.brandId" class="filter-hint">Sélectionnez d'abord une marque</small>
      </div>

      <!-- Période -->
      <div class="filter-section">
        <label class="filter-label">Période</label>
        <div class="date-range">
          <div class="date-input-group">
            <label class="date-label">Date début</label>
            <input 
              type="date" 
              v-model="filters.dateStart"
              :max="filters.dateEnd || null"
              class="filter-control"
            />
          </div>
          <div class="date-input-group">
            <label class="date-label">Date fin</label>
            <input 
              type="date" 
              v-model="filters.dateEnd"
              :min="filters.dateStart || null"
              class="filter-control"
            />
          </div>
        </div>
      </div>
    </FilterPanel>

    <!-- Loading state -->
    <LoadingSpinner v-if="loading" text="Chargement des prédiagnostics..." />

    <!-- Tableau de prédiagnostics -->
    <div v-else-if="prediagnostics.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Prédiagnostic</th>
            <th>Intervention</th>
            <th>Véhicule</th>
            <th>Expert</th>
            <th>Date</th>
            <th>Statut</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prediag in prediagnostics" :key="prediag.id">
            <td class="code-cell">
              <i class="fas fa-file-alt"></i>
              {{ prediag.code || `PRED-${prediag.id}` }}
            </td>
            <td class="intervention-cell">
              <i class="fas fa-wrench"></i>
              {{ prediag.intervention?.interventionNumber || `INT-${prediag.intervention?.id}` }}
            </td>
            <td>{{ getVehicleLabel(prediag.intervention?.vehicle) }}</td>
            <td>{{ getExpertLabel(prediag.expert) }}</td>
            <td>{{ formatDate(prediag.prediagnosticDate) }}</td>
            <td>
              <StatusBadge :status="prediag.intervention?.currentStatus || 'unknown'" />
            </td>
            <td class="actions-column">
              <div class="action-buttons">
                <button @click="goToEdit(prediag.id)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(prediag)" class="btn-icon btn-delete" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- État vide -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-clipboard-check"></i>
      </div>
      <h3>Aucun prédiagnostic</h3>
      <p>Commencez par créer votre premier prédiagnostic</p>
      <button @click="goToCreate" class="btn-primary">
        <i class="fas fa-plus"></i>
        Créer un prédiagnostic
      </button>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="pagination.totalPages > 1"
      :current-page="pagination.currentPage"
      :total-pages="pagination.totalPages"
      :total-items="pagination.totalItems"
      @page-change="handlePageChange"
    />

    <!-- Notifications d'erreur -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>

    <!-- Modal de confirmation de suppression -->
    <ConfirmDialog
      v-model="showDeleteModal"
      title="Confirmer la suppression"
      message="Êtes-vous sûr de vouloir supprimer ce prédiagnostic ?"
      warning="Cette action est irréversible."
      type="danger"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      loading-text="Suppression..."
      :loading="deleting"
      @confirm="executeDelete"
      @cancel="closeDeleteModal"
    />
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import apiService from '@/services/api.service'

// Notifications
const router = useRouter()
const { success, error } = useNotification()

// État
const prediagnostics = ref([])
const loading = ref(false)
const errorMessage = ref('')
const showFiltersPanel = ref(false)

// Modal de suppression
const showDeleteModal = ref(false)
const itemToDelete = ref(null)
const deleting = ref(false)

// Recherche et filtres
const searchQuery = ref('')
const filters = ref({
  expertId: null,
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

// Compteur de filtres actifs
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.expertId) count++
  if (filters.value.brandId) count++
  if (filters.value.modelId) count++
  if (filters.value.dateStart) count++
  if (filters.value.dateEnd) count++
  return count
})

// Pagination
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 12
})

const currentPage = computed(() => pagination.value.currentPage)
const totalPages = computed(() => pagination.value.totalPages)

// Méthodes
const loadPrediagnostics = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.itemsPerPage
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (filters.value.expertId) {
      params.expertId = filters.value.expertId
    }

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

    const response = await apiService.getInterventionPrediagnostics(params)

    if (response.success) {
      prediagnostics.value = response.data || []
      
      if (response.pagination) {
        pagination.value = {
          currentPage: response.pagination.currentPage || 1,
          totalPages: response.pagination.totalPages || 1,
          totalItems: response.pagination.totalItems || 0,
          itemsPerPage: response.pagination.itemsPerPage || 12
        }
      }
    } else {
      throw new Error(response.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading prediagnostics:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    error('Erreur lors du chargement des prédiagnostics')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadPrediagnostics()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadPrediagnostics()
}

const resetFilters = () => {
  filters.value = {
    expertId: null,
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadPrediagnostics()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadPrediagnostics()
}

const goToCreate = () => {
  router.push({ name: 'InterventionPrediagnosticCreate' })
}

const goToEdit = (id) => {
  router.push({ name: 'InterventionPrediagnosticEdit', params: { id } })
}

const confirmDelete = (prediag) => {
  itemToDelete.value = prediag
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
  deleting.value = false
}

const executeDelete = async () => {
  if (!itemToDelete.value) return
  
  deleting.value = true
  
  try {
    const response = await apiService.deleteInterventionPrediagnostic(itemToDelete.value.id)
    if (response.success) {
      success('Prédiagnostic supprimé avec succès')
      closeDeleteModal()
      await loadPrediagnostics()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting prediagnostic:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  } finally {
    deleting.value = false
  }
}

// Helpers
const getVehicleLabel = (vehicle) => {
  if (!vehicle) return 'N/A'
  if (typeof vehicle === 'object') {
    const brand = vehicle.brand?.name || vehicle.brandName || ''
    const model = vehicle.model?.name || vehicle.modelName || ''
    const plate = vehicle.plateNumber || vehicle.plate_number || ''
    return `${brand} ${model} (${plate})`.trim()
  }
  return vehicle
}

const getDriverLabel = (driver) => {
  if (!driver) return ''
  if (typeof driver === 'object') {
    return `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
  }
  return driver
}

const getExpertLabel = (expert) => {
  if (!expert) return ''
  if (typeof expert === 'object') {
    return `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
  }
  return expert
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadPrediagnostics()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.code-cell {
  font-weight: 600;
  color: #059669;
  
  i {
    color: #059669;
    margin-right: 0.5rem;
  }
}

.intervention-cell {
  font-weight: 600;
  color: #3b82f6;

  i {
    color: #3b82f6;
    margin-right: 0.5rem;
  }
}

.badge-count {
  display: inline-flex;
  padding: 0.25rem 0.625rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

</style>

