/**
 * Impact Auto - Collaborateurs Vue.js
 * Composant CRUD pour la gestion des collaborateurs
 */

const CollaborateurCrud = {
    template: `
        <div class="collaborateur-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Collaborateurs</h1>
                <p class="page-subtitle">Gérez les experts et collaborateurs techniques</p>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher un collaborateur (nom, email, poste)..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="statusFilter" @change="loadCollaborateurs" class="filter-select">
                        <option value="all">Tous les collaborateurs</option>
                        <option value="active">Actifs uniquement</option>
                        <option value="inactive">Inactifs uniquement</option>
                    </select>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" @click="openCreateModal">
                        <i class="fas fa-plus"></i>
                        Nouveau Collaborateur
                    </button>
                </div>
            </div>

            <!-- Liste des collaborateurs -->
            <div class="data-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement des collaborateurs...</p>
                </div>
                
                <div v-else-if="collaborateurs.length === 0" class="no-data">
                    <i class="fas fa-users"></i>
                    <h3>Aucun collaborateur trouvé</h3>
                    <p>Commencez par créer votre premier collaborateur.</p>
                </div>
                
                <div v-else class="parameters-grid">
                    <div 
                        v-for="collaborateur in collaborateurs" 
                        :key="collaborateur.id"
                        class="parameter-card collaborateur-card"
                    >
                        <div class="parameter-header">
                            <div class="collaborateur-info">
                                <div class="collaborateur-name">{{ collaborateur.fullName }}</div>
                                <div class="collaborateur-position">{{ collaborateur.position || 'Poste non défini' }}</div>
                            </div>
                            <div :class="['parameter-category', collaborateur.isActive ? 'active' : 'inactive']">
                                {{ collaborateur.isActive ? 'Actif' : 'Inactif' }}
                            </div>
                        </div>
                        
                        <div class="parameter-body">
                            <div class="collaborateur-details">
                                <div class="detail-row" v-if="collaborateur.email">
                                    <i class="fas fa-envelope"></i>
                                    <span>{{ collaborateur.email }}</span>
                                </div>
                                <div class="detail-row" v-if="collaborateur.phone">
                                    <i class="fas fa-phone"></i>
                                    <span>{{ collaborateur.phone }}</span>
                                </div>
                                <div class="detail-row" v-if="collaborateur.department">
                                    <i class="fas fa-building"></i>
                                    <span>{{ collaborateur.department }}</span>
                                </div>
                                <div class="detail-row" v-if="collaborateur.specialization">
                                    <i class="fas fa-award"></i>
                                    <span>{{ collaborateur.specialization }}</span>
                                </div>
                                <div class="detail-row" v-if="collaborateur.experienceYears">
                                    <i class="fas fa-clock"></i>
                                    <span>{{ collaborateur.experienceYears }} ans d'expérience</span>
                                </div>
                                <div class="detail-row" v-if="collaborateur.licenseNumber">
                                    <i class="fas fa-id-card"></i>
                                    <span>Permis: {{ collaborateur.licenseNumber }}</span>
                                </div>
                                <div v-if="collaborateur.isLicenseExpired" class="license-alert">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    Permis expiré
                                </div>
                                <div v-else-if="collaborateur.daysUntilLicenseExpiry !== null && collaborateur.daysUntilLicenseExpiry < 30 && collaborateur.daysUntilLicenseExpiry > 0" class="license-warning">
                                    <i class="fas fa-exclamation-circle"></i>
                                    Permis expire dans {{ collaborateur.daysUntilLicenseExpiry }} jours
                                </div>
                            </div>
                            
                            <div class="parameter-meta">
                                <div class="parameter-type">
                                    <i class="fas fa-calendar"></i>
                                    Créé le {{ formatDate(collaborateur.createdAt) }}
                                </div>
                                <div class="parameter-status">
                                    <div :class="['status-indicator', collaborateur.isActive ? 'active' : 'inactive']"></div>
                                    {{ collaborateur.isActive ? 'Actif' : 'Inactif' }}
                                </div>
                            </div>
                            
                            <div class="parameter-actions">
                                <button 
                                    class="button btn-outline btn-sm" 
                                    @click="editCollaborateur(collaborateur)"
                                >
                                    <i class="fas fa-edit"></i> Modifier
                                </button>
                                <button 
                                    class="button btn-danger btn-sm" 
                                    @click="deleteCollaborateur(collaborateur)"
                                >
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination && pagination.totalPages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    :disabled="pagination.currentPage === 1"
                    @click="changePage(pagination.currentPage - 1)"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.currentPage }} sur {{ pagination.totalPages }}
                </span>
                
                <button 
                    class="btn btn-outline" 
                    :disabled="pagination.currentPage === pagination.totalPages"
                    @click="changePage(pagination.currentPage + 1)"
                >
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Modal de création/édition -->
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content modal-xl" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? "Modifier le collaborateur" : "Nouveau collaborateur" }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveCollaborateur">
                            <div class="form-section">
                                <h4><i class="fas fa-user"></i> Informations Personnelles</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="first-name">Prénom *</label>
                                        <input 
                                            type="text" 
                                            id="first-name"
                                            v-model="form.firstName"
                                            placeholder="Prénom du collaborateur"
                                            required
                                        >
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="last-name">Nom *</label>
                                        <input 
                                            type="text" 
                                            id="last-name"
                                            v-model="form.lastName"
                                            placeholder="Nom du collaborateur"
                                            required
                                        >
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="email">Email</label>
                                        <input 
                                            type="email" 
                                            id="email"
                                            v-model="form.email"
                                            placeholder="email@exemple.com"
                                        >
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="phone">Téléphone</label>
                                        <input 
                                            type="tel" 
                                            id="phone"
                                            v-model="form.phone"
                                            placeholder="+33 X XX XX XX XX"
                                        >
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h4><i class="fas fa-briefcase"></i> Informations Professionnelles</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="employee-number">Numéro d'employé</label>
                                        <input 
                                            type="text" 
                                            id="employee-number"
                                            v-model="form.employeeNumber"
                                            placeholder="EMP-001"
                                        >
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="department">Département</label>
                                        <input 
                                            type="text" 
                                            id="department"
                                            v-model="form.department"
                                            placeholder="Ex: Atelier, Diagnostique..."
                                        >
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="position">Poste</label>
                                        <input 
                                            type="text" 
                                            id="position"
                                            v-model="form.position"
                                            placeholder="Ex: Mécanicien, Expert..."
                                        >
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="specialization">Spécialisation</label>
                                        <input 
                                            type="text" 
                                            id="specialization"
                                            v-model="form.specialization"
                                            placeholder="Ex: Électricité, Moteur..."
                                        >
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="certification-level">Niveau de certification</label>
                                        <input 
                                            type="text" 
                                            id="certification-level"
                                            v-model="form.certificationLevel"
                                            placeholder="Ex: Niveau 2, Expert..."
                                        >
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="experience-years">Années d'expérience</label>
                                        <input 
                                            type="number" 
                                            id="experience-years"
                                            v-model="form.experienceYears"
                                            placeholder="0"
                                            min="0"
                                        >
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h4><i class="fas fa-id-card"></i> Informations Permis</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="license-number">Numéro de permis</label>
                                        <input 
                                            type="text" 
                                            id="license-number"
                                            v-model="form.licenseNumber"
                                            placeholder="Numéro du permis de conduire"
                                        >
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="license-type">Type de permis</label>
                                        <select id="license-type" v-model="form.licenseTypeId">
                                            <option value="">Sélectionnez...</option>
                                            <option v-for="type in licenseTypes" :key="type.id" :value="type.id">
                                                {{ type.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="license-expiry">Date d'expiration du permis</label>
                                    <input 
                                        type="date" 
                                        id="license-expiry"
                                        v-model="form.licenseExpiryDate"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="notes">Notes</label>
                                <textarea 
                                    id="notes"
                                    v-model="form.notes"
                                    rows="3"
                                    placeholder="Notes complémentaires..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="form.isActive">
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">Collaborateur actif</span>
                                </label>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-primary" @click="saveCollaborateur" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ isEditing ? 'Modifier' : 'Créer' }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    `,
    
    data() {
        return {
            collaborateurs: [],
            licenseTypes: [],
            loading: false,
            saving: false,
            searchTerm: '',
            statusFilter: 'all',
            currentPage: 1,
            itemsPerPage: 12,
            pagination: null,
            showModal: false,
            isEditing: false,
            searchTimeout: null,
            form: {
                id: null,
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                employeeNumber: '',
                department: '',
                position: '',
                specialization: '',
                licenseNumber: '',
                licenseTypeId: '',
                licenseExpiryDate: '',
                certificationLevel: '',
                experienceYears: '',
                notes: '',
                isActive: true
            }
        };
    },
    
    async mounted() {
        await this.waitForApiService();
        await this.loadLicenseTypes();
        await this.loadCollaborateurs();
    },
    
    methods: {
        async waitForApiService() {
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window.apiService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.apiService) {
                throw new Error('API Service non disponible après 5 secondes');
            }
        },
        
        async loadLicenseTypes() {
            try {
                const response = await window.apiService.request('/reference/license-types?status=active&limit=100');
                if (response.success) {
                    this.licenseTypes = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types de permis:', error);
            }
        },
        
        async loadCollaborateurs() {
            this.loading = true;
            try {
                const response = await window.apiService.request(`/collaborateurs/admin?page=${this.currentPage}&limit=${this.itemsPerPage}&search=${encodeURIComponent(this.searchTerm)}&status=${this.statusFilter}`);
                
                if (response.success) {
                    this.collaborateurs = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.$notifyError('Erreur lors du chargement des collaborateurs: ' + response.message);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des collaborateurs:', error);
                this.$notifyError('Erreur lors du chargement des collaborateurs');
            } finally {
                this.loading = false;
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadCollaborateurs();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadCollaborateurs();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editCollaborateur(collaborateur) {
            this.isEditing = true;
            this.form = {
                id: collaborateur.id,
                firstName: collaborateur.firstName,
                lastName: collaborateur.lastName,
                email: collaborateur.email || '',
                phone: collaborateur.phone || '',
                employeeNumber: collaborateur.employeeNumber || '',
                department: collaborateur.department || '',
                position: collaborateur.position || '',
                specialization: collaborateur.specialization || '',
                licenseNumber: collaborateur.licenseNumber || '',
                licenseTypeId: collaborateur.licenseType?.id || '',
                licenseExpiryDate: collaborateur.licenseExpiryDate || '',
                certificationLevel: collaborateur.certificationLevel || '',
                experienceYears: collaborateur.experienceYears || '',
                notes: collaborateur.notes || '',
                isActive: collaborateur.isActive
            };
            this.showModal = true;
        },
        
        async saveCollaborateur() {
            if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
                this.$notifyError('Le prénom et le nom sont requis');
                return;
            }
            
            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.request(`/collaborateurs/admin/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(this.form)
                    });
                } else {
                    response = await window.apiService.request('/collaborateurs/admin', {
                        method: 'POST',
                        body: JSON.stringify(this.form)
                    });
                }
                
                if (response.success) {
                    this.$notifySuccess(response.message);
                    this.closeModal();
                    this.loadCollaborateurs();
                } else {
                    this.$notifyError('Erreur: ' + response.message);
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.$notifyError('Erreur lors de la sauvegarde');
            } finally {
                this.saving = false;
            }
        },
        
        async deleteCollaborateur(collaborateur) {
            if (!window.confirmationService) {
                console.error('Service de confirmation non disponible');
                this.$notifyError('Service de confirmation non disponible');
                return;
            }
            
            const confirmed = await window.confirmationService.show({
                title: 'Confirmer la suppression',
                message: `Êtes-vous sûr de vouloir supprimer le collaborateur <strong>${collaborateur.fullName}</strong> ?<br><small class="text-muted">Cette action est irréversible.</small>`,
                type: 'danger',
                confirmText: 'Supprimer',
                cancelText: 'Annuler'
            });
            
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/collaborateurs/admin/${collaborateur.id}`, {
                    method: 'DELETE'
                });
                if (response.success) {
                    this.$notifySuccess(response.message || 'Collaborateur supprimé avec succès');
                    this.loadCollaborateurs();
                } else {
                    this.$notifyError('Erreur: ' + response.message);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.$notifyError('Erreur lors de la suppression');
            }
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        resetForm() {
            this.form = {
                id: null,
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                employeeNumber: '',
                department: '',
                position: '',
                specialization: '',
                licenseNumber: '',
                licenseTypeId: '',
                licenseExpiryDate: '',
                certificationLevel: '',
                experienceYears: '',
                notes: '',
                isActive: true
            };
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        // Méthodes de notification
        $notifySuccess(message, options = {}) {
            if (window.notifySuccess) {
                return window.notifySuccess(message, options);
            } else {
                console.log('[SUCCESS]', message);
            }
        },

        $notifyError(message, options = {}) {
            if (window.notifyError) {
                return window.notifyError(message, options);
            } else {
                console.log('[ERROR]', message);
            }
        },

        $notifyWarning(message, options = {}) {
            if (window.notifyWarning) {
                return window.notifyWarning(message, options);
            } else {
                console.log('[WARNING]', message);
            }
        },

        $notifyInfo(message, options = {}) {
            if (window.notifyInfo) {
                return window.notifyInfo(message, options);
            } else {
                console.log('[INFO]', message);
            }
        }
    }
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined') {
    window.CollaborateurCrud = CollaborateurCrud;
    console.log('CollaborateurCrud component registered globally');
}

