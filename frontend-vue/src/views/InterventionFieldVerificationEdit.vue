<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionFieldVerifications' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Modifier la Vérification Terrain</h1>
      <p>Modifiez les informations de la vérification terrain</p>
    </template>

    <template #header-actions>
      <button @click="goBack" class="btn-secondary" type="button">
        <i class="fas fa-arrow-left"></i>
        Retour
      </button>
      <button 
        v-if="isValidated"
        @click="resetValidation" 
        class="btn-warning" 
        type="button"
        :disabled="saving"
      >
        <i v-if="saving" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-undo"></i>
        Remettre en attente
      </button>
    </template>

    <!-- Loading state -->
    <LoadingSpinner v-if="loading" text="Chargement de la vérification..." />

    <div v-else class="form-page-container">
      <!-- Badge de validation -->
      <div v-if="isValidated" class="validation-banner">
        <i class="fas fa-check-circle"></i>
        <span>
          Cette vérification a été validée avec le résultat : 
          <strong>{{ form.isSatisfactory ? 'Satisfaisant' : 'Non satisfaisant' }}</strong>
        </span>
      </div>

      <form @submit.prevent="handleSubmit" class="form-page">
        <!-- Intervention -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention</h4>
          
          <InterventionSelector
            v-model="form.interventionId"
            label="Intervention"
            required
            disabled
          />
        </div>

        <!-- Informations de vérification -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations de vérification</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date de vérification <span class="required">*</span></label>
              <input
                v-model="form.verificationDate"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label>Type de vérification <span class="required">*</span></label>
              <select v-model="form.verificationType" required>
                <option value="before_work">Avant travaux</option>
                <option value="during_work">Pendant travaux</option>
                <option value="after_work">Après travaux</option>
              </select>
            </div>
          </div>

          <SearchableSelector
            v-model="form.verifiedBy"
            api-method="getCollaborateurs"
            label="Vérifié par"
            display-field="firstName"
            secondary-field="lastName"
            placeholder="Rechercher un collaborateur..."
            required
          />
        </div>

        <!-- Constatations -->
        <div class="form-section">
          <h4><i class="fas fa-clipboard-list"></i> Constatations</h4>
          
          <div class="form-group">
            <label>Constatations <span class="required">*</span></label>
            <textarea
              v-model="form.findings"
              rows="5"
              placeholder="Décrivez vos constatations..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Résultat de la vérification</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="form.isSatisfactory"
                  :value="true"
                />
                <span class="radio-label satisfactory">
                  <i class="fas fa-check-circle"></i>
                  Satisfaisant
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="form.isSatisfactory"
                  :value="false"
                />
                <span class="radio-label unsatisfactory">
                  <i class="fas fa-times-circle"></i>
                  Non satisfaisant
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="form.isSatisfactory"
                  :value="null"
                />
                <span class="radio-label pending">
                  <i class="fas fa-clock"></i>
                  En attente
                </span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Recommandations</label>
            <textarea
              v-model="form.recommendations"
              rows="4"
              placeholder="Vos recommandations..."
            ></textarea>
          </div>
        </div>

        <!-- Pièces jointes -->
        <div class="form-section">
          <h4><i class="fas fa-paperclip"></i> Pièces jointes</h4>
          
          <!-- Liste des pièces jointes existantes -->
          <div v-if="attachments.length > 0" class="attachments-grid">
            <div 
              v-for="attachment in attachments" 
              :key="attachment.id"
              class="attachment-card"
            >
              <!-- Preview -->
              <div v-if="isImageFile(attachment)" class="attachment-preview">
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
                <i :class="`fas ${getFileIcon(attachment)}`"></i>
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
          
          <!-- Upload button -->
          <button 
            v-if="newAttachments.length > 0"
            type="button"
            @click="uploadNewAttachments"
            class="btn-secondary"
            :disabled="uploadingFiles"
          >
            <i v-if="uploadingFiles" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-upload"></i>
            {{ uploadingFiles ? 'Upload en cours...' : `Uploader ${newAttachments.length} fichier(s)` }}
          </button>
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

    <!-- Notifications d'erreur -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
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
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import { useConfirm } from '@/composables/useConfirm'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SearchableSelector from '@/components/common/SearchableSelector.vue'
import DocumentUploader from '@/components/common/DocumentUploader.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const route = useRoute()
const { success, error, warning } = useNotification()
const { confirm } = useConfirm()

const verificationId = computed(() => route.params.id)

// État
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const attachments = ref([])
const newAttachments = ref([])
const uploadingFiles = ref(false)
const previewImage = ref(null)

// Formulaire
const form = ref({
  interventionId: null,
  verificationDate: new Date().toISOString().split('T')[0],
  verificationType: 'before_work',
  verifiedBy: null,
  photosTaken: 0,
  findings: '',
  isSatisfactory: null,
  recommendations: ''
})

