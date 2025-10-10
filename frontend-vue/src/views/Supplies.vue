<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <span class="icon">➕</span>
        Nouvelle fourniture
      </button>
    </template>

    <div class="supplies-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher une fourniture (nom, référence, catégorie)..."
        @search="handleSearch"
      />

      <!-- Loading -->
      <LoadingSpinner v-if="supplyStore.loading && !supplies.length" text="Chargement des fournitures..." />

      <!-- Supplies List -->
      <div v-else-if="paginatedSupplies.length > 0">
        <div class="supplies-grid">
          <div
            v-for="supply in paginatedSupplies"
            :key="supply.id"
            class="supply-card"
          >
            <div class="supply-header">
              <h3>{{ supply.name }}</h3>
              <div class="supply-actions">
                <button @click="openEditModal(supply)" class="btn-icon" title="Modifier">
                  ✏️
                </button>
                <button @click="confirmDelete(supply)" class="btn-icon btn-danger" title="Supprimer">
                  ×
                </button>
              </div>
            </div>

            <div class="supply-info">
              <div class="info-item" v-if="supply.reference">
                <span class="icon">🔢</span>
                <span>Réf: {{ supply.reference }}</span>
              </div>
              <div class="info-item" v-if="supply.oemReference">
                <span class="icon">🏷️</span>
                <span>OEM: {{ supply.oemReference }}</span>
              </div>
              <div class="info-item" v-if="supply.category">
                <span class="icon">📁</span>
                <span>{{ typeof supply.category === 'object' ? supply.category.name : supply.category }}</span>
              </div>
              <div class="info-item" v-if="supply.brand">
                <span class="icon">🏭</span>
                <span>{{ supply.brand }}</span>
              </div>
              <div class="info-item" v-if="supply.unitPrice">
                <span class="icon">💰</span>
                <span>{{ formatPrice(supply.unitPrice) }}</span>
              </div>
            </div>

            <div class="supply-footer" v-if="supply.isActive !== undefined">
              <span class="badge" :class="supply.isActive ? 'badge-success' : 'badge-danger'">
                {{ supply.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total="pagination.total || 0"
          @page-change="handlePageChange"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Aucune fourniture</h3>
        <p>Commencez par ajouter votre première fourniture</p>
        <button @click="openCreateModal" class="btn-primary">
          <span class="icon">➕</span>
          Créer une fourniture
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="supplyStore.error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ supplyStore.error }}
      </div>

      <!-- Create/Edit Modal -->
      <Modal
        v-model="showModal"
        :title="isEditing ? 'Modifier la fourniture' : 'Nouvelle fourniture'"
        size="medium"
      >
        <form @submit.prevent="handleSubmit" class="supply-form">
          <div class="form-group">
            <label for="name">Nom *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="Alternateur"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="reference">Référence *</label>
              <input
                id="reference"
                v-model="form.reference"
                type="text"
                required
                placeholder="ALTERNATEUR-001"
              >
            </div>

            <div class="form-group">
              <label for="oemReference">Référence OEM</label>
              <input
                id="oemReference"
                v-model="form.oemReference"
                type="text"
                placeholder="OEM-12345"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="brand">Marque</label>
              <input
                id="brand"
                v-model="form.brand"
                type="text"
                placeholder="Bosch"
              >
            </div>

            <div class="form-group">
              <label for="unitPrice">Prix unitaire ({{ currency }}) *</label>
              <input
                id="unitPrice"
                v-model="form.unitPrice"
                type="number"
                min="0"
                step="0.01"
                required
                :placeholder="`150.00 ${currency}`"
              >
            </div>
          </div>

          <CategorySelector
            v-model="form.categoryId"
            label="Catégorie"
            placeholder="Rechercher une catégorie..."
            required
            @change="handleCategoryChange"
          />

          <div class="form-group">
            <label for="modelCompatibility">Compatibilité modèles (séparés par des virgules)</label>
            <input
              id="modelCompatibility"
              v-model="modelCompatibilityText"
              type="text"
              placeholder="Peugeot 308, Citroën C4, Renault Mégane"
            >
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="Description de la fourniture..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="form.isActive" type="checkbox">
              <span>Fourniture active</span>
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
        <p>Êtes-vous sûr de vouloir supprimer la fourniture <strong>{{ supplyToDelete?.name }}</strong> ?</p>
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
import { useSupplyStore } from '@/stores/supply'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import CategorySelector from '@/components/common/CategorySelector.vue'
import apiService from '@/services/api.service'

const authStore = useAuthStore()
const supplyStore = useSupplyStore()
const { success, error } = useNotification()

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const supplyToDelete = ref(null)
const searchQuery = ref('')

const form = ref({
  name: '',
  reference: '',
  oemReference: '',
  brand: '',
  categoryId: null,
  modelCompatibility: [],
  unitPrice: '0.00',
  description: '',
  isActive: true
})

const modelCompatibilityText = ref('')
const currency = ref('Fcfa') // Devise par défaut

const supplies = computed(() => supplyStore.supplies)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// Pour la compatibilité avec le code existant
const filteredSupplies = computed(() => supplies.value)
const totalPages = computed(() => pagination.value.totalPages)
const paginatedSupplies = computed(() => supplies.value)
const currentPage = computed({
  get: () => pagination.value.page,
  set: (val) => pagination.value.page = val
})

onMounted(async () => {
  await loadSupplies()
  await loadCurrency()
})

const loadCurrency = async () => {
  try {
    const result = await apiService.getCurrency()
    if (result.success && result.data) {
      currency.value = result.data.value || 'Fcfa'
    }
  } catch (err) {
    console.warn('Impossible de charger la devise, utilisation de la valeur par défaut:', err)
    // Garder la valeur par défaut Fcfa
  }
}

let searchTimeout = null

const handleSearch = (query) => {
  // Debounce pour la recherche côté serveur
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadSupplies()
  }, 500)
}

