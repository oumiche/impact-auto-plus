import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '@/services/api.service'

export const useGarageStore = defineStore('garage', () => {
  // ==================== STATE ====================
  const garages = ref([])
  const currentGarage = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // ==================== ACTIONS ====================
  
  /**
   * Récupérer tous les garages
   */
  const fetchGarages = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.getGarages(params)
      garages.value = response.garages || response.data || []
      
      return garages.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching garages:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Récupérer un garage par ID
   */
  const fetchGarage = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.getGarage(id)
      currentGarage.value = response.garage || response.data
      
      return currentGarage.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching garage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Créer un garage
   */
  const createGarage = async (data) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.createGarage(data)
      const newGarage = response.garage || response.data
      
      garages.value.unshift(newGarage)
      
      return newGarage
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error creating garage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Mettre à jour un garage
   */
  const updateGarage = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.updateGarage(id, data)
      const updatedGarage = response.garage || response.data
      
      const index = garages.value.findIndex(g => g.id === id)
      if (index !== -1) {
        garages.value[index] = updatedGarage
      }
      
      if (currentGarage.value?.id === id) {
        currentGarage.value = updatedGarage
      }
      
      return updatedGarage
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error updating garage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Supprimer un garage
   */
  const deleteGarage = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      await apiService.deleteGarage(id)
      
      garages.value = garages.value.filter(g => g.id !== id)
      
      if (currentGarage.value?.id === id) {
        currentGarage.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error deleting garage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Réinitialiser l'état
   */
  const reset = () => {
    garages.value = []
    currentGarage.value = null
    loading.value = false
    error.value = null
  }
  
  return {
    // State
    garages,
    currentGarage,
    loading,
    error,
    // Actions
    fetchGarages,
    fetchGarage,
    createGarage,
    updateGarage,
    deleteGarage,
    reset
  }
})

