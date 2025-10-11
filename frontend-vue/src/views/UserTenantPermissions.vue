<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvelle affectation
      </button>
    </template>

    <div class="permissions-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher (utilisateur, tenant)..."
        @search="handleSearch"
      />

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Statut</label>
          <select v-model="filters.status" @change="loadPermissions">
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Type</label>
          <select v-model="filters.isPrimary" @change="loadPermissions">
            <option value="all">Tous</option>
            <option value="true">Tenants principaux</option>
            <option value="false">Tenants secondaires</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading && !permissions.length" text="Chargement des affectations..." />

      <!-- Permissions List -->
      <div v-else-if="permissions.length > 0">
        <div class="permissions-grid">
          <div
            v-for="permission in permissions"
            :key="permission.id"
            class="permission-card"
            :class="{ 'primary-tenant': permission.isPrimary }"
          >
            <div class="permission-header">
              <div class="header-left">
                <div class="user-info">
                  <i class="fas fa-user-circle"></i>
                  <div>
                    <h3>{{ permission.user?.firstName }} {{ permission.user?.lastName }}</h3>
                    <span class="email">{{ permission.user?.email }}</span>
                  </div>
                </div>
                <div class="tenant-info">
                  <i class="fas fa-building"></i>
                  <span>{{ permission.tenant?.name }}</span>
                </div>
              </div>
              <div class="permission-actions">
                <button 
                  @click="togglePrimary(permission)" 
                  class="btn-icon"
                  :class="{ 'btn-primary-active': permission.isPrimary }"
                  :title="permission.isPrimary ? 'Tenant principal' : 'Définir comme principal'"
                >
                  <i class="fas fa-star"></i>
                </button>
                <button 
                  @click="toggleActive(permission)" 
                  class="btn-icon"
                  :class="permission.isActive ? 'btn-success' : 'btn-secondary'"
                  :title="permission.isActive ? 'Actif' : 'Inactif'"
                >
                  <i :class="permission.isActive ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                </button>
                <button @click="openEditModal(permission)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(permission)" class="btn-icon btn-delete" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="permission-details">
              <div class="badges-container">
                <span v-if="permission.isPrimary" class="badge badge-primary">
                  <i class="fas fa-star"></i> Principal
                </span>
                <span class="badge" :class="permission.isActive ? 'badge-success' : 'badge-inactive'">
                  {{ permission.isActive ? '✓ Actif' : '✗ Inactif' }}
                </span>
              </div>

              <div v-if="permission.permissions && permission.permissions.length > 0" class="permissions-list">
                <div class="permissions-header">
                  <i class="fas fa-key"></i>
                  <strong>{{ permission.permissions.length }} permission(s)</strong>
                </div>
                <div class="permissions-badges">
                  <span 
                    v-for="perm in permission.permissions.slice(0, 5)" 
                    :key="perm"
                    class="perm-badge"
                    :title="perm"
                  >
                    {{ formatPermission(perm) }}
                  </span>
                  <span v-if="permission.permissions.length > 5" class="perm-badge more">
                    +{{ permission.permissions.length - 5 }}
                  </span>
                </div>
              </div>

              <div v-if="permission.notes" class="notes">
                <i class="fas fa-sticky-note"></i>
                <p>{{ permission.notes }}</p>
              </div>

              <div class="meta-info">
                <span class="meta-item">
                  <i class="fas fa-calendar"></i>
                  Affecté le {{ formatDate(permission.assignedAt) }}
                </span>
                <span v-if="permission.assignedBy" class="meta-item">
                  <i class="fas fa-user"></i>
                  Par {{ permission.assignedBy.firstName }} {{ permission.assignedBy.lastName }}
                </span>
              </div>
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
          <i class="fas fa-user-shield"></i>
        </div>
        <h3>Aucune affectation</h3>
        <p>Commencez par affecter un utilisateur à un tenant</p>
        <button @click="openCreateModal" class="btn-primary">
          <i class="fas fa-plus"></i>
          Créer une affectation
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>

      <!-- Create/Edit Modal -->
      <Modal
        v-model="showModal"
        :title="isEditing ? 'Modifier l\'affectation' : 'Nouvelle affectation'"
        size="xlarge"
      >
        <form @submit.prevent="handleSubmit" class="permission-form" id="permissionForm">
          <div class="form-row">
            <div class="form-group full-width">
              <UserSelector
                v-model="form.userId"
                label="Utilisateur"
                :required="true"
                statusFilter="active"
                @change="handleUserChange"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <TenantSelector
                v-model="form.tenantId"
                label="Tenant"
                :required="true"
                statusFilter="active"
                @change="handleTenantChange"
              />
            </div>
          </div>

          <div class="form-section permissions-section">
            <PermissionManager
              v-model="form.permissions"
              label="Permissions"
            />
          </div>

          <div class="form-section options-section">
            <h4>Options</h4>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isPrimary" />
                <span>Tenant principal</span>
                <small>L'utilisateur sera automatiquement redirigé vers ce tenant après connexion</small>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isActive" />
                <span>Affectation active</span>
                <small>L'utilisateur pourra accéder à ce tenant</small>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              placeholder="Notes ou commentaires sur cette affectation"
            ></textarea>
          </div>
        </form>

        <template #footer>
          <button @click="closeModal" class="btn-secondary">Annuler</button>
          <button form="permissionForm" type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}
          </button>
        </template>
      </Modal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import UserSelector from '@/components/common/UserSelector.vue'
