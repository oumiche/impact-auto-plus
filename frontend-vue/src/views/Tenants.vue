<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouveau tenant
      </button>
    </template>

    <div class="tenants-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher un tenant (nom, slug)..."
        @search="handleSearch"
      />

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Statut</label>
          <select v-model="filters.status" @change="loadTenants">
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading && !tenants.length" text="Chargement des tenants..." />

      <!-- Tenants List -->
      <div v-else-if="tenants.length > 0">
        <div class="tenants-grid">
          <div
            v-for="tenant in tenants"
            :key="tenant.id"
            class="tenant-card"
          >
            <div class="tenant-header">
              <div class="header-left">
                <img 
                  v-if="tenant.logoUrl" 
                  :src="getLogoUrl(tenant.logoUrl)" 
                  :alt="tenant.logoAltText || tenant.name"
                  class="tenant-logo"
                />
                <div v-else class="logo-placeholder">
                  <i class="fas fa-building"></i>
                </div>
                <div class="tenant-info">
                  <h3>{{ tenant.name }}</h3>
                  <code class="tenant-slug">{{ tenant.slug }}</code>
                </div>
              </div>
              <div class="tenant-actions">
                <button @click="openEditModal(tenant)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(tenant)" class="btn-icon btn-delete" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="tenant-details">
              <div v-if="tenant.description" class="description">
                <i class="fas fa-file-alt"></i>
                <p>{{ tenant.description }}</p>
              </div>

              <div class="status-badge">
                <span class="badge" :class="tenant.isActive ? 'badge-success' : 'badge-inactive'">
                  {{ tenant.isActive ? '✓ Actif' : '✗ Inactif' }}
                </span>
              </div>

              <div class="meta-info">
                <span class="meta-item">
                  <i class="fas fa-calendar"></i>
                  Créé le {{ formatDate(tenant.createdAt) }}
                </span>
                <span v-if="tenant.updatedAt" class="meta-item">
                  <i class="fas fa-clock"></i>
                  Modifié le {{ formatDate(tenant.updatedAt) }}
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
          <i class="fas fa-building"></i>
        </div>
        <h3>Aucun tenant</h3>
        <p>Commencez par créer votre premier tenant</p>
        <button @click="openCreateModal" class="btn-primary">
          <i class="fas fa-plus"></i>
          Créer un tenant
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
        :title="isEditing ? 'Modifier le tenant' : 'Nouveau tenant'"
        size="large"
      >
        <form @submit.prevent="handleSubmit" class="tenant-form" id="tenantForm">
          <div class="form-group">
            <label for="name">Nom du tenant <span class="required">*</span></label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Ex: Garage Impact Auto"
              required
              @input="handleNameChange"
            />
          </div>

          <div class="form-group">
            <label for="slug">Slug (URL) <span class="required">*</span></label>
            <div class="slug-input-group">
              <span class="slug-prefix">https://app.com/</span>
              <input
                id="slug"
                v-model="form.slug"
                type="text"
                placeholder="garage-impact-auto"
                required
                pattern="[a-z0-9\-]+"
                @input="validateSlug"
                :class="{ 'invalid': slugError }"
              />
            </div>
            <small class="form-hint">
              Généré automatiquement depuis le nom. Seuls les lettres minuscules, chiffres et tirets sont autorisés.
            </small>
            <small v-if="slugError" class="form-error">
              {{ slugError }}
            </small>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="4"
              placeholder="Description du tenant"
            ></textarea>
          </div>

          <div class="form-section logo-section">
            <h4>Logo du tenant</h4>
            <FileUploader
              v-model="form.logoUrl"
              label=""
              accept="image/*"
              acceptLabel="PNG, JPG, SVG, GIF"
              :maxSizeMB="2"
              @file="handleLogoFile"
            />
          </div>

          <div class="form-group" v-if="form.logoUrl">
            <label for="logoAltText">Texte alternatif du logo</label>
            <input
              id="logoAltText"
              v-model="form.logoAltText"
              type="text"
              placeholder="Ex: Logo Garage Impact Auto"
            />
            <small class="form-hint">
              Texte affiché si l'image ne peut pas être chargée (accessibilité)
            </small>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.isActive" />
              <span>Tenant actif</span>
            </label>
            <small class="form-hint warning" v-if="isEditing && !form.isActive">
              ⚠️ Attention : Désactiver ce tenant empêchera tous les utilisateurs associés d'y accéder.
            </small>
          </div>
        </form>

        <template #footer>
          <button @click="closeModal" class="btn-secondary">Annuler</button>
          <button 
            form="tenantForm"
            type="submit" 
            class="btn-primary" 
            :disabled="saving || !!slugError"
          >
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
import FileUploader from '@/components/common/FileUploader.vue'
import apiService from '@/services/api.service'

