<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouveau paramètre
      </button>
    </template>

    <div class="parameters-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher un paramètre (clé, catégorie, description)..."
        @search="handleSearch"
      />

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Catégorie</label>
          <select v-model="filters.category" @change="loadParameters">
            <option value="all">Toutes</option>
            <option value="general">Général</option>
            <option value="email">Email</option>
            <option value="currency">Devise</option>
            <option value="notification">Notifications</option>
            <option value="security">Sécurité</option>
            <option value="system">Système</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Type</label>
          <select v-model="filters.dataType" @change="loadParameters">
            <option value="all">Tous</option>
            <option value="string">Texte</option>
            <option value="integer">Entier</option>
            <option value="float">Décimal</option>
            <option value="boolean">Booléen</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Modifiable</label>
          <select v-model="filters.isEditable" @change="loadParameters">
            <option value="all">Tous</option>
            <option value="true">Modifiables</option>
            <option value="false">Système (protégés)</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading && !parameters.length" text="Chargement des paramètres..." />

      <!-- Parameters List -->
      <div v-else-if="parameters.length > 0">
        <!-- Group by category -->
        <div v-for="category in groupedCategories" :key="category.name" class="category-section">
          <div class="category-header">
            <h2>
              <i :class="`fas ${getCategoryIcon(category.name)}`" class="category-icon"></i>
              {{ category.label }}
            </h2>
            <span class="category-count">{{ category.parameters.length }} paramètre(s)</span>
          </div>

          <div class="parameters-grid">
            <div
              v-for="param in category.parameters"
              :key="param.id"
              class="parameter-card"
              :class="{ 'system-param': !param.isEditable }"
            >
              <div class="parameter-header">
                <div class="header-left">
                  <h3>{{ param.parameterKey }}</h3>
                  <div class="badges">
                    <span class="badge badge-type" :class="`type-${param.dataType}`">
                      {{ getDataTypeLabel(param.dataType) }}
                    </span>
                    <span v-if="!param.isEditable" class="badge badge-system">
                      <i class="fas fa-lock"></i> Système
                    </span>
                    <span v-if="param.isPublic" class="badge badge-public">
                      <i class="fas fa-globe"></i> Public
                    </span>
                  </div>
                </div>
                <div class="parameter-actions">
                  <button 
                    @click="openEditModal(param)" 
                    class="btn-icon btn-edit" 
                    :disabled="!param.isEditable"
                    :title="param.isEditable ? 'Modifier' : 'Paramètre système protégé'"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    @click="confirmDelete(param)" 
                    class="btn-icon btn-delete" 
                    :disabled="!param.isEditable"
                    :title="param.isEditable ? 'Supprimer' : 'Paramètre système protégé'"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div class="parameter-info">
                <div class="info-item value-display">
                  <span class="label">Valeur:</span>
                  <span class="value" :class="`value-${param.dataType}`">
                    {{ formatValue(param.value, param.dataType) }}
                  </span>
                </div>

                <div v-if="param.description" class="info-item description">
                  <i class="fas fa-file-alt"></i>
                  <span>{{ param.description }}</span>
                </div>

                <div v-if="param.defaultValue" class="info-item">
                  <i class="fas fa-undo"></i>
                  <span>Défaut: {{ param.defaultValue }}</span>
                </div>

                <div v-if="param.validationRules" class="info-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Validation: {{ formatValidationRules(param.validationRules) }}</span>
                </div>

                <div class="meta-info">
                  <span v-if="param.createdBy" class="meta-item">
                    <i class="fas fa-user"></i>
                    {{ param.createdBy.firstName }} {{ param.createdBy.lastName }}
                  </span>
                  <span v-if="param.updatedAt" class="meta-item">
                    <i class="fas fa-clock"></i>
                    {{ formatDate(param.updatedAt) }}
                  </span>
                </div>
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
          <i class="fas fa-cog"></i>
        </div>
        <h3>Aucun paramètre</h3>
        <p>Commencez par créer votre premier paramètre système</p>
        <button @click="openCreateModal" class="btn-primary">
          <i class="fas fa-plus"></i>
          Créer un paramètre
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
        :title="isEditing ? 'Modifier le paramètre' : 'Nouveau paramètre'"
        size="large"
      >
        <form @submit.prevent="handleSubmit" class="parameter-form" id="parameterForm">
          <div class="form-row">
            <div class="form-group">
              <label for="category">Catégorie <span class="required">*</span></label>
              <select
                id="category"
                v-model="form.category"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="general">Général</option>
                <option value="email">Email</option>
                <option value="currency">Devise</option>
                <option value="notification">Notifications</option>
                <option value="security">Sécurité</option>
                <option value="system">Système</option>
              </select>
            </div>

            <div class="form-group">
              <label for="parameterKey">Clé du paramètre <span class="required">*</span></label>
              <input
                id="parameterKey"
                v-model="form.parameterKey"
                type="text"
                placeholder="ex: smtp_host"
                required
                :disabled="isEditing"
              />
              <small v-if="isEditing" class="form-hint">La clé ne peut pas être modifiée</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dataType">Type de données <span class="required">*</span></label>
              <select
                id="dataType"
                v-model="form.dataType"
                required
                @change="handleDataTypeChange"
              >
                <option value="string">Texte (string)</option>
                <option value="integer">Entier (integer)</option>
                <option value="float">Décimal (float)</option>
                <option value="boolean">Booléen (boolean)</option>
                <option value="json">JSON (json)</option>
              </select>
            </div>
          </div>

          <!-- Dynamic Value Field -->
          <div class="form-group value-field">
            <label for="value">Valeur <span class="required">*</span></label>
            
            <!-- String -->
            <input
              v-if="form.dataType === 'string'"
              id="value"
              v-model="form.value"
              type="text"
              placeholder="Entrez une valeur"
              required
            />

            <!-- Integer -->
            <input
              v-else-if="form.dataType === 'integer'"
              id="value"
              v-model.number="form.value"
              type="number"
              step="1"
              placeholder="Entrez un nombre entier"
              required
            />

            <!-- Float -->
            <input
              v-else-if="form.dataType === 'float'"
              id="value"
              v-model.number="form.value"
              type="number"
              step="0.01"
              placeholder="Entrez un nombre décimal"
              required
            />

            <!-- Boolean -->
            <div v-else-if="form.dataType === 'boolean'" class="boolean-field">
              <label class="radio-label">
                <input type="radio" :value="true" v-model="form.value" />
                <span>Vrai (true)</span>
              </label>
              <label class="radio-label">
                <input type="radio" :value="false" v-model="form.value" />
                <span>Faux (false)</span>
              </label>
            </div>

            <!-- JSON -->
            <JsonEditor
              v-else-if="form.dataType === 'json'"
              v-model="form.value"
              :rows="12"
              :showPreview="true"
              @valid="jsonValid = true"
              @invalid="jsonValid = false"
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="Description du paramètre"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="defaultValue">Valeur par défaut</label>
            <input
              id="defaultValue"
              v-model="form.defaultValue"
              type="text"
              placeholder="Valeur par défaut (optionnelle)"
            />
          </div>

          <div class="form-section">
            <h4>Options</h4>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isEditable" />
                <span>Modifiable</span>
                <small>Décocher pour protéger le paramètre (système)</small>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isPublic" />
                <span>Public</span>
                <small>Accessible sans authentification</small>
              </label>
            </div>
          </div>
        </form>

        <template #footer>
          <button @click="closeModal" class="btn-secondary">Annuler</button>
          <button 
            form="parameterForm"
            type="submit" 
            class="btn-primary" 
            :disabled="saving || (form.dataType === 'json' && !jsonValid)"
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
import JsonEditor from '@/components/common/JsonEditor.vue'
import apiService from '@/services/api.service'

