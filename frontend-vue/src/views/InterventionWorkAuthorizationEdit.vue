<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionWorkAuthorizations' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Modifier l'Accord Travaux</h1>
      <p>Modifiez les informations de l'accord de travaux</p>
    </template>

    <template #header-actions>
      <button @click="goBack" class="btn-secondary" type="button">
        <i class="fas fa-arrow-left"></i>
        Retour
      </button>
      <button 
        v-if="!isValidated"
        @click="validateAuthorization" 
        class="btn-success" 
        type="button"
        :disabled="validating"
      >
        <i v-if="validating" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-check"></i>
        {{ validating ? 'Validation...' : 'Valider l\'accord' }}
      </button>
      <button 
        v-if="isValidated"
        @click="cancelValidation" 
        class="btn-warning" 
        type="button"
        :disabled="canceling"
      >
        <i v-if="canceling" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-times-circle"></i>
        {{ canceling ? 'Annulation...' : 'Annuler la validation' }}
      </button>
    </template>

    <!-- Loading state -->
    <LoadingSpinner v-if="loading" text="Chargement de l'autorisation..." />

    <div v-else class="form-page-container">
      <!-- Badge de validation -->
      <div v-if="isValidated" class="validation-banner">
        <i class="fas fa-check-circle"></i>
        <span>Cet accord a été validé. Il n'est plus modifiable.</span>
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

        <!-- Informations générales -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date de l'autorisation <span class="required">*</span></label>
              <input
                v-model="form.authorizationDate"
                type="date"
                required
                :disabled="isValidated"
              />
            </div>

            <SearchableSelector
              v-model="form.authorizedBy"
              api-method="getCollaborateurs"
              label="Autorisé par"
              display-field="firstName"
              secondary-field="lastName"
              placeholder="Rechercher un collaborateur..."
              required
              :disabled="isValidated"
            />
          </div>

          <div class="form-group">
            <label>Instructions particulières</label>
            <textarea
              v-model="form.specialInstructions"
              rows="4"
              placeholder="Instructions spéciales pour le technicien..."
              :disabled="isValidated"
            ></textarea>
          </div>
        </div>

        <!-- Lignes de l'accord -->
        <div class="form-section">
          <h4>
            <i class="fas fa-list-check"></i> 
            Lignes de l'accord
            <button 
              v-if="!isValidated"
              type="button" 
              @click="addLine" 
              class="btn-add-item"
            >
              <i class="fas fa-plus-circle"></i>
              Ajouter une ligne
            </button>
          </h4>

          <div v-if="form.lines.length === 0" class="no-items">
            <i class="fas fa-info-circle"></i>
            Aucune ligne ajoutée. Cliquez sur "Ajouter une ligne"
          </div>

          <QuoteLineEditor
            v-else
            v-model="form.lines"
            @remove="removeLine"
            :disabled="isValidated"
          />

          <!-- Totaux -->
          <div class="totals-section">
            <div class="total-row">
              <span>Total HT :</span>
              <strong>{{ formatCurrency(totals.totalHT) }}</strong>
            </div>
            <div class="total-row">
              <span>TVA :</span>
              <strong>{{ formatCurrency(totals.totalVAT) }}</strong>
            </div>
            <div class="total-row grand-total">
              <span>Total TTC :</span>
              <strong>{{ formatCurrency(totals.totalTTC) }}</strong>
            </div>
          </div>

          <!-- Comparaison avec le devis -->
          <div v-if="quoteComparison" class="comparison-section">
            <h5>
              <i class="fas fa-balance-scale"></i>
              Comparaison avec le devis {{ quoteData.quoteNumber }}
            </h5>
            <div class="comparison-table">
              <div class="comparison-row">
                <span class="comparison-label">Devis (HT) :</span>
                <span class="comparison-value">{{ formatCurrency(quoteComparison.quoteHT) }}</span>
              </div>
              <div class="comparison-row">
                <span class="comparison-label">Accord (HT) :</span>
                <span class="comparison-value">{{ formatCurrency(quoteComparison.accordHT) }}</span>
              </div>
              <div class="comparison-row comparison-difference" :class="{
                'difference-higher': quoteComparison.isHigher,
                'difference-lower': quoteComparison.isLower,
                'difference-equal': quoteComparison.isEqual
              }">
                <span class="comparison-label">
                  <i v-if="quoteComparison.isHigher" class="fas fa-arrow-up"></i>
                  <i v-else-if="quoteComparison.isLower" class="fas fa-arrow-down"></i>
                  <i v-else class="fas fa-equals"></i>
                  Différence :
                </span>
                <span class="comparison-value">
                  {{ formatCurrency(Math.abs(quoteComparison.difference)) }}
                  <small v-if="!quoteComparison.isEqual">({{ quoteComparison.percentDifference > 0 ? '+' : '' }}{{ quoteComparison.percentDifference.toFixed(1) }}%)</small>
                </span>
              </div>
            </div>
            <div v-if="quoteComparison.isHigher" class="comparison-alert alert-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <span>L'accord est plus élevé que le devis de {{ formatCurrency(quoteComparison.difference) }}</span>
            </div>
            <div v-else-if="quoteComparison.isLower" class="comparison-alert alert-info">
              <i class="fas fa-info-circle"></i>
              <span>L'accord est moins élevé que le devis de {{ formatCurrency(Math.abs(quoteComparison.difference)) }}</span>
            </div>
            <div v-else class="comparison-alert alert-success">
              <i class="fas fa-check-circle"></i>
              <span>L'accord correspond exactement au devis</span>
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
          <button 
            v-if="!isValidated"
            type="submit" 
            class="btn-primary" 
            :disabled="saving"
          >
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
import QuoteLineEditor from '@/components/common/QuoteLineEditor.vue'
import DocumentUploader from '@/components/common/DocumentUploader.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const route = useRoute()
const { success, error, warning } = useNotification()
const { confirm } = useConfirm()

