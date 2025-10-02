const InterventionPrediagnosticCrud = {
    template: `
        <div class="intervention-prediagnostic-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-text">
                        <h1 class="section-title">Gestion des Prédiagnostics</h1>
                        <p class="page-subtitle">Gérez les prédiagnostics de vos interventions</p>
                    </div>
                    <div class="header-stats">
                        <div class="stat-item">
                            <div class="stat-number">{{ pendingPrediagnosticsCount }}</div>
                            <div class="stat-label">En cours</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">{{ completedPrediagnosticsCount }}</div>
                            <div class="stat-label">Terminés</div>
                        </div>
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
                        placeholder="Rechercher par intervention, expert..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="interventionFilter" @change="loadPrediagnostics" class="filter-select">
                        <option value="">Toutes les interventions</option>
                        <option v-for="intervention in availableInterventions" :key="intervention.id" :value="intervention.id">
                            {{ intervention.title }} - {{ intervention.vehicle.plateNumber }}
                        </option>
                    </select>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" @click="openCreateModal">
                        <i class="fas fa-plus"></i>
                        Nouveau Prédiagnostic
                    </button>
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
                                            {{ prediagnostic.intervention.vehicle.brand }} {{ prediagnostic.intervention.vehicle.model }}
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
                                        <button class="btn btn-sm btn-outline" @click="editPrediagnostic(prediagnostic)" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            v-if="prediagnostic.intervention.currentStatus === 'in_prediagnostic'"
                                            class="btn btn-sm btn-success" 
                                            @click="completePrediagnostic(prediagnostic)" 
                                            title="Marquer comme terminé"
                                        >
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deletePrediagnostic(prediagnostic)" title="Supprimer">
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
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            searchTimeout: null
        };
    },
    
    computed: {
        pendingPrediagnosticsCount() {
            return this.prediagnostics.filter(p => p.intervention.currentStatus === 'in_prediagnostic').length;
        },
        
        completedPrediagnosticsCount() {
            return this.prediagnostics.filter(p => p.intervention.currentStatus === 'prediagnostic_completed').length;
        }
    },
    
    mounted() {
        this.loadPrediagnostics();
        this.loadInterventions();
    },
    
    methods: {
        async loadPrediagnostics() {
            this.loading = true;
            try {
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    search: this.searchTerm
                });
                
                if (this.interventionFilter) {
                    params.append('interventionId', this.interventionFilter);
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
                const response = await window.apiService.getVehicleInterventions();
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
            // Vérifier que le service de notification est disponible
            if (!window.notificationService) {
                console.error('NotificationService non disponible');
                if (!confirm(`Êtes-vous sûr de vouloir supprimer le prédiagnostic pour l'intervention "${prediagnostic.intervention.title}" ?`)) {
                return;
                }
            } else {
                const confirmed = await window.notificationService.confirm(
                    `Êtes-vous sûr de vouloir supprimer le prédiagnostic pour l'intervention "${prediagnostic.intervention.title}" ?`,
                    'Supprimer le prédiagnostic',
                    'delete'
                );
                
                if (!confirmed) {
                    return;
                }
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
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
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
            const confirmed = await window.notificationService.confirm(
                `Êtes-vous sûr de vouloir marquer le prédiagnostic pour l'intervention "${prediagnostic.intervention.title}" comme terminé ?`,
                'Finaliser le prédiagnostic',
                'info'
            );
            
            if (!confirmed) {
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
        
        showNotification(message, type = 'info') {
            if (window.notificationService) {
                window.notificationService.show(message, type);
            } else {
                alert(message);
            }
        }
    }
};
