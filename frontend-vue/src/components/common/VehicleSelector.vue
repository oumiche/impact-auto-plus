<template>
  <div class="vehicle-selector">
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
      <div v-if="showDropdown && (filteredVehicles.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="vehicle in filteredVehicles"
          :key="vehicle.id"
          class="dropdown-item"
          @mousedown="selectVehicle(vehicle)"
        >
          <div class="vehicle-plate">{{ vehicle.plateNumber }}</div>
          <div class="vehicle-details">
            {{ vehicle.brand?.name || vehicle.brand }} {{ vehicle.model?.name || vehicle.model }}
            <span v-if="vehicle.year">({{ vehicle.year }})</span>
          </div>
        </div>
        <div v-if="!loading && filteredVehicles.length === 0" class="no-results">
          Aucun véhicule trouvé
        </div>
      </div>
      <button
        v-if="selectedVehicle"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedVehicle" class="selected-badge">
      <span class="badge-plate">{{ selectedVehicle.plateNumber }}</span>
      <span class="badge-details">{{ selectedVehicle.brand?.name || selectedVehicle.brand }} {{ selectedVehicle.model?.name || selectedVehicle.model }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: { type: String, default: 'Rechercher un véhicule...' },
  required: { type: Boolean, default: false },
  statusFilter: { type: String, default: 'all' } // 'all', 'active', etc.
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredVehicles = ref([])
const selectedVehicle = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialVehicles = ref([])
let searchTimeout = null

// Charger les 5 premiers véhicules au montage
onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedVehicle()
  }
  await loadInitialVehicles()
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedVehicle.value || selectedVehicle.value.id !== newVal)) {
    await loadSelectedVehicle()
  } else if (!newVal) {
    selectedVehicle.value = null
    searchQuery.value = ''
  }
})

const loadSelectedVehicle = async () => {
  try {
    const result = await apiService.getVehicles({ limit: 1000 })
    if (result.success) {
      const vehicle = result.data.find(v => v.id === props.modelValue)
      if (vehicle) {
        selectedVehicle.value = vehicle
        searchQuery.value = vehicle.plateNumber
      }
    }
  } catch (err) {
    console.error('Error loading selected vehicle:', err)
  }
}

const loadInitialVehicles = async () => {
  try {
    const params = {
      limit: 5,
      page: 1
    }
    
    if (props.statusFilter !== 'all') {
      params.status = props.statusFilter
    }
    
    const result = await apiService.getVehicles(params)
    if (result.success) {
      initialVehicles.value = result.data || []
      // Afficher les véhicules initiaux si pas de recherche
      if (!searchQuery.value) {
        filteredVehicles.value = initialVehicles.value
      }
    }
  } catch (err) {
    console.error('Error loading initial vehicles:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les 5 premiers véhicules
    if (searchQuery.value.length < 1) {
      filteredVehicles.value = initialVehicles.value
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
      
      const result = await apiService.getVehicles(params)
      if (result.success) {
        filteredVehicles.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching vehicles:', err)
      filteredVehicles.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  // Afficher les véhicules initiaux si pas de recherche
  if (!searchQuery.value) {
    filteredVehicles.value = initialVehicles.value
  }
}

const selectVehicle = (vehicle) => {
  selectedVehicle.value = vehicle
  searchQuery.value = vehicle.plateNumber
  showDropdown.value = false
  emit('update:modelValue', vehicle.id)
  emit('change', vehicle)
}

const clearSelection = () => {
  selectedVehicle.value = null
  searchQuery.value = ''
  filteredVehicles.value = []
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
.vehicle-selector {
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

        .vehicle-plate {
          font-weight: 700;
          color: #1f2937;
        }

        .vehicle-details {
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
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 6px;
    font-size: 0.9rem;
    width: fit-content;

    .badge-plate {
      font-weight: 700;
    }

    .badge-details {
      font-size: 0.8rem;
      opacity: 0.8;
    }
  }
}
</style>

