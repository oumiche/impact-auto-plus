<template>
  <div class="selector">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    <select v-model="selectedValue" @change="handleChange" :required="required">
      <option value="">{{ placeholder }}</option>
      <option v-for="item in items" :key="item.id" :value="item.id">
        {{ item.name }} {{ item.code ? `(${item.code})` : '' }}
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
  required: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const items = ref([])
const selectedValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  selectedValue.value = newVal
})

onMounted(async () => {
  await loadItems()
})

const loadItems = async () => {
  try {
    const response = await apiService[props.apiMethod]({ limit: 1000, status: 'active' })
    items.value = response.data || []
  } catch (error) {
    console.error(`Error loading ${props.apiMethod}:`, error)
  }
}

const handleChange = () => {
  emit('update:modelValue', selectedValue.value)
  const selected = items.value.find(i => i.id == selectedValue.value)
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
  }
}
</style>

