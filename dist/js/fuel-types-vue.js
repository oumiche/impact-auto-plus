/**
 * Impact Auto - Fuel Types Vue.js
 * Composant CRUD pour la gestion des types de carburant
 */

// Définir le composant FuelTypeCrud
const FuelTypeCrud = {
    name: 'FuelTypeCrud',
    
    data() {
        return {
            fuelTypes: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentFuelType: null,
            fuelTypeToDelete: null,
            
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0,
            
            filters: [
                { value: 'all', label: 'Tous' },
                { value: 'eco', label: 'Éco-friendly' },
                { value: 'non-eco', label: 'Non éco-friendly' }
            ],
            
            form: {
                name: '',
                description: '',
                icon: '',
                isEcoFriendly: false
            }
        }
    },
    
    computed: {
        filteredFuelTypes() {
            // Since we're now using server-side pagination, we return the fuelTypes as-is
            // The filtering is done on the server
            return this.fuelTypes;
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
        },
        
        hasFuelTypes() {
            return this.fuelTypes && this.fuelTypes.length > 0;
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
        await this.loadFuelTypes();
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
        
        async loadFuelTypes() {
            this.loading = true;
            try {
                const data = await window.apiService.getFuelTypes(this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.fuelTypes = data.data || [];
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.totalPages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux types de carburant. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des types de carburant', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types de carburant:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux types de carburant. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des types de carburant: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadFuelTypes();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadFuelTypes();
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
            this.loadFuelTypes();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentFuelType = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(fuelType) {
            this.isEditing = true;
            this.currentFuelType = fuelType;
            this.form = {
                name: fuelType.name,
                description: fuelType.description || '',
                icon: fuelType.icon || '',
                isEcoFriendly: fuelType.isEcoFriendly || false
            };
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        resetForm() {
            this.form = {
                name: '',
                description: '',
                icon: '',
                isEcoFriendly: false
            };
        },
        
        async saveFuelType() {
            if (!this.form.name) {
                this.showNotification('Veuillez saisir le nom du type de carburant', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.updateFuelType(this.currentFuelType.id, this.form);
                } else {
                    response = await window.apiService.createFuelType(this.form);
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    await this.loadFuelTypes();
                } else {
                    this.showNotification(response.message || 'Erreur lors de la sauvegarde', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },
        
        deleteFuelType(fuelType) {
            this.fuelTypeToDelete = fuelType;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.fuelTypeToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async confirmDelete() {
            if (!this.fuelTypeToDelete) return;
            
            this.deleting = true;
            try {
                const response = await window.apiService.deleteFuelType(this.fuelTypeToDelete.id);
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    await this.loadFuelTypes();
                } else {
                    this.showNotification(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
            } finally {
                this.deleting = false;
            }
        },
        
        getEcoFriendlyLabel(isEcoFriendly) {
            return isEcoFriendly ? 'Éco-friendly' : 'Non éco-friendly';
        },
        
        showNotification(message, type = 'info') {
            // Créer l'élément de notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    <span>${message}</span>
                </div>
            `;
            
            // Ajouter au conteneur de notifications
            const container = document.getElementById('notification-container');
            if (container) {
                container.appendChild(notification);
                
                // Supprimer après 5 secondes
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 5000);
            }
        }
    },
    
    template: `
        <div class="parameter-crud">
            <div class="page-header">
                <h1 class="section-title">Gestion des Types de Carburant</h1>
                <p class="page-subtitle">Gérez les types de carburant et leurs propriétés</p>
            </div>

            <!-- Filtres et recherche -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        v-model="searchTerm" 
                        type="text" 
                        placeholder="Rechercher un type de carburant..."
                    >
                </div>
                
                <div class="filter-buttons">
                    <button 
                        v-for="filter in filters" 
                        :key="filter.value"
                        @click="setActiveFilter(filter.value)"
                        :class="['filter-btn', { active: activeFilter === filter.value }]"
                    >
                        {{ filter.label }}
                    </button>
                </div>
                
                <button @click="openCreateModal" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Nouveau Type
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des types de carburant...
            </div>

            <!-- Fuel Types Grid -->
            <div v-show="hasFuelTypes" class="parameters-grid">
                <div 
                    v-for="fuelType in filteredFuelTypes" 
                    :key="fuelType.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="parameter-key">{{ fuelType.name }}</div>
                        <div :class="['parameter-category', fuelType.isEcoFriendly ? 'eco' : 'non-eco']">
                            {{ getEcoFriendlyLabel(fuelType.isEcoFriendly) }}
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            <i v-if="fuelType.icon" :class="fuelType.icon"></i>
                            {{ fuelType.description || 'Aucune description' }}
                        </div>
                        <div class="parameter-description">
                            Type de carburant
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Carburant</div>
                            <div class="parameter-status">
                                <div :class="['status-indicator', fuelType.isEcoFriendly ? 'active' : 'inactive']"></div>
                                {{ fuelType.isEcoFriendly ? 'Éco-friendly' : 'Non éco-friendly' }}
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(fuelType)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="deleteFuelType(fuelType)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} types de carburant
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
            <div v-show="!hasFuelTypes && !loading" class="empty-state">
                <i class="fas fa-gas-pump"></i>
                <h3>Aucun type de carburant trouvé</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucun type de carburant ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter un nouveau type de carburant.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter un type
                </button>
            </div>

            <!-- Create/Edit Fuel Type Modal -->
            <div v-if="showModal" class="modal show" @click.self="closeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le type de carburant' : 'Nouveau type de carburant' }}</h3>
                        <button @click="closeModal" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveFuelType">
                            <div class="form-group">
                                <label for="fuel-type-name">Nom *</label>
                                <input 
                                    type="text" 
                                    id="fuel-type-name"
                                    v-model="form.name"
                                    placeholder="Ex: Essence, Diesel, Électrique..."
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="fuel-type-description">Description</label>
                                <textarea 
                                    id="fuel-type-description"
                                    v-model="form.description"
                                    placeholder="Description du type de carburant..."
                                    rows="3"
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="fuel-type-icon">Icône (classe FontAwesome)</label>
                                <input 
                                    type="text" 
                                    id="fuel-type-icon"
                                    v-model="form.icon"
                                    placeholder="Ex: fas fa-gas-pump, fas fa-bolt..."
                                >
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="form.isEcoFriendly"
                                    >
                                    <span class="checkmark"></span></span>
                                    Type de carburant éco-friendly
                                </label>
                            </div>
                            
                            <div class="modal-actions">
                                <button type="button" @click="closeModal" class="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" class="btn btn-primary" :disabled="saving">
                                    <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                    <i v-else class="fas fa-save"></i>
                                    {{ saving ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Enregistrer') }}
                                </button>
                            </div>
                        </form>
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
                        <p>Êtes-vous sûr de vouloir supprimer ce type de carburant ?</p>
                        <p><strong>{{ fuelTypeToDelete?.name }}</strong></p>
                        <p class="text-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Cette action est irréversible.
                        </p>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="confirmDelete"
                            :disabled="deleting"
                        >
                            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-trash"></i>
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

// Enregistrer le composant globalement
window.FuelTypeCrud = FuelTypeCrud;
