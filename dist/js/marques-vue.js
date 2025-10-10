/**
 * Impact Auto - Marques Vue.js
 * Composant CRUD pour la gestion des marques de véhicules
 */

// Définir le composant MarqueCrud
const MarqueCrud = {
    name: 'MarqueCrud',
    
    data() {
        return {
            marques: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentMarque: null,
            marqueToDelete: null,
            
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0,
            
            filters: [
                { value: 'all', label: 'Toutes' },
                { value: 'active', label: 'Actives' },
                { value: 'inactive', label: 'Inactives' }
            ],
            
            form: {
                name: '',
                code: '',
                description: '',
                logoUrl: '',
                website: '',
                isActive: true
            }
        }
    },
    
    computed: {
        filteredMarques() {
            // Since we're now using server-side pagination, we return the marques as-is
            // The filtering is done on the server
            return this.marques;
        },
        
        visiblePages() {
            const pages = [];
            const maxVisible = 5;
            let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let end = Math.min(this.totalPages, start + maxVisible - 1);
            
            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            return pages;
        }
    },
    
    watch: {
        searchTerm() {
            // Debounce search to avoid too many API calls
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.onSearchChange();
            }, 500);
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadMarques();
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
        
        async loadMarques() {
            this.loading = true;
            try {
                const data = await window.apiService.getMarques(null, this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.marques = this.adaptMarqueData(data.data || []);
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.totalPages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux marques. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des marques', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des marques:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux marques. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des marques: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        // Adapter les données de l'API au format attendu par le composant
        adaptMarqueData(apiData) {
            return apiData.map(marque => ({
                id: marque.id,
                name: marque.name,
                code: marque.code || marque.name.substring(0, 3).toUpperCase(),
                description: marque.description || `Constructeur automobile ${marque.country || ''}`,
                logo: marque.logoUrl || '',
                logoUrl: marque.logoUrl || '',
                website: marque.website || '',
                country: marque.country || '',
                isActive: marque.isActive !== undefined ? marque.isActive : true,
                createdAt: marque.createdAt,
                updatedAt: marque.updatedAt
            }));
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadMarques();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadMarques();
            }
        },
        
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.goToPage(this.currentPage + 1);
            }
        },
        
        prevPage() {
            if (this.currentPage > 1) {
                this.goToPage(this.currentPage - 1);
            }
        },
        
        // Watch for search term changes
        onSearchChange() {
            this.currentPage = 1; // Reset to first page when searching
            this.loadMarques();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentMarque = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(marque) {
            this.isEditing = true;
            this.currentMarque = marque;
            this.form = {
                name: marque.name,
                code: marque.code || '',
                description: marque.description || '',
                logoUrl: marque.logoUrl || '',
                website: marque.website || '',
                isActive: marque.isActive
            };
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        closeModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeModal();
            }
        },
        
        resetForm() {
            this.form = {
                name: '',
                code: '',
                description: '',
                logoUrl: '',
                website: '',
                isActive: true
            };
        },
        
        async saveMarque() {
            if (!this.form.name) {
                this.showNotification('Veuillez saisir le nom de la marque', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let data;
                if (this.isEditing) {
                    data = await window.apiService.updateMarque(this.currentMarque.id, this.form);
                } else {
                    data = await window.apiService.createMarque(this.form);
                }
                
                if (data.success) {
                    this.closeModal();
                    await this.loadMarques();
                    this.showNotification(
                        this.isEditing ? 'Marque modifiée avec succès' : 'Marque créée avec succès',
                        'success'
                    );
                } else {
                    this.showNotification(data.message || 'Erreur lors de la sauvegarde', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },
        
        confirmDelete(marque) {
            this.marqueToDelete = marque;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.marqueToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async deleteMarque() {
            if (!this.marqueToDelete) return;
            
            this.deleting = true;
            try {
                const data = await window.apiService.deleteMarque(this.marqueToDelete.id);
                
                if (data.success) {
                    this.closeDeleteModal();
                    await this.loadMarques();
                    this.showNotification('Marque supprimée avec succès', 'success');
                } else {
                    this.showNotification(data.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
            } finally {
                this.deleting = false;
            }
        },
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },
        
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            const container = document.getElementById('notification-container') || document.body;
            container.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    },
    
    template: `
        <div class="parameter-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Marques</h1>
                <p class="page-subtitle">Gérez les marques de véhicules de votre parc automobile</p>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher une marque..."
                    >
                </div>
                
                <div class="filter-buttons">
                    <button 
                        v-for="filter in filters" 
                        :key="filter.value"
                        :class="['filter-btn', { active: activeFilter === filter.value }]"
                        @click="setActiveFilter(filter.value)"
                    >
                        {{ filter.label }}
                    </button>
                </div>
                
                <button class="btn btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Nouvelle Marque
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des marques...
            </div>

            <!-- Marques Grid -->
            <div v-else-if="marques.length > 0" class="parameters-grid">
                <div 
                    v-for="marque in marques" 
                    :key="marque.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="marque-logo">
                            <img v-if="marque.logo" :src="marque.logo" :alt="marque.name" class="logo-img">
                            <div v-else class="logo-placeholder">
                                {{ marque.name.charAt(0).toUpperCase() }}
                            </div>
                        </div>
                        <div class="parameter-key">{{ marque.name }}</div>
                        <div :class="['parameter-category', marque.isActive ? 'active' : 'inactive']">
                            {{ marque.isActive ? 'Active' : 'Inactive' }}
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            <div class="marque-code" v-if="marque.code">
                                <strong>Code:</strong> {{ marque.code }}
                            </div>
                            <div class="marque-website" v-if="marque.website">
                                <strong>Site web:</strong> 
                                <a :href="marque.website" target="_blank" class="website-link">
                                    {{ marque.website }}
                                </a>
                            </div>
                        </div>
                        <div class="parameter-description">
                            {{ marque.description || 'Aucune description' }}
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Créée le {{ formatDate(marque.createdAt) }}</div>
                            <div class="parameter-status">
                                <div :class="['status-indicator', marque.isActive ? 'active' : 'inactive']"></div>
                                {{ marque.isActive ? 'Active' : 'Inactive' }}
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(marque)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="confirmDelete(marque)"
                            >
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="pagination-container">
                <div class="pagination-info">
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} marques
                </div>
                <div class="pagination-controls">
                    <button 
                        class="btn btn-outline btn-sm" 
                        @click="prevPage" 
                        :disabled="currentPage === 1"
                    >
                        <i class="fas fa-chevron-left"></i> Précédent
                    </button>
                    
                    <div class="pagination-pages">
                        <button 
                            v-for="page in visiblePages" 
                            :key="page"
                            :class="['btn', 'btn-sm', page === currentPage ? 'btn-primary' : 'btn-outline']"
                            @click="goToPage(page)"
                        >
                            {{ page }}
                        </button>
                    </div>
                    
                    <button 
                        class="btn btn-outline btn-sm" 
                        @click="nextPage" 
                        :disabled="currentPage === totalPages"
                    >
                        Suivant <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
                <i class="fas fa-tags"></i>
                <h3>Aucune marque trouvée</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucune marque ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter une nouvelle marque.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter une marque
                </button>
            </div>

            <!-- Create/Edit Marque Modal -->
            <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier la marque' : 'Nouvelle marque' }}</h3>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveMarque">
                            <div class="form-group">
                                <label for="marque-name">Nom de la marque *</label>
                                <input 
                                    type="text" 
                                    id="marque-name"
                                    v-model="form.name"
                                    required
                                    placeholder="Ex: Peugeot, Renault, BMW..."
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="marque-code">Code de la marque</label>
                                <input 
                                    type="text" 
                                    id="marque-code"
                                    v-model="form.code"
                                    placeholder="Ex: PEU, REN, BMW..."
                                    maxlength="10"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="marque-description">Description</label>
                                <textarea 
                                    id="marque-description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description de la marque..."
                                ></textarea>
                            </div>
                            
                                <div class="form-group">
                                    <label for="marque-logo">URL du logo</label>
                                    <input 
                                        type="url" 
                                        id="marque-logo"
                                        v-model="form.logoUrl"
                                        placeholder="https://example.com/logo.png"
                                    >
                                </div>
                            
                            <div class="form-group">
                                <label for="marque-website">Site web</label>
                                <input 
                                    type="url" 
                                    id="marque-website"
                                    v-model="form.website"
                                    placeholder="https://www.marque.com"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="marque-active">
                                    <input 
                                        type="checkbox" 
                                        id="marque-active"
                                        v-model="form.isActive"
                                    >
                                    Marque active
                                </label>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="saveMarque"
                            :disabled="saving"
                        >
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div :class="['modal', { show: showDeleteModal }]" @click="closeDeleteModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>Confirmer la suppression</h3>
                        <button class="modal-close" @click="closeDeleteModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <p>Êtes-vous sûr de vouloir supprimer cette marque ?</p>
                        <p><strong>{{ marqueToDelete?.name }}</strong></p>
                        <p class="text-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Cette action est irréversible et affectera tous les véhicules de cette marque.
                        </p>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="deleteMarque"
                            :disabled="deleting"
                        >
                            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
                            {{ deleting ? 'Suppression...' : 'Supprimer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Notification Container -->
            <div class="notification-container" id="notification-container"></div>
        </div>
    `
};

// Exposer le composant globalement
window.MarqueCrud = MarqueCrud;
