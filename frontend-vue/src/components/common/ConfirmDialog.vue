<template>
  <Modal
    v-model="isVisible"
    :title="title"
    size="small"
    :close-on-overlay="!loading"
  >
    <div class="confirm-content">
      <p class="confirm-message">{{ message }}</p>
      <p v-if="warning" class="confirm-warning">{{ warning }}</p>
    </div>

    <template #footer>
      <button @click="cancel" class="btn-secondary" :disabled="loading">
        {{ cancelText }}
      </button>
      <button @click="confirm" :class="confirmButtonClass" :disabled="loading">
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
        {{ loading ? loadingText : confirmText }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirmation'
  },
  message: {
    type: String,
    required: true
  },
  warning: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'danger', // 'danger', 'warning', 'info'
    validator: (value) => ['danger', 'warning', 'info'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirmer'
  },
  cancelText: {
    type: String,
    default: 'Annuler'
  },
  loadingText: {
    type: String,
    default: 'En cours...'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const confirmButtonClass = computed(() => {
  const classes = {
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-primary'
  }
  return classes[props.type]
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.confirm-content {
  padding: 0.5rem 0;
}

.confirm-message {
  font-size: 1rem;
  color: #374151;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.confirm-warning {
  font-size: 0.9rem;
  color: #dc2626;
  margin: 0;
  font-style: italic;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 0.9rem;
  }
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;

  &:hover:not(:disabled) {
    background: #e5e7eb;
  }
}

.btn-danger {
  background: #dc2626;
  color: white;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }
}

.btn-warning {
  background: #f59e0b;
  color: white;

  &:hover:not(:disabled) {
    background: #d97706;
  }
}

.btn-primary {
  background: #3b82f6;
  color: white;

  &:hover:not(:disabled) {
    background: #2563eb;
  }
}
</style>

