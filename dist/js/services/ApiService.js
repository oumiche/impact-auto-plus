/**
 * Impact Auto - Service API
 * Gestion centralisée des appels API vers Symfony
 */

class ApiService {
    constructor() {
        this.baseUrl = 'https://127.0.0.1:8000/api';
        this.token = localStorage.getItem('auth_token');
    }

    /**
     * Effectuer une requête HTTP
     */
    async request(endpoint, options = {}, skipContentType = false) {
        // Vérifier le token avant la requête (sauf pour les endpoints de login)
        if (!endpoint.includes('/login_check') && !endpoint.includes('/auth/logout')) {
            await this.validateTokenBeforeRequest();
        }

        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Accept': 'application/json',
            },
        };

        // Ne pas ajouter Content-Type si on utilise FormData ou si skipContentType est true
        if (!skipContentType && !(options.body instanceof FormData)) {
            defaultOptions.headers['Content-Type'] = 'application/json';
        }

        // Ajouter le token JWT si disponible
        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            if (!response.ok) {
                // Gestion spécifique des erreurs d'authentification
                if (response.status === 401) {
                    const errorMessage = data.message || data.error || 'Token expiré ou invalide';
                    this.handleAuthError(errorMessage);
                    throw new Error(errorMessage);
                }
                throw new Error(data.message || data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Vérifier si c'est une erreur de token JWT
            if (error.message.includes('JWT Token not found') || 
                error.message.includes('Token expiré') || 
                error.message.includes('Token invalide') ||
                error.message.includes('Authentication required')) {
                this.handleAuthError('Session expirée. Redirection vers la page de connexion...');
            }
            
            throw error;
        }
    }

    /**
     * Connexion utilisateur
     */
    async login(identifier, password, isEmail = true) {
        // Si c'est un username, on va d'abord chercher l'email correspondant
        if (!isEmail) {
            // Pour l'instant, on assume que le username est "admin" et l'email est "admin@impact-auto.com"
            // Dans une vraie application, on ferait un appel API pour récupérer l'email
            if (identifier === 'admin') {
                identifier = 'admin@impact-auto.com';
            }
        }
        
        return this.request('/login_check', {
            method: 'POST',
            body: JSON.stringify({ email: identifier, password }),
        });
    }

    /**
     * Déconnexion utilisateur
     */
    async logout() {
        const result = await this.request('/auth/logout', {
            method: 'POST',
        });
        
        // Supprimer le token du localStorage
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_tenant');
        
        return result;
    }

    /**
     * Récupérer le profil utilisateur
     */
    async getProfile() {
        return this.request('/auth/me');
    }

    /**
     * Récupérer l'utilisateur actuel (alias pour getProfile)
     */
    async getCurrentUser() {
        return this.request('/auth/me');
    }

    /**
     * Récupérer les paramètres
     */
    async getParameters(tenantId = null, search = '', category = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant_id', tenantId);
        if (search && search.trim()) params.append('search', search.trim());
        if (category !== 'all') params.append('category', category);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/parameters${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Créer un paramètre
     */
    async createParameter(parameterData) {
        return this.request('/parameters', {
            method: 'POST',
            body: JSON.stringify(parameterData),
        });
    }

    /**
     * Mettre à jour un paramètre
     */
    async updateParameter(id, parameterData) {
        return this.request(`/parameters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(parameterData),
        });
    }

    /**
     * Supprimer un paramètre
     */
    async deleteParameter(id) {
        return this.request(`/parameters/${id}`, {
            method: 'DELETE',
        });
    }

    // ========== MÉTHODES UTILISATEURS ==========

    /**
     * Récupérer tous les utilisateurs
     */
    async getUsers(tenantId = null, search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant_id', tenantId);
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/users${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer un utilisateur par ID
     */
    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    /**
     * Créer un nouvel utilisateur
     */
    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    /**
     * Mettre à jour un utilisateur
     */
    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    /**
     * Supprimer un utilisateur
     */
    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Activer/Désactiver un utilisateur
     */
    async toggleUserStatus(id, status) {
        return this.request(`/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    /**
     * Réinitialiser le mot de passe d'un utilisateur
     */
    async resetUserPassword(id, newPassword) {
        return this.request(`/users/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ password: newPassword }),
        });
    }

    /**
     * Récupérer les permissions d'un utilisateur
     */
    async getUserPermissions(id) {
        return this.request(`/users/${id}/permissions`);
    }

    /**
     * Mettre à jour les permissions d'un utilisateur
     */
    async updateUserPermissions(id, permissions) {
        return this.request(`/users/${id}/permissions`, {
            method: 'PUT',
            body: JSON.stringify(permissions),
        });
    }

    /**
     * Définir le token d'authentification
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    /**
     * Vérifier si l'utilisateur est connecté
     */
    isAuthenticated() {
        const token = localStorage.getItem('auth_token');
        this.token = token;
        return !!token;
    }

    /**
     * Vérifier la validité du token et rediriger si nécessaire
     */
    checkTokenValidity() {
        if (!this.isAuthenticated()) {
            this.handleAuthError('Aucun token d\'authentification trouvé. Redirection vers la page de connexion...');
            return false;
        }
        return true;
    }

    /**
     * Vérifier le token avant chaque requête API
     */
    async validateTokenBeforeRequest() {
        if (!this.checkTokenValidity()) {
            throw new Error('Token d\'authentification manquant');
        }
    }

    /**
     * Gérer les erreurs d'authentification
     */
    handleAuthError(message) {
        // Supprimer le token expiré
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_tenant');
        
        // Afficher une notification à l'utilisateur
        this.showAuthNotification(message);
        
        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }

    /**
     * Afficher une notification d'erreur d'authentification
     */
    showAuthNotification(message) {
        // Créer une notification visible
        const notification = document.createElement('div');
        notification.className = 'auth-error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Styles pour la notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
            text-align: center;
        `;
        
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        const closeBtn = notification.querySelector('.close-btn');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.2)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
        
        document.body.appendChild(notification);
        
        // Supprimer automatiquement après 10 secondes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    // ========== MÉTHODES MARQUES ==========

    /**
     * Récupérer toutes les marques
     */
    async getMarques(tenantId = null, search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant_id', tenantId);
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/reference/brands${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer une marque par ID
     */
    async getMarque(id) {
        return this.request(`/reference/brands/${id}`);
    }

    /**
     * Créer une nouvelle marque
     */
    async createMarque(marqueData) {
        return this.request('/reference/brands', {
            method: 'POST',
            body: JSON.stringify(marqueData),
        });
    }

    /**
     * Mettre à jour une marque
     */
    async updateMarque(id, marqueData) {
        return this.request(`/reference/brands/${id}`, {
            method: 'PUT',
            body: JSON.stringify(marqueData),
        });
    }

    /**
     * Supprimer une marque
     */
    async deleteMarque(id) {
        return this.request(`/reference/brands/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Activer/Désactiver une marque
     */
    async toggleMarqueStatus(id, status) {
        return this.request(`/reference/brands/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: status }),
        });
    }

    // ========== MÉTHODES MODÈLES ==========

    /**
     * Récupérer tous les modèles
     */
    async getModeles(tenantId = null, search = '', marqueId = null, status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant_id', tenantId);
        if (search && search.trim()) params.append('search', search.trim());
        if (marqueId) params.append('marque_id', marqueId);
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/reference/models${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer un modèle par ID
     */
    async getModele(id) {
        return this.request(`/reference/models/${id}`);
    }

    /**
     * Créer un nouveau modèle
     */
    async createModele(modeleData) {
        return this.request('/reference/models', {
            method: 'POST',
            body: JSON.stringify(modeleData),
        });
    }

    /**
     * Mettre à jour un modèle
     */
    async updateModele(id, modeleData) {
        return this.request(`/reference/models/${id}`, {
            method: 'PUT',
            body: JSON.stringify(modeleData),
        });
    }

    /**
     * Supprimer un modèle
     */
    async deleteModele(id) {
        return this.request(`/reference/models/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Activer/Désactiver un modèle
     */
    async toggleModeleStatus(id, status) {
        return this.request(`/reference/models/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: status }),
        });
    }

    /**
     * Récupérer les modèles d'une marque
     */
    async getModelesByMarque(marqueId, tenantId = null) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant_id', tenantId);
        
        const queryString = params.toString();
        return this.request(`/reference/brands/${marqueId}/modeles${queryString ? '?' + queryString : ''}`);
    }

    // ========== MÉTHODES FUEL TYPES ==========

    /**
     * Récupérer tous les types de carburant
     */
    async getFuelTypes(search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/reference/fuel-types${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer un type de carburant par ID
     */
    async getFuelType(id) {
        return this.request(`/reference/fuel-types/${id}`);
    }

    /**
     * Créer un type de carburant
     */
    async createFuelType(fuelTypeData) {
        return this.request('/reference/fuel-types', {
            method: 'POST',
            body: JSON.stringify(fuelTypeData),
        });
    }

    /**
     * Modifier un type de carburant
     */
    async updateFuelType(id, fuelTypeData) {
        return this.request(`/reference/fuel-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(fuelTypeData),
        });
    }

    /**
     * Supprimer un type de carburant
     */
    async deleteFuelType(id) {
        return this.request(`/reference/fuel-types/${id}`, {
            method: 'DELETE',
        });
    }

    // ========== MÉTHODES LICENSE TYPES ==========

    /**
     * Récupérer tous les types de permis
     */
    async getLicenseTypes(search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/reference/license-types${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer un type de permis par ID
     */
    async getLicenseType(id) {
        return this.request(`/reference/license-types/${id}`);
    }

    /**
     * Créer un type de permis
     */
    async createLicenseType(licenseTypeData) {
        return this.request('/reference/license-types', {
            method: 'POST',
            body: JSON.stringify(licenseTypeData),
        });
    }

    /**
     * Modifier un type de permis
     */
    async updateLicenseType(id, licenseTypeData) {
        return this.request(`/reference/license-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(licenseTypeData),
        });
    }

    /**
     * Supprimer un type de permis
     */
    async deleteLicenseType(id) {
        return this.request(`/reference/license-types/${id}`, {
            method: 'DELETE',
        });
    }

    // ========== MÉTHODES TENANTS ==========

    /**
     * Récupérer tous les tenants (pour l'administration)
     */
    async getTenants(search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/tenants/admin${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer un tenant par ID
     */
    async getTenant(id) {
        return this.request(`/tenants/admin/${id}`);
    }

    /**
     * Créer un nouveau tenant
     */
    async createTenant(tenantData) {
        return this.request('/tenants/admin', {
            method: 'POST',
            body: JSON.stringify(tenantData),
        });
    }

    /**
     * Mettre à jour un tenant
     */
    async updateTenant(id, tenantData) {
        return this.request(`/tenants/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(tenantData),
        });
    }

    /**
     * Supprimer un tenant
     */
    async deleteTenant(id) {
        return this.request(`/tenants/admin/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Activer/Désactiver un tenant
     */
    async toggleTenantStatus(id, status) {
        return this.request(`/tenants/admin/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: status }),
        });
    }

    /**
     * Récupérer les tenants accessibles par l'utilisateur connecté
     */
    async getAvailableTenants() {
        return this.request('/tenants');
    }

    /**
     * Récupérer le tenant actuel depuis localStorage
     */
    getCurrentTenant() {
        try {
            const tenant = localStorage.getItem('current_tenant');
            return tenant ? JSON.parse(tenant) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du tenant:', error);
            return null;
        }
    }

    /**
     * Récupérer le tenant actuel depuis l'API
     */
    async getCurrentTenantFromAPI(tenantId = null) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant_id', tenantId);
        
        const queryString = params.toString();
        return this.request(`/tenants/current${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Changer de tenant
     */
    async switchTenant(tenantId) {
        return this.request('/tenants/switch', {
            method: 'POST',
            body: JSON.stringify({ tenant_id: tenantId }),
        });
    }

    // ========== MÉTHODES CATÉGORIES DE FOURNITURES ==========

    /**
     * Récupérer toutes les catégories de fournitures (pour l'administration)
     */
    async getSupplyCategories(search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/supply-categories/admin${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer une catégorie de fourniture par ID
     */
    async getSupplyCategory(id) {
        return this.request(`/supply-categories/${id}`);
    }

    /**
     * Créer une nouvelle catégorie de fourniture
     */
    async createSupplyCategory(categoryData) {
        return this.request('/supply-categories/admin', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    }

    /**
     * Modifier une catégorie de fourniture
     */
    async updateSupplyCategory(id, categoryData) {
        return this.request(`/supply-categories/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    }

    /**
     * Supprimer une catégorie de fourniture
     */
    async deleteSupplyCategory(id) {
        return this.request(`/supply-categories/admin/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Récupérer toutes les catégories de fournitures (pour les selects)
     */
    async getAllSupplyCategories() {
        return this.request('/supply-categories/admin?limit=1000');
    }

    // ========== MÉTHODES CATÉGORIES DE VÉHICULES ==========

    /**
     * Récupérer toutes les catégories de véhicules (pour l'administration)
     */
    async getVehicleCategories(search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/vehicle-categories/admin${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer une catégorie de véhicule par ID
     */
    async getVehicleCategory(id) {
        return this.request(`/vehicle-categories/${id}`);
    }

    /**
     * Créer une nouvelle catégorie de véhicule
     */
    async createVehicleCategory(categoryData) {
        return this.request('/vehicle-categories/admin', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    }

    /**
     * Modifier une catégorie de véhicule
     */
    async updateVehicleCategory(id, categoryData) {
        return this.request(`/vehicle-categories/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    }

    /**
     * Supprimer une catégorie de véhicule
     */
    async deleteVehicleCategory(id) {
        return this.request(`/vehicle-categories/admin/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Récupérer toutes les catégories de véhicules (pour les selects)
     */
    async getAllVehicleCategories() {
        return this.request('/vehicle-categories/admin?limit=1000');
    }

    // ========== MÉTHODES COULEURS DE VÉHICULES ==========

    /**
     * Récupérer toutes les couleurs de véhicules (pour l'administration)
     */
    async getVehicleColors(search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/vehicle-colors/admin${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer une couleur de véhicule par ID
     */
    async getVehicleColor(id) {
        return this.request(`/vehicle-colors/${id}`);
    }

    /**
     * Créer une nouvelle couleur de véhicule
     */
    async createVehicleColor(colorData) {
        return this.request('/vehicle-colors/admin', {
            method: 'POST',
            body: JSON.stringify(colorData),
        });
    }

    /**
     * Modifier une couleur de véhicule
     */
    async updateVehicleColor(id, colorData) {
        return this.request(`/vehicle-colors/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(colorData),
        });
    }

    /**
     * Supprimer une couleur de véhicule
     */
    async deleteVehicleColor(id) {
        return this.request(`/vehicle-colors/admin/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Récupérer toutes les couleurs de véhicules (pour les selects)
     */
    async getAllVehicleColors() {
        return this.request('/vehicle-colors/admin?limit=1000');
    }

    // ========== MÉTHODES FOURNITURES ==========

    /**
     * Récupérer toutes les fournitures (pour l'administration)
     */
    async getSupplies(tenantId = null, search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant_id', tenantId);
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/supplies/admin${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer une fourniture par ID
     */
    async getSupply(id) {
        return this.request(`/supplies/${id}`);
    }

    /**
     * Créer une nouvelle fourniture
     */
    async createSupply(supplyData) {
        return this.request('/supplies/admin', {
            method: 'POST',
            body: JSON.stringify(supplyData),
        });
    }

    /**
     * Modifier une fourniture
     */
    async updateSupply(id, supplyData) {
        return this.request(`/supplies/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(supplyData),
        });
    }

    /**
     * Supprimer une fourniture
     */
    async deleteSupply(id) {
        return this.request(`/supplies/admin/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Récupérer toutes les fournitures (pour les selects)
     */
    async getAllSupplies() {
        return this.request('/supplies/admin?limit=1000');
    }

    // ========== GARAGES ==========

    /**
     * Récupérer la liste des garages
     */
    async getGarages(tenantId = null, search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        
        // Utiliser le tenant courant si pas spécifié
        if (!tenantId) {
            const currentTenant = this.getCurrentTenant();
            if (currentTenant) {
                tenantId = currentTenant.id;
            }
        }
        
        if (tenantId) params.append('tenant_id', tenantId);
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/garages/admin${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer un garage par ID
     */
    async getGarage(id) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/garages/admin/${id}${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Créer un garage
     */
    async createGarage(garageData) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/garages/admin${queryString ? '?' + queryString : ''}`, {
            method: 'POST',
            body: JSON.stringify(garageData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Mettre à jour un garage
     */
    async updateGarage(id, garageData) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/garages/admin/${id}${queryString ? '?' + queryString : ''}`, {
            method: 'PUT',
            body: JSON.stringify(garageData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Supprimer un garage
     */
    async deleteGarage(id) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/garages/admin/${id}${queryString ? '?' + queryString : ''}`, {
            method: 'DELETE',
        });
    }

    /**
     * Récupérer tous les garages (pour les selects)
     */
    async getAllGarages() {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        params.append('limit', '1000');
        const queryString = params.toString();
        return this.request(`/garages/admin?${queryString}`);
    }

    // ========== USER TENANT PERMISSIONS ==========

    /**
     * Récupérer la liste des affectations utilisateur-tenant
     */
    async getUserTenantPermissions(tenantId = null, search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        
        // Pour le super admin, on peut spécifier un tenant_id ou laisser vide pour voir tous
        // Pour les utilisateurs normaux, utiliser le tenant courant
        if (!tenantId) {
            const currentTenant = this.getCurrentTenant();
            if (currentTenant) {
                tenantId = currentTenant.id;
            }
        }
        
        // Toujours ajouter tenant_id si spécifié (même pour super admin)
        if (tenantId) params.append('tenant_id', tenantId);
        if (search && search.trim()) params.append('search', search.trim());
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        return this.request(`/user-tenant-permissions/admin${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Récupérer une affectation par ID
     */
    async getUserTenantPermission(id) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/user-tenant-permissions/admin/${id}${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Créer une affectation utilisateur-tenant
     */
    async createUserTenantPermission(permissionData) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/user-tenant-permissions/admin${queryString ? '?' + queryString : ''}`, {
            method: 'POST',
            body: JSON.stringify(permissionData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Mettre à jour une affectation utilisateur-tenant
     */
    async updateUserTenantPermission(id, permissionData) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/user-tenant-permissions/admin/${id}${queryString ? '?' + queryString : ''}`, {
            method: 'PUT',
            body: JSON.stringify(permissionData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Supprimer une affectation utilisateur-tenant
     */
    async deleteUserTenantPermission(id) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/user-tenant-permissions/admin/${id}${queryString ? '?' + queryString : ''}`, {
            method: 'DELETE',
        });
    }

    /**
     * Récupérer les tenants d'un utilisateur
     */
    async getUserTenants(userId) {
        const currentTenant = this.getCurrentTenant();
        const params = new URLSearchParams();
        if (currentTenant) {
            params.append('tenant_id', currentTenant.id);
        }
        const queryString = params.toString();
        return this.request(`/user-tenant-permissions/admin/users/${userId}/tenants${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Rechercher des utilisateurs
     */
    async searchUsers(query) {
        const params = new URLSearchParams();
        params.append('search', query);
        params.append('limit', '50');
        return this.request(`/users/admin/search?${params.toString()}`);
    }

    /**
     * Rechercher des tenants
     */
    async searchTenants(query) {
        const params = new URLSearchParams();
        params.append('search', query);
        params.append('limit', '50');
        return this.request(`/tenants/admin/search?${params.toString()}`);
    }

    // ========== UTILITAIRES DE FORMATAGE ==========

    /**
     * Formater un prix avec la devise et l'espace comme séparateur de milliers
     */
    formatPrice(price, currency = 'F CFA') {
        const numericPrice = parseFloat(price);
        
        // Formater avec espace comme séparateur de milliers
        const formattedPrice = numericPrice.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        }).replace(/\s/g, ' '); // S'assurer que c'est bien un espace
        
        return formattedPrice + ' ' + currency;
    }

    /**
     * Formater un nombre avec espace comme séparateur de milliers
     */
    formatNumber(number, decimals = 0) {
        const numericNumber = parseFloat(number);
        
        return numericNumber.toLocaleString('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: true
        }).replace(/\s/g, ' ');
    }

    // ===== MÉTHODES POUR LES CONDUCTEURS =====

    /**
     * Récupérer la liste des conducteurs
     */
    async getDrivers(tenantId = null, search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant', tenantId);
        if (search) params.append('search', search);
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);

        return await this.request(`/drivers/admin?${params.toString()}`);
    }

    /**
     * Créer un nouveau conducteur
     */
    async createDriver(driverData) {
        return await this.request('/drivers/admin', {
            method: 'POST',
            body: JSON.stringify(driverData)
        });
    }

    /**
     * Modifier un conducteur existant
     */
    async updateDriver(driverId, driverData) {
        return await this.request(`/drivers/admin/${driverId}`, {
            method: 'PUT',
            body: JSON.stringify(driverData)
        });
    }

    /**
     * Supprimer un conducteur
     */
    async deleteDriver(driverId) {
        return await this.request(`/drivers/admin/${driverId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Récupérer les types de permis disponibles
     */
    async getDriverLicenseTypes() {
        return await this.request('/drivers/license-types');
    }

    // ===== MÉTHODES POUR LES VÉHICULES =====

    /**
     * Récupérer la liste des véhicules
     */
    async getVehicles(tenantId = null, search = '', status = 'all', page = 1, limit = 10) {
        const params = new URLSearchParams();
        if (tenantId) params.append('tenant', tenantId);
        if (search) params.append('search', search);
        if (status !== 'all') params.append('status', status);
        params.append('page', page);
        params.append('limit', limit);

        return await this.request(`/vehicles/admin?${params.toString()}`);
    }

    /**
     * Créer un nouveau véhicule
     */
    async createVehicle(vehicleData) {
        return await this.request('/vehicles/admin', {
            method: 'POST',
            body: JSON.stringify(vehicleData)
        });
    }

    /**
     * Modifier un véhicule existant
     */
    async updateVehicle(vehicleId, vehicleData) {
        return await this.request(`/vehicles/admin/${vehicleId}`, {
            method: 'PUT',
            body: JSON.stringify(vehicleData)
        });
    }

    /**
     * Supprimer un véhicule
     */
    async deleteVehicle(vehicleId) {
        return await this.request(`/vehicles/admin/${vehicleId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Récupérer les marques disponibles
     */
    async getVehicleBrands(search = '', limit = 50) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (limit) params.append('limit', limit);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicles/brands?${queryString}` : '/vehicles/brands';
        
        return await this.request(url);
    }

    /**
     * Récupérer les modèles d'une marque
     */
    async getVehicleModels(brandId, search = '', limit = 50) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (limit) params.append('limit', limit);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicles/models/${brandId}?${queryString}` : `/vehicles/models/${brandId}`;
        
        return await this.request(url);
    }

    /**
     * Récupérer les couleurs disponibles
     */
    async getVehicleColors() {
        return await this.request('/vehicles/colors');
    }

    /**
     * Récupérer les catégories de véhicules disponibles
     */
    async getVehicleCategories() {
        return await this.request('/vehicles/categories');
    }

    /**
     * Récupérer les types de carburant disponibles
     */
    async getVehicleFuelTypes() {
        return await this.request('/vehicles/fuel-types');
    }

    // ===== VEHICLE ASSIGNMENTS =====

    /**
     * Récupérer les assignations de véhicules
     */
    async getVehicleAssignments(page = 1, limit = 10, search = '', status = 'all') {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (search) params.append('search', search);
        if (status !== 'all') params.append('status', status);
        
        return await this.request(`/vehicle-assignments?${params.toString()}`);
    }

    /**
     * Créer une nouvelle assignation de véhicule
     */
    async createVehicleAssignment(assignmentData) {
        return await this.request('/vehicle-assignments', {
            method: 'POST',
            body: JSON.stringify(assignmentData)
        });
    }

    /**
     * Mettre à jour une assignation de véhicule
     */
    async updateVehicleAssignment(assignmentId, assignmentData) {
        return await this.request(`/vehicle-assignments/${assignmentId}`, {
            method: 'PUT',
            body: JSON.stringify(assignmentData)
        });
    }

    /**
     * Supprimer une assignation de véhicule
     */
    async deleteVehicleAssignment(assignmentId) {
        return await this.request(`/vehicle-assignments/${assignmentId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Récupérer les véhicules disponibles pour assignation
     */
    async getAvailableVehicles(search = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicle-assignments/vehicles?${queryString}` : '/vehicle-assignments/vehicles';
        
        return await this.request(url);
    }

    /**
     * Récupérer les conducteurs disponibles pour assignation
     */
    async getAvailableDrivers(search = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicle-assignments/drivers?${queryString}` : '/vehicle-assignments/drivers';
        
        return await this.request(url);
    }

    // ===== VEHICLE INSURANCES =====
    /**
     * Récupérer la liste des assurances véhicules
     */
    async getVehicleInsurances(page = 1, limit = 10, search = '', status = 'all') {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (search) params.append('search', search);
        if (status !== 'all') params.append('status', status);
        
        return await this.request(`/vehicle-insurances?${params.toString()}`);
    }

    /**
     * Créer une nouvelle assurance véhicule
     */
    async createVehicleInsurance(insuranceData) {
        return await this.request('/vehicle-insurances', {
            method: 'POST',
            body: JSON.stringify(insuranceData)
        });
    }

    /**
     * Mettre à jour une assurance véhicule
     */
    async updateVehicleInsurance(insuranceId, insuranceData) {
        return await this.request(`/vehicle-insurances/${insuranceId}`, {
            method: 'PUT',
            body: JSON.stringify(insuranceData)
        });
    }

    /**
     * Supprimer une assurance véhicule
     */
    async deleteVehicleInsurance(insuranceId) {
        return await this.request(`/vehicle-insurances/${insuranceId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Récupérer les véhicules disponibles pour assurance
     */
    async getAvailableVehiclesForInsurance(search = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicle-insurances/vehicles?${queryString}` : '/vehicle-insurances/vehicles';
        
        return await this.request(url);
    }

    // ===== VEHICLE FUEL LOGS =====
    /**
     * Récupérer la liste des carnets de carburant
     */
    async getVehicleFuelLogs(page = 1, limit = 10, search = '', vehicleId = '', driverId = '') {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (search) params.append('search', search);
        if (vehicleId) params.append('vehicle_id', vehicleId);
        if (driverId) params.append('driver_id', driverId);
        
        return await this.request(`/vehicle-fuel-logs?${params.toString()}`);
    }

    /**
     * Créer un carnet de carburant
     */
    async createVehicleFuelLog(fuelLogData) {
        return await this.request('/vehicle-fuel-logs', {
            method: 'POST',
            body: JSON.stringify(fuelLogData)
        });
    }

    /**
     * Mettre à jour un carnet de carburant
     */
    async updateVehicleFuelLog(fuelLogId, fuelLogData) {
        return await this.request(`/vehicle-fuel-logs/${fuelLogId}`, {
            method: 'PUT',
            body: JSON.stringify(fuelLogData)
        });
    }

    /**
     * Supprimer un carnet de carburant
     */
    async deleteVehicleFuelLog(fuelLogId) {
        return await this.request(`/vehicle-fuel-logs/${fuelLogId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Synchroniser le kilométrage d'un véhicule
     */
    async syncVehicleMileage(vehicleId) {
        return await this.request(`/vehicle-fuel-logs/sync-vehicle-mileage/${vehicleId}`, {
            method: 'POST'
        });
    }

    /**
     * Récupérer les véhicules disponibles pour carnet de carburant
     */
    async getAvailableVehiclesForFuelLog(search = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicle-fuel-logs/vehicles?${queryString}` : '/vehicle-fuel-logs/vehicles';
        
        return await this.request(url);
    }

    /**
     * Récupérer les conducteurs disponibles pour carnet de carburant
     */
    async getAvailableDriversForFuelLog(search = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicle-fuel-logs/drivers?${queryString}` : '/vehicle-fuel-logs/drivers';
        
        return await this.request(url);
    }

    /**
     * Récupérer les types de carburant
     */
    async getFuelTypes() {
        return await this.request('/vehicle-fuel-logs/fuel-types');
    }

    // ===== VEHICLE MAINTENANCES =====
    async getVehicleMaintenances(page = 1, limit = 10, search = '', vehicleId = '', status = '', type = '') {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (search) params.append('search', search);
        if (vehicleId) params.append('vehicle_id', vehicleId);
        if (status) params.append('status', status);
        if (type) params.append('type', type);
        
        return await this.request(`/vehicle-maintenances?${params.toString()}`);
    }
    async createVehicleMaintenance(maintenanceData) {
        return await this.request('/vehicle-maintenances', {
            method: 'POST',
            body: JSON.stringify(maintenanceData)
        });
    }
    async updateVehicleMaintenance(maintenanceId, maintenanceData) {
        return await this.request(`/vehicle-maintenances/${maintenanceId}`, {
            method: 'PUT',
            body: JSON.stringify(maintenanceData)
        });
    }
    async deleteVehicleMaintenance(maintenanceId) {
        return await this.request(`/vehicle-maintenances/${maintenanceId}`, {
            method: 'DELETE'
        });
    }
    async getAvailableVehiclesForMaintenance(search = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const url = queryString ? `/vehicle-maintenances/vehicles?${queryString}` : '/vehicle-maintenances/vehicles';
        
        return await this.request(url);
    }

    /**
     * Synchroniser le kilométrage d'un véhicule depuis les maintenances
     */
    async syncVehicleMileageFromMaintenance(vehicleId) {
        return await this.request(`/vehicle-maintenances/sync-vehicle-mileage/${vehicleId}`, {
            method: 'POST'
        });
    }

    // ===== VEHICLE TRACKING =====
    async syncVehicleMileageFromTracking(vehicleId) {
        return await this.request(`/vehicle-tracking/sync-mileage/${vehicleId}`, {
            method: 'POST'
        });
    }

    async getVehicleTrackingInfo(vehicleId) {
        return await this.request(`/vehicle-tracking/vehicle-info/${vehicleId}`);
    }

    // ===== INTERVENTION TYPES =====
    async getInterventionTypes(page = 1, limit = 10, search = '', status = '') {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        
        return await this.request(`/intervention-types/admin?${params.toString()}`);
    }

    async createInterventionType(interventionTypeData) {
        return await this.request('/intervention-types/admin', {
            method: 'POST',
            body: JSON.stringify(interventionTypeData)
        });
    }

    async updateInterventionType(interventionTypeId, interventionTypeData) {
        return await this.request(`/intervention-types/admin/${interventionTypeId}`, {
            method: 'PUT',
            body: JSON.stringify(interventionTypeData)
        });
    }

    async deleteInterventionType(interventionTypeId) {
        return await this.request(`/intervention-types/admin/${interventionTypeId}`, {
            method: 'DELETE'
        });
    }

    async getActiveInterventionTypes() {
        return await this.request('/intervention-types/active');
    }

    async searchInterventionTypes(search = '', limit = 10) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('limit', limit);
        
        return await this.request(`/intervention-types/search?${params.toString()}`);
    }

    // ===== VEHICLE INTERVENTIONS =====
    async getVehicleInterventions(page = 1, limit = 10, search = '', status = '') {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        
        return await this.request(`/vehicle-interventions?${params.toString()}`);
    }
}

// Instance globale du service API
window.apiService = new ApiService();
