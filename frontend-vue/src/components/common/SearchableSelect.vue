<template>
  <div class="searchable-select" ref="selectRef">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    
    <div class="select-wrapper">
      <div class="select-input" @click="toggleDropdown">
        <span v-if="selectedItem" class="selected-text">
          {{ selectedItem[displayField] }} {{ selectedItem.code ? `(${selectedItem.code})` : '' }}
        </span>
        <span v-else class="placeholder">{{ placeholder }}</span>
        <span class="arrow" :class="{ open: isOpen }">▼</span>
      </div>

      <div v-if="isOpen" class="dropdown">
        <div class="search-box">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher..."
            @input="handleSearch"
            @keydown.escape="closeDropdown"
            @keydown.enter.prevent="selectFirst"
          >
        </div>

        <div class="options-list">
          <div v-if="loading" class="loading">Chargement...</div>
          <div v-else-if="filteredItems.length === 0" class="no-results">Aucun résultat</div>
          <div
            v-else
            v-for="item in filteredItems"
            :key="item.id"
            class="option"
            :class="{ selected: item.id === modelValue }"
            @click="selectItem(item)"
          >
            {{ item[displayField] }} {{ item.code ? `(${item.code})` : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Sélectionner...'
  },
  displayField: {
    type: String,
    default: 'name'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'change'])

const selectRef = ref(null)
const searchInput = ref(null)
const isOpen = ref(false)
const searchQuery = ref('')

let searchTimeout = null

const selectedItem = computed(() => {
  return props.items.find(item => item.id === props.modelValue)
})

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  
  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item => {
    return (
      item[props.displayField]?.toLowerCase().includes(query) ||
      item.code?.toLowerCase().includes(query)
    )
  })
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
}

const selectItem = (item) => {
  emit('update:modelValue', item.id)
  emit('change', item)
  closeDropdown()
}

const selectFirst = () => {
  if (filteredItems.value.length > 0) {
    selectItem(filteredItems.value[0])
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 300)
}

const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
.searchable-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;

  label {
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;

    .required {
      color: #ef4444;
    }
  }
}

.select-wrapper {
  position: relative;
}

.select-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  min-height: 48px;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .selected-text {
    color: #1e293b;
    font-weight: 500;
  }

  .placeholder {
    color: #94a3b8;
  }

  .arrow {
    color: #64748b;
    font-size: 0.75rem;
    transition: transform 0.3s;

    &.open {
      transform: rotate(180deg);
    }
  }
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 320px;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 0.95rem;

    &:focus {
      outline: none;
      border-color: #2563eb;
    }
  }
}

.options-list {
  overflow-y: auto;
  max-height: 240px;
}

.option {
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f1f5f9;

  &:hover {
    background: #f8fafc;
  }

  &.selected {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 600;
  }

  &:last-child {
    border-bottom: none;
  }
}

.loading,
.no-results {
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

.loading {
  color: #2563eb;
}
</style>

