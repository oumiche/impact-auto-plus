<template>
  <div class="user-selector">
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
      <div v-if="showDropdown && (filteredUsers.length > 0 || loading)" class="dropdown">
        <div v-if="loading" class="loading">Recherche...</div>
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="dropdown-item"
          @mousedown="selectUser(user)"
        >
          <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
          <div class="user-details">
            {{ user.email }}
            <span v-if="user.username" class="username">@{{ user.username }}</span>
          </div>
        </div>
        <div v-if="!loading && filteredUsers.length === 0" class="no-results">
          Aucun utilisateur trouvé
        </div>
      </div>
      <button
        v-if="selectedUser"
        type="button"
        class="clear-btn"
        @click="clearSelection"
        title="Effacer"
      >
        ×
      </button>
    </div>
    <div v-if="selectedUser" class="selected-badge">
      <span class="badge-name">{{ selectedUser.firstName }} {{ selectedUser.lastName }}</span>
      <span class="badge-details">{{ selectedUser.email }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: [Number, null],
  label: String,
  placeholder: { type: String, default: 'Rechercher un utilisateur...' },
  required: { type: Boolean, default: false },
  statusFilter: { type: String, default: 'all' } // 'all', 'active', 'inactive'
})

const emit = defineEmits(['update:modelValue', 'change'])

const searchQuery = ref('')
const filteredUsers = ref([])
const selectedUser = ref(null)
const showDropdown = ref(false)
const loading = ref(false)
const initialUsers = ref([])
let searchTimeout = null

// Charger les 5 premiers utilisateurs au montage
onMounted(async () => {
  if (props.modelValue) {
    await loadSelectedUser()
  }
  await loadInitialUsers()
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal && (!selectedUser.value || selectedUser.value.id !== newVal)) {
    await loadSelectedUser()
  } else if (!newVal) {
    selectedUser.value = null
    searchQuery.value = ''
  }
})

const loadSelectedUser = async () => {
  try {
    const result = await apiService.getUser(props.modelValue)
    if (result.success) {
      selectedUser.value = result.data
      searchQuery.value = `${result.data.firstName} ${result.data.lastName}`
    }
  } catch (err) {
    console.error('Error loading selected user:', err)
  }
}

const loadInitialUsers = async () => {
  try {
    const params = {
      limit: 5,
      page: 1
    }
    
    if (props.statusFilter !== 'all') {
      params.isActive = props.statusFilter === 'active'
    }
    
    const result = await apiService.getUsers(params)
    if (result.success) {
      initialUsers.value = result.data || []
      if (!searchQuery.value) {
        filteredUsers.value = initialUsers.value
      }
    }
  } catch (err) {
    console.error('Error loading initial users:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    // Si vide, afficher les 5 premiers utilisateurs
    if (searchQuery.value.length < 1) {
      filteredUsers.value = initialUsers.value
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
      
      const result = await apiService.getUsers(params)
      if (result.success) {
        filteredUsers.value = result.data || []
      }
    } catch (err) {
      console.error('Error searching users:', err)
      filteredUsers.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  // Afficher les utilisateurs initiaux si pas de recherche
  if (!searchQuery.value) {
    filteredUsers.value = initialUsers.value
  }
}

const selectUser = (user) => {
  selectedUser.value = user
  searchQuery.value = `${user.firstName} ${user.lastName}`
  showDropdown.value = false
  emit('update:modelValue', user.id)
  emit('change', user)
}

const clearSelection = () => {
  selectedUser.value = null
  searchQuery.value = ''
  filteredUsers.value = []
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
.user-selector {
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

        .user-name {
          font-weight: 700;
          color: #1f2937;
        }

        .user-details {
          font-size: 0.85rem;
          color: #6b7280;

          .username {
            color: #3b82f6;
            margin-left: 0.5rem;
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
    }
  }
}
</style>

