<template>
  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="user-details">
        <div class="user-name">{{ userDisplayName }}</div>
        <div class="user-role">{{ userRole }}</div>
      </div>
    </div>
    
    <div class="tenant-info" v-if="tenantName" :style="{ display: tenantName ? 'block' : 'none' }">
      <div class="tenant-name">{{ tenantName }}</div>
    </div>
    
    <button class="logout-btn" @click="logout">
      <i class="fas fa-sign-out-alt"></i> Déconnexion
    </button>
  </div>
</template>

<script>
export default {
  name: 'UserInfo',
  data() {
    return {
      user: null,
      tenant: null
    }
  },
  computed: {
    userDisplayName() {
      if (!this.user) return 'Administrateur'
      return this.user.first_name || this.user.username || 'Administrateur'
    },
    
    userRole() {
      if (!this.user) return 'Super Admin'
      return this.user.user_type === 'super_admin' ? 'Super Admin' : 'Utilisateur'
    },
    
    tenantName() {
      return this.tenant ? this.tenant.name : null
    }
  },
  mounted() {
    this.loadUserData()
  },
  methods: {
    loadUserData() {
      // Charger les données depuis localStorage
      const userData = localStorage.getItem('current_user')
      const tenantData = localStorage.getItem('current_tenant')
      
      if (userData) {
        this.user = JSON.parse(userData)
      }
      
      if (tenantData) {
        this.tenant = JSON.parse(tenantData)
      }
    },
    
    async logout() {
      try {
        // Utiliser apiService pour déconnecter
        if (window.apiService) {
          await window.apiService.logout()
        }
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      } finally {
        // Nettoyer le localStorage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('current_user')
        localStorage.removeItem('current_tenant')
        
        // Rediriger vers la page de connexion
        window.location.href = '/login.html'
      }
    }
  }
}
</script>

<style scoped>
/* Les styles sont dans impact-auto.css */
</style>
