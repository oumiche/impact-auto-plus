<template>
  <div class="brand-selector">
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
        class="search-input"
      />
      <div v-if="showDropdown && (filteredBrands.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="brand in filteredBrands"
          :key="brand.id"
          class="dropdown-item"
          @mousedown="selectBrand(brand)"
        >
          <div class="brand-name">{{ brand.name }}</div>
        </div>
        <div v-if="!loading && filteredBrands.length === 0" class="no-results">
          Aucune marque trouvée
        </div>
      </div>
      <button
        v-if="selectedBrand"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedBrand" class="selected-badge">
      <span class="badge-name">{{ selectedBrand.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: { type: String, default: 'Rechercher une marque...' },
  required: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredBrands = ref([])
const selectedBrand = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialBrands = ref([])
let searchTimeout = null

// Charger les 10 premières marques au montage
onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedBrand()
  }
  await loadInitialBrands()
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedBrand.value || selectedBrand.value.id !== newVal)) {
    await loadSelectedBrand()
  } else if (!newVal) {
    selectedBrand.value = null
    searchQuery.value = ''
  }
})

const loadSelectedBrand = async () => {
  try {
    const result = await apiService.getBrands({ limit: 1000 })
    if (result.success) {
      const brand = result.data.find(b => b.id === props.modelValue)
      if (brand) {
        selectedBrand.value = brand
        searchQuery.value = brand.name
      }
    }
  } catch (err) {
    console.error('Error loading selected brand:', err)
  }
}

const loadInitialBrands = async () => {
  try {
    const params = {
      limit: 10,
      page: 1
    }
    
    const result = await apiService.getBrands(params)
    if (result.success) {
      initialBrands.value = result.data || []
      if (!searchQuery.value) {
        filteredBrands.value = initialBrands.value
      }
    }
  } catch (err) {
    console.error('Error loading initial brands:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les 10 premières marques
    if (searchQuery.value.length < 1) {
      filteredBrands.value = initialBrands.value
      return
    }

    loading.value = true
    try {
      const params = {
        search: searchQuery.value,
        limit: 20
      }
      
      const result = await apiService.getBrands(params)
      if (result.success) {
        filteredBrands.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching brands:', err)
      filteredBrands.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  // Afficher les marques initiales si pas de recherche
  if (!searchQuery.value) {
    filteredBrands.value = initialBrands.value
  }
}

const selectBrand = (brand) => {
  selectedBrand.value = brand
  searchQuery.value = brand.name
  showDropdown.value = false
  emit('update:modelValue', brand.id)
  emit('change', brand)
}

const clearSelection = () => {
  selectedBrand.value = null
  searchQuery.value = ''
  filteredBrands.value = []
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
.brand-selector {
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

        .brand-name {
          font-weight: 700;
          color: #1f2937;
        }

        .brand-details {
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
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 6px;
    font-size: 0.9rem;
    width: fit-content;

    .badge-name {
      font-weight: 700;
    }
  }
}
</style>

