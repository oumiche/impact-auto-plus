<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouvel entretien</button>
    </template>
    <div class="page">
      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      <div v-else-if="items.length > 0" class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card">
          <div class="item-header">
            <h3>{{ item.vehicle?.plate_number || 'Véhicule' }}</h3>
            <div class="item-actions">
              <button @click="openEditModal(item)" class="btn-icon">✏️</button>
              <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
            </div>
          </div>
          <div class="item-info">
            <div class="info-item" v-if="item.type"><span class="icon">🔧</span><span>{{ item.type }}</span></div>
            <div class="info-item" v-if="item.scheduled_date"><span class="icon">📅</span><span>{{ formatDate(item.scheduled_date) }}</span></div>
            <div class="info-item" v-if="item.mileage"><span class="icon">📏</span><span>{{ item.mileage }} km</span></div>
            <div class="info-item" v-if="item.cost"><span class="icon">💰</span><span>{{ formatPrice(item.cost) }}</span></div>
            <div class="info-item" v-if="item.garage"><span class="icon">🏢</span><span>{{ item.garage?.name || item.garage }}</span></div>
          </div>
          <div class="item-footer">
            <span class="badge" :class="getStatusClass(item.status)">{{ getStatusLabel(item.status) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🔧</div>
        <h3>Aucun entretien</h3>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier' : 'Nouvel entretien'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group"><label>Véhicule *</label><input v-model="form.vehicle_id" type="text" required placeholder="ID du véhicule"></div>
          <div class="form-group"><label>Type *</label><input v-model="form.type" type="text" required placeholder="Révision"></div>
          <div class="form-row">
            <div class="form-group"><label>Date prévue *</label><input v-model="form.scheduled_date" type="date" required></div>
            <div class="form-group"><label>Kilométrage</label><input v-model="form.mileage" type="number"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Coût (€)</label><input v-model="form.cost" type="number" step="0.01"></div>
            <div class="form-group">
              <label>Statut</label>
              <select v-model="form.status">
                <option value="scheduled">Programmé</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Description</label><textarea v-model="form.description" rows="3"></textarea></div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer" size="small">
        <p>Supprimer cet entretien ?</p>
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
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Modal from '@/components/common/Modal.vue'
import apiService from '@/services/api.service'

const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const itemToDelete = ref(null)
const form = ref({ vehicle_id: '', type: '', scheduled_date: '', mileage: 0, cost: 0, status: 'scheduled', description: '' })

onMounted(() => loadItems())

const loadItems = async () => {
  try {
    loading.value = true
    const response = await apiService.getVehicleMaintenances()
    items.value = response.data || []
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR')
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getStatusClass = (status) => {
  const classes = {
    'scheduled': 'badge-warning',
    'in_progress': 'badge-info',
    'completed': 'badge-success',
    'cancelled': 'badge-danger'
  }
  return classes[status] || 'badge-secondary'
}

const getStatusLabel = (status) => {
  const labels = {
    'scheduled': 'Programmé',
    'in_progress': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé'
  }
  return labels[status] || status
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = { vehicle_id: '', type: '', scheduled_date: '', mileage: 0, cost: 0, status: 'scheduled', description: '' }
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
      await apiService.updateVehicleMaintenance(form.value.id, form.value)
    } else {
      await apiService.createVehicleMaintenance(form.value)
    }
    await loadItems()
    showModal.value = false
  } catch (error) {
    console.error('Error:', error)
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
    await apiService.deleteVehicleMaintenance(itemToDelete.value.id)
    await loadItems()
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.badge-info {
  background: #bfdbfe;
  color: #1e40af;
}

.badge-secondary {
  background: #e5e7eb;
  color: #374151;
}
</style>

