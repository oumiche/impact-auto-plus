<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="cancel">
        <div class="modal-container">
          <div class="modal-header" :class="typeClass">
            <div class="modal-icon">
              <i :class="iconClass"></i>
            </div>
            <h3>{{ title }}</h3>
          </div>
          
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          
          <div class="modal-footer">
            <button 
              @click="cancel" 
              class="btn-cancel"
              type="button"
            >
              <i class="fas fa-times"></i>
              {{ cancelText }}
            </button>
            <button 
              @click="confirm" 
              class="btn-confirm"
              :class="typeClass"
              type="button"
              autofocus
            >
              <i :class="confirmIconClass"></i>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirmation'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'warning', // 'warning', 'danger', 'info', 'success'
    validator: (value) => ['warning', 'danger', 'info', 'success'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirmer'
  },
  cancelText: {
    type: String,
    default: 'Annuler'
  },
  confirmIcon: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const typeClass = computed(() => `type-${props.type}`)

const iconClass = computed(() => {
  const icons = {
    warning: 'fas fa-exclamation-triangle',
    danger: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle',
    success: 'fas fa-check-circle'
  }
  return icons[props.type] || icons.warning
})

const confirmIconClass = computed(() => {
  if (props.confirmIcon) {
    return props.confirmIcon
  }
  const icons = {
    warning: 'fas fa-check',
    danger: 'fas fa-trash',
    info: 'fas fa-check',
    success: 'fas fa-check'
  }
  return icons[props.type] || 'fas fa-check'
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;

  &.type-warning {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    
    .modal-icon {
      background: #f59e0b;
      color: white;
    }
  }

  &.type-danger {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    
    .modal-icon {
      background: #ef4444;
      color: white;
    }
  }

  &.type-info {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    
    .modal-icon {
      background: #3b82f6;
      color: white;
    }
  }

  &.type-success {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    
    .modal-icon {
      background: #10b981;
      color: white;
    }
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 1.5rem;
  }
}

.modal-body {
  padding: 1.5rem;

  p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
    color: #4b5563;
  }
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  i {
    font-size: 1rem;
  }
}

.btn-cancel {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }
}

.btn-confirm {
  color: white;

  &.type-warning {
    background: #f59e0b;

    &:hover {
      background: #d97706;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
  }

  &.type-danger {
    background: #ef4444;

    &:hover {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
  }

  &.type-info {
    background: #3b82f6;

    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }

  &.type-success {
    background: #10b981;

    &:hover {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  }
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;

  .modal-container {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
}
</style>

