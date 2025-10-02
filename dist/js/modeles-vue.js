/**
 * Impact Auto - Modèles Vue.js
 * Composant CRUD pour la gestion des modèles de véhicules
 */

// Vérifier que Vue.js est disponible
if (typeof Vue === 'undefined') {
    console.error('Vue.js n\'est pas chargé. Veuillez inclure Vue.js avant ce script.');
}

// Définir le composant ModeleCrud
const ModeleCrud = {
    name: 'ModeleCrud',
    
    data() {
        return {
            modeles: [],
            marques: [], // Liste des marques pour le select
            marqueSearchTerm: '', // Terme de recherche pour les marques
            marqueSearchResults: [], // Résultats de recherche des marques
            showMarqueDropdown: false, // Afficher le dropdown des marques
            selectedMarque: null, // Marque sélectionnée
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentModele: null,
            modeleToDelete: null,
            
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
                code: '',
                brandId: '',
                yearStart: new Date().getFullYear(),
                yearEnd: new Date().getFullYear() + 1,
                description: '',
                isActive: true
            },
            
        }
    },
    
    computed: {
        filteredModeles() {
            // Since we're now using server-side pagination, we return the modeles as-is
            // The filtering is done on the server
            return this.modeles;
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
        
        hasModeles() {
            return this.modeles && this.modeles.length > 0;
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
        
        marqueSearchTerm() {
            // Debounce search for marques
            clearTimeout(this.marqueSearchTimeout);
            this.marqueSearchTimeout = setTimeout(() => {
                this.searchMarques();
            }, 300);
        }
    },
    
    async mounted() {
        await this.loadMarques();
        await this.loadModeles();
    },
    
    methods: {
        async loadMarques() {
            try {
                const data = await window.apiService.getMarques(null, '', 'all', 1, 100); // Récupérer toutes les marques pour le select
                if (data.success) {
                    this.marques = data.data || [];
                } else {
                    console.error('Erreur lors du chargement des marques:', data.message);
                    this.marques = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des marques:', error);
                this.marques = [];
            }
        },
        
        // Recherche de marques avec debounce
        async searchMarques() {
            if (this.marqueSearchTerm.length < 2) {
                this.marqueSearchResults = [];
                this.showMarqueDropdown = false;
                return;
            }
            
            try {
                const data = await window.apiService.getMarques(null, this.marqueSearchTerm, 'all', 1, 20);
                if (data.success) {
                    this.marqueSearchResults = data.data || [];
                    // Ne pas ouvrir automatiquement le dropdown, il sera ouvert par le focus
                }
            } catch (error) {
                console.error('Erreur lors de la recherche des marques:', error);
                this.marqueSearchResults = [];
                this.showMarqueDropdown = false;
            }
        },
        
        // Sélectionner une marque
        selectMarque(marque) {
            this.selectedMarque = marque;
            this.form.brandId = marque.id;
            this.marqueSearchTerm = marque.name;
            this.showMarqueDropdown = false;
        },
        
        // Effacer la sélection de marque
        clearMarqueSelection() {
            this.selectedMarque = null;
            this.form.brandId = '';
            this.marqueSearchTerm = '';
            this.showMarqueDropdown = false;
        },
        
        // Focus sur le champ de recherche des marques
        onMarqueSearchFocus() {
            this.showMarqueDropdown = true;
            if (this.marqueSearchTerm.length >= 2) {
                this.searchMarques();
            }
        },
        
        // Cacher le dropdown des marques
        hideMarqueDropdown() {
            setTimeout(() => {
                this.showMarqueDropdown = false;
            }, 200);
        },
        
        async loadModeles() {
            this.loading = true;
            try {
                const data = await window.apiService.getModeles(null, this.searchTerm, null, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.modeles = this.adaptModeleData(data.data || []);
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.totalPages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux modèles. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des modèles', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des modèles:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux modèles. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des modèles: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        // Adapter les données de l'API au format attendu par le composant
        adaptModeleData(apiData) {
            return apiData.map(modele => ({
                id: modele.id,
                name: modele.name,
                code: modele.code || modele.name.substring(0, 3).toUpperCase(),
                marqueId: modele.brand ? modele.brand.id : null,
                marqueName: modele.brand ? modele.brand.name : 'Marque inconnue',
                yearStart: modele.yearStart || null,
                yearEnd: modele.yearEnd || null,
                description: modele.description || '',
                isActive: modele.isActive !== undefined ? modele.isActive : true,
                createdAt: modele.createdAt,
                updatedAt: modele.updatedAt
            }));
        },
        
        getMarqueName(marqueId) {
            const marque = this.marques.find(m => m.id === marqueId);
            return marque ? marque.name : 'Marque inconnue';
        },
        
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadModeles();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadModeles();
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
            this.loadModeles();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentModele = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(modele) {
            this.isEditing = true;
            this.currentModele = modele;
            this.form = {
                name: modele.name,
                code: modele.code || '',
                brandId: modele.marqueId,
                yearStart: modele.yearStart || '',
                yearEnd: modele.yearEnd || '',
                description: modele.description || '',
                isActive: modele.isActive
            };
            
            // Trouver la marque correspondante pour l'affichage
            const marque = this.marques.find(m => m.id === modele.marqueId);
            if (marque) {
                this.selectedMarque = marque;
                this.marqueSearchTerm = marque.name;
                this.showMarqueDropdown = false; // Ne pas ouvrir le dropdown en mode édition
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
                code: '',
                brandId: '',
                yearStart: new Date().getFullYear(),
                yearEnd: new Date().getFullYear() + 1,
                description: '',
                isActive: true
            };
            // Reset marque search
            this.marqueSearchTerm = '';
            this.selectedMarque = null;
            this.marqueSearchResults = [];
            this.showMarqueDropdown = false;
        },
        
        async saveModele() {
            if (!this.form.name || !this.form.brandId || !this.form.yearStart || !this.form.yearEnd) {
                this.showNotification('Veuillez saisir le nom du modèle, sélectionner une marque et renseigner les années de début et fin', 'error');
                return;
            }
            
            // Validation des années
            if (parseInt(this.form.yearStart) > parseInt(this.form.yearEnd)) {
                this.showNotification('L\'année de début ne peut pas être supérieure à l\'année de fin', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let data;
                if (this.isEditing) {
                    data = await window.apiService.updateModele(this.currentModele.id, this.form);
                } else {
                    data = await window.apiService.createModele(this.form);
                }
                
                if (data.success) {
                    this.closeModal();
                    await this.loadModeles();
                    this.showNotification(
                        this.isEditing ? 'Modèle modifié avec succès' : 'Modèle créé avec succès',
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
        
        confirmDelete(modele) {
            this.modeleToDelete = modele;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.modeleToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async deleteModele() {
            if (!this.modeleToDelete) return;
            
            this.deleting = true;
            try {
                const data = await window.apiService.deleteModele(this.modeleToDelete.id);
                
                if (data.success) {
                    this.closeDeleteModal();
                    await this.loadModeles();
                    this.showNotification('Modèle supprimé avec succès', 'success');
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
        
        formatYearRange(yearStart, yearEnd) {
            if (yearStart && yearEnd) {
                return `${yearStart} - ${yearEnd}`;
            } else if (yearStart) {
                return `Depuis ${yearStart}`;
            } else {
                return 'Non spécifié';
            }
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
                <h1 class="section-title">Gestion des Modèles</h1>
                <p class="page-subtitle">Gérez les modèles de véhicules de votre parc automobile</p>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher un modèle..."
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
                    <i class="fas fa-plus"></i> Nouveau Modèle
                </button>
            </div>


            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des modèles...
            </div>

            <!-- Modeles Grid -->
            <div v-show="hasModeles" class="parameters-grid">
                <div 
                    v-for="modele in modeles" 
                    :key="modele.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="modele-info">
                            <div class="parameter-key">{{ modele.name }}</div>
                            <div class="modele-marque">{{ getMarqueName(modele.marqueId) }}</div>
                        </div>
                        <div :class="['parameter-category', modele.isActive ? 'active' : 'inactive']">
                            {{ modele.isActive ? 'Actif' : 'Inactif' }}
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            <div class="modele-details">
                                <div class="modele-code" v-if="modele.code">
                                    <strong>Code:</strong> {{ modele.code }}
                                </div>
                                <div class="modele-years">
                                    <strong>Période:</strong> {{ formatYearRange(modele.yearStart, modele.yearEnd) }}
                                </div>
                            </div>
                        </div>
                        <div class="parameter-description">
                            {{ modele.description || 'Aucune description' }}
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Créé le {{ formatDate(modele.createdAt) }}</div>
                            <div class="parameter-status">
                                <div :class="['status-indicator', modele.isActive ? 'active' : 'inactive']"></div>
                                {{ modele.isActive ? 'Actif' : 'Inactif' }}
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(modele)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="confirmDelete(modele)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} modèles
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
            <div v-show="!hasModeles && !loading" class="empty-state">
                <i class="fas fa-car-side"></i>
                <h3>Aucun modèle trouvé</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucun modèle ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter un nouveau modèle.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter un modèle
                </button>
            </div>

            <!-- Create/Edit Modele Modal -->
            <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le modèle' : 'Nouveau modèle' }}</h3>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveModele">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="modele-name">Nom du modèle *</label>
                                    <input 
                                        type="text" 
                                        id="modele-name"
                                        v-model="form.name"
                                        required
                                        placeholder="Ex: 308, Clio, Série 3..."
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="modele-code">Code du modèle</label>
                                    <input 
                                        type="text" 
                                        id="modele-code"
                                        v-model="form.code"
                                        placeholder="Ex: 308, CLIO, S3..."
                                        maxlength="10"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="modele-marque">Marque *</label>
                                <div class="searchable-select">
                                    <div class="search-input-container">
                                        <input 
                                            type="text" 
                                            id="modele-marque"
                                            v-model="marqueSearchTerm"
                                            @focus="onMarqueSearchFocus"
                                            @blur="hideMarqueDropdown"
                                            @input="searchMarques"
                                            placeholder="Rechercher une marque..."
                                            required
                                        >
                                        <button 
                                            v-if="selectedMarque" 
                                            type="button" 
                                            class="clear-btn"
                                            @click="clearMarqueSelection"
                                        >
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    
                                    <div v-if="showMarqueDropdown && marqueSearchResults.length > 0" class="search-dropdown">
                                        <div 
                                            v-for="marque in marqueSearchResults" 
                                            :key="marque.id"
                                            class="search-option"
                                            @click="selectMarque(marque)"
                                        >
                                            <div class="option-name">{{ marque.name }}</div>
                                            <div class="option-code">{{ marque.code }}</div>
                                        </div>
                                        <div v-if="marqueSearchResults.length === 0" class="no-results">
                                            Aucune marque trouvée
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="modele-year-start">Année de début *</label>
                                    <input 
                                        type="number" 
                                        id="modele-year-start"
                                        v-model="form.yearStart"
                                        placeholder="2019"
                                        min="1900"
                                        :max="new Date().getFullYear() + 1"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="modele-year-end">Année de fin *</label>
                                    <input 
                                        type="number" 
                                        id="modele-year-end"
                                        v-model="form.yearEnd"
                                        placeholder="2025"
                                        min="1900"
                                        :max="new Date().getFullYear() + 10"
                                        required
                                    >
                                </div>
                            </div>
                            
                            
                            
                            <div class="form-group">
                                <label for="modele-description">Description</label>
                                <textarea 
                                    id="modele-description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description du modèle..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="modele-active">
                                    <input 
                                        type="checkbox" 
                                        id="modele-active"
                                        v-model="form.isActive"
                                    >
                                    Modèle actif
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
                            @click="saveModele"
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
                        <p>Êtes-vous sûr de vouloir supprimer ce modèle ?</p>
                        <p><strong>{{ modeleToDelete?.name }}</strong> ({{ getMarqueName(modeleToDelete?.marqueId) }})</p>
                        <p class="text-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Cette action est irréversible et affectera tous les véhicules de ce modèle.
                        </p>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="deleteModele"
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
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que Vue.js est disponible
    if (typeof Vue === 'undefined') {
        console.error('Vue.js n\'est pas chargé. Veuillez inclure Vue.js avant ce script.');
        return;
    }

    // Créer l'application Vue
    const app = Vue.createApp({
        components: {
            ModeleCrud
        },
        template: `
            <div class="main-content">
                <ModeleCrud />
            </div>
        `
    });

    // Monter l'application
    app.mount('#app');
});
