<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <span class="icon">➕</span>
        Nouveau garage
      </button>
    </template>

    <div class="garages-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher un garage..."
        @search="handleSearch"
      />

      <!-- Loading -->
      <LoadingSpinner v-if="garageStore.loading && !garages.length" text="Chargement des garages..." />

      <!-- Garages List -->
      <div v-else-if="paginatedGarages.length > 0" class="garages-grid">
        <div
          v-for="garage in paginatedGarages"
          :key="garage.id"
          class="garage-card"
        >
          <div class="garage-header">
            <h3>{{ garage.name }}</h3>
            <div class="garage-actions">
              <button @click="openEditModal(garage)" class="btn-icon" title="Modifier">
                ✏️
              </button>
              <button @click="confirmDelete(garage)" class="btn-icon btn-danger" title="Supprimer">
                ×
              </button>
            </div>
          </div>

          <div class="garage-info">
            <div class="info-item" v-if="garage.address">
              <span class="icon">📍</span>
              <span>{{ garage.address }}</span>
            </div>
            <div class="info-item" v-if="garage.city">
              <span class="icon">🏙️</span>
              <span>{{ garage.city }} {{ garage.postal_code }}</span>
            </div>
            <div class="info-item" v-if="garage.phone">
              <span class="icon">📞</span>
              <span>{{ garage.phone }}</span>
            </div>
            <div class="info-item" v-if="garage.email">
              <span class="icon">✉️</span>
              <span>{{ garage.email }}</span>
            </div>
          </div>

          <div class="garage-footer">
            <span class="badge" :class="garage.isActive ? 'badge-success' : 'badge-inactive'">
              {{ garage.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="filteredGarages.length > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="filteredGarages.length"
        @page-change="handlePageChange"
      />

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">🏢</div>
        <h3>Aucun garage</h3>
        <p>Commencez par créer votre premier garage</p>
        <button @click="openCreateModal" class="btn-primary">
          <span class="icon">➕</span>
          Créer un garage
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="garageStore.error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ garageStore.error }}
      </div>

      <!-- Create/Edit Modal -->
      <Modal
        v-model="showModal"
        :title="isEditing ? 'Modifier le garage' : 'Nouveau garage'"
        size="medium"
      >
        <form @submit.prevent="handleSubmit" class="garage-form">
          <div class="form-group">
            <label for="name">Nom du garage *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="Garage Central"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="address">Adresse</label>
              <input
                id="address"
                v-model="form.address"
                type="text"
                placeholder="123 Rue Example"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="city">Ville</label>
              <input
                id="city"
                v-model="form.city"
                type="text"
                placeholder="Paris"
              >
            </div>

            <div class="form-group">
              <label for="postal_code">Code postal</label>
              <input
                id="postal_code"
                v-model="form.postal_code"
                type="text"
                placeholder="75001"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Téléphone</label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="01 23 45 67 89"
              >
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="garage@example.com"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="form.isActive"
                type="checkbox"
              >
              <span>Garage actif</span>
            </label>
          </div>
        </form>

        <template #footer>
          <button @click="showModal = false" class="btn-secondary" type="button">
            Annuler
          </button>
          <button @click="handleSubmit" class="btn-primary" type="button" :disabled="submitting">
            <span v-if="submitting">Enregistrement...</span>
            <span v-else>{{ isEditing ? 'Modifier' : 'Créer' }}</span>
          </button>
        </template>
      </Modal>

      <!-- Delete Confirmation Modal -->
      <Modal
        v-model="showDeleteModal"
        title="Confirmer la suppression"
        size="small"
      >
        <p>Êtes-vous sûr de vouloir supprimer le garage <strong>{{ garageToDelete?.name }}</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>

        <template #footer>
          <button @click="showDeleteModal = false" class="btn-secondary">
            Annuler
          </button>
          <button @click="handleDelete" class="btn-danger" :disabled="submitting">
            <span v-if="submitting">Suppression...</span>
            <span v-else>Supprimer</span>
          </button>
        </template>
      </Modal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGarageStore } from '@/stores/garage'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'

const authStore = useAuthStore()
const garageStore = useGarageStore()
const { success, error } = useNotification()

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const garageToDelete = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(12)

const form = ref({
  name: '',
  address: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
  isActive: true
})

const garages = computed(() => garageStore.garages)

const filteredGarages = computed(() => {
  if (!searchQuery.value) return garages.value
  
  const query = searchQuery.value.toLowerCase()
  return garages.value.filter(garage => {
    return (
      garage.name?.toLowerCase().includes(query) ||
      garage.city?.toLowerCase().includes(query) ||
      garage.address?.toLowerCase().includes(query) ||
      garage.email?.toLowerCase().includes(query) ||
      garage.phone?.toLowerCase().includes(query)
    )
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredGarages.value.length / itemsPerPage.value)
})

const paginatedGarages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredGarages.value.slice(start, end)
})

onMounted(async () => {
  await loadGarages()
})

const handleSearch = (query) => {
  currentPage.value = 1 // Reset à la page 1 lors d'une recherche
}

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const loadGarages = async () => {
  try {
    await garageStore.fetchGarages()
  } catch (error) {
    console.error('Error loading garages:', error)
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    isActive: true
  }
  showModal.value = true
}

const openEditModal = (garage) => {
  isEditing.value = true
  form.value = {
    id: garage.id,
    name: garage.name || '',
    address: garage.address || '',
    city: garage.city || '',
    postal_code: garage.postal_code || '',
    phone: garage.phone || '',
    email: garage.email || '',
    isActive: garage.isActive !== false
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    if (isEditing.value) {
      await garageStore.updateGarage(form.value.id, form.value)
      success('Garage modifié avec succès')
    } else {
      await garageStore.createGarage(form.value)
      success('Garage créé avec succès')
    }

    showModal.value = false
  } catch (err) {
    console.error('Error saving garage:', err)
    error('Erreur lors de l\'enregistrement du garage')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (garage) => {
  garageToDelete.value = garage
  showDeleteModal.value = true
}

const handleDelete = async () => {
  try {
    submitting.value = true
    await garageStore.deleteGarage(garageToDelete.value.id)
    success('Garage supprimé avec succès')
    showDeleteModal.value = false
    garageToDelete.value = null
  } catch (err) {
    console.error('Error deleting garage:', err)
    error('Erreur lors de la suppression du garage')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #1e40af;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.2rem;
  }
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #e5e5e5;
  }
}


.garages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.garage-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
}

.garage-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    color: #333;
    margin: 0;
  }
}

.garage-actions {
  display: flex;
  gap: 0.5rem;
}


.garage-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.95rem;

  .icon {
    font-size: 1.1rem;
  }
}

.garage-footer {
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;

  &.badge-success {
    background: #d4edda;
    color: #155724;
  }

  &.badge-inactive {
    background: #f8d7da;
    color: #721c24;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
  }
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  border-left: 4px solid #c33;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .error-icon {
    font-size: 1.2rem;
  }
}

.garage-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
  }

  input[type="text"],
  input[type="email"],
  input[type="tel"] {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: #2563eb;
    }
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
}

.warning-text {
  color: #e53e3e;
  font-weight: 600;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .garages-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
