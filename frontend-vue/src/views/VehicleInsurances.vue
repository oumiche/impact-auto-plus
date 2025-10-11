<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouvelle assurance</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher par véhicule, police, compagnie..." @search="handleSearch" />
      
      <!-- Filtre de statut -->
      <div class="filters-bar">
        <select v-model="statusFilter" @change="handleFilterChange" class="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="expired">Expirées</option>
          <option value="pending_renewal">À renouveler</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      
      <div v-else-if="items.length > 0">
        <div class="items-grid">
          <div v-for="item in items" :key="item.id" class="item-card insurance-card">
            <div class="item-header">
              <div class="insurance-icon">🛡️</div>
              <div class="item-actions">
                <!-- Modifier et Supprimer uniquement si pas expirée/annulée -->
                <template v-if="item.status !== 'expired' && item.status !== 'cancelled'">
                  <button @click="openEditModal(item)" class="btn-icon" title="Modifier">✏️</button>
                  <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
                </template>
                <!-- Badge verrouillé pour les expirées/annulées -->
                <div v-else class="locked-badge" title="Assurance archivée">
                  🔒 Archivé
                </div>
              </div>
            </div>
            
            <!-- Boutons d'action rapide -->
            <div class="quick-actions" v-if="item.status === 'active' || item.status === 'pending_renewal'">
              <button 
                v-if="item.isExpiringSoon || item.status === 'pending_renewal'" 
                @click="renewInsurance(item)" 
                class="btn-quick btn-quick-success"
                title="Renouveler l'assurance"
              >
                🔄 Renouveler
              </button>
            </div>
            
            <div class="item-info">
              <!-- Véhicule -->
              <div class="insurance-section">
                <h4>🚗 Véhicule</h4>
                <div class="vehicle-info">
                  <div class="plate-number">{{ item.vehicle.plateNumber }}</div>
                  <div class="vehicle-details">
                    {{ item.vehicle.brand }} {{ item.vehicle.model }}
                    <span v-if="item.vehicle.year">({{ item.vehicle.year }})</span>
                  </div>
                </div>
              </div>

              <!-- Assurance -->
              <div class="insurance-section">
                <h4>🏢 Assurance</h4>
                <div class="info-item">
                  <span class="icon">📋</span>
                  <span class="policy-number">{{ item.policyNumber }}</span>
                </div>
                <div class="info-item">
                  <span class="icon">🏢</span>
                  <span>{{ item.insuranceCompany }}</span>
                </div>
                <div class="info-item">
                  <span class="icon">📦</span>
                  <span>{{ item.coverageTypeLabel }}</span>
                </div>
              </div>

              <!-- Dates et montants -->
              <div class="insurance-section">
                <h4>📅 Validité & Coût</h4>
                <div class="info-item">
                  <span class="icon">📆</span>
                  <span>{{ formatDate(item.startDate) }} → {{ formatDate(item.endDate) }}</span>
                </div>
                <div class="info-item">
                  <span class="icon">💰</span>
                  <span class="premium">{{ formatAmount(item.premiumAmount, item.currency) }}</span>
                </div>
                <div v-if="item.daysUntilExpiry !== null" class="info-item" :class="getExpiryClass(item)">
                  <span class="icon">⏱️</span>
                  <span>{{ item.daysUntilExpiry }} jour{{ item.daysUntilExpiry > 1 ? 's' : '' }} restant{{ item.daysUntilExpiry > 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>
            
            <div class="item-footer">
              <span class="badge" :class="getStatusBadgeClass(item)">
                {{ item.statusLabel }}
              </span>
              <span v-if="item.isExpiringSoon" class="badge badge-warning" style="margin-left: 8px;">
                ⚠️ Expire bientôt
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
        <div class="empty-icon">🛡️</div>
        <h3>Aucune assurance</h3>
        <p>Commencez par créer votre première assurance</p>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>

      <!-- Modal de création/édition -->
      <Modal v-model="showModal" :title="isEditing ? 'Modifier l\'assurance' : 'Nouvelle assurance'" size="large">
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
                <label>N° de Police *</label>
                <input v-model="form.policyNumber" type="text" required placeholder="Ex: POL-2025-001">
              </div>
              <div class="form-group">
                <label>Compagnie d'assurance *</label>
                <input v-model="form.insuranceCompany" type="text" required placeholder="Ex: AXA">
              </div>
            </div>
            
            <div class="form-group">
              <label>Type de couverture *</label>
              <select v-model="form.coverageType" required>
                <option value="">Sélectionner...</option>
                <option value="comprehensive">Tous risques</option>
                <option value="third_party">Au tiers</option>
                <option value="liability">Responsabilité civile</option>
                <option value="collision">Collision</option>
              </select>
            </div>
          </div>

          <!-- Période et montants -->
          <div class="form-section">
            <h4>Période & Montants</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date de début *</label>
                <input v-model="form.startDate" type="date" required>
              </div>
              <div class="form-group">
                <label>Date de fin *</label>
                <input v-model="form.endDate" type="date" required>
              </div>
            </div>
            
            <div class="form-group">
              <label>Montant de la prime (FCFA) *</label>
              <input v-model="form.premiumAmount" type="number" step="0.01" required placeholder="0.00">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Franchise (optionnelle)</label>
                <input v-model="form.deductible" type="number" step="0.01" placeholder="0.00">
              </div>
              <div class="form-group">
                <label>Plafond de couverture (optionnel)</label>
                <input v-model="form.coverageLimit" type="number" step="0.01" placeholder="0.00">
              </div>
            </div>
          </div>

          <!-- Agent d'assurance -->
          <div class="form-section">
            <h4>Agent d'assurance</h4>
            
            <div class="form-group">
              <label>Nom de l'agent</label>
              <input v-model="form.agentName" type="text" placeholder="Ex: Jean Dupont">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Téléphone</label>
                <input v-model="form.agentContact" type="tel" placeholder="+33 6 12 34 56 78">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input v-model="form.agentEmail" type="email" placeholder="agent@assurance.com">
              </div>
            </div>
          </div>

          <!-- Renouvellement -->
          <div class="form-section">
            <h4>Renouvellement</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date de renouvellement</label>
                <input v-model="form.renewalDate" type="date">
              </div>
              <div class="form-group">
                <label>Rappel (jours avant)</label>
                <input v-model="form.renewalReminderDays" type="number" min="0" placeholder="30">
              </div>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="form.isAutoRenewal" type="checkbox">
                <span>Renouvellement automatique</span>
              </label>
            </div>
          </div>

          <!-- Statut et détails -->
          <div class="form-section">
            <h4>Statut & Détails</h4>
            
            <div class="form-group">
              <label>Statut</label>
              <select v-model="form.status">
                <option value="active">Active</option>
                <option value="expired">Expirée</option>
                <option value="pending_renewal">À renouveler</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Détails de couverture</label>
              <textarea v-model="form.coverageDetails" rows="3" placeholder="Détails des garanties..."></textarea>
            </div>
            
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
        <p>Êtes-vous sûr de vouloir supprimer cette assurance ?</p>
        <p v-if="itemToDelete" class="insurance-summary">
          <strong>{{ itemToDelete.policyNumber }}</strong> - {{ itemToDelete.insuranceCompany }}
          <br>Véhicule: <strong>{{ itemToDelete.vehicle?.plateNumber }}</strong>
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
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 })

