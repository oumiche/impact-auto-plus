<template>
  <DefaultLayout>
    <template #header>
      <h1>Gestion des Interventions</h1>
      <p>Suivez le workflow complet des interventions sur vos véhicules</p>
    </template>

    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvelle intervention
      </button>
    </template>

    <!-- Recherche et bouton filtres -->
    <div class="search-filters-bar">
      <SearchBar 
        v-model="searchQuery" 
        placeholder="Rechercher par n°, véhicule, conducteur..."
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
        <select v-model="filters.status" class="filter-control">
          <option value="all">Tous les statuts</option>
          <option value="reported">Signalé</option>
          <option value="in_prediagnostic">En prédiagnostique</option>
          <option value="prediagnostic_completed">Prédiag. terminé</option>
          <option value="in_quote">En devis</option>
          <option value="quote_received">Devis reçu</option>
          <option value="in_approval">En accord</option>
          <option value="approved">Approuvé</option>
          <option value="in_repair">En réparation</option>
          <option value="repair_completed">Rép. terminée</option>
          <option value="in_reception">En réception</option>
          <option value="vehicle_received">Véhicule reçu</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      <!-- Priorité -->
      <div class="filter-section">
        <label class="filter-label">Priorité</label>
        <select v-model="filters.priority" class="filter-control">
          <option value="all">Toutes</option>
          <option value="low">Faible</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
          <option value="urgent">Urgente</option>
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
    <LoadingSpinner v-if="loading" text="Chargement des interventions..." />

    <!-- Tableau d'interventions -->
    <div v-else-if="interventions.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Intervention</th>
            <th>Véhicule</th>
            <th>Type</th>
            <th>Priorité</th>
            <th>Statut</th>
            <th>Date</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="intervention in interventions" :key="intervention.id">
            <td class="intervention-number">
              <i class="fas fa-wrench"></i>
              {{ intervention.interventionNumber || `INT-${intervention.id}` }}
            </td>
            <td>{{ getVehicleLabel(intervention.vehicle) }}</td>
            <td>{{ getInterventionTypeLabel(intervention.interventionType) }}</td>
            <td>
              <span class="priority-badge" :class="`priority-${intervention.priority}`">
                <i :class="getPriorityIcon(intervention.priority)"></i>
                {{ getPriorityLabel(intervention.priority) }}
              </span>
            </td>
            <td>
              <StatusBadge :status="intervention.currentStatus" />
            </td>
            <td>{{ formatDate(intervention.reportedDate) }}</td>
            <td class="actions-column">
              <div class="action-buttons">
                <button @click="openEditModal(intervention)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(intervention)" class="btn-icon btn-delete" title="Supprimer">
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
        <i class="fas fa-wrench"></i>
      </div>
      <h3>Aucune intervention</h3>
      <p>Commencez par créer votre première intervention</p>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Créer une intervention
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
      :title="isEditing ? 'Modifier l\'intervention' : 'Nouvelle intervention'"
      size="large"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit" class="intervention-form">
        <!-- Workflow Progress (uniquement en mode édition) -->
        <div v-if="isEditing && form.currentStatus" class="workflow-section">
          <h4><i class="fas fa-route"></i> Progression du workflow</h4>
          <WorkflowProgressBar 
            :current-status="form.currentStatus"
            :show-labels="true"
          />
        </div>

        <!-- Informations de base -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Titre <span class="required">*</span></label>
              <input
                v-model="form.title"
                type="text"
                required
                placeholder="Ex: Réparation moteur"
              />
            </div>

            <div class="form-group">
              <label>Priorité</label>
              <select v-model="form.priority">
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Resenti utilisateur</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Décrivez le ressenti de l'utilisateur, les symptômes observés..."
            ></textarea>
          </div>
        </div>

        <!-- Véhicule et conducteur -->
        <div class="form-section">
          <h4><i class="fas fa-car"></i> Véhicule et conducteur</h4>
          
          <div class="form-row">
            <VehicleSelector
              v-model="form.vehicleId"
              label="Véhicule"
              required
            />

            <DriverSelector
              v-model="form.driverId"
              label="Conducteur"
            />
          </div>
        </div>

        <!-- Type d'intervention -->
        <div class="form-section">
          <h4><i class="fas fa-tools"></i> Type d'intervention</h4>
          
          <div class="form-row">
            <SearchableSelector
              v-model="form.interventionTypeId"
              api-method="getInterventionTypes"
              label="Type d'intervention"
              placeholder="Rechercher un type..."
            />
          </div>
        </div>

        <!-- Dates et détails techniques -->
        <div class="form-section">
          <h4><i class="fas fa-calendar"></i> Détails techniques</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date de signalement <span class="required">*</span></label>
              <input
                v-model="form.reportedDate"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label>Kilométrage</label>
              <input
                v-model.number="form.odometerReading"
                type="number"
                min="0"
                placeholder="Ex: 120000"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Durée estimée (jours)</label>
              <input
                v-model.number="form.estimatedDurationDays"
                type="number"
                min="1"
                placeholder="Ex: 3"
              />
            </div>
          </div>
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

    <!-- Modal de confirmation de suppression -->
    <ConfirmDialog
      v-model="showDeleteModal"
      title="Confirmer la suppression"
      message="Êtes-vous sûr de vouloir supprimer cette intervention ?"
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
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import Modal from '@/components/common/Modal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import WorkflowProgressBar from '@/components/common/WorkflowProgressBar.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import VehicleSelector from '@/components/common/VehicleSelector.vue'
import DriverSelector from '@/components/common/DriverSelector.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'
import SearchableSelector from '@/components/common/SearchableSelector.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import apiService from '@/services/api.service'