const { success, error: showError, warning } = useNotification()

const tenants = ref([])
const loading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const slugError = ref('')
const logoFile = ref(null)

const searchQuery = ref('')
const filters = ref({
  status: 'all'
})

const pagination = ref({
  total: 0,
  page: 1,
  limit: 12
})

const form = ref({
  name: '',
  slug: '',
  description: '',
  logoUrl: '',
  logoAltText: '',
  isActive: true
})

const currentPage = computed(() => pagination.value.page)
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

onMounted(async () => {
  await loadTenants()
})

const loadTenants = async () => {
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

    const result = await apiService.getTenants(params)
    
    if (result.success) {
      tenants.value = result.data || []
      pagination.value.total = result.pagination?.total || result.data?.length || 0
    } else {
      throw new Error(result.message || 'Erreur lors du chargement des tenants')
    }
  } catch (err) {
    console.error('Error loading tenants:', err)
    const errMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    showError(errMsg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadTenants()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadTenants()
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

const getLogoUrl = (logoUrl) => {
  if (!logoUrl) return ''
  // Si c'est déjà une URL complète (http/https) ou base64, la retourner telle quelle
  if (logoUrl.startsWith('http') || logoUrl.startsWith('data:')) {
    return logoUrl
  }
  // Sinon, préfixer avec l'URL du backend (sans /api)
  const apiUrl = import.meta.env.VITE_API_URL || 'https://iautobackend.zeddev01.com/api'
  const backendUrl = apiUrl.replace('/api', '')
  return backendUrl + logoUrl
}

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Retirer caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Remplacer tirets multiples
    .replace(/^-+|-+$/g, '') // Retirer tirets début/fin
}

const handleNameChange = () => {
  // Auto-générer le slug uniquement en création
  if (!isEditing.value) {
    form.value.slug = generateSlug(form.value.name)
    validateSlug()
  }
}

const validateSlug = () => {
  slugError.value = ''
  
  if (!form.value.slug) {
    slugError.value = 'Le slug est requis'
    return
  }

  // Validation format
  const slugPattern = /^[a-z0-9-]+$/
  if (!slugPattern.test(form.value.slug)) {
    slugError.value = 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'
    return
  }

  // Vérifier longueur
  if (form.value.slug.length < 3) {
    slugError.value = 'Le slug doit contenir au moins 3 caractères'
    return
  }

  if (form.value.slug.length > 60) {
    slugError.value = 'Le slug ne peut pas dépasser 60 caractères'
    return
  }
}

const handleLogoFile = (file) => {
  logoFile.value = file
}

const openCreateModal = () => {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

const openEditModal = (tenant) => {
  form.value = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    description: tenant.description || '',
    logoUrl: tenant.logoUrl ? getLogoUrl(tenant.logoUrl) : '',
    logoAltText: tenant.logoAltText || '',
    isActive: tenant.isActive
  }
  logoFile.value = null
  slugError.value = ''
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
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    logoAltText: '',
    isActive: true
  }
  logoFile.value = null
  slugError.value = ''
}

