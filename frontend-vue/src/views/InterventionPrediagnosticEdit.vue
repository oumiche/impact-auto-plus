<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionPrediagnostics' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Modifier le prédiagnostic</h1>
      <p>Modifiez les informations du prédiagnostic</p>
    </template>

    <template #header-actions>
      <button @click="goBack" class="btn-secondary" type="button">
        <i class="fas fa-arrow-left"></i>
        Retour
      </button>
      <button @click="printPrediagnostic" class="btn-secondary" type="button">
        <i class="fas fa-print"></i>
        Imprimer
      </button>
      <button 
        v-if="interventionStatus === 'in_prediagnostic'"
        @click="validatePrediagnostic" 
        class="btn-success" 
        type="button"
        :disabled="validating"
      >
        <i v-if="validating" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-check"></i>
        {{ validating ? 'Validation...' : 'Valider le prédiagnostic' }}
      </button>
    </template>

    <!-- Loading state -->
    <LoadingSpinner v-if="loading" text="Chargement du prédiagnostic..." />

    <div v-else class="form-page-container">
      <form @submit.prevent="handleSubmit" class="form-page">
        <!-- Intervention -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention</h4>
          
          <InterventionSelector
            v-model="form.interventionId"
            label="Intervention"
            required
            :status-filter="['reported', 'in_prediagnostic']"
          />
        </div>

        <!-- Informations générales -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date du prédiagnostic <span class="required">*</span></label>
              <input
                v-model="form.prediagnosticDate"
                type="date"
                required
              />
            </div>

            <SearchableSelector
              v-model="form.expertId"
              api-method="getCollaborateurs"
              label="Expert"
              display-field="firstName"
              secondary-field="lastName"
              placeholder="Rechercher un expert..."
            />
          </div>
        </div>

        <!-- Opérations / Items -->
        <div class="form-section">
          <h4>
            <i class="fas fa-list-check"></i> 
            Opérations à réaliser
            <button type="button" @click="addItem" class="btn-add-item">
              <i class="fas fa-plus-circle"></i>
              Ajouter une opération
            </button>
          </h4>

          <div v-if="form.items.length === 0" class="no-items">
            <i class="fas fa-info-circle"></i>
            Aucune opération ajoutée
          </div>

          <div v-else class="items-list">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="item-row"
            >
              <div class="item-number">{{ index + 1 }}</div>
              
              <div class="item-fields">
                <div class="operation-description">
                  <label>
                    <i class="fas fa-file-lines"></i>
                    Description de l'opération
                  </label>
                  <textarea
                    v-model="item.operationLabel"
                    placeholder="Décrivez l'opération à réaliser (ex: Remplacer le pare-choc avant droit, repeindre et polir...)"
                    rows="2"
                    required
                  ></textarea>
                </div>
                
                <div class="item-checkboxes">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isExchange" />
                    <span><i class="fas fa-exchange-alt"></i> Échange</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isRepair" />
                    <span><i class="fas fa-wrench"></i> Réparation</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isPainting" />
                    <span><i class="fas fa-paint-brush"></i> Peinture</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isControl" />
                    <span><i class="fas fa-check-square"></i> Contrôle</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                @click="removeItem(index)"
                class="btn-icon btn-delete"
                title="Supprimer"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Pièces jointes -->
        <div class="form-section">
          <h4><i class="fas fa-paperclip"></i> Pièces jointes</h4>
          
          <!-- PJ existantes -->
          <div v-if="existingAttachments.length > 0" class="attachments-grid">
            <div 
              v-for="attachment in existingAttachments" 
              :key="attachment.id"
              class="attachment-card"
            >
              <!-- Image preview -->
              <div v-if="isImage(attachment.mimeType)" class="attachment-preview">
                <img :src="getAttachmentUrl(attachment)" :alt="attachment.originalName" />
                <div class="preview-overlay">
                  <button 
                    type="button" 
                    @click="viewAttachment(attachment)" 
                    class="preview-btn"
                    title="Voir"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
              
              <!-- File icon -->
              <div v-else class="attachment-icon">
                <i :class="`fas ${getFileIcon(attachment.mimeType)}`"></i>
                <span class="file-ext">{{ getFileExtension(attachment.originalName) }}</span>
              </div>
              
              <!-- Info -->
              <div class="attachment-info">
                <div class="attachment-name" :title="attachment.originalName">
                  {{ attachment.originalName }}
                </div>
                <div class="attachment-meta">
                  <span>{{ formatFileSize(attachment.size) }}</span>
                  <span>{{ formatDate(attachment.createdAt) }}</span>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="attachment-actions">
                <button 
                  type="button"
                  @click="downloadAttachment(attachment)" 
                  class="btn-icon btn-download" 
                  title="Télécharger"
                >
                  <i class="fas fa-download"></i>
                </button>
                <button 
                  type="button"
                  @click="confirmDeleteAttachment(attachment)" 
                  class="btn-icon btn-delete" 
                  title="Supprimer"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="no-attachments">
            <i class="fas fa-paperclip"></i>
            <p>Aucune pièce jointe</p>
          </div>
          
          <!-- Upload de nouvelles PJ -->
          <div class="upload-section">
            <h5>Ajouter de nouvelles pièces jointes</h5>
            <DocumentUploader
              v-model="newAttachments"
              :max-files="10"
              :max-size-mb="10"
              :accept="['image/*', 'application/pdf']"
            />
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-secondary">
            <i class="fas fa-times"></i>
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Modal de prévisualisation d'image -->
    <div v-if="previewImage" class="image-preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <button class="btn-close-preview" @click="closePreview">
          <i class="fas fa-times"></i>
        </button>
        <img :src="previewImage.url" :alt="previewImage.name" />
        <div class="preview-info">
          <strong>{{ previewImage.name }}</strong>
          <span>{{ previewImage.size }}</span>
        </div>
      </div>
    </div>

    <!-- Notifications d'erreur -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>

    <!-- Modal de confirmation de validation -->
    <ConfirmDialog
      v-model="showValidateModal"
      title="Valider le prédiagnostic"
      message="Êtes-vous sûr de vouloir valider ce prédiagnostic ?"
      warning="Le statut de l'intervention passera en 'Prédiagnostic terminé' et permettra la création de devis."
      type="info"
      confirm-text="Valider"
      cancel-text="Annuler"
      loading-text="Validation..."
      :loading="validating"
      @confirm="executeValidation"
      @cancel="closeValidateModal"
    />
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SearchableSelector from '@/components/common/SearchableSelector.vue'
import DocumentUploader from '@/components/common/DocumentUploader.vue'
import apiService from '@/services/api.service'
import pdfService from '@/services/pdf.service'

