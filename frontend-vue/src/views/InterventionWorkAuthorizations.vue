<template>
  <DefaultLayout>
    <template #header>
      <h1>Autorisations de travail</h1>
      <p>Gérez les autorisations d'accord pour les réparations</p>
    </template>

    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvelle autorisation
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
          <option value="validated">Validées</option>
        </select>
      </div>

      <!-- Collaborateur -->
      <div class="filter-section">
        <label class="filter-label">Autorisé par</label>
        <SimpleSelector
          v-model="filters.authorizedById"
          api-method="getCollaborateurs"
          placeholder="Tous"
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
      <p>Chargement des autorisations...</p>
    </div>

    <!-- Tableau d'autorisations -->
    <div v-else-if="authorizations.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Autorisation</th>
            <th>Intervention</th>
            <th>Devis réf.</th>
            <th>Autorisé par</th>
            <th>Date</th>
            <th>Lignes</th>
            <th>Statut</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="auth in authorizations" :key="auth.id" :class="{ 'row-validated': auth.isValidated }">
            <td class="auth-number">
              <i class="fas fa-file-signature"></i>
              {{ auth.authorizationNumber }}
            </td>
            <td>{{ auth.intervention?.interventionNumber }} - {{ auth.intervention?.title }}</td>
            <td>{{ auth.quote?.quoteNumber || '-' }}</td>
            <td>{{ getCollaboratorLabel(auth.authorizedBy) }}</td>
            <td>{{ formatDate(auth.authorizationDate) }}</td>
            <td>
              <span class="badge-count">{{ auth.lines?.length || 0 }} ligne(s)</span>
            </td>
            <td>
              <span v-if="auth.isValidated" class="validated-badge">
                <i class="fas fa-check-circle"></i> Validée
              </span>
              <button v-else @click="validateAuthorization(auth)" class="btn-validate-small">
                <i class="fas fa-check"></i> Valider
              </button>
            </td>
            <td class="actions-column">
              <div class="action-buttons">
                <button @click="openEditModal(auth)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(auth)" class="btn-icon btn-delete" title="Supprimer">
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
        <i class="fas fa-file-signature"></i>
      </div>
      <h3>Aucune autorisation</h3>
      <p>Commencez par créer votre première autorisation de travail</p>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Créer une autorisation
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
      :title="isEditing ? 'Modifier l\'autorisation' : 'Nouvelle autorisation'"
      size="xlarge"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- Intervention et Devis -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention et Devis</h4>
          
          <div class="form-row">
            <InterventionSelector
              v-model="form.interventionId"
              label="Intervention"
              required
              :status-filter="['approved', 'in_approval']"
            />

            <div class="form-group">
              <label>Devis de référence (optionnel)</label>
              <select v-model="form.quoteId" @change="handleQuoteChange">
                <option :value="null">Aucun devis</option>
                <option v-for="quote in availableQuotes" :key="quote.id" :value="quote.id">
                  {{ quote.quoteNumber }} - {{ formatCurrency(quote.totalAmount) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Collaborateur et Date -->
        <div class="form-section">
          <h4><i class="fas fa-calendar"></i> Informations d'autorisation</h4>
          
          <div class="form-row">
            <SimpleSelector
              v-model="form.authorizedById"
              api-method="getCollaborateurs"
              label="Autorisé par"
              placeholder="Sélectionner un collaborateur"
              required
            />

            <div class="form-group">
              <label>Date d'autorisation <span class="required">*</span></label>
              <input
                v-model="form.authorizationDate"
                type="date"
                required
              />
            </div>
          </div>
        </div>

        <!-- Instructions spéciales -->
        <div class="form-section">
          <h4><i class="fas fa-file-alt"></i> Instructions spéciales</h4>
          
          <div class="form-group">
            <textarea
              v-model="form.specialInstructions"
              rows="3"
              placeholder="Conditions, restrictions ou instructions particulières..."
            ></textarea>
          </div>
        </div>

        <!-- Lignes autorisées -->
        <div class="form-section">
          <QuoteLineEditor
            v-model="form.lines"
            @change="handleLinesChange"
          />
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
import { ref, computed, onMounted, watch } from 'vue'
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
const authorizations = ref([])
const availableQuotes = ref([])
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
  quoteId: null,
  authorizedById: null,
  authorizationDate: new Date().toISOString().split('T')[0],
  specialInstructions: '',
  lines: []
})

// Totaux
const authTotals = ref({
  subtotal: 0,
  totalDiscount: 0,
  totalHT: 0,
  totalTVA: 0,
  totalTTC: 0
})