const handleCategoryChange = (category) => {
  // La catégorie sélectionnée est mise à jour automatiquement via v-model
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadSupplies()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const loadSupplies = async () => {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await supplyStore.fetchSupplies(params)
    
    // Mettre à jour les infos de pagination depuis la réponse du serveur
    if (response && response.pagination) {
      pagination.value.total = response.pagination.total
      pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages
    }
  } catch (error) {
    console.error('Error loading supplies:', error)
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    name: '',
    reference: '',
    oemReference: '',
    brand: '',
    categoryId: null,
    modelCompatibility: [],
    unitPrice: '0.00',
    description: '',
    isActive: true
  }
  modelCompatibilityText.value = ''
  showModal.value = true
}

const openEditModal = (supply) => {
  isEditing.value = true
  form.value = {
    id: supply.id,
    name: supply.name || '',
    reference: supply.reference || '',
    oemReference: supply.oemReference || '',
    brand: supply.brand || '',
    categoryId: supply.category?.id || null,
    modelCompatibility: supply.modelCompatibility || [],
    unitPrice: supply.unitPrice || '0.00',
    description: supply.description || '',
    isActive: supply.isActive !== false
  }
  modelCompatibilityText.value = (supply.modelCompatibility || []).join(', ')
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    // Validation des champs requis
    if (!form.value.name || !form.value.reference) {
      error('Le nom et la référence sont requis')
      return
    }

    if (!form.value.categoryId) {
      error('La catégorie est requise')
      return
    }

    // Convertir le texte de compatibilité modèle en tableau
    const modelCompatibility = modelCompatibilityText.value
      ? modelCompatibilityText.value.split(',').map(m => m.trim()).filter(m => m)
      : []

    const submitData = {
      ...form.value,
      modelCompatibility,
      // S'assurer que unitPrice est une string
      unitPrice: String(form.value.unitPrice || '0.00'),
      // S'assurer que description est une string
      description: form.value.description || '',
      // S'assurer que categoryId est un entier
      categoryId: parseInt(form.value.categoryId)
    }

    if (isEditing.value) {
      await supplyStore.updateSupply(form.value.id, submitData)
      success('Fourniture modifiée avec succès')
    } else {
      await supplyStore.createSupply(submitData)
      success('Fourniture créée avec succès')
    }

    showModal.value = false
  } catch (err) {
    console.error('Error saving supply:', err)
    const errorMessage = err.response?.data?.message || 'Erreur lors de l\'enregistrement de la fourniture'
    error(errorMessage)
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (supply) => {
  supplyToDelete.value = supply
  showDeleteModal.value = true
}

const handleDelete = async () => {
  try {
    submitting.value = true
    await supplyStore.deleteSupply(supplyToDelete.value.id)
    success('Fourniture supprimée avec succès')
    showDeleteModal.value = false
    supplyToDelete.value = null
  } catch (err) {
    console.error('Error deleting supply:', err)
    error('Erreur lors de la suppression de la fourniture')
  } finally {
    submitting.value = false
  }
}

const formatPrice = (price) => {
  // Si pas de prix, retourner -
  if (!price && price !== 0) return '-'
  
  // Format simple avec la devise dynamique
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
  
  return `${formatted} ${currency.value}`
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


.supplies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.supply-card {
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

.supply-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    color: #333;
    margin: 0;
    font-weight: 600;
    flex: 1;
  }
}

.supply-actions {
  display: flex;
  gap: 0.5rem;
}


.supply-info {
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

.supply-footer {
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
    background: #d1fae5;
    color: #065f46;
  }

  &.badge-warning {
    background: #fef3c7;
    color: #92400e;
  }

  &.badge-danger {
    background: #fee2e2;
    color: #991b1b;
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

.supply-form {
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
  input[type="number"],
  select,
  textarea {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #2563eb;
    }
  }

  select {
    cursor: pointer;
  }

  textarea {
    resize: vertical;
  }
}

.warning-text {
  color: #ef4444;
  font-weight: 600;
  margin-top: 0.5rem;
}

// Espacement pour la pagination
:deep(.pagination) {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .supplies-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
