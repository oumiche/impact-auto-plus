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
                urgent: 0,
                expired: 0,
                active: 0
            }
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
            
            if (this.statusFilter !== 'all') {
                filtered = filtered.filter(auth => {
                    switch (this.statusFilter) {
                        case 'validated':
                            return auth.isValidated;
                        case 'pending':
                            return !auth.isValidated && !auth.isExpired;
                        case 'urgent':
                            return auth.isUrgent;
                        case 'expired':
                            return auth.isExpired;
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
                { value: 'validated', label: 'Validées' },
                { value: 'urgent', label: 'Urgentes' },
                { value: 'expired', label: 'Expirées' }
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
        }
    },
    
    async mounted() {
        await this.loadAuthorizations();
        await this.loadStatistics();
        this.loadSidebar();
    },
    
    methods: {
        async loadAuthorizations() {
            this.loading = true;
            try {
                const response = await window.apiService.request('/intervention-work-authorizations');
                if (response.success) {
                    this.authorizations = response.data;
                    this.updatePagination();
                } else {
                    window.notificationService.show('Erreur lors du chargement des autorisations', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des autorisations:', error);
                window.notificationService.show('Erreur lors du chargement des autorisations', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadStatistics() {
            try {
                const response = await window.apiService.request('/intervention-work-authorizations/statistics/overview');
                if (response.success) {
                    this.statistics = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
            }
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
        
        clearFilters() {
            this.searchQuery = '';
            this.statusFilter = 'all';
            this.dateFilter = 'all';
            this.pagination.currentPage = 1;
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        formatCurrency(amount) {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF'
            }).format(amount);
        },
        
        getStatusBadgeClass(auth) {
            if (auth.isValidated) return 'status-validated';
            if (auth.isExpired) return 'status-expired';
            if (auth.isUrgent) return 'status-urgent';
            return 'status-pending';
        },
        
        getStatusText(auth) {
            if (auth.isValidated) return 'Validée';
            if (auth.isExpired) return 'Expirée';
            if (auth.isUrgent) return 'Urgente';
            return 'En attente';
        },
        
        getExpirationClass(auth) {
            if (auth.isExpired) return 'expiration-expired';
            if (auth.daysUntilExpiry <= 7) return 'expiration-warning';
            return 'expiration-valid';
        },
        
        getExpirationText(auth) {
            if (auth.isExpired) return 'Expirée';
            if (auth.daysUntilExpiry <= 7) return `${auth.daysUntilExpiry} jours`;
            return 'Valide';
        },
        
        async viewAuthorization(auth) {
            try {
                this.loading = true;
                const response = await window.apiService.request(`/intervention-work-authorizations/${auth.id}`);
                
                if (response.success) {
                    this.showAuthorizationModal(response.data);
                } else {
                    NotificationService.show('Erreur lors du chargement de l\'autorisation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement de l\'autorisation:', error);
                NotificationService.show('Erreur lors du chargement de l\'autorisation', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        showAuthorizationModal(auth) {
            const modalHtml = `
                <div class="modal-overlay" onclick="this.remove()">
                    <div class="modal-content" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2>Autorisation #${auth.id}</h2>
                            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="auth-details-grid">
                                <div class="auth-detail-group">
                                    <h3>Informations Générales</h3>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">ID:</span>
                                        <span class="auth-detail-value">#${auth.id}</span>
                                    </div>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">Intervention:</span>
                                        <span class="auth-detail-value">${auth.interventionCode}</span>
                                    </div>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">Véhicule:</span>
                                        <span class="auth-detail-value">${auth.vehicle.brand} ${auth.vehicle.model} - ${auth.vehicle.plateNumber}</span>
                                    </div>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">Devis:</span>
                                        <span class="auth-detail-value">${auth.quoteNumber || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div class="auth-detail-group">
                                    <h3>Autorisation</h3>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">Autorisé par:</span>
                                        <span class="auth-detail-value">Utilisateur #${auth.authorizedBy}</span>
                                    </div>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">Date:</span>
                                        <span class="auth-detail-value">${this.formatDate(auth.authorizationDate)}</span>
                                    </div>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">Montant Max:</span>
                                        <span class="auth-detail-value">${auth.maxAmount ? this.formatCurrency(auth.maxAmount) : 'Non défini'}</span>
                                    </div>
                                    <div class="auth-detail-item">
                                        <span class="auth-detail-label">Urgent:</span>
                                        <span class="auth-detail-value">
                                            <span class="urgency-badge ${auth.isUrgent ? 'urgency-urgent' : 'urgency-normal'}">
                                                <i class="fas fa-${auth.isUrgent ? 'exclamation-triangle' : 'check'}"></i>
                                                ${auth.isUrgent ? 'Oui' : 'Non'}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            ${auth.specialInstructions ? `
                                <div class="auth-detail-group">
                                    <h3>Instructions Spéciales</h3>
                                    <p>${auth.specialInstructions}</p>
                                </div>
                            ` : ''}

                            <div class="auth-lines-section">
                                <h3>Lignes d'Autorisation (${auth.lines.length})</h3>
                                <table class="auth-lines-table">
                                    <thead>
                                        <tr>
                                            <th>Ligne</th>
                                            <th>Description</th>
                                            <th>Quantité</th>
                                            <th>Prix Unitaire</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${auth.lines.map(line => `
                                            <tr>
                                                <td>${line.lineNumber}</td>
                                                <td>${line.description}</td>
                                                <td>${line.quantity}</td>
                                                <td>${this.formatCurrency(line.unitPrice)}</td>
                                                <td>${this.formatCurrency(line.lineTotal)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
                            ${!auth.isValidated ? `
                                <button class="btn btn-primary" onclick="window.app.validateAuthorization(${auth.id}); this.closest('.modal-overlay').remove()">
                                    <i class="fas fa-check"></i> Valider
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        },
        
        async validateAuthorization(id) {
            if (confirm('Êtes-vous sûr de vouloir valider cette autorisation de travail ?')) {
                try {
                    this.loading = true;
                    const response = await ApiService.post(`/intervention-work-authorizations/${id}/validate`);
                    
                    if (response.success) {
                        NotificationService.show('Autorisation validée avec succès', 'success');
                        await this.loadAuthorizations();
                        await this.loadStatistics();
                    } else {
                        NotificationService.show('Erreur lors de la validation', 'error');
                    }
                } catch (error) {
                    console.error('Erreur lors de la validation:', error);
                    NotificationService.show('Erreur lors de la validation', 'error');
                } finally {
                    this.loading = false;
                }
            }
        },
        
        async deleteAuthorization(auth) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette autorisation de travail ?')) {
                try {
                    this.loading = true;
                    const response = await ApiService.delete(`/intervention-work-authorizations/${auth.id}`);
                    
                    if (response.success) {
                        NotificationService.show('Autorisation supprimée avec succès', 'success');
                        await this.loadAuthorizations();
                        await this.loadStatistics();
                    } else {
                        NotificationService.show('Erreur lors de la suppression', 'error');
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    NotificationService.show('Erreur lors de la suppression', 'error');
                } finally {
                    this.loading = false;
                }
            }
        },
        
        editAuthorization(auth) {
            window.location.href = `intervention-work-authorization-edit.html?id=${auth.id}`;
        },
        
        createAuthorization() {
            window.location.href = 'intervention-work-authorization-create.html';
        },
        
        async exportAuthorizations() {
            try {
                NotificationService.show('Fonctionnalité d\'export en cours de développement', 'info');
            } catch (error) {
                console.error('Erreur lors de l\'export:', error);
                NotificationService.show('Erreur lors de l\'export', 'error');
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
                        <button class="btn btn-secondary" @click="window.history.back()">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1><i class="fas fa-clipboard-check"></i> Gestion des Autorisations de Travail</h1>
                            <p>Créer, modifier et suivre les autorisations de travail pour les interventions</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="createAuthorization">
                            <i class="fas fa-plus"></i>
                            Nouvelle Autorisation
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
                    <button class="btn btn-outline" @click="clearFilters">
                        <i class="fas fa-times"></i>
                        Effacer
                    </button>
                </div>
            </div>

            <!-- Actions en masse -->
            <div v-if="showBulkActions" class="bulk-actions">
                <div class="bulk-info">
                    <i class="fas fa-info-circle"></i>
                    {{ selectedAuthorizations.length }} autorisation(s) sélectionnée(s)
                </div>
                <div class="bulk-buttons">
                    <button class="btn btn-success" @click="bulkValidate" :disabled="loading">
                        <i class="fas fa-check"></i>
                        Valider
                    </button>
                    <button class="btn btn-danger" @click="bulkDelete" :disabled="loading">
                        <i class="fas fa-trash"></i>
                        Supprimer
                    </button>
                </div>
            </div>

            <!-- Liste des autorisations -->
            <div class="authorizations-list">
                <div v-if="loading" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des autorisations...
                </div>
                
                <div v-else-if="filteredAuthorizations.length === 0" class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <h3>Aucune autorisation trouvée</h3>
                    <p>Il n'y a actuellement aucune autorisation de travail correspondant à vos critères.</p>
                    <button class="btn btn-primary" @click="createAuthorization">
                        <i class="fas fa-plus"></i>
                        Créer une autorisation
                    </button>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input 
                                        type="checkbox" 
                                        :checked="selectedAuthorizations.length === filteredAuthorizations.length && filteredAuthorizations.length > 0"
                                        @change="toggleAllAuthorizations"
                                        class="select-all-checkbox"
                                    >
                                </th>
                                <th>ID</th>
                                <th>Intervention</th>
                                <th>Véhicule</th>
                                <th>Devis</th>
                                <th>Date Auth.</th>
                                <th>Montant Max</th>
                                <th>Statut</th>
                                <th>Urgent</th>
                                <th>Expiration</th>
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
                                <td class="auth-id-cell">
                                    <span class="auth-id">#{{ auth.id }}</span>
                                </td>
                                <td class="intervention-cell">
                                    <div class="intervention-info">
                                        <span class="intervention-title">{{ auth.interventionCode }}</span>
                                    </div>
                                </td>
                                <td class="vehicle-cell">
                                    <div class="vehicle-info">
                                        <span class="vehicle-details">{{ auth.vehicle.brand }} {{ auth.vehicle.model }}</span>
                                        <span class="vehicle-plate">{{ auth.vehicle.plateNumber }}</span>
                                    </div>
                                </td>
                                <td class="quote-cell">
                                    <span v-if="auth.quoteNumber" class="quote-number">{{ auth.quoteNumber }}</span>
                                    <span v-else class="text-muted">-</span>
                                </td>
                                <td class="authorization-date-cell">
                                    {{ formatDate(auth.authorizationDate) }}
                                </td>
                                <td class="amount-cell">
                                    <div class="amount-total">{{ formatCurrency(auth.maxAmount) }}</div>
                                </td>
                                <td class="status-cell">
                                    <span :class="['status-badge', getStatusBadgeClass(auth)]">
                                        {{ getStatusText(auth) }}
                                    </span>
                                </td>
                                <td class="urgency-cell">
                                    <span :class="['urgency-badge', auth.isUrgent ? 'urgency-urgent' : 'urgency-normal']">
                                        {{ auth.isUrgent ? 'Urgent' : 'Normal' }}
                                    </span>
                                </td>
                                <td class="expiration-cell">
                                    <span :class="['expiration-info', getExpirationClass(auth)]">
                                        <i class="fas fa-clock"></i>
                                        {{ getExpirationText(auth) }}
                                    </span>
                                </td>
                                <td class="actions-cell">
                                    <div class="auth-actions">
                                        <button class="btn btn-sm btn-primary" @click="viewAuthorization(auth)" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" @click="editAuthorization(auth)" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button v-if="!auth.isValidated" class="btn btn-sm btn-success" @click="validateAuthorization(auth)" title="Valider">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteAuthorization(auth)" title="Supprimer">
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
                this.loading = true;
                const response = await window.apiService.request('/intervention-work-authorizations');
                
                if (response.success) {
                    this.authorizations = response.data.map(auth => ({
                        ...auth,
                        isUrgent: this.checkIfUrgent(auth),
                        isExpired: this.checkIfExpired(auth),
                        daysUntilExpiry: this.getDaysUntilExpiry(auth)
                    }));
                    this.updateStatistics();
                    this.updatePagination();
                } else {
                    window.notificationService.show('Erreur lors du chargement des autorisations', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des autorisations:', error);
                window.notificationService.show('Erreur lors du chargement des autorisations', 'error');
            } finally {
                this.loading = false;
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
            this.statistics.urgent = this.authorizations.filter(auth => auth.isUrgent).length;
            this.statistics.expired = this.authorizations.filter(auth => auth.isExpired).length;
            this.statistics.active = this.authorizations.filter(auth => auth.isValidated && !auth.isExpired).length;
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
        
        clearFilters() {
            this.searchQuery = '';
            this.statusFilter = 'all';
            this.dateFilter = 'all';
            this.pagination.currentPage = 1;
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        formatCurrency(amount) {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF'
            }).format(amount);
        },
        
        getStatusBadgeClass(auth) {
            if (auth.isValidated) return 'status-validated';
            if (auth.isExpired) return 'status-expired';
            if (auth.isUrgent) return 'status-urgent';
            return 'status-pending';
        },
        
        getStatusText(auth) {
            if (auth.isValidated) return 'Validée';
            if (auth.isExpired) return 'Expirée';
            if (auth.isUrgent) return 'Urgente';
            return 'En attente';
        },
        
        getExpirationClass(auth) {
            if (auth.isExpired) return 'expiration-expired';
            if (auth.daysUntilExpiry <= 7) return 'expiration-warning';
            return 'expiration-valid';
        },
        
        getExpirationText(auth) {
            if (auth.isExpired) return 'Expirée';
            if (auth.daysUntilExpiry <= 7) return `${auth.daysUntilExpiry} jours`;
            return 'Valide';
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
            if (this.selectedAuthorizations.length === this.filteredAuthorizations.length) {
                this.selectedAuthorizations = [];
            } else {
                this.selectedAuthorizations = this.filteredAuthorizations.map(auth => auth.id);
            }
            this.updateBulkActions();
        },
        
        updateBulkActions() {
            this.showBulkActions = this.selectedAuthorizations.length > 0;
        },
        
        async viewAuthorization(auth) {
            try {
                this.loading = true;
                const response = await window.apiService.request(`/intervention-work-authorizations/${auth.id}`);
                
                if (response.success) {
                    this.showAuthorizationModal(response.data);
                } else {
                    NotificationService.show('Erreur lors du chargement de l\'autorisation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement de l\'autorisation:', error);
                NotificationService.show('Erreur lors du chargement de l\'autorisation', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        showAuthorizationModal(auth) {
            // Implémentation simplifiée de la modal
            alert(`Autorisation #${auth.id}\nIntervention: ${auth.interventionCode}\nVéhicule: ${auth.vehicle.brand} ${auth.vehicle.model}`);
        },
        
        editAuthorization(auth) {
            window.location.href = `/intervention-work-authorization-edit.html?id=${auth.id}`;
        },
        
        async validateAuthorization(authId) {
            const confirmed = await window.notificationService.confirm(
                'Valider cette autorisation de travail ?',
                'Valider l\'autorisation',
                'success'
            );
            
            if (!confirmed) return;
            
            try {
                const response = await ApiService.post(`/intervention-work-authorizations/${authId}/validate`);
                
                if (response.success) {
                    NotificationService.show('Autorisation validée avec succès', 'success');
                    await this.loadAuthorizations();
                } else {
                    NotificationService.show('Erreur lors de la validation: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la validation:', error);
                NotificationService.show('Erreur lors de la validation de l\'autorisation', 'error');
            }
        },
        
        async deleteAuthorization(auth) {
            const confirmed = await window.notificationService.confirm(
                `Supprimer l'autorisation #${auth.id} ?`,
                'Supprimer l\'autorisation',
                'delete'
            );
            
            if (!confirmed) return;
            
            try {
                const response = await ApiService.delete(`/intervention-work-authorizations/${auth.id}`);
                
                if (response.success) {
                    NotificationService.show('Autorisation supprimée avec succès', 'success');
                    await this.loadAuthorizations();
                } else {
                    NotificationService.show('Erreur lors de la suppression: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                NotificationService.show('Erreur lors de la suppression de l\'autorisation', 'error');
            }
        },
        
        async bulkValidate() {
            if (this.selectedAuthorizations.length === 0) return;
            
            const confirmed = await window.notificationService.confirm(
                `Valider ${this.selectedAuthorizations.length} autorisation(s) ?`,
                'Valider les autorisations',
                'success'
            );
            
            if (!confirmed) return;
            
            try {
                const response = await ApiService.post('/intervention-work-authorizations/bulk-validate', {
                    ids: this.selectedAuthorizations
                });
                
                if (response.success) {
                    NotificationService.show(`${response.data.validated} autorisation(s) validée(s) avec succès`, 'success');
                    this.selectedAuthorizations = [];
                    this.updateBulkActions();
                    await this.loadAuthorizations();
                } else {
                    NotificationService.show('Erreur lors de la validation en masse: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la validation en masse:', error);
                NotificationService.show('Erreur lors de la validation en masse', 'error');
            }
        },
        
        async bulkDelete() {
            if (this.selectedAuthorizations.length === 0) return;
            
            const confirmed = await window.notificationService.confirm(
                `Supprimer ${this.selectedAuthorizations.length} autorisation(s) ?`,
                'Supprimer les autorisations',
                'delete'
            );
            
            if (!confirmed) return;
            
            try {
                const response = await ApiService.post('/intervention-work-authorizations/bulk-delete', {
                    ids: this.selectedAuthorizations
                });
                
                if (response.success) {
                    NotificationService.show(`${response.data.deleted} autorisation(s) supprimée(s) avec succès`, 'success');
                    this.selectedAuthorizations = [];
                    this.updateBulkActions();
                    await this.loadAuthorizations();
                } else {
                    NotificationService.show('Erreur lors de la suppression en masse: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression en masse:', error);
                NotificationService.show('Erreur lors de la suppression en masse', 'error');
            }
        },
        
        createAuthorization() {
            window.location.href = '/intervention-work-authorization-create.html';
        }
    },
    
    mounted() {
        this.loadAuthorizations();
    }
};

// Exposer le composant globalement
window.InterventionWorkAuthorizationsList = InterventionWorkAuthorizationsList;
