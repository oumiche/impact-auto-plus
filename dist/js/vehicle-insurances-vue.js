const { createApp } = Vue;

const VehicleInsuranceCrud = {
    components: {
        DatePicker,
        DateTimePicker
    },
    template: `
        <div class="vehicle-insurance-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Assurances Véhicules</h1>
                <p class="page-subtitle">Gérez les assurances de votre flotte de véhicules</p>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher une assurance..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="statusFilter" @change="loadInsurances" class="filter-select">
                        <option value="all">Toutes les assurances</option>
                        <option value="active">Actives</option>
                        <option value="expired">Expirées</option>
                        <option value="cancelled">Annulées</option>
                        <option value="pending_renewal">En attente de renouvellement</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i>
                    Nouvelle Assurance
                </button>
            </div>

            <!-- Tableau des assurances -->
            <div class="table-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des assurances...
                </div>
                
                <div v-else-if="insurances.length === 0" class="no-data">
                    <i class="fas fa-shield-alt"></i>
                    <h3>Aucune assurance trouvée</h3>
                    <p>Commencez par ajouter une nouvelle assurance véhicule.</p>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Véhicule</th>
                            <th>N° Police</th>
                            <th>Compagnie</th>
                            <th>Type de Couverture</th>
                            <th>Période</th>
                            <th>Montant</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="insurance in insurances" :key="insurance.id">
                            <td>
                                <code v-if="insurance.code" class="entity-code">{{ insurance.code }}</code>
                                <span v-else class="no-code">-</span>
                            </td>
                            <td>
                                <div class="vehicle-info">
                                    <div class="vehicle-plate">{{ insurance.vehicle.plateNumber }}</div>
                                    <div class="vehicle-details">
                                        {{ insurance.vehicle.brand }} {{ insurance.vehicle.model }} ({{ insurance.vehicle.year }})
                                    </div>
                                </div>
                            </td>
                            <td>{{ insurance.policyNumber }}</td>
                            <td>{{ insurance.insuranceCompany }}</td>
                            <td>
                                <span class="coverage-type">{{ getCoverageTypeLabel(insurance.coverageType) }}</span>
                            </td>
                            <td>
                                <div class="date-range">
                                    <div>{{ formatDate(insurance.startDate) }}</div>
                                    <div class="text-muted">au {{ formatDate(insurance.endDate) }}</div>
                                </div>
                            </td>
                            <td>
                                <div class="amount">
                                    {{ formatNumber(insurance.premiumAmount) }} {{ currency }}
                                </div>
                            </td>
                            <td>
                                <span :class="getStatusClass(insurance.status)">
                                    {{ getStatusLabel(insurance.status) }}
                                </span>
                                <div v-if="insurance.isExpiringSoon" class="expiry-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    Expire dans {{ insurance.daysUntilExpiry }} jour(s)
                                </div>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" @click="editInsurance(insurance)" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteInsurance(insurance)" title="Supprimer">
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
                        <h3>{{ isEditing ? "Modifier l'assurance" : "Nouvelle assurance" }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form @submit.prevent="saveInsurance">
                        <div class="modal-body">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="insurance-vehicle">Véhicule *</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="insurance-vehicle"
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
                                                    <div v-if="vehicle.hasActiveInsurance" class="insurance-warning">
                                                        <i class="fas fa-exclamation-triangle"></i>
                                                        Déjà assuré
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="insurance-company">Compagnie d'assurance *</label>
                                    <input 
                                        type="text" 
                                        id="insurance-company"
                                        v-model="form.insuranceCompany"
                                        placeholder="Ex: AXA, Allianz, NSIA..."
                                        required
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="insurance-policy">N° de Police *</label>
                                    <input 
                                        type="text" 
                                        id="insurance-policy"
                                        v-model="form.policyNumber"
                                        placeholder="Ex: POL-2024-001"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="insurance-coverage">Type de Couverture *</label>
                                    <select id="insurance-coverage" v-model="form.coverageType" required>
                                        <option value="">Sélectionner un type...</option>
                                        <option value="comprehensive">Tous risques</option>
                                        <option value="third_party">Tiers</option>
                                        <option value="liability">Responsabilité civile</option>
                                        <option value="collision">Collision</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="insurance-start-date">Date de début *</label>
                                    <date-picker 
                                        v-model="form.startDate"
                                        placeholder="Sélectionner la date de début"
                                        :max-date="today"
                                    ></date-picker>
                                </div>
                                
                                <div class="form-group">
                                    <label for="insurance-end-date">Date de fin *</label>
                                    <date-picker 
                                        v-model="form.endDate"
                                        placeholder="Sélectionner la date de fin"
                                        :min-date="form.startDate || today"
                                    ></date-picker>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="insurance-premium">Montant de la prime ({{ currency }}) *</label>
                                    <input 
                                        type="number" 
                                        id="insurance-premium"
                                        v-model="form.premiumAmount"
                                        step="0.01"
                                        min="0"
                                        :placeholder="'Ex: 150000.00 ' + currency"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="insurance-status">Statut</label>
                                    <select id="insurance-status" v-model="form.status">
                                        <option value="active">Active</option>
                                        <option value="expired">Expirée</option>
                                        <option value="cancelled">Annulée</option>
                                        <option value="pending_renewal">En attente de renouvellement</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="insurance-deductible">Franchise ({{ currency }})</label>
                                    <input 
                                        type="number" 
                                        id="insurance-deductible"
                                        v-model="form.deductible"
                                        step="0.01"
                                        min="0"
                                        :placeholder="'Ex: 50000.00 ' + currency"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="insurance-limit">Limite de couverture ({{ currency }})</label>
                                    <input 
                                        type="number" 
                                        id="insurance-limit"
                                        v-model="form.coverageLimit"
                                        step="0.01"
                                        min="0"
                                        :placeholder="'Ex: 5000000.00 ' + currency"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="insurance-agent-name">Nom de l'agent</label>
                                    <input 
                                        type="text" 
                                        id="insurance-agent-name"
                                        v-model="form.agentName"
                                        placeholder="Ex: Jean Dupont"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="insurance-agent-contact">Contact agent</label>
                                    <input 
                                        type="text" 
                                        id="insurance-agent-contact"
                                        v-model="form.agentContact"
                                        placeholder="Ex: +225 07 12 34 56 78"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="insurance-agent-email">Email agent</label>
                                <input 
                                    type="email" 
                                    id="insurance-agent-email"
                                    v-model="form.agentEmail"
                                    placeholder="Ex: agent@assurance.com"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="insurance-details">Détails de la couverture</label>
                                <textarea 
                                    id="insurance-details"
                                    v-model="form.coverageDetails"
                                    rows="3"
                                    placeholder="Décrivez les détails de la couverture..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="insurance-notes">Notes</label>
                                <textarea 
                                    id="insurance-notes"
                                    v-model="form.notes"
                                    rows="2"
                                    placeholder="Notes supplémentaires..."
                                ></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="insurance-renewal-date">Date de renouvellement</label>
                                    <date-picker 
                                        v-model="form.renewalDate"
                                        placeholder="Sélectionner la date de renouvellement"
                                        :min-date="today"
                                    ></date-picker>
                                </div>
                                
                                <div class="form-group">
                                    <label for="insurance-reminder-days">Rappel (jours avant expiration)</label>
                                    <input 
                                        type="number" 
                                        id="insurance-reminder-days"
                                        v-model="form.renewalReminderDays"
                                        min="1"
                                        max="365"
                                        placeholder="Ex: 30"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="form.isAutoRenewal">
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">Renouvellement automatique</span>
                                </label>
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
                            <p v-if="insuranceToDelete">Êtes-vous sûr de vouloir supprimer l'assurance <strong>{{ insuranceToDelete.policyNumber }}</strong> ?</p>
                            <p v-else>Êtes-vous sûr de vouloir supprimer cette assurance ?</p>
                            <p class="text-muted">Cette action est irréversible et supprimera définitivement toutes les données associées à cette assurance.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="!insuranceToDelete">
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
            insurances: [],
            vehicles: [],
            vehicleSearchResults: [],
            vehicleSearch: '',
            showVehicleDropdown: false,
            selectedVehicleName: '',
            vehicleSearchTimeout: null,
            loading: false,
            saving: false,
            searchTerm: '',
            statusFilter: 'all',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            insuranceToDelete: null,
            currency: 'Fcfa',
            today: new Date().toISOString().split('T')[0],
            form: {
                id: null,
                vehicleId: '',
                policyNumber: '',
                insuranceCompany: '',
                coverageType: '',
                startDate: '',
                endDate: '',
                premiumAmount: null,
                deductible: null,
                coverageLimit: null,
                status: 'active',
                coverageDetails: '',
                agentName: '',
                agentContact: '',
                agentEmail: '',
                notes: '',
                renewalDate: '',
                renewalReminderDays: null,
                isAutoRenewal: false
            }
        };
    },
    
    mounted() {
        this.loadInsurances();
        this.loadVehicles();
        this.loadCurrency();
    },
    
    methods: {
        async loadInsurances() {
            this.loading = true;
            try {
                const response = await window.apiService.getVehicleInsurances(
                    this.currentPage, 
                    this.itemsPerPage, 
                    this.searchTerm, 
                    this.statusFilter
                );
                
                if (response.success) {
                    this.insurances = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des assurances: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des assurances:', error);
                this.showNotification('Erreur lors du chargement des assurances', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadVehicles() {
            try {
                const response = await window.apiService.getAvailableVehiclesForInsurance();
                if (response.success) {
                    this.vehicles = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules:', error);
            }
        },

        async searchVehicles(search = '') {
            try {
                const response = await window.apiService.getAvailableVehiclesForInsurance(search);
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
                const response = await window.apiService.getAvailableVehiclesForInsurance('', 10);
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
        
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                if (response.success && response.data) {
                    this.currency = response.data.value || 'Fcfa';
                }
            } catch (error) {
                console.warn('Impossible de charger la devise depuis les paramètres, utilisation de la devise par défaut:', error);
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadInsurances();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadInsurances();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editInsurance(insurance) {
            this.isEditing = true;
            this.form = {
                id: insurance.id,
                vehicleId: insurance.vehicle.id,
                policyNumber: insurance.policyNumber,
                insuranceCompany: insurance.insuranceCompany,
                coverageType: insurance.coverageType,
                startDate: insurance.startDate,
                endDate: insurance.endDate,
                premiumAmount: insurance.premiumAmount,
                currency: insurance.currency,
                deductible: insurance.deductible,
                coverageLimit: insurance.coverageLimit,
                status: insurance.status,
                coverageDetails: insurance.coverageDetails || '',
                agentName: insurance.agentName || '',
                agentContact: insurance.agentContact || '',
                agentEmail: insurance.agentEmail || '',
                notes: insurance.notes || '',
                renewalDate: insurance.renewalDate || '',
                renewalReminderDays: insurance.renewalReminderDays,
                isAutoRenewal: insurance.isAutoRenewal || false
            };
            
            // Pré-remplir le champ de recherche de véhicule
            this.selectedVehicleName = `${insurance.vehicle.plateNumber} - ${insurance.vehicle.brand} ${insurance.vehicle.model} (${insurance.vehicle.year})`;
            this.vehicleSearch = this.selectedVehicleName;
            
            this.showModal = true;
        },
        
        async saveInsurance() {
            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.updateVehicleInsurance(this.form.id, this.form);
                } else {
                    response = await window.apiService.createVehicleInsurance(this.form);
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadInsurances();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        deleteInsurance(insurance) {
            this.insuranceToDelete = insurance;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.insuranceToDelete) return;
            
            try {
                const response = await window.apiService.deleteVehicleInsurance(this.insuranceToDelete.id);
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadInsurances();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.insuranceToDelete = null;
        },
        
        resetForm() {
            this.form = {
                id: null,
                vehicleId: '',
                policyNumber: '',
                insuranceCompany: '',
                coverageType: '',
                startDate: '',
                endDate: '',
                premiumAmount: null,
                currency: 'XOF',
                deductible: null,
                coverageLimit: null,
                status: 'active',
                coverageDetails: '',
                agentName: '',
                agentContact: '',
                agentEmail: '',
                notes: '',
                renewalDate: '',
                renewalReminderDays: null,
                isAutoRenewal: false
            };
            
            // Réinitialiser les champs de recherche de véhicule
            this.vehicleSearch = '';
            this.selectedVehicleName = '';
            this.vehicleSearchResults = [];
            this.showVehicleDropdown = false;
        },
        
        getCoverageTypeLabel(type) {
            const labels = {
                'comprehensive': 'Tous risques',
                'third_party': 'Tiers',
                'liability': 'Responsabilité civile',
                'collision': 'Collision'
            };
            return labels[type] || type;
        },
        
        getStatusLabel(status) {
            const labels = {
                'active': 'Active',
                'expired': 'Expirée',
                'cancelled': 'Annulée',
                'pending_renewal': 'En attente de renouvellement'
            };
            return labels[status] || status;
        },
        
        getStatusClass(status) {
            const classes = {
                'active': 'status status-success',
                'expired': 'status status-danger',
                'cancelled': 'status status-warning',
                'pending_renewal': 'status status-info'
            };
            return classes[status] || 'status';
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
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
        
        formatNumber(number) {
            return new Intl.NumberFormat('fr-FR').format(number);
        },
        
        showNotification(message, type = 'info') {
            // Créer une notification temporaire
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
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
    window.VehicleInsuranceCrud = VehicleInsuranceCrud;
}
