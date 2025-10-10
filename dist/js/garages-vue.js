/**
 * Impact Auto - Garages Vue.js
 * Composant CRUD pour la gestion des garages
 */

const GarageCrud = {
    template: `
        <div class="parameter-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1 class="section-title">Gestion des Garages</h1>
                            <p class="page-subtitle">Gérez les garages partenaires et leurs informations</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="fas fa-plus"></i>
                            Nouveau Garage
                        </button>
                    </div>
                </div>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher par nom, adresse, contact, spécialisation..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="activeFilter" @change="loadGarages" class="filter-select">
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="inactive">Inactifs</option>
                    </select>
                </div>
            </div>

            <!-- Tableau des garages -->
            <div class="table-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Chargement des garages...
                </div>
                
                <div v-else-if="garages.length === 0" class="no-data">
                    <i class="fas fa-wrench"></i>
                    <p>Aucun garage trouvé</p>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Adresse</th>
                            <th>Téléphone</th>
                            <th>Email</th>
                            <th>Contact</th>
                            <th>Note</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="garage in garages" :key="garage.id">
                            <td>
                                <div class="garage-name">
                                    <strong>{{ garage.name }}</strong>
                                    <div v-if="garage.specializations" class="specializations">
                                        {{ garage.specializations }}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div v-if="garage.address" class="address">
                                    {{ garage.address }}
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div v-if="garage.phone" class="phone">
                                    <i class="fas fa-phone"></i>
                                    {{ garage.phone }}
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div v-if="garage.email" class="email">
                                    <i class="fas fa-envelope"></i>
                                    {{ garage.email }}
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div v-if="garage.contactPerson" class="contact-person">
                                    {{ garage.contactPerson }}
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div v-if="garage.rating" class="rating">
                                    <div class="stars">
                                        <i v-for="i in 5" :key="i" 
                                           :class="i <= garage.rating ? 'fas fa-star' : 'far fa-star'"
                                           :style="{ color: i <= garage.rating ? '#ffc107' : '#ddd' }">
                                        </i>
                                    </div>
                                    <span class="rating-value">{{ garage.rating }}/5</span>
                                </div>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <span :class="garage.isActive ? 'status-active' : 'status-inactive'">
                                    {{ garage.isActive ? 'Actif' : 'Inactif' }}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" @click="editGarage(garage)" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteGarage(garage)" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="pagination && pagination.totalPages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    :disabled="!pagination.hasPrev"
                    @click="changePage(pagination.page - 1)"
                >
                    <i class="fas fa-chevron-left"></i>
                    Précédent
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.page }} sur {{ pagination.totalPages }}
                    ({{ pagination.total }} garage(s))
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
                        <h3>{{ isEditing ? 'Modifier le garage' : 'Nouveau garage' }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form @submit.prevent="saveGarage" class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="garage-name">Nom du garage *</label>
                                <input 
                                    type="text" 
                                    id="garage-name"
                                    v-model="form.name"
                                    required
                                    placeholder="Ex: Garage Auto Plus"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="garage-phone">Téléphone</label>
                                <input 
                                    type="tel" 
                                    id="garage-phone"
                                    v-model="form.phone"
                                    placeholder="Ex: +33 1 23 45 67 89"
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="garage-address">Adresse</label>
                            <textarea 
                                id="garage-address"
                                v-model="form.address"
                                rows="3"
                                placeholder="Adresse complète du garage"
                            ></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="garage-email">Email</label>
                                <input 
                                    type="email" 
                                    id="garage-email"
                                    v-model="form.email"
                                    placeholder="Ex: contact@garage.com"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="garage-contact">Personne de contact</label>
                                <input 
                                    type="text" 
                                    id="garage-contact"
                                    v-model="form.contactPerson"
                                    placeholder="Ex: Jean Dupont"
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="garage-specializations">Spécialisations</label>
                            <textarea 
                                id="garage-specializations"
                                v-model="form.specializations"
                                rows="2"
                                placeholder="Ex: Mécanique générale, Carrosserie, Contrôle technique"
                            ></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="garage-rating">Note (0-5)</label>
                                <input 
                                    type="number" 
                                    id="garage-rating"
                                    v-model="form.rating"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    placeholder="4.5"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="form.isActive"
                                    >
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">Garage actif</span>
                                </label>
                            </div>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button type="submit" class="btn btn-primary" @click="saveGarage" :disabled="saving">
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
                            <p v-if="garageToDelete">Êtes-vous sûr de vouloir supprimer le garage <strong>{{ garageToDelete.name }}</strong> ?</p>
                            <p v-else>Êtes-vous sûr de vouloir supprimer ce garage ?</p>
                            <p class="text-muted">Cette action est irréversible et supprimera définitivement toutes les données associées à ce garage.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="!garageToDelete">
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
            garages: [],
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
            garageToDelete: null,
            form: {
                id: null,
                name: '',
                address: '',
                phone: '',
                email: '',
                contactPerson: '',
                specializations: '',
                rating: null,
                isActive: true
            },
            searchTimeout: null
        };
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadGarages();
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
        
        async loadGarages() {
            this.loading = true;
            try {
                const data = await window.apiService.getGarages(null, this.searchTerm, this.activeFilter, this.currentPage, this.itemsPerPage);
                if (data.success) {
                    this.garages = data.data || [];
                    this.pagination = data.pagination;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des garages:', error);
                this.garages = [];
            } finally {
                this.loading = false;
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadGarages();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadGarages();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.form = {
                id: null,
                name: '',
                address: '',
                phone: '',
                email: '',
                contactPerson: '',
                specializations: '',
                rating: null,
                isActive: true
            };
            this.showModal = true;
        },
        
        editGarage(garage) {
            this.isEditing = true;
            this.form = {
                id: garage.id,
                name: garage.name,
                address: garage.address || '',
                phone: garage.phone || '',
                email: garage.email || '',
                contactPerson: garage.contactPerson || '',
                specializations: garage.specializations || '',
                rating: garage.rating || null,
                isActive: garage.isActive
            };
            this.showModal = true;
        },
        
        async saveGarage() {
            if (!this.form.name.trim()) {
                this.showNotification('Le nom du garage est requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                // Nettoyer et valider les données avant l'envoi
                const garageData = {
                    name: this.form.name.trim(),
                    address: this.form.address ? this.form.address.trim() : null,
                    phone: this.form.phone ? this.form.phone.trim() : null,
                    email: this.form.email ? this.form.email.trim() : null,
                    contactPerson: this.form.contactPerson ? this.form.contactPerson.trim() : null,
                    specializations: this.form.specializations ? this.form.specializations.trim() : null,
                    rating: this.form.rating ? parseFloat(this.form.rating) : null,
                    isActive: Boolean(this.form.isActive)
                };
                
                // Validation supplémentaire
                if (garageData.email && !this.isValidEmail(garageData.email)) {
                    this.showNotification('Format d\'email invalide. Veuillez saisir un email valide.', 'error');
                    return;
                }
                
                if (garageData.rating && (garageData.rating < 0 || garageData.rating > 5)) {
                    this.showNotification('La note doit être comprise entre 0 et 5', 'warning');
                    return;
                }
                
                console.log('Données envoyées:', garageData);
                
                let result;
                if (this.isEditing) {
                    result = await window.apiService.updateGarage(this.form.id, garageData);
                } else {
                    result = await window.apiService.createGarage(garageData);
                }
                
                if (result.success) {
                    this.closeModal();
                    this.loadGarages();
                    const action = this.isEditing ? 'modifié' : 'créé';
                    this.showNotification(`Garage ${action} avec succès`, 'success');
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
        
        deleteGarage(garage) {
            this.garageToDelete = garage;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.garageToDelete) {
                this.showNotification('Aucun garage sélectionné pour la suppression', 'error');
                return;
            }
            
            const garageName = this.garageToDelete.name;
            const garageId = this.garageToDelete.id;
            
            try {
                const result = await window.apiService.deleteGarage(garageId);
                if (result.success) {
                    this.closeDeleteModal();
                    this.loadGarages();
                    this.showNotification(`Garage "${garageName}" supprimé avec succès`, 'success');
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
            this.garageToDelete = null;
        },
        
        closeModal() {
            this.showModal = false;
            this.isEditing = false;
            this.form = {
                id: null,
                name: '',
                address: '',
                phone: '',
                email: '',
                contactPerson: '',
                specializations: '',
                rating: null,
                isActive: true
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
        }
    }
};

// Exposer le composant globalement
window.GarageCrud = GarageCrud;
