<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouveau modèle</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher un modèle (nom, code, marque)..." @search="handleSearch" />
      <LoadingSpinner v-if="loading && !items.length" text="Chargement des modèles..." />
      <div v-else-if="items.length > 0">
        <div class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card">
          <div class="item-header">
            <h3>{{ item.name }}</h3>
            <div class="item-actions">
              <button @click="openEditModal(item)" class="btn-icon">✏️</button>
              <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
            </div>
          </div>
          <div class="item-info">
            <div class="info-item" v-if="item.marque">
              <span class="icon">🏷️</span>
              <span><strong>{{ item.marque?.name || item.marque }}</strong></span>
            </div>
            <div class="info-item" v-if="item.marque?.code">
              <span class="icon">🔢</span>
              <span>Code marque: {{ item.marque.code }}</span>
            </div>
            <div class="info-item" v-if="item.marque?.country">
              <span class="icon">🌍</span>
              <span>{{ item.marque.country }}</span>
            </div>
            <div class="info-item" v-if="item.code">
              <span class="icon">📋</span>
              <span>Code modèle: {{ item.code }}</span>
            </div>
            <div class="info-item" v-if="item.description">
              <span class="icon">📝</span>
              <span>{{ item.description }}</span>
            </div>
          </div>
          <div class="item-footer" v-if="item.isActive !== undefined">
            <span class="badge" :class="item.isActive ? 'badge-success' : 'badge-inactive'">
              {{ item.isActive ? 'Actif' : 'Inactif' }}
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
        <div class="empty-icon">🚙</div>
        <h3>Aucun modèle</h3>
        <p>Commencez par créer votre premier modèle</p>
        <button @click="openCreateModal" class="btn-primary">➕ Créer un modèle</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier le modèle' : 'Nouveau modèle'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <BrandSelector v-model="form.brand_id" required />
          <div class="form-group"><label>Nom *</label><input v-model="form.name" type="text" required placeholder="Clio"></div>
          <div class="form-group"><label>Code</label><input v-model="form.code" type="text" placeholder="CLIO"></div>
          <div class="form-row">
            <div class="form-group"><label>Année début *</label><input v-model.number="form.yearStart" type="number" required placeholder="2020"></div>
            <div class="form-group"><label>Année fin *</label><input v-model.number="form.yearEnd" type="number" required placeholder="2024"></div>
          </div>
          <div class="form-group"><label>Description</label><textarea v-model="form.description" rows="2"></textarea></div>
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="form.isActive" type="checkbox">
              <span>Modèle actif</span>
            </label>
          </div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer la suppression" size="small">
        <p>Supprimer <strong>{{ itemToDelete?.name }}</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>
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
import BrandSelector from '@/components/common/BrandSelector.vue'
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
const form = ref({ 
  brand_id: '', 
  name: '', 
  code: '', 
  yearStart: new Date().getFullYear(), 
  yearEnd: new Date().getFullYear(), 
  description: '', 
  isActive: true 
})

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
    
    const response = await apiService.getModeles(params)
    items.value = response.data || response.modeles || []
    if (response.pagination) {
      pagination.value.total = response.pagination.total
      pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages
    }
  } catch (err) {
    console.error('Error loading modeles:', err)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  const currentYear = new Date().getFullYear()
  form.value = { 
    brand_id: '', 
    name: '', 
    code: '', 
    yearStart: currentYear, 
    yearEnd: currentYear, 
    description: '', 
    isActive: true 
  }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  const currentYear = new Date().getFullYear()
  form.value = {
    id: item.id,
    brand_id: item.brand?.id || item.marque?.id || item.brand_id || '',
    name: item.name || '',
    code: item.code || '',
    yearStart: item.yearStart || currentYear,
    yearEnd: item.yearEnd || currentYear,
    description: item.description || '',
    isActive: item.isActive !== false
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    
    // Préparer les données pour l'API (convertir brand_id en brandId)
    const payload = {
      brandId: form.value.brand_id,
      name: form.value.name,
      code: form.value.code,
      yearStart: form.value.yearStart,
      yearEnd: form.value.yearEnd,
      description: form.value.description,
      isActive: form.value.isActive
    }
    
    if (isEditing.value) {
      await apiService.updateModele(form.value.id, payload)
      success('Modèle modifié avec succès')
    } else {
      await apiService.createModele(payload)
      success('Modèle créé avec succès')
    }
    await loadItems()
    showModal.value = false
  } catch (err) {
    console.error('Error:', err)
    error('Erreur lors de l\'enregistrement du modèle')
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
    await apiService.deleteModele(itemToDelete.value.id)
    success('Modèle supprimé avec succès')
    await loadItems()
    showDeleteModal.value = false
  } catch (err) {
    console.error('Error:', err)
    error('Erreur lors de la suppression du modèle')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';
</style>

