<template>
  <DefaultLayout>
    <template #header>
      <h1>Devis d'intervention</h1>
      <p>Gérez les devis et choisissez les meilleures offres</p>
    </template>

    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
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
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Chargement des devis...</p>
    </div>

    <!-- Tableau de devis -->
    <div v-else-if="quotes.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Devis</th>
            <th>Intervention</th>
            <th>Garage</th>
            <th>Date émission</th>
            <th>Valide jusqu'au</th>
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
            <td>{{ formatDate(quote.validUntil) }}</td>
            <td class="amount-cell">{{ formatCurrency(quote.totalAmount) }}</td>
            <td>
              <span v-if="quote.isValidated" class="validated-badge">
                <i class="fas fa-check-circle"></i> Validé
              </span>
              <button v-else @click="validateQuote(quote)" class="btn-validate-small">
                <i class="fas fa-check"></i> Valider
              </button>
            </td>
            <td class="actions-column">
              <div class="action-buttons">
                <button @click="openEditModal(quote)" class="btn-icon btn-edit" title="Modifier">
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
      <button @click="openCreateModal" class="btn-primary">
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

    <!-- Modal Créer/Modifier -->
    <Modal
      v-model="showModal"
      :title="isEditing ? 'Modifier le devis' : 'Nouveau devis'"
      size="xlarge"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit" class="quote-form">
        <!-- Intervention et Garage -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention et Garage</h4>
          
          <div class="form-row">
            <InterventionSelector
              v-model="form.interventionId"
              label="Intervention"
              required
              :status-filter="['prediagnostic_completed', 'in_quote']"
            />

            <SimpleSelector
              v-model="form.garageId"
              api-method="getGarages"
              label="Garage"
              placeholder="Sélectionner un garage"
            />
          </div>
        </div>

        <!-- Dates -->
        <div class="form-section">
          <h4><i class="fas fa-calendar"></i> Dates</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date d'émission <span class="required">*</span></label>
              <input
                v-model="form.quoteDate"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label>Valable jusqu'au</label>
              <input
                v-model="form.validUntil"
                type="date"
              />
            </div>

            <div class="form-group">
              <label>Date de réception</label>
              <input
                v-model="form.receivedDate"
                type="date"
              />
            </div>
          </div>
        </div>

        <!-- Lignes du devis -->
        <div class="form-section">
          <QuoteLineEditor
            v-model="form.lines"
            @change="handleLinesChange"
          />
        </div>

        <!-- Notes -->
        <div class="form-section">
          <h4><i class="fas fa-sticky-note"></i> Notes</h4>
          
          <div class="form-group">
            <textarea
              v-model="form.notes"
              rows="3"
              placeholder="Notes additionnelles..."
            ></textarea>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" @click="closeModal" class="btn-secondary">
          Annuler
        </button>
        <button type="submit" @click="handleSubmit" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </template>
    </Modal>

    <!-- Notifications d'erreur -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'
import QuoteLineEditor from '@/components/common/QuoteLineEditor.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import apiService from '@/services/api.service'

// Notifications
const { success, error, warning } = useNotification()

// État
const quotes = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

// Modals
const showModal = ref(false)
const showFiltersPanel = ref(false)
const isEditing = ref(false)

// Formulaire
const form = ref({
  interventionId: null,
  garageId: null,
  quoteDate: new Date().toISOString().split('T')[0],
  validUntil: null,
  receivedDate: null,
  lines: [],
  notes: ''
})

// Totaux (mis à jour par QuoteLineEditor)
const quoteTotals = ref({
  subtotal: 0,
  totalDiscount: 0,
  totalHT: 0,
  totalTVA: 0,
  totalTTC: 0
})

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

const openCreateModal = () => {
  isEditing.value = false
  resetForm()
  showModal.value = true
}