const { success, error: showError, warning } = useNotification()

const parameters = ref([])
const loading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const jsonValid = ref(true)

const searchQuery = ref('')
const filters = ref({
  category: 'all',
  dataType: 'all',
  isEditable: 'all'
})

const pagination = ref({
  total: 0,
  page: 1,
  limit: 50
})

const form = ref({
  category: '',
  parameterKey: '',
  value: '',
  dataType: 'string',
  description: '',
  isEditable: true,
  isPublic: false,
  validationRules: null,
  defaultValue: ''
})

const currentPage = computed(() => pagination.value.page)
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

const groupedCategories = computed(() => {
  const groups = {}
  
  parameters.value.forEach(param => {
    const cat = param.category || 'general'
    if (!groups[cat]) {
      groups[cat] = {
        name: cat,
        label: getCategoryLabel(cat),
        parameters: []
      }
    }
    groups[cat].parameters.push(param)
  })
  
  return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label))
})

onMounted(async () => {
  await loadParameters()
})

const loadParameters = async () => {
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

    if (filters.value.category !== 'all') {
      params.category = filters.value.category
    }

    if (filters.value.dataType !== 'all') {
      params.dataType = filters.value.dataType
    }

    if (filters.value.isEditable !== 'all') {
      params.isEditable = filters.value.isEditable === 'true'
    }

    const result = await apiService.getSystemParameters(params)
    
    if (result.success) {
      parameters.value = result.data || []
      pagination.value.total = result.pagination?.total || result.data?.length || 0
    } else {
      throw new Error(result.message || 'Erreur lors du chargement des paramètres')
    }
  } catch (err) {
    console.error('Error loading parameters:', err)
    const errMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    showError(errMsg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadParameters()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadParameters()
}

const getCategoryLabel = (category) => {
  const labels = {
    general: 'Général',
    email: 'Email',
    currency: 'Devise',
    notification: 'Notifications',
    security: 'Sécurité',
    system: 'Système'
  }
  return labels[category] || category
}

const getCategoryIcon = (category) => {
  const icons = {
    general: 'fa-cog',
    email: 'fa-envelope',
    currency: 'fa-dollar-sign',
    notification: 'fa-bell',
    security: 'fa-lock',
    system: 'fa-server'
  }
  return icons[category] || 'fa-clipboard'
}

const getDataTypeLabel = (type) => {
  const labels = {
    string: 'Texte',
    integer: 'Entier',
    float: 'Décimal',
    boolean: 'Booléen',
    json: 'JSON'
  }
  return labels[type] || type
}

const formatValue = (value, dataType) => {
  if (value === null || value === undefined) return '—'
  
  switch (dataType) {
    case 'boolean':
      return value ? 'Vrai' : 'Faux'
    case 'json':
      try {
        return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2)
      } catch {
        return value
      }
    default:
      return value
  }
}

