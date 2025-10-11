<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouvel entretien</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher par véhicule, titre, prestataire..." @search="handleSearch" />
      
      <!-- Filtres -->
      <div class="filters-bar">
        <select v-model="statusFilter" @change="handleFilterChange" class="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="scheduled">Planifiés</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminés</option>
          <option value="cancelled">Annulés</option>
        </select>
        
        <select v-model="typeFilter" @change="handleFilterChange" class="filter-select">
          <option value="all">Tous les types</option>
          <option value="preventive">Préventif</option>
          <option value="corrective">Correctif</option>
          <option value="inspection">Inspection</option>
          <option value="repair">Réparation</option>
        </select>
      </div>

      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      
      <div v-else-if="items.length > 0">
        <div class="items-grid">
          <div v-for="item in items" :key="item.id" class="item-card maintenance-card">
            <div class="item-header">
              <div class="maintenance-icon">🔧</div>
              <div class="item-actions">
                <!-- Modifier et Supprimer uniquement si pas terminé/annulé -->
                <template v-if="item.status !== 'completed' && item.status !== 'cancelled'">
                  <button @click="openEditModal(item)" class="btn-icon" title="Modifier">✏️</button>
                  <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
                </template>
                <!-- Badge verrouillé pour les terminés/annulés -->
                <div v-else class="locked-badge" title="Entretien archivé">
                  🔒 Archivé
                </div>
              </div>
            </div>
            
            <!-- Boutons d'action rapide pour changer le statut -->
            <div class="quick-actions" v-if="item.status !== 'completed' && item.status !== 'cancelled'">
              <button 
                v-if="item.status === 'scheduled'" 
                @click="changeStatus(item, 'in_progress')" 
                class="btn-quick btn-quick-primary"
                title="Démarrer l'entretien"
              >
                ▶️ Démarrer
              </button>
              <button 
                v-if="item.status === 'in_progress'" 
                @click="changeStatus(item, 'completed')" 
                class="btn-quick btn-quick-success"
                title="Marquer comme terminé"
              >
                ✅ Terminer
              </button>
              <button 
                @click="changeStatus(item, 'cancelled')" 
                class="btn-quick btn-quick-danger"
                title="Annuler l'entretien"
              >
                ❌ Annuler
              </button>
            </div>
            
            <div class="item-info">
              <!-- Véhicule -->
              <div class="maintenance-section">
                <h4>🚗 Véhicule</h4>
                <div class="vehicle-info">
                  <div class="plate-number">{{ item.vehicle.plateNumber }}</div>
                  <div class="vehicle-details">
                    {{ item.vehicle.brand }} {{ item.vehicle.model }}
                  </div>
                </div>
              </div>

              <!-- Entretien -->
              <div class="maintenance-section">
                <h4>🔧 Entretien</h4>
                <div class="maintenance-title">{{ item.title }}</div>
                <div class="info-item">
                  <span class="icon">📋</span>
                  <span class="type-badge" :class="`type-${item.type}`">{{ getTypeLabel(item.type) }}</span>
                </div>
                <div class="info-item" v-if="item.serviceProvider">
                  <span class="icon">🏢</span>
                  <span>{{ item.serviceProvider }}</span>
                </div>
              </div>

              <!-- Dates et coût -->
              <div class="maintenance-section">
                <h4>📅 Planning & Coût</h4>
                <div class="info-item">
                  <span class="icon">📆</span>
                  <span>Planifié: {{ formatDate(item.scheduledDate) }}</span>
                </div>
                <div class="info-item" v-if="item.completedDate">
                  <span class="icon">✅</span>
                  <span>Terminé: {{ formatDate(item.completedDate) }}</span>
                </div>
                <div class="info-item" v-if="item.odometerReading">
                  <span class="icon">🛣️</span>
                  <span>{{ formatKm(item.odometerReading) }}</span>
                </div>
                <div class="info-item" v-if="item.cost">
                  <span class="icon">💰</span>
                  <span class="cost">{{ formatAmount(item.cost) }}</span>
                </div>
              </div>
            </div>
            
            <div class="item-footer">
              <span class="badge" :class="getStatusBadgeClass(item)">
                {{ getStatusLabel(item.status) }}
              </span>
              <span v-if="item.isWarrantyCovered" class="badge badge-info" style="margin-left: 8px;">
                🛡️ Garantie
              </span>
              <span v-if="item.isRecurring" class="badge badge-secondary" style="margin-left: 8px;">
                🔁 Récurrent
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
        <div class="empty-icon">🔧</div>
        <h3>Aucun entretien</h3>
        <p>Commencez par planifier votre premier entretien</p>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>

      <!-- Modal de création/édition -->
      <Modal v-model="showModal" :title="isEditing ? 'Modifier l\'entretien' : 'Nouvel entretien'" size="large">
        <form @submit.prevent="handleSubmit" class="form">
          <!-- Informations de base -->
          <div class="form-section">
            <h4>Informations de base</h4>
            
            <div class="form-group">
              <VehicleSelector
                v-model="form.vehicleId"
                label="Véhicule"
                placeholder="Rechercher un véhicule..."
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Titre *</label>
                <input v-model="form.title" type="text" required placeholder="Ex: Vidange moteur">
              </div>
              <div class="form-group">
                <label>Type *</label>
                <select v-model="form.type" required>
                  <option value="">Sélectionner...</option>
                  <option value="preventive">Préventif</option>
                  <option value="corrective">Correctif</option>
                  <option value="inspection">Inspection</option>
                  <option value="repair">Réparation</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="form.description" rows="3" placeholder="Description détaillée..."></textarea>
            </div>
          </div>

          <!-- Planning -->
          <div class="form-section">
            <h4>Planning</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date planifiée *</label>
                <input v-model="form.scheduledDate" type="date" required>
              </div>
              <div class="form-group">
                <label>Date de réalisation</label>
                <input v-model="form.completedDate" type="date">
              </div>
            </div>
            
            <div class="form-group">
              <label>Statut *</label>
              <select v-model="form.status" required>
                <option value="scheduled">Planifié</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <!-- Kilométrage -->
          <div class="form-section">
            <h4>Kilométrage</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Kilométrage actuel</label>
                <input v-model="form.odometerReading" type="number" min="0" placeholder="Ex: 50000">
              </div>
              <div class="form-group">
                <label>Prochain entretien (km)</label>
                <input v-model="form.nextMaintenanceOdometer" type="number" min="0" placeholder="Ex: 60000">
              </div>
            </div>
            
            <div class="form-group">
              <label>Prochain entretien (date)</label>
              <input v-model="form.nextMaintenanceDate" type="date">
            </div>
          </div>

          <!-- Coûts et prestataire -->
          <div class="form-section">
            <h4>Coûts & Prestataire</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Coût (FCFA)</label>
                <input v-model="form.cost" type="number" step="0.01" placeholder="0.00">
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="form.isWarrantyCovered" type="checkbox">
                  <span>Couvert par garantie</span>
                </label>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Prestataire</label>
                <input v-model="form.serviceProvider" type="text" placeholder="Ex: Garage AutoPlus">
              </div>
              <div class="form-group">
                <label>Lieu</label>
                <input v-model="form.serviceLocation" type="text" placeholder="Ex: Dakar, Sénégal">
              </div>
            </div>
          </div>

          <!-- Détails techniques -->
          <div class="form-section">
            <h4>Détails techniques</h4>
            
            <div class="form-group">
              <label>Pièces utilisées</label>
              <textarea v-model="form.partsUsed" rows="2" placeholder="Liste des pièces remplacées..."></textarea>
            </div>
            
            <div class="form-group">
              <label>Travaux effectués</label>
              <textarea v-model="form.workPerformed" rows="2" placeholder="Description des travaux..."></textarea>
            </div>
          </div>

          <!-- Récurrence -->
          <div class="form-section">
            <h4>Récurrence</h4>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="form.isRecurring" type="checkbox">
                <span>Entretien récurrent</span>
              </label>
            </div>
            
            <div v-if="form.isRecurring" class="form-row">
              <div class="form-group">
                <label>Intervalle (jours)</label>
                <input v-model="form.recurringIntervalDays" type="number" min="0" placeholder="Ex: 90">
              </div>
              <div class="form-group">
                <label>Intervalle (km)</label>
                <input v-model="form.recurringIntervalKm" type="number" min="0" placeholder="Ex: 5000">
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-section">
            <h4>Notes supplémentaires</h4>
            
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" rows="3" placeholder="Notes et observations..."></textarea>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="form.isActive" type="checkbox">
                <span>Actif</span>
              </label>
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
        <p>Êtes-vous sûr de vouloir supprimer cet entretien ?</p>
        <p v-if="itemToDelete" class="maintenance-summary">
          <strong>{{ itemToDelete.title }}</strong>
          <br>Véhicule: <strong>{{ itemToDelete.vehicle?.plateNumber }}</strong>
          <br>Date: {{ formatDate(itemToDelete.scheduledDate) }}
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
const typeFilter = ref('all')
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 })

