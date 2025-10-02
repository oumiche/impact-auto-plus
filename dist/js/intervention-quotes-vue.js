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
            selectedQuotes: [],
            showBulkActions: false,
            pagination: {
            currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 20
            }
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
            
            // Filtre par date
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
        }
    },
    
    async mounted() {
        await this.loadQuotes();
    },
    
    methods: {
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
            const confirmed = await window.notificationService.confirm(
                `Êtes-vous sûr de vouloir supprimer le devis "${quote.quoteNumber}" ?`,
                'Supprimer le devis',
                'delete'
            );
            
            if (!confirmed) return;
            
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
            const confirmed = await window.notificationService.confirm(
                `Approuver le devis "${quote.quoteNumber}" pour un montant de ${quote.totalAmount} € ?`,
                'Approuver le devis',
                'success'
            );
            
            if (!confirmed) return;
            
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
                this.showNotification('Erreur lors de l\'approbation du devis', 'error');
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
                style: 'currency',
                currency: 'EUR'
            }).format(parseFloat(amount));
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
        
        clearFilters() {
            this.searchQuery = '';
            this.statusFilter = 'all';
            this.dateFilter = 'all';
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
        
        async bulkApprove() {
            if (this.selectedQuotes.length === 0) return;
            
            const confirmed = await window.notificationService.confirm(
                `Approuver ${this.selectedQuotes.length} devis sélectionnés ?`,
                'Approuver en masse',
                'success'
            );
            
            if (!confirmed) return;
            
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
                this.showNotification('Erreur lors de l\'approbation en masse', 'error');
            }
        },
        
        showNotification(message, type = 'info') {
            if (window.notificationService) {
                window.notificationService.show(message, type);
            } else {
                alert(message);
            }
        }
    },
    
    template: `
        <div class="intervention-quotes-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-secondary" @click="window.history.back()">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
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

            <!-- Filtres et recherche -->
            <div class="filters-section">
                <div class="search-bar">
                    <div class="search-input-container">
                        <i class="fas fa-search"></i>
                        <input 
                            type="text" 
                            v-model="searchQuery"
                            placeholder="Rechercher par numéro, intervention, véhicule..."
                            class="search-input"
                        >
                    </div>
                    <button class="btn btn-outline" @click="toggleFilters">
                        <i class="fas fa-filter"></i>
                        Filtres
                    </button>
                </div>
                
                <div v-if="showFilters" class="filters-panel">
                    <div class="filter-group">
                        <label>Statut :</label>
                        <select v-model="statusFilter" class="filter-select">
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Période :</label>
                        <select v-model="dateFilter" class="filter-select">
                            <option v-for="option in dateOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <button class="btn btn-outline btn-sm" @click="clearFilters">
                        <i class="fas fa-times"></i>
                        Effacer
                    </button>
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
                    <button class="btn btn-primary" @click="goToCreate">
                        <i class="fas fa-plus"></i>
                        Créer un devis
                    </button>
                </div>
                
                <div v-else class="quotes-grid">
                    <div v-for="quote in filteredQuotes" :key="quote.id" class="quote-card">
                        <!-- En-tête de la carte -->
                        <div class="quote-header">
                            <div class="quote-number">
                                <input 
                                    type="checkbox" 
                                    :checked="selectedQuotes.some(q => q.id === quote.id)"
                                    @change="toggleQuoteSelection(quote)"
                                    class="quote-checkbox"
                                >
                                <span class="number">{{ quote.quoteNumber }}</span>
                            </div>
                            <div class="quote-status">
                                <span class="status-badge" :class="getStatusClass(quote)">
                                    {{ getStatusLabel(quote) }}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Informations principales -->
                        <div class="quote-content">
                            <div class="quote-info">
                                <div class="info-row">
                                    <i class="fas fa-car"></i>
                                    <span>{{ quote.vehicle.brand }} {{ quote.vehicle.model }} ({{ quote.vehicle.plateNumber }})</span>
                                </div>
                                <div class="info-row">
                                    <i class="fas fa-wrench"></i>
                                    <span>{{ quote.interventionCode }}</span>
                                </div>
                                <div class="info-row">
                                    <i class="fas fa-calendar"></i>
                                    <span>Créé le {{ formatDate(quote.createdAt) }}</span>
                                </div>
                                <div v-if="quote.validUntil" class="info-row">
                                    <i class="fas fa-clock" :class="getExpiryClass(quote)"></i>
                                    <span :class="getExpiryClass(quote)">
                                        {{ quote.isExpired ? 'Expiré' : 'Expire dans ' + quote.daysUntilExpiry + ' jours' }}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="quote-amounts">
                                <div class="amount-total">
                                    {{ formatAmount(quote.totalAmount) }}
                                </div>
                                <div v-if="quote.laborCost" class="amount-detail">
                                    Main d'œuvre: {{ formatAmount(quote.laborCost) }}
                                </div>
                                <div v-if="quote.partsCost" class="amount-detail">
                                    Pièces: {{ formatAmount(quote.partsCost) }}
                                </div>
                                <div v-if="quote.taxAmount" class="amount-detail">
                                    Taxes: {{ formatAmount(quote.taxAmount) }}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="quote-actions">
                            <button class="btn btn-outline btn-sm" @click="goToView(quote)" title="Voir">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline btn-sm" @click="goToEdit(quote)" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button 
                                v-if="!quote.isApproved" 
                                class="btn btn-success btn-sm" 
                                @click="approveQuote(quote)" 
                                title="Approuver"
                            >
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" @click="deleteQuote(quote)" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Rendre le composant globalement disponible
window.InterventionQuotesList = InterventionQuotesList;