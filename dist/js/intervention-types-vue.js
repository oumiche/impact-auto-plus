/**
 * Impact Auto - Types d'Intervention Vue.js
 * Composant CRUD pour la gestion des types d'intervention
 */

const InterventionTypeCrud = {
    template: `
        <div class="intervention-type-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Types d'Intervention</h1>
                <p class="page-subtitle">Gérez les types d'intervention pour les véhicules</p>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher un type d'intervention..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="statusFilter" @change="loadInterventionTypes" class="filter-select">
                        <option value="all">Tous les types</option>
                        <option value="active">Actifs uniquement</option>
                        <option value="inactive">Inactifs uniquement</option>
                    </select>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" @click="openCreateModal">
                        <i class="fas fa-plus"></i>
                        Nouveau Type
                    </button>
                </div>
            </div>

            <!-- Liste des types d'intervention -->
            <div class="data-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement des types d'intervention...</p>
                </div>
                
                <div v-else-if="interventionTypes.length === 0" class="no-data">
                    <i class="fas fa-tools"></i>
                    <h3>Aucun type d'intervention trouvé</h3>
                    <p>Commencez par créer votre premier type d'intervention.</p>
                </div>
                
                <div v-else class="parameters-grid">
                    <div 
                        v-for="interventionType in interventionTypes" 
                        :key="interventionType.id"
                        class="parameter-card"
                    >
                        <div class="parameter-header">
                            <div class="intervention-type-info">
                                <div class="parameter-key">{{ interventionType.name }}</div>
                            </div>
                            <div :class="['parameter-category', interventionType.isActive ? 'active' : 'inactive']">
                                {{ interventionType.isActive ? 'Actif' : 'Inactif' }}
                            </div>
                        </div>
                        
                        <div class="parameter-body">
                            <div class="parameter-value">
                                <div class="intervention-type-details">
                                    <div class="intervention-type-duration" v-if="interventionType.estimatedDuration">
                                        <strong>Durée estimée:</strong> {{ interventionType.estimatedDuration }} heures
                                    </div>
                                    <div class="intervention-type-cost" v-if="interventionType.estimatedCost">
                                        <strong>Coût estimé:</strong> {{ formatPrice(interventionType.estimatedCost) }}
                                    </div>
                                    <div class="intervention-type-code" v-if="interventionType.code">
                                        <strong>Code:</strong> {{ interventionType.code }}
                                    </div>
                                </div>
                            </div>
                            <div class="parameter-description">
                                {{ interventionType.description || 'Aucune description' }}
                            </div>
                            
                            <div class="parameter-meta">
                                <div class="parameter-type">Créé le {{ formatDate(interventionType.createdAt) }}</div>
                                <div class="parameter-status">
                                    <div :class="['status-indicator', interventionType.isActive ? 'active' : 'inactive']"></div>
                                    {{ interventionType.isActive ? 'Actif' : 'Inactif' }}
                                </div>
                            </div>
                            
                            <div class="parameter-actions">
                                <button 
                                    class="button btn-outline btn-sm" 
                                    @click="editInterventionType(interventionType)"
                                >
                                    <i class="fas fa-edit"></i> Modifier
                                </button>
                                <button 
                                    class="button btn-danger btn-sm" 
                                    @click="deleteInterventionType(interventionType)"
                                >
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
                        <h3>{{ isEditing ? "Modifier le type d'intervention" : "Nouveau type d'intervention" }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveInterventionType">
                            <div class="form-group">
                                <label for="intervention-type-name">Nom *</label>
                                <input 
                                    type="text" 
                                    id="intervention-type-name"
                                    v-model="form.name"
                                    placeholder="Ex: Vidange moteur, Réparation freins..."
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="intervention-type-description">Description</label>
                                <textarea 
                                    id="intervention-type-description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description détaillée du type d'intervention..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="form.isActive">
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">Type d'intervention actif</span>
                                </label>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-primary" @click="saveInterventionType" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ isEditing ? 'Modifier' : 'Créer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de suppression -->
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
                            <p v-if="interventionTypeToDelete">Êtes-vous sûr de vouloir supprimer le type d'intervention <strong>{{ interventionTypeToDelete.name }}</strong> ?</p>
                            <p v-else>Êtes-vous sûr de vouloir supprimer ce type d'intervention ?</p>
                            <p class="text-muted">Cette action est irréversible et supprimera définitivement toutes les données associées à ce type d'intervention.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="!interventionTypeToDelete">
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
            interventionTypes: [],
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
            interventionTypeToDelete: null,
            searchTimeout: null,
            form: {
                id: null,
                name: '',
                description: '',
                isActive: true
            }
        };
    },
    
    computed: {
        hasInterventionTypes() {
            return this.interventionTypes && this.interventionTypes.length > 0;
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadInterventionTypes();
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
        
        async loadInterventionTypes() {
            this.loading = true;
            try {
                const response = await window.apiService.request(`/intervention-types/admin?page=${this.currentPage}&limit=${this.itemsPerPage}&search=${encodeURIComponent(this.searchTerm)}&status=${this.statusFilter}`);
                
                if (response.success) {
                    this.interventionTypes = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des types d\'intervention: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types d\'intervention:', error);
                this.showNotification('Erreur lors du chargement des types d\'intervention', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadInterventionTypes();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadInterventionTypes();
        },
        
        openCreateModal() {
            console.log('Opening create modal...');
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
            console.log('showModal set to:', this.showModal);
        },
        
        editInterventionType(interventionType) {
            this.isEditing = true;
            this.form = {
                id: interventionType.id,
                name: interventionType.name,
                description: interventionType.description || '',
                isActive: interventionType.isActive
            };
            this.showModal = true;
        },
        
        async saveInterventionType() {
            if (!this.form.name.trim()) {
                this.showNotification('Le nom est requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.request(`/intervention-types/admin/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(this.form)
                    });
                } else {
                    response = await window.apiService.request('/intervention-types/admin', {
                        method: 'POST',
                        body: JSON.stringify(this.form)
                    });
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadInterventionTypes();
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
        
        deleteInterventionType(interventionType) {
            this.interventionTypeToDelete = interventionType;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.interventionTypeToDelete) return;
            
            try {
                const response = await window.apiService.request(`/intervention-types/admin/${this.interventionTypeToDelete.id}`, {
                    method: 'DELETE'
                });
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadInterventionTypes();
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
            this.interventionTypeToDelete = null;
        },
        
        resetForm() {
            this.form = {
                id: null,
                name: '',
                description: '',
                isActive: true
            };
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        showNotification(message, type = 'info') {
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
        },
        
        formatPrice(price) {
            if (!price) return 'N/A';
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF'
            }).format(price);
        }
    }
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined') {
    window.InterventionTypeCrud = InterventionTypeCrud;
    console.log('InterventionTypeCrud component registered globally');
}

