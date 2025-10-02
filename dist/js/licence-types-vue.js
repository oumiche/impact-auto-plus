/**
 * Impact Auto - Licence Types Vue.js
 * Version compilée du composant LicenceTypeCrud pour une utilisation simple
 */

// Vérifier que Vue.js est disponible
if (typeof window.Vue === 'undefined') {
    console.error('Vue.js n\'est pas chargé. Veuillez inclure Vue.js avant ce script.');
}

// Définir le composant LicenceTypeCrud
const LicenceTypeCrud = {
    name: 'LicenceTypeCrud',
    
    data() {
        return {
            licenceTypes: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentLicenceType: null,
            licenceTypeToDelete: null,
            
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
                code: '',
                name: '',
                description: '',
                isActive: true
            }
        }
    },
    
    computed: {
        filteredLicenceTypes() {
            // Since we're now using server-side pagination, we return the licenceTypes as-is
            // The filtering is done on the server
            return this.licenceTypes;
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
        
        hasLicenceTypes() {
            return this.licenceTypes && this.licenceTypes.length > 0;
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
        await this.loadLicenceTypes();
    },
    
    methods: {
        async loadLicenceTypes() {
            this.loading = true;
            try {
                const data = await window.apiService.getLicenseTypes(this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.licenceTypes = data.data || [];
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.totalPages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux types de permis. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des types de permis', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types de permis:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux types de permis. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des types de permis: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadLicenceTypes();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadLicenceTypes();
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
            this.loadLicenceTypes();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentLicenceType = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(licenceType) {
            this.isEditing = true;
            this.currentLicenceType = licenceType;
            this.form = {
                code: licenceType.code || '',
                name: licenceType.name || '',
                description: licenceType.description || '',
                isActive: licenceType.isActive !== undefined ? licenceType.isActive : true
            };
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        resetForm() {
            this.form = {
                code: '',
                name: '',
                description: '',
                isActive: true
            };
        },
        
        async saveLicenceType() {
            if (!this.form.name) {
                this.showNotification('Veuillez saisir le nom du type de permis', 'error');
                return;
            }
            
            if (!this.form.code) {
                this.showNotification('Veuillez saisir le code du type de permis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.updateLicenseType(this.currentLicenceType.id, this.form);
                } else {
                    response = await window.apiService.createLicenseType(this.form);
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    await this.loadLicenceTypes();
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
        
        deleteLicenceType(licenceType) {
            this.licenceTypeToDelete = licenceType;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.licenceTypeToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async confirmDelete() {
            if (!this.licenceTypeToDelete) return;
            
            this.deleting = true;
            try {
                const response = await window.apiService.deleteLicenseType(this.licenceTypeToDelete.id);
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    await this.loadLicenceTypes();
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
        
        getStatusLabel(isActive) {
            return isActive ? 'Actif' : 'Inactif';
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
                <h1 class="section-title">Gestion des Types de Permis</h1>
                <p class="page-subtitle">Gérez les types de permis et leurs propriétés</p>
            </div>

            <!-- Filtres et recherche -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        v-model="searchTerm" 
                        type="text" 
                        placeholder="Rechercher un type de permis..."
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
                <i class="fas fa-spinner fa-spin"></i> Chargement des types de permis...
            </div>

            <!-- Licence Types Grid -->
            <div v-show="hasLicenceTypes" class="parameters-grid">
                <div 
                    v-for="licenceType in filteredLicenceTypes" 
                    :key="licenceType.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="parameter-key">{{ licenceType.name }}</div>
                        <div class="parameter-category">{{ licenceType.code }}</div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            {{ licenceType.description || 'Aucune description' }}
                        </div>
                        <div class="parameter-description">
                            Type de permis
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Permis</div>
                            <div class="parameter-status">
                                <div :class="['status-indicator', licenceType.isActive ? 'active' : 'inactive']"></div>
                                {{ getStatusLabel(licenceType.isActive) }}
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(licenceType)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="deleteLicenceType(licenceType)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} types de permis
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
            <div v-show="!hasLicenceTypes && !loading" class="empty-state">
                <i class="fas fa-id-card"></i>
                <h3>Aucun type de permis trouvé</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucun type de permis ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter un nouveau type de permis.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter un type
                </button>
            </div>

            <!-- Create/Edit Licence Type Modal -->
            <div v-if="showModal" class="modal show" @click.self="closeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le type de permis' : 'Nouveau type de permis' }}</h3>
                        <button @click="closeModal" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveLicenceType">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="licence-type-code">Code *</label>
                                    <input 
                                        type="text" 
                                        id="licence-type-code"
                                        v-model="form.code"
                                        placeholder="Ex: A, B, C..."
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="licence-type-name">Nom *</label>
                                    <input 
                                        type="text" 
                                        id="licence-type-name"
                                        v-model="form.name"
                                        placeholder="Ex: Permis B, Permis A..."
                                        required
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="licence-type-description">Description</label>
                                <textarea 
                                    id="licence-type-description"
                                    v-model="form.description"
                                    placeholder="Description du type de permis..."
                                    rows="3"
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="form.isActive"
                                    >
                                    <span class="checkmark"></span>
                                    Actif
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
                        <p>Êtes-vous sûr de vouloir supprimer ce type de permis ?</p>
                        <p><strong>{{ licenceTypeToDelete?.name }}</strong> ({{ licenceTypeToDelete?.code }})</p>
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
window.LicenceTypeCrud = LicenceTypeCrud;