const handleSubmit = async () => {
  // Valider le slug
  validateSlug()
  if (slugError.value) {
    showError(slugError.value)
    return
  }

  saving.value = true
  try {
    let result
    
    // Préparer les données (sans le logo, on l'uploade séparément)
    const data = {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description || null,
      logoAltText: form.value.logoAltText || null,
      isActive: form.value.isActive
    }
    
    // Créer ou modifier le tenant
    if (isEditing.value) {
      result = await apiService.updateTenant(form.value.id, data)
    } else {
      result = await apiService.createTenant(data)
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors de l\'enregistrement')
    }
    
    // Si un nouveau logo a été sélectionné, l'uploader
    if (logoFile.value) {
      const tenantId = isEditing.value ? form.value.id : result.data.id
      try {
        const uploadResult = await apiService.uploadTenantLogo(tenantId, logoFile.value)
        if (!uploadResult.success) {
          warning('Tenant enregistré mais erreur lors de l\'upload du logo')
        }
      } catch (uploadErr) {
        console.error('Error uploading logo:', uploadErr)
        warning('Tenant enregistré mais erreur lors de l\'upload du logo')
      }
    }

    // Succès
    success(isEditing.value ? 'Tenant modifié avec succès' : 'Tenant créé avec succès')
    closeModal()
    await loadTenants()
  } catch (err) {
    console.error('Error saving tenant:', err)
    const errMsg = err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement'
    
    // Vérifier si c'est une erreur de slug unique
    if (errMsg.includes('slug') && errMsg.includes('unique')) {
      slugError.value = 'Ce slug est déjà utilisé par un autre tenant'
      showError('Ce slug est déjà utilisé. Veuillez en choisir un autre.')
    } else {
      showError(errMsg)
    }
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (tenant) => {
  if (!confirm(
    `Êtes-vous sûr de vouloir supprimer le tenant "${tenant.name}" ?\n\n` +
    `⚠️ ATTENTION : Cette action supprimera également :\n` +
    `- Toutes les données associées à ce tenant\n` +
    `- Les affectations utilisateur-tenant\n` +
    `- Les paramètres spécifiques\n\n` +
    `Cette action est IRRÉVERSIBLE !`
  )) {
    return
  }

  // Double confirmation pour sécurité
  const tenantName = prompt(
    `Pour confirmer, veuillez taper le nom exact du tenant :\n"${tenant.name}"`
  )

  if (tenantName !== tenant.name) {
    warning('Suppression annulée : le nom ne correspond pas')
    return
  }

  try {
    const result = await apiService.deleteTenant(tenant.id)
    
    if (result.success) {
      success('Tenant supprimé avec succès')
      await loadTenants()
    } else {
      throw new Error(result.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting tenant:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.tenants-page {
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
      min-width: 150px;
      transition: all 0.3s;

      &:focus {
        outline: none;
        border-color: #2563eb;
      }
    }
  }
}

.tenants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.tenant-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .tenant-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f3f4f6;

    .header-left {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex: 1;

      .tenant-logo {
        width: 60px;
        height: 60px;
        object-fit: contain;
        border-radius: 8px;
        background: #f9fafb;
        padding: 0.5rem;
      }

      .logo-placeholder {
        width: 60px;
        height: 60px;
        background: #f3f4f6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-size: 2rem;
      }

      .tenant-info {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;

        h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #1f2937;
          font-weight: 700;
        }

        .tenant-slug {
          font-family: monospace;
          font-size: 0.875rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          width: fit-content;
        }
      }
    }

    .tenant-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .tenant-details {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;

    .description {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;

      .icon {
        font-size: 1rem;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: #4b5563;
        line-height: 1.5;
      }
    }

    .status-badge {
      display: flex;
      justify-content: center;
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

.tenant-form {
  .slug-input-group {
    display: flex;
    align-items: center;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s;

    &:focus-within {
      border-color: #2563eb;
    }

    .slug-prefix {
      padding: 0.75rem;
      background: #f3f4f6;
      color: #6b7280;
      font-family: monospace;
      font-size: 0.9rem;
      border-right: 1px solid #e0e0e0;
    }

    input {
      flex: 1;
      padding: 0.75rem;
      border: none;
      font-family: monospace;

      &:focus {
        outline: none;
      }

      &.invalid {
        background: #fef2f2;
      }
    }
  }

  .form-error {
    color: #ef4444;
    font-weight: 600;
    display: block;
    margin-top: 0.25rem;
  }

  .form-section.logo-section {
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid #e5e7eb;

    h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #1f2937;
      font-weight: 600;
    }
  }

  .form-hint.warning {
    color: #f59e0b;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fffbeb;
    border-radius: 4px;
  }
}

.badge-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

@media (max-width: 768px) {
  .tenants-grid {
    grid-template-columns: 1fr;
  }

  .tenant-card .tenant-header .header-left {
    flex-direction: column;
    align-items: start;
  }
}
</style>

