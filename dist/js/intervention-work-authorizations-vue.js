/**
 * Composant Vue.js pour la gestion des autorisations de travail
 */
const InterventionWorkAuthorizationsList = {
    name: 'InterventionWorkAuthorizationsList',
    
    data() {
        return {
            authorizations: [],
            loading: false,
            searchQuery: '',
            statusFilter: 'all',
            dateFilter: 'all',
            showFilters: false,
            showFiltersPanel: false,
            selectedAuthorizations: [],
            showBulkActions: false,
            currency: 'F CFA',
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 20
            },
            statistics: {
                total: 0,
                active: 0
            },
            searchTimeout: null,
            // Filtres avancés - Marque
            filterBrandSearchTerm: '',
            selectedFilterBrand: null,
            availableFilterBrands: [],
            showFilterBrandSearch: false,
            loadingFilterBrands: false,
            brandSearchTimeout: null,
            // Filtres avancés - Modèle
            filterModelSearchTerm: '',
            selectedFilterModel: null,
            availableFilterModels: [],
            showFilterModelSearch: false,
            loadingFilterModels: false,
            modelSearchTimeout: null,
            // Filtres avancés - Période
            dateStart: '',
            dateEnd: ''
        };
    },
    
    computed: {
        filteredAuthorizations() {
            let filtered = this.authorizations;
            
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(auth => 
                    auth.interventionCode.toLowerCase().includes(query) ||
                    (auth.quoteNumber && auth.quoteNumber.toLowerCase().includes(query)) ||
                    auth.vehicle.brand.toLowerCase().includes(query) ||
                    auth.vehicle.model.toLowerCase().includes(query) ||
                    auth.vehicle.plateNumber.toLowerCase().includes(query)
                );
            }
            
            // Filtre par marque
            if (this.selectedFilterBrand) {
                filtered = filtered.filter(auth => 
                    auth.vehicle.brand.toLowerCase() === this.selectedFilterBrand.name.toLowerCase()
                );
            }
            
            // Filtre par modèle
            if (this.selectedFilterModel) {
                filtered = filtered.filter(auth => 
                    auth.vehicle.model.toLowerCase() === this.selectedFilterModel.name.toLowerCase()
                );
            }
            
            // Filtre par période personnalisée
            if (this.dateStart || this.dateEnd) {
                filtered = filtered.filter(auth => {
                    const authDate = new Date(auth.authorizationDate);
                    if (this.dateStart) {
                        const startDate = new Date(this.dateStart);
                        if (authDate < startDate) return false;
                    }
                    if (this.dateEnd) {
                        const endDate = new Date(this.dateEnd);
                        endDate.setHours(23, 59, 59, 999);
                        if (authDate > endDate) return false;
                    }
                    return true;
                });
            }
            
            if (this.statusFilter !== 'all') {
                filtered = filtered.filter(auth => {
                    switch (this.statusFilter) {
                        case 'validated':
                            return auth.isValidated;
                        case 'pending':
                            return !auth.isValidated;
                        default:
                            return true;
                    }
                });
            }
            
            if (this.dateFilter !== 'all') {
                const now = new Date();
                filtered = filtered.filter(auth => {
                    const authDate = new Date(auth.authorizationDate);
                    const daysDiff = Math.floor((now - authDate) / (1000 * 60 * 60 * 24));
                    
                    switch (this.dateFilter) {
                        case 'today':
                            return daysDiff === 0;
                        case 'week':
                            return daysDiff <= 7;
                        case 'month':
                            return daysDiff <= 30;
                        case 'quarter':
                            return daysDiff <= 90;
                        default:
                            return true;
                    }
                });
            }
            
            return filtered;
        },
        
        statusOptions() {
            return [
                { value: 'all', label: 'Tous les statuts' },
                { value: 'pending', label: 'En attente' },
                { value: 'validated', label: 'Validées' }
            ];
        },
        
        dateOptions() {
            return [
                { value: 'all', label: 'Toutes les dates' },
                { value: 'today', label: "Aujourd'hui" },
                { value: 'week', label: '7 derniers jours' },
                { value: 'month', label: '30 derniers jours' },
                { value: 'quarter', label: '3 derniers mois' }
            ];
        },
        
        paginatedAuthorizations() {
            const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
            const end = start + this.pagination.itemsPerPage;
            return this.filteredAuthorizations.slice(start, end);
        },
        
        activeFiltersCount() {
            let count = 0;
            if (this.statusFilter !== 'all') count++;
            if (this.dateFilter !== 'all') count++;
            if (this.selectedFilterBrand) count++;
            if (this.selectedFilterModel) count++;
            if (this.dateStart) count++;
            if (this.dateEnd) count++;
            return count;
        },
        
        selectAll() {
            return this.filteredAuthorizations.length > 0 && this.selectedAuthorizations.length === this.filteredAuthorizations.length;
        }
    },
    
    mounted() {
        // Attendre un peu que tous les services soient chargés
        setTimeout(() => {
            this.loadAuthorizations();
            this.loadStatistics();
            // Charger la sidebar si disponible
            if (window.loadSidebar) {
                window.loadSidebar();
            }
        }, 100);
        
        // Event listener pour fermer les dropdowns
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    
    methods: {
        async waitForApiService() {
            // Attendre que ApiService soit disponible
            let attempts = 0;
            const maxAttempts = 50; // 5 secondes max
            
            while (!window.apiService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.apiService) {
                console.error('ApiService non disponible après 5 secondes');
                throw new Error('ApiService non disponible');
            }
            
            console.log('ApiService disponible pour intervention-work-authorizations');
        },
        
        // Méthodes de notification utilisant le système centralisé
        showNotification(message, type = 'info') {
            switch (type) {
                case 'success':
                    this.$notifySuccess(message);
                    break;
                case 'error':
                    this.$notifyError(message);
                    break;
                case 'warning':
                    this.$notifyWarning(message);
                    break;
                default:
                    this.$notifyInfo(message);
            }
        },

        $notifySuccess(message, options = {}) {
            if (window.notifySuccess) {
                return window.notifySuccess(message, options);
                } else {
                console.log('[SUCCESS]', message);
            }
        },

        $notifyError(message, options = {}) {
            if (window.notifyError) {
                return window.notifyError(message, options);
                    } else {
                console.log('[ERROR]', message);
            }
        },

        $notifyWarning(message, options = {}) {
            if (window.notifyWarning) {
                return window.notifyWarning(message, options);
                    } else {
                console.log('[WARNING]', message);
            }
        },

        $notifyInfo(message, options = {}) {
            if (window.notifyInfo) {
                return window.notifyInfo(message, options);
            } else {
                console.log('[INFO]', message);
            }
        },
        
        loadSidebar() {
            if (window.loadSidebar) {
                window.loadSidebar();
            }
        }
    },
    
    watch: {
        filteredAuthorizations() {
            this.updatePagination();
        }
    },
    
    template: `
        <div class="intervention-work-authorizations-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1><i class="fas fa-clipboard-check"></i> Gestion des Accords Travaux</h1>
                            <p>Créer, modifier et suivre les accords travaux pour les interventions</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="createAuthorization">
                            <i class="fas fa-plus"></i>
                            Nouvel Accord
                        </button>
                    </div>
                </div>
            </div>

            <!-- Barre de recherche simple et bouton filtres -->
            <div style="display: flex; gap: 12px; margin-bottom: 24px; align-items: center;">
                <div class="search-bar-container" style="flex: 1;">
                    <i class="fas fa-search search-icon"></i>
                        <input 
                            type="text" 
                        class="form-control" 
                            v-model="searchQuery"
                        @input="debouncedSearch"
                        placeholder="Rechercher par numéro, intervention, véhicule, marque, modèle..."
                    >
                </div>
                <button class="btn btn-outline" @click="toggleFiltersPanel" style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    <i class="fas fa-filter"></i>
                    Filtres
                    <span v-if="activeFiltersCount > 0" class="badge-count">{{ activeFiltersCount }}</span>
                </button>
                    </div>

            <!-- Panneau de filtres latéral -->
            <div v-if="showFiltersPanel" class="filters-overlay" @click="closeFiltersPanel"></div>
            <div class="filters-panel" :class="{ 'filters-panel-open': showFiltersPanel }">
                <div class="filters-panel-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-filter"></i>
                        Filtres Avancés
                    </h3>
                    <button class="btn-icon" @click="closeFiltersPanel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="filters-panel-body">
                    <!-- Marque, Modèle, Période - Même code que intervention-quotes -->
                    <div class="filter-section">
                        <label class="form-label">Marque</label>
                        <div style="position: relative;">
                            <input type="text" class="form-control" v-model="filterBrandSearchTerm"
                                @focus="onFilterBrandFocus" @input="searchFilterBrands"
                                :placeholder="selectedFilterBrand ? selectedFilterBrand.name : 'Rechercher une marque...'" autocomplete="off">
                            <button v-if="selectedFilterBrand" type="button" @click="clearFilterBrandSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                            <div v-if="showFilterBrandSearch" class="dropdown-menu" 
                                 style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterBrands" style="padding: 20px; text-align: center; color: #6c757d;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>
                                <div v-else-if="availableFilterBrands.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;"><i class="fas fa-search"></i> Aucune marque trouvée</div>
                                <div v-else>
                                    <div v-if="filterBrandSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;"><i class="fas fa-star"></i> MARQUES POPULAIRES</div>
                                    <div v-for="brand in availableFilterBrands" :key="brand.id" @click="selectFilterBrand(brand)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'" @mouseout="$event.target.style.background='white'">
                                        <div style="font-weight: 600;">{{ brand.name }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <label class="form-label">Modèle</label>
                        <div style="position: relative;">
                            <input type="text" class="form-control" v-model="filterModelSearchTerm"
                                @focus="onFilterModelFocus" @input="searchFilterModels"
                                :placeholder="selectedFilterModel ? selectedFilterModel.name : 'Rechercher un modèle...'"
                                :disabled="!selectedFilterBrand" autocomplete="off">
                            <button v-if="selectedFilterModel" type="button" @click="clearFilterModelSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                            <div v-if="showFilterModelSearch" class="dropdown-menu"
                                 style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterModels" style="padding: 20px; text-align: center; color: #6c757d;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>
                                <div v-else-if="availableFilterModels.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;"><i class="fas fa-search"></i> Aucun modèle trouvé</div>
                                <div v-else>
                                    <div v-if="filterModelSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;"><i class="fas fa-star"></i> MODÈLES POPULAIRES</div>
                                    <div v-for="model in availableFilterModels" :key="model.id" @click="selectFilterModel(model)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'" @mouseout="$event.target.style.background='white'">
                                        <div style="font-weight: 600;">{{ model.name }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <small v-if="!selectedFilterBrand" style="color: #6c757d; font-size: 12px; margin-top: 4px; display: block;">Sélectionnez d'abord une marque</small>
                    </div>
                    
                    <div class="filter-section">
                        <label class="form-label">Période personnalisée</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div><label style="font-size: 12px; color: #6c757d; display: block; margin-bottom: 4px;">Date début</label>
                                <input type="date" class="form-control" v-model="dateStart" :max="dateEnd || null"></div>
                            <div><label style="font-size: 12px; color: #6c757d; display: block; margin-bottom: 4px;">Date fin</label>
                                <input type="date" class="form-control" v-model="dateEnd" :min="dateStart || null"></div>
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <label class="form-label">Statut</label>
                        <select v-model="statusFilter" class="form-control">
                            <option value="all">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="validated">Validées</option>
                        </select>
                    </div>
                    
                    <div class="filter-section">
                        <label class="form-label">Période prédéfinie</label>
                        <select v-model="dateFilter" class="form-control">
                            <option value="all">Toutes les dates</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="week">7 derniers jours</option>
                            <option value="month">30 derniers jours</option>
                            <option value="quarter">3 derniers mois</option>
                        </select>
                    </div>

                    <div class="filters-panel-actions">
                        <button class="btn btn-outline" @click="resetFilters"><i class="fas fa-redo"></i> Réinitialiser</button>
                        <button class="btn btn-primary" @click="applyFilters"><i class="fas fa-check"></i> Appliquer</button>
                    </div>
                </div>
            </div>

            <!-- Actions en masse -->
            <div v-if="showBulkActions" class="bulk-actions">
                <div class="bulk-info">
                    <i class="fas fa-info-circle"></i>
                    {{ selectedAuthorizations.length }} accord(s) sélectionné(s)
                </div>
                <div class="bulk-buttons">
                    <button class="btn btn-success" @click="bulkValidate" :disabled="loading || !canBulkValidate">
                        <i class="fas fa-check"></i>
                        Valider
                    </button>
                    <button class="btn btn-danger" @click="bulkDelete" :disabled="loading || !canBulkDelete">
                        <i class="fas fa-trash"></i>
                        Supprimer
                    </button>
                </div>
            </div>

            <!-- Liste des autorisations -->
            <div class="authorizations-list">
                <div v-if="loading" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des accords...
                </div>
                
                <div v-else-if="filteredAuthorizations.length === 0" class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <h3>Aucun accord trouvé</h3>
                    <p>Il n'y a actuellement aucun accord travaux correspondant à vos critères.</p>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input 
                                        type="checkbox" 
                                        :checked="selectAll"
                                        @change="toggleAllAuthorizations"
                                        class="select-all-checkbox"
                                    >
                                </th>
                                <th>Numéro & Intervention</th>
                                <th>Véhicule</th>
                                <th>Devis</th>
                                <th>Autorisé par</th>
                                <th>Date Auth.</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="auth in paginatedAuthorizations" :key="auth.id" class="auth-row">
                                <td class="checkbox-cell">
                                    <input 
                                        type="checkbox" 
                                        :checked="selectedAuthorizations.includes(auth.id)"
                                        @change="toggleAuthorizationSelection(auth.id)"
                                        class="auth-checkbox"
                                    >
                                </td>
                                <td class="auth-number-cell">
                                    <div class="auth-number-info">
                                        <div class="auth-number-line">
                                            <code class="entity-code">{{ auth.authorizationNumber }}</code>
                                        </div>
                                        <div class="intervention-number-line">
                                            <span class="intervention-code">{{ auth.interventionCode }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="vehicle-cell">
                                    <div class="vehicle-info">
                                        <div class="vehicle-details">
                                            {{ auth.vehicle?.brand?.name || 'N/A' }} {{ auth.vehicle?.model?.name || 'N/A' }}
                                        </div>
                                        <div class="vehicle-plate">{{ auth.vehicle?.plateNumber || 'N/A' }}</div>
                                    </div>
                                </td>
                                <td class="quote-cell">
                                    <span v-if="auth.quoteNumber" class="quote-number">{{ auth.quoteNumber }}</span>
                                    <span v-else class="no-quote">-</span>
                                </td>
                                <td class="authorized-by-cell">
                                    <div v-if="auth.authorizedBy" class="authorized-by-info">
                                        <div class="authorized-by-name">
                                            {{ auth.authorizedBy.firstName }} {{ auth.authorizedBy.lastName }}
                                        </div>
                                        <div class="authorized-by-position">
                                            {{ auth.authorizedBy.position || 'Poste non défini' }}
                                        </div>
                                    </div>
                                    <div v-else class="no-authorizer">-</div>
                                </td>
                                <td class="authorization-date-cell">
                                    {{ formatDate(auth.authorizationDate) }}
                                </td>
                                <td class="status-cell">
                                    <span class="status-badge" :class="getStatusBadgeClass(auth)">
                                        {{ getStatusText(auth) }}
                                    </span>
                                </td>
                                <td class="actions-cell">
                                    <div class="table-actions">
                                        <button 
                                            class="btn btn-outline btn-sm" 
                                            @click="editAuthorization(auth)" 
                                            title="Modifier"
                                        >
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            v-if="!auth.isValidated"
                                            class="btn btn-success btn-sm" 
                                            @click="validateAuthorization(auth)" 
                                            title="Valider"
                                        >
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button 
                                            class="btn btn-danger btn-sm" 
                                            @click="deleteAuthorization(auth)" 
                                            :disabled="auth.isValidated"
                                            :title="auth.isValidated ? 'Suppression interdite (autorisation validée)' : 'Supprimer'"
                                        >
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,

    methods: {
        async loadAuthorizations() {
            try {
                if (!window.apiService) {
                    console.error('ApiService non disponible');
                    return;
                }
                
                this.loading = true;
                const response = await window.apiService.request('/intervention-work-authorizations');
                
                if (response.success) {
                    this.authorizations = response.data;
                    this.updateStatistics();
                    this.updatePagination();
                } else {
                    this.$notifyError('Erreur lors du chargement des accords');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des accords:', error);
                this.$notifyError('Erreur lors du chargement des accords');
            } finally {
                this.loading = false;
            }
        },
        
        async loadStatistics() {
            try {
                if (!window.apiService) {
                    console.error('ApiService non disponible pour les statistiques');
                    return;
                }
                
                const response = await window.apiService.request('/intervention-work-authorizations/statistics/overview');
                if (response.success) {
                    this.statistics = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
            }
        },
        
        checkIfUrgent(auth) {
            if (!auth.expirationDate) return false;
            const now = new Date();
            const expiration = new Date(auth.expirationDate);
            const daysUntilExpiry = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
        },
        
        checkIfExpired(auth) {
            if (!auth.expirationDate) return false;
            const now = new Date();
            const expiration = new Date(auth.expirationDate);
            return expiration < now;
        },
        
        getDaysUntilExpiry(auth) {
            if (!auth.expirationDate) return null;
            const now = new Date();
            const expiration = new Date(auth.expirationDate);
            return Math.ceil((expiration - now) / (1000 * 60 * 60 * 24));
        },
        
        updateStatistics() {
            this.statistics.total = this.authorizations.length;
            this.statistics.active = this.authorizations.filter(auth => auth.isValidated).length;
        },
        
        updatePagination() {
            this.pagination.totalItems = this.filteredAuthorizations.length;
            this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);
            
            if (this.pagination.currentPage > this.pagination.totalPages) {
                this.pagination.currentPage = 1;
            }
        },
        
        changePage(direction) {
            const newPage = this.pagination.currentPage + direction;
            if (newPage >= 1 && newPage <= this.pagination.totalPages) {
                this.pagination.currentPage = newPage;
            }
        },
        
        toggleFilters() {
            this.showFilters = !this.showFilters;
        },
        
        toggleFiltersPanel() {
            this.showFiltersPanel = !this.showFiltersPanel;
        },
        
        closeFiltersPanel() {
            this.showFiltersPanel = false;
        },
        
        applyFilters() {
            this.closeFiltersPanel();
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {}, 300);
        },
        
        clearFilters() {
            this.searchQuery = '';
            this.statusFilter = 'all';
            this.dateFilter = 'all';
            this.pagination.currentPage = 1;
        },
        
        resetFilters() {
            this.clearFilters();
            this.selectedFilterBrand = null;
            this.selectedFilterModel = null;
            this.filterBrandSearchTerm = '';
            this.filterModelSearchTerm = '';
            this.dateStart = '';
            this.dateEnd = '';
            this.closeFiltersPanel();
        },
        async onFilterBrandFocus() { this.showFilterBrandSearch = true; if (!this.filterBrandSearchTerm && !this.availableFilterBrands.length) await this.loadTopBrands(); },
        async loadTopBrands() { this.loadingFilterBrands = true; try { const r = await window.apiService.getVehicleBrands('', 5); if (r.success) this.availableFilterBrands = r.data || []; } catch(e){} finally { this.loadingFilterBrands = false; }},
        async searchFilterBrands() { clearTimeout(this.brandSearchTimeout); if (!this.filterBrandSearchTerm) { await this.loadTopBrands(); return; } if (this.filterBrandSearchTerm.length < 2) return; this.brandSearchTimeout = setTimeout(async () => { this.loadingFilterBrands = true; try { const r = await window.apiService.getVehicleBrands(this.filterBrandSearchTerm, 50); if (r.success) this.availableFilterBrands = r.data || []; } catch(e){} finally { this.loadingFilterBrands = false; }}, 300); },
        selectFilterBrand(brand) { this.selectedFilterBrand = brand; this.filterBrandSearchTerm = brand.name; this.showFilterBrandSearch = false; this.selectedFilterModel = null; this.filterModelSearchTerm = ''; },
        clearFilterBrandSelection() { this.selectedFilterBrand = null; this.filterBrandSearchTerm = ''; this.selectedFilterModel = null; this.filterModelSearchTerm = ''; },
        async onFilterModelFocus() { if (!this.selectedFilterBrand) return; this.showFilterModelSearch = true; if (!this.filterModelSearchTerm && !this.availableFilterModels.length) await this.loadTopModels(); },
        async loadTopModels() { if (!this.selectedFilterBrand) return; this.loadingFilterModels = true; try { const r = await window.apiService.getVehicleModels(this.selectedFilterBrand.id, '', 5); if (r.success) this.availableFilterModels = r.data || []; } catch(e){} finally { this.loadingFilterModels = false; }},
        async searchFilterModels() { clearTimeout(this.modelSearchTimeout); if (!this.selectedFilterBrand) return; if (!this.filterModelSearchTerm) { await this.loadTopModels(); return; } if (this.filterModelSearchTerm.length < 2) return; this.modelSearchTimeout = setTimeout(async () => { this.loadingFilterModels = true; try { const r = await window.apiService.getVehicleModels(this.selectedFilterBrand.id, this.filterModelSearchTerm, 50); if (r.success) this.availableFilterModels = r.data || []; } catch(e){} finally { this.loadingFilterModels = false; }}, 300); },
        selectFilterModel(model) { this.selectedFilterModel = model; this.filterModelSearchTerm = model.name; this.showFilterModelSearch = false; },
        clearFilterModelSelection() { this.selectedFilterModel = null; this.filterModelSearchTerm = ''; },
        handleClickOutside(event) { if (!event.target.closest('.filter-section')) { this.showFilterBrandSearch = false; this.showFilterModelSearch = false; }},
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },
        
        formatCurrency(amount) {
            if (!amount) return `0,00 ${this.currency}`;
            return new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount) + ` ${this.currency}`;
        },
        
        getStatusBadgeClass(auth) {
            if (auth.isValidated) return 'status-validated';
            return 'status-pending';
        },
        
        getStatusText(auth) {
            if (auth.isValidated) return 'Validée';
            return 'En attente';
        },
        
        toggleAuthorizationSelection(authId) {
            const index = this.selectedAuthorizations.indexOf(authId);
            if (index > -1) {
                this.selectedAuthorizations.splice(index, 1);
            } else {
                this.selectedAuthorizations.push(authId);
            }
            this.updateBulkActions();
        },
        
        toggleAllAuthorizations() {
            if (this.selectAll) {
                // Désélectionner toutes les autorisations
                this.selectedAuthorizations = [];
                this.showBulkActions = false;
            } else {
                // Sélectionner toutes les autorisations visibles
                this.selectedAuthorizations = this.filteredAuthorizations.map(auth => auth.id);
                this.showBulkActions = this.selectedAuthorizations.length > 0;
            }
        },
        
        updateBulkActions() {
            this.showBulkActions = this.selectedAuthorizations.length > 0;
        },
        
        canBulkDelete() {
            if (this.selectedAuthorizations.length === 0) return false;
            const selectedAuths = this.authorizations.filter(auth => this.selectedAuthorizations.includes(auth.id));
            return selectedAuths.some(auth => !auth.isValidated);
        },
        
        canBulkValidate() {
            if (this.selectedAuthorizations.length === 0) return false;
            const selectedAuths = this.authorizations.filter(auth => this.selectedAuthorizations.includes(auth.id));
            return selectedAuths.some(auth => !auth.isValidated);
        },
        
        async viewAuthorization(auth) {
            try {
                this.loading = true;
                const response = await window.apiService.request(`/intervention-work-authorizations/${auth.id}`);
                
                if (response.success) {
                    this.showAuthorizationModal(response.data);
                } else {
                    this.showNotification('Erreur lors du chargement de l\'autorisation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement de l\'autorisation:', error);
                this.showNotification('Erreur lors du chargement de l\'autorisation', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        showAuthorizationModal(auth) {
            // Implémentation simplifiée de la modal
            alert(`Accord #${auth.id}\nIntervention: ${auth.interventionCode}\nVéhicule: ${auth.vehicle?.brand?.name || 'N/A'} ${auth.vehicle?.model?.name || 'N/A'}`);
        },
        
        editAuthorization(auth) {
            window.location.href = `/intervention-work-authorization-edit.html?id=${auth.id}`;
        },
        
        async validateAuthorization(authId) {
            const confirmed = confirm('Valider cet accord travaux ?');
            
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-work-authorizations/${authId}/validate`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showNotification('Accord validé avec succès', 'success');
                    await this.loadAuthorizations();
                } else {
                    this.showNotification('Erreur lors de la validation: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la validation:', error);
                this.showNotification('Erreur lors de la validation de l\'accord', 'error');
            }
        },
        
        async deleteAuthorization(auth) {
            // Vérifier si l'autorisation est validée
            if (auth.isValidated) {
                this.showNotification('Impossible de supprimer une autorisation validée. Annulez d\'abord la validation.', 'error');
                return;
            }
            
            const confirmed = await this.confirmAction(`Supprimer l'accord #${auth.id} ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-work-authorizations/${auth.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('Accord supprimé avec succès', 'success');
                    await this.loadAuthorizations();
                } else {
                    this.showNotification('Erreur lors de la suppression: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression de l\'accord', 'error');
            }
        },
        
        async bulkValidate() {
            if (this.selectedAuthorizations.length === 0) return;
            
            const confirmed = await this.confirmAction(`Valider ${this.selectedAuthorizations.length} accord(s) ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request('/intervention-work-authorizations/bulk-validate', {
                    method: 'POST',
                    body: JSON.stringify({
                    ids: this.selectedAuthorizations
                    })
                });
                
                if (response.success) {
                    this.showNotification(`${response.data?.validated || this.selectedAuthorizations.length} accord(s) validé(s) avec succès`, 'success');
                    this.selectedAuthorizations = [];
                    this.updateBulkActions();
                    await this.loadAuthorizations();
                } else {
                    this.showNotification('Erreur lors de la validation en masse: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la validation en masse:', error);
                this.showNotification('Erreur lors de la validation en masse', 'error');
            }
        },
        
        async bulkDelete() {
            if (this.selectedAuthorizations.length === 0) return;
            
            // Filtrer les autorisations validées
            const selectedAuths = this.authorizations.filter(auth => this.selectedAuthorizations.includes(auth.id));
            const validatedAuths = selectedAuths.filter(auth => auth.isValidated);
            const deletableAuths = selectedAuths.filter(auth => !auth.isValidated);
            
            if (validatedAuths.length > 0) {
                this.showNotification(`${validatedAuths.length} autorisation(s) validée(s) ne peuvent pas être supprimées. Seules ${deletableAuths.length} autorisation(s) seront supprimées.`, 'warning');
            }
            
            if (deletableAuths.length === 0) {
                this.showNotification('Aucune autorisation ne peut être supprimée (toutes sont validées)', 'error');
                return;
            }
            
            const confirmed = await this.confirmAction(`Supprimer ${deletableAuths.length} accord(s) ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request('/intervention-work-authorizations/bulk-delete', {
                    method: 'POST',
                    body: JSON.stringify({
                        ids: deletableAuths.map(auth => auth.id)
                    })
                });
                
                if (response.success) {
                    this.showNotification(`${response.data?.deleted || deletableAuths.length} accord(s) supprimé(s) avec succès`, 'success');
                    this.selectedAuthorizations = [];
                    this.updateBulkActions();
                    await this.loadAuthorizations();
                } else {
                    this.showNotification('Erreur lors de la suppression en masse: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression en masse:', error);
                this.showNotification('Erreur lors de la suppression en masse', 'error');
            }
        },
        
        createAuthorization() {
            window.location.href = '/intervention-work-authorization-create.html';
        },
        
        showNotification(message, type = 'info') {
            if (window.notificationService && window.notificationService.show) {
                window.notificationService.show(message, type);
            } else {
                // Fallback vers alert si le service n'est pas disponible
                alert(message);
            }
        },

        async confirmAction(message) {
            try {
                if (window.notificationService && typeof window.notificationService.confirm === 'function') {
                    const result = await window.notificationService.confirm(message);
                    return !!result;
                }
            } catch (e) {
                // ignore and fallback
            }
            return window.confirm(message);
        }
    }
};

// Exposer le composant globalement
window.InterventionWorkAuthorizationsList = InterventionWorkAuthorizationsList;