const router = useRouter()
const route = useRoute()
const { success, error, warning } = useNotification()

const prediagnosticId = computed(() => route.params.id)

// État
const loading = ref(true)
const saving = ref(false)
const validating = ref(false)
const errorMessage = ref('')
const interventionStatus = ref(null)

// Attachments
const existingAttachments = ref([])
const newAttachments = ref([])
const previewImage = ref(null)

// Formulaire
const form = ref({
  interventionId: null,
  prediagnosticDate: new Date().toISOString().split('T')[0],
  expertId: null,
  items: []
})

// Méthodes - Items
const addItem = () => {
  form.value.items.push({
    operationLabel: '',
    isExchange: false,
    isRepair: false,
    isPainting: false,
    isControl: false
  })
}

const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

// Méthodes - Attachments
const loadAttachments = async () => {
  try {
    const response = await apiService.getPrediagnosticAttachments(prediagnosticId.value)
    if (response.success) {
      existingAttachments.value = response.data || []
    }
  } catch (err) {
    console.error('Error loading attachments:', err)
  }
}

const uploadNewAttachments = async () => {
  if (newAttachments.value.length === 0) return
  
  try {
    for (const doc of newAttachments.value) {
      if (doc.file) {
        await apiService.uploadPrediagnosticAttachment(prediagnosticId.value, doc.file)
      }
    }
    success('Pièces jointes uploadées avec succès')
  } catch (err) {
    console.error('Error uploading attachments:', err)
    warning('Erreur lors de l\'upload de certaines pièces jointes')
  }
}

