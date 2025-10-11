<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouveau plein</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher par véhicule, station..." @search="handleSearch" />
      
      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      
      <div v-else-if="items.length > 0">
        <div class="items-grid">
          <div v-for="item in items" :key="item.id" class="item-card fuel-card">
            <div class="item-header">
              <div class="fuel-icon">⛽</div>
              <div class="item-actions">
                <button @click="openEditModal(item)" class="btn-icon" title="Modifier">✏️</button>
                <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
              </div>
            </div>
            
            <div class="item-info">
              <!-- Véhicule & Conducteur -->
              <div class="fuel-section">
                <h4>🚗 Véhicule & Conducteur</h4>
                <div class="vehicle-info">
                  <div class="plate-number">{{ item.vehicle.plateNumber }}</div>
                  <div class="vehicle-details">
                    {{ item.vehicle.brand }} {{ item.vehicle.model }}
                  </div>
                </div>
                <div class="info-item" v-if="item.driver">
                  <span class="icon">👤</span>
                  <span>{{ item.driver.firstName }} {{ item.driver.lastName }}</span>
                </div>
              </div>

              <!-- Détails du plein -->
              <div class="fuel-section">
                <h4>⛽ Détails du plein</h4>
                <div class="info-item">
                  <span class="icon">📅</span>
                  <span>{{ formatDate(item.refuelDate) }}</span>
                </div>
                <div class="info-item">
                  <span class="icon">🛢️</span>
                  <span class="quantity">{{ formatQuantity(item.quantity) }} L</span>
                </div>
                <div class="info-item" v-if="item.fuelType">
                  <span class="icon">⚡</span>
                  <span>{{ item.fuelType.name }}</span>
                </div>
                <div class="info-item" v-if="item.isFullTank">
                  <span class="badge badge-info">Plein complet</span>
                </div>
              </div>

              <!-- Coûts & Consommation -->
              <div class="fuel-section">
                <h4>💰 Coûts & Consommation</h4>
                <div class="info-item">
                  <span class="icon">💵</span>
                  <span class="cost">{{ formatAmount(item.totalCost) }}</span>
                </div>
                <div class="info-item">
                  <span class="icon">📊</span>
                  <span>{{ formatAmount(item.unitPrice) }}/L</span>
                </div>
                <div class="info-item">
                  <span class="icon">🛣️</span>
                  <span>{{ formatKm(item.odometerReading) }}</span>
                </div>
                <div class="info-item" v-if="item.kilometersDriven">
                  <span class="icon">📏</span>
                  <span>{{ formatKm(item.kilometersDriven) }} parcourus</span>
                </div>
                <div class="info-item efficiency" v-if="item.fuelEfficiency">
                  <span class="icon">📈</span>
                  <span class="efficiency-value">{{ formatEfficiency(item.fuelEfficiency) }} L/100km</span>
                </div>
              </div>

              <!-- Station -->
              <div class="fuel-section" v-if="item.stationName || item.stationLocation">
                <h4>🏢 Station</h4>
                <div class="info-item" v-if="item.stationName">
                  <span class="icon">🏪</span>
                  <span>{{ item.stationName }}</span>
                </div>
                <div class="info-item" v-if="item.stationLocation">
                  <span class="icon">📍</span>
                  <span>{{ item.stationLocation }}</span>
                </div>
              </div>
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
        <div class="empty-icon">⛽</div>
        <h3>Aucun plein enregistré</h3>
        <p>Commencez par enregistrer votre premier plein</p>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>

      <!-- Modal de création/édition -->
      <Modal v-model="showModal" :title="isEditing ? 'Modifier le plein' : 'Nouveau plein'" size="large">
        <form @submit.prevent="handleSubmit" class="form">
          <!-- Véhicule et Conducteur -->
          <div class="form-section">
            <h4>Véhicule & Conducteur</h4>
            
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
              />
            </div>
            
            <div class="form-group">
              <label>Date du plein *</label>
              <input v-model="form.refuelDate" type="date" required>
            </div>
          </div>

          <!-- Carburant -->
          <div class="form-section">
            <h4>Carburant</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Quantité (L) *</label>
                <input v-model="form.quantity" type="number" step="0.01" required placeholder="50.00" @input="calculateTotal">
              </div>
              <div class="form-group">
                <label>Prix unitaire (FCFA/L) *</label>
                <input v-model="form.unitPrice" type="number" step="0.01" required placeholder="650.00" @input="calculateTotal">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Coût total (FCFA) *</label>
                <input v-model="form.totalCost" type="number" step="0.01" required placeholder="32500.00" readonly class="readonly-field">
                <small class="form-help">Calculé automatiquement</small>
              </div>
              <div class="form-group">
                <label>Type de carburant</label>
                <select v-model="form.fuelTypeId">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="fuelType in fuelTypes" :key="fuelType.id" :value="fuelType.id">
                    {{ fuelType.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="form.isFullTank" type="checkbox">
                <span>Plein complet</span>
              </label>
            </div>
          </div>

          <!-- Kilométrage -->
          <div class="form-section">
            <h4>Kilométrage</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Kilométrage actuel *</label>
                <input v-model="form.odometerReading" type="number" min="0" required placeholder="50000" @input="calculateKm">
              </div>
              <div class="form-group">
                <label>Kilométrage précédent</label>
                <input v-model="form.previousOdometerReading" type="number" min="0" placeholder="49500" @input="calculateKm">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Kilomètres parcourus</label>
                <input v-model="form.kilometersDriven" type="number" min="0" placeholder="500" readonly class="readonly-field">
                <small class="form-help">Calculé automatiquement</small>
              </div>
              <div class="form-group">
                <label>Consommation (L/100km)</label>
                <input v-model="form.fuelEfficiency" type="number" step="0.01" placeholder="10.00" readonly class="readonly-field">
                <small class="form-help">Calculée automatiquement</small>
              </div>
            </div>
          </div>

          <!-- Station -->
          <div class="form-section">
            <h4>Station-service</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Nom de la station</label>
                <input v-model="form.stationName" type="text" placeholder="Total Station">
              </div>
              <div class="form-group">
                <label>Lieu</label>
                <input v-model="form.stationLocation" type="text" placeholder="Dakar, Sénégal">
              </div>
            </div>
            
            <div class="form-group">
              <label>N° de reçu</label>
              <input v-model="form.receiptNumber" type="text" placeholder="REC-123456">
            </div>
          </div>

          <!-- Notes -->
          <div class="form-section">
            <h4>Notes</h4>
            
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" rows="3" placeholder="Notes supplémentaires..."></textarea>
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
        <p>Êtes-vous sûr de vouloir supprimer cet enregistrement de plein ?</p>
        <p v-if="itemToDelete" class="fuel-summary">
          <strong>{{ itemToDelete.vehicle?.plateNumber }}</strong>
          <br>{{ formatQuantity(itemToDelete.quantity) }} L - {{ formatAmount(itemToDelete.totalCost) }}
          <br>{{ formatDate(itemToDelete.refuelDate) }}
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
import { ref, onMounted, watch } from 'vue'
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
const fuelTypes = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const itemToDelete = ref(null)
const searchQuery = ref('')
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 })

