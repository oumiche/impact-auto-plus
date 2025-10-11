<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouveau conducteur</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher un conducteur..." @search="handleSearch" />
      
      <!-- Filtre de statut -->
      <div class="filters-bar">
        <select v-model="statusFilter" @change="handleFilterChange" class="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      
      <div v-else-if="items.length > 0">
        <div class="items-grid">
          <div v-for="item in items" :key="item.id" class="item-card">
            <div class="item-header">
              <div class="user-avatar">{{ getInitials(item) }}</div>
              <div class="item-actions">
                <button @click="openEditModal(item)" class="btn-icon" title="Modifier">✏️</button>
                <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
              </div>
            </div>
            <div class="item-info">
              <h3>{{ item.fullName }}</h3>
              <div class="info-item" v-if="item.code">
                <span class="icon">🔢</span>
                <span class="code-badge">{{ item.code }}</span>
              </div>
              <div class="info-item" v-if="item.licenseNumber">
                <span class="icon">🪪</span>
                <span>Permis: {{ item.licenseNumber }}</span>
              </div>
              <div class="info-item" v-if="item.licenseType">
                <span class="icon">📋</span>
                <span>{{ item.licenseType.code }} - {{ item.licenseType.name }}</span>
              </div>
              <div class="info-item" v-if="item.licenseExpiryDate">
                <span class="icon">📅</span>
                <span :class="getExpiryClass(item)">
                  Expire: {{ formatDate(item.licenseExpiryDate) }}
                </span>
              </div>
              <div class="info-item" v-if="item.age">
                <span class="icon">🎂</span>
                <span>{{ item.age }} ans</span>
              </div>
              <div class="info-item" v-if="item.email">
                <span class="icon">✉️</span>
                <span>{{ item.email }}</span>
              </div>
              <div class="info-item" v-if="item.phone">
                <span class="icon">📞</span>
                <span>{{ item.phone }}</span>
              </div>
            </div>
            <div class="item-footer">
              <span class="badge" :class="getStatusBadgeClass(item)">
                {{ item.statusLabel }}
              </span>
              <span v-if="item.isLicenseExpired" class="badge badge-danger" style="margin-left: 8px;">
                ⚠️ Permis expiré
              </span>
              <span v-else-if="item.isLicenseExpiringSoon" class="badge badge-warning" style="margin-left: 8px;">
                ⏰ Expire bientôt
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
        <div class="empty-icon">🚗</div>
        <h3>Aucun conducteur</h3>
        <p>Commencez par créer votre premier conducteur</p>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>

      <!-- Modal de création/édition -->
      <Modal v-model="showModal" :title="isEditing ? 'Modifier le conducteur' : 'Nouveau conducteur'" size="large">
        <form @submit.prevent="handleSubmit" class="form">
          <!-- Informations personnelles -->
          <div class="form-section">
            <h4>Informations personnelles</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Prénom *</label>
                <input v-model="form.firstName" type="text" required placeholder="Jean">
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <input v-model="form.lastName" type="text" required placeholder="Dupont">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Email</label>
                <input v-model="form.email" type="email" placeholder="jean.dupont@example.com">
              </div>
              <div class="form-group">
                <label>Téléphone</label>
                <input v-model="form.phone" type="tel" placeholder="+33 6 12 34 56 78">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date de naissance</label>
                <input v-model="form.dateOfBirth" type="date">
              </div>
              <div class="form-group">
                <label>Adresse</label>
                <input v-model="form.address" type="text" placeholder="123 Rue de la Paix">
              </div>
            </div>
          </div>

          <!-- Informations de permis -->
          <div class="form-section">
            <h4>Informations de permis</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Numéro de permis *</label>
                <input v-model="form.licenseNumber" type="text" required placeholder="1234567890">
              </div>
              <div class="form-group">
                <label>Type de permis</label>
                <select v-model="form.licenseTypeId">
                  <option value="">Sélectionner...</option>
                  <option v-for="type in licenseTypes" :key="type.id" :value="type.id">
                    {{ type.code }} - {{ type.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date d'expiration du permis</label>
                <input v-model="form.licenseExpiryDate" type="date">
              </div>
              <div class="form-group">
                <label>Statut</label>
                <select v-model="form.status">
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="suspended">Suspendu</option>
                  <option value="terminated">Terminé</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Contact d'urgence -->
          <div class="form-section">
            <h4>Contact d'urgence</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Nom du contact</label>
                <input v-model="form.emergencyContactName" type="text" placeholder="Marie Dupont">
              </div>
              <div class="form-group">
                <label>Téléphone du contact</label>
                <input v-model="form.emergencyContactPhone" type="tel" placeholder="+33 6 12 34 56 78">
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-section">
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
        <p>Êtes-vous sûr de vouloir supprimer <strong>{{ itemToDelete?.fullName }}</strong> ?</p>
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
import apiService from '@/services/api.service'

const { success, error } = useNotification()

// State
const items = ref([])
const licenseTypes = ref([])
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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  licenseNumber: '',
  licenseTypeId: '',
  licenseExpiryDate: '',
  dateOfBirth: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
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
    
    const response = await apiService.getDrivers(params)
    
    if (response.success) {
      items.value = response.data || []
      if (response.pagination) {
        pagination.value.total = response.pagination.total || response.pagination.totalItems || 0
        pagination.value.totalPages = response.pagination.pages || response.pagination.totalPages || 0
      }
    }
  } catch (err) {
    console.error('Erreur lors du chargement:', err)
    error(err.response?.data?.message || 'Erreur lors du chargement des conducteurs')
  } finally {
    loading.value = false
  }
}

