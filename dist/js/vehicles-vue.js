/**
 * Impact Auto - Véhicules Vue.js
 * Composant CRUD pour la gestion des véhicules
 */

const VehicleCrud = {
    template: `
        <div class="parameter-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1 class="section-title">Gestion des Véhicules</h1>
                            <p class="page-subtitle">Gérez votre flotte de véhicules et leurs informations</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="fas fa-plus"></i>
                            Nouveau Véhicule
                        </button>
                    </div>
                </div>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher par plaque, marque, modèle, catégorie..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="activeFilter" @change="loadVehicles" class="filter-select">
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="maintenance">En entretien</option>
                        <option value="out_of_service">Hors service</option>
                    </select>
                </div>
            </div>

            <!-- Tableau des véhicules -->
            <div class="table-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des véhicules...
                </div>
                
                <div v-else-if="vehicles.length === 0" class="no-data">
                    <i class="fas fa-car"></i>
                    <p>Aucun véhicule trouvé</p>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Plaque</th>
                            <th>Véhicule</th>
                            <th>Couleur</th>
                            <th>Année</th>
                            <th>Kilométrage</th>
                            <th>Tracking</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="vehicle in vehicles" :key="vehicle.id">
                            <td>
                                <code v-if="vehicle.code" class="entity-code">{{ vehicle.code }}</code>
                                <span v-else class="no-code">-</span>
                            </td>
                            <td>
                                <div class="plate-number">
                                    {{ vehicle.plateNumber }}
                                </div>
                            </td>
                            <td>
                                <div class="vehicle-info">
                                    <div class="vehicle-name">
                                        <strong>{{ vehicle.brand?.name }} {{ vehicle.model?.name }}</strong>
                                    </div>
                                    <div v-if="vehicle.category" class="vehicle-category">
                                        {{ vehicle.category.name }}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div v-if="vehicle.color" class="vehicle-color">
                                    <div class="color-preview" :style="{ backgroundColor: vehicle.color.hexCode }"></div>
                                    <span>{{ vehicle.color.name }}</span>
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <span v-if="vehicle.year">{{ vehicle.year }}</span>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div class="mileage">
                                    {{ formatNumber(vehicle.mileage) }} km
                                </div>
                            </td>
                            <td>
                                <div v-if="vehicle.trackingId" class="tracking-id">
                                    <i class="fas fa-satellite-dish"></i>
                                    {{ vehicle.trackingId }}
                                </div>
                                <div v-else class="no-tracking">
                                    <span class="text-muted">-</span>
                                </div>
                            </td>
                            <td>
                                <span :class="getStatusClass(vehicle)">
                                    {{ vehicle.statusLabel }}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" @click="editVehicle(vehicle)" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteVehicle(vehicle)" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="pagination && pagination.pages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    :disabled="!pagination.hasPrev"
                    @click="changePage(pagination.page - 1)"
                >
                    <i class="fas fa-chevron-left"></i>
                    Précédent
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.page }} sur {{ pagination.pages }}
                    ({{ pagination.total }} véhicule(s))
                </span>
                
                <button 
                    class="btn btn-outline" 
                    :disabled="!pagination.hasNext"
                    @click="changePage(pagination.page + 1)"
                >
                    Suivant
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Modal de création/édition -->
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content modal-lg" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le véhicule' : 'Nouveau véhicule' }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form @submit.prevent="saveVehicle" class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicle-plate">Numéro de plaque *</label>
                                <input 
                                    type="text" 
                                    id="vehicle-plate"
                                    v-model="form.plateNumber"
                                    required
                                    placeholder="Ex: AB-123-CD"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-status">Statut</label>
                                <select id="vehicle-status" v-model="form.status">
                                    <option value="active">Actif</option>
                                    <option value="maintenance">En maintenance</option>
                                    <option value="out_of_service">Hors service</option>
                                    <option value="sold">Vendu</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicle-brand">Marque *</label>
                                <div class="searchable-select">
                                    <input 
                                        type="text" 
                                        id="vehicle-brand"
                                        :value="selectedBrandName || brandSearch"
                                        @input="handleBrandInput"
                                        @focus="handleBrandFocus"
                                        @blur="handleBrandBlur"
                                        placeholder="Rechercher une marque..."
                                        required
                                    >
                                    <div class="dropdown-options" v-if="showBrandDropdown && brands.length > 0">
                                        <div 
                                            v-for="brand in brands" 
                                            :key="brand.id" 
                                            class="dropdown-option"
                                            @click="selectBrand(brand)"
                                        >
                                            {{ brand.name }}
                                        </div>
                                    </div>
                                    <input type="hidden" v-model="form.brandId">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-model">Modèle *</label>
                                <div class="searchable-select">
                                    <input 
                                        type="text" 
                                        id="vehicle-model"
                                        :value="selectedModelName || modelSearch"
                                        @input="handleModelInput"
                                        @focus="handleModelFocus"
                                        @blur="handleModelBlur"
                                        placeholder="Rechercher un modèle..."
                                        :disabled="!form.brandId"
                                        required
                                    >
                                    <div class="dropdown-options" v-if="showModelDropdown && models.length > 0">
                                        <div 
                                            v-for="model in models" 
                                            :key="model.id" 
                                            class="dropdown-option"
                                            @click="selectModel(model)"
                                        >
                                            {{ model.name }}
                                        </div>
                                    </div>
                                    <input type="hidden" v-model="form.modelId">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicle-color">Couleur *</label>
                                <select id="vehicle-color" v-model="form.colorId" required>
                                    <option value="">Sélectionner une couleur...</option>
                                    <option v-for="color in colors" :key="color.id" :value="color.id">
                                        {{ color.name }}
                                    </option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-category">Type</label>
                                <select id="vehicle-category" v-model="form.categoryId">
                                    <option value="">Sélectionner un type...</option>
                                    <option v-for="category in categories" :key="category.id" :value="category.id">
                                        {{ category.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicle-year">Année</label>
                                <input 
                                    type="number" 
                                    id="vehicle-year"
                                    v-model="form.year"
                                    min="1900"
                                    :max="new Date().getFullYear() + 1"
                                    placeholder="Ex: 2023"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-mileage">Kilométrage</label>
                                <div class="input-with-button">
                                    <input 
                                        type="number" 
                                        id="vehicle-mileage"
                                        v-model="form.mileage"
                                        min="0"
                                        placeholder="Ex: 50000"
                                    >
                                    <button 
                                        type="button" 
                                        class="btn btn-sm btn-outline" 
                                        @click="syncVehicleMileageFromTracking" 
                                        :disabled="saving || !form.trackingId"
                                        title="Synchroniser depuis le dispositif de tracking"
                                    >
                                        <i class="fas fa-satellite-dish"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicle-vin">N° de série</label>
                                <input 
                                    type="text" 
                                    id="vehicle-vin"
                                    v-model="form.vin"
                                    maxlength="17"
                                    placeholder="Numéro de série (17 caractères)"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-tracking-id">ID Tracking</label>
                                <input 
                                    type="text" 
                                    id="vehicle-tracking-id"
                                    v-model="form.trackingId"
                                    placeholder="Ex: TRK001, GPS-12345"
                                >
                                <small class="text-muted">ID du dispositif de tracking GPS</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-fuel-type">Type de carburant</label>
                                <select id="vehicle-fuel-type" v-model="form.fuelTypeId">
                                    <option value="">Sélectionner un type...</option>
                                    <option v-for="fuelType in fuelTypes" :key="fuelType.id" :value="fuelType.id">
                                        {{ fuelType.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicle-engine-size">Cylindrée (L)</label>
                                <input 
                                    type="number" 
                                    id="vehicle-engine-size"
                                    v-model="form.engineSize"
                                    step="0.1"
                                    min="0"
                                    placeholder="Ex: 1.6"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-power">Puissance (CV)</label>
                                <input 
                                    type="number" 
                                    id="vehicle-power"
                                    v-model="form.powerHp"
                                    min="0"
                                    placeholder="Ex: 120"
                                >
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicle-purchase-date">Date d'achat</label>
                                <date-picker 
                                    v-model="form.purchaseDate"
                                    placeholder="Sélectionner la date d'achat"
                                    :max-date="today"
                                ></date-picker>
                            </div>
                            
                            <div class="form-group">
                                <label for="vehicle-purchase-price">Prix d'achat ({{ currency }})</label>
                                <input 
                                    type="number" 
                                    id="vehicle-purchase-price"
                                    v-model="form.purchasePrice"
                                    step="0.01"
                                    min="0"
                                    :placeholder="'Ex: 25000.00 ' + currency"
                                >
                            </div>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button type="submit" class="btn btn-primary" @click="saveVehicle" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ isEditing ? 'Mettre à jour' : 'Créer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de confirmation de suppression -->
            <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Confirmer la suppression</h3>
                        <button class="close-btn" @click="closeDeleteModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="delete-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p v-if="vehicleToDelete">Êtes-vous sûr de vouloir supprimer le véhicule <strong>{{ vehicleToDelete.plateNumber }}</strong> ?</p>
                            <p v-else>Êtes-vous sûr de vouloir supprimer ce véhicule ?</p>
                            <p class="text-muted">Cette action est irréversible et supprimera définitivement toutes les données associées à ce véhicule.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="!vehicleToDelete">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            vehicles: [],
            brands: [],
            models: [],
            colors: [],
            categories: [],
            fuelTypes: [],
            loading: false,
            saving: false,
            searchTerm: '',
            activeFilter: 'all',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            vehicleToDelete: null,
            brandSearch: '',
            modelSearch: '',
            brandSearchTimeout: null,
            modelSearchTimeout: null,
            selectedBrandName: '',
            selectedModelName: '',
            showBrandDropdown: false,
            showModelDropdown: false,
            currency: 'Fcfa', // Devise par défaut
            today: new Date().toISOString().split('T')[0], // Date d'aujourd'hui pour validation
            form: {
                id: null,
                plateNumber: '',
                brandId: '',
                modelId: '',
                colorId: '',
                categoryId: '',
                fuelTypeId: '',
                year: null,
                vin: '',
                trackingId: '',
                mileage: 0,
                engineSize: null,
                powerHp: null,
                status: 'active',
                purchaseDate: '',
                purchasePrice: null
            },
            searchTimeout: null
        };
    },
    
    watch: {
        'form.brandId'(newBrandId, oldBrandId) {
            // Si la marque change et qu'il y avait un modèle sélectionné
            if (newBrandId !== oldBrandId && oldBrandId) {
                // Réinitialiser le modèle sélectionné
                this.form.modelId = '';
                this.selectedModelName = '';
                this.modelSearch = '';
                this.models = [];
                this.showModelDropdown = false;
                
                // Recharger les modèles pour la nouvelle marque
                if (newBrandId) {
                    this.loadModels();
                }
            }
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadVehicles();
        await this.loadBrands();
        await this.loadColors();
        await this.loadCategories();
        await this.loadFuelTypes();
        await this.loadCurrency();
    },
    
    methods: {
        async waitForApiService() {
            // Attendre que window.apiService soit disponible
            let attempts = 0;
            const maxAttempts = 50; // 5 secondes max
            
            while (!window.apiService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.apiService) {
                throw new Error('API Service non disponible après 5 secondes');
            }
        },
        
        async loadVehicles() {
            this.loading = true;
            try {
                const data = await window.apiService.getVehicles(null, this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                if (data.success) {
                    this.vehicles = data.data || [];
                    this.pagination = data.pagination;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules:', error);
                this.vehicles = [];
            } finally {
                this.loading = false;
            }
        },
        
        async loadBrands(search = '') {
            try {
                const data = await window.apiService.getVehicleBrands(search);
                if (data.success) {
                    this.brands = data.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des marques:', error);
                this.brands = [];
            }
        },
        
        async loadModels(search = '') {
            if (!this.form.brandId) {
                this.models = [];
                this.form.modelId = '';
                return;
            }
            
            try {
                const data = await window.apiService.getVehicleModels(this.form.brandId, search);
                if (data.success) {
                    this.models = data.data || [];
                }
                this.form.modelId = '';
            } catch (error) {
                console.error('Erreur lors du chargement des modèles:', error);
                this.models = [];
            }
        },
        
        async loadColors() {
            try {
                const data = await window.apiService.getVehicleColors();
                if (data.success) {
                    this.colors = data.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des couleurs:', error);
                this.colors = [];
            }
        },
        
        async loadCategories() {
            try {
                const data = await window.apiService.getVehicleCategories();
                if (data.success) {
                    this.categories = data.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des catégories:', error);
                this.categories = [];
            }
        },
        
        async loadFuelTypes() {
            try {
                const data = await window.apiService.getVehicleFuelTypes();
                if (data.success) {
                    this.fuelTypes = data.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types de carburant:', error);
                this.fuelTypes = [];
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadVehicles();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadVehicles();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        async editVehicle(vehicle) {
            this.isEditing = true;
            this.form = {
                id: vehicle.id,
                plateNumber: vehicle.plateNumber,
                brandId: vehicle.brand ? vehicle.brand.id : '',
                modelId: vehicle.model ? vehicle.model.id : '',
                colorId: vehicle.color ? vehicle.color.id : '',
                categoryId: vehicle.category ? vehicle.category.id : '',
                fuelTypeId: vehicle.fuelType ? vehicle.fuelType.id : '',
                year: vehicle.year,
                vin: vehicle.vin || '',
                trackingId: vehicle.trackingId || '',
                mileage: vehicle.mileage,
                engineSize: vehicle.engineSize,
                powerHp: vehicle.powerHp,
                status: vehicle.status,
                purchaseDate: vehicle.purchaseDate || '',
                purchasePrice: vehicle.purchasePrice
            };
            
            // Pré-remplir les champs de recherche avec les valeurs d'origine
            this.selectedBrandName = vehicle.brand ? vehicle.brand.name : '';
            this.selectedModelName = vehicle.model ? vehicle.model.name : '';
            this.brandSearch = '';
            this.modelSearch = '';
            
            // Charger les modèles pour la marque sélectionnée
            if (this.form.brandId) {
                await this.loadModels();
                // S'assurer que le modèle est bien sélectionné
                this.form.modelId = vehicle.model ? vehicle.model.id : '';
            }
            
            this.showModal = true;
        },
        
        async saveVehicle() {
            if (!this.form.plateNumber.trim()) {
                this.showNotification('Le numéro de plaque est requis', 'error');
                return;
            }
            
            if (!this.form.brandId) {
                this.showNotification('La marque est requise', 'error');
                return;
            }
            
            if (!this.form.modelId) {
                this.showNotification('Le modèle est requis', 'error');
                return;
            }
            
            if (!this.form.colorId) {
                this.showNotification('La couleur est requise', 'error');
                return;
            }
            
            this.saving = true;
            try {
                // Nettoyer et valider les données avant l'envoi
                const vehicleData = {
                    plateNumber: this.form.plateNumber.trim(),
                    brandId: this.form.brandId,
                    modelId: this.form.modelId,
                    colorId: this.form.colorId,
                    categoryId: this.form.categoryId || null,
                    fuelTypeId: this.form.fuelTypeId || null,
                    year: this.form.year || null,
                    vin: this.form.vin ? this.form.vin.trim() : null,
                    trackingId: this.form.trackingId ? this.form.trackingId.trim() : null,
                    mileage: this.form.mileage || 0,
                    engineSize: this.form.engineSize || null,
                    powerHp: this.form.powerHp || null,
                    status: this.form.status,
                    purchaseDate: this.form.purchaseDate || null,
                    purchasePrice: this.form.purchasePrice || null
                };
                
                console.log('Données envoyées:', vehicleData);
                
                let result;
                if (this.isEditing) {
                    result = await window.apiService.updateVehicle(this.form.id, vehicleData);
                } else {
                    result = await window.apiService.createVehicle(vehicleData);
                }
                
                if (result.success) {
                this.closeModal();
                    this.loadVehicles();
                    const action = this.isEditing ? 'modifié' : 'créé';
                    this.showNotification(`Véhicule ${action} avec succès`, 'success');
                } else {
                    this.showNotification(result.message || 'Erreur lors de la sauvegarde', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },
        
        deleteVehicle(vehicle) {
            this.vehicleToDelete = vehicle;
            this.showDeleteModal = true;
        },
        
        async syncVehicleMileageFromTracking() {
            if (!this.form.trackingId) {
                this.showNotification('Veuillez configurer un ID de tracking pour ce véhicule', 'error');
                return;
            }
            
            try {
                this.saving = true;
                const response = await window.apiService.syncVehicleMileageFromTracking(this.form.id);
                
                if (response.success) {
                    this.form.mileage = response.data.newMileage;
                    this.showNotification(`Kilométrage synchronisé: ${response.data.newMileage} km`, 'success');
                } else {
                    this.showNotification('Erreur lors de la synchronisation: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la synchronisation:', error);
                this.showNotification('Erreur lors de la synchronisation du kilométrage', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        async confirmDelete() {
            if (!this.vehicleToDelete) {
                this.showNotification('Aucun véhicule sélectionné pour la suppression', 'error');
                return;
            }
            
            const vehiclePlate = this.vehicleToDelete.plateNumber;
            const vehicleId = this.vehicleToDelete.id;
            
            try {
                const result = await window.apiService.deleteVehicle(vehicleId);
                if (result.success) {
                    this.closeDeleteModal();
                    this.loadVehicles();
                    this.showNotification(`Véhicule "${vehiclePlate}" supprimé avec succès`, 'success');
                } else {
                    this.showNotification(result.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
            }
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.vehicleToDelete = null;
        },
        
        closeModal() {
            this.showModal = false;
            this.isEditing = false;
            this.resetForm();
        },
        
        resetForm() {
            this.form = {
                id: null,
                plateNumber: '',
                brandId: '',
                modelId: '',
                colorId: '',
                categoryId: '',
                fuelTypeId: '',
                year: null,
                vin: '',
                trackingId: '',
                mileage: 0,
                engineSize: null,
                powerHp: null,
                status: 'active',
                purchaseDate: '',
                purchasePrice: null
            };
            this.models = [];
            this.brandSearch = '';
            this.modelSearch = '';
            this.selectedBrandName = '';
            this.selectedModelName = '';
            this.showBrandDropdown = false;
            this.showModelDropdown = false;
        },
        
        handleBrandInput(event) {
            this.brandSearch = event.target.value;
            this.selectedBrandName = '';
            this.form.brandId = '';
            this.showBrandDropdown = true;
            this.searchBrands();
        },
        
        handleModelInput(event) {
            this.modelSearch = event.target.value;
            this.selectedModelName = '';
            this.form.modelId = '';
            this.showModelDropdown = true;
            this.searchModels();
        },
        
        handleBrandFocus() {
            this.showBrandDropdown = true;
            if (this.brandSearch || !this.selectedBrandName) {
                this.loadBrands(this.brandSearch);
            }
        },
        
        handleBrandBlur() {
            // Délai pour permettre le clic sur une option
            setTimeout(() => {
                this.showBrandDropdown = false;
            }, 200);
        },
        
        handleModelFocus() {
            this.showModelDropdown = true;
            if (this.modelSearch || !this.selectedModelName) {
                this.loadModels(this.modelSearch);
            }
        },
        
        handleModelBlur() {
            // Délai pour permettre le clic sur une option
            setTimeout(() => {
                this.showModelDropdown = false;
            }, 200);
        },
        
        searchBrands() {
            clearTimeout(this.brandSearchTimeout);
            this.brandSearchTimeout = setTimeout(() => {
                this.loadBrands(this.brandSearch);
            }, 300);
        },
        
        searchModels() {
            clearTimeout(this.modelSearchTimeout);
            this.modelSearchTimeout = setTimeout(() => {
                this.loadModels(this.modelSearch);
            }, 300);
        },
        
        selectBrand(brand) {
            this.form.brandId = brand.id;
            this.selectedBrandName = brand.name;
            this.brandSearch = '';
            this.brands = [];
            this.showBrandDropdown = false;
            
            // Réinitialiser le modèle sélectionné
            this.form.modelId = '';
            this.selectedModelName = '';
            this.modelSearch = '';
            this.models = [];
            this.showModelDropdown = false;
            
            // Recharger les modèles pour la nouvelle marque
            this.loadModels();
        },
        
        selectModel(model) {
            this.form.modelId = model.id;
            this.selectedModelName = model.name;
            this.modelSearch = '';
            this.models = [];
            this.showModelDropdown = false;
        },
        
        showNotification(message, type = 'info') {
            // Créer le conteneur de notifications s'il n'existe pas
            let container = document.querySelector('.notification-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container';
                document.body.appendChild(container);
            }
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            const icon = type === 'success' ? 'check-circle' : 
                       type === 'error' ? 'exclamation-circle' : 
                       type === 'warning' ? 'exclamation-triangle' : 'info-circle';
            
            notification.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            `;
            
            container.appendChild(notification);
            
            // Supprimer la notification après 5 secondes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        },
        
        formatNumber(number) {
            return new Intl.NumberFormat('fr-FR').format(number);
        },
        
        async loadCurrency() {
            try {
                // Charger la devise depuis les paramètres
                const response = await window.apiService.request('/parameters/currency');
                if (response.success && response.data) {
                    this.currency = response.data.value || 'Fcfa';
                }
            } catch (error) {
                console.warn('Impossible de charger la devise depuis les paramètres, utilisation de la devise par défaut:', error);
                // Garder la devise par défaut (Fcfa)
            }
        },
        
        getStatusClass(vehicle) {
            const baseClass = 'status';
            switch (vehicle.status) {
                case 'active':
                    return `${baseClass} status-active`;
                case 'maintenance':
                    return `${baseClass} status-maintenance`;
                case 'out_of_service':
                    return `${baseClass} status-out-of-service`;
                case 'sold':
                    return `${baseClass} status-sold`;
                default:
                    return `${baseClass} status-unknown`;
            }
        }
    }
};

// Exposer le composant globalement
window.VehicleCrud = VehicleCrud;