const form = ref({
  id: null,
  vehicleId: null,
  driverId: null,
  refuelDate: '',
  quantity: '',
  unitPrice: '',
  totalCost: '',
  odometerReading: '',
  previousOdometerReading: '',
  kilometersDriven: '',
  fuelEfficiency: '',
  fuelTypeId: null,
  stationName: '',
  stationLocation: '',
  receiptNumber: '',
  notes: '',
  isFullTank: true,
  isActive: true
})

// Calculs automatiques
const calculateTotal = () => {
  const quantity = parseFloat(form.value.quantity) || 0
  const unitPrice = parseFloat(form.value.unitPrice) || 0
  form.value.totalCost = (quantity * unitPrice).toFixed(2)
}

const calculateKm = () => {
  const current = parseInt(form.value.odometerReading) || 0
  const previous = parseInt(form.value.previousOdometerReading) || 0
  
  if (current > 0 && previous > 0 && current > previous) {
    form.value.kilometersDriven = current - previous
    
    // Calcul consommation si on a la quantité
    const quantity = parseFloat(form.value.quantity) || 0
    const km = form.value.kilometersDriven
    
    if (quantity > 0 && km > 0) {
      form.value.fuelEfficiency = ((quantity / km) * 100).toFixed(2)
    }
  } else {
    form.value.kilometersDriven = ''
    form.value.fuelEfficiency = ''
  }
}

// Watch pour recalculer la consommation quand la quantité change
watch(() => form.value.quantity, () => {
  if (form.value.kilometersDriven) {
    const quantity = parseFloat(form.value.quantity) || 0
    const km = parseInt(form.value.kilometersDriven) || 0
    
    if (quantity > 0 && km > 0) {
      form.value.fuelEfficiency = ((quantity / km) * 100).toFixed(2)
    }
  }
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
    const response = await apiService.getVehicleFuelLogs(params)
    
    if (response.success) {
      items.value = response.data || []
      if (response.pagination) {
        pagination.value.total = response.pagination.totalItems || response.pagination.total || 0
        pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages || 0
      }
    }
  } catch (err) {
    console.error('Erreur lors du chargement:', err)
    error(err.response?.data?.message || 'Erreur lors du chargement des pleins')
  } finally {
    loading.value = false
  }
}

