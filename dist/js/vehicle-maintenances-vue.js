/**
 * Impact Auto - Entretiens Véhicules Vue.js
 * Composant CRUD pour la gestion des entretiens de véhicules
 */

const VehicleMaintenanceCrud = {
    template: `
        <div class="parameter-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1 class="section-title">Gestion des Entretiens</h1>
                            <p class="page-subtitle">Gérez les entretiens et réparations de votre flotte</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="fas fa-plus"></i>
                            Nouvel Entretien
                        </button>
                    </div>
                </div>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher par véhicule, marque, modèle, type..."
                    >
                </div>

                <div class="filter-group">
                    <select v-model="statusFilter" @change="loadMaintenances" class="filter-select">
                        <option value="">Tous les statuts</option>
                        <option value="scheduled">Programmée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                    </select>
                </div>

                <div class="filter-group">
                    <select v-model="typeFilter" @change="loadMaintenances" class="filter-select">
                        <option value="">Tous les types</option>
                        <option value="preventive">Préventive</option>
                        <option value="corrective">Corrective</option>
                        <option value="inspection">Inspection</option>
                        <option value="repair">Réparation</option>
                    </select>
                </div>
            </div>

            <!-- Table -->
            <div class="table-container" v-if="!loading && maintenances.length > 0">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Véhicule</th>
                            <th>Type</th>
                            <th>Titre</th>
                            <th>Date Program.</th>
                            <th>Date Réal.</th>
                            <th>Coût</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="maintenance in maintenances" :key="maintenance.id">
                            <td>
                                <code v-if="maintenance.code" class="entity-code">{{ maintenance.code }}</code>
                                <span v-else class="no-code">-</span>
                            </td>
                            <td>
                                <div class="vehicle-info">
                                    <div class="vehicle-plate">{{ maintenance.vehicle.plateNumber }}</div>
                                    <div class="vehicle-details">
                                        {{ maintenance.vehicle.brand }} {{ maintenance.vehicle.model }} ({{ maintenance.vehicle.year }})
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="maintenance-type">{{ maintenance.typeLabel }}</span>
                            </td>
                            <td>
                                <div class="maintenance-title">{{ maintenance.title }}</div>
                                <div v-if="maintenance.description" class="maintenance-description">
                                    {{ maintenance.description.substring(0, 50) }}{{ maintenance.description.length > 50 ? '...' : '' }}
                                </div>
                            </td>
                            <td>
                                <div class="scheduled-date">
                                    {{ formatDate(maintenance.scheduledDate) }}
                                    <div v-if="maintenance.isOverdue" class="overdue-warning">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        En retard
                                    </div>
                                    <div v-else-if="maintenance.isDueSoon" class="due-soon-warning">
                                        <i class="fas fa-clock"></i>
                                        Bientôt due
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span v-if="maintenance.completedDate" class="completed-date">
                                    {{ formatDate(maintenance.completedDate) }}
                                </span>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div v-if="maintenance.cost" class="cost">
                                    {{ formatNumber(maintenance.cost) }} {{ currency }}
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <span :class="getStatusClass(maintenance.status)">
                                    {{ maintenance.statusLabel }}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" @click="editMaintenance(maintenance)" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteMaintenance(maintenance)" title="Supprimer">
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
                    ({{ pagination.total }} maintenance(s))
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

            <!-- Loading -->
            <div v-if="loading" class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Chargement des entretiens...</h3>
            </div>

            <!-- No Data -->
            <div v-if="!loading && maintenances.length === 0" class="no-data">
                <i class="fas fa-wrench"></i>
                <h3>Aucun entretien trouvé</h3>
                <p>Commencez par créer un nouvel entretien pour votre flotte.</p>
            </div>

            <!-- Modal de création/édition -->
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content modal-lg" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? "Modifier la maintenance" : "Nouvelle maintenance" }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="modal-body">
                        <form @submit.prevent="saveMaintenance">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="maintenance-vehicle">Véhicule *</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="maintenance-vehicle"
                                            v-model="vehicleSearchTerm"
                                            @input="searchVehicles"
                                            @focus="onVehicleFocus"
                                            @blur="hideVehicleDropdown"
                                            placeholder="Rechercher un véhicule..."
                                            :style="{ display: selectedVehicle ? 'none' : 'block' }"
                                            autocomplete="off"
                                            autocorrect="off"
                                            autocapitalize="off"
                                            spellcheck="false"
                                            required
                                        >
                                        <div v-if="showVehicleDropdown && vehicleSearchResults.length > 0" class="dropdown-results">
                                            <div v-if="vehicleSearchTerm.length < 2" class="dropdown-header">
                                                <i class="fas fa-star"></i>
                                                Véhicules suggérés
                                            </div>
                                            <div 
                                                v-for="vehicle in vehicleSearchResults" 
                                                :key="vehicle.id"
                                                class="dropdown-item vehicle-item"
                                                @click="selectVehicle(vehicle)"
                                            >
                                            <div class="vehicle-info-dropdown">
                                                <div class="vehicle-main">{{ vehicle.plateNumber }} - {{ vehicle.brand }} {{ vehicle.model }}</div>
                                                <div class="vehicle-details-dropdown">
                                                    <span v-if="vehicle.year">{{ vehicle.year }}</span>
                                                    <span v-if="vehicle.color">{{ vehicle.color }}</span>
                                                    <span v-if="vehicle.fuelType">{{ vehicle.fuelType }}</span>
                                                    <span v-if="vehicle.category">{{ vehicle.category }}</span>
                                                </div>
                                            </div>
                                                <button 
                                                    type="button" 
                                                    class="vehicle-details-btn"
                                                    @click.stop="showVehicleDetails(vehicle)"
                                                    title="Voir les détails"
                                                >
                                                    <i class="fas fa-info-circle"></i>
                                                    <span class="btn-text">Détails</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="selectedVehicle" class="selected-item">
                                            <span>{{ selectedVehicle.plateNumber }} - {{ selectedVehicle.brand?.name || selectedVehicle.brand }} {{ selectedVehicle.model?.name || selectedVehicle.model }}</span>
                                            <div class="selected-item-actions">
                                                <button type="button" @click="clearVehicle" class="clear-btn" title="Supprimer la sélection">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                                <button type="button" @click="showVehicleDetails(selectedVehicle)" class="details-btn" title="Voir les détails">
                                                    <i class="fas fa-info-circle"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="maintenance-type">Type *</label>
                                    <select id="maintenance-type" v-model="form.type" required>
                                        <option value="">Sélectionner un type...</option>
                                        <option value="preventive">Préventive</option>
                                        <option value="corrective">Corrective</option>
                                        <option value="inspection">Inspection</option>
                                        <option value="repair">Réparation</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="maintenance-title">Titre *</label>
                                <input 
                                    type="text" 
                                    id="maintenance-title"
                                    v-model="form.title" 
                                    placeholder="Ex: Révision générale, Changement d'huile..."
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label for="maintenance-description">Description</label>
                                <textarea 
                                    id="maintenance-description"
                                    v-model="form.description" 
                                    placeholder="Décrivez les détails de l'entretien..."
                                    rows="3"
                                ></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="maintenance-scheduled-date">Date programmée *</label>
                                    <input 
                                        type="date" 
                                        id="maintenance-scheduled-date"
                                        v-model="form.scheduledDate"
                                        class="form-control"
                                        :min="today"
                                        required
                                    >
                                </div>

                                <div class="form-group">
                                    <label for="maintenance-completed-date">Date de réalisation</label>
                                    <input 
                                        type="date" 
                                        id="maintenance-completed-date"
                                        v-model="form.completedDate"
                                        class="form-control"
                                        :min="form.scheduledDate"
                                    >
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="maintenance-cost">Coût ({{ currency }})</label>
                                <input 
                                    type="number" 
                                    id="maintenance-cost"
                                    v-model="form.cost" 
                                    step="0.01"
                                    min="0"
                                    :placeholder="'Ex: 150.00 ' + currency"
                                >
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="maintenance-status">Statut</label>
                                    <select id="maintenance-status" v-model="form.status">
                                        <option value="scheduled">Programmée</option>
                                        <option value="in_progress">En cours</option>
                                        <option value="completed">Terminée</option>
                                        <option value="cancelled">Annulée</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="maintenance-odometer">Kilométrage</label>
                                    <div class="input-with-button">
                                        <input 
                                            type="number" 
                                            id="maintenance-odometer"
                                            v-model="form.odometerReading" 
                                            min="0"
                                            placeholder="Ex: 50000"
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
                                    <label for="maintenance-service-provider">Prestataire</label>
                                    <input 
                                        type="text" 
                                        id="maintenance-service-provider"
                                        v-model="form.serviceProvider" 
                                        placeholder="Ex: Garage Auto Plus"
                                    >
                                </div>

                                <div class="form-group">
                                    <label for="maintenance-service-location">Lieu d'intervention</label>
                                    <input 
                                        type="text" 
                                        id="maintenance-service-location"
                                        v-model="form.serviceLocation" 
                                        placeholder="Ex: 123 Rue de la Paix, Paris"
                                    >
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="maintenance-notes">Notes</label>
                                <textarea 
                                    id="maintenance-notes"
                                    v-model="form.notes" 
                                    placeholder="Notes supplémentaires..."
                                    rows="3"
                                ></textarea>
                            </div>

                            <div class="form-group">
                                <label for="maintenance-parts-used">Pièces utilisées</label>
                                <textarea 
                                    id="maintenance-parts-used"
                                    v-model="form.partsUsed" 
                                    placeholder="Liste des pièces utilisées..."
                                    rows="2"
                                ></textarea>
                            </div>

                            <div class="form-group">
                                <label for="maintenance-work-performed">Travaux effectués</label>
                                <textarea 
                                    id="maintenance-work-performed"
                                    v-model="form.workPerformed" 
                                    placeholder="Détail des travaux effectués..."
                                    rows="3"
                                ></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="form.isWarrantyCovered">
                                        <span class="checkmark"></span>
                                        <span class="checkbox-text">Couvert par la garantie</span>
                                    </label>
                                </div>

                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="form.isRecurring">
                                        <span class="checkmark"></span>
                                        <span class="checkbox-text">Maintenance récurrente</span>
                                    </label>
                                </div>
                            </div>

                            <div v-if="form.isRecurring" class="form-row">
                                <div class="form-group">
                                    <label for="maintenance-recurring-days">Intervalle (jours)</label>
                                    <input 
                                        type="number" 
                                        id="maintenance-recurring-days"
                                        v-model="form.recurringIntervalDays" 
                                        min="1"
                                        placeholder="Ex: 30"
                                    >
                                </div>

                                <div class="form-group">
                                    <label for="maintenance-recurring-km">Intervalle (km)</label>
                                    <input 
                                        type="number" 
                                        id="maintenance-recurring-km"
                                        v-model="form.recurringIntervalKm" 
                                        min="1"
                                        placeholder="Ex: 10000"
                                    >
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="form.isActive">
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">Maintenance active</span>
                                </label>
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="closeModal">Annuler</button>
                        <button class="btn btn-primary" @click="saveMaintenance" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ saving ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Créer') }}
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
                            <p>Êtes-vous sûr de vouloir supprimer cette maintenance ?</p>
                            <p v-if="maintenanceToDelete" class="text-muted">
                                "{{ maintenanceToDelete.title }}" - {{ maintenanceToDelete.vehicle.plateNumber }}
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="closeDeleteModal">Annuler</button>
                        <button class="btn btn-danger" @click="confirmDelete" :disabled="deleting">
                            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-trash"></i>
                            {{ deleting ? 'Suppression...' : 'Supprimer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de détails du véhicule -->
            <div v-if="showVehicleDetailsModal" class="modal-overlay" @click="closeVehicleDetailsModal">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Détails du véhicule</h3>
                        <button class="close-btn" @click="closeVehicleDetailsModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body" v-if="selectedVehicleForDetails">
                        <div class="vehicle-details-content">
                            <div class="detail-row">
                                <label>Plaque d'immatriculation:</label>
                                <span>{{ selectedVehicleForDetails.plateNumber }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.vin">
                                <label>VIN:</label>
                                <span>{{ selectedVehicleForDetails.vin }}</span>
                            </div>
                            <div class="detail-row">
                                <label>Marque:</label>
                                <span>{{ selectedVehicleForDetails.brand.name }}</span>
                            </div>
                            <div class="detail-row">
                                <label>Modèle:</label>
                                <span>{{ selectedVehicleForDetails.model.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.year">
                                <label>Année:</label>
                                <span>{{ selectedVehicleForDetails.year }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.color">
                                <label>Couleur:</label>
                                <span>{{ selectedVehicleForDetails.color.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.category">
                                <label>Catégorie:</label>
                                <span>{{ selectedVehicleForDetails.category.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.fuelType">
                                <label>Type de carburant:</label>
                                <span>{{ selectedVehicleForDetails.fuelType.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.engineSize">
                                <label>Cylindrée:</label>
                                <span>{{ selectedVehicleForDetails.engineSize }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.mileage">
                                <label>Kilométrage:</label>
                                <span>{{ selectedVehicleForDetails.mileage }} km</span>
                            </div>
                            <div class="detail-row">
                                <label>Statut:</label>
                                <span :class="['status-badge', 'status-' + selectedVehicleForDetails.status]">
                                    {{ getVehicleStatusLabel(selectedVehicleForDetails.status) }}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeVehicleDetailsModal">
                            Fermer
                        </button>
                        <button type="button" class="btn btn-primary" @click="selectVehicleFromDetails">
                            Sélectionner ce véhicule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            // Data
            maintenances: [],
            vehicles: [],
            loading: false,
            saving: false,
            deleting: false,
            
            // Search and filters
            searchTerm: '',
            statusFilter: '',
            typeFilter: '',
            searchTimeout: null,
            
            // Recherche véhicules
            vehicleSearchTerm: '',
            vehicleSearchResults: [],
            showVehicleDropdown: false,
            selectedVehicle: null,
            vehicleSearchTimeout: null,
            
            // Pagination
            pagination: null,
            
            // Modal
            showModal: false,
            showDeleteModal: false,
            showVehicleDetailsModal: false,
            selectedVehicleForDetails: null,
            isEditing: false,
            maintenanceToDelete: null,
            
            // Form
            form: {
                vehicleId: null,
                type: '',
                title: '',
                description: '',
                scheduledDate: '',
                completedDate: '',
                cost: null,
                status: 'scheduled',
                odometerReading: null,
                nextMaintenanceOdometer: null,
                nextMaintenanceDate: '',
                serviceProvider: '',
                serviceLocation: '',
                notes: '',
                partsUsed: '',
                workPerformed: '',
                isWarrantyCovered: false,
                isRecurring: false,
                recurringIntervalDays: null,
                recurringIntervalKm: null,
                isActive: true
            },
            
            
            // Other
            today: new Date().toISOString().split('T')[0],
            currency: 'FCFA'
        }
    },

    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadMaintenances();
        await this.loadVehicles();
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
        
        async loadMaintenances() {
            this.loading = true;
            try {
                const params = new URLSearchParams({
                    page: this.pagination?.page || 1,
                    limit: 10
                });
                
                if (this.searchTerm) params.append('search', this.searchTerm);
                if (this.statusFilter) params.append('status', this.statusFilter);
                if (this.typeFilter) params.append('type', this.typeFilter);
                
                const response = await window.apiService.request(`/vehicle-maintenances?${params.toString()}`);
                
                if (response.success) {
                    this.maintenances = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des maintenances', 'error');
                }
            } catch (error) {
                console.error('Erreur API:', error);
                this.showNotification('Erreur lors du chargement des maintenances', 'error');
            } finally {
                this.loading = false;
            }
        },

        async loadVehicles() {
            try {
                const response = await window.apiService.request('/vehicle-maintenances/vehicles');
                if (response.success) {
                    this.vehicles = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules:', error);
            }
        },

        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                if (response.success) {
                    this.currency = response.data.value;
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la devise:', error);
                // Garder la valeur par défaut
            }
        },

        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.pagination = null;
                this.loadMaintenances();
            }, 500);
        },

        changePage(page) {
            this.pagination.page = page;
            this.loadMaintenances();
        },

        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },

        editMaintenance(maintenance) {
            this.isEditing = true;
            this.form = {
                id: maintenance.id,
                vehicleId: maintenance.vehicle.id,
                type: maintenance.type,
                title: maintenance.title,
                description: maintenance.description || '',
                scheduledDate: this.formatDateForInput(maintenance.scheduledDate),
                completedDate: this.formatDateForInput(maintenance.completedDate),
                cost: maintenance.cost,
                status: maintenance.status,
                odometerReading: maintenance.odometerReading,
                nextMaintenanceOdometer: maintenance.nextMaintenanceOdometer,
                nextMaintenanceDate: maintenance.nextMaintenanceDate || '',
                serviceProvider: maintenance.serviceProvider || '',
                serviceLocation: maintenance.serviceLocation || '',
                notes: maintenance.notes || '',
                partsUsed: maintenance.partsUsed || '',
                workPerformed: maintenance.workPerformed || '',
                isWarrantyCovered: maintenance.isWarrantyCovered || false,
                isRecurring: maintenance.isRecurring || false,
                recurringIntervalDays: maintenance.recurringIntervalDays,
                recurringIntervalKm: maintenance.recurringIntervalKm,
                isActive: maintenance.isActive
            };
            
            // Pré-remplir les champs de recherche
            this.selectedVehicle = maintenance.vehicle;
            this.vehicleSearchTerm = '';
            this.showModal = true;
        },

        async saveMaintenance() {
            if (!this.form.vehicleId || !this.form.type || !this.form.title || !this.form.scheduledDate) {
                this.showNotification('Véhicule, type, titre et date programmée sont requis', 'error');
                return;
            }

            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.request('/vehicle-maintenances/' + this.form.id, { method: 'PUT', body: JSON.stringify(this.form) });
                } else {
                    response = await window.apiService.request('/vehicle-maintenances', { method: 'POST', body: JSON.stringify(this.form) });
                }

                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadMaintenances();
                } else {
                    this.showNotification(response.error || 'Erreur lors de la sauvegarde', 'error');
                }
            } catch (error) {
                console.error('Erreur API:', error);
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            } finally {
                this.saving = false;
            }
        },

        deleteMaintenance(maintenance) {
            this.maintenanceToDelete = maintenance;
            this.showDeleteModal = true;
        },

        async confirmDelete() {
            if (!this.maintenanceToDelete) return;

            this.deleting = true;
            try {
                const response = await window.apiService.request('/vehicle-maintenances/' + this.maintenanceToDelete.id, { method: 'DELETE' });
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadMaintenances();
                } else {
                    this.showNotification(response.error || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Erreur API:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            } finally {
                this.deleting = false;
            }
        },

        closeModal() {
            this.showModal = false;
            this.resetForm();
        },

        closeDeleteModal() {
            this.showDeleteModal = false;
            this.maintenanceToDelete = null;
        },

        resetForm() {
            this.form = {
                vehicleId: null,
                type: '',
                title: '',
                description: '',
                scheduledDate: this.today,
                completedDate: '',
                cost: null,
                status: 'scheduled',
                odometerReading: null,
                nextMaintenanceOdometer: null,
                nextMaintenanceDate: '',
                serviceProvider: '',
                serviceLocation: '',
                notes: '',
                partsUsed: '',
                workPerformed: '',
                isWarrantyCovered: false,
                isRecurring: false,
                recurringIntervalDays: null,
                recurringIntervalKm: null,
                isActive: true
            };
            // Réinitialiser les champs de recherche
            this.selectedVehicle = null;
            this.vehicleSearchTerm = '';
            this.vehicleSearchResults = [];
            this.showVehicleDropdown = false;
        },


        // Utility methods
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

        getStatusClass(status) {
            const classes = {
                'scheduled': 'status-scheduled',
                'in_progress': 'status-in-progress',
                'completed': 'status-completed',
                'cancelled': 'status-cancelled'
            };
            return classes[status] || 'status-scheduled';
        },

        // Méthodes de recherche véhicules
        async searchVehicles() {
            console.log('searchVehicles called with term:', this.vehicleSearchTerm);
            clearTimeout(this.vehicleSearchTimeout);
            this.vehicleSearchTimeout = setTimeout(async () => {
                if (this.vehicleSearchTerm.length < 2) {
                    this.vehicleSearchResults = [];
                    console.log('Term too short, clearing results');
                    return;
                }
                
                try {
                    console.log('Calling API with term:', this.vehicleSearchTerm);
                    const response = await window.apiService.getVehicles(
                        null, 
                        this.vehicleSearchTerm, 
                        'active', 
                        1, 
                        20
                    );
                    console.log('API response:', response);
                    if (response.success) {
                        this.vehicleSearchResults = response.data;
                        console.log('Results set:', this.vehicleSearchResults.length, 'vehicles');
                    }
                } catch (error) {
                    console.error('Erreur lors de la recherche de véhicules:', error);
                    this.vehicleSearchResults = [];
                }
            }, 300);
        },
        
        async onVehicleFocus() {
            this.showVehicleDropdown = true;
            if (this.vehicleSearchTerm.length >= 2) {
                this.searchVehicles();
            } else {
                await this.loadInitialVehicles();
            }
        },
        
        async loadInitialVehicles() {
            try {
                const response = await window.apiService.getVehicles(
                    null, 
                    '', 
                    'active', 
                    1, 
                    5
                );
                if (response.success) {
                    this.vehicleSearchResults = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules initiaux:', error);
                this.vehicleSearchResults = [];
            }
        },
        
        async syncVehicleMileageFromTracking() {
            if (!this.form.vehicleId) {
                this.showNotification('Veuillez sélectionner un véhicule', 'error');
                return;
            }
            
            try {
                this.saving = true;
                const response = await window.apiService.request(`/vehicle-maintenances/sync-vehicle-mileage/${this.form.vehicleId}`, { method: 'POST' });
                
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
        
        selectVehicle(vehicle) {
            this.selectedVehicle = vehicle;
            this.form.vehicleId = vehicle.id;
            this.vehicleSearchTerm = '';
            this.showVehicleDropdown = false;
            this.vehicleSearchResults = [];
        },
        
        clearVehicle() {
            this.selectedVehicle = null;
            this.form.vehicleId = '';
            this.vehicleSearchTerm = '';
            this.vehicleSearchResults = [];
        },
        
        hideVehicleDropdown() {
            setTimeout(() => {
                this.showVehicleDropdown = false;
            }, 200);
        },
        
        showVehicleDetails(vehicle) {
            this.selectedVehicleForDetails = vehicle;
            this.showVehicleDetailsModal = true;
        },
        
        closeVehicleDetailsModal() {
            this.showVehicleDetailsModal = false;
            this.selectedVehicleForDetails = null;
        },
        
        selectVehicleFromDetails() {
            if (this.selectedVehicleForDetails) {
                this.selectVehicle(this.selectedVehicleForDetails);
                this.closeVehicleDetailsModal();
            }
        },
        
        getVehicleStatusLabel(status) {
            const labels = {
                'active': 'Actif',
                'maintenance': 'En maintenance',
                'inactive': 'Inactif',
                'sold': 'Vendu',
                'scrapped': 'Mis au rebut'
            };
            return labels[status] || status;
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VehicleMaintenanceCrud;
}

// Global registration for Vue 2
if (typeof window !== 'undefined') {
    window.VehicleMaintenanceCrud = VehicleMaintenanceCrud;
}
