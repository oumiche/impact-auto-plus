/**
 * Impact Auto - Paramètres Vue.js
 * Version compilée du composant ParameterCrud pour une utilisation simple
 */

// Vérifier que Vue.js est disponible
if (typeof Vue === 'undefined') {
    console.error('Vue.js n\'est pas chargé. Veuillez inclure Vue.js avant ce script.');
}

// Définir le composant ParameterCrud
const ParameterCrud = {
    name: 'ParameterCrud',
    
    data() {
        return {
            parameters: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentParameter: null,
            parameterToDelete: null,
            
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0,
            
            filters: [
                { value: 'all', label: 'Tous' },
                { value: 'general', label: 'Généraux' },
                { value: 'tenant', label: 'Tenant' },
                { value: 'system', label: 'Système' },
                { value: 'ui', label: 'Interface' },
                { value: 'notification', label: 'Notification' }
            ],
            
            form: {
                key: '',
                value: '',
                type: 'string',
                category: 'general',
                description: '',
                isEditable: true,
                isPublic: false
            }
        }
    },
    
    computed: {
        filteredParameters() {
            // Since we're now using server-side pagination, we return the parameters as-is
            // The filtering is done on the server
            return this.parameters;
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
        
        hasParameters() {
            return this.parameters && this.parameters.length > 0;
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
        await this.loadParameters();
    },
    
    methods: {
        async loadParameters() {
            this.loading = true;
            try {
                const data = await window.apiService.getParameters(null, this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.parameters = data.data || [];
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.totalPages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux paramètres. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des paramètres', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des paramètres:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux paramètres. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des paramètres: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadParameters();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadParameters();
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
            this.loadParameters();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentParameter = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(parameter) {
            this.isEditing = true;
            this.currentParameter = parameter;
            this.form = {
                key: parameter.key,
                value: parameter.value,
                type: parameter.type,
                category: parameter.category,
                description: parameter.description || '',
                isEditable: parameter.isEditable,
                isPublic: parameter.isPublic || false
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
                key: '',
                value: '',
                type: 'string',
                category: 'general',
                description: '',
                isEditable: true,
                isPublic: false
            };
        },
        
        async saveParameter() {
            if (!this.form.key || !this.form.value) {
                this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let data;
                if (this.isEditing) {
                    data = await window.apiService.updateParameter(this.currentParameter.id, this.form);
                } else {
                    data = await window.apiService.createParameter(this.form);
                }
                
                if (data.success) {
                    this.closeModal();
                    await this.loadParameters();
                    this.showNotification(
                        this.isEditing ? 'Paramètre modifié avec succès' : 'Paramètre créé avec succès',
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
        
        confirmDelete(parameter) {
            this.parameterToDelete = parameter;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.parameterToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async deleteParameter() {
            if (!this.parameterToDelete) return;
            
            this.deleting = true;
            try {
                const data = await window.apiService.deleteParameter(this.parameterToDelete.id);
                
                if (data.success) {
                    this.closeDeleteModal();
                    await this.loadParameters();
                    this.showNotification('Paramètre supprimé avec succès', 'success');
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
        
        getCategoryLabel(category) {
            const labels = {
                'general': 'Général',
                'tenant': 'Tenant',
                'system': 'Système',
                'ui': 'Interface',
                'notification': 'Notification'
            };
            return labels[category] || category;
        },
        
        getTypeLabel(type) {
            const labels = {
                'string': 'Texte',
                'integer': 'Entier',
                'float': 'Décimal',
                'boolean': 'Booléen',
                'json': 'JSON'
            };
            return labels[type] || type;
        },
        
        formatValue(value, type) {
            switch (type) {
                case 'boolean':
                    return value === 'true' || value === true ? 'Oui' : 'Non';
                case 'json':
                    try {
                        return JSON.stringify(JSON.parse(value), null, 2);
                    } catch {
                        return value;
                    }
                default:
                    return value;
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
                <h1 class="section-title">Paramètres du Système</h1>
                <p class="page-subtitle">Gérez les paramètres généraux et spécifiques aux tenants</p>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher un paramètre..."
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
                    <i class="fas fa-plus"></i> Nouveau Paramètre
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des paramètres...
            </div>

            <!-- Parameters Grid -->
            <div v-show="hasParameters" class="parameters-grid">
                <div 
                    v-for="parameter in filteredParameters" 
                    :key="parameter.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="parameter-key">{{ parameter.key }}</div>
                        <div :class="['parameter-category', parameter.category]">
                            {{ getCategoryLabel(parameter.category) }}
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            {{ formatValue(parameter.value, parameter.type) }}
                        </div>
                        <div class="parameter-description">
                            {{ parameter.description || 'Aucune description' }}
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">{{ getTypeLabel(parameter.type) }}</div>
                            <div class="parameter-status">
                                <div :class="['status-indicator', parameter.isEditable ? 'active' : 'inactive']"></div>
                                {{ parameter.isEditable ? 'Modifiable' : 'Lecture seule' }}
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(parameter)"
                                :disabled="!parameter.isEditable"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="confirmDelete(parameter)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} paramètres
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
            <div v-show="!hasParameters && !loading" class="empty-state">
                <i class="fas fa-cog"></i>
                <h3>Aucun paramètre trouvé</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucun paramètre ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter un nouveau paramètre.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter un paramètre
                </button>
            </div>

            <!-- Create/Edit Parameter Modal -->
            <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le paramètre' : 'Nouveau paramètre' }}</h3>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveParameter">
                            <div class="form-group">
                                <label for="param-key">Clé du paramètre *</label>
                                <input 
                                    type="text" 
                                    id="param-key"
                                    v-model="form.key"
                                    required
                                    :disabled="isEditing && !currentParameter?.isEditable"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="param-value">Valeur *</label>
                                <input 
                                    type="text" 
                                    id="param-value"
                                    v-model="form.value"
                                    required
                                    :disabled="isEditing && !currentParameter?.isEditable"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="param-type">Type</label>
                                <select id="param-type" v-model="form.type">
                                    <option value="string">Texte</option>
                                    <option value="integer">Entier</option>
                                    <option value="float">Décimal</option>
                                    <option value="boolean">Booléen</option>
                                    <option value="json">JSON</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="param-category">Catégorie</label>
                                <select id="param-category" v-model="form.category">
                                    <option value="general">Général</option>
                                    <option value="tenant">Tenant</option>
                                    <option value="system">Système</option>
                                    <option value="ui">Interface</option>
                                    <option value="notification">Notification</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="param-description">Description</label>
                                <textarea 
                                    id="param-description"
                                    v-model="form.description"
                                    rows="3"
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="param-editable">
                                    <input 
                                        type="checkbox" 
                                        id="param-editable"
                                        v-model="form.isEditable"
                                    >
                                    Paramètre modifiable
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label for="param-public">
                                    <input 
                                        type="checkbox" 
                                        id="param-public"
                                        v-model="form.isPublic"
                                    >
                                    Paramètre public (accessible sans authentification)
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
                            @click="saveParameter"
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
                        <p>Êtes-vous sûr de vouloir supprimer ce paramètre ?</p>
                        <p><strong>{{ parameterToDelete?.key }}</strong></p>
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
                            @click="deleteParameter"
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
            ParameterCrud
        },
        template: `
            <div class="main-content">
                <ParameterCrud />
            </div>
        `
    });

    // Monter l'application
    app.mount('#app');
});
