<template>
  <aside class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="logo-container">
        <div class="logo">IA+</div>
        <transition name="fade">
          <span v-if="!isCollapsed" class="brand-name">Impact Auto</span>
        </transition>
      </div>
      <button @click="toggleSidebar" class="toggle-btn">
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>
    </div>

    <nav class="sidebar-nav">
      <div v-for="section in menuSections" :key="section.title" class="nav-section">
        <transition name="fade">
          <div v-if="!isCollapsed" class="nav-section-title">{{ section.title }}</div>
        </transition>
        <router-link
          v-for="item in section.items"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-item"
          active-class="active"
        >
          <i :class="`fas ${item.icon}`" class="nav-icon"></i>
          <transition name="fade">
            <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
          </transition>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-footer">
      <!-- Tenant Info -->
      <div v-if="authStore.currentTenant" class="tenant-info">
        <div class="tenant-card" @click="toggleTenantMenu">
          <i class="fas fa-building tenant-icon"></i>
          <transition name="fade">
            <div v-if="!isCollapsed" class="tenant-details">
              <span class="tenant-name">{{ authStore.currentTenant.name }}</span>
              <span class="tenant-action">
                Changer <i class="fas fa-chevron-down"></i>
              </span>
            </div>
          </transition>
        </div>
        <transition name="dropdown">
          <div v-if="showTenantMenu" class="dropdown-menu">
            <button @click="changeTenant" class="dropdown-item">
              <i class="fas fa-sync-alt"></i>
              <span>Changer d'organisation</span>
            </button>
          </div>
        </transition>
      </div>

      <!-- User Info -->
      <div class="user-info">
        <div class="user-card" @click="toggleUserMenu">
          <div class="user-avatar">{{ userInitials }}</div>
          <transition name="fade">
            <div v-if="!isCollapsed" class="user-details">
              <span class="user-name">{{ authStore.userFullName }}</span>
              <span class="user-email">{{ authStore.userEmail }}</span>
            </div>
          </transition>
        </div>
        <transition name="dropdown">
          <div v-if="showUserMenu" class="dropdown-menu">
            <div class="dropdown-header">
              <strong>{{ authStore.userFullName }}</strong>
              <small>{{ authStore.userEmail }}</small>
            </div>
            <div class="dropdown-divider"></div>
            <button @click="handleLogout" class="dropdown-item logout">
              <i class="fas fa-sign-out-alt"></i>
              <span>Se déconnecter</span>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const showTenantMenu = ref(false)
const showUserMenu = ref(false)

