<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouvelle assurance</button>
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
            <div class="info-item" v-if="item.insurance_company"><span class="icon">🏢</span><span>{{ item.insurance_company }}</span></div>
            <div class="info-item" v-if="item.policy_number"><span class="icon">📄</span><span>{{ item.policy_number }}</span></div>
            <div class="info-item" v-if="item.start_date"><span class="icon">📅</span><span>Du {{ formatDate(item.start_date) }}</span></div>
            <div class="info-item" v-if="item.end_date"><span class="icon">📅</span><span>Au {{ formatDate(item.end_date) }}</span></div>
            <div class="info-item" v-if="item.premium_amount"><span class="icon">💰</span><span>{{ formatPrice(item.premium_amount) }}</span></div>
          </div>
          <div class="item-footer">
            <span class="badge" :class="getStatusClass(item.end_date)">{{ getStatusLabel(item.end_date) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🛡️</div>
        <h3>Aucune assurance</h3>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier' : 'Nouvelle assurance'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group"><label>Véhicule *</label><input v-model="form.vehicle_id" type="text" required placeholder="ID du véhicule"></div>
          <div class="form-group"><label>Compagnie *</label><input v-model="form.insurance_company" type="text" required></div>
          <div class="form-group"><label>N° Police *</label><input v-model="form.policy_number" type="text" required></div>
          <div class="form-row">
            <div class="form-group"><label>Date début *</label><input v-model="form.start_date" type="date" required></div>
            <div class="form-group"><label>Date fin *</label><input v-model="form.end_date" type="date" required></div>
          </div>
          <div class="form-group"><label>Montant prime (€)</label><input v-model="form.premium_amount" type="number" step="0.01"></div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer" size="small">
        <p>Supprimer cette assurance ?</p>
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
const form = ref({ vehicle_id: '', insurance_company: '', policy_number: '', start_date: '', end_date: '', premium_amount: 0 })

onMounted(() => loadItems())

const loadItems = async () => {
  try {
    loading.value = true
    const response = await apiService.getVehicleInsurances()
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

const getStatusClass = (endDate) => {
  if (!endDate) return 'badge-success'
  const end = new Date(endDate)
  const now = new Date()
  const daysLeft = Math.floor((end - now) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'badge-danger'
  if (daysLeft < 30) return 'badge-warning'
  return 'badge-success'
}

const getStatusLabel = (endDate) => {
  if (!endDate) return 'Active'
  const end = new Date(endDate)
  const now = new Date()
  const daysLeft = Math.floor((end - now) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'Expirée'
  if (daysLeft < 30) return `Expire dans ${daysLeft}j`
  return 'Active'
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = { vehicle_id: '', insurance_company: '', policy_number: '', start_date: '', end_date: '', premium_amount: 0 }
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
      await apiService.updateVehicleInsurance(form.value.id, form.value)
    } else {
      await apiService.createVehicleInsurance(form.value)
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
    await apiService.deleteVehicleInsurance(itemToDelete.value.id)
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

