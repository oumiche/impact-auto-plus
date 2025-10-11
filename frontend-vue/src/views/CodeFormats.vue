<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouveau format
      </button>
    </template>

    <div class="code-formats-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher un format (type d'entité, pattern)..."
        @search="handleSearch"
      />

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Statut</label>
          <select v-model="filters.status" @change="loadCodeFormats">
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading && !codeFormats.length" text="Chargement des formats..." />

      <!-- Code Formats List -->
      <div v-else-if="codeFormats.length > 0">
        <div class="formats-grid">
          <div
            v-for="format in codeFormats"
            :key="format.id"
            class="format-card"
          >
            <div class="format-header">
              <div class="header-left">
                <h3>{{ getEntityTypeLabel(format.entityType) }}</h3>
                <span class="badge" :class="format.isActive ? 'badge-success' : 'badge-inactive'">
                  {{ format.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </div>
              <div class="format-actions">
                <button @click="openEditModal(format)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(format)" class="btn-icon btn-delete" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="format-info">
              <div class="info-item">
                <span class="label">Pattern:</span>
                <code class="pattern">{{ format.formatPattern }}</code>
              </div>

              <div class="info-item">
                <span class="label">Exemple:</span>
                <code class="example">{{ generateExampleCode(format) }}</code>
              </div>

              <div class="info-row">
                <div class="info-item" v-if="format.prefix">
                  <i class="fas fa-arrow-right"></i>
                  <span>Préfixe: {{ format.prefix }}</span>
                </div>
                <div class="info-item" v-if="format.suffix">
                  <i class="fas fa-arrow-left"></i>
                  <span>Suffixe: {{ format.suffix }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <i class="fas fa-sort-numeric-up"></i>
                  <span>Séquence: {{ format.currentSequence }} / {{ format.sequenceLength }} chiffres</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-minus"></i>
                  <span>Séparateur: "{{ format.separator }}"</span>
                </div>
              </div>

              <div class="options-badges">
                <span v-if="format.includeYear" class="option-badge">Année</span>
                <span v-if="format.includeMonth" class="option-badge">Mois</span>
                <span v-if="format.includeDay" class="option-badge">Jour</span>
              </div>

              <div v-if="format.description" class="format-description">
                {{ format.description }}
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
          <i class="fas fa-code"></i>
        </div>
        <h3>Aucun format de code</h3>
        <p>Commencez par créer votre premier format de code</p>
        <button @click="openCreateModal" class="btn-primary">
          <i class="fas fa-plus"></i>
          Créer un format
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
        :title="isEditing ? 'Modifier le format' : 'Nouveau format'"
        size="large"
      >
        <form @submit.prevent="handleSubmit" class="format-form" id="codeFormatForm">
          <div class="form-row">
            <div class="form-group full-width">
              <label for="entityType">Type d'entité <span class="required">*</span></label>
              <select
                id="entityType"
                v-model="form.entityType"
                required
                :disabled="isEditing"
                @change="handleEntityTypeChange"
              >
                <option value="">Sélectionner un type</option>
                <option 
                  v-for="type in entityTypes" 
                  :key="type.value" 
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
              <small v-if="isEditing" class="form-hint">Le type d'entité ne peut pas être modifié</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="prefix">Préfixe</label>
              <input
                id="prefix"
                v-model="form.prefix"
                type="text"
                placeholder="Ex: INT"
                maxlength="10"
              />
            </div>

            <div class="form-group">
              <label for="suffix">Suffixe</label>
              <input
                id="suffix"
                v-model="form.suffix"
                type="text"
                placeholder="Ex: IAP"
                maxlength="10"
              />
            </div>

            <div class="form-group">
              <label for="separator">Séparateur <span class="required">*</span></label>
              <input
                id="separator"
                v-model="form.separator"
                type="text"
                placeholder="-"
                maxlength="5"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="formatPattern">Pattern du format <span class="required">*</span></label>
            <input
              id="formatPattern"
              v-model="form.formatPattern"
              type="text"
              placeholder="Ex: {PREFIX}{SEPARATOR}{YEAR}{MONTH}{SEPARATOR}{SEQUENCE}"
              required
            />
            <small class="form-hint">
              Variables disponibles: {PREFIX}, {SUFFIX}, {SEPARATOR}, {YEAR}, {MONTH}, {DAY}, {SEQUENCE}
            </small>
          </div>

          <div class="form-section">
            <h4>Options de date</h4>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.includeYear" />
                <span>Inclure l'année</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.includeMonth" />
                <span>Inclure le mois</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.includeDay" />
                <span>Inclure le jour</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="sequenceLength">Longueur de la séquence <span class="required">*</span></label>
              <input
                id="sequenceLength"
                v-model.number="form.sequenceLength"
                type="number"
                min="1"
                max="10"
                required
              />
            </div>

            <div class="form-group">
              <label for="sequenceStart">Début de séquence <span class="required">*</span></label>
              <input
                id="sequenceStart"
                v-model.number="form.sequenceStart"
                type="number"
                min="1"
                required
              />
            </div>

            <div class="form-group" v-if="isEditing">
              <label for="currentSequence">Séquence actuelle</label>
              <input
                id="currentSequence"
                v-model.number="form.currentSequence"
                type="number"
                min="0"
                readonly
                disabled
              />
              <small class="form-hint">Lecture seule</small>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="Description optionnelle du format"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.isActive" />
              <span>Format actif</span>
            </label>
          </div>

          <!-- Code Preview -->
          <div class="preview-section">
            <CodePreview
              :formatPattern="form.formatPattern"
              :prefix="form.prefix"
              :suffix="form.suffix"
              :separator="form.separator"
              :includeYear="form.includeYear"
              :includeMonth="form.includeMonth"
              :includeDay="form.includeDay"
              :sequenceLength="form.sequenceLength"
              :sequenceStart="form.sequenceStart"
              :currentSequence="form.currentSequence"
              :exampleCount="3"
              title="Aperçu des prochains codes"
              description="Exemples de codes qui seront générés avec ce format"
            />
          </div>
        </form>

        <template #footer>
          <button @click="closeModal" class="btn-secondary">Annuler</button>
          <button form="codeFormatForm" type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}
          </button>
        </template>
      </Modal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import CodePreview from '@/components/common/CodePreview.vue'
import apiService from '@/services/api.service'

const { success, error: showError } = useNotification()

const codeFormats = ref([])
const entityTypes = ref([])
const loading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)

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
  entityType: '',
  formatPattern: '',
  prefix: '',
  suffix: '',
  separator: '-',
  includeYear: true,
  includeMonth: true,
  includeDay: false,
  sequenceLength: 4,
  sequenceStart: 1,
  currentSequence: 0,
  isActive: true,
  description: ''
})

