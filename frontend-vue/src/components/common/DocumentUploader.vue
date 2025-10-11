<template>
  <div class="document-uploader">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    
    <!-- Drop zone -->
    <div 
      class="drop-zone"
      :class="{ 
        'drag-over': isDragOver,
        'has-files': documents.length > 0 
      }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file"
        :accept="accept.join(',')"
        :multiple="maxFiles > 1"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div v-if="documents.length === 0" class="drop-zone-empty">
        <i class="fas fa-cloud-upload-alt"></i>
        <p><strong>Cliquez pour sélectionner</strong> ou glissez-déposez des fichiers</p>
        <span class="file-info">
          {{ acceptLabel }} - Max {{ maxFiles }} fichier{{ maxFiles > 1 ? 's' : '' }} - {{ maxSizeMb }}MB max
        </span>
      </div>
      
      <div v-else class="drop-zone-hint">
        <i class="fas fa-plus-circle"></i>
        <span>Ajouter des fichiers</span>
      </div>
    </div>

    <!-- Documents list -->
    <div v-if="documents.length > 0" class="documents-list">
      <div 
        v-for="(doc, index) in documents" 
        :key="index"
        class="document-item"
        :class="{ 'uploading': doc.uploading, 'error': doc.error }"
      >
        <!-- Image preview -->
        <div class="document-preview">
          <img 
            v-if="isImage(doc)" 
            :src="doc.preview || doc.url" 
            :alt="doc.name"
          />
          <div v-else class="file-icon">
            <i :class="`fas ${getFileIcon(doc)}`"></i>
            <span class="file-ext">{{ getFileExtension(doc.name) }}</span>
          </div>
        </div>

        <!-- Document info -->
        <div class="document-info">
          <div class="document-name" :title="doc.name">{{ doc.name }}</div>
          <div class="document-meta">
            <span class="file-size">{{ formatSize(doc.size) }}</span>
            <span v-if="doc.uploading" class="upload-status">
              <i class="fas fa-spinner fa-spin"></i> Upload...
            </span>
            <span v-else-if="doc.error" class="upload-error">
              <i class="fas fa-exclamation-triangle"></i> {{ doc.error }}
            </span>
            <span v-else class="upload-success">
              <i class="fas fa-check-circle"></i> OK
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="document-actions">
          <button 
            v-if="isImage(doc) && (doc.preview || doc.url)" 
            type="button"
            @click.stop="previewImage(doc)" 
            class="btn-icon btn-preview" 
            title="Aperçu"
          >
            <i class="fas fa-eye"></i>
          </button>
          <button 
            type="button"
            @click.stop="removeDocument(index)" 
            class="btn-icon btn-delete" 
            title="Supprimer"
            :disabled="doc.uploading"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ errorMessage }}
    </div>

    <!-- Image preview modal -->
    <div v-if="previewingImage" class="image-preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <button class="btn-close" @click="closePreview">
          <i class="fas fa-times"></i>
        </button>
        <img :src="previewingImage.preview || previewingImage.url" :alt="previewingImage.name" />
        <div class="preview-info">
          <strong>{{ previewingImage.name }}</strong>
          <span>{{ formatSize(previewingImage.size) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: String,
  required: {
    type: Boolean,
    default: false
  },
  accept: {
    type: Array,
    default: () => ['image/*', 'application/pdf']
  },
  maxFiles: {
    type: Number,
    default: 10
  },
  maxSizeMb: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// État
const fileInput = ref(null)
const isDragOver = ref(false)
const errorMessage = ref('')
const documents = ref([...props.modelValue])
const previewingImage = ref(null)

// Computed
const acceptLabel = computed(() => {
  if (props.accept.includes('image/*')) {
    return 'Images (JPG, PNG, GIF, WebP)'
  }
  if (props.accept.includes('application/pdf')) {
    return 'PDF'
  }
  return 'Fichiers'
})

// Méthodes
const triggerFileInput = () => {
  if (documents.value.length >= props.maxFiles) {
    errorMessage.value = `Vous ne pouvez ajouter que ${props.maxFiles} fichiers maximum`
    return
  }
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
  // Reset input
  event.target.value = ''
}

const handleDrop = (event) => {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

const processFiles = async (files) => {
  errorMessage.value = ''

  // Vérifier le nombre de fichiers
  if (documents.value.length + files.length > props.maxFiles) {
    errorMessage.value = `Vous ne pouvez ajouter que ${props.maxFiles} fichiers maximum`
    return
  }

  for (const file of files) {
    // Vérifier le type
    const isValidType = props.accept.some(type => {
      if (type === 'image/*') {
        return file.type.startsWith('image/')
      }
      return file.type === type
    })

    if (!isValidType) {
      errorMessage.value = `Type de fichier non autorisé: ${file.name}`
      continue
    }

    // Vérifier la taille
    const maxSizeBytes = props.maxSizeMb * 1024 * 1024
    if (file.size > maxSizeBytes) {
      errorMessage.value = `Fichier trop volumineux: ${file.name} (max ${props.maxSizeMb}MB)`
      continue
    }

    // Créer l'objet document
    const doc = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: null,
      uploading: false,
      error: null
    }

    // Générer preview pour les images
    if (file.type.startsWith('image/')) {
      try {
        doc.preview = await readFileAsDataURL(file)
      } catch (err) {
        console.error('Error reading file:', err)
      }
    }

    documents.value.push(doc)
  }

  emitUpdate()
}

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const removeDocument = (index) => {
  documents.value.splice(index, 1)
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', documents.value)
  emit('change', documents.value)
}

const isImage = (doc) => {
  return doc.type?.startsWith('image/') || doc.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
}

const getFileIcon = (doc) => {
  if (doc.type === 'application/pdf') return 'fa-file-pdf'
  if (doc.type?.startsWith('image/')) return 'fa-file-image'
  if (doc.type?.startsWith('video/')) return 'fa-file-video'
  if (doc.type?.includes('word')) return 'fa-file-word'
  if (doc.type?.includes('excel') || doc.type?.includes('spreadsheet')) return 'fa-file-excel'
  return 'fa-file'
}

const getFileExtension = (filename) => {
  const ext = filename.split('.').pop()
  return ext.toUpperCase()
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const previewImage = (doc) => {
  previewingImage.value = doc
}

const closePreview = () => {
  previewingImage.value = null
}
</script>

<style scoped lang="scss">
.document-uploader {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
  }
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f9fafb;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.drag-over {
    border-color: #3b82f6;
    background: #dbeafe;
    transform: scale(1.02);
  }

  &.has-files {
    padding: 1rem;
  }
}

.drop-zone-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;

  i {
    font-size: 3rem;
    color: #9ca3af;
  }

  p {
    margin: 0;
    color: #4b5563;
    font-size: 1rem;

    strong {
      color: #3b82f6;
    }
  }

  .file-info {
    font-size: 0.85rem;
    color: #6b7280;
  }
}

.drop-zone-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #3b82f6;
  font-size: 0.9rem;

  i {
    font-size: 1.25rem;
  }
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.uploading {
    opacity: 0.6;
  }

  &.error {
    border-color: #fca5a5;
    background: #fef2f2;
  }
}

.document-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.file-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;

  i {
    font-size: 1.75rem;
  }

  .file-ext {
    font-size: 0.65rem;
    font-weight: 700;
  }
}

.document-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.document-name {
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6b7280;

  .upload-status {
    color: #3b82f6;
  }

  .upload-success {
    color: #10b981;
  }

  .upload-error {
    color: #ef4444;
  }
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-preview {
  color: #3b82f6;
  
  &:hover {
    background: #dbeafe;
    color: #2563eb;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #991b1b;
  font-size: 0.9rem;

  i {
    color: #dc2626;
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

.btn-close {
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

