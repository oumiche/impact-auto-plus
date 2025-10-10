import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '@/services/api.service'

export const useVehicleStore = defineStore('vehicle', () => {
  // ==================== STATE ====================
  const vehicles = ref([])
  const currentVehicle = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // ==================== ACTIONS ====================
  
  /**
   * Récupérer tous les véhicules
   */
  const fetchVehicles = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.getVehicles(params)
      vehicles.value = response.vehicles || response.data || []
      
      return vehicles.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching vehicles:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Récupérer un véhicule par ID
   */
  const fetchVehicle = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.getVehicle(id)
      currentVehicle.value = response.vehicle || response.data
      
      return currentVehicle.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching vehicle:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Créer un véhicule
   */
  const createVehicle = async (data) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.createVehicle(data)
      const newVehicle = response.vehicle || response.data
      
      vehicles.value.unshift(newVehicle)
      
      return newVehicle
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error creating vehicle:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Mettre à jour un véhicule
   */
  const updateVehicle = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiService.updateVehicle(id, data)
      const updatedVehicle = response.vehicle || response.data
      
      const index = vehicles.value.findIndex(v => v.id === id)
      if (index !== -1) {
        vehicles.value[index] = updatedVehicle
      }
      
      if (currentVehicle.value?.id === id) {
        currentVehicle.value = updatedVehicle
      }
      
      return updatedVehicle
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error updating vehicle:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Supprimer un véhicule
   */
  const deleteVehicle = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      await apiService.deleteVehicle(id)
      
      vehicles.value = vehicles.value.filter(v => v.id !== id)
      
      if (currentVehicle.value?.id === id) {
        currentVehicle.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error deleting vehicle:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Réinitialiser l'état
   */
  const reset = () => {
    vehicles.value = []
    currentVehicle.value = null
    loading.value = false
    error.value = null
  }
  
  return {
    // State
    vehicles,
    currentVehicle,
    loading,
    error,
    // Actions
    fetchVehicles,
    fetchVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    reset
  }
})

