<template>
  <div class="intervention-selector">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    
    <div class="selector-input">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        :required="required"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <i class="fas fa-search search-icon"></i>
      <i v-if="loading" class="fas fa-spinner fa-spin loading-icon"></i>
    </div>

    <!-- Dropdown avec résultats -->
    <div v-if="showDropdown && (interventions.length > 0 || searchQuery)" class="dropdown">
      <div v-if="loading" class="dropdown-loading">
        <i class="fas fa-spinner fa-spin"></i>
        Recherche en cours...
      </div>
      
      <div v-else-if="interventions.length === 0" class="dropdown-empty">
        <i class="fas fa-info-circle"></i>
        Aucune intervention trouvée
      </div>
      
      <div v-else class="dropdown-list">
        <div
          v-for="intervention in interventions"
          :key="intervention.id"
          class="dropdown-item"
          :class="{ 'selected': intervention.id === selectedId }"
          @mousedown.prevent="selectIntervention(intervention)"
        >
          <div class="intervention-info">
            <div class="intervention-number">
              <i class="fas fa-wrench"></i>
              {{ intervention.interventionNumber || `INT-${intervention.id}` }}
            </div>
            <div class="intervention-title">{{ intervention.title }}</div>
            <div class="intervention-meta">
              <StatusBadge :status="intervention.currentStatus" :show-icon="false" />
              <span v-if="intervention.vehicle" class="vehicle-info">
                {{ getVehicleLabel(intervention.vehicle) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Intervention sélectionnée -->
    <div v-if="selectedIntervention" class="selected-intervention">
      <div class="selected-info">
        <i class="fas fa-check-circle"></i>
        <div>
          <strong>{{ selectedIntervention.interventionNumber || `INT-${selectedIntervention.id}` }}</strong>
          <span>{{ selectedIntervention.title }}</span>
        </div>
      </div>
      <button type="button" @click="clearSelection" class="btn-clear">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: {
    type: String,
    default: 'Rechercher une intervention...'
  },
  required: {
    type: Boolean,
    default: false
  },
  statusFilter: {
    type: Array,
    default: () => ['reported', 'in_prediagnostic']  // Interventions éligibles au prédiag
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// État
const searchQuery = ref('')
const searchInput = ref(null)
const interventions = ref([])
const selectedIntervention = ref(null)
const selectedId = ref(props.modelValue)
const showDropdown = ref(false)
const loading = ref(false)
const searchTimeout = ref(null)

// Méthodes
const loadInitialInterventions = async () => {
  try {
    loading.value = true
    
    const params = {
      limit: 5,
      page: 1
    }

    // Filtrer par statuts si fournis
    if (props.statusFilter && props.statusFilter.length > 0) {
      params.status = props.statusFilter.join(',')
    }

    const response = await apiService.getVehicleInterventions(params)
    
    if (response.success && response.data) {
      interventions.value = response.data
    }
  } catch (error) {
    console.error('Error loading initial interventions:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout.value)
  
  searchTimeout.value = setTimeout(async () => {
    if (searchQuery.value.length < 2) {
      await loadInitialInterventions()
      return
    }

    try {
      loading.value = true
      
      const params = {
        search: searchQuery.value,
        limit: 20,
        page: 1
      }

      // Filtrer par statuts si fournis
      if (props.statusFilter && props.statusFilter.length > 0) {
        params.status = props.statusFilter.join(',')
      }

      const response = await apiService.getVehicleInterventions(params)
      
      if (response.success && response.data) {
        interventions.value = response.data
      }
    } catch (error) {
      console.error('Error searching interventions:', error)
      interventions.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  if (interventions.value.length === 0) {
    loadInitialInterventions()
  }
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const selectIntervention = (intervention) => {
  selectedIntervention.value = intervention
  selectedId.value = intervention.id
  searchQuery.value = ''
  showDropdown.value = false
  emit('update:modelValue', intervention.id)
  emit('change', intervention)
}

const clearSelection = () => {
  selectedIntervention.value = null
  selectedId.value = null
  searchQuery.value = ''
  emit('update:modelValue', null)
  emit('change', null)
}

const getVehicleLabel = (vehicle) => {
  if (!vehicle) return ''
  if (typeof vehicle === 'object') {
    const brand = vehicle.brand?.name || vehicle.brandName || ''
    const model = vehicle.model?.name || vehicle.modelName || ''
    const plate = vehicle.plateNumber || vehicle.plate_number || ''
    return `${brand} ${model} (${plate})`.trim()
  }
  return vehicle
}

// Watchers
watch(() => props.modelValue, async (newVal) => {
  if (newVal && newVal !== selectedId.value) {
    // Charger l'intervention sélectionnée
    try {
      const response = await apiService.getVehicleIntervention(newVal)
      if (response.success && response.data) {
        selectedIntervention.value = response.data
        selectedId.value = newVal
      }
    } catch (error) {
      console.error('Error loading intervention:', error)
    }
  } else if (!newVal) {
    selectedIntervention.value = null
    selectedId.value = null
  }
})

// Lifecycle
onMounted(async () => {
  if (props.modelValue) {
    try {
      const response = await apiService.getVehicleIntervention(props.modelValue)
      if (response.success && response.data) {
        selectedIntervention.value = response.data
        selectedId.value = props.modelValue
      }
    } catch (error) {
      console.error('Error loading intervention:', error)
    }
  }
})
</script>

<style scoped lang="scss">
.intervention-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
  }
}

.selector-input {
  position: relative;

  input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 2.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }

  .loading-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #3b82f6;
  }
}

.dropdown {
  position: absolute;
  z-index: 1000;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: 0.25rem;
}

.dropdown-loading,
.dropdown-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: #6b7280;
  font-size: 0.9rem;

  i {
    font-size: 1.25rem;
  }
}

.dropdown-list {
  padding: 0.5rem;
}

.dropdown-item {
  padding: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }

  &.selected {
    background: #eff6ff;
    border: 2px solid #3b82f6;
  }
}

.intervention-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.intervention-number {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;

  i {
    color: #3b82f6;
  }
}

.intervention-title {
  color: #4b5563;
  font-size: 0.9rem;
}

.intervention-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;

  .vehicle-info {
    color: #6b7280;
  }
}

.selected-intervention {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #d1fae5;
  border: 2px solid #10b981;
  border-radius: 8px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #065f46;

  i {
    font-size: 1.5rem;
    color: #10b981;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    strong {
      font-size: 0.95rem;
    }

    span {
      font-size: 0.85rem;
      opacity: 0.9;
    }
  }
}

.btn-clear {
  background: transparent;
  border: none;
  color: #065f46;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #a7f3d0;
  }
}
</style>

