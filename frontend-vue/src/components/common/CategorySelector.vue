<template>
  <div class="category-selector">
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
        @focus="showDropdown = true"
        @blur="handleBlur"
        class="search-input"
      />
      <div v-if="showDropdown && (filteredCategories.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="category in filteredCategories"
          :key="category.id"
          class="dropdown-item"
          @mousedown="selectCategory(category)"
        >
          <span>{{ category.name }}</span>
          <span v-if="category.description" class="description">{{ category.description }}</span>
        </div>
        <div v-if="!loading && filteredCategories.length === 0" class="no-results">
          Aucune catégorie trouvée
        </div>
      </div>
      <button
        v-if="selectedCategory"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedCategory" class="selected-badge">
      <span>{{ selectedCategory.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: { type: String, default: 'Rechercher une catégorie...' },
  required: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredCategories = ref([])
const selectedCategory = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
let searchTimeout = null

onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedCategory()
  }
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedCategory.value || selectedCategory.value.id !== newVal)) {
    await loadSelectedCategory()
  } else if (!newVal) {
    selectedCategory.value = null
    searchQuery.value = ''
  }
})

const loadSelectedCategory = async () => {
  try {
    const result = await apiService.getSupplyCategories({ limit: 1000 })
    if (result.success) {
      const category = result.data.find(c => c.id === props.modelValue)
      if (category) {
        selectedCategory.value = category
        searchQuery.value = category.name
      }
    }
  } catch (err) {
    console.error('Error loading selected category:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.length < 1) {
      filteredCategories.value = []
      return
    }

    loading.value = true
    try {
      const result = await apiService.getSupplyCategories({
        search: searchQuery.value,
        limit: 20
      })
      if (result.success) {
        filteredCategories.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching categories:', err)
      filteredCategories.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const selectCategory = (category) => {
  selectedCategory.value = category
  searchQuery.value = category.name
  showDropdown.value = false
  emit('update:modelValue', category.id)
  emit('change', category)
}

const clearSelection = () => {
  selectedCategory.value = null
  searchQuery.value = ''
  filteredCategories.value = []
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
.category-selector {
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

        .description {
          font-size: 0.85rem;
          color: #666;
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
    font-weight: 500;
    width: fit-content;

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
}
</style>

