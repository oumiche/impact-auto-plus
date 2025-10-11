<template>
  <div class="code-preview">
    <div class="preview-header">
      <div class="header-left">
        <i class="fas fa-eye"></i>
        <strong>{{ title }}</strong>
      </div>
      <button
        v-if="showCopyButton"
        type="button"
        @click="copyToClipboard"
        class="copy-btn"
        :class="{ 'copied': copied }"
        :title="copied ? 'Copié !' : 'Copier'"
      >
        <i :class="copied ? 'fas fa-check' : 'fas fa-copy'"></i>
        {{ copied ? 'Copié' : 'Copier' }}
      </button>
    </div>
    
    <div class="preview-content">
      <code class="generated-code">{{ generatedCode }}</code>
    </div>
    
    <div v-if="description" class="preview-footer">
      <i class="fas fa-info-circle"></i>
      {{ description }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  // Format pattern with variables
  formatPattern: String,
  
  // Options
  prefix: { type: String, default: '' },
  suffix: { type: String, default: '' },
  separator: { type: String, default: '-' },
  includeYear: { type: Boolean, default: true },
  includeMonth: { type: Boolean, default: true },
  includeDay: { type: Boolean, default: false },
  sequenceLength: { type: Number, default: 4 },
  sequenceStart: { type: Number, default: 1 },
  currentSequence: { type: Number, default: 0 },
  
  // Display options
  title: { type: String, default: 'Aperçu du code généré' },
  description: String,
  showCopyButton: { type: Boolean, default: true },
  
  // Example count
  exampleCount: { type: Number, default: 3 }
})

const emit = defineEmits(['copy'])

const copied = ref(false)
let copyTimeout = null

// Generate the code based on current settings
const generatedCode = computed(() => {
  if (!props.formatPattern) {
    return 'Aucun format défini'
  }
  
  const examples = []
  const now = new Date()
  
  for (let i = 0; i < props.exampleCount; i++) {
    let code = props.formatPattern
    
    // Get sequence number
    const sequence = (props.currentSequence || props.sequenceStart) + i
    const paddedSequence = String(sequence).padStart(props.sequenceLength, '0')
    
    // Replace variables
    const replacements = {
      '{PREFIX}': props.prefix || '',
      '{SUFFIX}': props.suffix || '',
      '{SEPARATOR}': props.separator || '',
      '{YEAR}': props.includeYear ? now.getFullYear().toString() : '',
      '{MONTH}': props.includeMonth ? String(now.getMonth() + 1).padStart(2, '0') : '',
      '{DAY}': props.includeDay ? String(now.getDate()).padStart(2, '0') : '',
      '{SEQUENCE}': paddedSequence,
      '{SEQ}': paddedSequence
    }
    
    // Apply replacements
    Object.entries(replacements).forEach(([variable, value]) => {
      code = code.replace(new RegExp(variable, 'g'), value)
    })
    
    // Clean up multiple separators
    if (props.separator) {
      const sepRegex = new RegExp(`${escapeRegex(props.separator)}+`, 'g')
      code = code.replace(sepRegex, props.separator)
      
      // Remove leading/trailing separators
      code = code.replace(new RegExp(`^${escapeRegex(props.separator)}+|${escapeRegex(props.separator)}+$`, 'g'), '')
    }
    
    examples.push(code)
  }
  
  return examples.join('\n')
})

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    copied.value = true
    emit('copy', generatedCode.value)
    
    if (copyTimeout) clearTimeout(copyTimeout)
    copyTimeout = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Watch for changes and notify
watch(generatedCode, (newCode) => {
  emit('update:preview', newCode)
})
</script>

<style scoped lang="scss">
.code-preview {
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #374151;
      font-size: 0.95rem;

      i {
        color: #3b82f6;
      }

      strong {
        font-weight: 700;
      }
    }

    .copy-btn {
      padding: 0.375rem 0.875rem;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 6px;
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

      &:hover {
        background: #f9fafb;
        border-color: #3b82f6;
        color: #3b82f6;
      }

      &.copied {
        background: #10b981;
        border-color: #10b981;
        color: white;

        &:hover {
          background: #059669;
          border-color: #059669;
        }
      }
    }
  }

  .preview-content {
    padding: 1.5rem;
    background: #1f2937;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;

    .generated-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 1.1rem;
      font-weight: 700;
      color: #10b981;
      text-align: center;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.8;
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
      letter-spacing: 0.5px;
    }
  }

  .preview-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #eff6ff;
    border-top: 1px solid #bfdbfe;
    color: #1e40af;
    font-size: 0.85rem;

    i {
      color: #3b82f6;
      flex-shrink: 0;
    }
  }
}
</style>

