<template>
  <div class="file-uploader">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    
    <div
      class="upload-area"
      :class="{ 'dragging': isDragging, 'has-file': preview || modelValue }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        @change="handleFileSelect"
        hidden
      />
      
      <!-- Preview -->
      <div v-if="preview || modelValue" class="preview-container">
        <img :src="preview || modelValue" :alt="fileName" class="preview-image" />
        <div class="preview-overlay">
          <button
            type="button"
            @click.stop="removeFile"
            class="remove-btn"
            title="Supprimer"
          >
            <i class="fas fa-trash"></i>
          </button>
          <button
            type="button"
            @click.stop="triggerFileInput"
            class="change-btn"
            title="Changer"
          >
            <i class="fas fa-sync"></i>
          </button>
        </div>
      </div>
      
      <!-- Upload prompt -->
      <div v-else class="upload-prompt">
        <i class="fas fa-cloud-upload-alt upload-icon"></i>
        <div class="upload-text">
          <strong>Cliquez pour sélectionner</strong> ou glissez-déposez
        </div>
        <div class="upload-hint">
          {{ acceptLabel }}
          <span v-if="maxSizeMB"> • Max {{ maxSizeMB }}MB</span>
        </div>
      </div>
    </div>
    
    <!-- File info -->
    <div v-if="fileName" class="file-info">
      <i class="fas fa-file-image"></i>
      <span class="file-name">{{ fileName }}</span>
      <span v-if="fileSize" class="file-size">({{ formatFileSize(fileSize) }})</span>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: String, // URL ou base64
  label: String,
  accept: { type: String, default: 'image/*' },
  acceptLabel: { type: String, default: 'PNG, JPG, GIF' },
  maxSizeMB: { type: Number, default: 5 },
  required: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change', 'file'])

const fileInput = ref(null)
const preview = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const isDragging = ref(false)
const error = ref('')
const selectedFile = ref(null)

// Initialiser la preview si modelValue existe au montage
onMounted(() => {
  if (props.modelValue) {
    preview.value = props.modelValue
    if (props.modelValue.startsWith('http')) {
      const urlParts = props.modelValue.split('/')
      fileName.value = urlParts[urlParts.length - 1]
    } else if (props.modelValue.startsWith('data:')) {
      fileName.value = 'Image existante'
    }
  }
})

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    preview.value = null
    fileName.value = ''
    fileSize.value = 0
  } else if (newVal && newVal !== preview.value) {
    // Si modelValue contient une URL ou base64, l'afficher comme preview
    preview.value = newVal
    // Extraire le nom du fichier si c'est une URL
    if (newVal.startsWith('http')) {
      const urlParts = newVal.split('/')
      fileName.value = urlParts[urlParts.length - 1]
    } else if (newVal.startsWith('data:')) {
      fileName.value = 'Image existante'
    }
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file) => {
  error.value = ''
  
  // Validation du type
  if (props.accept !== '*/*' && !file.type.match(props.accept.replace('*', '.*'))) {
    error.value = `Type de fichier non accepté. Formats acceptés : ${props.acceptLabel}`
    return
  }
  
  // Validation de la taille
  const sizeMB = file.size / (1024 * 1024)
  if (props.maxSizeMB && sizeMB > props.maxSizeMB) {
    error.value = `Fichier trop volumineux. Taille max : ${props.maxSizeMB}MB`
    return
  }
  
  fileName.value = file.name
  fileSize.value = file.size
  selectedFile.value = file
  
  // Créer la prévisualisation
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target?.result
    emit('update:modelValue', e.target?.result)
    emit('change', e.target?.result)
    emit('file', file)
  }
  reader.readAsDataURL(file)
}

const removeFile = () => {
  preview.value = null
  fileName.value = ''
  fileSize.value = 0
  selectedFile.value = null
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  emit('update:modelValue', null)
  emit('change', null)
  emit('file', null)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Exposer les méthodes pour usage externe
defineExpose({
  removeFile,
  getFile: () => selectedFile.value
})
</script>

<style scoped lang="scss">
.file-uploader {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  > label {
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;

    .required {
      color: #ef4444;
    }
  }

  .upload-area {
    position: relative;
    min-height: 200px;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    background: #f9fafb;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    &:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    &.dragging {
      border-color: #3b82f6;
      background: #dbeafe;
      transform: scale(1.02);
    }

    &.has-file {
      border-style: solid;
      border-color: #10b981;
      padding: 0;
    }

    .preview-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .preview-image {
        max-width: 100%;
        max-height: 200px;
        object-fit: contain;
        border-radius: 8px;
      }

      .preview-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        opacity: 0;
        transition: opacity 0.3s;

        &:hover {
          opacity: 1;
        }

        button {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &.remove-btn {
            background: #ef4444;
            color: white;

            &:hover {
              background: #dc2626;
            }
          }

          &.change-btn {
            background: #3b82f6;
            color: white;

            &:hover {
              background: #2563eb;
            }
          }
        }
      }
    }

    .upload-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;

      .upload-icon {
        font-size: 3rem;
        color: #9ca3af;
      }

      .upload-text {
        font-size: 1rem;
        color: #4b5563;

        strong {
          color: #3b82f6;
        }
      }

      .upload-hint {
        font-size: 0.875rem;
        color: #6b7280;
      }
    }
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f3f4f6;
    border-radius: 6px;
    font-size: 0.875rem;

    i {
      color: #3b82f6;
    }

    .file-name {
      flex: 1;
      color: #1f2937;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      color: #6b7280;
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #fee2e2;
    color: #991b1b;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;

    i {
      color: #dc2626;
    }
  }
}
</style>

