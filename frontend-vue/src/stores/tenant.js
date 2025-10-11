import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '@/services/api.service'

export const useTenantStore = defineStore('tenant', () => {
  // ==================== STATE ====================
  const tenants = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // ==================== ACTIONS ====================
  
  /**
   * Récupérer tous les tenants accessibles à l'utilisateur connecté
   */
  const fetchTenants = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.getUserTenants()
      tenants.value = response.tenants || []
      
      return tenants.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching tenants:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Récupérer un tenant par ID
   */
  const getTenantById = (id) => {
    return tenants.value.find(t => t.id === id)
  }
  
  /**
   * Réinitialiser l'état
   */
  const reset = () => {
    tenants.value = []
    loading.value = false
    error.value = null
  }
  
  return {
    // State
    tenants,
    loading,
    error,
    // Actions
    fetchTenants,
    getTenantById,
    reset
  }
})