const form = ref({
  id: null,
  vehicleId: null,
  type: '',
  title: '',
  description: '',
  scheduledDate: '',
  completedDate: '',
  cost: '',
  status: 'scheduled',
  odometerReading: '',
  nextMaintenanceOdometer: '',
  nextMaintenanceDate: '',
  serviceProvider: '',
  serviceLocation: '',
  notes: '',
  partsUsed: '',
  workPerformed: '',
  isWarrantyCovered: false,
  isRecurring: false,
  recurringIntervalDays: '',
  recurringIntervalKm: '',
  isActive: true
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
    
    // Ajouter les filtres uniquement s'ils ne sont pas "all"
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }
    
    if (typeFilter.value !== 'all') {
      params.type = typeFilter.value
    }
    
    const response = await apiService.getVehicleMaintenances(params)
    
    if (response.success) {
      items.value = response.data || []
      if (response.pagination) {
        pagination.value.total = response.pagination.totalItems || response.pagination.total || 0
        pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages || 0
      }
    }
  } catch (err) {
    console.error('Erreur lors du chargement:', err)
    error(err.response?.data?.message || 'Erreur lors du chargement des entretiens')
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
    type: item.type || '',
    title: item.title || '',
    description: item.description || '',
    scheduledDate: item.scheduledDate || '',
    completedDate: item.completedDate || '',
    cost: item.cost || '',
    status: item.status || 'scheduled',
    odometerReading: item.odometerReading || '',
    nextMaintenanceOdometer: item.nextMaintenanceOdometer || '',
    nextMaintenanceDate: item.nextMaintenanceDate || '',
    serviceProvider: item.serviceProvider || '',
    serviceLocation: item.serviceLocation || '',
    notes: item.notes || '',
    partsUsed: item.partsUsed || '',
    workPerformed: item.workPerformed || '',
    isWarrantyCovered: item.isWarrantyCovered || false,
    isRecurring: item.isRecurring || false,
    recurringIntervalDays: item.recurringIntervalDays || '',
    recurringIntervalKm: item.recurringIntervalKm || '',
    isActive: item.isActive !== undefined ? item.isActive : true
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.vehicleId || !form.value.type || !form.value.title || !form.value.scheduledDate || !form.value.status) {
    error('Le véhicule, le type, le titre, la date planifiée et le statut sont requis')
    return
  }
  
  submitting.value = true
  try {
    const data = {
      vehicleId: parseInt(form.value.vehicleId),
      type: form.value.type,
      title: form.value.title.trim(),
      description: form.value.description?.trim() || null,
      scheduledDate: form.value.scheduledDate,
      completedDate: form.value.completedDate || null,
      cost: form.value.cost ? parseFloat(form.value.cost) : null,
      status: form.value.status,
      odometerReading: form.value.odometerReading ? parseInt(form.value.odometerReading) : null,
      nextMaintenanceOdometer: form.value.nextMaintenanceOdometer ? parseInt(form.value.nextMaintenanceOdometer) : null,
      nextMaintenanceDate: form.value.nextMaintenanceDate || null,
      serviceProvider: form.value.serviceProvider?.trim() || null,
      serviceLocation: form.value.serviceLocation?.trim() || null,
      notes: form.value.notes?.trim() || null,
      partsUsed: form.value.partsUsed?.trim() || null,
      workPerformed: form.value.workPerformed?.trim() || null,
      isWarrantyCovered: form.value.isWarrantyCovered,
      isRecurring: form.value.isRecurring,
      recurringIntervalDays: form.value.recurringIntervalDays ? parseInt(form.value.recurringIntervalDays) : null,
      recurringIntervalKm: form.value.recurringIntervalKm ? parseInt(form.value.recurringIntervalKm) : null,
      isActive: form.value.isActive
    }
    
    let response
    if (isEditing.value) {
      response = await apiService.updateVehicleMaintenance(form.value.id, data)
    } else {
      response = await apiService.createVehicleMaintenance(data)
    }
    
    if (response.success) {
      success(response.message || `Entretien ${isEditing.value ? 'modifié' : 'créé'} avec succès`)
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
    const response = await apiService.deleteVehicleMaintenance(itemToDelete.value.id)
    if (response.success) {
      success(response.message || 'Entretien supprimé avec succès')
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
    type: '',
    title: '',
    description: '',
    scheduledDate: today,
    completedDate: '',
    cost: '',
    status: 'scheduled',
    odometerReading: '',
    nextMaintenanceOdometer: '',
    nextMaintenanceDate: '',
    serviceProvider: '',
    serviceLocation: '',
    notes: '',
    partsUsed: '',
    workPerformed: '',
    isWarrantyCovered: false,
    isRecurring: false,
    recurringIntervalDays: '',
    recurringIntervalKm: '',
    isActive: true
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  return parseFloat(amount).toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + ' FCFA'
}

const formatKm = (km) => {
  if (!km) return ''
  return parseInt(km).toLocaleString('fr-FR') + ' km'
}

const getTypeLabel = (type) => {
  const types = {
    'preventive': 'Préventif',
    'corrective': 'Correctif',
    'inspection': 'Inspection',
    'repair': 'Réparation'
  }
  return types[type] || type
}

const getStatusLabel = (status) => {
  const statuses = {
    'scheduled': 'Planifié',
    'in_progress': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé'
  }
  return statuses[status] || status
}

const getStatusBadgeClass = (item) => {
  const statusMap = {
    'scheduled': 'badge-warning',
    'in_progress': 'badge-info',
    'completed': 'badge-success',
    'cancelled': 'badge-inactive'
  }
  return statusMap[item.status] || 'badge-inactive'
}

const changeStatus = async (item, newStatus) => {
  submitting.value = true
  try {
    const data = {
      vehicleId: item.vehicle.id,
      type: item.type,
      title: item.title,
      description: item.description || null,
      scheduledDate: item.scheduledDate,
      completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : (item.completedDate || null),
      cost: item.cost ? parseFloat(item.cost) : null,
      status: newStatus,
      odometerReading: item.odometerReading ? parseInt(item.odometerReading) : null,
      nextMaintenanceOdometer: item.nextMaintenanceOdometer ? parseInt(item.nextMaintenanceOdometer) : null,
      nextMaintenanceDate: item.nextMaintenanceDate || null,
      serviceProvider: item.serviceProvider || null,
      serviceLocation: item.serviceLocation || null,
      notes: item.notes || null,
      partsUsed: item.partsUsed || null,
      workPerformed: item.workPerformed || null,
      isWarrantyCovered: item.isWarrantyCovered || false,
      isRecurring: item.isRecurring || false,
      recurringIntervalDays: item.recurringIntervalDays ? parseInt(item.recurringIntervalDays) : null,
      recurringIntervalKm: item.recurringIntervalKm ? parseInt(item.recurringIntervalKm) : null,
      isActive: item.isActive !== undefined ? item.isActive : true
    }
    
    const response = await apiService.updateVehicleMaintenance(item.id, data)
    
    if (response.success) {
      const statusLabels = {
        'in_progress': 'en cours',
        'completed': 'terminé',
        'cancelled': 'annulé'
      }
      success(`Entretien marqué comme ${statusLabels[newStatus]}`)
      loadItems()
    } else {
      error(response.message || 'Erreur lors du changement de statut')
    }
  } catch (err) {
    console.error('Erreur:', err)
    error(err.response?.data?.message || 'Erreur lors du changement de statut')
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
  flex-wrap: wrap;
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

.maintenance-card {
  .maintenance-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 1rem;
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

.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  flex-wrap: wrap;
}

.btn-quick {
  flex: 1;
  min-width: 100px;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-quick-primary {
  background: #2563eb;
  color: white;

  &:hover {
    background: #1e40af;
  }
}

.btn-quick-success {
  background: #10b981;
  color: white;

  &:hover {
    background: #059669;
  }
}

.btn-quick-danger {
  background: #ef4444;
  color: white;

  &:hover {
    background: #dc2626;
  }
}

.maintenance-section {
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

.maintenance-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  
  &.type-preventive {
    background-color: #dbeafe;
    color: #1e40af;
  }
  
  &.type-corrective {
    background-color: #fef3c7;
    color: #92400e;
  }
  
  &.type-inspection {
    background-color: #ddd6fe;
    color: #5b21b6;
  }
  
  &.type-repair {
    background-color: #fee2e2;
    color: #991b1b;
  }
}

.cost {
  font-weight: 700;
  color: #10b981;
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

.badge-info {
  background-color: #3b82f6;
  color: white;
}

.badge-secondary {
  background-color: #6b7280;
  color: white;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.maintenance-summary {
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  text-align: center;
  margin: 1rem 0;
  line-height: 1.6;
}
</style>
