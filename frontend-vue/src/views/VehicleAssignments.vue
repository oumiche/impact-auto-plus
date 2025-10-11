<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouvelle assignation</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher par véhicule ou conducteur..." @search="handleSearch" />
      
      <!-- Filtre de statut -->
      <div class="filters-bar">
        <select v-model="statusFilter" @change="handleFilterChange" class="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
          <option value="terminated">Terminées</option>
        </select>
      </div>

      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      
      <div v-else-if="items.length > 0">
        <div class="items-grid">
          <div v-for="item in items" :key="item.id" class="item-card assignment-card">
            <div class="item-header">
              <div class="assignment-icon">🚗👤</div>
              <div class="item-actions">
                <!-- Modifier et Supprimer uniquement si pas terminée -->
                <template v-if="item.status !== 'terminated'">
                  <button @click="openEditModal(item)" class="btn-icon" title="Modifier">✏️</button>
                  <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
                </template>
                <!-- Badge verrouillé pour les terminées -->
                <div v-else class="locked-badge" title="Assignation archivée">
                  🔒 Archivé
                </div>
              </div>
            </div>
            
            <!-- Boutons d'action rapide -->
            <div class="quick-actions" v-if="item.status === 'active'">
              <button 
                @click="terminateAssignment(item)" 
                class="btn-quick btn-quick-danger"
                title="Terminer l'assignation"
              >
                🔚 Terminer
              </button>
            </div>
            
            <div class="item-info">
              <!-- Véhicule -->
              <div class="assignment-section">
                <h4>🚗 Véhicule</h4>
                <div class="vehicle-info">
                  <div class="plate-number">{{ item.vehicle.plateNumber }}</div>
                  <div class="vehicle-details">
                    {{ item.vehicle.brand }} {{ item.vehicle.model }}
                    <span v-if="item.vehicle.year">({{ item.vehicle.year }})</span>
                  </div>
                </div>
              </div>

              <!-- Conducteur -->
              <div class="assignment-section">
                <h4>👤 Conducteur</h4>
                <div class="driver-info">
                  <div class="driver-name">{{ item.driver.firstName }} {{ item.driver.lastName }}</div>
                  <div class="driver-email" v-if="item.driver.email">{{ item.driver.email }}</div>
                </div>
              </div>

              <!-- Dates -->
              <div class="assignment-section">
                <h4>📅 Période</h4>
                <div class="info-item">
                  <span class="icon">📆</span>
                  <span>Début: {{ formatDate(item.assignedDate) }}</span>
                </div>
                <div class="info-item" v-if="item.unassignedDate">
                  <span class="icon">🔚</span>
                  <span>Fin: {{ formatDate(item.unassignedDate) }}</span>
                </div>
                <div class="info-item" v-if="item.assignmentDuration !== null">
                  <span class="icon">⏱️</span>
                  <span>{{ item.assignmentDuration }} jour{{ item.assignmentDuration > 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>
            
            <div class="item-footer">
              <span class="badge" :class="getStatusBadgeClass(item)">
                {{ item.statusLabel }}
              </span>
            </div>
          </div>
        </div>
        
        <Pagination 
          v-if="pagination.totalPages > 1"
          :current-page="pagination.page" 
          :total-pages="pagination.totalPages" 
          :total="pagination.total || 0" 
          @page-change="handlePageChange" 
        />
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">🚗👤</div>
        <h3>Aucune assignation</h3>
        <p>Commencez par créer votre première assignation</p>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>

      <!-- Modal de création/édition -->
      <Modal v-model="showModal" :title="isEditing ? 'Modifier l\'assignation' : 'Nouvelle assignation'" size="large">
        <form @submit.prevent="handleSubmit" class="form">
          <!-- Sélection véhicule et conducteur -->
          <div class="form-section">
            <h4>Assignation</h4>
            
            <div class="form-group">
              <VehicleSelector
                v-model="form.vehicleId"
                label="Véhicule"
                placeholder="Rechercher un véhicule..."
                required
              />
            </div>
            
            <div class="form-group">
              <DriverSelector
                v-model="form.driverId"
                label="Conducteur"
                placeholder="Rechercher un conducteur..."
                required
              />
            </div>
          </div>

          <!-- Dates -->
          <div class="form-section">
            <h4>Période d'assignation</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date de début *</label>
                <input v-model="form.assignedDate" type="date" required>
              </div>
              <div class="form-group">
                <label>Date de fin</label>
                <input v-model="form.unassignedDate" type="date">
                <small class="form-help">Laissez vide si l'assignation est en cours</small>
              </div>
            </div>
          </div>

          <!-- Statut et notes -->
          <div class="form-section">
            <h4>Informations complémentaires</h4>
            
            <div class="form-group">
              <label>Statut</label>
              <select v-model="form.status">
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="terminated">Terminé</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" rows="3" placeholder="Notes supplémentaires..."></textarea>
            </div>
          </div>
        </form>
        
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}
          </button>
        </template>
      </Modal>

      <!-- Modal de confirmation de suppression -->
      <Modal v-model="showDeleteModal" title="Confirmer la suppression" size="small">
        <p>Êtes-vous sûr de vouloir supprimer cette assignation ?</p>
        <p v-if="itemToDelete" class="assignment-summary">
          <strong>{{ itemToDelete.vehicle?.plateNumber }}</strong> → <strong>{{ itemToDelete.driver?.firstName }} {{ itemToDelete.driver?.lastName }}</strong>
        </p>
        <p class="text-muted">Cette action est irréversible.</p>
        
        <template #footer>
          <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleDelete" class="btn-danger" :disabled="submitting">
            {{ submitting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </template>
      </Modal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import VehicleSelector from '@/components/common/VehicleSelector.vue'
import DriverSelector from '@/components/common/DriverSelector.vue'
import apiService from '@/services/api.service'

const { success, error } = useNotification()

// State
const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const itemToDelete = ref(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 })

const form = ref({
  id: null,
  vehicleId: null,
  driverId: null,
  assignedDate: '',
  unassignedDate: '',
  status: 'active',
  notes: ''
})

// Methods
const loadItems = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: searchQuery.value
    }
    
    // Ajouter le filtre statut uniquement s'il n'est pas "all"
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }
    
    const response = await apiService.getVehicleAssignments(params)
    
    if (response.success) {
      items.value = response.data || []
      if (response.pagination) {
        pagination.value.total = response.pagination.total || response.pagination.totalItems || 0
        pagination.value.totalPages = response.pagination.pages || response.pagination.totalPages || 0
      }
    }
  } catch (err) {
    console.error('Erreur lors du chargement:', err)
    error(err.response?.data?.message || 'Erreur lors du chargement des assignations')
  } finally {
    loading.value = false
  }
}

