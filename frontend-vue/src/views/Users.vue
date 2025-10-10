<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <span class="icon">➕</span>
        Nouvel utilisateur
      </button>
    </template>

    <div class="users-page">
      <!-- Loading -->
      <LoadingSpinner v-if="loading && !users.length" text="Chargement des utilisateurs..." />

      <!-- Users List -->
      <div v-else-if="users.length > 0" class="users-grid">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-card"
        >
          <div class="user-header">
            <div class="user-avatar">
              {{ getUserInitials(user) }}
            </div>
            <div class="user-actions">
              <button @click="openEditModal(user)" class="btn-icon" title="Modifier">
                ✏️
              </button>
              <button @click="confirmDelete(user)" class="btn-icon btn-danger" title="Supprimer">
                ×
              </button>
            </div>
          </div>

          <div class="user-info">
            <h3>{{ user.first_name }} {{ user.last_name }}</h3>
            
            <div class="info-items">
              <div class="info-item">
                <span class="icon">✉️</span>
                <span>{{ user.email }}</span>
              </div>
              <div class="info-item" v-if="user.username">
                <span class="icon">👤</span>
                <span>{{ user.username }}</span>
              </div>
              <div class="info-item" v-if="user.phone">
                <span class="icon">📞</span>
                <span>{{ user.phone }}</span>
              </div>
            </div>
          </div>

          <div class="user-footer">
            <div class="roles">
              <span
                v-for="role in getUserRoles(user)"
                :key="role"
                class="role-badge"
                :class="getRoleClass(role)"
              >
                {{ getRoleLabel(role) }}
              </span>
            </div>
            <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-inactive'">
              {{ user.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Aucun utilisateur</h3>
        <p>Commencez par créer votre premier utilisateur</p>
        <button @click="openCreateModal" class="btn-primary">
          <span class="icon">➕</span>
          Créer un utilisateur
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <!-- Create/Edit Modal -->
      <Modal
        v-model="showModal"
        :title="isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'"
        size="large"
      >
        <form @submit.prevent="handleSubmit" class="user-form">
          <div class="form-row">
            <div class="form-group">
              <label for="first_name">Prénom *</label>
              <input
                id="first_name"
                v-model="form.first_name"
                type="text"
                required
                placeholder="Jean"
              >
            </div>

            <div class="form-group">
              <label for="last_name">Nom *</label>
              <input
                id="last_name"
                v-model="form.last_name"
                type="text"
                required
                placeholder="Dupont"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                placeholder="jean.dupont@example.com"
              >
            </div>

            <div class="form-group">
              <label for="username">Nom d'utilisateur</label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                placeholder="jdupont"
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
              <label for="user_type">Type d'utilisateur</label>
              <select id="user_type" v-model="form.user_type">
                <option value="admin">Administrateur</option>
                <option value="manager">Manager</option>
                <option value="user">Utilisateur</option>
              </select>
            </div>
          </div>

          <div class="form-group" v-if="!isEditing">
            <label for="password">Mot de passe *</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              :required="!isEditing"
              placeholder="••••••••"
            >
          </div>

          <div class="form-group">
            <label>Rôles</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_USER"
                >
                <span>Utilisateur</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_ADMIN"
                >
                <span>Administrateur</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_SUPER_ADMIN"
                >
                <span>Super Administrateur</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="form.is_active"
                type="checkbox"
              >
              <span>Utilisateur actif</span>
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
        <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong> ?</p>
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Modal from '@/components/common/Modal.vue'
import apiService from '@/services/api.service'

const authStore = useAuthStore()
const { success, error } = useNotification()

const users = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const loading = ref(false)
const error = ref(null)
const userToDelete = ref(null)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  phone: '',
  user_type: 'user',
  password: '',
  roles: ['ROLE_USER'],
  is_active: true
})

onMounted(async () => {
  await loadUsers()
})

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await apiService.getUsers()
    users.value = response.users || response.data || []
  } catch (err) {
    console.error('Error loading users:', err)
    error.value = err.response?.data?.message || err.message
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    user_type: 'user',
    password: '',
    roles: ['ROLE_USER'],
    is_active: true
  }
  showModal.value = true
}

const openEditModal = (user) => {
  isEditing.value = true
  form.value = {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    username: user.username || '',
    phone: user.phone || '',
    user_type: user.user_type || 'user',
    roles: user.roles || ['ROLE_USER'],
    is_active: user.is_active !== false
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    if (isEditing.value) {
      const response = await apiService.updateUser(form.value.id, form.value)
      const index = users.value.findIndex(u => u.id === form.value.id)
      if (index !== -1) {
        users.value[index] = response.user || response.data
      }
      success('Utilisateur modifié avec succès')
    } else {
      const response = await apiService.createUser(form.value)
      users.value.unshift(response.user || response.data)
      success('Utilisateur créé avec succès')
    }

    showModal.value = false
  } catch (err) {
    console.error('Error saving user:', err)
    error('Erreur lors de l\'enregistrement de l\'utilisateur')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const handleDelete = async () => {
  try {
    submitting.value = true
    await apiService.deleteUser(userToDelete.value.id)
    users.value = users.value.filter(u => u.id !== userToDelete.value.id)
    success('Utilisateur supprimé avec succès')
    showDeleteModal.value = false
    userToDelete.value = null
  } catch (err) {
    console.error('Error deleting user:', err)
    error('Erreur lors de la suppression de l\'utilisateur')
  } finally {
    submitting.value = false
  }
}

const getUserInitials = (user) => {
  const first = user.first_name?.charAt(0) || ''
  const last = user.last_name?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
}

const getUserRoles = (user) => {
  return user.roles || []
}

const getRoleClass = (role) => {
  const classes = {
    'ROLE_SUPER_ADMIN': 'role-super-admin',
    'ROLE_ADMIN': 'role-admin',
    'ROLE_MANAGER': 'role-manager',
    'ROLE_USER': 'role-user'
  }
  return classes[role] || 'role-user'
}

const getRoleLabel = (role) => {
  const labels = {
    'ROLE_SUPER_ADMIN': 'Super Admin',
    'ROLE_ADMIN': 'Admin',
    'ROLE_MANAGER': 'Manager',
    'ROLE_USER': 'Utilisateur'
  }
  return labels[role] || role
}
</script>

<style scoped lang="scss">
.users-page {
}

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

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #dc2626;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.user-card {
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

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  .user-avatar {
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
  }
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;

  &:hover {
    background: #e5e5e5;
  }

  &.btn-danger:hover {
    background: #fee;
  }
}

.user-info {
  margin-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    color: #333;
    margin-bottom: 1rem;
    font-weight: 600;
  }
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.user-footer {
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.roles {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;

  &.role-super-admin {
    background: #fecaca;
    color: #991b1b;
  }

  &.role-admin {
    background: #ddd6fe;
    color: #5b21b6;
  }

  &.role-manager {
    background: #bfdbfe;
    color: #1e40af;
  }

  &.role-user {
    background: #d1fae5;
    color: #065f46;
  }
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

.user-form {
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
  input[type="password"],
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

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  color: #ef4444;
  font-weight: 600;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
