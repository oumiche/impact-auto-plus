<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">➕ Nouveau conducteur</button>
    </template>
    <div class="page">
      <LoadingSpinner v-if="loading && !items.length" text="Chargement..." />
      <div v-else-if="items.length > 0" class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card">
          <div class="item-header">
            <div class="driver-avatar">{{ getInitials(item) }}</div>
            <div class="item-actions">
              <button @click="openEditModal(item)" class="btn-icon">✏️</button>
              <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">×</button>
            </div>
          </div>
          <div class="item-info">
            <h3>{{ item.first_name }} {{ item.last_name }}</h3>
            <div class="info-item" v-if="item.licence_number"><span class="icon">📜</span><span>Permis: {{ item.licence_number }}</span></div>
            <div class="info-item" v-if="item.licence_type"><span class="icon">🚗</span><span>Type: {{ item.licence_type }}</span></div>
            <div class="info-item" v-if="item.phone"><span class="icon">📞</span><span>{{ item.phone }}</span></div>
            <div class="info-item" v-if="item.email"><span class="icon">✉️</span><span>{{ item.email }}</span></div>
          </div>
          <div class="item-footer">
            <span class="badge" :class="item.is_active ? 'badge-success' : 'badge-inactive'">{{ item.is_active ? 'Actif' : 'Inactif' }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">👤</div>
        <h3>Aucun conducteur</h3>
        <button @click="openCreateModal" class="btn-primary">➕ Créer</button>
      </div>
      <Modal v-model="showModal" :title="isEditing ? 'Modifier' : 'Nouveau conducteur'" size="medium">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-row">
            <div class="form-group"><label>Prénom *</label><input v-model="form.first_name" type="text" required></div>
            <div class="form-group"><label>Nom *</label><input v-model="form.last_name" type="text" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>N° Permis *</label><input v-model="form.licence_number" type="text" required></div>
            <div class="form-group"><label>Type de permis</label><input v-model="form.licence_type" type="text" placeholder="B"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input v-model="form.email" type="email"></div>
            <div class="form-group"><label>Téléphone</label><input v-model="form.phone" type="tel"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Date de naissance</label><input v-model="form.birth_date" type="date"></div>
            <div class="form-group"><label>Date d'obtention</label><input v-model="form.licence_issue_date" type="date"></div>
          </div>
          <div class="form-group">
            <label class="checkbox-label"><input v-model="form.is_active" type="checkbox"><span>Actif</span></label>
          </div>
        </form>
        <template #footer>
          <button @click="showModal = false" class="btn-secondary">Annuler</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}</button>
        </template>
      </Modal>
      <Modal v-model="showDeleteModal" title="Confirmer" size="small">
        <p>Supprimer <strong>{{ itemToDelete?.first_name }} {{ itemToDelete?.last_name }}</strong> ?</p>
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
const form = ref({ first_name: '', last_name: '', licence_number: '', licence_type: '', email: '', phone: '', birth_date: '', licence_issue_date: '', is_active: true })

onMounted(() => loadItems())

const loadItems = async () => {
  try {
    loading.value = true
    const response = await apiService.getDrivers()
    items.value = response.data || []
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const getInitials = (item) => {
  const first = item.first_name?.charAt(0) || ''
  const last = item.last_name?.charAt(0) || ''
  return (first + last).toUpperCase()
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = { first_name: '', last_name: '', licence_number: '', licence_type: '', email: '', phone: '', birth_date: '', licence_issue_date: '', is_active: true }
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
      await apiService.updateDriver(form.value.id, form.value)
    } else {
      await apiService.createDriver(form.value)
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
    await apiService.deleteDriver(itemToDelete.value.id)
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
  width: 60px;
  height: 60px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
</style>

