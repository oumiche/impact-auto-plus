// Composant Vue.js pour la gestion des utilisateurs
const UserCrud = {
    template: `
        <div class="user-crud">
            <div class="page-header">
                <h1 class="section-title">Gestion des Utilisateurs</h1>
                <p class="page-subtitle">Gérez les utilisateurs et leurs permissions</p>
            </div>

            <!-- Filtres et recherche -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        v-model="searchTerm" 
                        type="text" 
                        placeholder="Rechercher un utilisateur..."
                    >
                </div>
                
                <div class="filter-buttons">
                    <button 
                        v-for="filter in statusFilters" 
                        :key="filter.value"
                        @click="setActiveFilter(filter.value)"
                        :class="['filter-btn', { active: activeFilter === filter.value }]"
                    >
                        {{ filter.label }}
                    </button>
                </div>
                
                <button @click="openModal" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Nouvel Utilisateur
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des utilisateurs...
            </div>

            <!-- Liste des utilisateurs -->
            <div v-show="hasUsers" class="users-grid">
                <div 
                    v-for="user in filteredUsers" 
                    :key="user.id"
                    class="user-card"
                >
                    <div class="user-header">
                        <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                        <div :class="['user-status', user.status]">
                            {{ getUserStatusLabel(user.status) }}
                        </div>
                    </div>
                    
                    <div class="user-body">
                        <div class="user-email">
                            <i class="fas fa-envelope"></i>
                            {{ user.email }}
                        </div>
                        <div class="user-role">
                            <i class="fas fa-user-tag"></i>
                            {{ getUserRoleLabel(user.role) }}
                        </div>
                        
                        <div class="user-meta">
                            <div class="user-phone" v-if="user.phone">
                                <i class="fas fa-phone"></i>
                                {{ user.phone }}
                            </div>
                            <div class="user-verification">
                                <div :class="['verification-indicator', user.isEmailVerified ? 'verified' : 'unverified']"></div>
                                {{ user.isEmailVerified ? 'Email vérifié' : 'Email non vérifié' }}
                            </div>
                        </div>
                        
                        <div class="user-actions">
                            <button 
                                class="button btn-outline btn-sm" 
                                @click="editUser(user)"
                            >
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button 
                                class="button btn-danger btn-sm" 
                                @click="deleteUser(user)"
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
                    Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} utilisateurs
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
                
            <div v-show="!hasUsers && !loading" class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Aucun utilisateur trouvé</h3>
                <p>Il n'y a aucun utilisateur correspondant à vos critères de recherche.</p>
            </div>

            <!-- Modal d'ajout/modification -->
            <div v-if="showModal" class="modal show" @click.self="closeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>{{ isEditing ? 'Modifier l\\'utilisateur' : 'Nouvel utilisateur' }}</h2>
                        <button @click="closeModal" class="btn-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form @submit.prevent="saveUser" class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName">Prénom *</label>
                                <input 
                                    id="firstName"
                                    v-model="form.firstName" 
                                    type="text" 
                                    required
                                    class="form-control"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="lastName">Nom *</label>
                                <input 
                                    id="lastName"
                                    v-model="form.lastName" 
                                    type="text" 
                                    required
                                    class="form-control"
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input 
                                id="email"
                                v-model="form.email" 
                                type="email" 
                                required
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="role">Rôle *</label>
                                <select id="role" v-model="form.role" required class="form-control">
                                    <option value="">Sélectionner un rôle</option>
                                    <option value="super_admin">Super Administrateur</option>
                                    <option value="admin">Administrateur</option>
                                    <option value="gestionnaire">Gestionnaire</option>
                                    <option value="secretaire">Secrétaire</option>
                                    <option value="expert">Expert</option>
                                    <option value="reparateur">Réparateur</option>
                                    <option value="conducteur">Conducteur</option>
                                    <option value="verificateur">Vérificateur</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="status">Statut</label>
                                <select id="status" v-model="form.status" class="form-control">
                                    <option value="active">Actif</option>
                                    <option value="inactive">Inactif</option>
                                    <option value="suspended">Suspendu</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="phone">Téléphone</label>
                            <input 
                                id="phone"
                                v-model="form.phone" 
                                type="tel" 
                                class="form-control"
                            >
                        </div>
                        
                        <div v-if="!isEditing" class="form-group">
                            <label for="password">Mot de passe *</label>
                            <input 
                                id="password"
                                v-model="form.password" 
                                type="password" 
                                :required="!isEditing"
                                class="form-control"
                            >
                        </div>
                        
                        <div v-if="!isEditing" class="form-group">
                            <label for="confirmPassword">Confirmer le mot de passe *</label>
                            <input 
                                id="confirmPassword"
                                v-model="form.confirmPassword" 
                                type="password" 
                                :required="!isEditing"
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input 
                                    v-model="form.isEmailVerified" 
                                    type="checkbox"
                                >
                                Email vérifié
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input 
                                    v-model="form.mustChangePassword" 
                                    type="checkbox"
                                >
                                Doit changer le mot de passe à la prochaine connexion
                            </label>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button @click="closeModal" class="btn btn-secondary">Annuler</button>
                        <button @click="saveUser" class="btn btn-primary" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            {{ isEditing ? 'Modifier' : 'Créer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de suppression -->
            <div v-if="showDeleteModal" class="modal show" @click.self="closeDeleteModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Confirmer la suppression</h2>
                        <button @click="closeDeleteModal" class="btn-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete?.firstName }} {{ userToDelete?.lastName }}</strong> ?</p>
                        <p class="text-warning">Cette action est irréversible.</p>
                    </div>
                    
                    <div class="modal-footer">
                        <button @click="closeDeleteModal" class="btn btn-secondary">Annuler</button>
                        <button @click="confirmDelete" class="btn btn-danger" :disabled="deleting">
                            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>

            <!-- Notification Container -->
            <div class="notification-container" id="notification-container"></div>
        </div>
    `,
    
    data() {
        return {
            loading: false,
            saving: false,
            deleting: false,
            users: [],
            searchTerm: '',
            activeFilter: 'all',
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            currentUser: null,
            userToDelete: null,
            
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0,
            form: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: '',
                status: 'active',
                password: '',
                confirmPassword: '',
                isEmailVerified: false,
                mustChangePassword: false
            },
            statusFilters: [
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Inactifs' },
                { value: 'suspended', label: 'Suspendus' }
            ]
        };
    },
    
    computed: {
        filteredUsers() {
            // Since we're now using server-side pagination, we return the users as-is
            // The filtering is done on the server
            return this.users;
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
        
        hasUsers() {
            return this.users && this.users.length > 0;
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
        await this.loadUsers();
    },
    
    methods: {
        async loadUsers() {
            this.loading = true;
            try {
                // Vérifier si l'utilisateur est authentifié
                if (!window.apiService.isAuthenticated()) {
                    this.showNotification('Vous devez être connecté pour accéder aux utilisateurs', 'error');
                    this.users = [];
                    return;
                }

                const data = await window.apiService.getUsers(null, this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                
                if (data.success) {
                    this.users = data.data || [];
                    
                    if (data.pagination) {
                        this.totalItems = data.pagination.total;
                        this.totalPages = data.pagination.totalPages;
                    }
                } else {
                    // Vérifier si c'est une erreur d'authentification
                    if (data.error && data.error.includes('401')) {
                        this.showNotification('Vous devez être connecté pour accéder aux utilisateurs. Veuillez vous connecter.', 'error');
                        // Rediriger vers la page de connexion
                        window.location.href = '/login.html';
                    } else {
                        this.showNotification(data.message || 'Erreur lors du chargement des utilisateurs', 'error');
                    }
                    this.users = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des utilisateurs:', error);
                
                // Gestion spécifique des erreurs d'authentification
                if (error.message.includes('401') || error.message.includes('JWT Token not found')) {
                    this.showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
                    // Optionnel: rediriger vers la page de connexion
                    // window.location.href = '/login.html';
                } else {
                    this.showNotification('Erreur lors du chargement des utilisateurs: ' + error.message, 'error');
                }
                this.users = [];
            } finally {
                this.loading = false;
            }
        },
        
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadUsers();
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
            this.loadUsers();
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1; // Reset to first page when filter changes
            this.loadUsers();
        },
        
        openModal(user = null) {
            this.isEditing = !!user;
            this.currentUser = user;
            
            if (user) {
                this.form = {
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    role: user.role || '',
                    status: user.status || 'active',
                    password: '',
                    confirmPassword: '',
                    isEmailVerified: user.isEmailVerified || false,
                    mustChangePassword: user.mustChangePassword || false
                };
            } else {
                this.resetForm();
            }
            
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.isEditing = false;
            this.currentUser = null;
            this.resetForm();
        },
        
        resetForm() {
            this.form = {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: '',
                status: 'active',
                password: '',
                confirmPassword: '',
                isEmailVerified: false,
                mustChangePassword: false
            };
        },
        
        async saveUser() {
            if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.role) {
                this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }
            
            if (!this.isEditing && (!this.form.password || !this.form.confirmPassword)) {
                this.showNotification('Le mot de passe est obligatoire pour un nouvel utilisateur', 'error');
                return;
            }
            
            if (!this.isEditing && this.form.password !== this.form.confirmPassword) {
                this.showNotification('Les mots de passe ne correspondent pas', 'error');
                return;
            }
            
            this.saving = true;
            try {
                const userData = { ...this.form };
                
                // Ne pas envoyer les champs vides pour l'édition
                if (this.isEditing) {
                    delete userData.password;
                    delete userData.confirmPassword;
                }
                
                const data = this.isEditing 
                    ? await window.apiService.updateUser(this.currentUser.id, userData)
                    : await window.apiService.createUser(userData);
                
                if (data.success) {
                    this.closeModal();
                    await this.loadUsers();
                    this.showNotification(
                        this.isEditing ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès',
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
        
        editUser(user) {
            this.openModal(user);
        },
        
        deleteUser(user) {
            this.userToDelete = user;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.userToDelete = null;
        },
        
        async confirmDelete() {
            if (!this.userToDelete) return;
            
            this.deleting = true;
            try {
                const data = await window.apiService.deleteUser(this.userToDelete.id);
                
                if (data.success) {
                    this.closeDeleteModal();
                    await this.loadUsers();
                    this.showNotification('Utilisateur supprimé avec succès', 'success');
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
        
        getUserStatusLabel(status) {
            const labels = {
                'active': 'Actif',
                'inactive': 'Inactif',
                'suspended': 'Suspendu'
            };
            return labels[status] || status;
        },
        
        getUserRoleLabel(role) {
            const labels = {
                'super_admin': 'Super Administrateur',
                'admin': 'Administrateur',
                'gestionnaire': 'Gestionnaire',
                'secretaire': 'Secrétaire',
                'expert': 'Expert',
                'reparateur': 'Réparateur',
                'conducteur': 'Conducteur',
                'verificateur': 'Vérificateur'
            };
            return labels[role] || role;
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
