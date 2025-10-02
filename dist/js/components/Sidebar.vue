<template>
  <div>
    <!-- Mobile Menu Button -->
    <button 
      class="mobile-menu-btn" 
      @click="toggleSidebar"
      v-if="isMobile"
    >
      ☰
    </button>
    
    <!-- Sidebar -->
    <nav 
      class="sidebar" 
      :class="{ open: sidebarOpen }"
      id="sidebar"
    >
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="logo">IMPACT AUTO</div>
        <div class="logo-subtitle">Gestion de Parc Automobile</div>
      </div>
      
      <!-- Navigation -->
      <div class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Tableau de Bord</div>
          <router-link to="/dashboard" class="nav-item" :class="{ active: $route.path === '/dashboard' }">
            <i class="fas fa-home"></i> Dashboard
          </router-link>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Gestion</div>
          <router-link to="/vehicles" class="nav-item" :class="{ active: $route.path === '/vehicles' }">
            <i class="fas fa-car"></i> Véhicules
          </router-link>
          <router-link to="/drivers" class="nav-item" :class="{ active: $route.path === '/drivers' }">
            <i class="fas fa-user"></i> Conducteurs
          </router-link>
          <router-link to="/interventions" class="nav-item" :class="{ active: $route.path === '/interventions' }">
            <i class="fas fa-wrench"></i> Interventions
          </router-link>
          <router-link to="/maintenance" class="nav-item" :class="{ active: $route.path === '/maintenance' }">
            <i class="fas fa-tools"></i> Maintenance
          </router-link>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Rapports</div>
          <router-link to="/reports" class="nav-item" :class="{ active: $route.path === '/reports' }">
            <i class="fas fa-chart-bar"></i> Rapports
          </router-link>
          <router-link to="/analytics" class="nav-item" :class="{ active: $route.path === '/analytics' }">
            <i class="fas fa-chart-line"></i> Analytics
          </router-link>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Administration</div>
          <router-link to="/parametres" class="nav-item" :class="{ active: $route.path === '/parametres' }">
            <i class="fas fa-cog"></i> Paramètres
          </router-link>
          <router-link to="/users" class="nav-item" :class="{ active: $route.path === '/users' }">
            <i class="fas fa-users"></i> Utilisateurs
          </router-link>
        </div>
      </div>
      
      <!-- User Info -->
      <UserInfo />
    </nav>
  </div>
</template>

<script>
import UserInfo from './UserInfo.vue'

export default {
  name: 'Sidebar',
  components: {
    UserInfo
  },
  data() {
    return {
      sidebarOpen: false,
      isMobile: false
    }
  },
  mounted() {
    this.checkMobile()
    this.setupEventListeners()
    window.addEventListener('resize', this.checkMobile)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkMobile)
    document.removeEventListener('click', this.handleOutsideClick)
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    
    checkMobile() {
      this.isMobile = window.innerWidth <= 768
      if (!this.isMobile) {
        this.sidebarOpen = false
      }
    },
    
    setupEventListeners() {
      // Fermer la sidebar en cliquant à l'extérieur sur mobile
      document.addEventListener('click', this.handleOutsideClick)
    },
    
    handleOutsideClick(event) {
      const sidebar = document.getElementById('sidebar')
      const menuBtn = document.querySelector('.mobile-menu-btn')
      
      if (this.isMobile && 
          sidebar && 
          !sidebar.contains(event.target) && 
          !menuBtn.contains(event.target)) {
        this.sidebarOpen = false
      }
    }
  }
}
</script>

<style scoped>
/* Les styles sont dans impact-auto.css */
</style>