const loadLicenseTypes = async () => {
  try {
    const response = await apiService.getLicenseTypes()
    if (response.success) {
      licenseTypes.value = response.data || []
    }
  } catch (err) {
    console.error('Erreur lors du chargement des types de permis:', err)
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
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    email: item.email || '',
    phone: item.phone || '',
    licenseNumber: item.licenseNumber || '',
    licenseTypeId: item.licenseType?.id || '',
    licenseExpiryDate: item.licenseExpiryDate || '',
    dateOfBirth: item.dateOfBirth || '',
    address: item.address || '',
    emergencyContactName: item.emergencyContactName || '',
    emergencyContactPhone: item.emergencyContactPhone || '',
    status: item.status || 'active',
    notes: item.notes || ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.firstName?.trim() || !form.value.lastName?.trim()) {
    error('Le prénom et le nom sont requis')
    return
  }
  
  if (!form.value.licenseNumber?.trim()) {
    error('Le numéro de permis est requis')
    return
  }
  
  submitting.value = true
  try {
    const data = {
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      email: form.value.email?.trim() || null,
      phone: form.value.phone?.trim() || null,
      licenseNumber: form.value.licenseNumber.trim(),
      licenseTypeId: form.value.licenseTypeId ? parseInt(form.value.licenseTypeId) : null,
      licenseExpiryDate: form.value.licenseExpiryDate || null,
      dateOfBirth: form.value.dateOfBirth || null,
      address: form.value.address?.trim() || null,
      emergencyContactName: form.value.emergencyContactName?.trim() || null,
      emergencyContactPhone: form.value.emergencyContactPhone?.trim() || null,
      status: form.value.status,
      notes: form.value.notes?.trim() || null
    }
    
    let response
    if (isEditing.value) {
      response = await apiService.updateDriver(form.value.id, data)
    } else {
      response = await apiService.createDriver(data)
    }
    
    if (response.success) {
      success(response.message || `Conducteur ${isEditing.value ? 'modifié' : 'créé'} avec succès`)
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
    const response = await apiService.deleteDriver(itemToDelete.value.id)
    if (response.success) {
      success(response.message || 'Conducteur supprimé avec succès')
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
  form.value = {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseTypeId: '',
    licenseExpiryDate: '',
    dateOfBirth: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    status: 'active',
    notes: ''
  }
}

const getInitials = (item) => {
  const first = item.firstName?.charAt(0)?.toUpperCase() || ''
  const last = item.lastName?.charAt(0)?.toUpperCase() || ''
  return first + last
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
    'suspended': 'badge-warning',
    'terminated': 'badge-danger'
  }
  return statusMap[item.status] || 'badge-inactive'
}

const getExpiryClass = (item) => {
  if (item.isLicenseExpired) {
    return 'text-danger'
  } else if (item.isLicenseExpiringSoon) {
    return 'text-warning'
  }
  return ''
}

// Lifecycle
onMounted(() => {
  loadItems()
  loadLicenseTypes()
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

.code-badge {
  font-family: 'Courier New', monospace;
  background-color: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.text-danger {
  color: #ef4444;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b;
  font-weight: 600;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
