<template>
  <div>
    <!-- Overlay -->
    <Transition name="fade">
      <div 
        v-if="modelValue" 
        class="filter-overlay" 
        @click="close"
      ></div>
    </Transition>

    <!-- Panel -->
    <Transition name="slide-right">
      <div v-if="modelValue" class="filter-panel">
      <!-- Header -->
      <div class="panel-header">
        <h3>
          <i class="fas fa-filter"></i>
          Filtres Avancés
          <span v-if="activeFiltersCount > 0" class="filters-count">{{ activeFiltersCount }}</span>
        </h3>
        <button class="btn-close" @click="close" type="button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="panel-body">
        <slot></slot>
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <button type="button" @click="resetFilters" class="btn-reset">
          <i class="fas fa-undo"></i>
          Réinitialiser
        </button>
        <button type="button" @click="applyFilters" class="btn-apply">
          <i class="fas fa-check"></i>
          Appliquer
        </button>
      </div>
    </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  activeFiltersCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'apply', 'reset'])

const close = () => {
  emit('update:modelValue', false)
}

const applyFilters = () => {
  emit('apply')
  close()
}

const resetFilters = () => {
  emit('reset')
}
</script>

<style scoped lang="scss">
.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.filter-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 90vw;
  background: white;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;

  h3 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;

    i {
      color: #3b82f6;
      font-size: 1.25rem;
    }
  }

  .filters-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .btn-close {
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 1.25rem;
    }

    &:hover {
      background: #f3f4f6;
      color: #1f2937;
    }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;

    &:hover {
      background: #9ca3af;
    }
  }
}

.panel-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;

  button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    i {
      font-size: 1rem;
    }
  }

  .btn-reset {
    background: #f3f4f6;
    color: #6b7280;

    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }

  .btn-apply {
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  }
}

// Animations
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .filter-panel {
    width: 100%;
    max-width: 100vw;
  }
}
</style>

