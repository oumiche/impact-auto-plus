<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <span class="icon">➕</span>
        Nouvelle marque
      </button>
    </template>

    <div class="page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher une marque (nom, code, pays)..."
        @search="handleSearch"
      />

      <!-- Loading -->
      <LoadingSpinner v-if="loading && !items.length" text="Chargement des marques..." />

      <!-- Marques List -->
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
              <div class="info-item" v-if="item.code"><span class="icon">🔢</span><span>{{ item.code }}</span></div>
              <div class="info-item" v-if="item.country"><span class="icon">🌍</span><span>{{ item.country }}</span></div>
              <div class="info-item" v-if="item.website"><span class="icon">🌐</span><span>{{ item.website }}</span></div>
              <div class="info-item" v-if="item.description"><span class="icon">📝</span><span>{{ item.description }}</span></div>
            </div>
            <div class="item-footer">
              <span class="badge" :class="item.isActive ? 'badge-success' : 'badge-inactive'">
                {{ item.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="pagination.totalPages > 1"
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total || 0"
          @page-change="handlePageChange"
        />
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🏷️</div>
        <h3>Aucune marque</h3>
        <p>Commencez par créer votre première marque</p>
        <button @click="openCreateModal" class="btn-primary">➕ Créer une marque</button>
      </div>

      <Modal v-model="showModal" :title="isEditing ? 'Modifier la marque' : 'Nouvelle marque'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group">
            <label>Nom *</label>
            <input v-model="form.name" type="text" required placeholder="Renault">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Code</label>
              <input v-model="form.code" type="text" placeholder="REN" maxlength="10">
            </div>
            <div class="form-group">
              <label>Pays</label>
              <input v-model="form.country" type="text" placeholder="France">
            </div>
          </div>
          <div class="form-group">
            <label>Site web</label>
            <input v-model="form.website" type="url" placeholder="https://www.renault.fr">
          </div>
          <div class="form-group">
            <label>URL du logo</label>
            <input v-model="form.logoUrl" type="url" placeholder="https://...">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Description de la marque..."></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="form.isActive" type="checkbox">
              <span>Marque active</span>
            </label>
          </div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}
          </button>
        </template>
      </Modal>

      <Modal v-model="showDeleteModal" title="Confirmer la suppression" size="small">
        <p>Supprimer <strong>{{ itemToDelete?.name }}</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>
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
import { ref, onMounted, computed } from 'vue'
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
const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0
})
const form = ref({ name: '', code: '', country: '', website: '', logoUrl: '', description: '', isActive: true })

let searchTimeout = null

onMounted(() => loadItems())

const handleSearch = (query) => {
  // Debounce pour la recherche côté serveur
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
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await apiService.getMarques(params)
    items.value = response.data || response.marques || []
    
    // Mettre à jour les infos de pagination depuis la réponse du serveur
    if (response.pagination) {
      pagination.value.total = response.pagination.total
      pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages
    }
  } catch (error) {
    console.error('Error loading marques:', error)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = { name: '', code: '', country: '', website: '', logoUrl: '', description: '', isActive: true }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  form.value = { ...item }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    if (isEditing.value) {
      await apiService.updateMarque(form.value.id, form.value)
      success('Marque modifiée avec succès')
    } else {
      await apiService.createMarque(form.value)
      success('Marque créée avec succès')
    }
    await loadItems()
    showModal.value = false
  } catch (err) {
    console.error('Error saving:', err)
    error('Erreur lors de l\'enregistrement de la marque')
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
    await apiService.deleteMarque(itemToDelete.value.id)
    success('Marque supprimée avec succès')
    await loadItems()
    showDeleteModal.value = false
  } catch (err) {
    console.error('Error deleting:', err)
    error('Erreur lors de la suppression de la marque')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';
</style>

