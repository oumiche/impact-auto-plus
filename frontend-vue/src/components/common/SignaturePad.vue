<template>
  <div class="signature-pad">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    
    <div class="pad-container">
      <canvas
        ref="canvas"
        class="signature-canvas"
        :class="{ 'has-signature': hasSignature }"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="stopDrawing"
      ></canvas>
      
      <div v-if="!hasSignature && !disabled" class="pad-placeholder">
        <i class="fas fa-signature"></i>
        <span>Signez ici</span>
      </div>
    </div>

    <div class="pad-actions">
      <button 
        type="button" 
        @click="clear" 
        class="btn-clear"
        :disabled="!hasSignature || disabled"
      >
        <i class="fas fa-eraser"></i>
        Effacer
      </button>
      <span v-if="hasSignature" class="signature-info">
        <i class="fas fa-check-circle"></i>
        Signature enregistrée
      </span>
    </div>

    <div v-if="errorMessage" class="error-text">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  label: String,
  required: {
    type: Boolean,
    default: false
  },
  width: {
    type: Number,
    default: 500
  },
  height: {
    type: Number,
    default: 200
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// État
const canvas = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const hasSignature = ref(false)
const errorMessage = ref('')

// Méthodes
const initCanvas = () => {
  if (!canvas.value) return

  // Set canvas size
  canvas.value.width = props.width
  canvas.value.height = props.height

  // Get context
  ctx.value = canvas.value.getContext('2d')
  
  // Configure drawing
  ctx.value.strokeStyle = '#1f2937'
  ctx.value.lineWidth = 2
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'

  // Clear canvas
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // Load existing signature if any
  if (props.modelValue) {
    loadSignature(props.modelValue)
  }
}

const getCanvasCoordinates = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

const getTouchCoordinates = (touch) => {
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY
  }
}

const startDrawing = (e) => {
  if (props.disabled) return
  
  isDrawing.value = true
  const { x, y } = getCanvasCoordinates(e)
  
  ctx.value.beginPath()
  ctx.value.moveTo(x, y)
}

const draw = (e) => {
  if (!isDrawing.value || props.disabled) return
  
  const { x, y } = getCanvasCoordinates(e)
  
  ctx.value.lineTo(x, y)
  ctx.value.stroke()
  
  hasSignature.value = true
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  
  isDrawing.value = false
  ctx.value.closePath()
  
  if (hasSignature.value) {
    saveSignature()
  }
}

const handleTouchStart = (e) => {
  if (props.disabled) return
  
  const touch = e.touches[0]
  isDrawing.value = true
  const { x, y } = getTouchCoordinates(touch)
  
  ctx.value.beginPath()
  ctx.value.moveTo(x, y)
}

const handleTouchMove = (e) => {
  if (!isDrawing.value || props.disabled) return
  
  const touch = e.touches[0]
  const { x, y } = getTouchCoordinates(touch)
  
  ctx.value.lineTo(x, y)
  ctx.value.stroke()
  
  hasSignature.value = true
}

const clear = () => {
  if (!ctx.value || props.disabled) return
  
  // Clear canvas
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)
  
  hasSignature.value = false
  errorMessage.value = ''
  
  emit('update:modelValue', null)
  emit('change', null)
}

const saveSignature = () => {
  if (!canvas.value || !hasSignature.value) return
  
  try {
    // Convert canvas to base64
    const dataUrl = canvas.value.toDataURL('image/png')
    
    emit('update:modelValue', dataUrl)
    emit('change', dataUrl)
  } catch (error) {
    console.error('Error saving signature:', error)
    errorMessage.value = 'Erreur lors de l\'enregistrement de la signature'
  }
}

const loadSignature = (dataUrl) => {
  if (!dataUrl || !canvas.value) return
  
  const img = new Image()
  img.onload = () => {
    ctx.value.drawImage(img, 0, 0)
    hasSignature.value = true
  }
  img.onerror = () => {
    console.error('Error loading signature')
    errorMessage.value = 'Erreur lors du chargement de la signature'
  }
  img.src = dataUrl
}

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal && !hasSignature.value) {
    loadSignature(newVal)
  } else if (!newVal && hasSignature.value) {
    clear()
  }
})

// Lifecycle
onMounted(() => {
  initCanvas()
})

// Expose methods
defineExpose({
  clear,
  hasSignature
})
</script>

<style scoped lang="scss">
.signature-pad {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
  }
}

.pad-container {
  position: relative;
  display: inline-block;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.signature-canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
  
  &.has-signature {
    border-color: #10b981;
  }
}

.pad-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  pointer-events: none;
  user-select: none;

  i {
    font-size: 2.5rem;
  }

  span {
    font-size: 0.9rem;
    font-style: italic;
  }
}

.pad-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-clear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #dc2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 1rem;
  }
}

.signature-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;

  i {
    font-size: 1.1rem;
  }
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 500;
}
</style>