// Notifications
const { success, error, warning } = useNotification()

// État
const interventions = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

// Modals
const showModal = ref(false)
const showFiltersPanel = ref(false)
const isEditing = ref(false)

// Modal de suppression
const showDeleteModal = ref(false)
const itemToDelete = ref(null)
const deleting = ref(false)

// Formulaire
const form = ref({
  title: '',
  description: '',
  vehicleId: null,
  driverId: null,
  interventionTypeId: null,
  priority: 'medium',
  reportedDate: new Date().toISOString().split('T')[0],
  odometerReading: null,
  estimatedDurationDays: null,
  notes: ''
})

// Recherche et filtres
const searchQuery = ref('')
const filters = ref({
  status: 'all',
  priority: 'all',
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

// Compteur de filtres actifs
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
const loadInterventions = async () => {
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

    if (filters.value.status !== 'all') {
      params.status = filters.value.status
    }

    if (filters.value.priority !== 'all') {
      params.priority = filters.value.priority
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

    const response = await apiService.getVehicleInterventions(params)

    if (response.success) {
      interventions.value = response.data || []
      
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
    console.error('Error loading interventions:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors du chargement des interventions'
    error('Erreur lors du chargement des interventions')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadInterventions()
}

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
  // Réinitialiser le modèle quand la marque change
  filters.value.modelId = null
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadInterventions()
}

const openCreateModal = () => {
  isEditing.value = false
  resetForm()
  showModal.value = true
}

const openEditModal = (intervention) => {
  isEditing.value = true
  form.value = {
    id: intervention.id,
    title: intervention.title || '',
    description: intervention.description || '',
    vehicleId: intervention.vehicle?.id || null,
    driverId: intervention.driver?.id || null,
    interventionTypeId: intervention.interventionType?.id || null,
    priority: intervention.priority || 'medium',
    reportedDate: intervention.reportedDate ? intervention.reportedDate.split(/[T\s]/)[0] : new Date().toISOString().split('T')[0],
    odometerReading: intervention.odometerReading || null,
    estimatedDurationDays: intervention.estimatedDurationDays || null,
    notes: intervention.notes || '',
    currentStatus: intervention.currentStatus || 'reported'
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    vehicleId: null,
    driverId: null,
    interventionTypeId: null,
    priority: 'medium',
    reportedDate: new Date().toISOString().split('T')[0],
    odometerReading: null,
    estimatedDurationDays: null,
    estimatedCost: null,
    notes: ''
  }
}

const handleSubmit = async () => {
  try {
    saving.value = true

    const data = {
      title: form.value.title,
      description: form.value.description || null,
      vehicleId: form.value.vehicleId,
      driverId: form.value.driverId || null,
      interventionTypeId: form.value.interventionTypeId || null,
      priority: form.value.priority,
      reportedDate: form.value.reportedDate,
      odometerReading: form.value.odometerReading || null,
      estimatedDurationDays: form.value.estimatedDurationDays || null,
      notes: form.value.notes || null
    }

    let response
    if (isEditing.value) {
      response = await apiService.updateVehicleIntervention(form.value.id, data)
    } else {
      response = await apiService.createVehicleIntervention(data)
    }

    if (response.success) {
      success(isEditing.value ? 'Intervention modifiée avec succès' : 'Intervention créée avec succès')
      closeModal()
      await loadInterventions()
    } else {
      throw new Error(response.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving intervention:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (intervention) => {
  itemToDelete.value = intervention
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
    const response = await apiService.deleteVehicleIntervention(itemToDelete.value.id)
    if (response.success) {
      success('Intervention supprimée avec succès')
      closeDeleteModal()
      await loadInterventions()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting intervention:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  } finally {
    deleting.value = false
  }
}

const viewIntervention = (intervention) => {
  // TODO: Naviguer vers la page de détails
  console.log('View intervention:', intervention)
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

const getInterventionTypeLabel = (type) => {
  if (!type) return ''
  return typeof type === 'object' ? type.name : type
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente'
  }
  return labels[priority] || priority
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'fas fa-arrow-down',
    medium: 'fas fa-minus',
    high: 'fas fa-arrow-up',
    urgent: 'fas fa-exclamation-triangle'
  }
  return icons[priority] || 'fas fa-flag'
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
  loadInterventions()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.intervention-number {
  font-weight: 600;
  color: #3b82f6;

  i {
    color: #3b82f6;
    margin-right: 0.5rem;
  }
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;

  i {
    font-size: 0.85rem;
  }

  &.priority-low {
    background: #d1fae5;
    color: #065f46;
  }

  &.priority-medium {
    background: #fef3c7;
    color: #92400e;
  }

  &.priority-high {
    background: #fed7aa;
    color: #9a3412;
  }

  &.priority-urgent {
    background: #fee2e2;
    color: #991b1b;
  }
}

.workflow-section {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;

  h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;

    i {
      color: #3b82f6;
    }
  }
}

.intervention-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;

    i {
      color: #3b82f6;
    }
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