const authorizationId = computed(() => route.params.id)

// État
const loading = ref(true)
const saving = ref(false)
const validating = ref(false)
const canceling = ref(false)
const errorMessage = ref('')
const currency = ref('F CFA')
const currencyLoaded = ref(false)
const isValidated = ref(false)

// Attachments
const existingAttachments = ref([])
const newAttachments = ref([])
const previewImage = ref(null)

// Formulaire
const form = ref({
  interventionId: null,
  quoteId: null,
  authorizationDate: new Date().toISOString().split('T')[0],
  authorizedBy: null,
  specialInstructions: '',
  lines: []
})

// Données du devis pour comparaison
const quoteData = ref(null)

// Calculs automatiques
const totals = computed(() => {
  let totalHT = 0
  let totalVAT = 0

  form.value.lines.forEach(line => {
    const lineHT = parseFloat(line.lineTotal) || 0
    const lineTax = (lineHT * (parseFloat(line.taxRate) || 0)) / 100
    
    totalHT += lineHT
    totalVAT += lineTax
  })

  const totalTTC = totalHT + totalVAT

  return {
    totalHT,
    totalVAT,
    totalTTC
  }
})

// Comparaison avec le devis
const quoteComparison = computed(() => {
  if (!quoteData.value) return null
  
  const quoteTotalHT = parseFloat(quoteData.value.totalAmount) - parseFloat(quoteData.value.taxAmount || 0)
  const accordTotalHT = totals.value.totalHT
  const difference = accordTotalHT - quoteTotalHT
  const percentDifference = quoteTotalHT !== 0 ? (difference / quoteTotalHT) * 100 : 0
  
  return {
    quoteHT: quoteTotalHT,
    accordHT: accordTotalHT,
    difference,
    percentDifference,
    isHigher: difference > 0,
    isLower: difference < 0,
    isEqual: Math.abs(difference) < 0.01
  }
})

// Méthodes - Lignes
const addLine = () => {
  form.value.lines.push({
    tempId: `temp_${Date.now()}_${Math.random()}`,
    supply: null,
    supplyId: null,
    workType: 'labor',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discountPercentage: 0,
    discountAmount: 0,
    taxRate: 0,
    lineTotal: 0,
    lineNumber: form.value.lines.length + 1,
    notes: ''
  })
}

const removeLine = (index) => {
  form.value.lines.splice(index, 1)
  // Réorganiser les lineNumber
  form.value.lines.forEach((line, idx) => {
    line.lineNumber = idx + 1
  })
}

