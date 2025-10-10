/**
 * Impact Auto - Suivi de Carburant Vue.js
 * Composant CRUD pour la gestion du suivi de carburant
 */

const VehicleFuelLogCrud = {
    template: `
        <div class="vehicle-fuel-log-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1 class="section-title">Suivi de Carburant</h1>
                            <p class="page-subtitle">Suivez la consommation de carburant de votre flotte</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="fas fa-plus"></i>
                            Nouveau Suivi
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
                        placeholder="Rechercher par véhicule, conducteur, type de carburant..."
                    >
                </div>
            </div>

            <!-- Tableau du suivi de carburant -->
            <div class="table-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement du suivi de carburant...
                </div>
                
                <div v-else-if="fuelLogs.length === 0" class="no-data">
                    <i class="fas fa-gas-pump"></i>
                    <h3>Aucun suivi de carburant trouvé</h3>
                    <p>Commencez par ajouter un nouveau suivi de carburant.</p>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Véhicule</th>
                            <th>Conducteur</th>
                            <th>Date</th>
                            <th>Type de Carburant</th>
                            <th>Coût Total</th>
                            <th>Kilométrage</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="fuelLog in fuelLogs" :key="fuelLog.id">
                            <td>
                                <code v-if="fuelLog.code" class="entity-code">{{ fuelLog.code }}</code>
                                <span v-else class="no-code">-</span>
                            </td>
                            <td>
                                <div class="vehicle-info">
                                    <div class="vehicle-plate">{{ fuelLog.vehicle.plateNumber }}</div>
                                    <div class="vehicle-details">
                                        {{ fuelLog.vehicle.brand }} {{ fuelLog.vehicle.model }} ({{ fuelLog.vehicle.year }})
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div v-if="fuelLog.driver" class="driver-info">
                                    <div class="driver-name">{{ fuelLog.driver.fullName }}</div>
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>{{ formatDate(fuelLog.refuelDate) }}</td>
                            <td>
                                <div v-if="fuelLog.fuelType" class="fuel-type">
                                    <i v-if="fuelLog.fuelType.icon" :class="fuelLog.fuelType.icon"></i>
                                    <span>{{ fuelLog.fuelType.name }}</span>
                                    <i v-if="fuelLog.fuelType.isEcoFriendly" class="fas fa-leaf eco-badge"></i>
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div class="total-cost">
                                    {{ formatNumber(fuelLog.totalCost) }} {{ currency }}
                                </div>
                            </td>
                            <td>
                                <div class="odometer">
                                    <div>{{ formatNumber(fuelLog.odometerReading) }} km</div>
                                    <div v-if="fuelLog.kilometersDriven" class="text-muted">
                                        +{{ formatNumber(fuelLog.kilometersDriven) }} km
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span :class="['status-badge', fuelLog.isActive ? 'status-active' : 'status-inactive']">
                                    {{ fuelLog.isActive ? 'Actif' : 'Inactif' }}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" @click="editFuelLog(fuelLog)" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteFuelLog(fuelLog)" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="pagination && pagination.totalPages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    :disabled="pagination.currentPage === 1"
                    @click="changePage(pagination.currentPage - 1)"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.currentPage }} sur {{ pagination.totalPages }}
                </span>
                
                <button 
                    class="btn btn-outline" 
                    :disabled="pagination.currentPage === pagination.totalPages"
                    @click="changePage(pagination.currentPage + 1)"
                >
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Modal de création/édition -->
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content modal-lg" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? "Modifier le suivi de carburant" : "Nouveau suivi de carburant" }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form @submit.prevent="saveFuelLog">
                        <div class="modal-body">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fuel-log-vehicle">Véhicule *</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="fuel-log-vehicle"
                                            v-model="vehicleSearch"
                                            @input="handleVehicleSearch"
                                            @focus="onVehicleSearchFocus"
                                            @blur="onVehicleSearchBlur"
                                            placeholder="Rechercher un véhicule..."
                                            autocomplete="off"
                                            autocorrect="off"
                                            autocapitalize="off"
                                            spellcheck="false"
                                            required
                                        >
                                        <i class="fas fa-search"></i>
                                        <div v-if="showVehicleDropdown && vehicleSearchResults.length > 0" class="dropdown-options">
                                            <div v-if="vehicleSearch.length < 2" class="dropdown-header">
                                                <i class="fas fa-star"></i>
                                                Véhicules suggérés
                                            </div>
                                            <div 
                                                v-for="vehicle in vehicleSearchResults" 
                                                :key="vehicle.id" 
                                                class="dropdown-option"
                                                @click="selectVehicle(vehicle)"
                                            >
                                                <div class="vehicle-option">
                                                    <div class="vehicle-plate">{{ vehicle.plateNumber }}</div>
                                                    <div class="vehicle-details">
                                                        {{ vehicle.brand }} {{ vehicle.model }} ({{ vehicle.year }})
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="fuel-log-driver">Conducteur</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="fuel-log-driver"
                                            v-model="driverSearch"
                                            @input="handleDriverSearch"
                                            @focus="onDriverSearchFocus"
                                            @blur="onDriverSearchBlur"
                                            placeholder="Rechercher un conducteur..."
                                            autocomplete="off"
                                            autocorrect="off"
                                            autocapitalize="off"
                                            spellcheck="false"
                                        >
                                        <i class="fas fa-search"></i>
                                        <div v-if="showDriverDropdown && driverSearchResults.length > 0" class="dropdown-options">
                                            <div v-if="driverSearch.length < 2" class="dropdown-header">
                                                <i class="fas fa-star"></i>
                                                Conducteurs suggérés
                                            </div>
                                            <div 
                                                v-for="driver in driverSearchResults" 
                                                :key="driver.id" 
                                                class="dropdown-option"
                                                @click="selectDriver(driver)"
                                            >
                                                <div class="driver-option">
                                                    <div class="driver-name">{{ driver.fullName }}</div>
                                                    <div class="driver-details">
                                                        <div class="driver-license">
                                                            <i class="fas fa-id-card"></i>
                                                            {{ driver.licenseNumber }}
                                                        </div>
                                                        <div v-if="driver.licenseType" class="driver-license-type">
                                                            <i class="fas fa-certificate"></i>
                                                            {{ driver.licenseType.name }}
                                                        </div>
                                                        <div v-if="driver.phone" class="driver-phone">
                                                            <i class="fas fa-phone"></i>
                                                            {{ driver.phone }}
                                                        </div>
                                                        <div v-if="driver.email" class="driver-email">
                                                            <i class="fas fa-envelope"></i>
                                                            {{ driver.email }}
                                                        </div>
                                                    </div>
                                                    <div v-if="driver.isLicenseExpired" class="license-warning">
                                                        <i class="fas fa-exclamation-triangle"></i>
                                                        Permis expiré
                                                    </div>
                                                    <div v-else-if="driver.isLicenseExpiringSoon" class="license-warning">
                                                        <i class="fas fa-clock"></i>
                                                        Permis expire bientôt
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fuel-log-date">Date de ravitaillement *</label>
                                    <input 
                                        type="date" 
                                        id="fuel-log-date"
                                        v-model="form.refuelDate"
                                        class="form-control"
                                        :max="today"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="fuel-log-fuel-type">Type de Carburant</label>
                                    <select id="fuel-log-fuel-type" v-model="form.fuelTypeId">
                                        <option value="">Sélectionner un type...</option>
                                        <option v-for="fuelType in fuelTypes" :key="fuelType.id" :value="fuelType.id">
                                            {{ fuelType.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fuel-log-quantity">Quantité (L) *</label>
                                    <input 
                                        type="number" 
                                        id="fuel-log-quantity"
                                        v-model="form.quantity"
                                        step="0.01"
                                        min="0"
                                        placeholder="Ex: 50.00"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="fuel-log-unit-price">Prix Unitaire ({{ currency }}) *</label>
                                    <input 
                                        type="number" 
                                        id="fuel-log-unit-price"
                                        v-model="form.unitPrice"
                                        step="0.01"
                                        min="0"
                                        :placeholder="'Ex: 750.00 ' + currency"
                                        required
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fuel-log-total-cost">Coût Total ({{ currency }}) *</label>
                                    <input 
                                        type="number" 
                                        id="fuel-log-total-cost"
                                        v-model="form.totalCost"
                                        step="0.01"
                                        min="0"
                                        :placeholder="'Calculé automatiquement'"
                                        readonly
                                        style="background-color: #f8f9fa; cursor: not-allowed;"
                                    >
                                    <small class="text-muted">Calculé automatiquement : Quantité × Prix Unitaire</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="fuel-log-odometer">Kilométrage *</label>
                                    <div class="input-with-button">
                                        <input 
                                            type="number" 
                                            id="fuel-log-odometer"
                                            v-model="form.odometerReading"
                                            min="0"
                                            placeholder="Ex: 125000"
                                            required
                                        >
                                        <button 
                                            type="button" 
                                            class="btn btn-sm btn-outline" 
                                            @click="syncVehicleMileageFromTracking" 
                                            :disabled="saving || !form.vehicleId"
                                            title="Synchroniser depuis le dispositif de tracking"
                                        >
                                            <i class="fas fa-satellite-dish"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fuel-log-previous-odometer">Kilométrage Précédent</label>
                                    <input 
                                        type="number" 
                                        id="fuel-log-previous-odometer"
                                        v-model="form.previousOdometerReading"
                                        min="0"
                                        placeholder="Ex: 124500"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="fuel-log-efficiency">Efficacité (L/100km)</label>
                                    <input 
                                        type="number" 
                                        id="fuel-log-efficiency"
                                        v-model="form.fuelEfficiency"
                                        step="0.01"
                                        min="0"
                                        placeholder="Ex: 8.5"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fuel-log-station">Station</label>
                                    <input 
                                        type="text" 
                                        id="fuel-log-station"
                                        v-model="form.stationName"
                                        placeholder="Ex: Total, Shell, BP..."
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="fuel-log-location">Localisation</label>
                                    <input 
                                        type="text" 
                                        id="fuel-log-location"
                                        v-model="form.stationLocation"
                                        placeholder="Ex: Abidjan, Cocody..."
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fuel-log-receipt">N° de Reçu</label>
                                    <input 
                                        type="text" 
                                        id="fuel-log-receipt"
                                        v-model="form.receiptNumber"
                                        placeholder="Ex: RCP-2024-001"
                                    >
                                </div>
                                
                            </div>
                            
                            <div class="form-group">
                                <label for="fuel-log-notes">Notes</label>
                                <textarea 
                                    id="fuel-log-notes"
                                    v-model="form.notes"
                                    rows="3"
                                    placeholder="Notes supplémentaires..."
                                ></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="form.isFullTank">
                                        <span class="checkmark"></span>
                                        Plein d'essence
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="form.isActive">
                                        <span class="checkmark"></span>
                                        Actif
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" @click="closeModal">
                                Annuler
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">
                                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                <i v-else class="fas fa-save"></i>
                                {{ isEditing ? 'Mettre à jour' : 'Créer' }}
                            </button>
                        </div>
                    </form>
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
                            <p v-if="fuelLogToDelete">Êtes-vous sûr de vouloir supprimer ce suivi de carburant du {{ formatDate(fuelLogToDelete.refuelDate) }} ?</p>
                            <p v-else>Êtes-vous sûr de vouloir supprimer ce suivi de carburant ?</p>
                            <p class="text-muted">Cette action est irréversible et supprimera définitivement toutes les données associées à ce suivi.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="!fuelLogToDelete">
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
            fuelLogs: [],
            vehicles: [],
            drivers: [],
            fuelTypes: [],
            vehicleSearchResults: [],
            driverSearchResults: [],
            vehicleSearch: '',
            driverSearch: '',
            showVehicleDropdown: false,
            showDriverDropdown: false,
            selectedVehicleName: '',
            selectedDriverName: '',
            vehicleSearchTimeout: null,
            driverSearchTimeout: null,
            loading: false,
            saving: false,
            searchTerm: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            fuelLogToDelete: null,
            currency: 'XOF',
            today: new Date().toISOString().split('T')[0],
            form: {
                id: null,
                vehicleId: '',
                driverId: '',
                fuelTypeId: '',
                refuelDate: '',
                quantity: null,
                unitPrice: null,
                totalCost: null,
                odometerReading: null,
                previousOdometerReading: null,
                kilometersDriven: null,
                fuelEfficiency: null,
                stationName: '',
                stationLocation: '',
                receiptNumber: '',
                notes: '',
                isFullTank: true,
                isActive: true
            }
        };
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadFuelLogs();
        await this.loadVehicles();
        await this.loadDrivers();
        await this.loadFuelTypes();
        await this.loadCurrency();
    },
    
    watch: {
        'form.quantity'(newValue) {
            this.calculateTotalCost();
        },
        'form.unitPrice'(newValue) {
            this.calculateTotalCost();
        }
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
        
        async loadFuelLogs() {
            this.loading = true;
            try {
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage
                });
                
                if (this.searchTerm) params.append('search', this.searchTerm);
                
                const response = await window.apiService.request(`/vehicle-fuel-logs?${params.toString()}`);
                
                if (response.success) {
                    this.fuelLogs = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement du suivi de carburant: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement du suivi de carburant:', error);
                this.showNotification('Erreur lors du chargement du suivi de carburant', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadVehicles() {
            try {
                const response = await window.apiService.getAvailableVehiclesForFuelLog();
                if (response.success) {
                    this.vehicles = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules:', error);
            }
        },
        
        async loadDrivers() {
            try {
                const response = await window.apiService.getAvailableDriversForFuelLog();
                if (response.success) {
                    this.drivers = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des conducteurs:', error);
            }
        },
        
        async loadFuelTypes() {
            try {
                const response = await window.apiService.getFuelTypes();
                if (response.success) {
                    this.fuelTypes = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types de carburant:', error);
            }
        },
        
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                if (response.success && response.data) {
                    this.currency = response.data.value || 'XOF';
                }
            } catch (error) {
                console.warn('Impossible de charger la devise depuis les paramètres, utilisation de la devise par défaut:', error);
            }
        },
        
        // Recherche de véhicules
        async searchVehicles(search = '') {
            try {
                const response = await window.apiService.getAvailableVehiclesForFuelLog(search);
                if (response.success) {
                    this.vehicleSearchResults = response.data;
                }
            } catch (error) {
                console.error('Erreur lors de la recherche de véhicules:', error);
                this.vehicleSearchResults = [];
            }
        },

        async loadPopularVehicles() {
            try {
                // Charger les véhicules les plus récents ou les plus utilisés
                const response = await window.apiService.getAvailableVehiclesForFuelLog('', 10);
                if (response.success) {
                    this.vehicleSearchResults = response.data.slice(0, 5); // Limiter à 5 véhicules populaires
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules populaires:', error);
                this.vehicleSearchResults = [];
            }
        },

        handleVehicleSearch() {
            clearTimeout(this.vehicleSearchTimeout);
            this.vehicleSearchTimeout = setTimeout(() => {
                if (this.vehicleSearch.length >= 2) {
                    this.searchVehicles(this.vehicleSearch);
                } else if (this.vehicleSearch.length === 0) {
                    this.vehicleSearchResults = [];
                }
            }, 300);
        },

        onVehicleSearchFocus() {
            this.showVehicleDropdown = true;
            if (this.vehicleSearch.length >= 2) {
                this.searchVehicles(this.vehicleSearch);
            } else {
                // Charger quelques véhicules populaires quand on clique sur le select
                this.loadPopularVehicles();
            }
        },

        onVehicleSearchBlur() {
            setTimeout(() => {
                this.showVehicleDropdown = false;
            }, 200);
        },

        selectVehicle(vehicle) {
            this.form.vehicleId = vehicle.id;
            this.selectedVehicleName = `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
            this.vehicleSearch = this.selectedVehicleName;
            this.showVehicleDropdown = false;
            this.vehicleSearchResults = [];
        },
        
        // Recherche de conducteurs
        async searchDrivers(search = '') {
            try {
                const response = await window.apiService.getAvailableDriversForFuelLog(search);
                if (response.success) {
                    this.driverSearchResults = response.data;
                }
            } catch (error) {
                console.error('Erreur lors de la recherche de conducteurs:', error);
                this.driverSearchResults = [];
            }
        },

        async loadPopularDrivers() {
            try {
                // Charger les conducteurs les plus récents ou les plus utilisés
                const response = await window.apiService.getAvailableDriversForFuelLog('', 10);
                if (response.success) {
                    this.driverSearchResults = response.data.slice(0, 5); // Limiter à 5 conducteurs populaires
                }
            } catch (error) {
                console.error('Erreur lors du chargement des conducteurs populaires:', error);
                this.driverSearchResults = [];
            }
        },

        handleDriverSearch() {
            clearTimeout(this.driverSearchTimeout);
            this.driverSearchTimeout = setTimeout(() => {
                // Si on a déjà des conducteurs chargés, filtrer localement
                if (this.drivers.length > 0) {
                    this.filterDriversLocally();
                } else {
                    this.searchDrivers(this.driverSearch);
                }
            }, 300);
        },

        filterDriversLocally() {
            if (!this.driverSearch || this.driverSearch.length === 0) {
                this.driverSearchResults = this.drivers;
            } else {
                const searchTerm = this.driverSearch.toLowerCase();
                this.driverSearchResults = this.drivers.filter(driver => 
                    driver.fullName.toLowerCase().includes(searchTerm) ||
                    driver.licenseNumber.toLowerCase().includes(searchTerm)
                );
            }
        },

        onDriverSearchFocus() {
            this.showDriverDropdown = true;
            if (this.driverSearch.length >= 2) {
                this.searchDrivers(this.driverSearch);
            } else {
                this.loadPopularDrivers();
            }
        },

        onDriverSearchBlur() {
            setTimeout(() => {
                this.showDriverDropdown = false;
            }, 200);
        },

        selectDriver(driver) {
            this.form.driverId = driver.id;
            this.selectedDriverName = driver.fullName;
            this.driverSearch = this.selectedDriverName;
            this.showDriverDropdown = false;
            this.driverSearchResults = [];
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadFuelLogs();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadFuelLogs();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editFuelLog(fuelLog) {
            this.isEditing = true;
            this.form = {
                id: fuelLog.id,
                vehicleId: fuelLog.vehicle.id,
                driverId: fuelLog.driver ? fuelLog.driver.id : '',
                fuelTypeId: fuelLog.fuelType ? fuelLog.fuelType.id : '',
                refuelDate: this.formatDateForInput(fuelLog.refuelDate),
                quantity: fuelLog.quantity,
                unitPrice: fuelLog.unitPrice,
                totalCost: fuelLog.totalCost,
                odometerReading: fuelLog.odometerReading,
                previousOdometerReading: fuelLog.previousOdometerReading,
                kilometersDriven: fuelLog.kilometersDriven,
                fuelEfficiency: fuelLog.fuelEfficiency,
                stationName: fuelLog.stationName || '',
                stationLocation: fuelLog.stationLocation || '',
                receiptNumber: fuelLog.receiptNumber || '',
                notes: fuelLog.notes || '',
                isFullTank: fuelLog.isFullTank,
                isActive: fuelLog.isActive
            };
            
            // Pré-remplir les champs de recherche
            this.selectedVehicleName = `${fuelLog.vehicle.plateNumber} - ${fuelLog.vehicle.brand} ${fuelLog.vehicle.model} (${fuelLog.vehicle.year})`;
            this.vehicleSearch = this.selectedVehicleName;
            
            if (fuelLog.driver) {
                this.selectedDriverName = fuelLog.driver.fullName;
                this.driverSearch = this.selectedDriverName;
            }
            
            // Calculer le coût total si les valeurs existent
            this.calculateTotalCost();
            
            this.showModal = true;
        },
        
        async saveFuelLog() {
            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.updateVehicleFuelLog(this.form.id, this.form);
                } else {
                    response = await window.apiService.createVehicleFuelLog(this.form);
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadFuelLogs();
                } else {
                    // Afficher les erreurs de validation de kilométrage si elles existent
                    if (response.errors && Array.isArray(response.errors)) {
                        const errorDetails = response.errors.map(err => `• ${err}`).join('<br>');
                        const fullMessage = (response.message || 'Erreurs de validation') + '<br>' + errorDetails;
                        this.showNotification(fullMessage, 'error');
                    } else {
                        this.showNotification('Erreur: ' + response.message, 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                // Afficher le message d'erreur détaillé s'il existe
                const errorMessage = error.message || 'Erreur lors de la sauvegarde';
                this.showNotification(errorMessage, 'error');
            } finally {
                this.saving = false;
            }
        },
        
        deleteFuelLog(fuelLog) {
            this.fuelLogToDelete = fuelLog;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.fuelLogToDelete) return;
            
            try {
                const response = await window.apiService.deleteVehicleFuelLog(this.fuelLogToDelete.id);
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadFuelLogs();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },

        async syncVehicleMileage() {
            if (!this.form.vehicleId) {
                this.showNotification('Veuillez sélectionner un véhicule', 'error');
                return;
            }

            this.saving = true;
            try {
                const response = await window.apiService.syncVehicleMileage(this.form.vehicleId);
                
                if (response.success) {
                    this.showNotification('Kilométrage synchronisé avec succès', 'success');
                    
                    // Mettre à jour le kilométrage dans le formulaire
                    if (response.data && response.data.currentMileage) {
                        this.form.odometerReading = response.data.currentMileage;
                    }
                } else {
                    this.showNotification(response.message || 'Erreur lors de la synchronisation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la synchronisation:', error);
                this.showNotification('Erreur lors de la synchronisation du kilométrage', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        async syncVehicleMileageFromTracking() {
            if (!this.form.vehicleId) {
                this.showNotification('Veuillez sélectionner un véhicule', 'error');
                return;
            }
            
            try {
                this.saving = true;
                const response = await window.apiService.syncVehicleMileageFromTracking(this.form.vehicleId);
                
                if (response.success) {
                    this.form.odometerReading = response.data.newMileage;
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
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.fuelLogToDelete = null;
        },
        
        resetForm() {
            this.form = {
                id: null,
                vehicleId: '',
                driverId: '',
                fuelTypeId: '',
                refuelDate: this.today,
                quantity: null,
                unitPrice: null,
                totalCost: null,
                odometerReading: null,
                previousOdometerReading: null,
                kilometersDriven: null,
                fuelEfficiency: null,
                stationName: '',
                stationLocation: '',
                receiptNumber: '',
                notes: '',
                isFullTank: true,
                isActive: true
            };
            
            // Réinitialiser les champs de recherche
            this.vehicleSearch = '';
            this.driverSearch = '';
            this.selectedVehicleName = '';
            this.selectedDriverName = '';
            this.vehicleSearchResults = [];
            this.driverSearchResults = [];
            this.showVehicleDropdown = false;
            this.showDriverDropdown = false;
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        formatDateForInput(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // Format YYYY-MM-DD pour input date
        },
        
        formatNumber(number) {
            if (!number) return '0';
            return new Intl.NumberFormat('fr-FR').format(number);
        },
        
        calculateTotalCost() {
            if (this.form.quantity && this.form.unitPrice) {
                const quantity = parseFloat(this.form.quantity);
                const unitPrice = parseFloat(this.form.unitPrice);
                
                if (!isNaN(quantity) && !isNaN(unitPrice) && quantity > 0 && unitPrice > 0) {
                    this.form.totalCost = (quantity * unitPrice).toFixed(2);
                } else {
                    this.form.totalCost = null;
                }
            } else {
                this.form.totalCost = null;
            }
        },
        
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                if (response.success && response.data) {
                    // Extraire la valeur de la devise depuis la réponse
                    if (typeof response.data === 'object' && response.data.value) {
                        this.currency = response.data.value;
                    } else if (typeof response.data === 'string') {
                        this.currency = response.data;
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la devise:', error);
                // Garder la valeur par défaut
            }
        },
        
        showNotification(message, type = 'info') {
            // Utiliser le service de notification global si disponible
            if (window.notificationService) {
                window.notificationService.show(message, type);
                return;
            }
            
            // Créer un conteneur de notifications s'il n'existe pas
            let container = document.querySelector('.notification-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container';
                document.body.appendChild(container);
            }
            
            // Créer une notification temporaire
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            container.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined') {
    window.VehicleFuelLogCrud = VehicleFuelLogCrud;
}
