<template>
  <div class="json-editor">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    
    <div class="editor-container">
      <textarea
        v-model="jsonText"
        @input="handleInput"
        @blur="handleBlur"
        :placeholder="placeholder"
        :rows="rows"
        :class="{ 'has-error': error, 'is-valid': isValid && jsonText }"
        class="json-textarea"
      ></textarea>
      
      <div class="editor-toolbar">
        <button
          type="button"
          @click="formatJson"
          class="toolbar-btn"
          :disabled="!canFormat"
          title="Formater (Ctrl+Shift+F)"
        >
          <i class="fas fa-align-left"></i>
          Formater
        </button>
        
        <button
          type="button"
          @click="minifyJson"
          class="toolbar-btn"
          :disabled="!canFormat"
          title="Minifier"
        >
          <i class="fas fa-compress"></i>
          Minifier
        </button>
        
        <button
          type="button"
          @click="clearJson"
          class="toolbar-btn"
          :disabled="!jsonText"
          title="Effacer"
        >
          <i class="fas fa-trash"></i>
          Effacer
        </button>
        
        <div class="toolbar-status">
          <span v-if="isValid && jsonText" class="status-valid">
            <i class="fas fa-check-circle"></i>
            JSON valide
          </span>
          <span v-if="error" class="status-error">
            <i class="fas fa-exclamation-circle"></i>
            JSON invalide
          </span>
          <span v-if="!jsonText" class="status-empty">
            <i class="fas fa-info-circle"></i>
            Vide
          </span>
        </div>
      </div>
    </div>
    
    <!-- Error details -->
    <div v-if="error" class="error-message">
      <div class="error-header">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Erreur de syntaxe JSON</strong>
      </div>
      <div class="error-details">{{ error }}</div>
    </div>
    
    <!-- Preview -->
    <div v-if="isValid && jsonText && showPreview" class="json-preview">
      <div class="preview-header">
        <i class="fas fa-eye"></i>
        <strong>Aperçu</strong>
      </div>
      <pre class="preview-content">{{ formattedPreview }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Object, Array, String, null],
    default: null
  },
  label: String,
  placeholder: { type: String, default: '{\n  "key": "value"\n}' },
  rows: { type: Number, default: 10 },
  required: { type: Boolean, default: false },
  showPreview: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'change', 'valid', 'invalid'])

const jsonText = ref('')
const error = ref('')
const isValid = ref(false)

// Initialiser avec la valeur du modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== null && newVal !== undefined) {
    try {
      jsonText.value = typeof newVal === 'string' ? newVal : JSON.stringify(newVal, null, 2)
      validateJson()
    } catch (err) {
      jsonText.value = ''
    }
  } else {
    jsonText.value = ''
  }
}, { immediate: true })

const canFormat = computed(() => {
  return isValid.value && jsonText.value.trim().length > 0
})

const formattedPreview = computed(() => {
  if (!isValid.value || !jsonText.value) return ''
  try {
    return JSON.stringify(JSON.parse(jsonText.value), null, 2)
  } catch {
    return ''
  }
})

const handleInput = () => {
  validateJson()
}

const handleBlur = () => {
  if (jsonText.value.trim() && isValid.value) {
    // Auto-format on blur if valid
    try {
      const parsed = JSON.parse(jsonText.value)
      jsonText.value = JSON.stringify(parsed, null, 2)
    } catch {
      // Ignore if parsing fails
    }
  }
}

const validateJson = () => {
  error.value = ''
  isValid.value = false
  
  if (!jsonText.value.trim()) {
    emit('update:modelValue', null)
    emit('change', null)
    return
  }
  
  try {
    const parsed = JSON.parse(jsonText.value)
    isValid.value = true
    emit('update:modelValue', parsed)
    emit('change', parsed)
    emit('valid', parsed)
  } catch (err) {
    error.value = err.message
    emit('invalid', err.message)
  }
}

const formatJson = () => {
  if (!canFormat.value) return
  
  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    validateJson()
  } catch (err) {
    error.value = err.message
  }
}

const minifyJson = () => {
  if (!canFormat.value) return
  
  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed)
    validateJson()
  } catch (err) {
    error.value = err.message
  }
}

const clearJson = () => {
  jsonText.value = ''
  error.value = ''
  isValid.value = false
  emit('update:modelValue', null)
  emit('change', null)
}

// Raccourci clavier Ctrl+Shift+F pour formater
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault()
      formatJson()
    }
  })
}

defineExpose({
  formatJson,
  minifyJson,
  clearJson,
  validate: validateJson
})
</script>

<style scoped lang="scss">
.json-editor {
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

  .editor-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: white;

    .json-textarea {
      width: 100%;
      padding: 1rem;
      border: none;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      resize: vertical;
      background: #f9fafb;
      color: #1f2937;
      transition: all 0.3s;

      &:focus {
        outline: none;
        background: white;
      }

      &.has-error {
        background: #fef2f2;
      }

      &.is-valid {
        background: #f0fdf4;
      }

      &::placeholder {
        color: #9ca3af;
        opacity: 0.7;
      }
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f3f4f6;
      border-top: 1px solid #e5e7eb;

      .toolbar-btn {
        padding: 0.375rem 0.75rem;
        border: 1px solid #d1d5db;
        background: white;
        color: #374151;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.375rem;

        i {
          font-size: 0.75rem;
        }

        &:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      .toolbar-status {
        margin-left: auto;
        font-size: 0.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.375rem;

        .status-valid {
          color: #059669;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-error {
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-empty {
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
      }
    }
  }

  .error-message {
    padding: 0.875rem;
    background: #fee2e2;
    border: 2px solid #fca5a5;
    border-radius: 6px;

    .error-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #991b1b;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;

      i {
        color: #dc2626;
      }
    }

    .error-details {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.8rem;
      color: #7f1d1d;
      padding-left: 1.5rem;
    }
  }

  .json-preview {
    padding: 1rem;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;

    .preview-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #374151;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;

      i {
        color: #3b82f6;
      }
    }

    .preview-content {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.8rem;
      color: #1f2937;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: white;
      padding: 0.75rem;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
  }
}
</style>

