<template>
  <div class="tenant-selector">
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
      <div v-if="showDropdown && (filteredTenants.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="tenant in filteredTenants"
          :key="tenant.id"
          class="dropdown-item"
          @mousedown="selectTenant(tenant)"
        >
          <div class="tenant-header">
            <img 
              v-if="tenant.logoUrl" 
              :src="tenant.logoUrl" 
              :alt="tenant.logoAltText || tenant.name"
              class="tenant-logo"
            />
            <div class="tenant-name">{{ tenant.name }}</div>
          </div>
          <div class="tenant-details">
            <span class="tenant-slug">{{ tenant.slug }}</span>
            <span v-if="!tenant.isActive" class="inactive-badge">Inactif</span>
          </div>
        </div>
        <div v-if="!loading && filteredTenants.length === 0" class="no-results">
          Aucun tenant trouvé
        </div>
      </div>
      <button
        v-if="selectedTenant"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedTenant" class="selected-badge">
      <img 
        v-if="selectedTenant.logoUrl" 
        :src="selectedTenant.logoUrl" 
        :alt="selectedTenant.logoAltText || selectedTenant.name"
        class="badge-logo"
      />
      <div class="badge-info">
        <span class="badge-name">{{ selectedTenant.name }}</span>
        <span class="badge-details">{{ selectedTenant.slug }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: { type: String, default: 'Rechercher un tenant...' },
  required: { type: Boolean, default: false },
  statusFilter: { type: String, default: 'all' } // 'all', 'active', 'inactive'
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredTenants = ref([])
const selectedTenant = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialTenants = ref([])
let searchTimeout = null

// Charger les 5 premiers tenants au montage
onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedTenant()
  }
  await loadInitialTenants()
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedTenant.value || selectedTenant.value.id !== newVal)) {
    await loadSelectedTenant()
  } else if (!newVal) {
    selectedTenant.value = null
    searchQuery.value = ''
  }
})

const loadSelectedTenant = async () => {
  try {
    const result = await apiService.getTenant(props.modelValue)
    if (result.success) {
      selectedTenant.value = result.data
      searchQuery.value = result.data.name
    }
  } catch (err) {
    console.error('Error loading selected tenant:', err)
  }
}

const loadInitialTenants = async () => {
  try {
    const params = {
      limit: 5,
      page: 1
    }
    
    if (props.statusFilter !== 'all') {
      params.isActive = props.statusFilter === 'active'
    }
    
    const result = await apiService.getTenants(params)
    if (result.success) {
      initialTenants.value = result.data || []
      if (!searchQuery.value) {
        filteredTenants.value = initialTenants.value
      }
    }
  } catch (err) {
    console.error('Error loading initial tenants:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les 5 premiers tenants
    if (searchQuery.value.length < 1) {
      filteredTenants.value = initialTenants.value
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
      
      const result = await apiService.getTenants(params)
      if (result.success) {
        filteredTenants.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching tenants:', err)
      filteredTenants.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  // Afficher les tenants initiaux si pas de recherche
  if (!searchQuery.value) {
    filteredTenants.value = initialTenants.value
  }
}

const selectTenant = (tenant) => {
  selectedTenant.value = tenant
  searchQuery.value = tenant.name
  showDropdown.value = false
  emit('update:modelValue', tenant.id)
  emit('change', tenant)
}

const clearSelection = () => {
  selectedTenant.value = null
  searchQuery.value = ''
  filteredTenants.value = []
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
.tenant-selector {
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

        .tenant-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .tenant-logo {
            width: 24px;
            height: 24px;
            object-fit: contain;
            border-radius: 4px;
          }

          .tenant-name {
            font-weight: 700;
            color: #1f2937;
          }
        }

        .tenant-details {
          font-size: 0.85rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .tenant-slug {
            font-family: monospace;
          }

          .inactive-badge {
            font-size: 0.75rem;
            padding: 0.125rem 0.375rem;
            background: #fee2e2;
            color: #991b1b;
            border-radius: 4px;
          }
        }
      }
    }
  }

  .selected-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 6px;
    font-size: 0.9rem;
    width: fit-content;

    .badge-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 4px;
    }

    .badge-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

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
}
</style>