const openEditModal = (quote) => {
  isEditing.value = true
  form.value = {
    id: quote.id,
    interventionId: quote.intervention?.id || null,
    garageId: quote.garage?.id || null,
    quoteDate: quote.quoteDate ? quote.quoteDate.split('T')[0] : new Date().toISOString().split('T')[0],
    validUntil: quote.validUntil ? quote.validUntil.split('T')[0] : null,
    receivedDate: quote.receivedDate ? quote.receivedDate.split('T')[0] : null,
    lines: quote.lines ? quote.lines.map(line => ({
      id: line.id,
      supplyId: line.supply?.id || null,
      workType: line.workType || 'supply',
      quantity: parseFloat(line.quantity) || 1,
      unitPrice: parseFloat(line.unitPrice) || 0,
      discountPercentage: parseFloat(line.discountPercentage) || null,
      discountAmount: parseFloat(line.discountAmount) || null,
      taxRate: parseFloat(line.taxRate) || 18,
      lineTotal: parseFloat(line.lineTotal) || 0,
      notes: line.notes || ''
    })) : [],
    notes: quote.notes || ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    interventionId: null,
    garageId: null,
    quoteDate: new Date().toISOString().split('T')[0],
    validUntil: null,
    receivedDate: null,
    lines: [],
    notes: ''
  }
  quoteTotals.value = {
    subtotal: 0,
    totalDiscount: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0
  }
}

const handleLinesChange = (data) => {
  quoteTotals.value = data.totals
}

const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (form.value.lines.length === 0) {
      warning('Veuillez ajouter au moins une ligne au devis')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      garageId: form.value.garageId || null,
      quoteDate: form.value.quoteDate,
      validUntil: form.value.validUntil || null,
      receivedDate: form.value.receivedDate || null,
      totalAmount: quoteTotals.value.totalTTC,
      laborCost: calculateLaborCost(),
      partsCost: calculatePartsCost(),
      taxAmount: quoteTotals.value.totalTVA,
      lines: form.value.lines,
      notes: form.value.notes || null
    }

    let response
    if (isEditing.value) {
      response = await apiService.updateInterventionQuote(form.value.id, data)
    } else {
      response = await apiService.createInterventionQuote(data)
    }

    if (response.success) {
      success(isEditing.value ? 'Devis modifié avec succès' : 'Devis créé avec succès')
      closeModal()
      await loadQuotes()
    } else {
      throw new Error(response.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving quote:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const validateQuote = async (quote) => {
  if (!confirm(`Êtes-vous sûr de vouloir valider le devis ${quote.quoteNumber} ?`)) {
    return
  }

  try {
    // TODO: Implémenter la validation côté backend
    // Pour le moment, on met à jour isValidated
    const response = await apiService.updateInterventionQuote(quote.id, {
      ...quote,
      isValidated: true,
      validatedAt: new Date().toISOString()
    })

    if (response.success) {
      success('Devis validé avec succès')
      await loadQuotes()
    } else {
      throw new Error(response.message || 'Erreur lors de la validation')
    }
  } catch (err) {
    console.error('Error validating quote:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la validation')
  }
}

const confirmDelete = async (quote) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le devis ${quote.quoteNumber} ?`)) {
    return
  }

  try {
    const response = await apiService.deleteInterventionQuote(quote.id)
    if (response.success) {
      success('Devis supprimé avec succès')
      await loadQuotes()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting quote:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}

// Helpers
const calculateLaborCost = () => {
  return form.value.lines
    .filter(line => line.workType === 'labor')
    .reduce((sum, line) => sum + (parseFloat(line.lineTotal) || 0), 0)
}

const calculatePartsCost = () => {
  return form.value.lines
    .filter(line => line.workType === 'supply')
    .reduce((sum, line) => sum + (parseFloat(line.lineTotal) || 0), 0)
}

const getGarageLabel = (garage) => {
  if (!garage) return ''
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

.btn-validate-small {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #059669;
  }

  i {
    font-size: 0.85rem;
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

