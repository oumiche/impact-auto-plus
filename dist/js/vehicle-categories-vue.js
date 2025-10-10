/**
 * Impact Auto - Vehicle Categories Vue.js
 * Composant CRUD pour la gestion des catégories de véhicules
 */

// Définir le composant VehicleCategoryCrud
const VehicleCategoryCrud = {
    name: 'VehicleCategoryCrud',
    
    data() {
        return {
            categories: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentCategory: null,
            categoryToDelete: null,
            
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0,
            
            filters: [
                { value: 'all', label: 'Toutes' }
            ],
            
            form: {
                name: '',
                description: '',
                icon: ''
            }
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadCategories();
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
        
        async loadCategories() {
            this.loading = true;
            try {
                const data = await window.apiService.getVehicleCategories(this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.categories = this.adaptCategoryData(data.data || []);
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.pages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux catégories. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des catégories', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des catégories:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux catégories. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des catégories: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        // Adapter les données de l'API au format attendu par le composant
        adaptCategoryData(apiData) {
            return apiData.map(category => ({
                id: category.id,
                name: category.name,
                description: category.description || '',
                icon: category.icon || '',
                createdAt: category.createdAt
            }));
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadCategories();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadCategories();
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
            this.loadCategories();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentCategory = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(category) {
            this.isEditing = true;
            this.currentCategory = category;
            this.form = {
                name: category.name,
                description: category.description,
                icon: category.icon
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
                description: '',
                icon: ''
            };
        },
        
        async saveCategory() {
            if (!this.form.name) {
                this.showNotification('Veuillez saisir le nom de la catégorie', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let data;
                let formData = { ...this.form };
                
                if (this.isEditing) {
                    data = await window.apiService.updateVehicleCategory(this.currentCategory.id, formData);
                } else {
                    data = await window.apiService.createVehicleCategory(formData);
                }
                
                if (data.success) {
                    this.showNotification(data.message, 'success');
                    this.closeModal();
                    await this.loadCategories();
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
        
        confirmDelete(category) {
            this.categoryToDelete = category;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.categoryToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async deleteCategory() {
            if (!this.categoryToDelete) return;
            
            this.deleting = true;
            try {
                const data = await window.apiService.deleteVehicleCategory(this.categoryToDelete.id);
                
                if (data.success) {
                    this.showNotification(data.message, 'success');
                    this.closeDeleteModal();
                    await this.loadCategories();
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
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        showNotification(message, type = 'info') {
            // Créer le conteneur de notifications s'il n'existe pas
            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'notification-container';
                document.body.appendChild(container);
            }
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            container.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    },
    
    computed: {
        filteredCategories() {
            // Since we're now using server-side pagination, we return the categories as-is
            // The filtering is done on the server
            return this.categories;
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
    
    template: `
        <div class="parameter-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Catégories de Véhicules</h1>
                <p class="page-subtitle">Gérez les catégories de véhicules de votre parc automobile</p>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher une catégorie..."
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
                    <i class="fas fa-plus"></i> Nouvelle Catégorie
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des catégories...
            </div>

            <!-- Categories Grid -->
            <div v-else-if="categories.length > 0" class="parameters-grid">
                <div 
                    v-for="category in categories" 
                    :key="category.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="category-icon">
                            <i v-if="category.icon" :class="['fas', 'fa-' + category.icon]"></i>
                            <i v-else class="fas fa-car"></i>
                        </div>
                        <div class="parameter-key">{{ category.name }}</div>
                        <div class="parameter-category">
                            Catégorie véhicule
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            <div class="category-description">
                                {{ category.description || 'Aucune description' }}
                            </div>
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Créée le {{ formatDate(category.createdAt) }}</div>
                            <div class="parameter-status">
                                <div class="status-indicator active"></div>
                                Active
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(category)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="confirmDelete(category)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} catégories
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
            <div v-else-if="categories.length === 0" class="empty-state">
                <i class="fas fa-car"></i>
                <h3>Aucune catégorie trouvée</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucune catégorie ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter une nouvelle catégorie.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter une catégorie
                </button>
            </div>

            <!-- Create/Edit Category Modal -->
            <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h3>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveCategory">
                            <div class="form-group">
                                <label for="category-name">Nom de la catégorie *</label>
                                <input 
                                    type="text" 
                                    id="category-name"
                                    v-model="form.name"
                                    required
                                    placeholder="Ex: Berline, SUV, Utilitaire..."
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="category-description">Description</label>
                                <textarea 
                                    id="category-description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description de la catégorie..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="category-icon">Icône</label>
                                <div class="icon-selector">
                                    <div class="icon-preview">
                                        <i v-if="form.icon" :class="['fas', 'fa-' + form.icon]"></i>
                                        <i v-else class="fas fa-car"></i>
                                    </div>
                                    <select id="category-icon" v-model="form.icon">
                                        <option value="">Sélectionner une icône...</option>
                                        <option value="car">🚗 Voiture</option>
                                        <option value="truck">🚚 Camion</option>
                                        <option value="van">🚐 Fourgon</option>
                                        <option value="motorcycle">🏍️ Moto</option>
                                        <option value="bus">🚌 Bus</option>
                                        <option value="ambulance">🚑 Ambulance</option>
                                        <option value="fire-truck">🚒 Camion de pompiers</option>
                                        <option value="police-car">🚔 Voiture de police</option>
                                        <option value="taxi">🚕 Taxi</option>
                                        <option value="tractor">🚜 Tracteur</option>
                                        <option value="bicycle">🚲 Vélo</option>
                                        <option value="suv">🚙 SUV</option>
                                        <option value="pickup">🛻 Pick-up</option>
                                        <option value="semi-truck">🚛 Semi-remorque</option>
                                        <option value="tank">🚗 Véhicule blindé</option>
                                        <option value="helicopter">🚁 Hélicoptère</option>
                                        <option value="plane">✈️ Avion</option>
                                        <option value="boat">⛵ Bateau</option>
                                        <option value="train">🚂 Train</option>
                                        <option value="metro">🚇 Métro</option>
                                    </select>
                                </div>
                                <small class="form-help">Choisissez une icône qui représente le mieux votre catégorie de véhicule</small>
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
                            @click="saveCategory"
                            :disabled="saving"
                        >
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ saving ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Créer') }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Delete Category Modal -->
            <div :class="['modal', { show: showDeleteModal }]" @click="closeDeleteModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>Supprimer la catégorie</h3>
                        <button class="modal-close" @click="closeDeleteModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <p>Êtes-vous sûr de vouloir supprimer la catégorie <strong>{{ categoryToDelete?.name }}</strong> ?</p>
                        <p class="text-danger">Cette action est irréversible.</p>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="deleteCategory"
                            :disabled="deleting"
                        >
                            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-trash"></i>
                            {{ deleting ? 'Suppression...' : 'Supprimer' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Exporter le composant
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VehicleCategoryCrud;
}

// Exposer le composant globalement
window.VehicleCategoryCrud = VehicleCategoryCrud;
