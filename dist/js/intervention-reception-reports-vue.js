/**
 * Composant Vue.js pour la gestion des rapports de réception d'intervention
 */
const InterventionReceptionReportsList = {
    name: 'InterventionReceptionReportsList',
    
    template: `
        <div class="intervention-reception-reports-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-secondary" @click="window.history.back()">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1><i class="fas fa-clipboard-check"></i> Rapports de Réception</h1>
                            <p>Gérer et suivre les rapports de réception des véhicules</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="goToCreate">
                            <i class="fas fa-plus"></i>
                            Nouveau Rapport
                        </button>
                    </div>
                </div>
            </div>

            <!-- Barre de recherche simple et bouton filtres -->
            <div style="display: flex; gap: 12px; margin-bottom: 24px; align-items: center;">
                <div class="search-bar-container" style="flex: 1;">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" class="form-control" v-model="searchQuery" @input="debouncedSearch"
                        placeholder="Rechercher par intervention, véhicule, marque, modèle...">
                </div>
                <button class="btn btn-outline" @click="toggleFiltersPanel" style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    <i class="fas fa-filter"></i> Filtres
                    <span v-if="activeFiltersCount > 0" class="badge-count">{{ activeFiltersCount }}</span>
                </button>
            </div>

            <!-- Panneau de filtres latéral -->
            <div v-if="showFiltersPanel" class="filters-overlay" @click="closeFiltersPanel"></div>
            <div class="filters-panel" :class="{ 'filters-panel-open': showFiltersPanel }">
                <div class="filters-panel-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;"><i class="fas fa-filter"></i> Filtres Avancés</h3>
                    <button class="btn-icon" @click="closeFiltersPanel"><i class="fas fa-times"></i></button>
                </div>
                <div class="filters-panel-body">
                    <div class="filter-section">
                        <label class="form-label">Marque</label>
                        <div style="position: relative;">
                            <input type="text" class="form-control" v-model="filterBrandSearchTerm" @focus="onFilterBrandFocus" @input="searchFilterBrands"
                                :placeholder="selectedFilterBrand ? selectedFilterBrand.name : 'Rechercher une marque...'" autocomplete="off">
                            <button v-if="selectedFilterBrand" type="button" @click="clearFilterBrandSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;">
                                <i class="fas fa-times"></i></button>
                            <div v-if="showFilterBrandSearch" class="dropdown-menu" style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterBrands" style="padding: 20px; text-align: center; color: #6c757d;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>
                                <div v-else-if="availableFilterBrands.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;"><i class="fas fa-search"></i> Aucune marque trouvée</div>
                                <div v-else>
                                    <div v-if="filterBrandSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;"><i class="fas fa-star"></i> MARQUES POPULAIRES</div>
                                    <div v-for="brand in availableFilterBrands" :key="brand.id" @click="selectFilterBrand(brand)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;" @mouseover="$event.target.style.background='#f8f9fa'" @mouseout="$event.target.style.background='white'">
                                        <div style="font-weight: 600;">{{ brand.name }}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="filter-section">
                        <label class="form-label">Modèle</label>
                        <div style="position: relative;">
                            <input type="text" class="form-control" v-model="filterModelSearchTerm" @focus="onFilterModelFocus" @input="searchFilterModels"
                                :placeholder="selectedFilterModel ? selectedFilterModel.name : 'Rechercher un modèle...'" :disabled="!selectedFilterBrand" autocomplete="off">
                            <button v-if="selectedFilterModel" type="button" @click="clearFilterModelSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;">
                                <i class="fas fa-times"></i></button>
                            <div v-if="showFilterModelSearch" class="dropdown-menu" style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterModels" style="padding: 20px; text-align: center; color: #6c757d;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>
                                <div v-else-if="availableFilterModels.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;"><i class="fas fa-search"></i> Aucun modèle trouvé</div>
                                <div v-else>
                                    <div v-if="filterModelSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;"><i class="fas fa-star"></i> MODÈLES POPULAIRES</div>
                                    <div v-for="model in availableFilterModels" :key="model.id" @click="selectFilterModel(model)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;" @mouseover="$event.target.style.background='#f8f9fa'" @mouseout="$event.target.style.background='white'">
                                        <div style="font-weight: 600;">{{ model.name }}</div></div>
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
                        <label class="form-label">Satisfaction</label>
                        <select v-model="satisfactionFilter" class="form-control">
                            <option value="all">Toutes les satisfactions</option>
                            <option value="satisfied">Satisfait</option>
                            <option value="unsatisfied">Non satisfait</option>
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

            <!-- Liste des rapports -->
            <div class="reports-list">
                <div v-if="loading" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des rapports...
                </div>
                
                <div v-else-if="filteredReports.length === 0" class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <h3>Aucun rapport trouvé</h3>
                    <p>Commencez par créer votre premier rapport de réception</p>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Code & Intervention</th>
                                <th>Véhicule</th>
                                <th>Date réception</th>
                                <th>Satisfaction</th>
                                <th>Véhicule prêt</th>
                                <th>Suivi requis</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="report in filteredReports" :key="report.id" class="report-row">
                                <td class="report-number-cell">
                                    <div class="report-number-info">
                                        <div class="report-number-line">
                                            <code class="entity-code">{{ report.receptionNumber || report.code || 'RR-' + report.id }}</code>
                                        </div>
                                        <div class="intervention-number-line">
                                            <span class="intervention-code">{{ report.intervention?.code || report.intervention?.interventionNumber || 'N/A' }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="vehicle-cell">
                                    <div class="vehicle-info">
                                        <div class="vehicle-details">
                                            {{ report.intervention?.vehicle?.brand?.name || 'N/A' }} {{ report.intervention?.vehicle?.model?.name || 'N/A' }}
                                        </div>
                                        <div class="vehicle-plate">{{ report.intervention?.vehicle?.plateNumber || 'N/A' }}</div>
                                    </div>
                                </td>
                                <td class="date-cell">
                                    {{ formatDate(report.receptionDate) }}
                                </td>
                                <td class="satisfaction-cell">
                                    <span class="satisfaction-badge" :class="getSatisfactionClass(report.customerSatisfaction)">
                                        <i :class="getSatisfactionIcon(report.customerSatisfaction)"></i>
                                        {{ report.satisfactionLabel }}
                                    </span>
                                </td>
                                <td class="ready-cell">
                                    <span v-if="report.isVehicleReady" class="badge-success">
                                        <i class="fas fa-check-circle"></i> Oui
                                    </span>
                                    <span v-else class="badge-warning">
                                        <i class="fas fa-exclamation-circle"></i> Non
                                    </span>
                                </td>
                                <td class="followup-cell">
                                    <span v-if="report.requiresFollowUp" class="badge-danger">
                                        <i class="fas fa-flag"></i> Oui
                                    </span>
                                    <span v-else class="badge-info">
                                        <i class="fas fa-check"></i> Non
                                    </span>
                                </td>
                                <td class="actions-cell">
                                    <div class="table-actions">
                                        <button 
                                            class="btn btn-outline btn-sm" 
                                            @click="goToView(report)" 
                                            title="Voir"
                                        >
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button 
                                            class="btn btn-outline btn-sm" 
                                            @click="goToEdit(report)" 
                                            title="Modifier"
                                        >
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            class="btn btn-danger btn-sm" 
                                            @click="deleteReport(report.id)" 
                                            title="Supprimer"
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

            <!-- Pagination -->
            <div v-if="pagination.totalPages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    @click="changePage(pagination.currentPage - 1)"
                    :disabled="pagination.currentPage <= 1"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.currentPage }} sur {{ pagination.totalPages }}
                    ({{ pagination.totalItems }} rapports)
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
            reports: [],
            loading: false,
            searchQuery: '',
            satisfactionFilter: 'all',
            dateFilter: 'all',
            showFilters: false,
            showFiltersPanel: false,
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10
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
        }
    },
    
    computed: {
        filteredReports() {
            let filtered = this.reports;
            
            // Filtre par recherche
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(report => 
                    report.receptionNumber?.toLowerCase().includes(query) ||
                    report.code?.toLowerCase().includes(query) ||
                    report.intervention?.interventionNumber?.toLowerCase().includes(query) ||
                    report.intervention?.vehicle?.plateNumber?.toLowerCase().includes(query) ||
                    report.intervention?.vehicle?.brand?.name?.toLowerCase().includes(query) ||
                    report.intervention?.vehicle?.model?.name?.toLowerCase().includes(query)
                );
            }
            
            // Filtre par marque
            if (this.selectedFilterBrand) {
                filtered = filtered.filter(report => 
                    report.intervention?.vehicle?.brand?.name?.toLowerCase() === this.selectedFilterBrand.name.toLowerCase()
                );
            }
            
            // Filtre par modèle
            if (this.selectedFilterModel) {
                filtered = filtered.filter(report => 
                    report.intervention?.vehicle?.model?.name?.toLowerCase() === this.selectedFilterModel.name.toLowerCase()
                );
            }
            
            // Filtre par période personnalisée
            if (this.dateStart || this.dateEnd) {
                filtered = filtered.filter(report => {
                    const reportDate = new Date(report.receptionDate);
                    if (this.dateStart) {
                        const startDate = new Date(this.dateStart);
                        if (reportDate < startDate) return false;
                    }
                    if (this.dateEnd) {
                        const endDate = new Date(this.dateEnd);
                        endDate.setHours(23, 59, 59, 999);
                        if (reportDate > endDate) return false;
                    }
                    return true;
                });
            }
            
            // Filtre par satisfaction
            if (this.satisfactionFilter !== 'all') {
                filtered = filtered.filter(report => 
                    report.customerSatisfaction === this.satisfactionFilter
                );
            }
            
            // Filtre par période prédéfinie
            if (this.dateFilter !== 'all') {
                const now = new Date();
                filtered = filtered.filter(report => {
                    const reportDate = new Date(report.receptionDate);
                    const daysDiff = Math.floor((now - reportDate) / (1000 * 60 * 60 * 24));
                    switch (this.dateFilter) {
                        case 'today': return daysDiff === 0;
                        case 'week': return daysDiff <= 7;
                        case 'month': return daysDiff <= 30;
                        case 'quarter': return daysDiff <= 90;
                        default: return true;
                    }
                });
            }
            
            return filtered;
        },
        
        activeFiltersCount() {
            let count = 0;
            if (this.satisfactionFilter !== 'all') count++;
            if (this.dateFilter !== 'all') count++;
            if (this.selectedFilterBrand) count++;
            if (this.selectedFilterModel) count++;
            if (this.dateStart) count++;
            if (this.dateEnd) count++;
            return count;
        },
        
        satisfactionOptions() {
            return [
                { value: 'all', label: 'Toutes les satisfactions' },
                { value: 'excellent', label: 'Excellent' },
                { value: 'good', label: 'Bon' },
                { value: 'fair', label: 'Moyen' },
                { value: 'poor', label: 'Mauvais' }
            ];
        },
        
        dateOptions() {
            return [
                { value: 'all', label: 'Toutes les périodes' },
                { value: 'today', label: 'Aujourd\'hui' },
                { value: 'week', label: 'Cette semaine' },
                { value: 'month', label: 'Ce mois' },
                { value: 'quarter', label: 'Ce trimestre' }
            ];
        }
    },
    
    async mounted() {
        await this.waitForApiService();
        this.loadReports();
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    
    methods: {
        async waitForApiService() {
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window.apiService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.apiService) {
                console.error('ApiService non disponible après 5 secondes');
                throw new Error('ApiService non disponible');
            }
            
            console.log('ApiService disponible pour intervention-reception-reports');
        },
        
        // Méthodes de notification
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

        // UI Methods
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
            this.satisfactionFilter = 'all';
            this.dateFilter = 'all';
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
        
        changePage(page) {
            if (page >= 1 && page <= this.pagination.totalPages) {
                this.pagination.currentPage = page;
                this.loadReports();
            }
        },
        
        goToCreate() {
            window.location.href = '/intervention-reception-report-create.html';
        },
        
        goToView(report) {
            window.location.href = `/intervention-reception-report-view.html?id=${report.id}`;
        },
        
        goToEdit(report) {
            window.location.href = `/intervention-reception-report-edit.html?id=${report.id}`;
        },
        
        // Data loading
        async loadReports() {
            try {
                this.loading = true;
                
                const params = new URLSearchParams({
                    page: this.pagination.currentPage,
                    limit: this.pagination.itemsPerPage,
                    search: this.searchQuery
                });
                
                const response = await window.apiService.request(`/intervention-reception-reports?${params}`);
                
                if (response.success) {
                    this.reports = response.data;
                    this.pagination = {
                        currentPage: response.pagination.currentPage,
                        totalPages: response.pagination.totalPages,
                        totalItems: response.pagination.totalItems,
                        itemsPerPage: response.pagination.itemsPerPage || 10
                    };
                } else {
                    this.showNotification('Erreur lors du chargement des rapports', 'error');
                }
            } catch (error) {
                console.error('Error loading reception reports:', error);
                this.showNotification('Erreur lors du chargement des rapports', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async deleteReport(id) {
            const report = this.reports.find(r => r.id === id);
            if (!report) return;
            
            const confirmed = await window.confirmDestructive({
                title: 'Supprimer le rapport',
                message: `Supprimer le rapport de réception ${report.receptionNumber || report.code || 'RR-' + id} ?`,
                confirmText: 'Supprimer',
                cancelText: 'Annuler'
            });
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('Rapport supprimé avec succès', 'success');
                    this.loadReports();
                } else {
                    this.showNotification(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting report:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },
        
        // Utility methods
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        getSatisfactionClass(satisfaction) {
            const classes = {
                'excellent': 'satisfaction-excellent',
                'good': 'satisfaction-good',
                'fair': 'satisfaction-fair',
                'poor': 'satisfaction-poor'
            };
            return classes[satisfaction] || 'satisfaction-unknown';
        },
        
        getSatisfactionIcon(satisfaction) {
            const icons = {
                'excellent': 'fas fa-star',
                'good': 'fas fa-smile',
                'fair': 'fas fa-meh',
                'poor': 'fas fa-frown'
            };
            return icons[satisfaction] || 'fas fa-question';
        }
    },
    
    watch: {
        searchQuery(newValue) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            this.searchTimeout = setTimeout(() => {
                this.pagination.currentPage = 1;
                this.loadReports();
            }, 300);
        },
        
        satisfactionFilter() {
            this.pagination.currentPage = 1;
            this.loadReports();
        },
        
        dateFilter() {
            this.pagination.currentPage = 1;
            this.loadReports();
        }
    }
};

// Exposer le composant globalement
window.InterventionReceptionReportsList = InterventionReceptionReportsList;