const formatValidationRules = (rules) => {
  if (!rules) return ''
  if (typeof rules === 'string') {
    try {
      rules = JSON.parse(rules)
    } catch {
      return rules
    }
  }
  return JSON.stringify(rules)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleDataTypeChange = () => {
  // Reset value when data type changes
  switch (form.value.dataType) {
    case 'boolean':
      form.value.value = false
      break
    case 'integer':
      form.value.value = 0
      break
    case 'float':
      form.value.value = 0.0
      break
    case 'json':
      form.value.value = {}
      break
    default:
      form.value.value = ''
  }
}

const openCreateModal = () => {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

const openEditModal = (param) => {
  if (!param.isEditable) {
    warning('Ce paramètre système est protégé et ne peut pas être modifié')
    return
  }

  let value = param.value
  
  // Parse value based on dataType
  try {
    if (param.dataType === 'boolean') {
      value = param.value === 'true' || param.value === true || param.value === '1' || param.value === 1
    } else if (param.dataType === 'integer') {
      value = parseInt(param.value)
    } else if (param.dataType === 'float') {
      value = parseFloat(param.value)
    } else if (param.dataType === 'json' && typeof param.value === 'string') {
      value = JSON.parse(param.value)
    }
  } catch (err) {
    console.error('Error parsing value:', err)
  }

  form.value = {
    id: param.id,
    category: param.category,
    parameterKey: param.parameterKey,
    value: value,
    dataType: param.dataType,
    description: param.description || '',
    isEditable: param.isEditable,
    isPublic: param.isPublic,
    validationRules: param.validationRules,
    defaultValue: param.defaultValue || ''
  }
  
  jsonValid.value = true
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
    category: '',
    parameterKey: '',
    value: '',
    dataType: 'string',
    description: '',
    isEditable: true,
    isPublic: false,
    validationRules: null,
    defaultValue: ''
  }
  jsonValid.value = true
}

const handleSubmit = async () => {
  if (form.value.dataType === 'json' && !jsonValid.value) {
    showError('Le JSON est invalide. Veuillez corriger les erreurs.')
    return
  }

  saving.value = true
  try {
    let value = form.value.value

    // Convert value based on dataType for backend
    if (form.value.dataType === 'json') {
      value = typeof value === 'string' ? value : JSON.stringify(value)
    } else if (form.value.dataType === 'boolean') {
      value = value ? '1' : '0'
    } else {
      value = String(value)
    }

    const data = {
      category: form.value.category,
      parameterKey: form.value.parameterKey,
      value: value,
      dataType: form.value.dataType,
      description: form.value.description || null,
      isEditable: form.value.isEditable,
      isPublic: form.value.isPublic,
      defaultValue: form.value.defaultValue || null
    }

    let result
    if (isEditing.value) {
      result = await apiService.updateSystemParameter(form.value.id, data)
    } else {
      result = await apiService.createSystemParameter(data)
    }

    if (result.success) {
      success(isEditing.value ? 'Paramètre modifié avec succès' : 'Paramètre créé avec succès')
      closeModal()
      await loadParameters()
    } else {
      throw new Error(result.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving parameter:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (param) => {
  if (!param.isEditable) {
    warning('Ce paramètre système est protégé et ne peut pas être supprimé')
    return
  }

  if (!confirm(`Êtes-vous sûr de vouloir supprimer le paramètre "${param.parameterKey}" ?\n\nCette action est irréversible.`)) {
    return
  }

  try {
    const result = await apiService.deleteSystemParameter(param.id)
    
    if (result.success) {
      success('Paramètre supprimé avec succès')
      await loadParameters()
    } else {
      throw new Error(result.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting parameter:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.parameters-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-section {
  margin-bottom: 2rem;

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 3px solid #e5e7eb;

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #1f2937;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .category-icon {
        font-size: 1.5rem;
        color: #3b82f6;
      }
    }

    .category-count {
      font-size: 0.9rem;
      color: #6b7280;
      font-weight: 600;
    }
  }
}

.parameters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.parameter-card {
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

  &.system-param {
    border-color: #fbbf24;
    background: linear-gradient(to bottom, #fffbeb, white);
  }

  .parameter-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f3f4f6;

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #1f2937;
        font-weight: 700;
        font-family: monospace;
        word-break: break-all;
      }

      .badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
    }

    .parameter-actions {
      display: flex;
      gap: 0.5rem;

      button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
  }

  .parameter-info {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;

    .info-item {
      display: flex;
      align-items: start;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #4b5563;

      .label {
        font-weight: 600;
        color: #6b7280;
        min-width: 60px;
      }

      .icon {
        font-size: 1rem;
        flex-shrink: 0;
      }

      &.value-display {
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 6px;
        border-left: 3px solid #3b82f6;

        .value {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          word-break: break-all;

          &.value-boolean {
            font-size: 1rem;
          }

          &.value-json {
            white-space: pre-wrap;
            font-size: 0.8rem;
            line-height: 1.4;
          }
        }
      }

      &.description {
        font-style: italic;
        color: #6b7280;
      }
    }

    .meta-info {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8rem;
        color: #9ca3af;

        i {
          font-size: 0.75rem;
        }
      }
    }
  }
}

.badge-type {
  font-family: monospace;
  
  &.type-string {
    background: #eff6ff;
    color: #1e40af;
  }

  &.type-integer {
    background: #f0fdf4;
    color: #15803d;
  }

  &.type-float {
    background: #ecfdf5;
    color: #059669;
  }

  &.type-boolean {
    background: #fef3c7;
    color: #92400e;
  }

  &.type-json {
    background: #f3e8ff;
    color: #6b21a8;
  }
}

.badge-system {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fbbf24;
}

.badge-public {
  background: #dbeafe;
  color: #1e40af;
}

.parameter-form {
  .form-section {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid #e5e7eb;

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

  .value-field {
    .boolean-field {
      display: flex;
      gap: 1.5rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 2px solid #e5e7eb;

      .radio-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background: white;
        }

        input[type="radio"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .parameters-grid {
    grid-template-columns: 1fr;
  }
}
</style>

