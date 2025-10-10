<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <span class="icon">➕</span>
        Nouveau véhicule
      </button>
    </template>

    <div class="vehicles-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher un véhicule (immatriculation, marque, modèle)..."
        @search="handleSearch"
      />

      <!-- Loading -->
      <LoadingSpinner v-if="vehicleStore.loading && !vehicles.length" text="Chargement des véhicules..." />

      <!-- Vehicles List -->
      <div v-else-if="paginatedVehicles.length > 0" class="vehicles-grid">
        <div
          v-for="vehicle in paginatedVehicles"
          :key="vehicle.id"
          class="vehicle-card"
        >
          <div class="vehicle-header">
            <div class="vehicle-plate">{{ vehicle.plate_number || 'N/A' }}</div>
            <div class="vehicle-actions">
              <button @click="openEditModal(vehicle)" class="btn-icon" title="Modifier">
                ✏️
              </button>
              <button @click="confirmDelete(vehicle)" class="btn-icon btn-danger" title="Supprimer">
                ×
              </button>
            </div>
          </div>

          <div class="vehicle-info">
            <h3>{{ vehicle.brand?.name || 'N/A' }} {{ vehicle.model?.name || 'N/A' }}</h3>
            
            <div class="info-grid">
              <div class="info-item" v-if="vehicle.year">
                <span class="icon">📅</span>
                <span>{{ vehicle.year }}</span>
              </div>
              <div class="info-item" v-if="vehicle.vin">
                <span class="icon">🔢</span>
                <span>{{ vehicle.vin }}</span>
              </div>
              <div class="info-item" v-if="vehicle.fuelType">
                <span class="icon">⛽</span>
                <span>{{ vehicle.fuelType.name }}</span>
              </div>
              <div class="info-item" v-if="vehicle.color">
                <span class="icon">🎨</span>
                <span>{{ vehicle.color.name }}</span>
              </div>
              <div class="info-item" v-if="vehicle.mileage">
                <span class="icon">📏</span>
                <span>{{ vehicle.mileage }} km</span>
              </div>
              <div class="info-item" v-if="vehicle.category">
                <span class="icon">🚗</span>
                <span>{{ vehicle.category.name }}</span>
              </div>
            </div>
          </div>

          <div class="vehicle-footer">
            <span class="badge" :class="getStatusClass(vehicle.status)">
              {{ getStatusLabel(vehicle.status) }}
            </span>
            <span v-if="vehicle.garage" class="garage-badge">
              🏢 {{ vehicle.garage.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <!-- Pagination -->
      <Pagination
        v-if="filteredVehicles.length > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="filteredVehicles.length"
        @page-change="handlePageChange"
      />

      <div v-else class="empty-state">
        <div class="empty-icon">🚗</div>
        <h3>Aucun véhicule</h3>
        <p>Commencez par ajouter votre premier véhicule</p>
        <button @click="openCreateModal" class="btn-primary">
          <span class="icon">➕</span>
          Créer un véhicule
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="vehicleStore.error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ vehicleStore.error }}
      </div>

      <!-- Create/Edit Modal -->
      <Modal
        v-model="showModal"
        :title="isEditing ? 'Modifier le véhicule' : 'Nouveau véhicule'"
        size="large"
      >
        <form @submit.prevent="handleSubmit" class="vehicle-form">
          <div class="form-row">
            <div class="form-group">
              <label for="plate_number">Immatriculation *</label>
              <input id="plate_number" v-model="form.plateNumber" type="text" required placeholder="AB-123-CD" maxlength="20">
            </div>
            <div class="form-group">
              <label for="vin">Numéro VIN</label>
              <input id="vin" v-model="form.vin" type="text" placeholder="1HGBH41JXMN109186" maxlength="17">
            </div>
          </div>

          <div class="form-row">
            <BrandSelector v-model="form.brand_id" required @change="handleBrandChange" />
            <ModelSelector v-model="form.model_id" :brand-id="form.brand_id" required />
          </div>

          <div class="form-row">
            <SimpleSelector v-model="form.color_id" api-method="getVehicleColors" label="Couleur" placeholder="Sélectionner une couleur" required />
            <SimpleSelector v-model="form.category_id" api-method="getVehicleCategories" label="Catégorie" placeholder="Sélectionner une catégorie" />
          </div>

          <div class="form-row">
            <SimpleSelector v-model="form.fuelType_id" api-method="getFuelTypes" label="Type de carburant" placeholder="Sélectionner" />
            <div class="form-group">
              <label for="year">Année</label>
              <input id="year" v-model="form.year" type="number" min="1900" :max="new Date().getFullYear() + 1" placeholder="2023">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="mileage">Kilométrage</label>
              <input id="mileage" v-model="form.mileage" type="number" min="0" placeholder="50000">
            </div>
            <div class="form-group">
              <label for="status">Statut</label>
              <select id="status" v-model="form.status">
                <option value="active">Actif</option>
                <option value="maintenance">En maintenance</option>
                <option value="inactive">Hors service</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="engineSize">Cylindrée (L)</label>
              <input id="engineSize" v-model="form.engineSize" type="number" step="0.1" placeholder="1.5">
            </div>
            <div class="form-group">
              <label for="powerHp">Puissance (CV)</label>
              <input id="powerHp" v-model="form.powerHp" type="number" placeholder="110">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="purchaseDate">Date d'achat</label>
              <input id="purchaseDate" v-model="form.purchaseDate" type="date">
            </div>
            <div class="form-group">
              <label for="purchasePrice">Prix d'achat (€)</label>
              <input id="purchasePrice" v-model="form.purchasePrice" type="number" step="0.01" placeholder="15000">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="insuranceExpiry">Expiration assurance</label>
              <input id="insuranceExpiry" v-model="form.insuranceExpiry" type="date">
            </div>
            <div class="form-group">
              <label for="technicalInspectionExpiry">Expiration contrôle technique</label>
              <input id="technicalInspectionExpiry" v-model="form.technicalInspectionExpiry" type="date">
            </div>
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
        <p>Êtes-vous sûr de vouloir supprimer le véhicule <strong>{{ vehicleToDelete?.plate_number }}</strong> ?</p>
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
import { useVehicleStore } from '@/stores/vehicle'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import BrandSelector from '@/components/common/BrandSelector.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'

const authStore = useAuthStore()
const vehicleStore = useVehicleStore()
const { success, error } = useNotification()

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const vehicleToDelete = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(12)

const form = ref({
  plateNumber: '',
  vin: '',
  brand_id: '',
  model_id: '',
  color_id: '',
  category_id: '',
  fuelType_id: '',
  year: null,
  mileage: 0,
  status: 'active',
  engineSize: null,
  powerHp: null,
  purchaseDate: '',
  purchasePrice: null,
  insuranceExpiry: '',
  technicalInspectionExpiry: ''
})

const vehicles = computed(() => vehicleStore.vehicles)

const filteredVehicles = computed(() => {
  if (!searchQuery.value) return vehicles.value
  
  const query = searchQuery.value.toLowerCase()
  return vehicles.value.filter(vehicle => {
    return (
      vehicle.plateNumber?.toLowerCase().includes(query) ||
      vehicle.brand?.name?.toLowerCase().includes(query) ||
      vehicle.model?.name?.toLowerCase().includes(query) ||
      vehicle.vin?.toLowerCase().includes(query) ||
      vehicle.color?.name?.toLowerCase().includes(query)
    )
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredVehicles.value.length / itemsPerPage.value)
})

const paginatedVehicles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredVehicles.value.slice(start, end)
})

onMounted(async () => {
  await loadVehicles()
})

const handleSearch = (query) => {
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const loadVehicles = async () => {
  try {
    await vehicleStore.fetchVehicles()
  } catch (error) {
    console.error('Error loading vehicles:', error)
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    plateNumber: '',
    vin: '',
    brand_id: '',
    model_id: '',
    color_id: '',
    category_id: '',
    fuelType_id: '',
    year: null,
    mileage: 0,
    status: 'active',
    engineSize: null,
    powerHp: null,
    purchaseDate: '',
    purchasePrice: null,
    insuranceExpiry: '',
    technicalInspectionExpiry: ''
  }
  showModal.value = true
}

const openEditModal = (vehicle) => {
  isEditing.value = true
  form.value = {
    id: vehicle.id,
    plateNumber: vehicle.plateNumber || '',
    vin: vehicle.vin || '',
    brand_id: vehicle.brand?.id || '',
    model_id: vehicle.model?.id || '',
    color_id: vehicle.color?.id || '',
    category_id: vehicle.category?.id || '',
    fuelType_id: vehicle.fuelType?.id || '',
    year: vehicle.year || null,
    mileage: vehicle.mileage || 0,
    status: vehicle.status || 'active',
    engineSize: vehicle.engineSize || null,
    powerHp: vehicle.powerHp || null,
    purchaseDate: vehicle.purchaseDate || '',
    purchasePrice: vehicle.purchasePrice || null,
    insuranceExpiry: vehicle.insuranceExpiry || '',
    technicalInspectionExpiry: vehicle.technicalInspectionExpiry || ''
  }
  showModal.value = true
}

const handleBrandChange = () => {
  // Réinitialiser le modèle quand la marque change
  form.value.model_id = ''
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    if (isEditing.value) {
      await vehicleStore.updateVehicle(form.value.id, form.value)
      success('Véhicule modifié avec succès')
    } else {
      await vehicleStore.createVehicle(form.value)
      success('Véhicule créé avec succès')
    }

    showModal.value = false
  } catch (err) {
    console.error('Error saving vehicle:', err)
    error('Erreur lors de l\'enregistrement du véhicule')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (vehicle) => {
  vehicleToDelete.value = vehicle
  showDeleteModal.value = true
}

const handleDelete = async () => {
  try {
    submitting.value = true
    await vehicleStore.deleteVehicle(vehicleToDelete.value.id)
    success('Véhicule supprimé avec succès')
    showDeleteModal.value = false
    vehicleToDelete.value = null
  } catch (err) {
    console.error('Error deleting vehicle:', err)
    error('Erreur lors de la suppression du véhicule')
  } finally {
    submitting.value = false
  }
}

const getStatusClass = (status) => {
  const classes = {
    'active': 'badge-success',
    'maintenance': 'badge-warning',
    'inactive': 'badge-danger'
  }
  return classes[status] || 'badge-secondary'
}

const getStatusLabel = (status) => {
  const labels = {
    'active': 'Actif',
    'maintenance': 'En maintenance',
    'inactive': 'Hors service'
  }
  return labels[status] || status
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


.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.vehicle-card {
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

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  .vehicle-plate {
    background: #2563eb;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: 0.05em;
  }
}

.vehicle-actions {
  display: flex;
  gap: 0.5rem;
}


.vehicle-info {
  margin-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    color: #333;
    margin-bottom: 1rem;
    font-weight: 600;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;

  .icon {
    font-size: 1.1rem;
  }
}

.vehicle-footer {
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
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

  &.badge-secondary {
    background: #e5e7eb;
    color: #374151;
  }
}

.garage-badge {
  font-size: 0.85rem;
  color: #666;
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

.vehicle-form {
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
  input[type="tel"],
  input[type="number"],
  input[type="date"],
  select {
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

  select {
    cursor: pointer;
  }
}

.warning-text {
  color: #ef4444;
  font-weight: 600;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .vehicles-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
