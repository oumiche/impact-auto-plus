const { createApp } = Vue;

const DriverCrud = {
    template: `
        <div class="driver-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Conducteurs</h1>
                <p class="page-subtitle">Gérez les conducteurs et leurs informations de permis</p>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher un conducteur..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="activeFilter" @change="loadDrivers" class="filter-select">
                        <option value="all">Tous les conducteurs</option>
                        <option value="active">Actifs uniquement</option>
                        <option value="inactive">Inactifs uniquement</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" @click="openCreateModal">
                    <i class="fas fa-plus"></i>
                    Nouveau Conducteur
                </button>
            </div>

            <!-- Tableau des conducteurs -->
            <div class="table-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des conducteurs...
                </div>
                
                <div v-else-if="drivers.length === 0" class="no-data">
                    <i class="fas fa-user-tie"></i>
                    <p>Aucun conducteur trouvé</p>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Nom complet</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Permis</th>
                            <th>Type de permis</th>
                            <th>Expiration</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="driver in drivers" :key="driver.id">
                            <td>
                                <code v-if="driver.code" class="entity-code">{{ driver.code }}</code>
                                <span v-else class="no-code">-</span>
                            </td>
                            <td>
                                <div class="driver-name">
                                    <strong>{{ driver.fullName }}</strong>
                                    <div v-if="driver.dateOfBirth" class="driver-age">
                                        {{ driver.age }} ans
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div v-if="driver.email" class="email">
                                    <i class="fas fa-envelope"></i>
                                    {{ driver.email }}
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div v-if="driver.phone" class="phone">
                                    <i class="fas fa-phone"></i>
                                    {{ driver.phone }}
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div class="license-number">
                                    {{ driver.licenseNumber }}
                                </div>
                            </td>
                            <td>
                                <div v-if="driver.licenseType" class="license-type">
                                    <span class="license-code">{{ driver.licenseType.code }}</span>
                                    <span class="license-name">{{ driver.licenseType.name }}</span>
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div v-if="driver.licenseExpiryDate" class="license-expiry">
                                    <span :class="getExpiryClass(driver)">
                                        {{ formatDate(driver.licenseExpiryDate) }}
                                    </span>
                                    <div v-if="driver.isLicenseExpiringSoon" class="expiry-warning">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        Expire bientôt
                                    </div>
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <span :class="getStatusClass(driver)">
                                    {{ driver.statusLabel }}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" @click="editDriver(driver)" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteDriver(driver)" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="pagination && pagination.pages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    :disabled="!pagination.hasPrev"
                    @click="changePage(pagination.page - 1)"
                >
                    <i class="fas fa-chevron-left"></i>
                    Précédent
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.page }} sur {{ pagination.pages }}
                    ({{ pagination.total }} conducteur(s))
                </span>
                
                <button 
                    class="btn btn-outline" 
                    :disabled="!pagination.hasNext"
                    @click="changePage(pagination.page + 1)"
                >
                    Suivant
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Modal de création/édition -->
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le conducteur' : 'Nouveau conducteur' }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form @submit.prevent="saveDriver" class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="driver-firstname">Prénom *</label>
                                <input 
                                    type="text" 
                                    id="driver-firstname"
                                    v-model="form.firstName"
                                    required
                                    placeholder="Ex: Jean"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="driver-lastname">Nom *</label>
                                <input 
                                    type="text" 
                                    id="driver-lastname"
                                    v-model="form.lastName"
                                    required
                                    placeholder="Ex: Dupont"
                                >
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="driver-email">Email</label>
                                <input 
                                    type="email" 
                                    id="driver-email"
                                    v-model="form.email"
                                    placeholder="Ex: jean.dupont@email.com"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="driver-phone">Téléphone</label>
                                <input 
                                    type="tel" 
                                    id="driver-phone"
                                    v-model="form.phone"
                                    placeholder="Ex: +33 1 23 45 67 89"
                                >
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="driver-license">Numéro de permis *</label>
                                <input 
                                    type="text" 
                                    id="driver-license"
                                    v-model="form.licenseNumber"
                                    required
                                    placeholder="Ex: 1234567890123456"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="driver-license-type">Type de permis</label>
                                <select id="driver-license-type" v-model="form.licenseTypeId">
                                    <option value="">Sélectionner un type...</option>
                                    <option v-for="licenseType in licenseTypes" :key="licenseType.id" :value="licenseType.id">
                                        {{ licenseType.code }} - {{ licenseType.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="driver-license-expiry">Date d'expiration du permis</label>
                                <input 
                                    type="date" 
                                    id="driver-license-expiry"
                                    v-model="form.licenseExpiryDate"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="driver-birthdate">Date de naissance</label>
                                <input 
                                    type="date" 
                                    id="driver-birthdate"
                                    v-model="form.dateOfBirth"
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="driver-address">Adresse</label>
                            <textarea 
                                id="driver-address"
                                v-model="form.address"
                                rows="3"
                                placeholder="Adresse complète du conducteur"
                            ></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="driver-emergency-name">Contact d'urgence (nom)</label>
                                <input 
                                    type="text" 
                                    id="driver-emergency-name"
                                    v-model="form.emergencyContactName"
                                    placeholder="Ex: Marie Dupont"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="driver-emergency-phone">Contact d'urgence (téléphone)</label>
                                <input 
                                    type="tel" 
                                    id="driver-emergency-phone"
                                    v-model="form.emergencyContactPhone"
                                    placeholder="Ex: +33 1 23 45 67 89"
                                >
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="driver-status">Statut</label>
                                <select id="driver-status" v-model="form.status">
                                    <option value="active">Actif</option>
                                    <option value="inactive">Inactif</option>
                                    <option value="suspended">Suspendu</option>
                                    <option value="terminated">Terminé</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="driver-notes">Notes</label>
                            <textarea 
                                id="driver-notes"
                                v-model="form.notes"
                                rows="3"
                                placeholder="Notes supplémentaires sur le conducteur..."
                            ></textarea>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button type="submit" class="btn btn-primary" @click="saveDriver" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ isEditing ? 'Mettre à jour' : 'Créer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de confirmation de suppression -->
            <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Confirmer la suppression</h3>
                        <button class="close-btn" @click="closeDeleteModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="delete-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p v-if="driverToDelete">Êtes-vous sûr de vouloir supprimer le conducteur <strong>{{ driverToDelete.fullName }}</strong> ?</p>
                            <p v-else>Êtes-vous sûr de vouloir supprimer ce conducteur ?</p>
                            <p class="text-muted">Cette action est irréversible et supprimera définitivement toutes les données associées à ce conducteur.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="!driverToDelete">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            drivers: [],
            licenseTypes: [],
            loading: false,
            saving: false,
            searchTerm: '',
            activeFilter: 'all',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            driverToDelete: null,
            form: {
                id: null,
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                licenseNumber: '',
                licenseTypeId: '',
                licenseExpiryDate: '',
                dateOfBirth: '',
                address: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                status: 'active',
                notes: ''
            },
            searchTimeout: null
        };
    },
    
    mounted() {
        this.loadDrivers();
        this.loadLicenseTypes();
    },
    
    methods: {
        async loadDrivers() {
            this.loading = true;
            try {
                const data = await window.apiService.getDrivers(null, this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                if (data.success) {
                    this.drivers = data.data || [];
                    this.pagination = data.pagination;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des conducteurs:', error);
                this.drivers = [];
            } finally {
                this.loading = false;
            }
        },
        
        async loadLicenseTypes() {
            try {
                const data = await window.apiService.getDriverLicenseTypes();
                if (data.success) {
                    this.licenseTypes = data.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types de permis:', error);
                this.licenseTypes = [];
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadDrivers();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadDrivers();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editDriver(driver) {
            this.isEditing = true;
            this.form = {
                id: driver.id,
                firstName: driver.firstName,
                lastName: driver.lastName,
                email: driver.email || '',
                phone: driver.phone || '',
                licenseNumber: driver.licenseNumber,
                licenseTypeId: driver.licenseType ? driver.licenseType.id : '',
                licenseExpiryDate: driver.licenseExpiryDate || '',
                dateOfBirth: driver.dateOfBirth || '',
                address: driver.address || '',
                emergencyContactName: driver.emergencyContactName || '',
                emergencyContactPhone: driver.emergencyContactPhone || '',
                status: driver.status,
                notes: driver.notes || ''
            };
            this.showModal = true;
        },
        
        async saveDriver() {
            if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
                this.showNotification('Le prénom et le nom sont requis', 'error');
                return;
            }
            
            if (!this.form.licenseNumber.trim()) {
                this.showNotification('Le numéro de permis est requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                // Nettoyer et valider les données avant l'envoi
                const driverData = {
                    firstName: this.form.firstName.trim(),
                    lastName: this.form.lastName.trim(),
                    email: this.form.email ? this.form.email.trim() : null,
                    phone: this.form.phone ? this.form.phone.trim() : null,
                    licenseNumber: this.form.licenseNumber.trim(),
                    licenseTypeId: this.form.licenseTypeId || null,
                    licenseExpiryDate: this.form.licenseExpiryDate || null,
                    dateOfBirth: this.form.dateOfBirth || null,
                    address: this.form.address ? this.form.address.trim() : null,
                    emergencyContactName: this.form.emergencyContactName ? this.form.emergencyContactName.trim() : null,
                    emergencyContactPhone: this.form.emergencyContactPhone ? this.form.emergencyContactPhone.trim() : null,
                    status: this.form.status,
                    notes: this.form.notes ? this.form.notes.trim() : null
                };
                
                // Validation supplémentaire
                if (driverData.email && !this.isValidEmail(driverData.email)) {
                    this.showNotification('Format d\'email invalide. Veuillez saisir un email valide.', 'error');
                    return;
                }
                
                console.log('Données envoyées:', driverData);
                
                let result;
                if (this.isEditing) {
                    result = await window.apiService.updateDriver(this.form.id, driverData);
                } else {
                    result = await window.apiService.createDriver(driverData);
                }
                
                if (result.success) {
                    this.closeModal();
                    this.loadDrivers();
                    const action = this.isEditing ? 'modifié' : 'créé';
                    this.showNotification(`Conducteur ${action} avec succès`, 'success');
                } else {
                    this.showNotification(result.message || 'Erreur lors de la sauvegarde', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },
        
        deleteDriver(driver) {
            this.driverToDelete = driver;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.driverToDelete) {
                this.showNotification('Aucun conducteur sélectionné pour la suppression', 'error');
                return;
            }
            
            const driverName = this.driverToDelete.fullName;
            const driverId = this.driverToDelete.id;
            
            try {
                const result = await window.apiService.deleteDriver(driverId);
                if (result.success) {
                    this.closeDeleteModal();
                    this.loadDrivers();
                    this.showNotification(`Conducteur "${driverName}" supprimé avec succès`, 'success');
                } else {
                    this.showNotification(result.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
            }
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.driverToDelete = null;
        },
        
        closeModal() {
            this.showModal = false;
            this.isEditing = false;
            this.resetForm();
        },
        
        resetForm() {
            this.form = {
                id: null,
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                licenseNumber: '',
                licenseTypeId: '',
                licenseExpiryDate: '',
                dateOfBirth: '',
                address: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                status: 'active',
                notes: ''
            };
        },
        
        showNotification(message, type = 'info') {
            // Créer le conteneur de notifications s'il n'existe pas
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
        
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        getStatusClass(driver) {
            const baseClass = 'status';
            switch (driver.status) {
                case 'active':
                    return `${baseClass} status-active`;
                case 'inactive':
                    return `${baseClass} status-inactive`;
                case 'suspended':
                    return `${baseClass} status-suspended`;
                case 'terminated':
                    return `${baseClass} status-terminated`;
                default:
                    return `${baseClass} status-unknown`;
            }
        },
        
        getExpiryClass(driver) {
            if (driver.isLicenseExpired) {
                return 'expiry-expired';
            } else if (driver.isLicenseExpiringSoon) {
                return 'expiry-warning';
            } else {
                return 'expiry-valid';
            }
        }
    }
};

// Exporter le composant
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriverCrud;
}

// Enregistrer le composant globalement pour Vue
if (typeof window !== 'undefined' && window.Vue) {
    window.DriverCrud = DriverCrud;
}