// La vérification est "validée" si un résultat a été défini
const isValidated = computed(() => {
  return form.value.isSatisfactory !== null
})

// Load data
const loadVerification = async () => {
  try {
    loading.value = true
    
    const response = await apiService.getInterventionFieldVerification(verificationId.value)
    
    if (response.success && response.data) {
      const verif = response.data
      
      form.value = {
        interventionId: verif.intervention?.id || verif.interventionId || null,
        verificationDate: verif.verificationDate ? verif.verificationDate.split(/[T\s]/)[0] : new Date().toISOString().split('T')[0],
        verificationType: verif.verificationType || 'before_work',
        verifiedBy: verif.verifiedBy?.id || verif.verifiedBy || null,
        photosTaken: verif.photosTaken || 0,
        findings: verif.findings || '',
        isSatisfactory: verif.isSatisfactory,
        recommendations: verif.recommendations || ''
      }
    } else {
      throw new Error('Vérification terrain non trouvée')
    }
  } catch (err) {
    console.error('Error loading field verification:', err)
    errorMessage.value = 'Erreur lors du chargement de la vérification'
    error('Erreur lors du chargement')
  } finally {
    loading.value = false
  }
}

// Charger les pièces jointes
const loadAttachments = async () => {
  try {
    const response = await apiService.getFieldVerificationAttachments(verificationId.value)
    if (response.success) {
      attachments.value = response.data || []
    }
  } catch (err) {
    console.error('Error loading attachments:', err)
    warning('Erreur lors du chargement des pièces jointes')
  }
}

// Submit
const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (!form.value.verifiedBy) {
      warning('Veuillez sélectionner la personne qui vérifie')
      return
    }

    if (!form.value.findings || form.value.findings.trim() === '') {
      warning('Veuillez saisir des constatations')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      verificationDate: form.value.verificationDate,
      verificationType: form.value.verificationType,
      verifiedBy: form.value.verifiedBy,
      photosTaken: form.value.photosTaken || 0,
      findings: form.value.findings,
      isSatisfactory: form.value.isSatisfactory,
      recommendations: form.value.recommendations || null
    }

    const response = await apiService.updateInterventionFieldVerification(verificationId.value, data)

    if (response.success) {
      success('Vérification terrain modifiée avec succès')
      
      // Recharger les données au lieu de rediriger
      await loadVerification()
    } else {
      throw new Error(response.message || 'Erreur lors de la modification')
    }
  } catch (err) {
    console.error('Error updating field verification:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la modification'
    error('Erreur lors de la modification')
  } finally {
    saving.value = false
  }
}

// Remettre la vérification en attente
const resetValidation = async () => {
  try {
    await confirm({
      title: 'Remettre en attente',
      message: 'Êtes-vous sûr de vouloir remettre cette vérification en attente ? Le résultat sera effacé.',
      type: 'warning',
      confirmText: 'Oui, remettre en attente',
      cancelText: 'Annuler',
      confirmIcon: 'fas fa-undo'
    })
  } catch {
    return // L'utilisateur a annulé
  }
  
  try {
    saving.value = true
    
    // Remettre isSatisfactory à null pour indiquer "en attente"
    form.value.isSatisfactory = null
    
    const data = {
      interventionId: form.value.interventionId,
      verificationDate: form.value.verificationDate,
      verificationType: form.value.verificationType,
      verifiedBy: form.value.verifiedBy,
      photosTaken: form.value.photosTaken || 0,
      findings: form.value.findings,
      isSatisfactory: null,
      recommendations: form.value.recommendations || null
    }
    
    const response = await apiService.updateInterventionFieldVerification(verificationId.value, data)
    
    if (response.success) {
      success('Vérification remise en attente avec succès')
      await loadVerification()
    } else {
      throw new Error(response.message || 'Erreur lors de la modification')
    }
  } catch (err) {
    console.error('Error resetting validation:', err)
    error('Erreur lors de la remise en attente')
  } finally {
    saving.value = false
  }
}

// Gestion des pièces jointes
const uploadNewAttachments = async () => {
  if (newAttachments.value.length === 0) return

  try {
    uploadingFiles.value = true
    
    const uploadPromises = newAttachments.value.map(doc => 
      apiService.uploadFieldVerificationAttachment(verificationId.value, doc.file, '')
    )
    
    const results = await Promise.allSettled(uploadPromises)
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    if (successCount > 0) {
      success(`${successCount} fichier(s) uploadé(s) avec succès`)
      newAttachments.value = []
      await loadAttachments()
    }
    
    if (failCount > 0) {
      warning(`${failCount} fichier(s) n'ont pas pu être uploadés`)
    }
  } catch (err) {
    console.error('Error uploading attachments:', err)
    warning('Erreur lors de l\'upload de certaines pièces jointes')
  } finally {
    uploadingFiles.value = false
  }
}