const menuSections = computed(() => {
  const sections = [
    {
      title: 'Tableau de Bord',
      items: [
        { name: 'Dashboard', label: 'Dashboard', icon: 'fa-home' },
        { name: 'TenantSelection', label: "Changer d'Organisation", icon: 'fa-building' }
      ]
    },
    {
      title: 'Données de base',
      items: [
        { name: 'Marques', label: 'Marques Véhicules', icon: 'fa-tag' },
        { name: 'Modeles', label: 'Modèles Véhicules', icon: 'fa-car' },
        { name: 'VehicleCategories', label: 'Types Véhicules', icon: 'fa-list-alt' },
        { name: 'VehicleColors', label: 'Couleurs Véhicules', icon: 'fa-palette' },
        { name: 'FuelTypes', label: "Types d'énergie", icon: 'fa-gas-pump' },
        { name: 'LicenceTypes', label: 'Types de permis', icon: 'fa-id-card' },
        { name: 'SupplyCategories', label: 'Types Fournitures', icon: 'fa-folder-open' },
        { name: 'Supplies', label: 'Fournitures', icon: 'fa-box' },
        { name: 'InterventionTypes', label: "Types d'Intervention", icon: 'fa-wrench' },
        { name: 'Collaborateurs', label: 'Collaborateurs', icon: 'fa-user-tie' }
      ]
    },
    {
      title: 'Gestion',
      items: [
        { name: 'Garages', label: 'Garages', icon: 'fa-warehouse' },
        { name: 'Vehicles', label: 'Véhicules', icon: 'fa-car-side' },
        { name: 'Drivers', label: 'Conducteurs', icon: 'fa-user' },
        { name: 'VehicleAssignments', label: 'Assignations', icon: 'fa-user-check' },
        { name: 'VehicleInsurances', label: 'Assurances', icon: 'fa-shield-alt' },
        { name: 'VehicleFuelLogs', label: 'Suivi de Carburant', icon: 'fa-tachometer-alt' },
        { name: 'VehicleMaintenances', label: 'Entretiens', icon: 'fa-tools' }
      ]
    },
    {
      title: 'Suivi',
      items: [
        { name: 'VehicleInterventions', label: 'Interventions', icon: 'fa-clipboard-list' },
        { name: 'InterventionPrediagnostics', label: 'Prédiagnostics', icon: 'fa-clipboard-check' },
        { name: 'InterventionQuotes', label: 'Devis', icon: 'fa-file-invoice-dollar' },
        { name: 'InterventionWorkAuthorizations', label: 'Accord Travaux', icon: 'fa-file-signature' },
        { name: 'InterventionFieldVerifications', label: 'Vérifications Terrain', icon: 'fa-clipboard-check' },
        { name: 'InterventionReceptionReports', label: 'Réception', icon: 'fa-clipboard' },
        { name: 'InterventionInvoices', label: 'Factures', icon: 'fa-file-invoice' }
      ]
    },
    {
      title: 'Rapports',
      items: [
        { name: 'Reports', label: 'Rapports', icon: 'fa-chart-bar' },
        { name: 'Analytics', label: 'Analytics', icon: 'fa-chart-line' }
      ]
    }
  ]

  // Section Administration (seulement pour les admins)
  if (authStore.isAdmin) {
    sections.push({
      title: 'Administration',
      items: [
        { name: 'Parametres', label: 'Paramètres', icon: 'fa-cog' },
        { name: 'Users', label: 'Utilisateurs', icon: 'fa-users' },
        { name: 'Tenants', label: 'Tenants', icon: 'fa-building' },
        { name: 'UserTenantPermissions', label: 'Affectations', icon: 'fa-user-shield' },
        { name: 'CodeFormats', label: 'Formats de Code', icon: 'fa-code' },
        { name: 'SupplyPrices', label: 'Registre des Prix', icon: 'fa-dollar-sign' }
      ]
    })
  }

  return sections
})

const userInitials = computed(() => {
  if (!authStore.user) return '?'
  const first = authStore.user.firstName?.charAt(0) || authStore.user.first_name?.charAt(0) || ''
  const last = authStore.user.lastName?.charAt(0) || authStore.user.last_name?.charAt(0) || ''
  return (first + last).toUpperCase()
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  if (isCollapsed.value) {
    showTenantMenu.value = false
    showUserMenu.value = false
  }
}

const toggleTenantMenu = () => {
  if (!isCollapsed.value) {
    showTenantMenu.value = !showTenantMenu.value
    showUserMenu.value = false
  }
}

const toggleUserMenu = () => {
  if (!isCollapsed.value) {
    showUserMenu.value = !showUserMenu.value
    showTenantMenu.value = false
  }
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
.sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);

  &.sidebar-collapsed {
    width: 80px;
  }
}

.sidebar-header {
  padding: 1.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.logo {
  width: 40px;
  height: 40px;
  background: #2563eb;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
}

.nav-section {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-section-title {
  padding: 0.5rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s;
  position: relative;

  .sidebar-collapsed & {
    justify-content: center;
    padding: 0.875rem 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &.active {
    background: rgba(37, 99, 235, 0.15);
    color: white;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #2563eb;
    }
  }
}

.nav-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-label {
  font-weight: 500;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tenant-info,
.user-info {
  position: relative;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.tenant-card,
.user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  .sidebar-collapsed & {
    justify-content: center;
    padding: 0.75rem 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.tenant-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.tenant-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.tenant-name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tenant-action {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: #2d3748;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  z-index: 1000;
}

.dropdown-header {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  strong {
    font-size: 0.95rem;
  }

  small {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  font-weight: 500;

  i {
    font-size: 1.1rem;
    width: 20px;
    text-align: center;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.logout {
    color: #fc8181;

    &:hover {
      background: rgba(252, 129, 129, 0.1);
    }
  }
}

// Animations
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    
    &.sidebar-open {
      transform: translateX(0);
    }
  }
}
</style>

