<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvel utilisateur
      </button>
    </template>

    <div class="users-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher un utilisateur (nom, email)..."
        @search="handleSearch"
      />

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Statut</label>
          <select v-model="filters.status" @change="loadUsers">
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading && !users.length" text="Chargement des utilisateurs..." />

      <!-- Users List -->
      <div v-else-if="users.length > 0">
        <div class="users-grid">
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
              <button @click="openEditModal(user)" class="btn-icon btn-edit" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="confirmDelete(user)" class="btn-icon btn-delete" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="user-info">
            <h3>{{ user.firstName }} {{ user.lastName }}</h3>
            
            <div class="info-items">
              <div class="info-item">
                <i class="fas fa-envelope"></i>
                <span>{{ user.email }}</span>
              </div>
              <div class="info-item" v-if="user.username">
                <i class="fas fa-user"></i>
                <span>{{ user.username }}</span>
              </div>
              <div class="info-item" v-if="user.phone">
                <i class="fas fa-phone"></i>
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
            <span class="badge" :class="user.isActive ? 'badge-success' : 'badge-inactive'">
              {{ user.isActive ? 'Actif' : 'Inactif' }}
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
        <div class="empty-icon">
          <i class="fas fa-users"></i>
        </div>
        <h3>Aucun utilisateur</h3>
        <p>Commencez par créer votre premier utilisateur</p>
        <button @click="openCreateModal" class="btn-primary">
          <i class="fas fa-plus"></i>
          Créer un utilisateur
        </button>
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
                v-model="form.firstName"
                type="text"
                required
                placeholder="Jean"
              >
            </div>

            <div class="form-group">
              <label for="last_name">Nom *</label>
              <input
                id="last_name"
                v-model="form.lastName"
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
                  value="ROLE_SUPER_ADMIN"
                >
                <span>Super Admin</span>
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
                  value="ROLE_GESTIONNAIRE"
                >
                <span>Gestionnaire</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_SECRETAIRE"
                >
                <span>Secrétaire</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_EXPERT"
                >
                <span>Expert</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_REPARATEUR"
                >
                <span>Réparateur</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_CONDUCTEUR"
                >
                <span>Conducteur</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="form.roles"
                  type="checkbox"
                  value="ROLE_VERIFICATEUR"
                >
                <span>Vérificateur</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="form.isActive"
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
        <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete?.firstName }} {{ userToDelete?.lastName }}</strong> ?</p>
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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
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
const userToDelete = ref(null)

const searchQuery = ref('')
const filters = ref({
  status: 'all'
})

const pagination = ref({
  total: 0,
  page: 1,
  limit: 12
})

const currentPage = computed(() => pagination.value.page)
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  phone: '',
  password: '',
  roles: ['ROLE_USER'],
  isActive: true
})

onMounted(async () => {
  await loadUsers()
})

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (filters.value.status !== 'all') {
      params.status = filters.value.status
    }

    const response = await apiService.getUsers(params)
    
    if (response.success) {
      users.value = response.data || []
      pagination.value.total = response.pagination?.total || response.data?.length || 0
    } else {
      throw new Error(response.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading users:', err)
    const errorMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement des utilisateurs'
    error(errorMsg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadUsers()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadUsers()
}

const getUserTypeFromRoles = (roles) => {
  // Détermine le userType basé sur le rôle le plus élevé
  if (roles.includes('ROLE_SUPER_ADMIN')) return 'super_admin'
  if (roles.includes('ROLE_ADMIN')) return 'admin'
  if (roles.includes('ROLE_GESTIONNAIRE')) return 'gestionnaire'
  if (roles.includes('ROLE_SECRETAIRE')) return 'secretaire'
  if (roles.includes('ROLE_EXPERT')) return 'expert'
  if (roles.includes('ROLE_REPARATEUR')) return 'reparateur'
  if (roles.includes('ROLE_CONDUCTEUR')) return 'conducteur'
  if (roles.includes('ROLE_VERIFICATEUR')) return 'verificateur'
  return 'user'
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    roles: ['ROLE_USER'],
    isActive: true
  }
  showModal.value = true
}

const openEditModal = (user) => {
  isEditing.value = true
  form.value = {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    username: user.username || '',
    phone: user.phone || '',
    roles: user.roles || ['ROLE_USER'],
    isActive: user.isActive !== false
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    // Calculer automatiquement le userType à partir des rôles
    const userType = getUserTypeFromRoles(form.value.roles)
    
    const data = {
      ...form.value,
      userType
    }

    if (isEditing.value) {
      await apiService.updateUser(form.value.id, data)
      success('Utilisateur modifié avec succès')
    } else {
      await apiService.createUser(data)
      success('Utilisateur créé avec succès')
    }

    showModal.value = false
    await loadUsers()
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
    success('Utilisateur supprimé avec succès')
    showDeleteModal.value = false
    userToDelete.value = null
    await loadUsers()
  } catch (err) {
    console.error('Error deleting user:', err)
    error('Erreur lors de la suppression de l\'utilisateur')
  } finally {
    submitting.value = false
  }
}

const getUserInitials = (user) => {
  const first = user.firstName?.charAt(0) || ''
  const last = user.lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
}

const getUserRoles = (user) => {
  return user.roles || []
}

const getRoleClass = (role) => {
  const classes = {
    'ROLE_SUPER_ADMIN': 'role-super-admin',
    'ROLE_ADMIN': 'role-admin',
    'ROLE_GESTIONNAIRE': 'role-manager',
    'ROLE_SECRETAIRE': 'role-secretaire',
    'ROLE_EXPERT': 'role-expert',
    'ROLE_REPARATEUR': 'role-reparateur',
    'ROLE_CONDUCTEUR': 'role-conducteur',
    'ROLE_VERIFICATEUR': 'role-verificateur',
    'ROLE_MANAGER': 'role-manager',
    'ROLE_USER': 'role-user'
  }
  return classes[role] || 'role-user'
}

const getRoleLabel = (role) => {
  const labels = {
    'ROLE_SUPER_ADMIN': 'Super Admin',
    'ROLE_ADMIN': 'Administrateur',
    'ROLE_GESTIONNAIRE': 'Gestionnaire',
    'ROLE_SECRETAIRE': 'Secrétaire',
    'ROLE_EXPERT': 'Expert',
    'ROLE_REPARATEUR': 'Réparateur',
    'ROLE_CONDUCTEUR': 'Conducteur',
    'ROLE_VERIFICATEUR': 'Vérificateur',
    'ROLE_MANAGER': 'Manager',
    'ROLE_USER': 'Utilisateur'
  }
  return labels[role] || role.replace('ROLE_', '').replace('_', ' ')
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

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

  &.role-secretaire {
    background: #fde68a;
    color: #92400e;
  }

  &.role-expert {
    background: #fcd34d;
    color: #78350f;
  }

  &.role-reparateur {
    background: #fdba74;
    color: #9a3412;
  }

  &.role-conducteur {
    background: #a5f3fc;
    color: #155e75;
  }

  &.role-verificateur {
    background: #c7d2fe;
    color: #3730a3;
  }

  &.role-user {
    background: #d1fae5;
    color: #065f46;
  }
}

// Styles spécifiques aux checkboxes de rôles
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

// Media queries spécifiques
@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }
}
</style>
