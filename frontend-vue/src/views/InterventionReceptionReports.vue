<template>
  <DefaultLayout>
    <template #header>
      <h1>Rapports de réception</h1>
      <p>Gérez les contrôles qualité post-réparation</p>
    </template>

    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouveau rapport
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
    <LoadingSpinner v-if="loading" text="Chargement des rapports..." />

    <!-- Tableau de rapports -->
    <div v-else-if="reports.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Réception</th>
            <th>Intervention</th>
            <th>Date</th>
            <th>Réceptionné par</th>
            <th>Satisfaction</th>
            <th>État véhicule</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reports" :key="report.id" :class="{ 'row-ready': report.isVehicleReady }">
            <td class="report-number">
              <i class="fas fa-clipboard-check"></i>
              {{ report.receptionNumber }}
            </td>
            <td>{{ report.intervention?.interventionNumber }} - {{ report.intervention?.title }}</td>
            <td>{{ formatDate(report.receptionDate) }}</td>
            <td>{{ getUserLabel(report.receivedBy) }}</td>
            <td>
              <span class="satisfaction-badge" :class="`satisfaction-${report.customerSatisfaction}`">
                <i :class="getSatisfactionIcon(report.customerSatisfaction)"></i>
                {{ getSatisfactionLabel(report.customerSatisfaction) }}
              </span>
            </td>
            <td>
              <span v-if="report.isVehicleReady" class="ready-badge">
                <i class="fas fa-check-circle"></i> Prêt
              </span>
              <span v-else class="not-ready-badge">
                <i class="fas fa-clock"></i> Non prêt
              </span>
            </td>
            <td class="actions-column">
              <div class="action-buttons">
                <button @click="openEditModal(report)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(report)" class="btn-icon btn-delete" title="Supprimer">
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
      <h3>Aucun rapport</h3>
      <p>Commencez par créer votre premier rapport de réception</p>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Créer un rapport
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
      :title="isEditing ? 'Modifier le rapport' : 'Nouveau rapport de réception'"
      size="large"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit" class="report-form">
        <!-- Intervention -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention</h4>
          
          <InterventionSelector
            v-model="form.interventionId"
            label="Intervention"
            required
            :status-filter="['repair_completed', 'in_reception']"
          />
        </div>

        <!-- Informations de réception -->
        <div class="form-section">
          <h4><i class="fas fa-calendar"></i> Informations de réception</h4>
          
          <div class="form-row">
            <SimpleSelector
              v-model="form.receivedBy"
              api-method="getUsers"
              label="Réceptionné par"
              placeholder="Sélectionner un utilisateur"
              required
            />

            <div class="form-group">
              <label>Date de réception <span class="required">*</span></label>
              <input
                v-model="form.receptionDate"
                type="date"
                required
              />
            </div>
          </div>
        </div>

        <!-- État du véhicule -->
        <div class="form-section">
          <h4><i class="fas fa-car"></i> État du véhicule</h4>
          
          <div class="form-group">
            <label>Description de l'état <span class="required">*</span></label>
            <textarea
              v-model="form.vehicleCondition"
              rows="3"
              required
              placeholder="Décrivez l'état général du véhicule après réparation..."
            ></textarea>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.isVehicleReady" />
              <span><i class="fas fa-check-circle"></i> Véhicule prêt à être restitué</span>
            </label>
          </div>
        </div>

        <!-- Travaux et contrôles -->
        <div class="form-section">
          <h4><i class="fas fa-tools"></i> Travaux effectués</h4>
          
          <div class="form-group">
            <label>Travaux réalisés <span class="required">*</span></label>
            <textarea
              v-model="form.workCompleted"
              rows="4"
              required
              placeholder="Listez tous les travaux qui ont été effectués..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>Problèmes restants</label>
            <textarea
              v-model="form.remainingIssues"
              rows="3"
              placeholder="Indiquez les éventuels problèmes non résolus ou à surveiller..."
            ></textarea>
          </div>
        </div>

        <!-- Satisfaction client -->
        <div class="form-section">
          <h4><i class="fas fa-star"></i> Satisfaction client</h4>
          
          <div class="form-group">
            <label>Note de satisfaction <span class="required">*</span></label>
            <div class="satisfaction-selector">
              <label 
                v-for="level in satisfactionLevels" 
                :key="level.value"
                class="satisfaction-option"
                :class="{ 'selected': form.customerSatisfaction === level.value }"
              >
                <input 
                  type="radio" 
                  v-model="form.customerSatisfaction" 
                  :value="level.value"
                  required
                />
                <div class="option-content">
                  <i :class="level.icon" :style="{ color: level.color }"></i>
                  <span>{{ level.label }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Photos -->
        <div class="form-section">
          <h4><i class="fas fa-camera"></i> Photos du véhicule</h4>
          
          <DocumentUploader
            v-model="form.documents"
            label="Photos après réparation"
            :max-files="10"
            :max-size-mb="10"
            :accept="['image/*']"
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
import { ref, computed, onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'
import DocumentUploader from '@/components/common/DocumentUploader.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import apiService from '@/services/api.service'

// Notifications
const { success, error, warning } = useNotification()

// État
const reports = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

// Modals
const showModal = ref(false)
const showFiltersPanel = ref(false)
const isEditing = ref(false)

// Niveaux de satisfaction
const satisfactionLevels = [
  { value: 'excellent', label: 'Excellente', icon: 'fas fa-smile-beam', color: '#10b981' },
  { value: 'good', label: 'Bonne', icon: 'fas fa-smile', color: '#3b82f6' },
  { value: 'average', label: 'Moyenne', icon: 'fas fa-meh', color: '#f59e0b' },
  { value: 'poor', label: 'Mauvaise', icon: 'fas fa-frown', color: '#ef4444' }
]

// Formulaire
const form = ref({
  interventionId: null,
  receivedBy: null,
  receptionDate: new Date().toISOString().split('T')[0],
  vehicleCondition: '',
  workCompleted: '',
  remainingIssues: '',
  customerSatisfaction: 'good',
  isVehicleReady: true,
  documents: []
})

// Recherche et filtres
const searchQuery = ref('')
const filters = ref({
  satisfaction: 'all',
  vehicleReady: 'all',
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

// Compteur de filtres actifs
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.satisfaction !== 'all') count++
  if (filters.value.vehicleReady !== 'all') count++
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
const loadReports = async () => {
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

    if (filters.value.satisfaction !== 'all') {
      params.customerSatisfaction = filters.value.satisfaction
    }

    if (filters.value.vehicleReady !== 'all') {
      params.isVehicleReady = filters.value.vehicleReady === 'ready'
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

    const response = await apiService.getInterventionReceptionReports(params)

    if (response.success) {
      reports.value = response.data || []
      
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
    console.error('Error loading reports:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    error('Erreur lors du chargement des rapports')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadReports()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadReports()
}

const resetFilters = () => {
  filters.value = {
    satisfaction: 'all',
    vehicleReady: 'all',
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadReports()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadReports()
}

const openCreateModal = () => {
  isEditing.value = false
  resetForm()
  showModal.value = true
}

const openEditModal = (report) => {
  isEditing.value = true
  form.value = {
    id: report.id,
    interventionId: report.intervention?.id || null,
    receivedBy: report.receivedBy || null,
    receptionDate: report.receptionDate ? report.receptionDate.split(/[T\s]/)[0] : new Date().toISOString().split('T')[0],
    vehicleCondition: report.vehicleCondition || '',
    workCompleted: report.workCompleted || '',
    remainingIssues: report.remainingIssues || '',
    customerSatisfaction: report.customerSatisfaction || 'good',
    isVehicleReady: report.isVehicleReady !== false,
    documents: []  // TODO: Load existing documents
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
    receivedBy: null,
    receptionDate: new Date().toISOString().split('T')[0],
    vehicleCondition: '',
    workCompleted: '',
    remainingIssues: '',
    customerSatisfaction: 'good',
    isVehicleReady: true,
    documents: []
  }
}

const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (!form.value.receivedBy) {
      warning('Veuillez sélectionner la personne qui réceptionne')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      receivedBy: form.value.receivedBy,
      receptionDate: form.value.receptionDate,
      vehicleCondition: form.value.vehicleCondition,
      workCompleted: form.value.workCompleted,
      remainingIssues: form.value.remainingIssues || null,
      customerSatisfaction: form.value.customerSatisfaction,
      isVehicleReady: form.value.isVehicleReady
    }

    let response
    if (isEditing.value) {
      response = await apiService.updateInterventionReceptionReport(form.value.id, data)
    } else {
      response = await apiService.createInterventionReceptionReport(data)
    }

    if (response.success) {
      success(isEditing.value ? 'Rapport modifié avec succès' : 'Rapport créé avec succès')
      closeModal()
      await loadReports()
    } else {
      throw new Error(response.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving report:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (report) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le rapport ${report.receptionNumber} ?`)) {
    return
  }

  try {
    const response = await apiService.deleteInterventionReceptionReport(report.id)
    if (response.success) {
      success('Rapport supprimé avec succès')
      await loadReports()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting report:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}

// Helpers
const getUserLabel = (userId) => {
  // TODO: Charger les infos utilisateur
  return `User #${userId}`
}

const getSatisfactionLabel = (satisfaction) => {
  const level = satisfactionLevels.find(l => l.value === satisfaction)
  return level ? level.label : satisfaction
}

const getSatisfactionIcon = (satisfaction) => {
  const level = satisfactionLevels.find(l => l.value === satisfaction)
  return level ? level.icon : 'fas fa-star'
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
  loadReports()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.report-number {
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: #3b82f6;
  }
}

.row-ready {
  background: #f0fdf4 !important;
}

.ready-badge {
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

.not-ready-badge {
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

.satisfaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;

  i {
    font-size: 1rem;
  }

  &.satisfaction-excellent {
    background: #d1fae5;
    color: #065f46;
  }

  &.satisfaction-good {
    background: #dbeafe;
    color: #1e40af;
  }

  &.satisfaction-average {
    background: #fef3c7;
    color: #92400e;
  }

  &.satisfaction-poor {
    background: #fee2e2;
    color: #991b1b;
  }
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.checkbox-group {
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #374151;

      i {
        font-size: 1.1rem;
        color: #10b981;
      }
    }

    &:hover {
      background: #f0fdf4;
      border-color: #10b981;
    }
  }
}

.satisfaction-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.satisfaction-option {
  cursor: pointer;
  
  input[type="radio"] {
    display: none;
  }

  .option-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.25rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;

    i {
      font-size: 2rem;
    }

    span {
      font-weight: 600;
      color: #4b5563;
      font-size: 0.9rem;
    }
  }

  &:hover .option-content {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected .option-content {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);

    span {
      color: #1e40af;
    }
  }
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

