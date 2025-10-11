<template>
  <div class="selector">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    <select v-model="selectedValue" @change="handleChange" :required="required" :disabled="disabled">
      <option :value="null">{{ placeholder }}</option>
      <option v-for="item in items" :key="item.id" :value="item.id">
        {{ item[displayField] || item.name }} {{ item.code ? `(${item.code})` : '' }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, String, null],
  apiMethod: { type: String, required: true }, // 'getVehicleColors', 'getFuelTypes', etc.
  label: String,
  placeholder: { type: String, default: 'Sélectionner' },
  required: { type: Boolean, default: false },
  displayField: { type: String, default: 'name' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const items = ref([])
const selectedValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  selectedValue.value = newVal
})

// Watcher pour re-charger les items si l'API method change
watch(() => props.apiMethod, async () => {
  await loadItems()
})

onMounted(async () => {
  await loadItems()
  // S'assurer que la valeur initiale est définie après le chargement
  if (props.modelValue !== null && props.modelValue !== undefined) {
    selectedValue.value = props.modelValue
  }
})

const loadItems = async () => {
  try {
    const response = await apiService[props.apiMethod]({ limit: 1000, status: 'active' })
    items.value = response.data || []
    
    // Re-sélectionner la valeur après le chargement si elle existe
    if (props.modelValue !== null && props.modelValue !== undefined) {
      selectedValue.value = props.modelValue
    }
  } catch (error) {
    console.error(`Error loading ${props.apiMethod}:`, error)
  }
}

const handleChange = () => {
  // Convertir en number si c'est un nombre, sinon null
  const value = selectedValue.value === null || selectedValue.value === '' 
    ? null 
    : Number(selectedValue.value)
  
  emit('update:modelValue', value)
  const selected = items.value.find(i => i.id === value)
  emit('change', selected)
}
</script>

<style scoped lang="scss">
.selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;

    .required {
      color: #ef4444;
    }
  }

  select {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s;
    cursor: pointer;
    background: white;

    &:focus {
      outline: none;
      border-color: #2563eb;
    }

    &:disabled {
      background: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}
</style>

