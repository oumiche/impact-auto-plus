<template>
  <div class="intervention-selector">
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
        :disabled="disabled"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        class="search-input"
      />
      <div v-if="showDropdown && (filteredInterventions.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="intervention in filteredInterventions"
          :key="intervention.id"
          class="dropdown-item"
          @mousedown="selectIntervention(intervention)"
        >
          <div class="intervention-number">
            <i class="fas fa-wrench"></i>
            {{ intervention.interventionNumber || `INT-${intervention.id}` }}
          </div>
          <div class="intervention-title">{{ intervention.title }}</div>
          <div class="intervention-details">
            <StatusBadge :status="intervention.currentStatus" :show-icon="false" />
            <span v-if="intervention.vehicle" class="vehicle-info">
              {{ getVehicleLabel(intervention.vehicle) }}
            </span>
          </div>
        </div>
        <div v-if="!loading && filteredInterventions.length === 0" class="no-results">
          Aucune intervention trouvée
        </div>
      </div>
      <button
        v-if="selectedIntervention"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedIntervention" class="selected-badge">
      <div class="badge-header">
        <span class="badge-number">
          <i class="fas fa-wrench"></i>
          {{ selectedIntervention.interventionNumber || `INT-${selectedIntervention.id}` }}
        </span>
        <span class="badge-title">{{ selectedIntervention.title }}</span>
      </div>
      <div v-if="selectedIntervention.vehicle" class="badge-vehicle">
        <i class="fas fa-car"></i>
        <span class="vehicle-info">
          <span v-if="getVehicleBrand(selectedIntervention.vehicle)" class="vehicle-brand">
            {{ getVehicleBrand(selectedIntervention.vehicle) }}
          </span>
          <span v-if="getVehicleModel(selectedIntervention.vehicle)" class="vehicle-model">
            {{ getVehicleModel(selectedIntervention.vehicle) }}
          </span>
        </span>
        <span v-if="getVehiclePlate(selectedIntervention.vehicle)" class="vehicle-plate">
          • {{ getVehiclePlate(selectedIntervention.vehicle) }}
        </span>
      </div>
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
  disabled: {
    type: Boolean,
    default: false
  },
  statusFilter: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredInterventions = ref([])
const selectedIntervention = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialInterventions = ref([])
let searchTimeout = null

// Charger les 5 premières interventions au montage
onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedIntervention()
  }
  await loadInitialInterventions()
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedIntervention.value || selectedIntervention.value.id !== newVal)) {
    await loadSelectedIntervention()
  } else if (!newVal) {
    selectedIntervention.value = null
    searchQuery.value = ''
  }
})

const loadSelectedIntervention = async () => {
  try {
    const response = await apiService.getVehicleIntervention(props.modelValue)
    if (response.success && response.data) {
      selectedIntervention.value = response.data
      searchQuery.value = response.data.interventionNumber || `INT-${response.data.id}`
    }
  } catch (err) {
    console.error('Error loading selected intervention:', err)
  }
}

const loadInitialInterventions = async () => {
  try {
    const params = {
      limit: 5,
      page: 1,
      sortBy: 'reportedDate',
      sortOrder: 'DESC'
    }
    
    // Filtre de statut optionnel (si backend le supporte)
    if (props.statusFilter && props.statusFilter.length > 0) {
      // Envoyer le premier statut seulement pour éviter les problèmes
      params.status = props.statusFilter[0]
    }
    
    const result = await apiService.getVehicleInterventions(params)
    
    if (result.success) {
      initialInterventions.value = result.data || []
      // TOUJOURS initialiser filteredInterventions
      filteredInterventions.value = initialInterventions.value
    }
  } catch (err) {
    console.error('Error loading initial interventions:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les 5 premières interventions
    if (searchQuery.value.length < 2) {
      filteredInterventions.value = initialInterventions.value
      return
    }

    loading.value = true
    try {
      const params = {
        search: searchQuery.value,
        limit: 20,
        sortBy: 'reportedDate',
        sortOrder: 'DESC'
      }
      
      // Filtre de statut optionnel
      if (props.statusFilter && props.statusFilter.length > 0) {
        params.status = props.statusFilter[0]
      }
      
      const result = await apiService.getVehicleInterventions(params)
      if (result.success) {
        filteredInterventions.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching interventions:', err)
      filteredInterventions.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  if (!searchQuery.value) {
    filteredInterventions.value = initialInterventions.value
  }
}

const selectIntervention = (intervention) => {
  selectedIntervention.value = intervention
  searchQuery.value = intervention.interventionNumber || `INT-${intervention.id}`
  showDropdown.value = false
  emit('update:modelValue', intervention.id)
  emit('change', intervention)
}

const clearSelection = () => {
  selectedIntervention.value = null
  searchQuery.value = ''
  filteredInterventions.value = []
  emit('update:modelValue', null)
  emit('change', null)
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
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

const getVehicleBrand = (vehicle) => {
  if (!vehicle) return ''
  return vehicle.brand?.name || vehicle.brandName || ''
}

const getVehicleModel = (vehicle) => {
  if (!vehicle) return ''
  return vehicle.model?.name || vehicle.modelName || ''
}

const getVehiclePlate = (vehicle) => {
  if (!vehicle) return ''
  return vehicle.registrationNumber || vehicle.plateNumber || vehicle.plate_number || ''
}
</script>

<style scoped lang="scss">
.intervention-selector {
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
        gap: 0.375rem;
        border-bottom: 1px solid #f3f4f6;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f5f5f5;
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
            font-size: 0.875rem;
          }
        }

        .intervention-title {
          color: #4b5563;
          font-size: 0.9rem;
        }

        .intervention-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;

          .vehicle-info {
            color: #6b7280;
          }
        }
      }
    }
  }

  .selected-badge {
    display: inline-flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 6px;
    font-size: 0.9rem;
    width: fit-content;

    .badge-header {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .badge-number {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 700;

      i {
        font-size: 0.875rem;
      }
    }

    .badge-title {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .badge-vehicle {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.85rem;
      padding-top: 0.375rem;
      border-top: 1px solid rgba(3, 105, 161, 0.2);
      color: #0c4a6e;

      i {
        font-size: 0.8rem;
      }

      .vehicle-info {
        display: flex;
        gap: 0.375rem;

        .vehicle-brand {
          font-weight: 600;
        }

        .vehicle-model {
          font-weight: 500;
        }
      }

      .vehicle-plate {
        font-weight: 700;
        margin-left: 0.25rem;
      }
    }
  }
}
</style>