import TenantSelector from '@/components/common/TenantSelector.vue'
import PermissionManager from '@/components/common/PermissionManager.vue'
import apiService from '@/services/api.service'

const { success, error: showError, warning, info } = useNotification()

const permissions = ref([])
const loading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)

const searchQuery = ref('')
const filters = ref({
  status: 'all',
  isPrimary: 'all'
})

const pagination = ref({
  total: 0,
  page: 1,
  limit: 12
})

const form = ref({
  userId: null,
  tenantId: null,
  permissions: [],
  isPrimary: false,
  isActive: true,
  notes: ''
})

const currentPage = computed(() => pagination.value.page)
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

onMounted(async () => {
  await loadPermissions()
})

const loadPermissions = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (filters.value.status !== 'all') {
      params.isActive = filters.value.status === 'active'
    }

    if (filters.value.isPrimary !== 'all') {
      params.isPrimary = filters.value.isPrimary === 'true'
    }

    const result = await apiService.getUserTenantPermissions(params)
    
    if (result.success) {
      permissions.value = result.data || []
      pagination.value.total = result.pagination?.total || result.data?.length || 0
    } else {
      throw new Error(result.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading permissions:', err)
    const errMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    showError(errMsg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadPermissions()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadPermissions()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatPermission = (perm) => {
  // Extraire la partie lisible de la permission
  const parts = perm.split(':')
  if (parts.length === 2) {
    const module = parts[0]
    const action = parts[1]
    return `${module}:${action}`
  }
  return perm
}

const handleUserChange = (user) => {
  // Optionnel : faire quelque chose quand l'utilisateur change
  console.log('User selected:', user)
}

const handleTenantChange = (tenant) => {
  // Optionnel : faire quelque chose quand le tenant change
  console.log('Tenant selected:', tenant)
}

const toggleActive = async (permission) => {
  try {
    const newStatus = !permission.isActive
    const result = await apiService.updateUserTenantPermission(permission.id, {
      isActive: newStatus
    })

    if (result.success) {
      permission.isActive = newStatus
      success(newStatus ? 'Affectation activée' : 'Affectation désactivée')
    } else {
      throw new Error(result.message || 'Erreur lors de la modification')
    }
  } catch (err) {
    console.error('Error toggling active status:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de la modification')
  }
}

const togglePrimary = async (permission) => {
  if (permission.isPrimary) {
    info('Ce tenant est déjà principal. Utilisez le formulaire d\'édition pour changer.')
    return
  }

  if (!confirm(
    `Définir "${permission.tenant?.name}" comme tenant principal pour ${permission.user?.firstName} ${permission.user?.lastName} ?\n\n` +
    `Cela remplacera le tenant principal actuel.`
  )) {
    return
  }

  try {
    const result = await apiService.updateUserTenantPermission(permission.id, {
      isPrimary: true
    })

    if (result.success) {
      // Rafraîchir la liste pour mettre à jour tous les statuts
      await loadPermissions()
      success('Tenant principal défini avec succès')
    } else {
      throw new Error(result.message || 'Erreur lors de la modification')
    }
  } catch (err) {
    console.error('Error setting primary tenant:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de la modification')
  }
}

const openCreateModal = () => {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

const openEditModal = (permission) => {
  form.value = {
    id: permission.id,
    userId: permission.user?.id || null,
    tenantId: permission.tenant?.id || null,
    permissions: permission.permissions || [],
    isPrimary: permission.isPrimary,
    isActive: permission.isActive,
    notes: permission.notes || ''
  }
  isEditing.value = true
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  setTimeout(() => {
    resetForm()
    isEditing.value = false
  }, 300)
}

const resetForm = () => {
  form.value = {
    userId: null,
    tenantId: null,
    permissions: [],
    isPrimary: false,
    isActive: true,
    notes: ''
  }
}

const handleSubmit = async () => {
  // Validation
  if (!form.value.userId) {
    showError('Veuillez sélectionner un utilisateur')
    return
  }

  if (!form.value.tenantId) {
    showError('Veuillez sélectionner un tenant')
    return
  }

  saving.value = true
  try {
    const data = {
      userId: form.value.userId,
      tenantId: form.value.tenantId,
      permissions: form.value.permissions || [],
      isPrimary: form.value.isPrimary,
      isActive: form.value.isActive,
      notes: form.value.notes || null
    }

    let result
    if (isEditing.value) {
      result = await apiService.updateUserTenantPermission(form.value.id, data)
    } else {
      result = await apiService.createUserTenantPermission(data)
    }

    if (result.success) {
      success(isEditing.value ? 'Affectation modifiée avec succès' : 'Affectation créée avec succès')
      closeModal()
      await loadPermissions()
    } else {
      throw new Error(result.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving permission:', err)
    const errMsg = err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement'
    showError(errMsg)
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (permission) => {
  const userName = `${permission.user?.firstName} ${permission.user?.lastName}`
  const tenantName = permission.tenant?.name

  if (!confirm(
    `Êtes-vous sûr de vouloir supprimer l'affectation ?\n\n` +
    `Utilisateur : ${userName}\n` +
    `Tenant : ${tenantName}\n\n` +
    `L'utilisateur perdra tous les accès à ce tenant.\n` +
    `Cette action est irréversible.`
  )) {
    return
  }

  try {
    const result = await apiService.deleteUserTenantPermission(permission.id)
    
    if (result.success) {
      success('Affectation supprimée avec succès')
      await loadPermissions()
    } else {
      throw new Error(result.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting permission:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.permissions-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 600;
      font-size: 0.9rem;
      color: #4b5563;
    }

    select {
      padding: 0.625rem;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 0.95rem;
      min-width: 180px;
      transition: all 0.3s;

      &:focus {
        outline: none;
        border-color: #2563eb;
      }
    }
  }
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.permission-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  &.primary-tenant {
    border-color: #fbbf24;
    background: linear-gradient(to bottom, #fffbeb, white);
  }

  .permission-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f3f4f6;

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex: 1;

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          font-size: 2rem;
          color: #3b82f6;
        }

        div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #1f2937;
            font-weight: 700;
          }

          .email {
            font-size: 0.85rem;
            color: #6b7280;
          }
        }
      }

      .tenant-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: #f3f4f6;
        border-radius: 6px;
        width: fit-content;

        i {
          color: #10b981;
        }

        span {
          font-weight: 600;
          color: #1f2937;
        }
      }
    }

    .permission-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      .btn-primary-active {
        background: #fbbf24;
        color: white;

        &:hover {
          background: #f59e0b;
        }
      }

      .btn-success {
        color: #10b981;
      }
    }
  }

  .permission-details {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;

    .badges-container {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge-primary {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fbbf24;

      i {
        color: #fbbf24;
      }
    }

    .permissions-list {
      padding: 0.875rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 2px solid #e5e7eb;

      .permissions-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        color: #1f2937;

        i {
          color: #3b82f6;
        }
      }

      .permissions-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        .perm-badge {
          padding: 0.25rem 0.625rem;
          background: white;
          color: #3b82f6;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          font-size: 0.75rem;
          font-family: monospace;
          font-weight: 600;

          &.more {
            background: #e5e7eb;
            color: #6b7280;
            border-color: #d1d5db;
          }
        }
      }
    }

    .notes {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 6px;
      border-left: 3px solid #fbbf24;

      i {
        color: #f59e0b;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: #78350f;
        line-height: 1.5;
        font-style: italic;
      }
    }

    .meta-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #9ca3af;

        i {
          font-size: 0.75rem;
          width: 14px;
        }
      }
    }
  }
}

.permission-form {
  .form-section {
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid #e5e7eb;

    &.permissions-section {
      padding: 0;
      background: transparent;
      border: none;
    }

    &.options-section {
      h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: #1f2937;
        font-weight: 600;
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .checkbox-label {
          small {
            display: block;
            margin-top: 0.25rem;
            color: #6b7280;
            font-size: 0.8rem;
          }
        }
      }
    }
  }
}

.badge-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

@media (max-width: 768px) {
  .permissions-grid {
    grid-template-columns: 1fr;
  }

  .permission-card .permission-header {
    flex-direction: column;
    gap: 1rem;

    .permission-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
}
</style>