const confirmDeleteAttachment = async (attachment) => {
  if (!confirm(`Supprimer ${attachment.originalName} ?`)) return
  
  try {
    const response = await apiService.deletePrediagnosticAttachment(prediagnosticId.value, attachment.id)
    if (response.success) {
      success('Pièce jointe supprimée')
      await loadAttachments()
    } else {
      throw new Error(response.message)
    }
  } catch (err) {
    console.error('Error deleting attachment:', err)
    error('Erreur lors de la suppression')
  }
}

const viewAttachment = (attachment) => {
  previewImage.value = {
    url: getAttachmentUrl(attachment),
    name: attachment.originalName,
    size: formatFileSize(attachment.size)
  }
}

const closePreview = () => {
  previewImage.value = null
}

const downloadAttachment = (attachment) => {
  const link = document.createElement('a')
  link.href = getAttachmentUrl(attachment)
  link.download = attachment.originalName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Helpers
const getAttachmentUrl = (attachment) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://127.0.0.1:8000/api'
  const backendUrl = apiUrl.replace('/api', '')
  return `${backendUrl}/uploads/intervention_prediagnostic/${prediagnosticId.value}/${attachment.fileName}`
}

const isImage = (mimeType) => {
  return mimeType && mimeType.startsWith('image/')
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'fa-file'
  if (mimeType.startsWith('image/')) return 'fa-image'
  if (mimeType === 'application/pdf') return 'fa-file-pdf'
  if (mimeType.includes('word')) return 'fa-file-word'
  if (mimeType.includes('excel')) return 'fa-file-excel'
  return 'fa-file'
}

const getFileExtension = (filename) => {
  const ext = filename.split('.').pop()
  return ext.toUpperCase()
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
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

// Load data
const loadPrediagnostic = async () => {
  try {
    loading.value = true
    
    const response = await apiService.getInterventionPrediagnostic(prediagnosticId.value)
    
    if (response.success && response.data) {
      const prediag = response.data
      
      form.value = {
        interventionId: prediag.interventionId || null,
        prediagnosticDate: prediag.prediagnosticDate ? prediag.prediagnosticDate.split(/[T\s]/)[0] : new Date().toISOString().split('T')[0],
        expertId: prediag.expertId || null,
        items: prediag.items ? prediag.items.map(item => ({
          id: item.id,
          operationLabel: item.operationLabel || '',
          isExchange: item.isExchange || false,
          isRepair: item.isRepair || false,
          isPainting: item.isPainting || false,
          isControl: item.isControl || false
        })) : []
      }
      
      // Charger le statut de l'intervention
      interventionStatus.value = prediag.intervention?.currentStatus || null
      
      // Charger les attachments
      await loadAttachments()
    } else {
      throw new Error('Prédiagnostic non trouvé')
    }
  } catch (err) {
    console.error('Error loading prediagnostic:', err)
    errorMessage.value = 'Erreur lors du chargement du prédiagnostic'
    error('Erreur lors du chargement')
  } finally {
    loading.value = false
  }
}

// Submit
const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (form.value.items.length === 0) {
      warning('Veuillez ajouter au moins une opération')
      return
    }

    saving.value = true

    // Préparer les items avec orderIndex
    const items = form.value.items.map((item, index) => ({
      ...item,
      orderIndex: index + 1
    }))

    const data = {
      interventionId: form.value.interventionId,
      prediagnosticDate: form.value.prediagnosticDate,
      expertId: form.value.expertId || null,
      items: items
    }

    const response = await apiService.updateInterventionPrediagnostic(prediagnosticId.value, data)

    if (response.success) {
      // Upload les nouvelles PJ
      if (newAttachments.value.length > 0) {
        await uploadNewAttachments()
      }
      
      success('Prédiagnostic modifié avec succès')
      router.push({ name: 'InterventionPrediagnostics' })
    } else {
      throw new Error(response.message || 'Erreur lors de la modification')
    }
  } catch (err) {
    console.error('Error updating prediagnostic:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la modification'
    error('Erreur lors de la modification')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionPrediagnostics' })
}

// Validation du prédiagnostic
const showValidateModal = ref(false)

const validatePrediagnostic = () => {
  showValidateModal.value = true
}

const closeValidateModal = () => {
  showValidateModal.value = false
}

const executeValidation = async () => {
  validating.value = true

  try {
    // Mettre à jour le statut de l'intervention
    const response = await apiService.updateVehicleIntervention(form.value.interventionId, {
      currentStatus: 'prediagnostic_completed'
    })

    if (response.success) {
      success('Prédiagnostic validé avec succès')
      closeValidateModal()
      // Recharger les données pour mettre à jour l'interface
      await loadPrediagnostic()
    } else {
      throw new Error(response.message || 'Erreur lors de la validation')
    }
  } catch (err) {
    console.error('Error validating prediagnostic:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la validation')
  } finally {
    validating.value = false
  }
}

// Impression PDF
const printPrediagnostic = async () => {
  try {
    // Récupérer les données complètes du prédiagnostic et de l'intervention
    const [prediagnosticResponse, interventionResponse] = await Promise.all([
      apiService.getInterventionPrediagnostic(prediagnosticId.value),
      apiService.getVehicleIntervention(form.value.interventionId)
    ])

    if (!prediagnosticResponse.success || !interventionResponse.success) {
      throw new Error('Erreur lors du chargement des données')
    }

    // Générer le PDF
    const filename = `prediagnostic-${prediagnosticResponse.data.interventionId}-${new Date().toISOString().split('T')[0]}.pdf`
    
    pdfService.createPrediagnosticPDF(
      prediagnosticResponse.data,
      interventionResponse.data
    )
    
    // Télécharger automatiquement
    pdfService.download(filename)
    
    success('PDF de prédiagnostic généré avec succès')

  } catch (err) {
    console.error('Error generating PDF:', err)
    error('Erreur lors de la génération du PDF: ' + err.message)
  }
}

// Lifecycle
onMounted(() => {
  loadPrediagnostic()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.breadcrumb {
  margin-bottom: 1rem;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    color: #2563eb;
    text-decoration: underline;
  }
}

.form-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem 2rem;
}

.form-page {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-section {
  margin-bottom: 2rem;

  h4 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;

    i {
      color: #3b82f6;
    }
  }
}

.btn-add-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }
}

