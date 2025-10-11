<template>
  <div class="model-selector">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    <input
      v-if="required"
      type="hidden"
      :value="modelValue"
      required
    />
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        :disabled="disabled || !brandId"
        class="search-input"
        :class="{ 'disabled': disabled || !brandId }"
      />
      <div v-if="showDropdown && (filteredModels.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="model in filteredModels"
          :key="model.id"
          class="dropdown-item"
          @mousedown="selectModel(model)"
        >
          <div class="model-name">{{ model.name }}</div>
          <div class="model-details" v-if="model.brand">
            <span class="brand">{{ typeof model.brand === 'object' ? model.brand.name : model.brand }}</span>
          </div>
        </div>
        <div v-if="!loading && filteredModels.length === 0" class="no-results">
          {{ brandId ? 'Aucun modèle trouvé' : 'Sélectionnez d\'abord une marque' }}
        </div>
      </div>
      <button
        v-if="selectedModel && !disabled"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedModel" class="selected-badge">
      <span class="badge-name">{{ selectedModel.name }}</span>
      <span v-if="selectedModel.brand" class="badge-details">
        {{ typeof selectedModel.brand === 'object' ? selectedModel.brand.name : selectedModel.brand }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  brandId: [Number, null], // ID de la marque pour filtrer les modèles
  label: String,
  placeholder: { type: String, default: 'Rechercher un modèle...' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredModels = ref([])
const selectedModel = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialModels = ref([])
let searchTimeout = null

// Charger les modèles quand brandId change
watch(() => props.brandId, async (newBrandId, oldBrandId) => {
  if (newBrandId !== oldBrandId) {
    // Reset la sélection si la marque change
    if (oldBrandId !== null && oldBrandId !== undefined) {
      clearSelection()
    }
    
    if (newBrandId) {
      await loadInitialModels()
    } else {
      initialModels.value = []
      filteredModels.value = []
    }
  }
})

// Charger le modèle sélectionné au montage
onMounted(async () => {
  if (props.modelValue && props.brandId) {
    await loadSelectedModel()
  }
  if (props.brandId) {
    await loadInitialModels()
  }
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedModel.value || selectedModel.value.id !== newVal)) {
    if (props.brandId) {
      await loadSelectedModel()
    }
  } else if (!newVal) {
    selectedModel.value = null
    searchQuery.value = ''
  }
})

const loadSelectedModel = async () => {
  try {
    const params = {
      limit: 1000,
      brandId: props.brandId
    }
    const result = await apiService.getModels(params)
    if (result.success) {
      const model = result.data.find(m => m.id === props.modelValue)
      if (model) {
        selectedModel.value = model
        searchQuery.value = model.name
      }
    }
  } catch (err) {
    console.error('Error loading selected model:', err)
  }
}

const loadInitialModels = async () => {
  if (!props.brandId) {
    initialModels.value = []
    filteredModels.value = []
    return
  }
  
  try {
    const params = {
      limit: 10,
      page: 1,
      brandId: props.brandId
    }
    
    const result = await apiService.getModels(params)
    if (result.success) {
      initialModels.value = result.data || []
      if (!searchQuery.value) {
        filteredModels.value = initialModels.value
      }
    }
  } catch (err) {
    console.error('Error loading initial models:', err)
  }
}

const handleSearch = () => {
  if (!props.brandId) {
    return
  }
  
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les modèles initiaux
    if (searchQuery.value.length < 1) {
      filteredModels.value = initialModels.value
      return
    }

    loading.value = true
    try {
      const params = {
        search: searchQuery.value,
        limit: 20,
        brandId: props.brandId
      }
      
      const result = await apiService.getModels(params)
      if (result.success) {
        filteredModels.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching models:', err)
      filteredModels.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  if (!props.brandId) {
    return
  }
  
  showDropdown.value = true
  // Afficher les modèles initiaux si pas de recherche
  if (!searchQuery.value) {
    filteredModels.value = initialModels.value
  }
}

const selectModel = (model) => {
  selectedModel.value = model
  searchQuery.value = model.name
  showDropdown.value = false
  emit('update:modelValue', model.id)
  emit('change', model)
}

const clearSelection = () => {
  selectedModel.value = null
  searchQuery.value = ''
  filteredModels.value = []
  emit('update:modelValue', null)
  emit('change', null)
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<style scoped lang="scss">
.model-selector {
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

  .search-container {
    position: relative;

    .search-input {
      width: 100%;
      padding: 0.75rem;
      padding-right: 2.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #2563eb;
      }

      &:disabled,
      &.disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .clear-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: #e0e0e0;
      border: none;
      border-radius: 50%;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.2rem;
      color: #666;
      transition: all 0.2s;

      &:hover {
        background: #d0d0d0;
        color: #333;
      }
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.25rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;

      .loading,
      .no-results {
        padding: 1rem;
        text-align: center;
        color: #666;
        font-size: 0.9rem;
      }

      .dropdown-item {
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        &:hover {
          background: #f5f5f5;
        }

        .model-name {
          font-weight: 700;
          color: #1f2937;
        }

        .model-details {
          font-size: 0.85rem;
          color: #6b7280;

          .brand {
            color: #3b82f6;
          }
        }
      }
    }
  }

  .selected-badge {
    display: inline-flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 6px;
    font-size: 0.9rem;
    width: fit-content;

    .badge-name {
      font-weight: 700;
    }

    .badge-details {
      font-size: 0.8rem;
      opacity: 0.8;
    }
  }
}
</style>
