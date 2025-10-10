<template>
  <SearchableSelect
    :model-value="modelValue"
    :items="brands"
    :loading="loading"
    :label="label"
    :placeholder="placeholder"
    :required="required"
    display-field="name"
    @update:model-value="handleUpdate"
    @search="handleSearch"
    @change="handleChange"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SearchableSelect from './SearchableSelect.vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  label: {
    type: String,
    default: 'Marque'
  },
  placeholder: {
    type: String,
    default: 'Sélectionner une marque'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const brands = ref([])
const loading = ref(false)

onMounted(async () => {
  await loadBrands()
})

const loadBrands = async (search = '') => {
  try {
    loading.value = true
    const params = { limit: 50, status: 'active' }
    if (search) params.search = search
    
    const response = await apiService.getMarques(params)
    brands.value = response.data || []
  } catch (error) {
    console.error('Error loading brands:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = (query) => {
  loadBrands(query)
}

const handleUpdate = (value) => {
  emit('update:modelValue', value)
}

const handleChange = (item) => {
  emit('change', item)
}
</script>
