<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouveau plein</button>
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
            <div class="info-item" v-if="item.date"><span class="icon">📅</span><span>{{ formatDate(item.date) }}</span></div>
            <div class="info-item" v-if="item.quantity"><span class="icon">⛽</span><span>{{ item.quantity }} L</span></div>
            <div class="info-item" v-if="item.price_per_liter"><span class="icon">💰</span><span>{{ formatPrice(item.price_per_liter) }}/L</span></div>
            <div class="info-item" v-if="item.total_cost"><span class="icon">💵</span><span>Total: {{ formatPrice(item.total_cost) }}</span></div>
            <div class="info-item" v-if="item.mileage"><span class="icon">📏</span><span>{{ item.mileage }} km</span></div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">⛽</div>
        <h3>Aucun plein enregistré</h3>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier' : 'Nouveau plein'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group"><label>Véhicule *</label><input v-model="form.vehicle_id" type="text" required placeholder="ID du véhicule"></div>
          <div class="form-group"><label>Date *</label><input v-model="form.date" type="date" required></div>
          <div class="form-row">
            <div class="form-group"><label>Quantité (L) *</label><input v-model="form.quantity" type="number" step="0.01" required></div>
            <div class="form-group"><label>Prix/L (€) *</label><input v-model="form.price_per_liter" type="number" step="0.01" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Coût total (€)</label><input v-model="form.total_cost" type="number" step="0.01"></div>
            <div class="form-group"><label>Kilométrage</label><input v-model="form.mileage" type="number"></div>
          </div>
          <div class="form-group"><label>Notes</label><textarea v-model="form.notes" rows="2"></textarea></div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer" size="small">
        <p>Supprimer cet enregistrement ?</p>
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
const form = ref({ vehicle_id: '', date: '', quantity: 0, price_per_liter: 0, total_cost: 0, mileage: 0, notes: '' })

onMounted(() => loadItems())

const loadItems = async () => {
  try {
    loading.value = true
    const response = await apiService.getVehicleFuelLogs()
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

const openCreateModal = () => {
  isEditing.value = false
  form.value = { vehicle_id: '', date: '', quantity: 0, price_per_liter: 0, total_cost: 0, mileage: 0, notes: '' }
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
      await apiService.updateVehicleFuelLog(form.value.id, form.value)
    } else {
      await apiService.createVehicleFuelLog(form.value)
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
    await apiService.deleteVehicleFuelLog(itemToDelete.value.id)
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
</style>

