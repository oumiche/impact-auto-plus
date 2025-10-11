<template>
  <div class="supply-selector">
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
      <div v-if="showDropdown && (filteredSupplies.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="supply in filteredSupplies"
          :key="supply.id"
          class="dropdown-item"
          @mousedown="selectSupply(supply)"
        >
          <div class="supply-name">{{ supply.name }}</div>
          <div class="supply-details">
            <span v-if="supply.reference" class="reference">Réf: {{ supply.reference }}</span>
            <span v-if="supply.category" class="category">
              {{ typeof supply.category === 'object' ? supply.category.name : supply.category }}
            </span>
            <span v-if="supply.unitPrice" class="price">{{ formatPrice(supply.unitPrice) }}</span>
          </div>
        </div>
        <div v-if="!loading && filteredSupplies.length === 0" class="no-results">
          Aucune fourniture trouvée
        </div>
      </div>
      <button
        v-if="selectedSupply"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedSupply" class="selected-badge">
      <span class="badge-name">{{ selectedSupply.name }}</span>
      <span v-if="selectedSupply.reference" class="badge-details">Réf: {{ selectedSupply.reference }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: { type: String, default: 'Rechercher une fourniture...' },
  required: { type: Boolean, default: false },
  statusFilter: { type: String, default: 'all' } // 'all', 'active', 'inactive'
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredSupplies = ref([])
const selectedSupply = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialSupplies = ref([])
let searchTimeout = null

// Charger les 5 premières fournitures au montage
onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedSupply()
  }
  await loadInitialSupplies()
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedSupply.value || selectedSupply.value.id !== newVal)) {
    await loadSelectedSupply()
  } else if (!newVal) {
    selectedSupply.value = null
    searchQuery.value = ''
  }
})

const loadSelectedSupply = async () => {
  try {
    const result = await apiService.getSupplies({ limit: 1000 })
    if (result.success) {
      const supply = result.data.find(s => s.id === props.modelValue)
      if (supply) {
        selectedSupply.value = supply
        searchQuery.value = supply.name
      }
    }
  } catch (err) {
    console.error('Error loading selected supply:', err)
  }
}

const loadInitialSupplies = async () => {
  try {
    const params = {
      limit: 5,
      page: 1
    }
    
    if (props.statusFilter !== 'all') {
      params.isActive = props.statusFilter === 'active'
    }
    
    const result = await apiService.getSupplies(params)
    if (result.success) {
      initialSupplies.value = result.data || []
      if (!searchQuery.value) {
        filteredSupplies.value = initialSupplies.value
      }
    }
  } catch (err) {
    console.error('Error loading initial supplies:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les 5 premières fournitures
    if (searchQuery.value.length < 1) {
      filteredSupplies.value = initialSupplies.value
      return
    }

    loading.value = true
    try {
      const params = {
        search: searchQuery.value,
        limit: 20
      }
      
      if (props.statusFilter !== 'all') {
        params.isActive = props.statusFilter === 'active'
      }
      
      const result = await apiService.getSupplies(params)
      if (result.success) {
        filteredSupplies.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching supplies:', err)
      filteredSupplies.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  // Afficher les fournitures initiales si pas de recherche
  if (!searchQuery.value) {
    filteredSupplies.value = initialSupplies.value
  }
}

const selectSupply = (supply) => {
  selectedSupply.value = supply
  searchQuery.value = supply.name
  showDropdown.value = false
  emit('update:modelValue', supply.id)
  emit('change', supply)
}

const clearSelection = () => {
  selectedSupply.value = null
  searchQuery.value = ''
  filteredSupplies.value = []
  emit('update:modelValue', null)
  emit('change', null)
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const formatPrice = (price) => {
  return parseFloat(price || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}
</script>

<style scoped lang="scss">
.supply-selector {
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

        .supply-name {
          font-weight: 700;
          color: #1f2937;
        }

        .supply-details {
          font-size: 0.85rem;
          color: #6b7280;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;

          .reference {
            color: #3b82f6;
            font-family: monospace;
          }

          .category {
            color: #10b981;
          }

          .price {
            color: #f59e0b;
            font-weight: 600;
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
      font-family: monospace;
    }
  }
}
</style>

