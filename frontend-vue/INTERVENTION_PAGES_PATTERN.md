# Pattern - Pages Create/Edit avec Pièces Jointes

**Date**: 11 octobre 2025  
**Basé sur**: Analyse de l'ancien système HTML + Backend

---

## 🔍 Analyse du système existant

### Backend - Endpoints Attachments

**Pour CHAQUE module** (Prédiagnostics, Quotes, WorkAuthorizations, ReceptionReports, Invoices) :

```php
// Upload
POST /api/intervention-XXX/{id}/attachments
Body (FormData): { file: File, description: String }
Response: { success, data: { id, fileName, originalName, mimeType, size, url, uploadedBy, createdAt } }

// Liste
GET /api/intervention-XXX/{id}/attachments
Response: { success, data: [{ id, fileName, originalName, mimeType, size, url, uploadedBy, createdAt }] }

// Suppression
DELETE /api/intervention-XXX/{id}/attachments/{fileId}
Response: { success, message }
```

**Service utilisé** : `FileUploadService`  
**Stockage** : `/uploads/{entityType}/{entityId}/`  
**URL** : `http://127.0.0.1:8000/uploads/{entityType}/{entityId}/{fileName}`

---

## 📄 Structure des pages Create/Edit

### Pattern recommandé

```vue
<template>
  <DefaultLayout>
    <!-- Header avec breadcrumb -->
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'ListPage' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>{{ isEditMode ? 'Modifier' : 'Nouveau' }} XXX</h1>
      <p>{{ isEditMode ? 'Modifiez les informations' : 'Créez un nouveau document' }}</p>
    </template>

    <!-- Contenu principal -->
    <div class="form-page-container">
      <form @submit.prevent="handleSubmit" class="form-page">
        <!-- Sections du formulaire existantes -->
        
        <!-- Section pièces jointes (EDIT MODE uniquement) -->
        <div v-if="isEditMode" class="form-section">
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
                <button 
                  type="button" 
                  @click="viewAttachment(attachment)" 
                  class="btn-preview"
                  title="Voir"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <!-- File icon -->
              <div v-else class="attachment-icon">
                <i :class="getFileIcon(attachment.mimeType)"></i>
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
                  class="btn-icon" 
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
            <h5>Ajouter des pièces jointes</h5>
            <DocumentUploader
              v-model="newAttachments"
              :max-files="10"
              :max-size-mb="10"
              @change="handleNewAttachments"
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
  </DefaultLayout>
</template>
```

---

## 🔧 Logique JavaScript

### État
```javascript
// Mode
const route = useRoute()
const router = useRouter()
const isEditMode = computed(() => route.name.includes('Edit'))
const entityId = computed(() => route.params.id)

// Attachments
const existingAttachments = ref([])
const newAttachments = ref([])
const uploadingAttachments = ref(false)
```

### Méthodes

```javascript
// Chargement (EDIT MODE)
const loadAttachments = async () => {
  if (!isEditMode.value) return
  
  try {
    const response = await apiService.getPrediagnosticAttachments(entityId.value)
    if (response.success) {
      existingAttachments.value = response.data || []
    }
  } catch (error) {
    console.error('Error loading attachments:', error)
  }
}

// Upload des nouvelles PJ (après création de l'entité)
const uploadNewAttachments = async (prediagnosticId) => {
  if (newAttachments.value.length === 0) return
  
  try {
    uploadingAttachments.value = true
    
    for (const doc of newAttachments.value) {
      if (doc.file) {
        await apiService.uploadPrediagnosticAttachment(prediagnosticId, doc.file)
      }
    }
    
    success('Pièces jointes uploadées avec succès')
  } catch (error) {
    warning('Erreur lors de l\'upload de certaines pièces jointes')
  } finally {
    uploadingAttachments.value = false
  }
}

// Suppression
const confirmDeleteAttachment = async (attachment) => {
  if (!confirm(`Supprimer ${attachment.originalName} ?`)) return
  
  try {
    const response = await apiService.deletePrediagnosticAttachment(entityId.value, attachment.id)
    if (response.success) {
      success('Pièce jointe supprimée')
      await loadAttachments()
    }
  } catch (error) {
    error('Erreur lors de la suppression')
  }
}

// Workflow de soumission
const handleSubmit = async () => {
  try {
    saving.value = true
    
    // 1. Créer/modifier l'entité
    let response
    if (isEditMode.value) {
      response = await apiService.updatePrediagnostic(entityId.value, data)
    } else {
      response = await apiService.createPrediagnostic(data)
    }
    
    if (!response.success) throw new Error(response.message)
    
    const savedId = isEditMode.value ? entityId.value : response.data.id
    
    // 2. Upload les nouvelles PJ (CREATE et EDIT)
    if (newAttachments.value.length > 0) {
      await uploadNewAttachments(savedId)
    }
    
    success(isEditMode.value ? 'Modifié avec succès' : 'Créé avec succès')
    
    // 3. Retour à la liste
    router.push({ name: 'InterventionPrediagnostics' })
    
  } catch (err) {
    error(err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

// Helpers
const getAttachmentUrl = (attachment) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://iautobackend.zeddev01.com/api'
  const backendUrl = apiUrl.replace('/api', '')
  return `${backendUrl}/uploads/${entityType}/${entityId.value}/${attachment.fileName}`
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

const goBack = () => {
  router.push({ name: 'InterventionPrediagnostics' })
}
```

