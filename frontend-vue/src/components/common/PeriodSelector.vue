<template>
  <div class="period-selector">
    <div class="period-presets">
      <button
        v-for="preset in presets"
        :key="preset.value"
        class="period-btn"
        :class="{ active: modelValue === preset.value }"
        @click="selectPeriod(preset.value)"
      >
        {{ preset.label }}
      </button>
      <button
        class="period-btn"
        :class="{ active: modelValue === 'custom' }"
        @click="toggleCustom"
      >
        <i class="fas fa-calendar"></i>
        Personnalisé
      </button>
    </div>

    <!-- Custom date picker -->
    <div v-if="showCustom" class="custom-period">
      <div class="custom-period-inputs">
        <div class="form-group">
          <label>Date de début</label>
          <input
            v-model="customStart"
            type="date"
            @change="applyCustomPeriod"
          />
        </div>
        <div class="form-group">
          <label>Date de fin</label>
          <input
            v-model="customEnd"
            type="date"
            @change="applyCustomPeriod"
          />
        </div>
        <button @click="applyCustomPeriod" class="btn-apply">
          <i class="fas fa-check"></i>
          Appliquer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '30d'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const presets = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' }
]

const showCustom = ref(false)
const customStart = ref('')
const customEnd = ref('')

const selectPeriod = (value) => {
  showCustom.value = false
  emit('update:modelValue', value)
  emit('change', value)
}

const toggleCustom = () => {
  showCustom.value = !showCustom.value
  if (showCustom.value) {
    // Initialize with current dates
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    
    customEnd.value = end.toISOString().split('T')[0]
    customStart.value = start.toISOString().split('T')[0]
  }
}

const applyCustomPeriod = () => {
  if (customStart.value && customEnd.value) {
    emit('update:modelValue', 'custom')
    emit('change', {
      type: 'custom',
      start: customStart.value,
      end: customEnd.value
    })
  }
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== 'custom') {
    showCustom.value = false
  }
})
</script>

<style scoped lang="scss">
.period-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.period-presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.period-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }

  &.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  i {
    font-size: 0.875rem;
  }
}

.custom-period {
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.custom-period-inputs {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  flex: 1;

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  input {
    width: 100%;
    padding: 0.625rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

.btn-apply {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  height: fit-content;

  &:hover {
    background: #2563eb;
  }
}

// Responsive
@media (max-width: 768px) {
  .period-presets {
    justify-content: center;
  }

  .custom-period-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-apply {
    width: 100%;
    justify-content: center;
  }
}
</style>

