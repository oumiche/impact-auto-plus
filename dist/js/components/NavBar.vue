<template>
  <nav class="navbar" role="navigation">
    <div class="navbar-brand">
      <a class="navbar-item logo" href="/dashboard.html">
        <i class="fas fa-car"></i> Impact Auto
      </a>
      <a 
        role="button" 
        class="navbar-burger" 
        :class="{ 'is-active': isMenuActive }"
        @click="toggleMenu"
        aria-label="menu" 
        aria-expanded="false"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>
    
    <div class="navbar-menu" :class="{ 'is-active': isMenuActive }">
      <div class="navbar-start">
        <a 
          class="navbar-item" 
          :class="{ 'is-active': currentRoute === 'dashboard' }"
          href="/dashboard.html"
        >
          <i class="fas fa-home"></i> Dashboard
        </a>
        <a 
          class="navbar-item" 
          :class="{ 'is-active': currentRoute === 'vehicles' }"
          href="/vehicles.html"
        >
          <i class="fas fa-car"></i> Véhicules
        </a>
        <a 
          class="navbar-item" 
          :class="{ 'is-active': currentRoute === 'interventions' }"
          href="/interventions.html"
        >
          <i class="fas fa-wrench"></i> Interventions
        </a>
        <a 
          class="navbar-item" 
          :class="{ 'is-active': currentRoute === 'drivers' }"
          href="/drivers.html"
        >
          <i class="fas fa-user"></i> Conducteurs
        </a>
        <a 
          class="navbar-item" 
          :class="{ 'is-active': currentRoute === 'reports' }"
          href="/reports.html"
        >
          <i class="fas fa-chart-bar"></i> Rapports
        </a>
      </div>
      
      <div class="navbar-end">
        <!-- Sélecteur de tenant pour les super admins -->
        <div class="navbar-item" v-if="canSwitchTenants">
          <TenantSelector 
            @tenant-changed="handleTenantChanged"
            :show-current-tenant="false"
          />
        </div>
        
        <!-- Indicateur de tenant actuel -->
        <div class="navbar-item" v-if="currentTenant && !canSwitchTenants">
          <span class="tag is-primary">
            <i class="fas fa-building"></i>
            {{ currentTenant.name }}
          </span>
        </div>
        
        <!-- Menu utilisateur -->
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link">
            <i class="fas fa-user-circle"></i>
            {{ userDisplayName }}
          </a>
          <div class="navbar-dropdown is-right">
            <a class="navbar-item" href="/profile.html">
              <i class="fas fa-user"></i> Profil
            </a>
            <a class="navbar-item" href="/settings.html">
              <i class="fas fa-cog"></i> Paramètres
            </a>
            <hr class="navbar-divider">
            <a class="navbar-item" @click="handleLogout">
              <i class="fas fa-sign-out-alt"></i> Déconnexion
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import TenantSelector from './TenantSelector.vue'

export default {
  name: 'NavBar',
  components: {
    TenantSelector
  },
  data() {
    return {
      isMenuActive: false,
      currentRoute: 'dashboard',
      user: null,
      currentTenant: null,
      canSwitchTenants: false
    }
  },
  computed: {
    userDisplayName() {
      if (!this.user) return 'Utilisateur'
      return this.user.display_name || this.user.full_name || this.user.username
    }
  },
  mounted() {
    this.loadUserData()
    this.detectCurrentRoute()
  },
  methods: {
    loadUserData() {
      // Charger les données utilisateur depuis sessionStorage
      const userData = sessionStorage.getItem('impact_auto_user')
      const tenantData = sessionStorage.getItem('impact_auto_tenant')
      const canSwitchData = sessionStorage.getItem('impact_auto_can_switch')

      if (userData) {
        this.user = JSON.parse(userData)
      }

      if (tenantData) {
        this.currentTenant = JSON.parse(tenantData)
      }

      this.canSwitchTenants = canSwitchData === 'true'
    },

    detectCurrentRoute() {
      const path = window.location.pathname
      if (path.includes('dashboard')) this.currentRoute = 'dashboard'
      else if (path.includes('vehicles')) this.currentRoute = 'vehicles'
      else if (path.includes('interventions')) this.currentRoute = 'interventions'
      else if (path.includes('drivers')) this.currentRoute = 'drivers'
      else if (path.includes('reports')) this.currentRoute = 'reports'
    },

    toggleMenu() {
      this.isMenuActive = !this.isMenuActive
    },

    handleTenantChanged(tenant) {
      this.currentTenant = tenant
      this.$emit('tenant-changed', tenant)
    },

    async handleLogout() {
      try {
        // Utiliser apiService pour déconnecter
        if (window.apiService) {
          await window.apiService.logout()
        }
        
        // Nettoyer sessionStorage
        sessionStorage.removeItem('impact_auto_user')
        sessionStorage.removeItem('impact_auto_tenant')
        sessionStorage.removeItem('impact_auto_session')
        sessionStorage.removeItem('impact_auto_permissions')
        sessionStorage.removeItem('impact_auto_can_switch')
        
        // Nettoyer localStorage aussi
        localStorage.removeItem('auth_token')
        localStorage.removeItem('current_user')
        localStorage.removeItem('current_tenant')

        // Rediriger vers login
        window.location.href = '/login.html'
      } catch (error) {
        console.error('Logout error:', error)
        // Rediriger quand même vers login
        window.location.href = '/login.html'
      }
    }
  }
}
</script>

<style scoped>
.navbar {
  background: var(--impact-primary, #2c3e50);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.navbar-brand .logo {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.navbar-item {
  color: white !important;
}

.navbar-item:hover {
  background: rgba(255,255,255,0.1) !important;
}

.navbar-item.is-active {
  background: rgba(255,255,255,0.2) !important;
  font-weight: 600;
}

.navbar-link {
  color: white !important;
}

.navbar-link:hover {
  background: rgba(255,255,255,0.1) !important;
}

.navbar-dropdown {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.navbar-dropdown .navbar-item {
  color: var(--impact-dark, #34495e) !important;
  padding: 12px 20px;
}

.navbar-dropdown .navbar-item:hover {
  background: var(--impact-light, #ecf0f1) !important;
}

.navbar-dropdown .navbar-item i {
  margin-right: 8px;
  width: 16px;
}

.navbar-divider {
  background: #e1e8ed;
  margin: 8px 0;
}

.tag.is-primary {
  background: var(--impact-secondary, #3498db);
  color: white;
  border-radius: 20px;
  padding: 8px 12px;
}

.tag.is-primary i {
  margin-right: 5px;
}

.navbar-burger {
  color: white;
}

.navbar-burger:hover {
  background: rgba(255,255,255,0.1);
}

@media (max-width: 768px) {
  .navbar-menu {
    background: var(--impact-primary, #2c3e50);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .navbar-dropdown {
    position: static;
    box-shadow: none;
    border: none;
    background: rgba(255,255,255,0.1);
  }
  
  .navbar-dropdown .navbar-item {
    color: white !important;
  }
}
</style>
