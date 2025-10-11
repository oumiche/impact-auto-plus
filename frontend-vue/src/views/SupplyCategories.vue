<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary"><i class="fas fa-plus"></i> Nouvelle catégorie</button>
    </template>
    <div class="page">
      <SearchBar v-model="searchQuery" placeholder="Rechercher une catégorie de fourniture..." @search="handleSearch" />
      <LoadingSpinner v-if="loading && !items.length" text="Chargement des catégories..." />
      <div v-else-if="items.length > 0">
        <div class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card">
          <div class="item-header">
            <h3>{{ item.name }}</h3>
            <div class="item-actions">
                <button @click="openEditModal(item)" class="btn-icon btn-edit" title="Modifier"><i class="fas fa-edit"></i></button>
                <button @click="confirmDelete(item)" class="btn-icon btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="item-info" v-if="item.description">
            <div class="info-item"><i class="fas fa-file-alt"></i><span>{{ item.description }}</span></div>
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
        <div class="empty-icon"><i class="fas fa-folder-open"></i></div>
        <h3>Aucune catégorie de fourniture</h3>
        <button @click="openCreateModal" class="btn-primary"><i class="fas fa-plus"></i> Créer</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier' : 'Nouvelle catégorie'">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group"><label>Nom *</label><input v-model="form.name" type="text" required placeholder="Lubrifiants"></div>
          <div class="form-group"><label>Description</label><textarea v-model="form.description" rows="2"></textarea></div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer" size="small">
        <p>Supprimer <strong>{{ itemToDelete?.name }}</strong> ?</p>
        <template #footer>
          <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleDelete" class="btn-danger" :disabled="submitting">Supprimer</button>
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
const form = ref({ name: '', description: '' })

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
    
    const response = await apiService.getSupplyCategories(params)
    items.value = response.data || []
    if (response.pagination) {
      pagination.value.total = response.pagination.total
      pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = { name: '', description: '' }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  form.value = { 
    id: item.id,
    name: item.name || '',
    description: item.description || ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    if (isEditing.value) {
      await apiService.updateSupplyCategory(form.value.id, form.value)
      success('Catégorie modifiée avec succès')
    } else {
      await apiService.createSupplyCategory(form.value)
      success('Catégorie créée avec succès')
    }
    await loadItems()
    showModal.value = false
  } catch (err) {
    console.error('Error:', err)
    error('Erreur lors de l\'enregistrement de la catégorie')
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
    await apiService.deleteSupplyCategory(itemToDelete.value.id)
    success('Catégorie supprimée avec succès')
    await loadItems()
    showDeleteModal.value = false
  } catch (err) {
    console.error('Error:', err)
    error('Erreur lors de la suppression de la catégorie')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';
</style>