const getAttachmentUrl = (attachment) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://127.0.0.1:8000/api'
  const backendUrl = apiUrl.replace('/api', '')
  return `${backendUrl}/uploads/intervention_field_verification/${verificationId.value}/${attachment.fileName}`
}

const isImageFile = (attachment) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
  const ext = attachment.originalName?.split('.').pop()?.toLowerCase()
  return imageExtensions.includes(ext)
}

const getFileIcon = (attachment) => {
  const ext = attachment.originalName?.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext)) return 'fa-file-pdf'
  if (['doc', 'docx'].includes(ext)) return 'fa-file-word'
  if (['xls', 'xlsx'].includes(ext)) return 'fa-file-excel'
  if (['zip', 'rar', '7z'].includes(ext)) return 'fa-file-archive'
  return 'fa-file'
}

const getFileExtension = (filename) => {
  const ext = filename?.split('.').pop()
  return ext?.toUpperCase() || ''
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
    year: 'numeric'
  })
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
  const url = getAttachmentUrl(attachment)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.originalName
  link.click()
}

const confirmDeleteAttachment = async (attachment) => {
  try {
    await confirm({
      title: 'Supprimer la pièce jointe',
      message: `Êtes-vous sûr de vouloir supprimer ${attachment.originalName} ?`,
      type: 'danger',
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler',
      confirmIcon: 'fas fa-trash'
    })
  } catch {
    return // L'utilisateur a annulé
  }
  
  try {
    const response = await apiService.deleteFieldVerificationAttachment(verificationId.value, attachment.id)
    if (response.success) {
      success('Pièce jointe supprimée')
      await loadAttachments()
    } else {
      throw new Error(response.message)
    }
  } catch (err) {
    console.error('Error deleting attachment:', err)
    error('Erreur lors de la suppression de la pièce jointe')
  }
}

const goBack = () => {
  router.push({ name: 'InterventionFieldVerifications' })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadVerification(),
    loadAttachments()
  ])
})
</script>

<style scoped lang="scss">
@import '@/views/crud-styles.scss';

.validation-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  background: #d1fae5;
  border: 2px solid #10b981;
  border-radius: 8px;
  color: #065f46;
  font-weight: 600;

  i {
    font-size: 1.25rem;
    color: #10b981;
  }

  strong {
    color: #047857;
  }
}

.btn-warning {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #d97706;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  i {
    font-size: 1rem;
  }
}

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

.radio-group {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type="radio"] {
    margin-right: 0.5rem;
    cursor: pointer;
  }

  .radio-label {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s;

    i {
      font-size: 1rem;
    }

    &.satisfactory {
      color: #059669;
      
      i {
        color: #10b981;
      }
    }

    &.unsatisfactory {
      color: #dc2626;
      
      i {
        color: #ef4444;
      }
    }

    &.pending {
      color: #d97706;
      
      i {
        color: #f59e0b;
      }
    }
  }

  input[type="radio"]:checked + .radio-label {
    &.satisfactory {
      background: #d1fae5;
      border-color: #10b981;
    }

    &.unsatisfactory {
      background: #fee2e2;
      border-color: #ef4444;
    }

    &.pending {
      background: #fef3c7;
      border-color: #f59e0b;
    }
  }
}

select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

// Pièces jointes - Galerie
.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.attachment-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.attachment-preview {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  &:hover {
    img {
      transform: scale(1.05);
    }

    .preview-overlay {
      opacity: 1;
    }
  }
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-btn {
  background: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #3b82f6;
  font-size: 1.25rem;
  transition: all 0.2s;

  &:hover {
    background: #3b82f6;
    color: white;
    transform: scale(1.1);
  }
}

.attachment-icon {
  width: 100%;
  height: 150px;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #6b7280;

  i {
    font-size: 3rem;
  }

  .file-ext {
    font-size: 0.75rem;
    font-weight: 700;
    background: #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
}

.attachment-info {
  padding: 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.attachment-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.attachment-actions {
  display: flex;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-icon {
  flex: 1;
  padding: 0.625rem;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;

  &:not(:last-child) {
    border-right: 1px solid #e5e7eb;
  }

  i {
    font-size: 1rem;
  }

  &.btn-preview {
    color: #3b82f6;
    
    &:hover {
      background: #dbeafe;
      color: #2563eb;
    }
  }

  &.btn-download {
    color: #10b981;
    
    &:hover {
      background: #d1fae5;
      color: #059669;
    }
  }

  &.btn-delete {
    color: #ef4444;
    
    &:hover {
      background: #fee2e2;
      color: #dc2626;
    }
  }
}

.no-attachments {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  color: #9ca3af;
  margin-bottom: 1.5rem;

  i {
    font-size: 3rem;
  }

  p {
    margin: 0;
    font-size: 1rem;
  }
}

.upload-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;

  h5 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }
}

// Modal de prévisualisation
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
</style>

