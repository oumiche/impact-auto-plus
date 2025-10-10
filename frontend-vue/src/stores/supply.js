import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '@/services/api.service'

export const useSupplyStore = defineStore('supply', () => {
  // ==================== STATE ====================
  const supplies = ref([])
  const currentSupply = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // ==================== ACTIONS ====================
  
  /**
   * Récupérer toutes les fournitures
   */
  const fetchSupplies = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.getSupplies(params)
      supplies.value = response.supplies || response.data || []
      
      // Retourner la réponse complète avec pagination
      return response
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching supplies:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Récupérer une fourniture par ID
   */
  const fetchSupply = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.getSupply(id)
      currentSupply.value = response.supply || response.data
      
      return currentSupply.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching supply:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Créer une fourniture
   */
  const createSupply = async (data) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.createSupply(data)
      const newSupply = response.supply || response.data
      
      supplies.value.unshift(newSupply)
      
      return newSupply
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error creating supply:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Mettre à jour une fourniture
   */
  const updateSupply = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.updateSupply(id, data)
      const updatedSupply = response.supply || response.data
      
      const index = supplies.value.findIndex(s => s.id === id)
      if (index !== -1) {
        supplies.value[index] = updatedSupply
      }
      
      if (currentSupply.value?.id === id) {
        currentSupply.value = updatedSupply
      }
      
      return updatedSupply
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error updating supply:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Supprimer une fourniture
   */
  const deleteSupply = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      await apiService.deleteSupply(id)
      
      supplies.value = supplies.value.filter(s => s.id !== id)
      
      if (currentSupply.value?.id === id) {
        currentSupply.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error deleting supply:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Réinitialiser l'état
   */
  const reset = () => {
    supplies.value = []
    currentSupply.value = null
    loading.value = false
    error.value = null
  }
  
  return {
    // State
    supplies,
    currentSupply,
    loading,
    error,
    // Actions
    fetchSupplies,
    fetchSupply,
    createSupply,
    updateSupply,
    deleteSupply,
    reset
  }
})