let searchTimeout = null
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadItems()
  }, 500)
}

const handleFilterChange = () => {
  pagination.value.page = 1
  loadItems()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadItems()
}

const openCreateModal = () => {
  isEditing.value = false
  resetForm()
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  form.value = {
    id: item.id,
    vehicleId: item.vehicle?.id || null,
    driverId: item.driver?.id || null,
    assignedDate: item.assignedDate ? item.assignedDate.split(' ')[0] : '',
    unassignedDate: item.unassignedDate ? item.unassignedDate.split(' ')[0] : '',
    status: item.status || 'active',
    notes: item.notes || ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.vehicleId || !form.value.driverId) {
    error('Le véhicule et le conducteur sont requis')
    return
  }
  
  if (!form.value.assignedDate) {
    error('La date d\'assignation est requise')
    return
  }
  
  submitting.value = true
  try {
    const data = {
      vehicleId: parseInt(form.value.vehicleId),
      driverId: parseInt(form.value.driverId),
      assignedDate: form.value.assignedDate,
      unassignedDate: form.value.unassignedDate || null,
      status: form.value.status,
      notes: form.value.notes?.trim() || null
    }
    
    let response
    if (isEditing.value) {
      response = await apiService.updateVehicleAssignment(form.value.id, data)
    } else {
      response = await apiService.createVehicleAssignment(data)
    }
    
    if (response.success) {
      success(response.message || `Assignation ${isEditing.value ? 'modifiée' : 'créée'} avec succès`)
      showModal.value = false
      loadItems()
    } else {
      error(response.message || 'Une erreur est survenue')
    }
  } catch (err) {
    console.error('Erreur:', err)
    error(err.response?.data?.message || `Erreur lors de ${isEditing.value ? 'la modification' : 'la création'}`)
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  
  submitting.value = true
  try {
    const response = await apiService.deleteVehicleAssignment(itemToDelete.value.id)
    if (response.success) {
      success(response.message || 'Assignation supprimée avec succès')
      showDeleteModal.value = false
      itemToDelete.value = null
      loadItems()
    } else {
      error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Erreur:', err)
    error(err.response?.data?.message || 'Erreur lors de la suppression')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  const today = new Date().toISOString().split('T')[0]
  
  form.value = {
    id: null,
    vehicleId: null,
    driverId: null,
    assignedDate: today,
    unassignedDate: '',
    status: 'active',
    notes: ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const getStatusBadgeClass = (item) => {
  const statusMap = {
    'active': 'badge-success',
    'inactive': 'badge-inactive',
    'terminated': 'badge-danger'
  }
  return statusMap[item.status] || 'badge-inactive'
}

const terminateAssignment = async (item) => {
  submitting.value = true
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const data = {
      vehicleId: item.vehicle.id,
      driverId: item.driver.id,
      assignedDate: item.assignedDate,
      unassignedDate: today,
      status: 'terminated',
      notes: item.notes || null
    }
    
    const response = await apiService.updateVehicleAssignment(item.id, data)
    
    if (response.success) {
      success('Assignation terminée avec succès')
      loadItems()
    } else {
      error(response.message || 'Erreur lors de la terminaison')
    }
  } catch (err) {
    console.error('Erreur:', err)
    error(err.response?.data?.message || 'Erreur lors de la terminaison')
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadItems()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.filters-bar {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #2563eb;
  }

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}

.assignment-card {
  .assignment-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.btn-quick {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-quick-danger {
  background: #ef4444;
  color: white;

  &:hover {
    background: #dc2626;
  }
}

.locked-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background-color: #f3f4f6;
  color: #6b7280;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #e5e7eb;
}

.assignment-section {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
  }
}

.vehicle-info {
  .plate-number {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .vehicle-details {
    font-size: 0.875rem;
    color: #6b7280;
  }
}

.driver-info {
  .driver-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .driver-email {
    font-size: 0.875rem;
    color: #6b7280;
  }
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.assignment-summary {
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  text-align: center;
  margin: 1rem 0;
}
</style>
