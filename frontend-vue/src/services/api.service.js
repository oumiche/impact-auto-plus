import axios from 'axios'
import router from '@/router'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://iautobackend.zeddev01.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000
})

// Intercepteur de requête - Ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponse - Gérer les erreurs 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('auth_token')
      localStorage.removeItem('current_user')
      localStorage.removeItem('current_tenant')
      
      // Rediriger vers login
      if (router.currentRoute.value.name !== 'Login') {
        router.push({ name: 'Login' })
      }
    }
    return Promise.reject(error)
  }
)

export default {
  // ==================== AUTH ====================
  
  /**
   * Connexion utilisateur
   */
  async login(identifier, password, isEmail = true) {
    const payload = isEmail 
      ? { email: identifier, password }
      : { username: identifier, password }
    
    const response = await apiClient.post('/login_check', payload)
    return response.data
  },
  
  // ==================== TENANTS ====================
  
  /**
   * Récupérer les tenants accessibles par l'utilisateur
   */
  async getTenants() {
    const response = await apiClient.get('/tenants')
    return response.data
  },
  
  /**
   * Récupérer un tenant par ID
   */
  async getTenant(id) {
    const response = await apiClient.get(`/tenants/${id}`)
    return response.data
  },
  
  // ==================== GARAGES ====================
  
  /**
   * Récupérer tous les garages
   */
  async getGarages(params = {}) {
    const response = await apiClient.get('/garages/admin', { params })
    return response.data
  },
  
  /**
   * Récupérer un garage par ID
   */
  async getGarage(id) {
    const response = await apiClient.get(`/garages/admin/${id}`)
    return response.data
  },
  
  /**
   * Créer un garage
   */
  async createGarage(data) {
    const response = await apiClient.post('/garages/admin', data)
    return response.data
  },
  
  /**
   * Mettre à jour un garage
   */
  async updateGarage(id, data) {
    const response = await apiClient.put(`/garages/admin/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer un garage
   */
  async deleteGarage(id) {
    const response = await apiClient.delete(`/garages/admin/${id}`)
    return response.data
  },
  
  // ==================== VEHICLES ====================
  
  /**
   * Récupérer tous les véhicules
   */
  async getVehicles(params = {}) {
    const response = await apiClient.get('/vehicles/admin', { params })
    return response.data
  },
  
  /**
   * Récupérer un véhicule par ID
   */
  async getVehicle(id) {
    const response = await apiClient.get(`/vehicles/${id}`)
    return response.data
  },
  
  /**
   * Créer un véhicule
   */
  async createVehicle(data) {
    const response = await apiClient.post('/vehicles/admin', data)
    return response.data
  },
  
  /**
   * Mettre à jour un véhicule
   */
  async updateVehicle(id, data) {
    const response = await apiClient.put(`/vehicles/admin/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer un véhicule
   */
  async deleteVehicle(id) {
    const response = await apiClient.delete(`/vehicles/admin/${id}`)
    return response.data
  },
  
  // ==================== SUPPLIES ====================
  
  /**
   * Récupérer toutes les fournitures
   */
  async getSupplies(params = {}) {
    const response = await apiClient.get('/supplies/admin', { params })
    return response.data
  },
  
  /**
   * Récupérer une fourniture par ID
   */
  async getSupply(id) {
    const response = await apiClient.get(`/supplies/${id}`)
    return response.data
  },
  
  /**
   * Créer une fourniture
   */
  async createSupply(data) {
    const response = await apiClient.post('/supplies/admin', data)
    return response.data
  },
  
  /**
   * Mettre à jour une fourniture
   */
  async updateSupply(id, data) {
    const response = await apiClient.put(`/supplies/admin/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer une fourniture
   */
  async deleteSupply(id) {
    const response = await apiClient.delete(`/supplies/admin/${id}`)
    return response.data
  },
  
  // ==================== USERS ====================
  
  /**
   * Récupérer tous les utilisateurs
   */
  async getUsers(params = {}) {
    const response = await apiClient.get('/users', { params })
    return response.data
  },
  
  /**
   * Récupérer un utilisateur par ID
   */
  async getUser(id) {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },
  
  /**
   * Créer un utilisateur
   */
  async createUser(data) {
    const response = await apiClient.post('/users', data)
    return response.data
  },
  
  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(id, data) {
    const response = await apiClient.put(`/users/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer un utilisateur
   */
  async deleteUser(id) {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  },
  
  // ==================== DASHBOARD ====================
  
  /**
   * Récupérer les statistiques du dashboard
   */
  async getDashboardStats() {
    const response = await apiClient.get('/dashboard/stats')
    return response.data
  },
  
  // ==================== BRANDS (MARQUES) ====================
  
  async getMarques(params = {}) {
    const response = await apiClient.get('/reference/brands', { params })
    return response.data
  },
  
  async createMarque(data) {
    const response = await apiClient.post('/reference/brands', data)
    return response.data
  },
  
  async updateMarque(id, data) {
    const response = await apiClient.put(`/reference/brands/${id}`, data)
    return response.data
  },
  
  async deleteMarque(id) {
    const response = await apiClient.delete(`/reference/brands/${id}`)
    return response.data
  },
  
  // ==================== MODELS (MODELES) ====================
  
  async getModeles(params = {}) {
    const response = await apiClient.get('/reference/models', { params })
    return response.data
  },
  
  async createModele(data) {
    const response = await apiClient.post('/reference/models', data)
    return response.data
  },
  
  async updateModele(id, data) {
    const response = await apiClient.put(`/reference/models/${id}`, data)
    return response.data
  },
  
  async deleteModele(id) {
    const response = await apiClient.delete(`/reference/models/${id}`)
    return response.data
  },
  
  // ==================== VEHICLE CATEGORIES ====================
  
  async getVehicleCategories(params = {}) {
    const response = await apiClient.get('/vehicle-categories/admin', { params })
    return response.data
  },

  async createVehicleCategory(data) {
    const response = await apiClient.post('/vehicle-categories/admin', data)
    return response.data
  },

  async updateVehicleCategory(id, data) {
    const response = await apiClient.put(`/vehicle-categories/admin/${id}`, data)
    return response.data
  },

  async deleteVehicleCategory(id) {
    const response = await apiClient.delete(`/vehicle-categories/admin/${id}`)
    return response.data
  },
  
  // ==================== VEHICLE COLORS ====================
  
  async getVehicleColors(params = {}) {
    const response = await apiClient.get('/vehicle-colors/admin', { params })
    return response.data
  },

  async createVehicleColor(data) {
    const response = await apiClient.post('/vehicle-colors/admin', data)
    return response.data
  },

  async updateVehicleColor(id, data) {
    const response = await apiClient.put(`/vehicle-colors/admin/${id}`, data)
    return response.data
  },

  async deleteVehicleColor(id) {
    const response = await apiClient.delete(`/vehicle-colors/admin/${id}`)
    return response.data
  },
  
  // ==================== FUEL TYPES ====================
  
  async getFuelTypes(params = {}) {
    const response = await apiClient.get('/reference/fuel-types', { params })
    return response.data
  },
  
  async createFuelType(data) {
    const response = await apiClient.post('/reference/fuel-types', data)
    return response.data
  },
  
  async updateFuelType(id, data) {
    const response = await apiClient.put(`/reference/fuel-types/${id}`, data)
    return response.data
  },
  
  async deleteFuelType(id) {
    const response = await apiClient.delete(`/reference/fuel-types/${id}`)
    return response.data
  },
  
  // ==================== LICENSE TYPES ====================
  
  async getLicenceTypes(params = {}) {
    const response = await apiClient.get('/reference/license-types', { params })
    return response.data
  },
  
  async createLicenceType(data) {
    const response = await apiClient.post('/reference/license-types', data)
    return response.data
  },
  
  async updateLicenceType(id, data) {
    const response = await apiClient.put(`/reference/license-types/${id}`, data)
    return response.data
  },
  
  async deleteLicenceType(id) {
    const response = await apiClient.delete(`/reference/license-types/${id}`)
    return response.data
  },
  
  // ==================== SUPPLY CATEGORIES ====================
  
  async getSupplyCategories(params = {}) {
    const response = await apiClient.get('/supply-categories/admin', { params })
    return response.data
  },

  async createSupplyCategory(data) {
    const response = await apiClient.post('/supply-categories/admin', data)
    return response.data
  },

  async updateSupplyCategory(id, data) {
    const response = await apiClient.put(`/supply-categories/admin/${id}`, data)
    return response.data
  },

  async deleteSupplyCategory(id) {
    const response = await apiClient.delete(`/supply-categories/admin/${id}`)
    return response.data
  },
  
  // ==================== INTERVENTION TYPES ====================
  
  async getInterventionTypes(params = {}) {
    const response = await apiClient.get('/intervention-types/admin', { params })
    return response.data
  },

  async createInterventionType(data) {
    const response = await apiClient.post('/intervention-types/admin', data)
    return response.data
  },

  async updateInterventionType(id, data) {
    const response = await apiClient.put(`/intervention-types/admin/${id}`, data)
    return response.data
  },

  async deleteInterventionType(id) {
    const response = await apiClient.delete(`/intervention-types/admin/${id}`)
    return response.data
  },
  
  // ==================== COLLABORATEURS ====================
  
  async getCollaborateurs(params = {}) {
    const response = await apiClient.get('/collaborateurs/admin', { params })
    return response.data
  },
  
  async createCollaborateur(data) {
    const response = await apiClient.post('/collaborateurs/admin', data)
    return response.data
  },
  
  async updateCollaborateur(id, data) {
    const response = await apiClient.put(`/collaborateurs/admin/${id}`, data)
    return response.data
  },
  
  async deleteCollaborateur(id) {
    const response = await apiClient.delete(`/collaborateurs/admin/${id}`)
    return response.data
  },
  
  // ==================== DRIVERS ====================
  
  async getDrivers(params = {}) {
    const response = await apiClient.get('/drivers', { params })
    return response.data
  },
  
  async getDriver(id) {
    const response = await apiClient.get(`/drivers/${id}`)
    return response.data
  },
  
  async createDriver(data) {
    const response = await apiClient.post('/drivers', data)
    return response.data
  },
  
  async updateDriver(id, data) {
    const response = await apiClient.put(`/drivers/${id}`, data)
    return response.data
  },
  
  async deleteDriver(id) {
    const response = await apiClient.delete(`/drivers/${id}`)
    return response.data
  },
  
  // ==================== VEHICLE ASSIGNMENTS ====================
  
  async getVehicleAssignments(params = {}) {
    const response = await apiClient.get('/vehicle-assignments', { params })
    return response.data
  },
  
  async createVehicleAssignment(data) {
    const response = await apiClient.post('/vehicle-assignments', data)
    return response.data
  },
  
  async updateVehicleAssignment(id, data) {
    const response = await apiClient.put(`/vehicle-assignments/${id}`, data)
    return response.data
  },
  
  async deleteVehicleAssignment(id) {
    const response = await apiClient.delete(`/vehicle-assignments/${id}`)
    return response.data
  },
  
  // ==================== VEHICLE INSURANCES ====================
  
  async getVehicleInsurances(params = {}) {
    const response = await apiClient.get('/vehicle-insurances', { params })
    return response.data
  },
  
  async createVehicleInsurance(data) {
    const response = await apiClient.post('/vehicle-insurances', data)
    return response.data
  },
  
  async updateVehicleInsurance(id, data) {
    const response = await apiClient.put(`/vehicle-insurances/${id}`, data)
    return response.data
  },
  
  async deleteVehicleInsurance(id) {
    const response = await apiClient.delete(`/vehicle-insurances/${id}`)
    return response.data
  },
  
  // ==================== VEHICLE FUEL LOGS ====================
  
  async getVehicleFuelLogs(params = {}) {
    const response = await apiClient.get('/vehicle-fuel-logs', { params })
    return response.data
  },
  
  async createVehicleFuelLog(data) {
    const response = await apiClient.post('/vehicle-fuel-logs', data)
    return response.data
  },
  
  async updateVehicleFuelLog(id, data) {
    const response = await apiClient.put(`/vehicle-fuel-logs/${id}`, data)
    return response.data
  },
  
  async deleteVehicleFuelLog(id) {
    const response = await apiClient.delete(`/vehicle-fuel-logs/${id}`)
    return response.data
  },
  
  // ==================== VEHICLE MAINTENANCES ====================
  
  async getVehicleMaintenances(params = {}) {
    const response = await apiClient.get('/vehicle-maintenances', { params })
    return response.data
  },
  
  async createVehicleMaintenance(data) {
    const response = await apiClient.post('/vehicle-maintenances', data)
    return response.data
  },
  
  async updateVehicleMaintenance(id, data) {
    const response = await apiClient.put(`/vehicle-maintenances/${id}`, data)
    return response.data
  },
  
  async deleteVehicleMaintenance(id) {
    const response = await apiClient.delete(`/vehicle-maintenances/${id}`)
    return response.data
  },
  
  // ==================== PARAMETERS ====================
  
  /**
   * Récupérer la devise système
   */
  async getCurrency() {
    const response = await apiClient.get('/parameters/currency')
    return response.data
  },
  
  // ==================== SUPPLY CATEGORIES ====================
  
  /**
   * Récupérer les catégories de fournitures
   */
  async getSupplyCategories(params = {}) {
    const response = await apiClient.get('/supply-categories/admin', { params })
    return response.data
  },
  
  /**
   * Créer une catégorie de fourniture
   */
  async createSupplyCategory(data) {
    const response = await apiClient.post('/supply-categories/admin', data)
    return response.data
  },
  
  /**
   * Mettre à jour une catégorie de fourniture
   */
  async updateSupplyCategory(id, data) {
    const response = await apiClient.put(`/supply-categories/admin/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer une catégorie de fourniture
   */
  async deleteSupplyCategory(id) {
    const response = await apiClient.delete(`/supply-categories/admin/${id}`)
    return response.data
  }
}

