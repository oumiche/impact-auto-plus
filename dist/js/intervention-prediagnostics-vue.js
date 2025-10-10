const InterventionPrediagnosticsList = {
    name: 'InterventionPrediagnosticsList',
    
    template: `
        <div class="intervention-prediagnostic-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1 class="section-title">Gestion des Prédiagnostics</h1>
                            <p class="page-subtitle">Gérez les prédiagnostics de vos interventions</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="fas fa-plus"></i>
                            Nouveau Prédiagnostic
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
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher par véhicule, marque, modèle, intervention, expert..."
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
                    <!-- Filtre par intervention avec recherche -->
                    <div class="filter-section">
                        <label class="form-label">Intervention</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="filterInterventionSearchTerm"
                                @focus="onFilterInterventionFocus"
                                @input="searchFilterInterventions"
                                :placeholder="selectedFilterIntervention ? selectedFilterIntervention.title : 'Rechercher une intervention...'"
                                autocomplete="off"
                            >
                            <button 
                                v-if="selectedFilterIntervention" 
                                type="button"
                                @click="clearFilterInterventionSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                            
                            <!-- Dropdown Intervention -->
                            <div v-if="showFilterInterventionSearch" 
                                 class="dropdown-menu" 
                                 style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterInterventions" style="padding: 20px; text-align: center; color: #6c757d;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    Chargement...
                                </div>
                                <div v-else-if="availableFilterInterventions.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                    <i class="fas fa-search"></i>
                                    Aucune intervention trouvée
                                </div>
                                <div v-else>
                                    <div v-if="filterInterventionSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;">
                                        <i class="fas fa-star"></i> INTERVENTIONS RÉCENTES
                                    </div>
                                    <div 
                                        v-for="intervention in availableFilterInterventions" 
                                        :key="intervention.id"
                                        @click="selectFilterIntervention(intervention)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'"
                                        @mouseout="$event.target.style.background='white'"
                                    >
                                        <div style="font-weight: 600;">{{ intervention.title }}</div>
                                        <div style="font-size: 11px; color: #6c757d;">
                                            {{ intervention.vehicle.plateNumber }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filtre par marque -->
                    <div class="filter-section">
                        <label class="form-label">Marque</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="filterBrandSearchTerm"
                                @focus="onFilterBrandFocus"
                                @input="searchFilterBrands"
                                :placeholder="selectedFilterBrand ? selectedFilterBrand.name : 'Rechercher une marque...'"
                                autocomplete="off"
                            >
                            <button 
                                v-if="selectedFilterBrand" 
                                type="button"
                                @click="clearFilterBrandSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                            
                            <!-- Dropdown Brand -->
                            <div v-if="showFilterBrandSearch" 
                                 class="dropdown-menu" 
                                 style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterBrands" style="padding: 20px; text-align: center; color: #6c757d;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    Chargement...
                                </div>
                                <div v-else-if="availableFilterBrands.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                    <i class="fas fa-search"></i>
                                    Aucune marque trouvée
                                </div>
                                <div v-else>
                                    <div v-if="filterBrandSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;">
                                        <i class="fas fa-star"></i> MARQUES POPULAIRES
                                    </div>
                                    <div 
                                        v-for="brand in availableFilterBrands" 
                                        :key="brand.id"
                                        @click="selectFilterBrand(brand)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'"
                                        @mouseout="$event.target.style.background='white'"
                                    >
                                        <div style="font-weight: 600;">{{ brand.name }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filtre par modèle -->
                    <div class="filter-section">
                        <label class="form-label">Modèle</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="filterModelSearchTerm"
                                @focus="onFilterModelFocus"
                                @input="searchFilterModels"
                                :placeholder="selectedFilterModel ? selectedFilterModel.name : 'Rechercher un modèle...'"
                                :disabled="!selectedFilterBrand"
                                autocomplete="off"
                            >
                            <button 
                                v-if="selectedFilterModel" 
                                type="button"
                                @click="clearFilterModelSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                            
                            <!-- Dropdown Model -->
                            <div v-if="showFilterModelSearch" 
                                 class="dropdown-menu" 
                                 style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterModels" style="padding: 20px; text-align: center; color: #6c757d;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    Chargement...
                                </div>
                                <div v-else-if="availableFilterModels.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                    <i class="fas fa-search"></i>
                                    Aucun modèle trouvé
                                </div>
                                <div v-else>
                                    <div v-if="filterModelSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;">
                                        <i class="fas fa-star"></i> MODÈLES POPULAIRES
                                    </div>
                                    <div 
                                        v-for="model in availableFilterModels" 
                                        :key="model.id"
                                        @click="selectFilterModel(model)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'"
                                        @mouseout="$event.target.style.background='white'"
                                    >
                                        <div style="font-weight: 600;">{{ model.name }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <small v-if="!selectedFilterBrand" style="color: #6c757d; font-size: 12px; margin-top: 4px; display: block;">
                            Sélectionnez d'abord une marque
                        </small>
                    </div>
                    
                    <!-- Période -->
                    <div class="filter-section">
                        <label class="form-label">Période</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <label style="font-size: 12px; color: #6c757d; display: block; margin-bottom: 4px;">Date début</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    v-model="dateStart"
                                    :max="dateEnd || null"
                                >
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6c757d; display: block; margin-bottom: 4px;">Date fin</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    v-model="dateEnd"
                                    :min="dateStart || null"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Boutons d'action du panneau -->
                    <div class="filters-panel-actions">
                        <button class="btn btn-outline" @click="resetFilters">
                            <i class="fas fa-redo"></i>
                            Réinitialiser
                        </button>
                        <button class="btn btn-primary" @click="applyFilters">
                            <i class="fas fa-check"></i>
                            Appliquer
                        </button>
                    </div>
                </div>
            </div>

            <!-- Liste des prédiagnostics -->
            <div class="data-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement des prédiagnostics...</p>
                </div>
                
                <div v-else-if="prediagnostics.length === 0" class="no-data">
                    <i class="fas fa-clipboard-check"></i>
                    <h3>Aucun prédiagnostic trouvé</h3>
                    <p>Commencez par créer votre premier prédiagnostic.</p>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Intervention</th>
                                <th>Véhicule</th>
                                <th>Statut</th>
                                <th>Expert</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="prediagnostic in prediagnostics" :key="prediagnostic.id">
                                <td>
                                    <code v-if="prediagnostic.code" class="entity-code">{{ prediagnostic.code }}</code>
                                    <span v-else class="no-code">-</span>
                                </td>
                                <td>
                                    <div class="intervention-info">
                                        <div class="intervention-title">{{ prediagnostic.intervention.title }}</div>
                                    </div>
                                </td>
                                <td>
                                    <div class="vehicle-info">
                                        <div class="vehicle-plate">{{ prediagnostic.intervention.vehicle.plateNumber }}</div>
                                        <div class="vehicle-details">
                                            {{ prediagnostic.intervention.vehicle.brand?.name }} {{ prediagnostic.intervention.vehicle.model?.name }} ({{ prediagnostic.intervention.vehicle.year }})
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="status-container">
                                        <span class="status-badge" :class="getStatusClass(prediagnostic.intervention.currentStatus)">
                                            {{ prediagnostic.intervention.statusLabel }}
                                        </span>
                                        <span v-if="prediagnostic.intervention.currentStatus === 'prediagnostic_completed'" 
                                              class="prediagnostic-completed-badge" 
                                              title="Prédiagnostic terminé">
                                            <i class="fas fa-check-circle"></i>
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span v-if="prediagnostic.expertName">{{ prediagnostic.expertName }}</span>
                                    <span v-else class="text-muted">-</span>
                                </td>
                                <td>
                                    <div class="date-info">{{ formatDate(prediagnostic.prediagnosticDate) }}</div>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-outline" @click="editPrediagnostic(prediagnostic)" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            v-if="prediagnostic.intervention.currentStatus === 'in_prediagnostic'"
                                            class="btn btn-success" 
                                            @click="completePrediagnostic(prediagnostic)" 
                                            title="Marquer comme terminé"
                                        >
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-danger" @click="deletePrediagnostic(prediagnostic)" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination && pagination.totalPages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    @click="changePage(pagination.currentPage - 1)"
                    :disabled="pagination.currentPage <= 1"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.currentPage }} sur {{ pagination.totalPages }}
                    ({{ pagination.total }} prédiagnostics)
                </span>
                
                <button 
                    class="btn btn-outline" 
                    @click="changePage(pagination.currentPage + 1)"
                    :disabled="pagination.currentPage >= pagination.totalPages"
                >
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `,
    
    data() {
        return {
            prediagnostics: [],
            availableInterventions: [],
            loading: false,
            searchTerm: '',
            interventionFilter: '',
            showFiltersPanel: false,
            // Filtres avancés - Intervention
            filterInterventionSearchTerm: '',
            selectedFilterIntervention: null,
            availableFilterInterventions: [],
            showFilterInterventionSearch: false,
            loadingFilterInterventions: false,
            interventionSearchTimeout: null,
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
            dateEnd: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            searchTimeout: null
        };
    },
    
    computed: {
        activeFiltersCount() {
            let count = 0;
            if (this.selectedFilterIntervention) count++;
            if (this.selectedFilterBrand) count++;
            if (this.selectedFilterModel) count++;
            if (this.dateStart) count++;
            if (this.dateEnd) count++;
            return count;
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadPrediagnostics();
        await this.loadInterventions();
        
        // Fermer les dropdowns quand on clique ailleurs
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
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
        
        async loadPrediagnostics() {
            this.loading = true;
            try {
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    search: this.searchTerm
                });
                
                // Ajouter les filtres avancés
                if (this.selectedFilterIntervention) {
                    params.append('interventionId', this.selectedFilterIntervention.id);
                }
                if (this.selectedFilterBrand) {
                    params.append('brand', this.selectedFilterBrand.id);
                }
                if (this.selectedFilterModel) {
                    params.append('model', this.selectedFilterModel.id);
                }
                if (this.dateStart) {
                    params.append('startDate', this.dateStart);
                }
                if (this.dateEnd) {
                    params.append('endDate', this.dateEnd);
                }
                
                const response = await window.apiService.request(`/intervention-prediagnostics?${params.toString()}`);
                
                if (response.success) {
                    this.prediagnostics = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des prédiagnostics', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                this.showNotification('Erreur lors du chargement des prédiagnostics', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadInterventions() {
            try {
                const response = await window.apiService.request('/vehicle-interventions');
                if (response.success) {
                    this.availableInterventions = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadPrediagnostics();
            }, 500);
        },
        
        toggleFiltersPanel() {
            this.showFiltersPanel = !this.showFiltersPanel;
        },
        
        closeFiltersPanel() {
            this.showFiltersPanel = false;
        },
        
        applyFilters() {
            this.currentPage = 1;
            this.loadPrediagnostics();
            this.closeFiltersPanel();
        },
        
        resetFilters() {
            this.interventionFilter = '';
            this.selectedFilterIntervention = null;
            this.selectedFilterBrand = null;
            this.selectedFilterModel = null;
            this.filterInterventionSearchTerm = '';
            this.filterBrandSearchTerm = '';
            this.filterModelSearchTerm = '';
            this.dateStart = '';
            this.dateEnd = '';
            this.currentPage = 1;
            this.loadPrediagnostics();
        },
        
        // Méthodes pour le filtre Intervention
        async onFilterInterventionFocus() {
            this.showFilterInterventionSearch = true;
            if (this.filterInterventionSearchTerm.length === 0 && this.availableFilterInterventions.length === 0) {
                await this.loadTopInterventions();
            } else if (this.filterInterventionSearchTerm.length >= 2) {
                this.searchFilterInterventions();
            }
        },
        
        async loadTopInterventions() {
            this.loadingFilterInterventions = true;
            try {
                const params = new URLSearchParams({ limit: 5, page: 1 });
                const response = await window.apiService.request(`/vehicle-interventions?${params.toString()}`);
                if (response.success) {
                    this.availableFilterInterventions = response.data || [];
                    this.showFilterInterventionSearch = true;
                }
            } catch (error) {
                console.error('Erreur chargement interventions:', error);
            } finally {
                this.loadingFilterInterventions = false;
            }
        },
        
        async searchFilterInterventions() {
            clearTimeout(this.interventionSearchTimeout);
            
            if (this.filterInterventionSearchTerm.length === 0) {
                await this.loadTopInterventions();
                return;
            }
            
            if (this.filterInterventionSearchTerm.length < 2) {
                return;
            }
            
            this.interventionSearchTimeout = setTimeout(async () => {
                this.loadingFilterInterventions = true;
                try {
                    const params = new URLSearchParams({ 
                        search: this.filterInterventionSearchTerm, 
                        limit: 50,
                        page: 1
                    });
                    const response = await window.apiService.request(`/vehicle-interventions?${params.toString()}`);
                    if (response.success) {
                        this.availableFilterInterventions = response.data || [];
                        this.showFilterInterventionSearch = true;
                    }
                } catch (error) {
                    console.error('Erreur recherche interventions:', error);
                } finally {
                    this.loadingFilterInterventions = false;
                }
            }, 300);
        },
        
        selectFilterIntervention(intervention) {
            this.selectedFilterIntervention = intervention;
            this.filterInterventionSearchTerm = intervention.title;
            this.showFilterInterventionSearch = false;
            this.availableFilterInterventions = [];
        },
        
        clearFilterInterventionSelection() {
            this.selectedFilterIntervention = null;
            this.filterInterventionSearchTerm = '';
            this.showFilterInterventionSearch = false;
        },
        
        // Méthodes pour le filtre Marque
        async onFilterBrandFocus() {
            this.showFilterBrandSearch = true;
            if (this.filterBrandSearchTerm.length === 0 && this.availableFilterBrands.length === 0) {
                await this.loadTopBrands();
            } else if (this.filterBrandSearchTerm.length >= 2) {
                this.searchFilterBrands();
            }
        },
        
        async loadTopBrands() {
            this.loadingFilterBrands = true;
            try {
                const response = await window.apiService.getVehicleBrands('', 5);
                if (response.success) {
                    this.availableFilterBrands = response.data || [];
                    this.showFilterBrandSearch = true;
                }
            } catch (error) {
                console.error('Erreur chargement marques:', error);
            } finally {
                this.loadingFilterBrands = false;
            }
        },
        
        async searchFilterBrands() {
            clearTimeout(this.brandSearchTimeout);
            
            if (this.filterBrandSearchTerm.length === 0) {
                await this.loadTopBrands();
                return;
            }
            
            if (this.filterBrandSearchTerm.length < 2) {
                return;
            }
            
            this.brandSearchTimeout = setTimeout(async () => {
                this.loadingFilterBrands = true;
                try {
                    const response = await window.apiService.getVehicleBrands(this.filterBrandSearchTerm, 50);
                    if (response.success) {
                        this.availableFilterBrands = response.data || [];
                        this.showFilterBrandSearch = true;
                    }
                } catch (error) {
                    console.error('Erreur recherche marques:', error);
                } finally {
                    this.loadingFilterBrands = false;
                }
            }, 300);
        },
        
        selectFilterBrand(brand) {
            this.selectedFilterBrand = brand;
            this.filterBrandSearchTerm = brand.name;
            this.showFilterBrandSearch = false;
            this.availableFilterBrands = [];
            // Réinitialiser le modèle
            this.selectedFilterModel = null;
            this.filterModelSearchTerm = '';
        },
        
        clearFilterBrandSelection() {
            this.selectedFilterBrand = null;
            this.filterBrandSearchTerm = '';
            this.showFilterBrandSearch = false;
            // Réinitialiser le modèle
            this.selectedFilterModel = null;
            this.filterModelSearchTerm = '';
        },
        
        // Méthodes pour le filtre Modèle
        async onFilterModelFocus() {
            if (!this.selectedFilterBrand) return;
            this.showFilterModelSearch = true;
            if (this.filterModelSearchTerm.length === 0 && this.availableFilterModels.length === 0) {
                await this.loadTopModels();
            } else if (this.filterModelSearchTerm.length >= 2) {
                this.searchFilterModels();
            }
        },
        
        async loadTopModels() {
            if (!this.selectedFilterBrand) return;
            
            this.loadingFilterModels = true;
            try {
                const response = await window.apiService.getVehicleModels(
                    this.selectedFilterBrand.id,
                    '',
                    5
                );
                if (response.success) {
                    this.availableFilterModels = response.data || [];
                    this.showFilterModelSearch = true;
                }
            } catch (error) {
                console.error('Erreur chargement modèles:', error);
            } finally {
                this.loadingFilterModels = false;
            }
        },
        
        async searchFilterModels() {
            clearTimeout(this.modelSearchTimeout);
            
            if (!this.selectedFilterBrand) {
                this.availableFilterModels = [];
                this.showFilterModelSearch = false;
                return;
            }
            
            if (this.filterModelSearchTerm.length === 0) {
                await this.loadTopModels();
                return;
            }
            
            if (this.filterModelSearchTerm.length < 2) {
                return;
            }
            
            this.modelSearchTimeout = setTimeout(async () => {
                this.loadingFilterModels = true;
                try {
                    const response = await window.apiService.getVehicleModels(
                        this.selectedFilterBrand.id,
                        this.filterModelSearchTerm,
                        50
                    );
                    if (response.success) {
                        this.availableFilterModels = response.data || [];
                        this.showFilterModelSearch = true;
                    }
                } catch (error) {
                    console.error('Erreur recherche modèles:', error);
                } finally {
                    this.loadingFilterModels = false;
                }
            }, 300);
        },
        
        selectFilterModel(model) {
            this.selectedFilterModel = model;
            this.filterModelSearchTerm = model.name;
            this.showFilterModelSearch = false;
            this.availableFilterModels = [];
        },
        
        clearFilterModelSelection() {
            this.selectedFilterModel = null;
            this.filterModelSearchTerm = '';
            this.showFilterModelSearch = false;
        },
        
        handleClickOutside(event) {
            const target = event.target;
            if (!target.closest('.filter-section')) {
                this.showFilterInterventionSearch = false;
                this.showFilterBrandSearch = false;
                this.showFilterModelSearch = false;
            }
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadPrediagnostics();
        },
        
        openCreateModal() {
            window.location.href = '/intervention-prediagnostic-create.html';
        },
        
        editPrediagnostic(prediagnostic) {
            window.location.href = `/intervention-prediagnostic-edit.html?id=${prediagnostic.id}`;
        },
        
        async deletePrediagnostic(prediagnostic) {
            try {
                // Utiliser le système de confirmation centralisé
                const confirmed = await window.confirmDestructive({
                    title: 'Supprimer le prédiagnostic',
                    message: `Êtes-vous sûr de vouloir supprimer le prédiagnostic pour l'intervention "${prediagnostic.intervention.title}" ?`,
                    confirmText: 'Supprimer',
                    cancelText: 'Annuler'
                });

                if (!confirmed) {
                    return;
                }
            } catch (error) {
                console.error('Erreur lors de la confirmation:', error);
                this.showNotification('Erreur lors de la confirmation', 'error');
                return;
            }
            
            try {
                const response = await window.apiService.request(`/intervention-prediagnostics/${prediagnostic.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('Prédiagnostic supprimé avec succès', 'success');
                    this.loadPrediagnostics();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },
        
        getStatusClass(status) {
            const statusClasses = {
                'reported': 'status-reported',
                'in_prediagnostic': 'status-in-prediagnostic',
                'prediagnostic_completed': 'status-prediagnostic-completed',
                'in_quote': 'status-in-quote',
                'quote_received': 'status-quote-received',
                'in_approval': 'status-in-approval',
                'approved': 'status-approved',
                'in_repair': 'status-in-repair',
                'repair_completed': 'status-repair-completed',
                'in_reception': 'status-in-reception',
                'vehicle_received': 'status-vehicle-received',
                'cancelled': 'status-cancelled'
            };
            return statusClasses[status] || 'status-unknown';
        },
        
        async completePrediagnostic(prediagnostic) {
            try {
                // Utiliser le système de confirmation centralisé
                const confirmed = await window.confirmWarning({
                    title: 'Finaliser le prédiagnostic',
                    message: `Êtes-vous sûr de vouloir marquer le prédiagnostic pour l'intervention "${prediagnostic.intervention.title}" comme terminé ?`,
                    confirmText: 'Finaliser',
                    cancelText: 'Annuler'
                });

                if (!confirmed) {
                    return;
                }
            } catch (error) {
                console.error('Erreur lors de la confirmation:', error);
                this.showNotification('Erreur lors de la confirmation', 'error');
                return;
            }
            
            try {
                const response = await window.apiService.request(`/intervention-prediagnostics/${prediagnostic.id}/complete`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showNotification('Prédiagnostic marqué comme terminé avec succès', 'success');
                    // Recharger la liste pour mettre à jour les statuts
                    await this.loadPrediagnostics();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la finalisation:', error);
                this.showNotification('Erreur lors de la finalisation du prédiagnostic', 'error');
            }
        },
        
        // Méthodes de notification utilisant le système centralisé (comme vehicle-interventions)
        showNotification(message, type = 'info') {
            // Utiliser les mêmes méthodes que vehicle-interventions
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
        }
    }
};

// Exposer le composant globalement
window.InterventionPrediagnosticsList = InterventionPrediagnosticsList;