---

## 🎨 Styles SCSS

```scss
.form-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.form-page {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  
  &:hover {
    color: #2563eb;
    text-decoration: underline;
  }
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
    cursor: pointer;
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
    
    &:hover {
      opacity: 1;
    }
  }
  
  .preview-btn {
    padding: 0.75rem 1.25rem;
    background: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.25rem;
    color: #3b82f6;
  }
}

.attachment-icon {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  
  i {
    font-size: 4rem;
    color: #9ca3af;
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
}

.upload-section {
  margin-top: 1.5rem;
  
  h5 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
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
```

---

## 📦 API Methods à ajouter

### Dans api.service.js

```javascript
// ==================== ATTACHMENTS - PREDIAGNOSTICS ====================

async uploadPrediagnosticAttachment(prediagnosticId, file, description = '') {
  const formData = new FormData()
  formData.append('file', file)
  if (description) formData.append('description', description)
  
  const response = await apiClient.post(
    `/intervention-prediagnostics/${prediagnosticId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
},

async getPrediagnosticAttachments(prediagnosticId) {
  const response = await apiClient.get(`/intervention-prediagnostics/${prediagnosticId}/attachments`)
  return response.data
},

async deletePrediagnosticAttachment(prediagnosticId, attachmentId) {
  const response = await apiClient.delete(`/intervention-prediagnostics/${prediagnosticId}/attachments/${attachmentId}`)
  return response.data
},

// Même pattern pour Quotes, WorkAuthorizations, ReceptionReports, Invoices
```

---

## 🗺️ Routes à ajouter

```javascript
// Prédiagnostics
{
  path: '/intervention-prediagnostics/create',
  name: 'InterventionPrediagnosticCreate',
  component: () => import('@/views/InterventionPrediagnosticCreate.vue'),
  meta: { requiresAuth: true, requiresTenant: true }
},
{
  path: '/intervention-prediagnostics/:id/edit',
  name: 'InterventionPrediagnosticEdit',
  component: () => import('@/views/InterventionPrediagnosticEdit.vue'),
  meta: { requiresAuth: true, requiresTenant: true }
},

// Répéter pour les 4 autres modules...
```

---

## 🔄 Modifications des pages liste

### Exemple : InterventionPrediagnostics.vue

**Retirer le modal**, modifier les boutons :

```vue
<!-- Bouton "Nouveau" -->
<button @click="goToCreate" class="btn-primary">
  <i class="fas fa-plus"></i>
  Nouveau prédiagnostic
</button>

<!-- Dans le tableau, bouton "Modifier" -->
<button @click="goToEdit(prediag.id)" class="btn-icon btn-edit">
  <i class="fas fa-edit"></i>
</button>

<!-- Méthodes -->
const goToCreate = () => {
  router.push({ name: 'InterventionPrediagnosticCreate' })
}

const goToEdit = (id) => {
  router.push({ name: 'InterventionPrediagnosticEdit', params: { id } })
}
```

---

## 📊 Estimation du travail

### Par module (2 pages)
- Create page : 30 min
- Edit page : 30 min (+ gestion attachments : +15 min)
- API methods : 5 min
- Routes : 5 min
- Tests : 10 min
**Total par module** : ~1h30

### 5 modules
**Total** : ~7-8 heures

---

## 🎯 Plan d'action recommandé

### Étape 1 : Module exemple (1h30)
1. Créer InterventionPrediagnosticCreate.vue
2. Créer InterventionPrediagnosticEdit.vue (avec attachments)
3. Ajouter les API methods
4. Ajouter les routes
5. Modifier InterventionPrediagnostics.vue (liste)
6. **Vous testez et validez le pattern** ✅

### Étape 2 : Duplication (3-4h)
7. Dupliquer le pattern pour Quotes
8. Dupliquer pour WorkAuthorizations
9. Dupliquer pour ReceptionReports
10. Dupliquer pour Invoices

### Étape 3 : Finalisation (1h)
11. Tests de tous les modules
12. Documentation
13. Corrections

---

## 💡 Recommandation

**Je commence par créer le module Prédiagnostics complet** (create + edit avec attachments) ?

Cela vous permettra de :
- ✅ Valider le pattern
- ✅ Tester la gestion des pièces jointes
- ✅ Voir si des ajustements sont nécessaires
- ✅ Puis je duplique rapidement pour les 4 autres modules

Voulez-vous que je commence maintenant ?

