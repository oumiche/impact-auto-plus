import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Factory pour créer un store CRUD générique
 */
export function createCrudStore(storeName, apiMethods) {
  return defineStore(storeName, () => {
    // State
    const items = ref([])
    const currentItem = ref(null)
    const loading = ref(false)
    const error = ref(null)
    
    // Actions
    const fetchItems = async (params = {}) => {
      try {
        loading.value = true
        error.value = null
        
        const response = await apiMethods.getAll(params)
        items.value = response.data || response[storeName] || []
        
        return items.value
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        console.error(`Error fetching ${storeName}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }
    
    const fetchItem = async (id) => {
      try {
        loading.value = true
        error.value = null
        
        const response = await apiMethods.getOne(id)
        currentItem.value = response.data || response[storeName.slice(0, -1)]
        
        return currentItem.value
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        console.error(`Error fetching ${storeName}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }
    
    const createItem = async (data) => {
      try {
        loading.value = true
        error.value = null
        
        const response = await apiMethods.create(data)
        const newItem = response.data || response[storeName.slice(0, -1)]
        
        items.value.unshift(newItem)
        
        return newItem
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        console.error(`Error creating ${storeName}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }
    
    const updateItem = async (id, data) => {
      try {
        loading.value = true
        error.value = null
        
        const response = await apiMethods.update(id, data)
        const updatedItem = response.data || response[storeName.slice(0, -1)]
        
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = updatedItem
        }
        
        if (currentItem.value?.id === id) {
          currentItem.value = updatedItem
        }
        
        return updatedItem
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        console.error(`Error updating ${storeName}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }
    
    const deleteItem = async (id) => {
      try {
        loading.value = true
        error.value = null
        
        await apiMethods.delete(id)
        
        items.value = items.value.filter(item => item.id !== id)
        
        if (currentItem.value?.id === id) {
          currentItem.value = null
        }
        
        return true
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        console.error(`Error deleting ${storeName}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }
    
    const reset = () => {
      items.value = []
      currentItem.value = null
      loading.value = false
      error.value = null
    }
    
    return {
      items,
      currentItem,
      loading,
      error,
      fetchItems,
      fetchItem,
      createItem,
      updateItem,
      deleteItem,
      reset
    }
  })
}

