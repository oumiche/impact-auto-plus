// Vérifier que Vue.js est disponible
if (typeof Vue === 'undefined') {
    console.error('Vue.js n\'est pas chargé. Veuillez inclure Vue.js avant ce script.');
}

console.log('VehicleColorCrud script loaded');

// Définir le composant VehicleColorCrud
const VehicleColorCrud = {
    name: 'VehicleColorCrud',
    
    data() {
        return {
            colors: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentColor: null,
            colorToDelete: null,
            form: {
                name: '',
                hexCode: '',
                description: ''
            },
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0
        }
    },

    computed: {
        visiblePages() {
            const pages = [];
            const start = Math.max(1, this.currentPage - 2);
            const end = Math.min(this.totalPages, this.currentPage + 2);
            
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
            }, 300);
        }
    },

    mounted() {
        console.log('VehicleColorCrud mounted');
        console.log('API Service available:', typeof window.apiService);
        console.log('Component data:', this.$data);
        this.loadColors();
    },

    methods: {
        async loadColors() {
            this.loading = true;
            try {
                // Test avec des données mockées si l'API n'est pas disponible
                if (!window.apiService) {
                    console.log('API Service non disponible, utilisation de données mockées');
                    this.colors = [
                        {
                            id: 1,
                            name: 'Rouge',
                            hexCode: '#FF0000',
                            description: 'Rouge vif',
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: 2,
                            name: 'Bleu',
                            hexCode: '#0000FF',
                            description: 'Bleu marine',
                            createdAt: new Date().toISOString()
                        }
                    ];
                    this.totalItems = 2;
                    this.totalPages = 1;
                    this.loading = false;
                    return;
                }
                
                console.log('Calling API with searchTerm:', this.searchTerm, 'page:', this.currentPage);
                const data = await window.apiService.getVehicleColors(this.searchTerm, 'all', this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.colors = data.data.map(this.adaptColorData);
                    this.totalItems = data.pagination.total;
                    this.totalPages = data.pagination.totalPages;
                } else {
                    this.showNotification('Erreur lors du chargement des couleurs: ' + data.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des couleurs:', error);
                this.showNotification('Erreur lors du chargement des couleurs', 'error');
            } finally {
                this.loading = false;
            }
        },

        adaptColorData(color) {
            return {
                id: color.id,
                name: color.name,
                hexCode: color.hexCode,
                description: color.description,
                createdAt: color.createdAt
            };
        },

        // Pagination
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadColors();
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

        onSearchChange() {
            console.log('onSearchChange called, searchTerm:', this.searchTerm);
            this.currentPage = 1; // Reset to first page when searching
            this.loadColors();
        },

        // Debug method
        debugModal() {
            console.log('DEBUG: Forcing modal display');
            console.log('DEBUG: showModal before:', this.showModal);
            console.log('DEBUG: isEditing before:', this.isEditing);
            
            this.showModal = true;
            this.isEditing = false;
            this.resetForm();
            
            console.log('DEBUG: showModal after:', this.showModal);
            console.log('DEBUG: isEditing after:', this.isEditing);
            
            // Créer la modal manuellement si elle n'existe pas
            this.createModalManually();
            
            // Forcer le rendu
            this.$forceUpdate();
            
            // Vérifier après un délai
            setTimeout(() => {
                console.log('DEBUG: Checking for modal in DOM...');
                const modal = document.querySelector('.modal-overlay');
                console.log('DEBUG: Modal after force update:', modal);
                
                if (modal) {
                    console.log('DEBUG: Modal found, forcing visibility');
                    console.log('DEBUG: Modal position:', modal.getBoundingClientRect());
                    console.log('DEBUG: Modal parent:', modal.parentElement);
                    console.log('DEBUG: Modal computed styles:', {
                        position: window.getComputedStyle(modal).position,
                        top: window.getComputedStyle(modal).top,
                        left: window.getComputedStyle(modal).left,
                        width: window.getComputedStyle(modal).width,
                        height: window.getComputedStyle(modal).height,
                        transform: window.getComputedStyle(modal).transform
                    });
                    
                    modal.style.display = 'flex';
                    modal.style.visibility = 'visible';
                    modal.style.opacity = '1';
                    modal.style.zIndex = '9999';
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.width = '100%';
                    modal.style.height = '100%';
                    console.log('DEBUG: Modal forced to be visible');
                } else {
                    console.error('DEBUG: Modal still not found in DOM!');
                    console.log('DEBUG: All elements with modal class:', document.querySelectorAll('[class*="modal"]'));
                }
            }, 100);
        },



        // Modal management
        openCreateModal() {
            console.log('openCreateModal called, showModal before:', this.showModal);
            this.isEditing = false;
            this.currentColor = null;
            this.resetForm();
            this.showModal = true;
            console.log('openCreateModal called, showModal after:', this.showModal);
        },

        openEditModal(color) {
            this.isEditing = true;
            this.currentColor = color;
            this.form = {
                name: color.name,
                hexCode: color.hexCode || '',
                description: color.description || ''
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
                hexCode: '#007bff',
                description: ''
            };
            // Initialiser le color picker avec la couleur par défaut
            this.$nextTick(() => {
                const colorPicker = document.getElementById('color-hex');
                if (colorPicker) {
                    colorPicker.value = '#007bff';
                }
            });
        },

        // CRUD operations
        async saveColor() {
            if (!this.form.name) {
                this.showNotification('Veuillez saisir le nom de la couleur', 'error');
                return;
            }
            
            this.saving = true;
            try {
                // Test avec des données mockées si l'API n'est pas disponible
                if (!window.apiService) {
                    console.log('API Service non disponible, simulation de sauvegarde');
                    const newColor = {
                        id: Date.now(),
                        name: this.form.name,
                        hexCode: this.form.hexCode,
                        description: this.form.description,
                        createdAt: new Date().toISOString()
                    };
                    
                    if (this.isEditing) {
                        const index = this.colors.findIndex(c => c.id === this.currentColor.id);
                        if (index !== -1) {
                            this.colors[index] = { ...this.colors[index], ...newColor };
                        }
                        this.showNotification('Couleur modifiée avec succès (simulation)', 'success');
                    } else {
                        this.colors.unshift(newColor);
                        this.showNotification('Couleur créée avec succès (simulation)', 'success');
                    }
                    
                    this.closeModal();
                    this.saving = false;
                    return;
                }
                
                let data;
                if (this.isEditing) {
                    data = await window.apiService.updateVehicleColor(this.currentColor.id, this.form);
                } else {
                    data = await window.apiService.createVehicleColor(this.form);
                }
                
                if (data.success) {
                    this.showNotification(data.message, 'success');
                    this.closeModal();
                    this.loadColors();
                } else {
                    this.showNotification('Erreur: ' + data.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            } finally {
                this.saving = false;
            }
        },

        confirmDelete(color) {
            console.log('confirmDelete called', color);
            console.log('showDeleteModal before:', this.showDeleteModal);
            this.colorToDelete = color;
            this.showDeleteModal = true;
            console.log('showDeleteModal after:', this.showDeleteModal);
        },

        closeDeleteModal() {
            this.showDeleteModal = false;
            this.colorToDelete = null;
        },

        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },

        async deleteColor() {
            if (!this.colorToDelete) return;
            
            this.deleting = true;
            try {
                // Test avec des données mockées si l'API n'est pas disponible
                if (!window.apiService) {
                    console.log('API Service non disponible, simulation de suppression');
                    const index = this.colors.findIndex(c => c.id === this.colorToDelete.id);
                    if (index !== -1) {
                        this.colors.splice(index, 1);
                    }
                    this.showNotification('Couleur supprimée avec succès (simulation)', 'success');
                    this.closeDeleteModal();
                    this.deleting = false;
                    return;
                }
                
                const data = await window.apiService.deleteVehicleColor(this.colorToDelete.id);
                
                if (data.success) {
                    this.showNotification(data.message, 'success');
                    this.closeDeleteModal();
                    this.loadColors();
                } else {
                    this.showNotification('Erreur: ' + data.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            } finally {
                this.deleting = false;
            }
        },

        // Utilities
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        showNotification(message, type = 'info') {
            // Créer le conteneur s'il n'existe pas
            let container = document.querySelector('.notification-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container';
                document.body.appendChild(container);
            }

            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            const icon = type === 'success' ? 'check-circle' : 
                       type === 'error' ? 'exclamation-circle' : 
                       type === 'warning' ? 'exclamation-triangle' : 'info-circle';
            
            notification.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            `;
            
            container.appendChild(notification);
            
            // Supprimer la notification après 5 secondes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        },

        // Méthodes pour le color picker
        updateColorPreview(event) {
            this.form.hexCode = event.target.value;
        },

        updateColorFromText(event) {
            const value = event.target.value;
            // Valider le format hexadécimal
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                this.form.hexCode = value;
                // Synchroniser le color picker
                const colorPicker = document.getElementById('color-hex');
                if (colorPicker) {
                    colorPicker.value = value;
                }
            }
        }
    },
    
    template: `
        <div class="parameter-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Couleurs</h1>
                <p class="page-subtitle">Gérez les couleurs disponibles pour les véhicules</p>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher une couleur..."
                    >
                </div>
                
                <button class="btn btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Nouvelle Couleur
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des couleurs...
            </div>

            <!-- Colors Grid -->
            <div v-else-if="colors.length > 0" class="parameters-grid">
                <div 
                    v-for="color in colors" 
                    :key="color.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="color-preview" :style="{ backgroundColor: color.hexCode || '#cccccc' }">
                            <i v-if="!color.hexCode" class="fas fa-palette"></i>
                        </div>
                        <div class="parameter-key">{{ color.name }}</div>
                        <div class="parameter-category">
                            Couleur véhicule
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            <div class="color-info">
                                <div v-if="color.hexCode" class="hex-code">
                                    <span class="hex-label">Code hex:</span>
                                    <span class="hex-value">{{ color.hexCode }}</span>
                                </div>
                                <div class="color-description">
                                    {{ color.description || 'Aucune description' }}
                                </div>
                            </div>
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Créée le {{ formatDate(color.createdAt) }}</div>
                            <div class="parameter-status">
                                <div class="status-indicator active"></div>
                                Active
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(color)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="confirmDelete(color)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} couleurs
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
            <div v-else-if="colors.length === 0" class="empty-state">
                <i class="fas fa-palette"></i>
                <h3>Aucune couleur trouvée</h3>
                <p v-if="searchTerm">
                    Aucune couleur ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter une nouvelle couleur.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter une couleur
                </button>
            </div>

            <!-- Create/Edit Color Modal -->
            <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier la couleur' : 'Nouvelle couleur' }}</h3>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveColor">
                            <div class="form-group">
                                <label for="color-name">Nom de la couleur *</label>
                                <input 
                                    type="text" 
                                    id="color-name"
                                    v-model="form.name"
                                    required
                                    placeholder="Ex: Rouge, Bleu, Blanc..."
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="color-hex">Couleur</label>
                                <div class="color-input-group">
                                    <input 
                                        type="color" 
                                        id="color-hex"
                                        v-model="form.hexCode"
                                        @input="updateColorPreview"
                                    >
                                    <input 
                                        type="text" 
                                        id="color-hex-text"
                                        v-model="form.hexCode"
                                        placeholder="#FF0000"
                                        pattern="^#[0-9A-Fa-f]{6}$"
                                        title="Format: #RRGGBB (ex: #FF0000)"
                                        @input="updateColorFromText"
                                    >
                                    <div class="color-preview-small" :style="{ backgroundColor: form.hexCode || '#cccccc' }">
                                        <i class="fas fa-palette"></i>
                                    </div>
                                </div>
                                <small class="form-help">Utilisez le sélecteur de couleur ou saisissez un code hexadécimal</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="color-description">Description</label>
                                <textarea 
                                    id="color-description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description optionnelle de la couleur..."
                                ></textarea>
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
                            @click="saveColor"
                            :disabled="saving"
                        >
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ saving ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Créer') }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div :class="['modal', { show: showDeleteModal }]" @click="closeDeleteModalOnOverlay">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Confirmer la suppression</h3>
                        <button class="modal-close" @click="closeDeleteModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="delete-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Êtes-vous sûr de vouloir supprimer la couleur <strong>{{ colorToDelete?.name }}</strong> ?</p>
                            <p class="text-muted">Cette action est irréversible.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="deleteColor"
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
    module.exports = VehicleColorCrud;
}

// Enregistrer le composant globalement pour Vue
if (typeof window !== 'undefined' && window.Vue) {
    window.VehicleColorCrud = VehicleColorCrud;
}
