/**
 * Composant Vue.js pour la gestion des devis
 */
const InterventionQuotesList = {
    name: 'InterventionQuotesList',
    
    data() {
        return {
            quotes: [],
            loading: false,
            searchQuery: '',
            statusFilter: 'all',
            dateFilter: 'all',
            showFilters: false,
            showFiltersPanel: false,
            selectedQuotes: [],
            showBulkActions: false,
            currency: 'F CFA', // Devise par défaut
            pagination: {
            currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 20
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
        filteredQuotes() {
            let filtered = this.quotes;
            
            // Filtre par recherche
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(quote => 
                    quote.quoteNumber.toLowerCase().includes(query) ||
                    quote.interventionCode.toLowerCase().includes(query) ||
                    quote.vehicle.brand.toLowerCase().includes(query) ||
                    quote.vehicle.model.toLowerCase().includes(query) ||
                    quote.vehicle.plateNumber.toLowerCase().includes(query)
                );
            }
            
            // Filtre par marque
            if (this.selectedFilterBrand) {
                filtered = filtered.filter(quote => 
                    quote.vehicle.brand.toLowerCase() === this.selectedFilterBrand.name.toLowerCase()
                );
            }
            
            // Filtre par modèle
            if (this.selectedFilterModel) {
                filtered = filtered.filter(quote => 
                    quote.vehicle.model.toLowerCase() === this.selectedFilterModel.name.toLowerCase()
                );
            }
            
            // Filtre par période personnalisée
            if (this.dateStart || this.dateEnd) {
                filtered = filtered.filter(quote => {
                    const quoteDate = new Date(quote.quoteDate);
                    if (this.dateStart) {
                        const startDate = new Date(this.dateStart);
                        if (quoteDate < startDate) return false;
                    }
                    if (this.dateEnd) {
                        const endDate = new Date(this.dateEnd);
                        endDate.setHours(23, 59, 59, 999);
                        if (quoteDate > endDate) return false;
                    }
                    return true;
                });
            }
            
            // Filtre par statut
            if (this.statusFilter !== 'all') {
                filtered = filtered.filter(quote => {
                    switch (this.statusFilter) {
                        case 'approved':
                            return quote.isApproved;
                        case 'pending':
                            return !quote.isApproved && !quote.isExpired;
                        case 'expired':
                            return quote.isExpired;
                        default:
                            return true;
                    }
                });
            }
            
            // Filtre par période prédéfinie
            if (this.dateFilter !== 'all') {
                const now = new Date();
                filtered = filtered.filter(quote => {
                    const quoteDate = new Date(quote.quoteDate);
                    const daysDiff = Math.floor((now - quoteDate) / (1000 * 60 * 60 * 24));
                    
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
                { value: 'approved', label: 'Approuvés' },
                { value: 'expired', label: 'Expirés' }
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
        
        activeFiltersCount() {
            let count = 0;
            if (this.statusFilter !== 'all') count++;
            if (this.dateFilter !== 'all') count++;
            if (this.selectedFilterBrand) count++;
            if (this.selectedFilterModel) count++;
            if (this.dateStart) count++;
            if (this.dateEnd) count++;
            return count;
        }
    },
    
    async mounted() {
        await this.waitForApiService();
        await this.loadCurrency();
        await this.loadQuotes();
        
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
            
            console.log('ApiService disponible pour intervention-quotes');
        },
        
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                console.log('=== CURRENCY API RESPONSE (QUOTES LIST) ===');
                console.log('Response:', response);
                console.log('Success:', response.success);
                console.log('Data:', response.data);
                console.log('Currency value:', response.data?.currency || response.data?.value);
                
                // Forcer F CFA au lieu de la valeur de la base de données
                this.currency = 'F CFA';
                
                console.log('Final currency set to:', this.currency);
                console.log('=== END CURRENCY LOG (QUOTES LIST) ===');
            } catch (error) {
                console.error('Erreur lors du chargement de la devise:', error);
                this.currency = 'F CFA'; // Fallback
                console.log('Currency fallback set to:', this.currency);
            }
        },
        
        async loadQuotes() {
            this.loading = true;
            try {
                const response = await window.apiService.request('/intervention-quotes');
                if (response.success) {
                    this.quotes = response.data;
                } else {
                    this.showNotification('Erreur lors du chargement des devis', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des devis:', error);
                this.showNotification('Erreur lors du chargement des devis', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async deleteQuote(quote) {
            // Vérifier que le devis n'est pas approuvé
            if (quote.isApproved) {
                this.showNotification('Ce devis est approuvé et ne peut plus être supprimé', 'warning');
                return;
            }
            
            try {
                // Utiliser le système de confirmation centralisé
                const confirmed = await window.confirmDestructive({
                    title: 'Supprimer le devis',
                    message: `Êtes-vous sûr de vouloir supprimer le devis "${quote.quoteNumber}" ?`,
                    confirmText: 'Supprimer',
                    cancelText: 'Annuler'
                });

                if (!confirmed) return;
            } catch (error) {
                console.error('Erreur lors de la confirmation:', error);
                this.showNotification('Erreur lors de la confirmation', 'error');
                return;
            }
            
            try {
                const response = await window.apiService.request(`/intervention-quotes/${quote.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('Devis supprimé avec succès', 'success');
                    await this.loadQuotes();
                } else {
                    this.showNotification('Erreur lors de la suppression: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression du devis', 'error');
            }
        },
        
        async approveQuote(quote) {
            try {
                // Utiliser le système de confirmation centralisé
                const confirmed = await window.confirmSuccess({
                    title: 'Approuver le devis',
                    message: `Approuver le devis "${quote.quoteNumber}" pour un montant de ${this.formatAmount(quote.totalAmount)} ?`,
                    confirmText: 'Approuver',
                    cancelText: 'Annuler'
                });

                if (!confirmed) return;
            } catch (error) {
                console.error('Erreur lors de la confirmation:', error);
                this.showNotification('Erreur lors de la confirmation', 'error');
                return;
            }
            
            try {
                const response = await window.apiService.request(`/intervention-quotes/${quote.id}/approve`, {
                    method: 'POST',
                    body: JSON.stringify({
                        approvedBy: 1 // TODO: Récupérer l'ID de l'utilisateur connecté
                    })
                });
                
                if (response.success) {
                    this.showNotification('Devis approuvé avec succès', 'success');
                    await this.loadQuotes();
                } else {
                    this.showNotification('Erreur lors de l\'approbation: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'approbation:', error);
                
                // Gestion d'erreur plus spécifique
                let errorMessage = 'Erreur lors de l\'approbation du devis';
                if (error.message && error.message.includes('EntityManager is closed')) {
                    errorMessage = 'Erreur serveur temporaire. Veuillez réessayer dans quelques instants.';
                } else if (error.message && error.message.includes('500')) {
                    errorMessage = 'Erreur serveur lors de l\'approbation. Veuillez contacter l\'administrateur.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                this.showNotification(errorMessage, 'error');
            }
        },
        
        getStatusClass(quote) {
            if (quote.isApproved) return 'status-approved';
            if (quote.isExpired) return 'status-expired';
            return 'status-pending';
        },
        
        getStatusLabel(quote) {
            if (quote.isApproved) return 'Approuvé';
            if (quote.isExpired) return 'Expiré';
            return 'En attente';
        },
        
        getExpiryClass(quote) {
            if (quote.isExpired) return 'expired';
            if (quote.daysUntilExpiry <= 3) return 'warning';
            if (quote.daysUntilExpiry <= 7) return 'info';
            return 'normal';
        },
        
        formatAmount(amount) {
            return new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(parseFloat(amount)) + ' ' + this.currency;
        },
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },
        
        formatDateTime(dateString) {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        goToCreate() {
            window.location.href = '/intervention-quote-create.html';
        },
        
        goToEdit(quote) {
            window.location.href = `/intervention-quote-edit.html?id=${quote.id}`;
        },
        
        goToView(quote) {
            window.location.href = `/intervention-quote-view.html?id=${quote.id}`;
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
            this.searchTimeout = setTimeout(() => {
                // Le filtrage se fait déjà via le computed filteredQuotes
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
        
        toggleQuoteSelection(quote) {
            const index = this.selectedQuotes.findIndex(q => q.id === quote.id);
            if (index > -1) {
                this.selectedQuotes.splice(index, 1);
            } else {
                this.selectedQuotes.push(quote);
            }
            this.showBulkActions = this.selectedQuotes.length > 0;
        },
        
        selectAllQuotes() {
            if (this.selectedQuotes.length === this.filteredQuotes.length) {
                this.selectedQuotes = [];
            } else {
                this.selectedQuotes = [...this.filteredQuotes];
            }
            this.showBulkActions = this.selectedQuotes.length > 0;
        },
        
        toggleAllQuotes() {
            this.selectAllQuotes();
        },
        
        async bulkApprove() {
            if (this.selectedQuotes.length === 0) return;
            
            try {
                // Utiliser le système de confirmation centralisé
                const confirmed = await window.confirmSuccess({
                    title: 'Approuver en masse',
                    message: `Approuver ${this.selectedQuotes.length} devis sélectionnés ?`,
                    confirmText: 'Approuver',
                    cancelText: 'Annuler'
                });

                if (!confirmed) return;
            } catch (error) {
                console.error('Erreur lors de la confirmation:', error);
                this.showNotification('Erreur lors de la confirmation', 'error');
                return;
            }
            
            try {
                const promises = this.selectedQuotes.map(quote => 
                    window.apiService.request(`/intervention-quotes/${quote.id}/approve`, {
                        method: 'POST',
                        body: JSON.stringify({ approvedBy: 1 })
                    })
                );
                
                await Promise.all(promises);
                this.showNotification(`${this.selectedQuotes.length} devis approuvés avec succès`, 'success');
                this.selectedQuotes = [];
                this.showBulkActions = false;
                await this.loadQuotes();
            } catch (error) {
                console.error('Erreur lors de l\'approbation en masse:', error);
                
                // Gestion d'erreur plus spécifique
                let errorMessage = 'Erreur lors de l\'approbation en masse';
                if (error.message && error.message.includes('EntityManager is closed')) {
                    errorMessage = 'Erreur serveur temporaire. Veuillez réessayer dans quelques instants.';
                } else if (error.message && error.message.includes('500')) {
                    errorMessage = 'Erreur serveur lors de l\'approbation en masse. Veuillez contacter l\'administrateur.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                this.showNotification(errorMessage, 'error');
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
    },
    
    template: `
        <div class="intervention-quotes-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1><i class="fas fa-file-invoice-dollar"></i> Gestion des Devis</h1>
                            <p>Créer, modifier et suivre les devis d'intervention</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="goToCreate">
                            <i class="fas fa-plus"></i>
                            Nouveau Devis
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
                            <option value="all">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="approved">Approuvés</option>
                            <option value="expired">Expirés</option>
                        </select>
                    </div>
                    
                    <!-- Filtre par période prédéfinie -->
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
            <div v-if="showBulkActions" class="bulk-actions">
                <div class="bulk-info">
                    <i class="fas fa-check-circle"></i>
                    {{ selectedQuotes.length }} devis sélectionné(s)
                </div>
                <div class="bulk-buttons">
                    <button class="btn btn-success btn-sm" @click="bulkApprove">
                        <i class="fas fa-check"></i>
                        Approuver
                    </button>
                    <button class="btn btn-outline btn-sm" @click="selectedQuotes = []; showBulkActions = false">
                        <i class="fas fa-times"></i>
                        Annuler
                    </button>
                </div>
            </div>

            <!-- Liste des devis -->
            <div class="quotes-list">
                <div v-if="loading" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des devis...
                </div>
                
                <div v-else-if="filteredQuotes.length === 0" class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h3>Aucun devis trouvé</h3>
                    <p>Commencez par créer votre premier devis</p>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input 
                                        type="checkbox" 
                                        :checked="selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0"
                                        @change="toggleAllQuotes"
                                        class="select-all-checkbox"
                                    >
                                </th>
                                <th>Numéro & Intervention</th>
                                <th>Véhicule</th>
                                <th>Statut</th>
                                <th>Montant</th>
                                <th>Date création</th>
                                <th>Date de réception</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="quote in filteredQuotes" :key="quote.id" class="quote-row">
                                <td class="checkbox-cell">
                                    <input 
                                        type="checkbox" 
                                        :checked="selectedQuotes.some(q => q.id === quote.id)"
                                        @change="toggleQuoteSelection(quote)"
                                        class="quote-checkbox"
                                    >
                                </td>
                                <td class="quote-number-cell">
                                    <div class="quote-number-info">
                                        <div class="quote-number-line">
                                            <code class="entity-code">{{ quote.quoteNumber }}</code>
                                            <span class="intervention-code">{{ quote.interventionCode }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="vehicle-cell">
                                    <div class="vehicle-info">
                                        <div class="vehicle-details">
                                            {{ quote.vehicle.brand?.name }} {{ quote.vehicle.model?.name }}
                                        </div>
                                        <div class="vehicle-plate">{{ quote.vehicle.plateNumber }}</div>
                                    </div>
                                </td>
                                <td class="status-cell">
                                    <span class="status-badge" :class="getStatusClass(quote)">
                                        {{ getStatusLabel(quote) }}
                                    </span>
                                </td>
                                <td class="amount-cell">
                                    <div class="amount-total">{{ formatAmount(quote.totalAmount) }}</div>
                                    <div v-if="quote.laborCost || quote.partsCost" class="amount-details">
                                        <div v-if="quote.laborCost" class="amount-detail">MO: {{ formatAmount(quote.laborCost) }}</div>
                                        <div v-if="quote.partsCost" class="amount-detail">Pièces: {{ formatAmount(quote.partsCost) }}</div>
                                    </div>
                                </td>
                                <td class="date-cell">
                                    {{ formatDate(quote.createdAt) }}
                                </td>
                                <td class="reception-date-cell">
                                    <div v-if="quote.receivedDate">
                                        {{ formatDate(quote.receivedDate) }}
                                    </div>
                                    <span v-else class="no-reception-date">-</span>
                                </td>
                                <td class="actions-cell">
                                    <div class="table-actions">
                                        <button 
                                            class="btn btn-outline" 
                                            @click="goToEdit(quote)" 
                                            title="Modifier"
                                        >
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            v-if="!quote.isApproved" 
                                            class="btn btn-success" 
                                            @click="approveQuote(quote)" 
                                            title="Approuver"
                                        >
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button 
                                            class="btn btn-danger" 
                                            :class="{ 'btn-disabled': quote.isApproved }"
                                            :disabled="quote.isApproved"
                                            @click="deleteQuote(quote)" 
                                            :title="quote.isApproved ? 'Devis approuvé - Suppression non autorisée' : 'Supprimer'"
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
    `
};

// Rendre le composant globalement disponible
window.InterventionQuotesList = InterventionQuotesList;