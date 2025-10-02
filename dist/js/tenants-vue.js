/**
 * Impact Auto - Tenants Vue.js
 * Composant CRUD pour la gestion des tenants
 */

// Vérifier que Vue.js est disponible
if (typeof Vue === 'undefined') {
    console.error('Vue.js n\'est pas chargé. Veuillez inclure Vue.js avant ce script.');
}

// Définir le composant TenantCrud
const TenantCrud = {
    name: 'TenantCrud',
    
    data() {
        return {
            tenants: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentTenant: null,
            tenantToDelete: null,
            
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
                slug: '',
                description: '',
                logoPath: '',
                logoUrl: '',
                logoAltText: '',
                isActive: true
            }
        }
    },
    
    computed: {
        filteredTenants() {
            // Since we're now using server-side pagination, we return the tenants as-is
            // The filtering is done on the server
            return this.tenants;
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
        await this.loadTenants();
    },
    
    methods: {
        async loadTenants() {
            this.loading = true;
            try {
                const data = await window.apiService.getTenants(this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.tenants = this.adaptTenantData(data.data || []);
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.pages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux tenants. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des tenants', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des tenants:', error);
                // Vérifier si c'est une erreur d'authentification
                if (error.message && error.message.includes('401')) {
                    this.showNotification('Vous devez être connecté pour accéder aux tenants. Veuillez vous connecter.', 'error');
                    // Rediriger vers la page de connexion
                    window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des tenants: ' + error.message, 'error');
                }
            } finally {
                this.loading = false;
            }
        },
        
        // Adapter les données de l'API au format attendu par le composant
        adaptTenantData(apiData) {
            return apiData.map(tenant => ({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                description: tenant.description || '',
                logoPath: tenant.logoPath || '',
                logoUrl: tenant.logoUrl || '',
                logoAltText: tenant.logoAltText || '',
                isActive: tenant.isActive !== undefined ? tenant.isActive : true,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt
            }));
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadTenants();
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadTenants();
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
            this.loadTenants();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.currentTenant = null;
            this.resetForm();
            this.showModal = true;
        },
        
        openEditModal(tenant) {
            this.isEditing = true;
            this.currentTenant = tenant;
            this.form = {
                name: tenant.name,
                slug: tenant.slug,
                description: tenant.description || '',
                logoPath: tenant.logoPath || '',
                logoUrl: tenant.logoUrl || '',
                logoAltText: tenant.logoAltText || '',
                isActive: tenant.isActive
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
                slug: '',
                description: '',
                logoPath: '',
                logoUrl: '',
                logoAltText: '',
                isActive: true
            };
        },
        
        // Générer un slug à partir du nom
        generateSlug(name) {
            return name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
                .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
                .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
                .replace(/-+/g, '-') // Remplacer les tirets multiples par un seul
                .trim();
        },
        
        onNameChange() {
            if (!this.isEditing) {
                this.form.slug = this.generateSlug(this.form.name);
            }
        },
        
        async saveTenant() {
            if (!this.form.name) {
                this.showNotification('Veuillez saisir le nom du tenant', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let data;
                let formData = { ...this.form };
                
                // Ne pas envoyer le slug lors de la création (il sera généré automatiquement)
                if (!this.isEditing) {
                    delete formData.slug;
                }
                
                if (this.isEditing) {
                    data = await window.apiService.updateTenant(this.currentTenant.id, formData);
                } else {
                    data = await window.apiService.createTenant(formData);
                }
                
                if (data.success) {
                    this.closeModal();
                    await this.loadTenants();
                    this.showNotification(
                        this.isEditing ? 'Tenant modifié avec succès' : 'Tenant créé avec succès',
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
        
        confirmDelete(tenant) {
            this.tenantToDelete = tenant;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.tenantToDelete = null;
        },
        
        closeDeleteModalOnOverlay(event) {
            if (event.target === event.currentTarget) {
                this.closeDeleteModal();
            }
        },
        
        async deleteTenant() {
            if (!this.tenantToDelete) return;
            
            this.deleting = true;
            try {
                const data = await window.apiService.deleteTenant(this.tenantToDelete.id);
                
                if (data.success) {
                    this.closeDeleteModal();
                    await this.loadTenants();
                    this.showNotification('Tenant supprimé avec succès', 'success');
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
        
        async toggleStatus(tenant) {
            try {
                const data = await window.apiService.toggleTenantStatus(tenant.id, !tenant.isActive);
                
                if (data.success) {
                    await this.loadTenants();
                    this.showNotification(
                        tenant.isActive ? 'Tenant désactivé' : 'Tenant activé',
                        'success'
                    );
                } else {
                    this.showNotification(data.message || 'Erreur lors du changement de statut', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du changement de statut:', error);
                this.showNotification('Erreur lors du changement de statut: ' + error.message, 'error');
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
                <h1 class="section-title">Gestion des Tenants</h1>
                <p class="page-subtitle">Gérez les tenants de votre système multi-tenant</p>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher un tenant..."
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
                    <i class="fas fa-plus"></i> Nouveau Tenant
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des tenants...
            </div>

            <!-- Tenants Grid -->
            <div v-else-if="tenants.length > 0" class="parameters-grid">
                <div 
                    v-for="tenant in tenants" 
                    :key="tenant.id"
                    class="parameter-card"
                >
                    <div class="parameter-header">
                        <div class="tenant-logo">
                            <img v-if="tenant.logoUrl" :src="tenant.logoUrl" :alt="tenant.logoAltText || tenant.name" class="logo-img">
                            <div v-else class="logo-placeholder">
                                {{ tenant.name.charAt(0).toUpperCase() }}
                            </div>
                        </div>
                        <div class="parameter-key">{{ tenant.name }}</div>
                        <div :class="['parameter-category', tenant.isActive ? 'active' : 'inactive']">
                            {{ tenant.isActive ? 'Actif' : 'Inactif' }}
                        </div>
                    </div>
                    
                    <div class="parameter-body">
                        <div class="parameter-value">
                            <div class="tenant-slug" v-if="tenant.slug">
                                <strong>Slug:</strong> {{ tenant.slug }}
                            </div>
                            <div class="tenant-logo-path" v-if="tenant.logoPath">
                                <strong>Chemin logo:</strong> {{ tenant.logoPath }}
                            </div>
                        </div>
                        <div class="parameter-description">
                            {{ tenant.description || 'Aucune description' }}
                        </div>
                        
                        <div class="parameter-meta">
                            <div class="parameter-type">Créé le {{ formatDate(tenant.createdAt) }}</div>
                            <div class="parameter-status">
                                <div :class="['status-indicator', tenant.isActive ? 'active' : 'inactive']"></div>
                                {{ tenant.isActive ? 'Actif' : 'Inactif' }}
                            </div>
                        </div>
                        
                        <div class="parameter-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="openEditModal(tenant)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                :class="['button', 'btn-sm', tenant.isActive ? 'btn-warning' : 'btn-success']"
                                @click="toggleStatus(tenant)"
                            >
                                <i :class="['fas', tenant.isActive ? 'fa-pause' : 'fa-play']"></i>
                                {{ tenant.isActive ? 'Désactiver' : 'Activer' }}
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="confirmDelete(tenant)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} tenants
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
            <div v-else-if="tenants.length === 0" class="empty-state">
                <i class="fas fa-building"></i>
                <h3>Aucun tenant trouvé</h3>
                <p v-if="searchTerm || activeFilter !== 'all'">
                    Aucun tenant ne correspond à vos critères de recherche.
                </p>
                <p v-else>
                    Commencez par ajouter un nouveau tenant.
                </p>
                <button class="button btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i> Ajouter un tenant
                </button>
            </div>

            <!-- Create/Edit Tenant Modal -->
            <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le tenant' : 'Nouveau tenant' }}</h3>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveTenant">
                            <div class="form-group">
                                <label for="tenant-name">Nom du tenant *</label>
                                <input 
                                    type="text" 
                                    id="tenant-name"
                                    v-model="form.name"
                                    @input="onNameChange"
                                    required
                                    placeholder="Ex: Entreprise ABC, Société XYZ..."
                                >
                            </div>
                            
                            <div class="form-group" v-if="isEditing">
                                <label for="tenant-slug">Slug du tenant</label>
                                <input 
                                    type="text" 
                                    id="tenant-slug"
                                    v-model="form.slug"
                                    placeholder="Ex: entreprise-abc, societe-xyz..."
                                    pattern="[a-z0-9-]+"
                                    title="Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"
                                >
                                <small class="form-help" style="color: #666; font-size: 0.875em; margin-top: 5px; display: block;">Le slug est généré automatiquement à partir du nom</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="tenant-description">Description</label>
                                <textarea 
                                    id="tenant-description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description du tenant..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="tenant-logo-path">Chemin du logo</label>
                                <input 
                                    type="text" 
                                    id="tenant-logo-path"
                                    v-model="form.logoPath"
                                    placeholder="/path/to/logo.png"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="tenant-logo-url">URL du logo</label>
                                <input 
                                    type="url" 
                                    id="tenant-logo-url"
                                    v-model="form.logoUrl"
                                    placeholder="https://example.com/logo.png"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="tenant-logo-alt">Texte alternatif du logo</label>
                                <input 
                                    type="text" 
                                    id="tenant-logo-alt"
                                    v-model="form.logoAltText"
                                    placeholder="Logo de l'entreprise"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="tenant-active">
                                    <input 
                                        type="checkbox" 
                                        id="tenant-active"
                                        v-model="form.isActive"
                                    >
                                    Tenant actif
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
                            @click="saveTenant"
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
                        <p>Êtes-vous sûr de vouloir supprimer ce tenant ?</p>
                        <p><strong>{{ tenantToDelete?.name }}</strong></p>
                        <p class="text-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Cette action est irréversible et affectera toutes les données liées à ce tenant.
                        </p>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="deleteTenant"
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
            TenantCrud
        },
        template: `
            <div class="main-content">
                <TenantCrud />
            </div>
        `
    });

    // Monter l'application
    app.mount('#app');
});
