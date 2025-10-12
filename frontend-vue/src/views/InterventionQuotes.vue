<template>
  <DefaultLayout>
    <template #header>
      <h1>Devis d'intervention</h1>
      <p>Gérez les devis et choisissez les meilleures offres</p>
    </template>

    <template #header-actions>
      <button @click="goToCreate" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouveau devis
      </button>
    </template>

    <!-- Recherche et bouton filtres -->
    <div class="search-filters-bar">
      <SearchBar 
        v-model="searchQuery" 
        placeholder="Rechercher par n°, intervention..."
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
        <SimpleSelector
          v-model="filters.garageId"
          api-method="getGarages"
          placeholder="Tous les garages"
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
    <LoadingSpinner v-if="loading" text="Chargement des devis..." />

    <!-- Tableau de devis -->
    <div v-else-if="quotes.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Devis</th>
            <th>Intervention</th>
            <th>Garage</th>
            <th>Date émission</th>
            <th>Montant TTC</th>
            <th>Statut</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="quote in quotes" :key="quote.id" :class="{ 'row-validated': quote.isValidated }">
            <td class="quote-number">
              <i class="fas fa-file-invoice-dollar"></i>
              {{ quote.quoteNumber }}
            </td>
            <td>{{ quote.intervention?.interventionNumber }} - {{ quote.intervention?.title }}</td>
            <td>{{ getGarageLabel(quote.garage) }}</td>
            <td>{{ formatDate(quote.quoteDate) }}</td>
            <td class="amount-cell">{{ formatCurrency(quote.totalAmount) }}</td>
            <td>
              <span v-if="quote.isValidated" class="validated-badge">
                <i class="fas fa-check-circle"></i> Validé
              </span>
              <span v-else class="pending-badge">
                <i class="fas fa-clock"></i> En attente
              </span>
            </td>
            <td class="actions-column">
              <div class="action-buttons">
                <button @click="goToEdit(quote.id)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(quote)" class="btn-icon btn-delete" title="Supprimer">
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
        <i class="fas fa-file-invoice-dollar"></i>
      </div>
      <h3>Aucun devis</h3>
      <p>Commencez par créer votre premier devis</p>
      <button @click="goToCreate" class="btn-primary">
        <i class="fas fa-plus"></i>
        Créer un devis
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
      message="Êtes-vous sûr de vouloir supprimer ce devis ?"
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
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import apiService from '@/services/api.service'

// Notifications et navigation
const router = useRouter()
const { success, error, warning } = useNotification()

// État
const quotes = ref([])
const loading = ref(false)
const errorMessage = ref('')

// Modals
const showFiltersPanel = ref(false)

// Modal de suppression
const showDeleteModal = ref(false)
const itemToDelete = ref(null)
const deleting = ref(false)

// Recherche et filtres
const searchQuery = ref('')
const filters = ref({
  garageId: null,
  validated: 'all',
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

// Compteur de filtres actifs
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.garageId) count++
  if (filters.value.validated !== 'all') count++
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
const loadQuotes = async () => {
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

    if (filters.value.garageId) {
      params.garageId = filters.value.garageId
    }

    if (filters.value.validated !== 'all') {
      params.isValidated = filters.value.validated === 'validated'
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

    const response = await apiService.getInterventionQuotes(params)

    if (response.success) {
      quotes.value = response.data || []
      
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
    console.error('Error loading quotes:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    error('Erreur lors du chargement des devis')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadQuotes()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadQuotes()
}

const resetFilters = () => {
  filters.value = {
    garageId: null,
    validated: 'all',
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadQuotes()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadQuotes()
}

const goToCreate = () => {
  router.push({ name: 'InterventionQuoteCreate' })
}

const goToEdit = (id) => {
  router.push({ name: 'InterventionQuoteEdit', params: { id } })
}

const confirmDelete = (quote) => {
  itemToDelete.value = quote
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
    const response = await apiService.deleteInterventionQuote(itemToDelete.value.id)
    if (response.success) {
      success('Devis supprimé avec succès')
      closeDeleteModal()
      await loadQuotes()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting quote:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  } finally {
    deleting.value = false
  }
}

// Helpers
const getGarageLabel = (garage) => {
  if (!garage) return 'N/A'
  return typeof garage === 'object' ? garage.name : garage
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

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 XOF'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

// Lifecycle
onMounted(() => {
  loadQuotes()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.quote-number {
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: #3b82f6;
  }
}

.row-validated {
  background: #f0fdf4 !important;
}

.amount-cell {
  font-weight: 700;
  color: #1f2937;
  font-size: 1.05rem;
}

.validated-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;

  i {
    color: #10b981;
  }
}

.pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;

  i {
    color: #f59e0b;
  }
}

.quote-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #3b82f6;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }
}
</style>

