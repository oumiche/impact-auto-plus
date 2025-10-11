<template>
  <div class="driver-selector">
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
      <div v-if="showDropdown && (filteredDrivers.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="driver in filteredDrivers"
          :key="driver.id"
          class="dropdown-item"
          @mousedown="selectDriver(driver)"
        >
          <div class="driver-name">{{ driver.firstName }} {{ driver.lastName }}</div>
          <div class="driver-details">
            <span v-if="driver.licenseNumber">Permis: {{ driver.licenseNumber }}</span>
            <span v-if="driver.email"> • {{ driver.email }}</span>
          </div>
        </div>
        <div v-if="!loading && filteredDrivers.length === 0" class="no-results">
          Aucun conducteur trouvé
        </div>
      </div>
      <button
        v-if="selectedDriver"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedDriver" class="selected-badge">
      <span class="badge-name">{{ selectedDriver.firstName }} {{ selectedDriver.lastName }}</span>
      <span v-if="selectedDriver.licenseNumber" class="badge-details">Permis: {{ selectedDriver.licenseNumber }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: { type: String, default: 'Rechercher un conducteur...' },
  required: { type: Boolean, default: false },
  statusFilter: { type: String, default: 'active' } // 'all', 'active', etc.
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredDrivers = ref([])
const selectedDriver = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialDrivers = ref([])
let searchTimeout = null

// Charger les 5 premiers conducteurs au montage
onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedDriver()
  }
  await loadInitialDrivers()
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedDriver.value || selectedDriver.value.id !== newVal)) {
    await loadSelectedDriver()
  } else if (!newVal) {
    selectedDriver.value = null
    searchQuery.value = ''
  }
})

const loadSelectedDriver = async () => {
  try {
    const result = await apiService.getDrivers({ limit: 1000 })
    if (result.success) {
      const driver = result.data.find(d => d.id === props.modelValue)
      if (driver) {
        selectedDriver.value = driver
        searchQuery.value = `${driver.firstName} ${driver.lastName}`
      }
    }
  } catch (err) {
    console.error('Error loading selected driver:', err)
  }
}

const loadInitialDrivers = async () => {
  try {
    const params = {
      limit: 5,
      page: 1
    }
    
    if (props.statusFilter !== 'all') {
      params.status = props.statusFilter
    }
    
    const result = await apiService.getDrivers(params)
    if (result.success) {
      initialDrivers.value = result.data || []
      // Afficher les conducteurs initiaux si pas de recherche
      if (!searchQuery.value) {
        filteredDrivers.value = initialDrivers.value
      }
    }
  } catch (err) {
    console.error('Error loading initial drivers:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les 5 premiers conducteurs
    if (searchQuery.value.length < 1) {
      filteredDrivers.value = initialDrivers.value
      return
    }

    loading.value = true
    try {
      const params = {
        search: searchQuery.value,
        limit: 20
      }
      
      if (props.statusFilter !== 'all') {
        params.status = props.statusFilter
      }
      
      const result = await apiService.getDrivers(params)
      if (result.success) {
        filteredDrivers.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching drivers:', err)
      filteredDrivers.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  // Afficher les conducteurs initiaux si pas de recherche
  if (!searchQuery.value) {
    filteredDrivers.value = initialDrivers.value
  }
}

const selectDriver = (driver) => {
  selectedDriver.value = driver
  searchQuery.value = `${driver.firstName} ${driver.lastName}`
  showDropdown.value = false
  emit('update:modelValue', driver.id)
  emit('change', driver)
}

const clearSelection = () => {
  selectedDriver.value = null
  searchQuery.value = ''
  filteredDrivers.value = []
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
.driver-selector {
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

        .driver-name {
          font-weight: 700;
          color: #1f2937;
        }

        .driver-details {
          font-size: 0.85rem;
          color: #6b7280;
        }
      }
    }
  }

  .selected-badge {
    display: inline-flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: #fef3c7;
    color: #92400e;
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