// Méthodes - Attachments
const loadAttachments = async () => {
  try {
    const response = await apiService.getWorkAuthorizationAttachments(authorizationId.value)
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
        await apiService.uploadWorkAuthorizationAttachment(authorizationId.value, doc.file)
      }
    }
    success('Pièces jointes uploadées avec succès')
  } catch (err) {
    console.error('Error uploading attachments:', err)
    warning('Erreur lors de l\'upload de certaines pièces jointes')
  }
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
    const response = await apiService.deleteWorkAuthorizationAttachment(authorizationId.value, attachment.id)
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
  return `${backendUrl}/uploads/intervention_work_authorization/${authorizationId.value}/${attachment.fileName}`
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

const formatCurrency = (value) => {
  const amount = value || 0
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency.value}`
}

// Charger la devise
const loadCurrency = async () => {
  if (currencyLoaded.value) return
  
  try {
    const response = await apiService.getCurrency()
    if (response.success && response.data) {
      currency.value = response.data.value || 'F CFA'
    }
  } catch (err) {
    console.warn('Impossible de charger la devise, utilisation de F CFA par défaut')
  } finally {
    currencyLoaded.value = true
  }
}

// Load data
const loadWorkAuthorization = async () => {
  try {
    loading.value = true
    
    const response = await apiService.getInterventionWorkAuthorization(authorizationId.value)
    
    if (response.success && response.data) {
      const auth = response.data
      
      // Charger le statut de validation
      isValidated.value = auth.isValidated || false
      
      form.value = {
        interventionId: auth.interventionId || null,
        quoteId: auth.quoteId || null,
        authorizationDate: auth.authorizationDate ? auth.authorizationDate.split(/[T\s]/)[0] : new Date().toISOString().split('T')[0],
        authorizedBy: auth.authorizedBy?.id || null,
        specialInstructions: auth.specialInstructions || '',
        lines: auth.lines ? auth.lines.map(line => ({
          id: line.id,
          tempId: `existing_${line.id}`,
          supply: line.supply || null,
          supplyId: line.supplyId || null,
          workType: line.workType || 'labor',
          description: line.description || '',
          quantity: line.quantity || 1,
          unitPrice: line.unitPrice || 0,
          discountPercentage: line.discountPercentage || 0,
          discountAmount: line.discountAmount || 0,
          taxRate: line.taxRate || 0,
          lineTotal: line.lineTotal || 0,
          lineNumber: line.lineNumber || 0,
          notes: line.notes || ''
        })) : []
      }
      
      // Charger les données du devis si présent
      if (form.value.quoteId) {
        await loadQuoteData(form.value.quoteId)
      }
      
      // Charger les attachments
      await loadAttachments()
    } else {
      throw new Error('Accord Travaux non trouvé')
    }
  } catch (err) {
    console.error('Error loading work authorization:', err)
    errorMessage.value = 'Erreur lors du chargement de l\'Accord Travaux'
    error('Erreur lors du chargement')
  } finally {
    loading.value = false
  }
}

// Charger les données du devis pour comparaison
const loadQuoteData = async (quoteId) => {
  try {
    const response = await apiService.getInterventionQuote(quoteId)
    if (response.success && response.data) {
      quoteData.value = response.data
    }
  } catch (err) {
    console.warn('Impossible de charger les données du devis:', err)
    quoteData.value = null
  }
}

// Submit
const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (!form.value.authorizedBy) {
      warning('Veuillez sélectionner la personne qui autorise')
      return
    }

    if (form.value.lines.length === 0) {
      warning('Veuillez ajouter au moins une ligne')
      return
    }

    // Vérifier que toutes les lignes ont une fourniture
    const linesWithoutSupply = form.value.lines.filter(line => !line.supplyId)
    if (linesWithoutSupply.length > 0) {
      warning('Toutes les lignes doivent avoir une fourniture associée')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      authorizationDate: form.value.authorizationDate,
      authorizedBy: form.value.authorizedBy,
      specialInstructions: form.value.specialInstructions || null,
      lines: form.value.lines.map((line, index) => ({
        supplyId: line.supplyId,
        workType: line.workType || 'labor',
        description: line.description || line.notes || '',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercentage: line.discountPercentage || null,
        discountAmount: line.discountAmount || null,
        taxRate: line.taxRate || null,
        notes: line.notes || null,
        lineNumber: index + 1
      }))
    }

    const response = await apiService.updateInterventionWorkAuthorization(authorizationId.value, data)

    if (response.success) {
      // Upload les nouvelles PJ
      if (newAttachments.value.length > 0) {
        await uploadNewAttachments()
      }
      
      success('Accord Travaux modifié avec succès')
      
      // Recharger les données au lieu de rediriger
      await loadWorkAuthorization()
    } else {
      throw new Error(response.message || 'Erreur lors de la modification')
    }
  } catch (err) {
    console.error('Error updating work authorization:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la modification'
    error('Erreur lors de la modification')
  } finally {
    saving.value = false
  }
}

// Validation de l'accord
const validateAuthorization = async () => {
  try {
    validating.value = true
    
    const response = await apiService.validateInterventionWorkAuthorization(authorizationId.value)
    
    if (response.success) {
      success('Accord Travaux validé avec succès')
      isValidated.value = true
      // Recharger les données pour mettre à jour l'interface
      await loadWorkAuthorization()
    } else {
      throw new Error(response.message || 'Erreur lors de la validation')
    }
  } catch (err) {
    console.error('Error validating work authorization:', err)
    error('Erreur lors de la validation de l\'Accord Travaux')
  } finally {
    validating.value = false
  }
}

// Annuler la validation de l'accord
const cancelValidation = async () => {
  try {
    await confirm({
      title: 'Annuler la validation',
      message: 'Êtes-vous sûr de vouloir annuler la validation de cet Accord Travaux ? L\'accord redeviendra modifiable.',
      type: 'warning',
      confirmText: 'Oui, annuler la validation',
      cancelText: 'Non, garder validé',
      confirmIcon: 'fas fa-undo'
    })
  } catch {
    return // L'utilisateur a annulé
  }
  
  try {
    canceling.value = true
    
    const response = await apiService.cancelInterventionWorkAuthorizationValidation(authorizationId.value)
    
    if (response.success) {
      success('Validation de l\'Accord Travaux annulée avec succès')
      isValidated.value = false
      // Recharger les données pour mettre à jour l'interface
      await loadWorkAuthorization()
    } else {
      throw new Error(response.message || 'Erreur lors de l\'annulation')
    }
  } catch (err) {
    console.error('Error canceling validation:', err)
    error(err.response?.data?.message || 'Erreur lors de l\'annulation de la validation')
  } finally {
    canceling.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionWorkAuthorizations' })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadCurrency(),
    loadWorkAuthorization()
  ])
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

// Styles identiques aux autres pages Edit (prédiagnostic/quote)
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

.btn-success {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  i {
    font-size: 1rem;
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

.no-items {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  margin-bottom: 1rem;

  i {
    font-size: 1.5rem;
    color: #9ca3af;
  }
}

.totals-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.95rem;
  color: #4b5563;

  &.grand-total {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 2px solid #d1d5db;
    font-size: 1.1rem;
    color: #1f2937;
    
    strong {
      color: #059669;
      font-size: 1.25rem;
    }
  }

  strong {
    font-size: 1rem;
    color: #1f2937;
  }
}

// Attachments (styles identiques)
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

// Section de comparaison avec le devis
.comparison-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 8px;

  h5 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #0369a1;

    i {
      color: #0ea5e9;
    }
  }
}

.comparison-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.95rem;

  &.comparison-difference {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 2px solid #7dd3fc;
    font-weight: 600;
    font-size: 1rem;
  }

  .comparison-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #0c4a6e;

    i {
      font-size: 0.875rem;
    }
  }

  .comparison-value {
    color: #0369a1;
    font-weight: 600;

    small {
      margin-left: 0.5rem;
      font-size: 0.85rem;
      font-weight: 500;
      opacity: 0.8;
    }
  }

  &.difference-higher {
    .comparison-label, .comparison-value {
      color: #dc2626;
    }
  }

  &.difference-lower {
    .comparison-label, .comparison-value {
      color: #059669;
    }
  }

  &.difference-equal {
    .comparison-label, .comparison-value {
      color: #0891b2;
    }
  }
}

.comparison-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;

  i {
    font-size: 1.25rem;
  }

  &.alert-warning {
    background: #fef3c7;
    border: 1px solid #fbbf24;
    color: #92400e;

    i {
      color: #f59e0b;
    }
  }

  &.alert-info {
    background: #dbeafe;
    border: 1px solid #60a5fa;
    color: #1e3a8a;

    i {
      color: #3b82f6;
    }
  }

  &.alert-success {
    background: #d1fae5;
    border: 1px solid #34d399;
    color: #065f46;

    i {
      color: #10b981;
    }
  }
}
</style>

