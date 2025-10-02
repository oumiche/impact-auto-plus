/**
 * Impact Auto - User Tenant Permissions Vue Component
 * Gestion des affectations utilisateur-tenant
 */

const { createApp } = Vue;

const UserTenantPermissionCrud = {
    template: `
        <div class="user-tenant-permissions-crud">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <h1 class="section-title">
                        <i class="fas fa-users-cog"></i>
                        Affectations Utilisateur-Tenant
                        <span v-if="isSuperAdmin" class="badge badge-warning" style="margin-left: 10px;">
                            <i class="fas fa-crown"></i> Super Admin
                        </span>
                    </h1>
                    <p class="page-subtitle">
                        {{ isSuperAdmin ? 'Gérer les permissions de tous les utilisateurs sur tous les tenants' : 'Gérer les permissions des utilisateurs sur votre tenant' }}
                    </p>
                </div>
            </div>

            <!-- Filters -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom, email..." 
                        v-model="searchQuery"
                        @input="debounceSearch"
                    >
                </div>
                <div class="filter-buttons">
                    <button 
                        v-for="filter in statusFilters" 
                        :key="filter.value"
                        @click="setActiveFilter(filter.value)"
                        :class="['filter-btn', { active: statusFilter === filter.value }]"
                    >
                        {{ filter.label }}
                    </button>
                </div>
                <div class="search-actions">
                    <button class="button btn-outline" @click="resetFilters">
                        <i class="fas fa-times"></i>
                        Réinitialiser
                    </button>
                    <button class="button btn-primary" @click="openCreateModal">
                        <i class="fas fa-plus"></i>
                        Nouvelle Affectation
                    </button>
                </div>
            </div>

            <!-- Table -->
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            <th>Tenant</th>
                            <th>Permissions</th>
                            <th>Principal</th>
                            <th>Statut</th>
                            <th>Affecté le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="7" class="text-center">
                                <i class="fas fa-spinner fa-spin"></i> Chargement...
                            </td>
                        </tr>
                        <tr v-else-if="permissions.length === 0">
                            <td colspan="7" class="text-center text-muted">
                                Aucune affectation trouvée
                            </td>
                        </tr>
                        <tr v-else v-for="permission in permissions" :key="permission.id">
                            <td>
                                <div class="user-info">
                                    <div class="user-name">{{ permission.user.firstName }} {{ permission.user.lastName }}</div>
                                    <div class="user-email">{{ permission.user.email }}</div>
                                </div>
                            </td>
                            <td>
                                <div class="tenant-info">
                                    <div class="tenant-name">{{ permission.tenant.name }}</div>
                                    <div class="tenant-slug">{{ permission.tenant.slug }}</div>
                                </div>
                            </td>
                            <td>
                                <div class="permissions-list">
                                    <span v-for="perm in permission.permissions" :key="perm" class="permission-tag">
                                        {{ perm }}
                                    </span>
                                    <span v-if="permission.permissions.length === 0" class="text-muted">
                                        Aucune permission
                                    </span>
                                </div>
                            </td>
                            <td>
                                <span v-if="permission.isPrimary" class="badge badge-warning">
                                    <i class="fas fa-star"></i> Principal
                                </span>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <span :class="permission.isActive ? 'badge badge-success' : 'badge badge-danger'">
                                    {{ permission.isActive ? 'Actif' : 'Inactif' }}
                                </span>
                            </td>
                            <td>{{ formatDate(permission.assignedAt) }}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="button btn-primary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" @click="editPermission(permission)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="button btn-danger" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" @click="deletePermission(permission)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination-container" v-if="pagination.totalPages > 1">
                <nav class="pagination" role="navigation">
                    <button 
                        class="pagination-previous" 
                        :disabled="!pagination.hasPrev"
                        @click="changePage(pagination.page - 1)"
                    >
                        <i class="fas fa-chevron-left"></i> Précédent
                    </button>
                    
                    <template v-for="page in visiblePages" :key="page">
                        <button 
                            v-if="page !== '...'"
                            class="pagination-link"
                            :class="{ 'is-current': page === pagination.page }"
                            @click="changePage(page)"
                        >
                            {{ page }}
                        </button>
                        <span v-else class="pagination-ellipsis">...</span>
                    </template>
                    
                    <button 
                        class="pagination-next" 
                        :disabled="!pagination.hasNext"
                        @click="changePage(pagination.page + 1)"
                    >
                        Suivant <i class="fas fa-chevron-right"></i>
                    </button>
                </nav>
            </div>

            <!-- Confirmation Modal -->
            <div v-if="showConfirmation" class="confirmation-overlay" @click.self="closeConfirmation" @keydown.esc="closeConfirmation">
                <div class="confirmation-modal">
                    <div class="confirmation-header">
                        <div class="icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Confirmer la suppression</h3>
                    </div>
                <div class="confirmation-body">
                    <p class="confirmation-message">
                        Êtes-vous sûr de vouloir supprimer cette affectation ? Cette action est irréversible.
                    </p>
                    <div class="confirmation-actions">
                        <button class="confirmation-btn confirmation-btn-cancel" @click="closeConfirmation">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button class="confirmation-btn confirmation-btn-confirm" @click="confirmDelete">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
                </div>
            </div>

            <!-- Create/Edit Modal -->
            <div class="modal" :class="{ 'is-active': showModal }">
                <div class="modal-background" @click="closeModal"></div>
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">
                            {{ editingPermission ? "Modifier l'affectation" : "Nouvelle affectation" }}
                        </p>
                        <button class="delete" @click="closeModal"></button>
                    </header>
                    <section class="modal-card-body">
                        <form @submit.prevent="savePermission">
                            <div class="field">
                                <label class="label">Utilisateur *</label>
                                <div class="control">
                                    <div class="searchable-select">
                                        <div class="select-input" @click="toggleUserDropdown">
                                            <input 
                                                type="text" 
                                                v-model="userSearchQuery" 
                                                @input="searchUsers"
                                                @focus="showUserDropdown = true"
                                                placeholder="Rechercher un utilisateur..."
                                                class="select-search-input"
                                            >
                                            <i class="fas fa-chevron-down select-arrow"></i>
                                        </div>
                                        <div class="select-dropdown" v-show="showUserDropdown">
                                            <div class="select-options">
                                                <div 
                                                    v-for="user in filteredUsers" 
                                                    :key="user.id" 
                                                    @click="selectUser(user)"
                                                    class="select-option"
                                                    :class="{ selected: form.userId === user.id }"
                                                >
                                                    {{ user.firstName }} {{ user.lastName }} ({{ user.email }})
                                                </div>
                                                <div v-if="filteredUsers.length === 0" class="select-no-results">
                                                    Aucun utilisateur trouvé
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="field">
                                <label class="label">Tenant *</label>
                                <div class="control">
                                    <div class="searchable-select">
                                        <div class="select-input" @click="toggleTenantDropdown">
                                            <input 
                                                type="text" 
                                                v-model="tenantSearchQuery" 
                                                @input="searchTenants"
                                                @focus="showTenantDropdown = true"
                                                placeholder="Rechercher un tenant..."
                                                class="select-search-input"
                                            >
                                            <i class="fas fa-chevron-down select-arrow"></i>
                                        </div>
                                        <div class="select-dropdown" v-show="showTenantDropdown">
                                            <div class="select-options">
                                                <div 
                                                    v-for="tenant in filteredTenants" 
                                                    :key="tenant.id" 
                                                    @click="selectTenant(tenant)"
                                                    class="select-option"
                                                    :class="{ selected: form.tenantId === tenant.id }"
                                                >
                                                    {{ tenant.name }} ({{ tenant.slug }})
                                                </div>
                                                <div v-if="filteredTenants.length === 0" class="select-no-results">
                                                    Aucun tenant trouvé
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="field">
                                <label class="label">Permissions</label>
                                <div class="control">
                                    <div class="permissions-grid">
                                        <label v-for="permission in availablePermissions" :key="permission" class="checkbox">
                                            <input 
                                                type="checkbox" 
                                                :value="permission"
                                                v-model="form.permissions"
                                            >
                                            {{ permission }}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="field">
                                <label class="checkbox">
                                    <input type="checkbox" v-model="form.isPrimary">
                                    Tenant principal
                                </label>
                            </div>

                            <div class="field">
                                <label class="checkbox">
                                    <input type="checkbox" v-model="form.isActive">
                                    Actif
                                </label>
                            </div>

                            <div class="field">
                                <label class="label">Notes</label>
                                <div class="control">
                                    <textarea 
                                        class="textarea" 
                                        v-model="form.notes"
                                        placeholder="Notes optionnelles..."
                                        rows="3"
                                    ></textarea>
                                </div>
                            </div>
                        </form>
                    </section>
                    <footer class="modal-card-foot">
                        <button class="button is-primary" @click="savePermission" :disabled="saving">
                            <i class="fas fa-save" v-if="!saving"></i>
                            <i class="fas fa-spinner fa-spin" v-else></i>
                            {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
                        </button>
                        <button class="button" @click="closeModal">Annuler</button>
                    </footer>
                </div>
            </div>

            <!-- Notification Container -->
            <div class="notification-container" id="notification-container"></div>
        </div>
    `,

    data() {
        return {
            permissions: [],
            loading: false,
            saving: false,
            showModal: false,
            editingPermission: null,
            searchQuery: '',
            statusFilter: 'all',
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            },
            form: {
                userId: '',
                tenantId: '',
                permissions: [],
                isPrimary: false,
                isActive: true,
                notes: ''
            },
            availableUsers: [],
            availableTenants: [],
            filteredUsers: [],
            filteredTenants: [],
            userSearchQuery: '',
            tenantSearchQuery: '',
            showUserDropdown: false,
            showTenantDropdown: false,
            availablePermissions: [
                'super_admin',
                'admin',
                'gestionnaire',
                'secretaire',
                'expert',
                'reparateur',
                'conducteur',
                'verificateur'
            ],
            searchTimeout: null,
            isSuperAdmin: false,
            statusFilters: [
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Inactifs' }
            ],
            showConfirmation: false,
            permissionToDelete: null
        };
    },

    computed: {
        visiblePages() {
            const current = this.pagination.page;
            const total = this.pagination.totalPages;
            const delta = 2;
            const range = [];
            const rangeWithDots = [];

            for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                range.push(i);
            }

            if (current - delta > 2) {
                rangeWithDots.push(1, '...');
            } else {
                rangeWithDots.push(1);
            }

            rangeWithDots.push(...range);

            if (current + delta < total - 1) {
                rangeWithDots.push('...', total);
            } else {
                rangeWithDots.push(total);
            }

            return rangeWithDots.filter((page, index, array) => array.indexOf(page) === index);
        }
    },

    async mounted() {
        console.log('Current user:', JSON.parse(localStorage.getItem('current_user') || '{}'));
        console.log('Current tenant:', JSON.parse(localStorage.getItem('current_tenant') || '{}'));
        
        // Vérifier le statut super admin en premier
        await this.checkSuperAdminStatus();
        
        // Puis charger les données
        this.loadPermissions();
        this.loadAvailableUsers();
        this.loadAvailableTenants();
        
        // Ajouter l'écouteur pour fermer les dropdowns
        document.addEventListener('click', this.handleClickOutside);
    },

    beforeUnmount() {
        // Nettoyer l'écouteur d'événements
        document.removeEventListener('click', this.handleClickOutside);
    },

    methods: {
        async loadPermissions() {
            this.loading = true;
            try {
                // Si on est super admin, ne pas passer de tenant_id pour voir toutes les affectations
                const tenantId = this.isSuperAdmin ? null : null;
                
                const response = await window.apiService.getUserTenantPermissions(
                    tenantId,
                    this.searchQuery,
                    this.statusFilter,
                    this.pagination.page,
                    this.pagination.limit
                );

                if (response.success) {
                    this.permissions = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des affectations: ' + response.message, 'error');
                }
            } catch (error) {
                this.showNotification('Erreur lors du chargement des affectations: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        async loadAvailableUsers() {
            try {
                const response = await window.apiService.getUsers();
                if (response.success) {
                    this.availableUsers = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des utilisateurs:', error);
            }
        },

        async loadAvailableTenants() {
            try {
                const response = await window.apiService.getTenants();
                if (response.success) {
                    this.availableTenants = response.tenants || response.data || [];
                } else {
                    console.error('Failed to load tenants:', response.message);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des tenants:', error);
            }
        },

        async checkSuperAdminStatus() {
            try {
                // Essayer de récupérer toutes les affectations sans tenant_id spécifique
                const response = await window.apiService.getUserTenantPermissions(null, '', 'all', 1, 1);
                // Si ça fonctionne, c'est qu'on est super admin
                this.isSuperAdmin = true;
            } catch (error) {
                // Si ça échoue, on n'est pas super admin
                this.isSuperAdmin = false;
            }
        },

        debounceSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.pagination.page = 1;
                this.loadPermissions();
            }, 500);
        },

        resetFilters() {
            this.searchQuery = '';
            this.statusFilter = 'all';
            this.pagination.page = 1;
            this.loadPermissions();
        },

        setActiveFilter(filterValue) {
            this.statusFilter = filterValue;
            this.pagination.page = 1;
            this.loadPermissions();
        },

        changePage(page) {
            if (page >= 1 && page <= this.pagination.totalPages) {
                this.pagination.page = page;
                this.loadPermissions();
            }
        },

        openCreateModal() {
            this.editingPermission = null;
            this.form = {
                userId: '',
                tenantId: '',
                permissions: [],
                isPrimary: false,
                isActive: true,
                notes: ''
            };
            // Initialiser les listes filtrées
            this.filteredUsers = this.availableUsers;
            this.filteredTenants = this.availableTenants;
            this.userSearchQuery = '';
            this.tenantSearchQuery = '';
            this.showUserDropdown = false;
            this.showTenantDropdown = false;
            this.showModal = true;
        },

        async editPermission(permission) {
            // Recharger les tenants et utilisateurs au cas où
            await this.loadAvailableTenants();
            await this.loadAvailableUsers();

            this.editingPermission = permission;
            this.form = {
                userId: permission.user.id,
                tenantId: permission.tenant.id,
                permissions: [...permission.permissions],
                isPrimary: permission.isPrimary,
                isActive: permission.isActive,
                notes: permission.notes || ''
            };
            
            // Initialiser les champs de recherche avec les valeurs sélectionnées
            this.userSearchQuery = `${permission.user.firstName} ${permission.user.lastName} (${permission.user.email})`;
            this.tenantSearchQuery = `${permission.tenant.name} (${permission.tenant.slug})`;
            this.filteredUsers = this.availableUsers;
            this.filteredTenants = this.availableTenants;
            this.showUserDropdown = false;
            this.showTenantDropdown = false;
            
            this.showModal = true;
        },

        async savePermission() {
            this.saving = true;
            try {
                const permissionData = {
                    userId: parseInt(this.form.userId),
                    tenantId: parseInt(this.form.tenantId),
                    permissions: this.form.permissions,
                    isPrimary: this.form.isPrimary,
                    isActive: this.form.isActive,
                    notes: this.form.notes
                };

                let response;
                if (this.editingPermission) {
                    response = await window.apiService.updateUserTenantPermission(
                        this.editingPermission.id,
                        permissionData
                    );
                } else {
                    response = await window.apiService.createUserTenantPermission(permissionData);
                }

                if (response.success) {
                    this.showNotification(
                        this.editingPermission ? "Affectation mise à jour avec succès" : "Affectation créée avec succès",
                        'success'
                    );
                    this.closeModal();
                    this.loadPermissions();
                } else {
                    this.showNotification('Erreur lors de la sauvegarde: ' + response.message, 'error');
                }
            } catch (error) {
                this.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },


        deletePermission(permission) {
            this.permissionToDelete = permission;
            this.showConfirmation = true;
        },

        async confirmDelete() {
            if (!this.permissionToDelete) return;
            
            try {
                const response = await window.apiService.deleteUserTenantPermission(this.permissionToDelete.id);
                if (response.success) {
                    this.showNotification("Affectation supprimée avec succès", 'success');
                    this.loadPermissions();
                } else {
                    this.showNotification('Erreur lors de la suppression: ' + response.message, 'error');
                }
            } catch (error) {
                this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
            } finally {
                this.closeConfirmation();
            }
        },

        closeConfirmation() {
            this.showConfirmation = false;
            this.permissionToDelete = null;
        },

        closeModal() {
            this.showModal = false;
            this.editingPermission = null;
        },

        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        // Méthodes pour la recherche dans les selects
        async searchUsers() {
            if (this.userSearchQuery.length < 2) {
                this.filteredUsers = this.availableUsers;
                return;
            }

            try {
                const response = await window.apiService.searchUsers(this.userSearchQuery);
                if (response.success) {
                    this.filteredUsers = response.data;
                }
            } catch (error) {
                console.error('Erreur lors de la recherche d\'utilisateurs:', error);
                this.filteredUsers = this.availableUsers;
            }
        },

        async searchTenants() {
            if (this.tenantSearchQuery.length < 2) {
                this.filteredTenants = this.availableTenants;
                return;
            }

            try {
                const response = await window.apiService.searchTenants(this.tenantSearchQuery);
                if (response.success) {
                    this.filteredTenants = response.data;
                }
            } catch (error) {
                console.error('Erreur lors de la recherche de tenants:', error);
                this.filteredTenants = this.availableTenants;
            }
        },

        toggleUserDropdown() {
            this.showUserDropdown = !this.showUserDropdown;
            if (this.showUserDropdown) {
                this.filteredUsers = this.availableUsers;
            }
        },

        toggleTenantDropdown() {
            this.showTenantDropdown = !this.showTenantDropdown;
            if (this.showTenantDropdown) {
                this.filteredTenants = this.availableTenants;
            }
        },

        selectUser(user) {
            this.form.userId = user.id;
            this.userSearchQuery = `${user.firstName} ${user.lastName} (${user.email})`;
            this.showUserDropdown = false;
        },

        selectTenant(tenant) {
            this.form.tenantId = tenant.id;
            this.tenantSearchQuery = `${tenant.name} (${tenant.slug})`;
            this.showTenantDropdown = false;
        },

        // Fermer les dropdowns quand on clique ailleurs
        handleClickOutside(event) {
            if (!event.target.closest('.searchable-select')) {
                this.showUserDropdown = false;
                this.showTenantDropdown = false;
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
    }
};

// Export pour utilisation dans d'autres composants
window.UserTenantPermissionCrud = UserTenantPermissionCrud;
