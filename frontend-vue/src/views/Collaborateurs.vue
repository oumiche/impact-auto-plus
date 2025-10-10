<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouveau collaborateur</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher un collaborateur..." @search="handleSearch" />
      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      <div v-else-if="items.length > 0">
        <div class="items-grid">
          <div v-for="item in items" :key="item.id" class="item-card">
            <div class="item-header">
              <div class="user-avatar">{{ getInitials(item) }}</div>
              <div class="item-actions">
                <button @click="openEditModal(item)" class="btn-icon">✏️</button>
                <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
              </div>
            </div>
            <div class="item-info">
              <h3>{{ item.firstName }} {{ item.lastName }}</h3>
              <div class="info-item" v-if="item.employeeNumber"><span class="icon">🔢</span><span>{{ item.employeeNumber }}</span></div>
              <div class="info-item" v-if="item.email"><span class="icon">✉️</span><span>{{ item.email }}</span></div>
              <div class="info-item" v-if="item.phone"><span class="icon">📞</span><span>{{ item.phone }}</span></div>
              <div class="info-item" v-if="item.position"><span class="icon">💼</span><span>{{ item.position }}</span></div>
              <div class="info-item" v-if="item.department"><span class="icon">🏢</span><span>{{ item.department }}</span></div>
            </div>
            <div class="item-footer">
              <span class="badge" :class="item.isActive ? 'badge-success' : 'badge-inactive'">{{ item.isActive ? 'Actif' : 'Inactif' }}</span>
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
        <div class="empty-icon">👔</div>
        <h3>Aucun collaborateur</h3>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier' : 'Nouveau collaborateur'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-row">
            <div class="form-group"><label>Prénom *</label><input v-model="form.firstName" type="text" required placeholder="Jean"></div>
            <div class="form-group"><label>Nom *</label><input v-model="form.lastName" type="text" required placeholder="Dupont"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input v-model="form.email" type="email" placeholder="jean.dupont@example.com"></div>
            <div class="form-group"><label>Téléphone</label><input v-model="form.phone" type="tel" placeholder="+33 6 12 34 56 78"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>N° Employé</label><input v-model="form.employeeNumber" type="text" placeholder="EMP001"></div>
            <div class="form-group"><label>Département</label><input v-model="form.department" type="text" placeholder="Mécanique"></div>
          </div>
          <div class="form-group"><label>Poste</label><input v-model="form.position" type="text" placeholder="Mécanicien"></div>
          <div class="form-group">
            <label class="checkbox-label"><input v-model="form.isActive" type="checkbox"><span>Actif</span></label>
          </div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer" size="small">
        <p>Supprimer <strong>{{ itemToDelete?.firstName }} {{ itemToDelete?.lastName }}</strong> ?</p>
        <template #footer>
          <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleDelete" class="btn-danger" :disabled="submitting">{{ submitting ? 'Suppression...' : 'Supprimer' }}</button>
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
const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const itemToDelete = ref(null)
const searchQuery = ref('')
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 })
const form = ref({ firstName: '', lastName: '', email: '', phone: '', position: '', department: '', isActive: true })

let searchTimeout = null

onMounted(() => loadItems())

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
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const loadItems = async () => {
  try {
    loading.value = true
    const params = { page: pagination.value.page, limit: pagination.value.limit }
    if (searchQuery.value) params.search = searchQuery.value
    
    const response = await apiService.getCollaborateurs(params)
    items.value = response.data || []
    if (response.pagination) {
      pagination.value.total = response.pagination.totalItems || response.pagination.total || 0
      pagination.value.totalPages = response.pagination.totalPages || 0
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

const getInitials = (item) => {
  const first = item.firstName?.charAt(0) || ''
  const last = item.lastName?.charAt(0) || ''
  return (first + last).toUpperCase()
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = { firstName: '', lastName: '', email: '', phone: '', position: '', department: '', employeeNumber: '', isActive: true }
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
    position: item.position || '',
    department: item.department || '',
    employeeNumber: item.employeeNumber || '',
    isActive: item.isActive !== false
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    if (isEditing.value) {
      await apiService.updateCollaborateur(form.value.id, form.value)
      success('Collaborateur modifié avec succès')
    } else {
      await apiService.createCollaborateur(form.value)
      success('Collaborateur créé avec succès')
    }
    await loadItems()
    showModal.value = false
  } catch (err) {
    console.error('Error:', err)
    error('Erreur lors de l\'enregistrement du collaborateur')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  try {
    submitting.value = true
    await apiService.deleteCollaborateur(itemToDelete.value.id)
    success('Collaborateur supprimé avec succès')
    await loadItems()
    showDeleteModal.value = false
  } catch (err) {
    console.error('Error:', err)
    error('Erreur lors de la suppression du collaborateur')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.user-avatar {
  width: 60px;
  height: 60px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
</style>