const loadFuelTypes = async () => {
  try {
    const response = await apiService.getFuelTypes({ limit: 100 })
    if (response.success) {
      fuelTypes.value = response.data || []
    }
  } catch (err) {
    console.error('Erreur lors du chargement des types de carburant:', err)
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
    refuelDate: item.refuelDate || '',
    quantity: item.quantity || '',
    unitPrice: item.unitPrice || '',
    totalCost: item.totalCost || '',
    odometerReading: item.odometerReading || '',
    previousOdometerReading: item.previousOdometerReading || '',
    kilometersDriven: item.kilometersDriven || '',
    fuelEfficiency: item.fuelEfficiency || '',
    fuelTypeId: item.fuelType?.id || '',
    stationName: item.stationName || '',
    stationLocation: item.stationLocation || '',
    receiptNumber: item.receiptNumber || '',
    notes: item.notes || '',
    isFullTank: item.isFullTank !== undefined ? item.isFullTank : true,
    isActive: item.isActive !== undefined ? item.isActive : true
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.vehicleId || !form.value.refuelDate || !form.value.quantity || !form.value.unitPrice || !form.value.odometerReading) {
    error('Le véhicule, la date, la quantité, le prix unitaire et le kilométrage sont requis')
    return
  }
  
  submitting.value = true
  try {
    const data = {
      vehicleId: parseInt(form.value.vehicleId),
      driverId: form.value.driverId ? parseInt(form.value.driverId) : null,
      refuelDate: form.value.refuelDate,
      quantity: parseFloat(form.value.quantity),
      unitPrice: parseFloat(form.value.unitPrice),
      totalCost: parseFloat(form.value.totalCost),
      odometerReading: parseInt(form.value.odometerReading),
      previousOdometerReading: form.value.previousOdometerReading ? parseInt(form.value.previousOdometerReading) : null,
      kilometersDriven: form.value.kilometersDriven ? parseInt(form.value.kilometersDriven) : null,
      fuelEfficiency: form.value.fuelEfficiency ? parseFloat(form.value.fuelEfficiency) : null,
      fuelTypeId: form.value.fuelTypeId ? parseInt(form.value.fuelTypeId) : null,
      stationName: form.value.stationName?.trim() || null,
      stationLocation: form.value.stationLocation?.trim() || null,
      receiptNumber: form.value.receiptNumber?.trim() || null,
      notes: form.value.notes?.trim() || null,
      isFullTank: form.value.isFullTank,
      isActive: form.value.isActive
    }
    
    let response
    if (isEditing.value) {
      response = await apiService.updateVehicleFuelLog(form.value.id, data)
    } else {
      response = await apiService.createVehicleFuelLog(data)
    }
    
    if (response.success) {
      success(response.message || `Plein ${isEditing.value ? 'modifié' : 'enregistré'} avec succès`)
      showModal.value = false
      loadItems()
    } else {
      error(response.message || 'Une erreur est survenue')
    }
  } catch (err) {
    console.error('Erreur:', err)
    error(err.response?.data?.message || `Erreur lors de ${isEditing.value ? 'la modification' : 'l\'enregistrement'}`)
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
    const response = await apiService.deleteVehicleFuelLog(itemToDelete.value.id)
    if (response.success) {
      success(response.message || 'Plein supprimé avec succès')
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
    refuelDate: today,
    quantity: '',
    unitPrice: '',
    totalCost: '',
    odometerReading: '',
    previousOdometerReading: '',
    kilometersDriven: '',
    fuelEfficiency: '',
    fuelTypeId: null,
    stationName: '',
    stationLocation: '',
    receiptNumber: '',
    notes: '',
    isFullTank: true,
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

const formatQuantity = (quantity) => {
  if (!quantity) return '0'
  return parseFloat(quantity).toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

const formatKm = (km) => {
  if (!km) return ''
  return parseInt(km).toLocaleString('fr-FR') + ' km'
}

const formatEfficiency = (efficiency) => {
  if (!efficiency) return ''
  return parseFloat(efficiency).toFixed(2)
}

// Lifecycle
onMounted(() => {
  loadItems()
  loadFuelTypes()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.fuel-card {
  .fuel-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
}

.fuel-section {
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

.quantity {
  font-weight: 700;
  color: #ef4444;
  font-size: 1.125rem;
}

.cost {
  font-weight: 700;
  color: #10b981;
  font-size: 1.125rem;
}

.efficiency {
  background-color: #f0fdf4;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #bbf7d0;
}

.efficiency-value {
  font-weight: 700;
  color: #16a34a;
  font-size: 1rem;
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
  font-style: italic;
}

.readonly-field {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.badge-info {
  background-color: #3b82f6;
  color: white;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.fuel-summary {
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  text-align: center;
  margin: 1rem 0;
  line-height: 1.6;
}
</style>