const form = ref({
  id: null,
  vehicleId: null,
  policyNumber: '',
  insuranceCompany: '',
  coverageType: '',
  startDate: '',
  endDate: '',
  premiumAmount: '',
  deductible: '',
  coverageLimit: '',
  status: 'active',
  coverageDetails: '',
  agentName: '',
  agentContact: '',
  agentEmail: '',
  notes: '',
  renewalDate: '',
  renewalReminderDays: 30,
  isAutoRenewal: false,
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
    
    // Ajouter le filtre statut uniquement s'il n'est pas "all"
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }
    
    const response = await apiService.getVehicleInsurances(params)
    
    if (response.success) {
      items.value = response.data || []
      if (response.pagination) {
        pagination.value.total = response.pagination.totalItems || response.pagination.total || 0
        pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages || 0
      }
    }
  } catch (err) {
    console.error('Erreur lors du chargement:', err)
    error(err.response?.data?.message || 'Erreur lors du chargement des assurances')
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
    policyNumber: item.policyNumber || '',
    insuranceCompany: item.insuranceCompany || '',
    coverageType: item.coverageType || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    premiumAmount: item.premiumAmount || '',
    deductible: item.deductible || '',
    coverageLimit: item.coverageLimit || '',
    status: item.status || 'active',
    coverageDetails: item.coverageDetails || '',
    agentName: item.agentName || '',
    agentContact: item.agentContact || '',
    agentEmail: item.agentEmail || '',
    notes: item.notes || '',
    renewalDate: item.renewalDate || '',
    renewalReminderDays: item.renewalReminderDays || 30,
    isAutoRenewal: item.isAutoRenewal || false,
    isActive: item.isActive !== undefined ? item.isActive : true
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.vehicleId || !form.value.policyNumber || !form.value.insuranceCompany) {
    error('Le véhicule, le n° de police et la compagnie sont requis')
    return
  }
  
  if (!form.value.coverageType || !form.value.startDate || !form.value.endDate) {
    error('Le type de couverture et les dates sont requis')
    return
  }
  
  if (!form.value.premiumAmount) {
    error('Le montant de la prime est requis')
    return
  }
  
  submitting.value = true
  try {
    const data = {
      vehicleId: parseInt(form.value.vehicleId),
      policyNumber: form.value.policyNumber.trim(),
      insuranceCompany: form.value.insuranceCompany.trim(),
      coverageType: form.value.coverageType,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      premiumAmount: parseFloat(form.value.premiumAmount),
      currency: 'XOF',
      deductible: form.value.deductible ? parseFloat(form.value.deductible) : null,
      coverageLimit: form.value.coverageLimit ? parseFloat(form.value.coverageLimit) : null,
      status: form.value.status,
      coverageDetails: form.value.coverageDetails?.trim() || null,
      agentName: form.value.agentName?.trim() || null,
      agentContact: form.value.agentContact?.trim() || null,
      agentEmail: form.value.agentEmail?.trim() || null,
      notes: form.value.notes?.trim() || null,
      renewalDate: form.value.renewalDate || null,
      renewalReminderDays: form.value.renewalReminderDays ? parseInt(form.value.renewalReminderDays) : null,
      isAutoRenewal: form.value.isAutoRenewal,
      isActive: form.value.isActive
    }
    
    let response
    if (isEditing.value) {
      response = await apiService.updateVehicleInsurance(form.value.id, data)
    } else {
      response = await apiService.createVehicleInsurance(data)
    }
    
    if (response.success) {
      success(response.message || `Assurance ${isEditing.value ? 'modifiée' : 'créée'} avec succès`)
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
    const response = await apiService.deleteVehicleInsurance(itemToDelete.value.id)
    if (response.success) {
      success(response.message || 'Assurance supprimée avec succès')
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
  const oneYearLater = new Date()
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
  
  form.value = {
    id: null,
    vehicleId: null,
    policyNumber: '',
    insuranceCompany: '',
    coverageType: '',
    startDate: today,
    endDate: oneYearLater.toISOString().split('T')[0],
    premiumAmount: '',
    deductible: '',
    coverageLimit: '',
    status: 'active',
    coverageDetails: '',
    agentName: '',
    agentContact: '',
    agentEmail: '',
    notes: '',
    renewalDate: '',
    renewalReminderDays: 30,
    isAutoRenewal: false,
    isActive: true
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatAmount = (amount, currency) => {
  if (!amount) return '0'
  const formatted = parseFloat(amount).toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
  return `${formatted} ${currency || 'XOF'}`
}

const getStatusBadgeClass = (item) => {
  const statusMap = {
    'active': 'badge-success',
    'expired': 'badge-danger',
    'pending_renewal': 'badge-warning',
    'cancelled': 'badge-inactive'
  }
  return statusMap[item.status] || 'badge-inactive'
}

const getExpiryClass = (item) => {
  if (item.daysUntilExpiry < 0) {
    return 'text-danger'
  } else if (item.daysUntilExpiry <= 30) {
    return 'text-warning'
  }
  return ''
}

const renewInsurance = async (item) => {
  submitting.value = true
  try {
    // Calculer nouvelles dates (+1 an)
    const today = new Date()
    const oneYearLater = new Date()
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
    
    const data = {
      vehicleId: item.vehicle.id,
      policyNumber: item.policyNumber,
      insuranceCompany: item.insuranceCompany,
      coverageType: item.coverageType,
      startDate: today.toISOString().split('T')[0],
      endDate: oneYearLater.toISOString().split('T')[0],
      premiumAmount: parseFloat(item.premiumAmount || 0),
      currency: 'XOF',
      deductible: item.deductible ? parseFloat(item.deductible) : null,
      coverageLimit: item.coverageLimit ? parseFloat(item.coverageLimit) : null,
      status: 'active',
      coverageDetails: item.coverageDetails || null,
      agentName: item.agentName || null,
      agentContact: item.agentContact || null,
      agentEmail: item.agentEmail || null,
      notes: item.notes || null,
      renewalDate: item.renewalDate || null,
      renewalReminderDays: item.renewalReminderDays ? parseInt(item.renewalReminderDays) : null,
      isAutoRenewal: item.isAutoRenewal || false,
      isActive: true
    }
    
    const response = await apiService.updateVehicleInsurance(item.id, data)
    
    if (response.success) {
      success('Assurance renouvelée avec succès pour 1 an')
      loadItems()
    } else {
      error(response.message || 'Erreur lors du renouvellement')
    }
  } catch (err) {
    console.error('Erreur:', err)
    error(err.response?.data?.message || 'Erreur lors du renouvellement')
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

.insurance-card {
  .insurance-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

.btn-quick-success {
  background: #10b981;
  color: white;

  &:hover {
    background: #059669;
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

.insurance-section {
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

.policy-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #2563eb;
}

.premium {
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

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.text-danger {
  color: #ef4444;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b;
  font-weight: 600;
}

.insurance-summary {
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  text-align: center;
  margin: 1rem 0;
  line-height: 1.6;
}
</style>