.no-items {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;

  i {
    font-size: 1.5rem;
    color: #9ca3af;
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-row {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.item-number {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.item-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.operation-description {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.95rem;

    i {
      color: #3b82f6;
      font-size: 0.9rem;
    }
  }

  textarea {
    width: 100%;
    padding: 0.875rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.95rem;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
    transition: all 0.3s;
    background: #f9fafb;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
      font-style: italic;
    }
  }
}

.item-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    display: flex;
    align-items: center;
    gap: 0.375rem;

    i {
      font-size: 0.9rem;
    }
  }

  &:hover {
    color: #1f2937;
  }
}

// Attachments styles
.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.attachment-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.attachment-preview {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover .preview-overlay {
    opacity: 1;
  }
  
  .preview-btn {
    padding: 0.75rem 1.25rem;
    background: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.25rem;
    color: #3b82f6;
    transition: all 0.2s;
    
    &:hover {
      background: #eff6ff;
      transform: scale(1.1);
    }
  }
}

.attachment-icon {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #f9fafb;
  
  i {
    font-size: 4rem;
    color: #9ca3af;
  }
  
  .file-ext {
    font-size: 0.8rem;
    font-weight: 700;
    color: #6b7280;
  }
}

.attachment-info {
  padding: 1rem;
  background: white;
}

.attachment-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.5rem;
}

.attachment-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.attachment-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-download {
  color: #3b82f6;
  
  &:hover {
    background: #dbeafe;
    color: #2563eb;
  }
}

.no-attachments {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  margin-bottom: 1.5rem;
  
  i {
    font-size: 2.5rem;
    color: #9ca3af;
  }
  
  p {
    margin: 0;
    font-size: 0.95rem;
  }
}

.upload-section {
  margin-top: 1.5rem;
  
  h5 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

// Image preview modal
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  img {
    max-width: 100%;
    max-height: calc(90vh - 100px);
    object-fit: contain;
    border-radius: 8px;
  }
}

.btn-close-preview {
  position: absolute;
  top: -3rem;
  right: 0;
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #1f2937;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    transform: scale(1.1);
  }
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: white;
  text-align: center;

  strong {
    font-size: 1rem;
  }

  span {
    font-size: 0.85rem;
    opacity: 0.8;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
  margin-top: 2rem;
}

.btn-success {
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #15803d;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 0.9rem;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #3b82f6;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }
}
</style>

