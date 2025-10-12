<template>
  <div class="searchable-selector">
    <label v-if="label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <div class="selector-input-wrapper" :class="{ open: showDropdown, disabled }">
      <input
        ref="searchInput"
        v-model="displayValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.down="navigateDown"
        @keydown.up="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="closeDropdown"
      />
      
      <div class="selector-icons">
        <button
          v-if="selectedItem && !disabled"
          type="button"
          class="btn-clear"
          @mousedown.prevent="clearSelection"
          title="Effacer"
        >
          <i class="fas fa-times"></i>
        </button>
        <i class="fas fa-search selector-icon"></i>
      </div>

      <!-- Dropdown -->
      <div v-if="showDropdown" class="dropdown">
        <!-- Loading -->
        <div v-if="loading" class="dropdown-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Recherche...</span>
        </div>

        <!-- Results -->
        <div v-else-if="filteredItems.length > 0" class="dropdown-items">
          <div
            v-for="(item, index) in filteredItems"
            :key="item.id"
            class="dropdown-item"
            :class="{ 
              highlighted: index === highlightedIndex,
              selected: modelValue === item.id
            }"
            @mousedown.prevent="selectItem(item)"
            @mouseenter="highlightedIndex = index"
          >
            <span class="item-text">{{ getDisplayText(item) }}</span>
            <i v-if="modelValue === item.id" class="fas fa-check item-check"></i>
          </div>
        </div>

        <!-- No results -->
        <div v-else class="dropdown-empty">
          <i class="fas fa-search"></i>
          <span>Aucun résultat</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  apiMethod: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Rechercher...'
  },
  required: {
    type: Boolean,
    default: false
  },
  displayField: {
    type: String,
    default: 'name'
  },
  secondaryField: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  minChars: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// State
const searchQuery = ref('')
const items = ref([])
const selectedItem = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const highlightedIndex = ref(0)
const searchInput = ref(null)

let searchTimeout = null

// Computed
const displayValue = computed({
  get: () => {
    if (showDropdown.value) {
      return searchQuery.value
    }
    return selectedItem.value ? getDisplayText(selectedItem.value) : ''
  },
  set: (value) => {
    searchQuery.value = value
  }
})

const filteredItems = computed(() => {
  return items.value
})

// Methods
const handleInput = (event) => {
  searchQuery.value = event.target.value
  handleSearch()
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.length >= props.minChars) {
      await loadItems(searchQuery.value)
      showDropdown.value = true
      highlightedIndex.value = 0
    } else if (searchQuery.value.length === 0) {
      await loadItems('')
      showDropdown.value = true
    }
  }, 300)
}

const handleFocus = () => {
  if (!props.disabled) {
    searchQuery.value = ''
    loadItems('')
    showDropdown.value = true
  }
}

const handleBlur = () => {
  // Delay pour permettre le click sur item
  setTimeout(() => {
    showDropdown.value = false
    searchQuery.value = ''
  }, 200)
}

const loadItems = async (search = '') => {
  try {
    loading.value = true
    
    const params = {
      limit: 50,
      search: search
    }

    const response = await apiService[props.apiMethod](params)
    items.value = response.data || []
    
  } catch (error) {
    console.error(`Error loading ${props.apiMethod}:`, error)
    items.value = []
  } finally {
    loading.value = false
  }
}

const selectItem = (item) => {
  selectedItem.value = item
  searchQuery.value = ''
  showDropdown.value = false
  
  emit('update:modelValue', item.id)
  emit('change', item)
}

const clearSelection = () => {
  selectedItem.value = null
  searchQuery.value = ''
  emit('update:modelValue', null)
  emit('change', null)
}

const closeDropdown = () => {
  showDropdown.value = false
  searchQuery.value = ''
}

const navigateDown = () => {
  if (highlightedIndex.value < filteredItems.value.length - 1) {
    highlightedIndex.value++
  }
}

const navigateUp = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

const selectHighlighted = () => {
  if (filteredItems.value[highlightedIndex.value]) {
    selectItem(filteredItems.value[highlightedIndex.value])
  }
}

const getDisplayText = (item) => {
  if (!item) return ''
  
  let text = item[props.displayField] || item.name || ''
  
  if (props.secondaryField && item[props.secondaryField]) {
    text += ` - ${item[props.secondaryField]}`
  }
  
  if (item.code) {
    text += ` (${item.code})`
  }
  
  return text
}

// Load selected item on mount
const loadSelectedItem = async () => {
  if (props.modelValue) {
    try {
      // Charger tous les items pour trouver celui sélectionné
      const response = await apiService[props.apiMethod]({ limit: 1000, search: '' })
      const item = (response.data || []).find(i => i.id == props.modelValue) // == pour gérer string vs number
      if (item) {
        selectedItem.value = item
      }
    } catch (error) {
      console.error('Error loading selected item:', error)
    }
  }
}

// Watch modelValue changes
watch(() => props.modelValue, async (newValue) => {
  if (newValue && newValue !== selectedItem.value?.id) {
    await loadSelectedItem()
  } else if (!newValue) {
    selectedItem.value = null
    searchQuery.value = ''
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  // Le watch immediate s'occupe du chargement initial
})
</script>

<style scoped lang="scss">
.searchable-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;

  label {
    font-weight: 600;
    color: #374151;
    font-size: 0.95rem;

    .required {
      color: #ef4444;
    }
  }
}

.selector-input-wrapper {
  position: relative;

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    background: white;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &:disabled {
      background: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  &.open input {
    border-color: #3b82f6;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.selector-icons {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-clear {
  padding: 0.25rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;

  &:hover {
    color: #ef4444;
  }

  i {
    font-size: 0.875rem;
  }
}

.selector-icon {
  color: #9ca3af;
  font-size: 0.875rem;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  background: white;
  border: 2px solid #3b82f6;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  overflow-y: auto;
}

.dropdown-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: #6b7280;

  i {
    color: #3b82f6;
  }
}

.dropdown-items {
  padding: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover,
  &.highlighted {
    background: #eff6ff;
  }

  &.selected {
    background: #dbeafe;
    
    .item-text {
      font-weight: 600;
      color: #1e40af;
    }
  }

  .item-text {
    color: #1f2937;
    font-size: 0.95rem;
  }

  .item-check {
    color: #3b82f6;
    font-size: 0.875rem;
  }
}

.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #9ca3af;

  i {
    font-size: 2rem;
  }

  span {
    font-size: 0.95rem;
  }
}

.selected-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 500;

  i {
    font-size: 0.875rem;
  }
}

// Scrollbar styling
.dropdown::-webkit-scrollbar {
  width: 8px;
}

.dropdown::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.dropdown::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;

  &:hover {
    background: #9ca3af;
  }
}
</style>

