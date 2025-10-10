/**
 * Impact Auto - Fournitures Vue.js
 * Composant CRUD pour la gestion des fournitures
 */

// Définir le composant SupplyCrud
const SupplyCrud = {
    name: 'SupplyCrud',
    
    data() {
        return {
            supplies: [],
            categories: [], // Liste des catégories pour le select
            categorySearchTerm: '', // Terme de recherche pour les catégories
            categorySearchResults: [], // Résultats de recherche des catégories
            showCategoryDropdown: false, // Afficher le dropdown des catégories
            selectedCategory: null, // Catégorie sélectionnée
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentSupply: null,
            supplyToDelete: null,
            currency: 'F CFA', // Devise par défaut
            
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0,
            
            filters: [
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Inactifs' }
            ],
            
            form: {
                name: '',
                reference: '',
                oemReference: '',
                description: '',
                brand: '',
                modelCompatibility: [],
                unitPrice: '0.00',
                categoryId: '',
                isActive: true
            },
            
        }
    },
    
    computed: {
        filteredSupplies() {
            // Since we're now using server-side pagination, we return the supplies as-is
            // The filtering is done on the server
            return this.supplies;
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
        
        hasSupplies() {
            return this.supplies && this.supplies.length > 0;
        }
    },
    
    watch: {
        searchTerm() {
            // Debounce search to avoid too many API calls
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.onSearchChange();
            }, 500);
        },
        
        categorySearchTerm() {
            // Debounce search for categories
            clearTimeout(this.categorySearchTimeout);
            this.categorySearchTimeout = setTimeout(() => {
                this.searchCategories();
            }, 300);
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadSystemParameters();
        await this.loadCategories();
        await this.loadSupplies();
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
        
        async loadSystemParameters() {
            try {
                // Charger les paramètres système pour récupérer la devise
                const data = await window.apiService.getParameters(null, 'currency', 'system');
                if (data.success && data.data && data.data.length > 0) {
                    // Chercher le paramètre de devise
                    const currencyParam = data.data.find(param => 
                        param.key === 'currency' || 
                        param.key === 'default_currency' ||
                        param.name.toLowerCase().includes('devise') ||
                        param.name.toLowerCase().includes('currency')
                    );
                    
                    if (currencyParam && currencyParam.value) {
                        this.currency = currencyParam.value;
                    }
                }
            } catch (error) {
                console.warn('Impossible de charger les paramètres système, utilisation de la devise par défaut:', error);
                // Garder la devise par défaut F CFA
            }
        },
        
        async loadCategories() {
            try {
                const data = await window.apiService.getAllSupplyCategories();
                if (data.success) {
                    this.categories = data.data || [];
                } else {
                    console.error('Erreur lors du chargement des catégories:', data.message);
                    this.categories = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des catégories:', error);
                this.categories = [];
            }
        },
        
        // Recherche de catégories avec debounce
        async searchCategories() {
            if (this.categorySearchTerm.length < 2) {
                this.categorySearchResults = [];
                this.showCategoryDropdown = false;
                return;
            }
            
            try {
                // Rechercher dans les catégories déjà chargées
                const filteredCategories = this.categories.filter(category => 
                    category.name.toLowerCase().includes(this.categorySearchTerm.toLowerCase()) ||
                    (category.description && category.description.toLowerCase().includes(this.categorySearchTerm.toLowerCase()))
                );
                
                this.categorySearchResults = filteredCategories;
                this.showCategoryDropdown = filteredCategories.length > 0;
                
                // Si pas de résultats dans les catégories chargées, faire une recherche API
                if (filteredCategories.length === 0) {
                    const data = await window.apiService.getSupplyCategories(null, this.categorySearchTerm, 'all', 1, 20);
                    if (data.success) {
                        this.categorySearchResults = data.data || [];
                        this.showCategoryDropdown = this.categorySearchResults.length > 0;
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la recherche des catégories:', error);
                this.categorySearchResults = [];
                this.showCategoryDropdown = false;
            }
        },
        
        // Sélectionner une catégorie
        selectCategory(category) {
            this.selectedCategory = category;
            this.form.categoryId = category.id;
            this.categorySearchTerm = category.name;
            this.showCategoryDropdown = false;
        },
        
        // Effacer la sélection de catégorie
        clearCategorySelection() {
            this.selectedCategory = null;
            this.form.categoryId = '';
            this.categorySearchTerm = '';
            this.showCategoryDropdown = false;
        },
        
        // Focus sur le champ de recherche des catégories
        onCategorySearchFocus() {
            // Si pas de terme de recherche, afficher toutes les catégories
            if (this.categorySearchTerm.length < 2) {
                this.categorySearchResults = this.categories.slice(0, 20); // Limiter à 20 pour les performances
                this.showCategoryDropdown = this.categorySearchResults.length > 0;
            } else if (this.categorySearchResults.length > 0) {
                this.showCategoryDropdown = true;
            }
        },
        
        // Cacher le dropdown des catégories
        hideCategoryDropdown() {
            setTimeout(() => {
                this.showCategoryDropdown = false;
            }, 200);
        },
        
        // Afficher toutes les catégories
        showAllCategories() {
            this.categorySearchResults = this.categories.slice(0, 50); // Limiter à 50 pour les performances
            this.showCategoryDropdown = this.categorySearchResults.length > 0;
        },
        
        async loadSupplies() {
            this.loading = true;
            try {
                const data = await window.apiService.getSupplies(null, this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.supplies = this.adaptSupplyData(data.data || []);
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.totalPages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux fournitures. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des fournitures', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des fournitures:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux fournitures. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des fournitures: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        // Adapter les données de l'API au format attendu par le composant
        adaptSupplyData(apiData) {
            return apiData.map(supply => ({
                id: supply.id,
                name: supply.name,
                reference: supply.reference,
                oemReference: supply.oemReference || '',
                description: supply.description || '',
                brand: supply.brand || '',
                modelCompatibility: supply.modelCompatibility || [],
                unitPrice: supply.unitPrice || '0.00',
                categoryId: supply.category ? supply.category.id : null,
                categoryName: supply.category ? supply.category.name : 'Aucune catégorie',
                categoryIcon: supply.category ? supply.category.icon : null,
                isActive: supply.isActive !== undefined ? supply.isActive : true,
                createdAt: supply.createdAt,
                updatedAt: supply.updatedAt
            }));
        },
        
        getCategoryName(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.name : 'Catégorie inconnue';
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadSupplies();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadSupplies();
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
            this.loadSupplies();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentSupply = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(supply) {
            this.isEditing = true;
            this.currentSupply = supply;
            this.form = {
                name: supply.name,
                reference: supply.reference,
                oemReference: supply.oemReference || '',
                description: supply.description || '',
                brand: supply.brand || '',
                modelCompatibility: supply.modelCompatibility || [],
                unitPrice: supply.unitPrice || '0.00',
                categoryId: supply.categoryId || '',
                isActive: supply.isActive
            };
            
            // Trouver la catégorie correspondante pour l'affichage
            const category = this.categories.find(c => c.id === supply.categoryId);
            if (category) {
                this.selectedCategory = category;
                this.categorySearchTerm = category.name;
            }
            
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
                reference: '',
                oemReference: '',
                description: '',
                brand: '',
                modelCompatibility: [],
                unitPrice: '0.00',
                categoryId: '',
                isActive: true
            };
            // Reset category search
            this.categorySearchTerm = '';
            this.selectedCategory = null;
            this.categorySearchResults = [];
            this.showCategoryDropdown = false;
        },
        
        async saveSupply() {
            if (!this.form.name || !this.form.reference) {
                this.showNotification('Veuillez saisir le nom et la référence de la fourniture', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let data;
                if (this.isEditing) {
                    data = await window.apiService.updateSupply(this.currentSupply.id, this.form);
                } else {
                    data = await window.apiService.createSupply(this.form);
                }
                
                if (data.success) {
                    this.closeModal();
                    await this.loadSupplies();
                    this.showNotification(
                        this.isEditing ? 'Fourniture modifiée avec succès' : 'Fourniture créée avec succès',
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
        
        confirmDelete(supply) {
            this.supplyToDelete = supply;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.supplyToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async deleteSupply() {
            if (!this.supplyToDelete) return;
            
            this.deleting = true;
            try {
                const data = await window.apiService.deleteSupply(this.supplyToDelete.id);
                
                if (data.success) {
                    this.closeDeleteModal();
                    await this.loadSupplies();
                    this.showNotification('Fourniture supprimée avec succès', 'success');
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
        
        formatPrice(price) {
            const currency = this.getCurrency();
            return window.apiService.formatPrice(price, currency);
        },
        
        getCurrency() {
            return this.currency;
        },
        
        formatModelCompatibility(models) {
            if (!models || models.length === 0) {
                return 'Aucune compatibilité spécifiée';
            }
            return models.join(', ');
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
                <h1 class="section-title">Gestion des Fournitures</h1>
                <p class="page-subtitle">Gérez les fournitures et pièces de rechange de votre parc automobile</p>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher une fourniture..."
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
                    <i class="fas fa-plus"></i> Nouvelle Fourniture
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des fournitures...
            </div>

            <!-- Supplies Grid -->
            <div v-show="hasSupplies" class="parameters-grid">
                <div 
                    v-for="supply in supplies" 
                    :key="supply.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="supply-info">
                            <div class="parameter-key">{{ supply.name }}</div>
                            <div class="supply-reference">{{ supply.reference }}</div>
                        </div>
                        <div :class="['parameter-category', supply.isActive ? 'active' : 'inactive']">
                            {{ supply.isActive ? 'Actif' : 'Inactif' }}
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            <div class="supply-details">
                                <div class="supply-brand" v-if="supply.brand">
                                    <strong>Marque:</strong> {{ supply.brand }}
                                </div>
                                <div class="supply-price">
                                    <strong>Prix unitaire:</strong> {{ formatPrice(supply.unitPrice) }}
                                </div>
                                <div class="supply-category">
                                    <strong>Catégorie:</strong> {{ getCategoryName(supply.categoryId) }}
                                </div>
                            </div>
                        </div>
                        <div class="parameter-description">
                            {{ supply.description || 'Aucune description' }}
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Créé le {{ formatDate(supply.createdAt) }}</div>
                            <div class="parameter-status">
                                <div :class="['status-indicator', supply.isActive ? 'active' : 'inactive']"></div>
                                {{ supply.isActive ? 'Actif' : 'Inactif' }}
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(supply)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="confirmDelete(supply)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} fournitures
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
            <div v-show="!hasSupplies && !loading" class="empty-state">
                <i class="fas fa-boxes"></i>
                <h3>Aucune fourniture trouvée</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucune fourniture ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter une nouvelle fourniture.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter une fourniture
                </button>
            </div>

            <!-- Create/Edit Supply Modal -->
            <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier la fourniture' : 'Nouvelle fourniture' }}</h3>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveSupply">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="supply-name">Nom de la fourniture *</label>
                                    <input 
                                        type="text" 
                                        id="supply-name"
                                        v-model="form.name"
                                        required
                                        placeholder="Ex: Filtre à huile, Plaquettes de frein..."
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="supply-reference">Référence *</label>
                                    <input 
                                        type="text" 
                                        id="supply-reference"
                                        v-model="form.reference"
                                        required
                                        placeholder="Ex: FIL-001, PLA-002..."
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="supply-oem-reference">Référence constructeur</label>
                                    <input 
                                        type="text" 
                                        id="supply-oem-reference"
                                        v-model="form.oemReference"
                                        placeholder="Ex: 1234567890..."
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="supply-brand">Marque</label>
                                    <input 
                                        type="text" 
                                        id="supply-brand"
                                        v-model="form.brand"
                                        placeholder="Ex: Bosch, Valeo, Mann..."
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="supply-category">Catégorie</label>
                                <div class="searchable-select">
                                    <div class="search-input-container">
                                        <input 
                                            type="text" 
                                            id="supply-category"
                                            v-model="categorySearchTerm"
                                            @focus="onCategorySearchFocus"
                                            @blur="hideCategoryDropdown"
                                            @input="searchCategories"
                                            placeholder="Rechercher une catégorie..."
                                        >
                                        <button 
                                            v-if="selectedCategory" 
                                            type="button" 
                                            class="clear-btn"
                                            @click="clearCategorySelection"
                                        >
                                            <i class="fas fa-times"></i>
                                        </button>
                                        <button 
                                            v-if="!selectedCategory && categories.length > 0" 
                                            type="button" 
                                            class="show-all-btn"
                                            @click="showAllCategories"
                                            title="Afficher toutes les catégories"
                                        >
                                            <i class="fas fa-list"></i>
                                        </button>
                                    </div>
                                    
                                    <div v-if="showCategoryDropdown" class="search-dropdown">
                                        <div class="dropdown-header" v-if="categorySearchResults.length > 0">
                                            <small>{{ categorySearchResults.length }} catégorie(s) trouvée(s)</small>
                                        </div>
                                        <div 
                                            v-for="category in categorySearchResults" 
                                            :key="category.id"
                                            class="search-option"
                                            @click="selectCategory(category)"
                                        >
                                            <div class="option-name">{{ category.name }}</div>
                                            <div class="option-code" v-if="category.description">{{ category.description }}</div>
                                        </div>
                                        <div v-if="categorySearchResults.length === 0" class="no-results">
                                            <i class="fas fa-search"></i>
                                            Aucune catégorie trouvée
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="supply-unit-price">Prix unitaire ({{ currency }})</label>
                                <input 
                                    type="number" 
                                    id="supply-unit-price"
                                    v-model="form.unitPrice"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="supply-description">Description</label>
                                <textarea 
                                    id="supply-description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description de la fourniture..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="supply-active">
                                    <input 
                                        type="checkbox" 
                                        id="supply-active"
                                        v-model="form.isActive"
                                    >
                                    Fourniture active
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
                            @click="saveSupply"
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
                        <p>Êtes-vous sûr de vouloir supprimer cette fourniture ?</p>
                        <p><strong>{{ supplyToDelete?.name }}</strong> ({{ supplyToDelete?.reference }})</p>
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
                            @click="deleteSupply"
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

// Initialiser l'application Vue.js
// Exposer le composant globalement
window.SupplyCrud = SupplyCrud;