const currentPage = computed(() => pagination.value.page)
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

onMounted(async () => {
  await loadEntityTypes()
  await loadCodeFormats()
})

const loadEntityTypes = async () => {
  try {
    const result = await apiService.getCodeFormatEntityTypes()
    if (result.success) {
      entityTypes.value = result.data || []
    }
  } catch (err) {
    console.error('Error loading entity types:', err)
  }
}

const getEntityTypeLabel = (entityType) => {
  const type = entityTypes.value.find(t => t.value === entityType)
  return type ? type.label : entityType
}

const handleEntityTypeChange = () => {
  // Si le pattern est vide, utiliser le pattern par défaut du type d'entité
  if (!form.value.formatPattern && form.value.entityType) {
    const type = entityTypes.value.find(t => t.value === form.value.entityType)
    if (type && type.defaultPattern) {
      form.value.formatPattern = type.defaultPattern
    }
  }
}

const loadCodeFormats = async () => {
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

    const result = await apiService.getCodeFormats(params)
    
    if (result.success) {
      codeFormats.value = result.data || []
      pagination.value.total = result.pagination?.total || result.data?.length || 0
    } else {
      throw new Error(result.message || 'Erreur lors du chargement des formats')
    }
  } catch (err) {
    console.error('Error loading code formats:', err)
    const errMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement des formats'
    showError(errMsg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadCodeFormats()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadCodeFormats()
}

const generateExampleCode = (format) => {
  let code = format.formatPattern
  const now = new Date()
  const sequence = String(format.currentSequence + 1).padStart(format.sequenceLength, '0')
  
  const replacements = {
    '{PREFIX}': format.prefix || '',
    '{SUFFIX}': format.suffix || '',
    '{SEPARATOR}': format.separator || '',
    '{YEAR}': format.includeYear ? now.getFullYear().toString() : '',
    '{MONTH}': format.includeMonth ? String(now.getMonth() + 1).padStart(2, '0') : '',
    '{DAY}': format.includeDay ? String(now.getDate()).padStart(2, '0') : '',
    '{SEQUENCE}': sequence,
    '{SEQ}': sequence
  }
  
  Object.entries(replacements).forEach(([variable, value]) => {
    code = code.replace(new RegExp(variable, 'g'), value)
  })
  
  // Clean up multiple separators
  if (format.separator) {
    const sepRegex = new RegExp(`${escapeRegex(format.separator)}+`, 'g')
    code = code.replace(sepRegex, format.separator)
    code = code.replace(new RegExp(`^${escapeRegex(format.separator)}+|${escapeRegex(format.separator)}+$`, 'g'), '')
  }
  
  return code
}

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const openCreateModal = () => {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

const openEditModal = async (format) => {
  // Reset first to ensure clean state
  resetForm()
  
  // Then populate with data
  await nextTick()
  
  form.value = {
    id: format.id,
    entityType: format.entityType,
    formatPattern: format.formatPattern,
    prefix: format.prefix !== null && format.prefix !== undefined ? format.prefix : '',
    suffix: format.suffix !== null && format.suffix !== undefined ? format.suffix : '',
    separator: format.separator || '-',
    includeYear: format.includeYear,
    includeMonth: format.includeMonth,
    includeDay: format.includeDay,
    sequenceLength: format.sequenceLength,
    sequenceStart: format.sequenceStart,
    currentSequence: format.currentSequence,
    isActive: format.isActive,
    description: format.description !== null && format.description !== undefined ? format.description : ''
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
    entityType: '',
    formatPattern: '',
    prefix: '',
    suffix: '',
    separator: '-',
    includeYear: true,
    includeMonth: true,
    includeDay: false,
    sequenceLength: 4,
    sequenceStart: 1,
    currentSequence: 0,
    isActive: true,
    description: ''
  }
}

const handleSubmit = async () => {
  saving.value = true
  try {
    const data = {
      entityType: form.value.entityType,
      formatPattern: form.value.formatPattern,
      prefix: form.value.prefix || null,
      suffix: form.value.suffix || null,
      separator: form.value.separator,
      includeYear: form.value.includeYear,
      includeMonth: form.value.includeMonth,
      includeDay: form.value.includeDay,
      sequenceLength: form.value.sequenceLength,
      sequenceStart: form.value.sequenceStart,
      isActive: form.value.isActive,
      description: form.value.description || null
    }

    let result
    if (isEditing.value) {
      result = await apiService.updateCodeFormat(form.value.id, data)
    } else {
      result = await apiService.createCodeFormat(data)
    }

    if (result.success) {
      success(isEditing.value ? 'Format modifié avec succès' : 'Format créé avec succès')
      closeModal()
      await loadCodeFormats()
    } else {
      throw new Error(result.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving code format:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (format) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le format "${format.entityType}" ?\n\nCette action est irréversible.`)) {
    return
  }

  try {
    const result = await apiService.deleteCodeFormat(format.id)
    
    if (result.success) {
      success('Format supprimé avec succès')
      await loadCodeFormats()
    } else {
      throw new Error(result.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting code format:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.code-formats-page {
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

.formats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.format-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .format-header {
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

      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
        font-weight: 700;
        text-transform: capitalize;
      }
    }

    .format-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .format-info {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #4b5563;

      .label {
        font-weight: 600;
        color: #6b7280;
      }

      code {
        background: #f3f4f6;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        color: #1f2937;

        &.pattern {
          color: #3b82f6;
          font-weight: 600;
        }

        &.example {
          color: #10b981;
          font-weight: 700;
        }
      }

      .icon {
        font-size: 1rem;
      }
    }

    .info-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .options-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;

      .option-badge {
        padding: 0.25rem 0.625rem;
        background: #eff6ff;
        color: #1e40af;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .format-description {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #4b5563;
      font-style: italic;
    }
  }
}

.format-form {
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
      gap: 1.5rem;
      flex-wrap: wrap;
    }
  }

  .preview-section {
    margin: 1.5rem 0;
  }
}

.badge-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

@media (max-width: 768px) {
  .formats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

