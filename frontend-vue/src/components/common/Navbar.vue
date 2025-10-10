<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <div class="logo">IA+</div>
        <span class="brand-name">Impact Auto Plus</span>
      </div>

      <div class="navbar-menu">
        <router-link 
          v-for="item in menuItems" 
          :key="item.name"
          :to="{ name: item.name }"
          class="navbar-item"
          active-class="active"
        >
          <span class="icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </div>

      <div class="navbar-end">
        <!-- Tenant Selector -->
        <div class="tenant-selector" v-if="authStore.currentTenant">
          <button @click="toggleTenantMenu" class="tenant-button">
            <span class="tenant-icon">🏢</span>
            <span class="tenant-name">{{ authStore.currentTenant.name }}</span>
            <span class="chevron">▼</span>
          </button>
          <transition name="dropdown">
            <div v-if="showTenantMenu" class="dropdown-menu" @click="showTenantMenu = false">
              <button @click="changeTenant" class="dropdown-item">
                <span class="icon">🔄</span>
                Changer d'organisation
              </button>
            </div>
          </transition>
        </div>

        <!-- User Menu -->
        <div class="user-menu">
          <button @click="toggleUserMenu" class="user-button">
            <span class="user-avatar">{{ userInitials }}</span>
            <span class="user-name">{{ authStore.userFullName }}</span>
            <span class="chevron">▼</span>
          </button>
          <transition name="dropdown">
            <div v-if="showUserMenu" class="dropdown-menu" @click="showUserMenu = false">
              <div class="dropdown-header">
                <div class="user-info">
                  <strong>{{ authStore.userFullName }}</strong>
                  <small>{{ authStore.userEmail }}</small>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="dropdown-item logout">
                <span class="icon">🚪</span>
                Se déconnecter
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showTenantMenu = ref(false)
const showUserMenu = ref(false)

const menuItems = computed(() => {
  const items = [
    { name: 'Dashboard', label: 'Tableau de bord', icon: '📊' },
    { name: 'Garages', label: 'Garages', icon: '🏢' },
    { name: 'Vehicles', label: 'Véhicules', icon: '🚗' },
    { name: 'Supplies', label: 'Fournitures', icon: '📦' }
  ]
  
  // Ajouter Users seulement pour les admins
  if (authStore.isAdmin) {
    items.push({ name: 'Users', label: 'Utilisateurs', icon: '👥' })
  }
  
  return items
})

const userInitials = computed(() => {
  if (!authStore.user) return '?'
  const first = authStore.user.first_name?.charAt(0) || ''
  const last = authStore.user.last_name?.charAt(0) || ''
  return (first + last).toUpperCase()
})

const toggleTenantMenu = () => {
  showTenantMenu.value = !showTenantMenu.value
  showUserMenu.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showTenantMenu.value = false
}

const changeTenant = () => {
  authStore.changeTenant()
  router.push({ name: 'TenantSelection' })
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped lang="scss">
.navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  color: #333;

  .logo {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1rem;
  }

  .brand-name {
    font-size: 1.25rem;
  }
}

.navbar-menu {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
}

.navbar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  color: #666;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s;
  font-weight: 500;

  .icon {
    font-size: 1.25rem;
  }

  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
}

.navbar-end {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.tenant-selector,
.user-menu {
  position: relative;
}

.tenant-button,
.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  color: #333;

  &:hover {
    background: #e5e5e5;
  }

  .chevron {
    font-size: 0.75rem;
    transition: transform 0.3s;
  }
}

.tenant-icon {
  font-size: 1.25rem;
}

.tenant-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  padding: 0.5rem;
  z-index: 1000;
}

.dropdown-header {
  padding: 0.75rem 1rem;

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    strong {
      color: #333;
      font-size: 0.95rem;
    }

    small {
      color: #666;
      font-size: 0.85rem;
    }
  }
}

.dropdown-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  color: #333;
  font-weight: 500;
  text-align: left;

  .icon {
    font-size: 1.25rem;
  }

  &:hover {
    background: #f5f5f5;
  }

  &.logout {
    color: #e53e3e;

    &:hover {
      background: #fee;
    }
  }
}

// Animations
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 1024px) {
  .navbar-menu {
    display: none;
  }

  .tenant-name,
  .user-name {
    display: none;
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0.75rem 1rem;
  }

  .brand-name {
    display: none;
  }
}
</style>

