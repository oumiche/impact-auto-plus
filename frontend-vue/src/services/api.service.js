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
  
  // Alias pour compatibilité
  async getBrands(params = {}) {
    return this.getMarques(params)
  },
  
  // ==================== MODELS (MODELES) ====================
  
  async getModeles(params = {}) {
    const response = await apiClient.get('/reference/models', { params })
    return response.data
  },
  
  // Alias pour compatibilité
  async getModels(params = {}) {
    return this.getModeles(params)
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
    const response = await apiClient.get('/drivers/admin', { params })
    return response.data
  },
  
  async getDriver(id) {
    const response = await apiClient.get(`/drivers/admin/${id}`)
    return response.data
  },
  
  async createDriver(data) {
    const response = await apiClient.post('/drivers/admin', data)
    return response.data
  },
  
  async updateDriver(id, data) {
    const response = await apiClient.put(`/drivers/admin/${id}`, data)
    return response.data
  },
  
  async deleteDriver(id) {
    const response = await apiClient.delete(`/drivers/admin/${id}`)
    return response.data
  },
  
  async getLicenseTypes() {
    const response = await apiClient.get('/drivers/license-types')
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
  },
  
  // ==================== USERS ====================
  
  /**
   * Récupérer un utilisateur par ID
   */
  async getUser(id) {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },
  
  /**
   * Récupérer la liste des utilisateurs
   */
  async getUsers(params = {}) {
    const response = await apiClient.get('/users', { params })
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
  
  // ==================== TENANTS ====================
  
  /**
   * Récupérer les tenants de l'utilisateur connecté (pour sélection après login)
   */
  async getUserTenants() {
    const response = await apiClient.get('/tenants')
    return response.data
  },
  
  /**
   * Récupérer un tenant par ID
   */
  async getTenant(id) {
    const response = await apiClient.get(`/tenants/admin/${id}`)
    return response.data
  },
  
  /**
   * Récupérer la liste des tenants (admin - tous les tenants)
   */
  async getTenants(params = {}) {
    const response = await apiClient.get('/tenants/admin', { params })
    return response.data
  },
  
  /**
   * Créer un tenant
   */
  async createTenant(data) {
    const response = await apiClient.post('/tenants/admin', data)
    return response.data
  },
  
  /**
   * Mettre à jour un tenant
   */
  async updateTenant(id, data) {
    const response = await apiClient.put(`/tenants/admin/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer un tenant
   */
  async deleteTenant(id) {
    const response = await apiClient.delete(`/tenants/admin/${id}`)
    return response.data
  },
  
  /**
   * Upload logo tenant
   */
  async uploadTenantLogo(tenantId, file) {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await apiClient.post(`/tenants/admin/${tenantId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
  
  // ==================== USER TENANT PERMISSIONS ====================
  
  /**
   * Récupérer les permissions utilisateur-tenant
   */
  async getUserTenantPermissions(params = {}) {
    const response = await apiClient.get('/user-tenant-permissions/admin', { params })
    return response.data
  },
  
  /**
   * Récupérer une permission par ID
   */
  async getUserTenantPermission(id) {
    const response = await apiClient.get(`/user-tenant-permissions/admin/${id}`)
    return response.data
  },
  
  /**
   * Créer une permission utilisateur-tenant
   */
  async createUserTenantPermission(data) {
    const response = await apiClient.post('/user-tenant-permissions/admin', data)
    return response.data
  },
  
  /**
   * Mettre à jour une permission utilisateur-tenant
   */
  async updateUserTenantPermission(id, data) {
    const response = await apiClient.put(`/user-tenant-permissions/admin/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer une permission utilisateur-tenant
   */
  async deleteUserTenantPermission(id) {
    const response = await apiClient.delete(`/user-tenant-permissions/admin/${id}`)
    return response.data
  },
  
  // ==================== CODE FORMATS ====================
  
  /**
   * Récupérer les formats de code
   */
  async getCodeFormats(params = {}) {
    const response = await apiClient.get('/code-formats/admin', { params })
    return response.data
  },
  
  /**
   * Récupérer un format de code par ID
   */
  async getCodeFormat(id) {
    const response = await apiClient.get(`/code-formats/admin/${id}`)
    return response.data
  },
  
  /**
   * Créer un format de code
   */
  async createCodeFormat(data) {
    const response = await apiClient.post('/code-formats/admin', data)
    return response.data
  },
  
  /**
   * Mettre à jour un format de code
   */
  async updateCodeFormat(id, data) {
    const response = await apiClient.put(`/code-formats/admin/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer un format de code
   */
  async deleteCodeFormat(id) {
    const response = await apiClient.delete(`/code-formats/admin/${id}`)
    return response.data
  },
  
  /**
   * Récupérer les types d'entités disponibles
   */
  async getCodeFormatEntityTypes() {
    const response = await apiClient.get('/code-formats/entity-types')
    return response.data
  },
  
  // ==================== SYSTEM PARAMETERS ====================
  
  /**
   * Récupérer les paramètres système
   */
  async getSystemParameters(params = {}) {
    const response = await apiClient.get('/parameters', { params })
    return response.data
  },
  
  /**
   * Récupérer un paramètre système par ID
   */
  async getSystemParameter(id) {
    const response = await apiClient.get(`/parameters/${id}`)
    return response.data
  },
  
  /**
   * Créer un paramètre système
   */
  async createSystemParameter(data) {
    const response = await apiClient.post('/parameters', data)
    return response.data
  },
  
  /**
   * Mettre à jour un paramètre système
   */
  async updateSystemParameter(id, data) {
    const response = await apiClient.put(`/parameters/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer un paramètre système
   */
  async deleteSystemParameter(id) {
    const response = await apiClient.delete(`/parameters/${id}`)
    return response.data
  },
  
  /**
   * Récupérer les catégories de paramètres
   */
  async getParameterCategories() {
    const response = await apiClient.get('/parameters/categories')
    return response.data
  },
  
  // ==================== SUPPLY PRICES ====================
  
  /**
   * Récupérer l'historique des prix
   */
  async getSupplyPrices(params = {}) {
    const response = await apiClient.get('/supply-prices', { params })
    return response.data
  },
  
  /**
   * Récupérer un prix par ID
   */
  async getSupplyPrice(id) {
    const response = await apiClient.get(`/supply-prices/${id}`)
    return response.data
  },
  
  /**
   * Créer un historique de prix
   */
  async createSupplyPrice(data) {
    const response = await apiClient.post('/supply-prices', data)
    return response.data
  },
  
  /**
   * Mettre à jour un historique de prix
   */
  async updateSupplyPrice(id, data) {
    const response = await apiClient.put(`/supply-prices/${id}`, data)
    return response.data
  },
  
  /**
   * Supprimer un historique de prix
   */
  async deleteSupplyPrice(id) {
    const response = await apiClient.delete(`/supply-prices/${id}`)
    return response.data
  },
  
  /**
   * Récupérer les analytics des prix
   */
  async getSupplyPricesAnalytics(params = {}) {
    const response = await apiClient.get('/supply-prices/analytics', { params })
    return response.data
  },
  
  /**
   * Obtenir une suggestion de prix
   */
  async getPriceSuggestion(params = {}) {
    const response = await apiClient.get('/supply-prices/suggestion', { params })
    return response.data
  },

  // ==================== VEHICLE INTERVENTIONS ====================
  
  /**
   * Interventions véhicules
   */
  async getVehicleInterventions(params = {}) {
    const response = await apiClient.get('/vehicle-interventions', { params })
    return response.data
  },

  async getVehicleIntervention(id) {
    const response = await apiClient.get(`/vehicle-interventions/${id}`)
    return response.data
  },

  async createVehicleIntervention(data) {
    const response = await apiClient.post('/vehicle-interventions', data)
    return response.data
  },

  async updateVehicleIntervention(id, data) {
    const response = await apiClient.put(`/vehicle-interventions/${id}`, data)
    return response.data
  },

  async deleteVehicleIntervention(id) {
    const response = await apiClient.delete(`/vehicle-interventions/${id}`)
    return response.data
  },

  /**
   * Workflow d'intervention
   */
  async getInterventionWorkflowStatus(id) {
    const response = await apiClient.get(`/vehicle-interventions/${id}/workflow/status`)
    return response.data
  },

  async transitionInterventionWorkflow(id, data) {
    const response = await apiClient.post(`/vehicle-interventions/${id}/workflow/transition`, data)
    return response.data
  },

  async startInterventionPrediagnostic(id) {
    const response = await apiClient.post(`/vehicle-interventions/${id}/workflow/prediagnostic/start`)
    return response.data
  },

  async completeInterventionPrediagnostic(id) {
    const response = await apiClient.post(`/vehicle-interventions/${id}/workflow/prediagnostic/complete`)
    return response.data
  },

  async startInterventionQuote(id) {
    const response = await apiClient.post(`/vehicle-interventions/${id}/workflow/quote/start`)
    return response.data
  },

  async approveIntervention(id, data) {
    const response = await apiClient.post(`/vehicle-interventions/${id}/workflow/approve`, data)
    return response.data
  },

  async cancelIntervention(id, data) {
    const response = await apiClient.post(`/vehicle-interventions/${id}/workflow/cancel`, data)
    return response.data
  },

  // ==================== INTERVENTION PREDIAGNOSTICS ====================
  
  async getInterventionPrediagnostics(params = {}) {
    const response = await apiClient.get('/intervention-prediagnostics', { params })
    return response.data
  },

  async getInterventionPrediagnostic(id) {
    const response = await apiClient.get(`/intervention-prediagnostics/${id}`)
    return response.data
  },

  async createInterventionPrediagnostic(data) {
    const response = await apiClient.post('/intervention-prediagnostics', data)
    return response.data
  },

  async updateInterventionPrediagnostic(id, data) {
    const response = await apiClient.put(`/intervention-prediagnostics/${id}`, data)
    return response.data
  },

  async deleteInterventionPrediagnostic(id) {
    const response = await apiClient.delete(`/intervention-prediagnostics/${id}`)
    return response.data
  },

  /**
   * Gestion des pièces jointes - Prédiagnostics
   */
  async uploadPrediagnosticAttachment(prediagnosticId, file, description = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    
    const response = await apiClient.post(
      `/intervention-prediagnostics/${prediagnosticId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  async getPrediagnosticAttachments(prediagnosticId) {
    const response = await apiClient.get(`/intervention-prediagnostics/${prediagnosticId}/attachments`)
    return response.data
  },

  async deletePrediagnosticAttachment(prediagnosticId, attachmentId) {
    const response = await apiClient.delete(`/intervention-prediagnostics/${prediagnosticId}/attachments/${attachmentId}`)
    return response.data
  },

  // ==================== INTERVENTION QUOTES ====================
  
  async getInterventionQuotes(params = {}) {
    const response = await apiClient.get('/intervention-quotes', { params })
    return response.data
  },

  async getInterventionQuote(id) {
    const response = await apiClient.get(`/intervention-quotes/${id}`)
    return response.data
  },

  async createInterventionQuote(data) {
    const response = await apiClient.post('/intervention-quotes', data)
    return response.data
  },

  async updateInterventionQuote(id, data) {
    const response = await apiClient.put(`/intervention-quotes/${id}`, data)
    return response.data
  },
  
  async validateInterventionQuote(id) {
    const response = await apiClient.post(`/intervention-quotes/${id}/validate`)
    return response.data
  },

  async cancelInterventionQuoteValidation(id) {
    const response = await apiClient.post(`/intervention-quotes/${id}/cancel-validation`)
    return response.data
  },

  async deleteInterventionQuote(id) {
    const response = await apiClient.delete(`/intervention-quotes/${id}`)
    return response.data
  },

  async getQuoteLinesForAuthorization(quoteId) {
    const response = await apiClient.get(`/intervention-quotes/${quoteId}/lines-for-authorization`)
    return response.data
  },

  /**
   * Gestion des pièces jointes - Quotes
   */
  async uploadQuoteAttachment(quoteId, file, description = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    
    const response = await apiClient.post(
      `/intervention-quotes/${quoteId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  async getQuoteAttachments(quoteId) {
    const response = await apiClient.get(`/intervention-quotes/${quoteId}/attachments`)
    return response.data
  },

  async deleteQuoteAttachment(quoteId, attachmentId) {
    const response = await apiClient.delete(`/intervention-quotes/${quoteId}/attachments/${attachmentId}`)
    return response.data
  },

  // ==================== INTERVENTION WORK AUTHORIZATIONS ====================
  
  async getInterventionWorkAuthorizations(params = {}) {
    const response = await apiClient.get('/intervention-work-authorizations', { params })
    return response.data
  },

  async getInterventionWorkAuthorization(id) {
    const response = await apiClient.get(`/intervention-work-authorizations/${id}`)
    return response.data
  },

  async createInterventionWorkAuthorization(data) {
    const response = await apiClient.post('/intervention-work-authorizations', data)
    return response.data
  },

  async updateInterventionWorkAuthorization(id, data) {
    const response = await apiClient.put(`/intervention-work-authorizations/${id}`, data)
    return response.data
  },

  async validateInterventionWorkAuthorization(id) {
    const response = await apiClient.post(`/intervention-work-authorizations/${id}/validate`)
    return response.data
  },

  async cancelInterventionWorkAuthorizationValidation(id) {
    const response = await apiClient.post(`/intervention-work-authorizations/${id}/cancel-validation`)
    return response.data
  },

  async deleteInterventionWorkAuthorization(id) {
    const response = await apiClient.delete(`/intervention-work-authorizations/${id}`)
    return response.data
  },

  /**
   * Gestion des pièces jointes - Work Authorizations
   */
  async uploadWorkAuthorizationAttachment(authId, file, description = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    
    const response = await apiClient.post(
      `/intervention-work-authorizations/${authId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  async getWorkAuthorizationAttachments(authId) {
    const response = await apiClient.get(`/intervention-work-authorizations/${authId}/attachments`)
    return response.data
  },

  async deleteWorkAuthorizationAttachment(authId, attachmentId) {
    const response = await apiClient.delete(`/intervention-work-authorizations/${authId}/attachments/${attachmentId}`)
    return response.data
  },

  // ==================== INTERVENTION RECEPTION REPORTS ====================
  
  async getInterventionReceptionReports(params = {}) {
    const response = await apiClient.get('/intervention-reception-reports', { params })
    return response.data
  },

  async getInterventionReceptionReport(id) {
    const response = await apiClient.get(`/intervention-reception-reports/${id}`)
    return response.data
  },

  async createInterventionReceptionReport(data) {
    const response = await apiClient.post('/intervention-reception-reports', data)
    return response.data
  },

  async updateInterventionReceptionReport(id, data) {
    const response = await apiClient.put(`/intervention-reception-reports/${id}`, data)
    return response.data
  },

  async deleteInterventionReceptionReport(id) {
    const response = await apiClient.delete(`/intervention-reception-reports/${id}`)
    return response.data
  },

  /**
   * Gestion des pièces jointes - Reception Reports
   */
  async uploadReceptionReportAttachment(reportId, file, description = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    
    const response = await apiClient.post(
      `/intervention-reception-reports/${reportId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  async getReceptionReportAttachments(reportId) {
    const response = await apiClient.get(`/intervention-reception-reports/${reportId}/attachments`)
    return response.data
  },

  async deleteReceptionReportAttachment(reportId, attachmentId) {
    const response = await apiClient.delete(`/intervention-reception-reports/${reportId}/attachments/${attachmentId}`)
    return response.data
  },

  // ==================== INTERVENTION INVOICES ====================
  
  async getInterventionInvoices(params = {}) {
    const response = await apiClient.get('/intervention-invoices', { params })
    return response.data
  },

  async getInterventionInvoice(id) {
    const response = await apiClient.get(`/intervention-invoices/${id}`)
    return response.data
  },

  async createInterventionInvoice(data) {
    const response = await apiClient.post('/intervention-invoices', data)
    return response.data
  },

  async updateInterventionInvoice(id, data) {
    const response = await apiClient.put(`/intervention-invoices/${id}`, data)
    return response.data
  },

  async deleteInterventionInvoice(id) {
    const response = await apiClient.delete(`/intervention-invoices/${id}`)
    return response.data
  },

  async generateInvoiceFromQuote(quoteId) {
    const response = await apiClient.post(`/intervention-invoices/from-quote/${quoteId}`)
    return response.data
  },

  async markInvoiceAsPaid(id, data) {
    const response = await apiClient.post(`/intervention-invoices/${id}/mark-paid`, data)
    return response.data
  },

  async downloadInvoicePdf(id) {
    const response = await apiClient.get(`/intervention-invoices/${id}/pdf`, {
      responseType: 'blob'
    })
    return response.data
  },

  async uploadInvoiceAttachment(id, file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post(`/intervention-invoices/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async getInvoiceAttachments(id) {
    const response = await apiClient.get(`/intervention-invoices/${id}/attachments`)
    return response.data
  },

  async deleteInvoiceAttachment(id, fileId) {
    const response = await apiClient.delete(`/intervention-invoices/${id}/attachments/${fileId}`)
    return response.data
  },

  // ==================== INTERVENTION FIELD VERIFICATIONS ====================
  
  async getInterventionFieldVerifications(params = {}) {
    const response = await apiClient.get('/intervention-field-verifications', { params })
    return response.data
  },

  async getInterventionFieldVerification(id) {
    const response = await apiClient.get(`/intervention-field-verifications/${id}`)
    return response.data
  },

  async createInterventionFieldVerification(data) {
    const response = await apiClient.post('/intervention-field-verifications', data)
    return response.data
  },

  async updateInterventionFieldVerification(id, data) {
    const response = await apiClient.put(`/intervention-field-verifications/${id}`, data)
    return response.data
  },

  async deleteInterventionFieldVerification(id) {
    const response = await apiClient.delete(`/intervention-field-verifications/${id}`)
    return response.data
  },

  async getFieldVerificationAttachments(verificationId) {
    const response = await apiClient.get(`/intervention-field-verifications/${verificationId}/attachments`)
    return response.data
  },

  async uploadFieldVerificationAttachment(verificationId, file, description = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    const response = await apiClient.post(
      `/intervention-field-verifications/${verificationId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  },

  async deleteFieldVerificationAttachment(verificationId, fileId) {
    const response = await apiClient.delete(`/intervention-field-verifications/${verificationId}/attachments/${fileId}`)
    return response.data
  },

  // ==================== REPORTS ====================
  
  async getReports(params = {}) {
    const response = await apiClient.get('/reports', { params })
    return response.data
  },

  async getReport(id) {
    const response = await apiClient.get(`/reports/${id}`)
    return response.data
  },

  async createReport(data) {
    const response = await apiClient.post('/reports', data)
    return response.data
  },

  async deleteReport(id) {
    const response = await apiClient.delete(`/reports/${id}`)
    return response.data
  },

  async getReportTypes() {
    const response = await apiClient.get('/reports/types')
    return response.data
  },

  async getReportStats() {
    const response = await apiClient.get('/reports/stats')
    return response.data
  },

  // Cache management
  async invalidateReportCache(id) {
    const response = await apiClient.post(`/reports/${id}/invalidate-cache`)
    return response.data
  },

  async invalidateReportCacheByType(type) {
    const response = await apiClient.post(`/reports/invalidate-cache/${type}`)
    return response.data
  },

  async cleanupReportCache() {
    const response = await apiClient.post('/reports/cleanup-cache')
    return response.data
  },

  async getReportCacheStats() {
    const response = await apiClient.get('/reports/cache/stats')
    return response.data
  },

  async optimizeReportCache() {
    const response = await apiClient.post('/reports/cache/optimize')
    return response.data
  },

  async cleanupOldReports(days = 30) {
    const response = await apiClient.post(`/reports/cleanup-old?days=${days}`)
    return response.data
  },

  async warmupReportCache(types = 'dashboard,kpis') {
    const response = await apiClient.post(`/reports/cache/warmup?types=${types}`)
    return response.data
  },

  // Business reports
  async getReportDashboard(refresh = false) {
    const response = await apiClient.get(`/reports/dashboard?refresh=${refresh}`)
    return response.data
  },

  async getReportKPIs(startDate = null, endDate = null) {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await apiClient.get('/reports/kpis', { params })
    return response.data
  },

  async getReportCostsByVehicle(vehicleId = null, startDate = null, endDate = null) {
    const params = {}
    if (vehicleId) params.vehicleId = vehicleId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await apiClient.get('/reports/costs/by-vehicle', { params })
    return response.data
  },

  async getReportMaintenanceSchedule(days = 90) {
    const response = await apiClient.get(`/reports/maintenance/schedule?days=${days}`)
    return response.data
  },

  async getReportFailuresAnalysis(startDate = null, endDate = null) {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await apiClient.get('/reports/failures/analysis', { params })
    return response.data
  }
}

