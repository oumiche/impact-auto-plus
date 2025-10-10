<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouvelle assignation</button>
    </template>
    <div class="page">
      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      <div v-else-if="items.length > 0" class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card">
          <div class="item-header">
            <h3>{{ item.vehicle?.plate_number || 'Véhicule' }} → {{ item.driver?.first_name }} {{ item.driver?.last_name }}</h3>
            <div class="item-actions">
              <button @click="openEditModal(item)" class="btn-icon">✏️</button>
              <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
            </div>
          </div>
          <div class="item-info">
            <div class="info-item" v-if="item.start_date"><span class="icon">📅</span><span>Début: {{ formatDate(item.start_date) }}</span></div>
            <div class="info-item" v-if="item.end_date"><span class="icon">📅</span><span>Fin: {{ formatDate(item.end_date) }}</span></div>
            <div class="info-item" v-if="item.purpose"><span class="icon">📝</span><span>{{ item.purpose }}</span></div>
          </div>
          <div class="item-footer">
            <span class="badge" :class="item.is_active ? 'badge-success' : 'badge-inactive'">{{ item.is_active ? 'Active' : 'Terminée' }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>Aucune assignation</h3>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier' : 'Nouvelle assignation'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group"><label>Véhicule *</label><input v-model="form.vehicle_id" type="text" required placeholder="ID du véhicule"></div>
          <div class="form-group"><label>Conducteur *</label><input v-model="form.driver_id" type="text" required placeholder="ID du conducteur"></div>
          <div class="form-row">
            <div class="form-group"><label>Date début *</label><input v-model="form.start_date" type="date" required></div>
            <div class="form-group"><label>Date fin</label><input v-model="form.end_date" type="date"></div>
          </div>
          <div class="form-group"><label>Objectif</label><textarea v-model="form.purpose" rows="2"></textarea></div>
          <div class="form-group">
            <label class="checkbox-label"><input v-model="form.is_active" type="checkbox"><span>Active</span></label>
          </div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer" size="small">
        <p>Supprimer cette assignation ?</p>
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
const form = ref({ vehicle_id: '', driver_id: '', start_date: '', end_date: '', purpose: '', is_active: true })

onMounted(() => loadItems())

const loadItems = async () => {
  try {
    loading.value = true
    const response = await apiService.getVehicleAssignments()
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

const openCreateModal = () => {
  isEditing.value = false
  form.value = { vehicle_id: '', driver_id: '', start_date: '', end_date: '', purpose: '', is_active: true }
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
      await apiService.updateVehicleAssignment(form.value.id, form.value)
    } else {
      await apiService.createVehicleAssignment(form.value)
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
    await apiService.deleteVehicleAssignment(itemToDelete.value.id)
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

.driver-avatar {
  width: 50px;
  height: 50px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}
</style>