// Recherche et filtres
const searchQuery = ref('')
const filters = ref({
  authorizedById: null,
  validated: 'all',
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

// Compteur de filtres actifs
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.authorizedById) count++
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
const loadAuthorizations = async () => {
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

    if (filters.value.authorizedById) {
      params.authorizedById = filters.value.authorizedById
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

    const response = await apiService.getInterventionWorkAuthorizations(params)

    if (response.success) {
      authorizations.value = response.data || []
      
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
    console.error('Error loading authorizations:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    error('Erreur lors du chargement des autorisations')
  } finally {
    loading.value = false
  }
}

const loadQuotesForIntervention = async (interventionId) => {
  if (!interventionId) {
    availableQuotes.value = []
    return
  }

  try {
    const response = await apiService.getInterventionQuotes({
      interventionId: interventionId,
      isValidated: true,
      limit: 100
    })

    if (response.success) {
      availableQuotes.value = response.data || []
    }
  } catch (err) {
    console.error('Error loading quotes:', err)
  }
}

const handleQuoteChange = async () => {
  if (!form.value.quoteId) {
    return
  }

  try {
    const response = await apiService.getInterventionQuote(form.value.quoteId)
    
    if (response.success && response.data && response.data.lines) {
      // Copier les lignes du devis
      form.value.lines = response.data.lines.map(line => ({
        supplyId: line.supply?.id || null,
        workType: line.workType || 'supply',
        description: line.description || '',
        quantity: parseFloat(line.quantity) || 1,
        unitPrice: parseFloat(line.unitPrice) || 0,
        discountPercentage: parseFloat(line.discountPercentage) || null,
        discountAmount: parseFloat(line.discountAmount) || null,
        taxRate: parseFloat(line.taxRate) || 18,
        lineTotal: parseFloat(line.lineTotal) || 0,
        notes: line.notes || ''
      }))
      
      success('Lignes copiées depuis le devis')
    }
  } catch (err) {
    console.error('Error loading quote:', err)
    error('Erreur lors du chargement du devis')
  }
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadAuthorizations()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadAuthorizations()
}

const resetFilters = () => {
  filters.value = {
    authorizedById: null,
    validated: 'all',
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadAuthorizations()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadAuthorizations()
}

const openCreateModal = () => {
  isEditing.value = false
  resetForm()
  showModal.value = true
}

const openEditModal = (auth) => {
  isEditing.value = true
  form.value = {
    id: auth.id,
    interventionId: auth.intervention?.id || null,
    quoteId: auth.quote?.id || null,
    authorizedById: auth.authorizedBy?.id || null,
    authorizationDate: auth.authorizationDate ? auth.authorizationDate.split('T')[0] : new Date().toISOString().split('T')[0],
    specialInstructions: auth.specialInstructions || '',
    lines: auth.lines ? auth.lines.map(line => ({
      id: line.id,
      supplyId: line.supply?.id || null,
      workType: line.workType || 'supply',
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 1,
      unitPrice: parseFloat(line.unitPrice) || 0,
      discountPercentage: parseFloat(line.discountPercentage) || null,
      discountAmount: parseFloat(line.discountAmount) || null,
      taxRate: parseFloat(line.taxRate) || 18,
      lineTotal: parseFloat(line.lineTotal) || 0,
      notes: line.notes || ''
    })) : []
  }
  
  // Load quotes for this intervention
  if (form.value.interventionId) {
    loadQuotesForIntervention(form.value.interventionId)
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
    quoteId: null,
    authorizedById: null,
    authorizationDate: new Date().toISOString().split('T')[0],
    specialInstructions: '',
    lines: []
  }
  availableQuotes.value = []
  authTotals.value = {
    subtotal: 0,
    totalDiscount: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0
  }
}

const handleLinesChange = (data) => {
  authTotals.value = data.totals
}

const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (!form.value.authorizedById) {
      warning('Veuillez sélectionner la personne qui autorise')
      return
    }

    if (form.value.lines.length === 0) {
      warning('Veuillez ajouter au moins une ligne')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      quoteId: form.value.quoteId || null,
      authorizedById: form.value.authorizedById,
      authorizationDate: form.value.authorizationDate,
      specialInstructions: form.value.specialInstructions || null,
      lines: form.value.lines
    }

    let response
    if (isEditing.value) {
      response = await apiService.updateInterventionWorkAuthorization(form.value.id, data)
    } else {
      response = await apiService.createInterventionWorkAuthorization(data)
    }

    if (response.success) {
      success(isEditing.value ? 'Autorisation modifiée avec succès' : 'Autorisation créée avec succès')
      closeModal()
      await loadAuthorizations()
    } else {
      throw new Error(response.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving authorization:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const validateAuthorization = async (auth) => {
  if (!confirm(`Êtes-vous sûr de vouloir valider l'autorisation ${auth.authorizationNumber} ?`)) {
    return
  }

  try {
    const response = await apiService.updateInterventionWorkAuthorization(auth.id, {
      ...auth,
      isValidated: true
    })

    if (response.success) {
      success('Autorisation validée avec succès')
      await loadAuthorizations()
    } else {
      throw new Error(response.message || 'Erreur lors de la validation')
    }
  } catch (err) {
    console.error('Error validating authorization:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la validation')
  }
}

const confirmDelete = async (auth) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'autorisation ${auth.authorizationNumber} ?`)) {
    return
  }

  try {
    const response = await apiService.deleteInterventionWorkAuthorization(auth.id)
    if (response.success) {
      success('Autorisation supprimée avec succès')
      await loadAuthorizations()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting authorization:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}

// Helpers
const getCollaboratorLabel = (collaborator) => {
  if (!collaborator) return ''
  if (typeof collaborator === 'object') {
    return `${collaborator.firstName || ''} ${collaborator.lastName || ''}`.trim()
  }
  return collaborator
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

// Watchers
watch(() => form.value.interventionId, (newVal) => {
  if (newVal && !isEditing.value) {
    loadQuotesForIntervention(newVal)
  }
})

// Lifecycle
onMounted(() => {
  loadAuthorizations()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.auth-number {
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

.badge-count {
  display: inline-flex;
  padding: 0.25rem 0.625rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.auth-form {
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

