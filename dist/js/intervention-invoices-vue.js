/**
 * Composant Vue.js pour la gestion des factures d'intervention
 */
const InterventionInvoicesList = {
    name: 'InterventionInvoicesList',
    
    template: `
        <div class="intervention-invoices-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-secondary" @click="window.history.back()">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1><i class="fas fa-file-invoice-dollar"></i> Gestion des Factures</h1>
                            <p>Gérer et suivre les factures d'intervention</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="goToCreate">
                            <i class="fas fa-plus"></i>
                            Nouvelle Facture
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
                    
                    <!-- Période personnalisée -->
                    <div class="filter-section">
                        <label class="form-label">Période personnalisée</label>
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
                    
                    <!-- Filtre par statut -->
                    <div class="filter-section">
                        <label class="form-label">Statut</label>
                        <select v-model="statusFilter" class="form-control">
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    
                    <!-- Filtre par période prédéfinie -->
                    <div class="filter-section">
                        <label class="form-label">Période prédéfinie</label>
                        <select v-model="dateFilter" class="form-control">
                            <option v-for="option in dateOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
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

            <!-- Actions en masse -->
            <div v-if="showBulkActions && selectedInvoices.length > 0" class="bulk-actions">
                <div class="bulk-info">
                    <i class="fas fa-check-circle"></i>
                    {{ selectedInvoices.length }} facture(s) sélectionnée(s)
                </div>
                <div class="bulk-buttons">
                    <button class="btn btn-success btn-sm" @click="markSelectedAsPaid">
                        <i class="fas fa-check"></i>
                        Marquer comme payées
                    </button>
                    <button class="btn btn-outline btn-sm" @click="selectedInvoices = []; showBulkActions = false">
                        <i class="fas fa-times"></i>
                        Annuler
                    </button>
                </div>
            </div>

            <!-- Liste des factures -->
            <div class="invoices-list">
                <div v-if="loading" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des factures...
                </div>
                
                <div v-else-if="filteredInvoices.length === 0" class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h3>Aucune facture trouvée</h3>
                    <p>Commencez par créer votre première facture</p>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input 
                                        type="checkbox" 
                                        :checked="selectAll"
                                        @change="toggleSelectAll"
                                        class="select-all-checkbox"
                                    >
                                </th>
                                <th>Numéro & Intervention</th>
                                <th>Véhicule</th>
                                <th>Statut</th>
                                <th>Montant</th>
                                <th>Date facture</th>
                                <th>Date réception</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="invoice in filteredInvoices" :key="invoice.id" class="invoice-row">
                                <td class="checkbox-cell">
                                    <input 
                                        type="checkbox" 
                                        :checked="selectedInvoices.includes(invoice.id)"
                                        @change="toggleInvoiceSelection(invoice.id)"
                                        class="invoice-checkbox"
                                    >
                                </td>
                                <td class="invoice-number-cell">
                                    <div class="invoice-number-info">
                                        <div class="invoice-number-line">
                                            <code class="entity-code">{{ invoice.invoiceNumber }}</code>
                                        </div>
                                        <div class="intervention-number-line">
                                            <span class="intervention-code">{{ invoice.intervention?.interventionNumber || 'N/A' }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="vehicle-cell">
                                    <div class="vehicle-info">
                                        <div class="vehicle-details">
                                            {{ invoice.intervention?.vehicle?.brand || 'N/A' }} {{ invoice.intervention?.vehicle?.model || 'N/A' }}
                                        </div>
                                        <div class="vehicle-plate">{{ invoice.intervention?.vehicle?.plateNumber || 'N/A' }}</div>
                                    </div>
                                </td>
                                <td class="status-cell">
                                    <span class="status-badge" :class="getStatusClass(invoice)">
                                        {{ getStatusLabel(invoice) }}
                                    </span>
                                </td>
                                <td class="amount-cell">
                                    <div class="amount-total">{{ formatAmount(invoice.totalAmount) }}</div>
                                    <div v-if="invoice.laborCost || invoice.partsCost" class="amount-details">
                                        <div v-if="invoice.laborCost" class="amount-detail">MO: {{ formatAmount(invoice.laborCost) }}</div>
                                        <div v-if="invoice.partsCost" class="amount-detail">Pièces: {{ formatAmount(invoice.partsCost) }}</div>
                                    </div>
                                </td>
                                <td class="date-cell">
                                    {{ formatDate(invoice.invoiceDate) }}
                                </td>
                                <td class="reception-date-cell">
                                    <div v-if="invoice.receivedDate">
                                        {{ formatDate(invoice.receivedDate) }}
                                    </div>
                                    <span v-else class="no-reception-date">-</span>
                                </td>
                                <td class="actions-cell">
                                    <div class="table-actions">
                                        <button 
                                            class="btn btn-outline" 
                                            @click="goToEdit(invoice)" 
                                            title="Modifier"
                                        >
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            v-if="invoice.status !== 'paid'"
                                            class="btn btn-success" 
                                            @click="markSingleAsPaid(invoice)" 
                                            title="Marquer comme payée"
                                        >
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button 
                                            class="btn btn-danger" 
                                            @click="deleteInvoice(invoice.id)" 
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
                    ({{ pagination.totalItems }} factures)
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
            // Data
            invoices: [],
            loading: false,
            searchQuery: '',
            statusFilter: 'all',
            dateFilter: 'all',
            showFilters: false,
            showFiltersPanel: false,
            selectedInvoices: [],
            showBulkActions: false,
            currency: 'F CFA', // Devise par défaut
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10
            },
            
            // Search debounce
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
        filteredInvoices() {
            let filtered = this.invoices;
            
            // Filtre par recherche
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(invoice => 
                    invoice.invoiceNumber?.toLowerCase().includes(query) ||
                    invoice.intervention?.interventionNumber?.toLowerCase().includes(query) ||
                    invoice.intervention?.vehicle?.plateNumber?.toLowerCase().includes(query) ||
                    invoice.intervention?.vehicle?.brand?.toLowerCase().includes(query) ||
                    invoice.intervention?.vehicle?.model?.toLowerCase().includes(query)
                );
            }
            
            // Filtre par marque
            if (this.selectedFilterBrand) {
                filtered = filtered.filter(invoice => 
                    invoice.intervention?.vehicle?.brand?.toLowerCase() === this.selectedFilterBrand.name.toLowerCase()
                );
            }
            
            // Filtre par modèle
            if (this.selectedFilterModel) {
                filtered = filtered.filter(invoice => 
                    invoice.intervention?.vehicle?.model?.toLowerCase() === this.selectedFilterModel.name.toLowerCase()
                );
            }
            
            // Filtre par période personnalisée
            if (this.dateStart || this.dateEnd) {
                filtered = filtered.filter(invoice => {
                    const invoiceDate = new Date(invoice.invoiceDate);
                    if (this.dateStart) {
                        const startDate = new Date(this.dateStart);
                        if (invoiceDate < startDate) return false;
                    }
                    if (this.dateEnd) {
                        const endDate = new Date(this.dateEnd);
                        endDate.setHours(23, 59, 59, 999);
                        if (invoiceDate > endDate) return false;
                    }
                    return true;
                });
            }
            
            // Filtre par statut
            if (this.statusFilter !== 'all') {
                filtered = filtered.filter(invoice => {
                    switch (this.statusFilter) {
                        case 'paid':
                            return invoice.status === 'paid';
                        case 'pending':
                            return invoice.status === 'pending';
                        case 'overdue':
                            return invoice.status === 'overdue';
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
                { value: 'paid', label: 'Payées' },
                { value: 'overdue', label: 'En retard' }
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
        },
        
        hasActiveFilters() {
            return this.searchQuery || this.statusFilter !== 'all' || this.dateFilter !== 'all';
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
            return this.filteredInvoices.length > 0 && this.selectedInvoices.length === this.filteredInvoices.length;
        }
    },
    
    async mounted() {
        await this.waitForApiService();
        this.loadInvoices();
        this.setupEventListeners();
        
        // Fermer les dropdowns quand on clique ailleurs
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
            
            console.log('ApiService disponible pour intervention-invoices');
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
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                // Le filtrage se fait déjà via le computed filteredInvoices
            }, 300);
        },
        
        clearFilters() {
            this.searchQuery = '';
            this.statusFilter = 'all';
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
                this.showFilterBrandSearch = false;
                this.showFilterModelSearch = false;
            }
        },
        
        clearSelection() {
            this.selectedInvoices = [];
            this.showBulkActions = false;
        },
        
        toggleSelectAll() {
            if (this.selectAll) {
                // Désélectionner toutes les factures
                this.selectedInvoices = [];
                this.showBulkActions = false;
            } else {
                // Sélectionner toutes les factures visibles
                this.selectedInvoices = this.filteredInvoices.map(invoice => invoice.id);
                this.showBulkActions = this.selectedInvoices.length > 0;
            }
        },
        
        toggleInvoiceSelection(invoiceId) {
            const index = this.selectedInvoices.indexOf(invoiceId);
            if (index > -1) {
                this.selectedInvoices.splice(index, 1);
            } else {
                this.selectedInvoices.push(invoiceId);
            }
            
            // Afficher/masquer les actions en masse
            this.showBulkActions = this.selectedInvoices.length > 0;
        },
        
        changePage(page) {
            if (page >= 1 && page <= this.pagination.totalPages) {
                this.pagination.currentPage = page;
                this.loadInvoices();
            }
        },
        
        goToCreate() {
            window.location.href = '/intervention-invoice-create.html';
        },
        
        goToEdit(invoice) {
            window.location.href = `/intervention-invoice-edit.html?id=${invoice.id}`;
        },
        
        async markSingleAsPaid(invoice) {
            try {
                const confirmed = await window.confirmSuccess({
                    title: 'Marquer comme payée',
                    message: `Marquer la facture ${invoice.invoiceNumber} comme payée ?`,
                    confirmText: 'Marquer comme payée',
                    cancelText: 'Annuler'
                });
                
                if (!confirmed) return;
                
                const response = await window.apiService.request(`/intervention-invoices/${invoice.id}/mark-paid`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showNotification('Facture marquée comme payée', 'success');
                    this.loadInvoices();
                } else {
                    this.showNotification('Erreur lors du marquage: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du marquage:', error);
                this.showNotification('Erreur lors du marquage de la facture', 'error');
            }
        },
        
        getStatusClass(invoice) {
            switch (invoice.paymentStatus) {
                case 'paid':
                    return 'status-success';
                case 'pending':
                    return 'status-warning';
                case 'overdue':
                    return 'status-danger';
                default:
                    return 'status-info';
            }
        },
        
        getStatusLabel(invoice) {
            switch (invoice.paymentStatus) {
                case 'paid':
                    return 'Payée';
                case 'pending':
                    return 'En attente';
                case 'overdue':
                    return 'En retard';
                default:
                    return 'Inconnu';
            }
        },

        // Data loading
        async loadInvoices() {
            try {
                this.loading = true;
                
                const params = new URLSearchParams({
                    page: this.pagination.currentPage,
                    limit: this.pagination.itemsPerPage,
                    search: this.searchQuery,
                    status: this.statusFilter,
                    dateFilter: this.dateFilter
                });
                
                const response = await window.apiService.request(`/intervention-invoices?${params}`);
                
                if (response.success) {
                    this.invoices = response.data;
                    this.pagination = {
                        currentPage: response.pagination.currentPage,
                        totalPages: response.pagination.totalPages,
                        totalItems: response.pagination.totalItems,
                        itemsPerPage: response.pagination.itemsPerPage || 10
                    };
                } else {
                    this.showNotification('Erreur lors du chargement des factures', 'error');
                }
            } catch (error) {
                console.error('Error loading invoices:', error);
                this.showNotification('Erreur lors du chargement des factures', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // Filtering and search
        debounceSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadInvoices();
            }, 500);
        },
        
        applyFilters() {
            this.closeFiltersPanel();
            this.currentPage = 1;
            this.loadInvoices();
        },
        
        clearFilters() {
            this.searchQuery = '';
            this.selectedStatus = '';
            this.sortBy = 'invoiceDate';
            this.sortOrder = 'DESC';
            this.currentPage = 1;
            this.loadInvoices();
        },
        
        
        // Navigation
        createInvoice() {
            window.location.href = 'intervention-invoice-create.html';
        },
        
        viewInvoice(id) {
            window.location.href = `intervention-invoice-view.html?id=${id}`;
        },
        
        editInvoice(id) {
            window.location.href = `intervention-invoice-edit.html?id=${id}`;
        },
        
        // Invoice actions
        async markAsPaid(id) {
            try {
                const paymentMethod = prompt('Méthode de paiement (optionnel):');
                const data = paymentMethod ? { paymentMethod } : {};
                
                const response = await window.apiService.request(`/intervention-invoices/${id}/mark-paid`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                if (response.success) {
                    this.showNotification('Facture marquée comme payée', 'success');
                    this.loadInvoices();
                } else {
                    this.showNotification(response.message || 'Erreur lors du marquage', 'error');
                }
            } catch (error) {
                console.error('Error marking invoice as paid:', error);
                this.showNotification('Erreur lors du marquage', 'error');
            }
        },
        
        async markSelectedAsPaid() {
            if (this.selectedInvoices.length === 0) {
                this.showNotification('Aucune facture sélectionnée', 'warning');
                return;
            }
            
            const confirmed = await window.confirmSuccess({
                title: 'Marquer comme payées',
                message: `Marquer ${this.selectedInvoices.length} facture(s) comme payée(s) ?`,
                confirmText: 'Marquer comme payées',
                cancelText: 'Annuler'
            });
            if (!confirmed) return;
            
            try {
                const paymentMethod = prompt('Méthode de paiement (optionnel):');
                const data = paymentMethod ? { paymentMethod } : {};
                
                let successCount = 0;
                let errorCount = 0;
                
                for (const invoiceId of this.selectedInvoices) {
                    try {
                        const response = await window.apiService.request(`/intervention-invoices/${invoiceId}/mark-paid`, {
                            method: 'POST',
                            body: JSON.stringify(data)
                        });
                        
                        if (response.success) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    } catch (error) {
                        errorCount++;
                    }
                }
                
                if (successCount > 0) {
                    this.showNotification(`${successCount} facture(s) marquée(s) comme payée(s)`, 'success');
                }
                if (errorCount > 0) {
                    this.showNotification(`${errorCount} facture(s) n'ont pas pu être mises à jour`, 'error');
                }
                
                this.clearSelection();
                this.loadInvoices();
            } catch (error) {
                console.error('Error marking selected invoices as paid:', error);
                this.showNotification('Erreur lors du marquage en lot', 'error');
            }
        },
        
        async deleteInvoice(id) {
            const invoice = this.invoices.find(i => i.id === id);
            if (!invoice) return;
            
            const confirmed = await window.confirmDestructive({
                title: 'Supprimer la facture',
                message: `Supprimer la facture ${invoice.invoiceNumber} ?`,
                confirmText: 'Supprimer',
                cancelText: 'Annuler'
            });
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-invoices/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('Facture supprimée avec succès', 'success');
                    this.loadInvoices();
                } else {
                    this.showNotification(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting invoice:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },
        
        async generatePdf(id) {
            try {
                const response = await window.apiService.request(`/intervention-invoices/${id}/pdf`);
                
                if (response.success) {
                    // TODO: Implémenter le téléchargement du PDF
                    this.showNotification('Génération de PDF à implémenter', 'info');
                } else {
                    this.showNotification(response.message || 'Erreur lors de la génération du PDF', 'error');
                }
            } catch (error) {
                console.error('Error generating PDF:', error);
                this.showNotification('Erreur lors de la génération du PDF', 'error');
            }
        },
        
        async exportSelectedInvoices() {
            if (this.selectedInvoices.length === 0) {
                this.showNotification('Aucune facture sélectionnée', 'warning');
                return;
            }
            
            try {
                // TODO: Implémenter l'export
                this.showNotification('Export à implémenter', 'info');
            } catch (error) {
                console.error('Error exporting invoices:', error);
                this.showNotification('Erreur lors de l\'export', 'error');
            }
        },
        
        // Utility methods
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        formatCurrency(amount) {
            if (!amount) return '0,00 €';
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount);
        },
        
        formatAmount(amount) {
            if (!amount) return `0,00 ${this.currency}`;
            return new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount) + ` ${this.currency}`;
        },
        
        getPaymentStatusClass(status) {
            const statusClasses = {
                'pending': 'status-pending',
                'paid': 'status-paid',
                'overdue': 'status-overdue'
            };
            return statusClasses[status] || 'status-unknown';
        },
        
        getPaymentStatusLabel(status) {
            const statusLabels = {
                'pending': 'En attente',
                'paid': 'Payé',
                'overdue': 'En retard'
            };
            return statusLabels[status] || status;
        },
        
        isOverdue(dueDate) {
            if (!dueDate) return false;
            const due = new Date(dueDate);
            const today = new Date();
            return due < today;
        },
        
        // Event listeners
        setupEventListeners() {
            // Listen for invoice updates from other pages
            window.addEventListener('invoiceUpdated', () => {
                this.loadInvoices();
            });
            
            // Listen for invoice creation from other pages
            window.addEventListener('invoiceCreated', () => {
                this.loadInvoices();
            });
        }
    },
    
    watch: {
        
        searchQuery(newValue) {
            // Debounce search
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            this.searchTimeout = setTimeout(() => {
                this.pagination.currentPage = 1;
                this.loadInvoices();
            }, 300);
        },
        
        statusFilter() {
            this.pagination.currentPage = 1;
            this.loadInvoices();
        },
        
        dateFilter() {
            this.pagination.currentPage = 1;
            this.loadInvoices();
        }
    }
};

// Exposer le composant globalement
window.InterventionInvoicesList = InterventionInvoicesList;