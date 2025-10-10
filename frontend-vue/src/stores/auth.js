import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api.service'

export const useAuthStore = defineStore('auth', () => {
  // ==================== STATE ====================
  const token = ref(localStorage.getItem('auth_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('current_user') || 'null'))
  const currentTenant = ref(JSON.parse(localStorage.getItem('current_tenant') || 'null'))
  
  // ==================== GETTERS ====================
  const isAuthenticated = computed(() => !!token.value)
  
  const userFullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`
  })
  
  const userEmail = computed(() => user.value?.email || '')
  
  const userRoles = computed(() => user.value?.roles || [])
  
  const hasRole = computed(() => (role) => {
    return userRoles.value.includes(role)
  })
  
  const isAdmin = computed(() => hasRole.value('ROLE_ADMIN'))
  
  const isSuperAdmin = computed(() => hasRole.value('ROLE_SUPER_ADMIN'))
  
  const isTokenExpired = computed(() => {
    if (!token.value) return true
    
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  })
  
  const hasTenantSelected = computed(() => !!currentTenant.value)
  
  // ==================== ACTIONS ====================
  
  /**
   * Connexion utilisateur
   */
  const login = async (identifier, password) => {
    try {
      const isEmail = identifier.includes('@')
      const data = await apiService.login(identifier, password, isEmail)
      
      // Stocker le token et l'utilisateur
      token.value = data.token
      user.value = data.user
      
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('current_user', JSON.stringify(data.user))
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }
  
  /**
   * Déconnexion utilisateur
   */
  const logout = () => {
    token.value = null
    user.value = null
    currentTenant.value = null
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('current_user')
    localStorage.removeItem('current_tenant')
  }
  
  /**
   * Sélectionner un tenant
   */
  const selectTenant = (tenant) => {
    currentTenant.value = tenant
    localStorage.setItem('current_tenant', JSON.stringify(tenant))
  }
  
  /**
   * Changer de tenant
   */
  const changeTenant = () => {
    currentTenant.value = null
    localStorage.removeItem('current_tenant')
  }
  
  /**
   * Initialiser l'authentification au chargement de l'app
   */
  const initialize = () => {
    // Vérifier si le token est expiré
    if (token.value && isTokenExpired.value) {
      console.warn('Token expired, logging out')
      logout()
    }
  }
  
  /**
   * Mettre à jour les informations utilisateur
   */
  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('current_user', JSON.stringify(user.value))
  }
  
  return {
    // State
    token,
    user,
    currentTenant,
    // Getters
    isAuthenticated,
    userFullName,
    userEmail,
    userRoles,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isTokenExpired,
    hasTenantSelected,
    // Actions
    login,
    logout,
    selectTenant,
    changeTenant,
    initialize,
    updateUser
  }
})

