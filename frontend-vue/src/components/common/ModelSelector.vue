<template>
  <div class="selector">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    <select v-model="selectedValue" @change="handleChange" :required="required" :disabled="!brandId && filterByBrand">
      <option value="">{{ placeholder }}</option>
      <option v-for="model in filteredModels" :key="model.id" :value="model.id">
        {{ model.name }} {{ model.code ? `(${model.code})` : '' }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, String, null],
  brandId: [Number, String, null],
  filterByBrand: { type: Boolean, default: true },
  label: { type: String, default: 'Modèle' },
  placeholder: { type: String, default: 'Sélectionner un modèle' },
  required: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const models = ref([])
const selectedValue = ref(props.modelValue)

const filteredModels = computed(() => {
  if (!props.filterByBrand || !props.brandId) return models.value
  return models.value.filter(m => m.brand?.id == props.brandId)
})

watch(() => props.modelValue, (newVal) => {
  selectedValue.value = newVal
})

watch(() => props.brandId, () => {
  if (props.filterByBrand) {
    selectedValue.value = ''
    emit('update:modelValue', '')
  }
})

onMounted(async () => {
  await loadModels()
})

const loadModels = async () => {
  try {
    const response = await apiService.getModeles({ limit: 1000, status: 'active' })
    models.value = response.data || []
  } catch (error) {
    console.error('Error loading models:', error)
  }
}

const handleChange = () => {
  emit('update:modelValue', selectedValue.value)
  const selected = filteredModels.value.find(m => m.id == selectedValue.value)
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
      background: #f5f5f5;
      cursor: not-allowed;
    }
  }
}
</style>

