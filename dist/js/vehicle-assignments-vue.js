/**
 * Impact Auto - Assignations de Véhicules Vue.js
 * Composant CRUD pour la gestion des assignations de véhicules
 */

// Définir le composant VehicleAssignmentCrud
const VehicleAssignmentCrud = {
    name: 'VehicleAssignmentCrud',
    
    template: `
        <div class="parameter-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1 class="section-title">Assignations de Véhicules</h1>
                            <p class="page-subtitle">Gérez les assignations de véhicules aux conducteurs</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="fas fa-plus"></i>
                            Nouvelle Assignation
                        </button>
                    </div>
                </div>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        @input="debouncedSearch"
                        placeholder="Rechercher par véhicule, conducteur..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="activeFilter" @change="setActiveFilter(activeFilter)" class="filter-select">
                        <option value="all">Toutes</option>
                        <option value="active">Actives</option>
                        <option value="inactive">Inactives</option>
                        <option value="terminated">Terminées</option>
                    </select>
                </div>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Chargement des assignations...
            </div>

            <!-- Assignments Table -->
            <div v-show="!loading" class="data-table-container">
                <div v-if="assignments.length === 0" class="empty-state">
                    <i class="fas fa-car-side"></i>
                    <p>Aucune assignation trouvée</p>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>Véhicule</th>
                            <th>Conducteur</th>
                            <th>Date d'assignation</th>
                            <th>Date de fin</th>
                            <th>Durée</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="assignment in assignments" :key="assignment.id">
                            <td>
                                <div class="vehicle-info">
                                    <div class="vehicle-plate">{{ assignment.vehicle.plateNumber }}</div>
                                    <div class="vehicle-details">
                                        {{ assignment.vehicle.brand?.name }} {{ assignment.vehicle.model?.name }}
                                        <span v-if="assignment.vehicle.year">({{ assignment.vehicle.year }})</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="driver-info">
                                    <div class="driver-name">{{ assignment.driver.firstName }} {{ assignment.driver.lastName }}</div>
                                    <div class="driver-email">{{ assignment.driver.email }}</div>
                                </div>
                            </td>
                            <td>{{ formatDate(assignment.assignedDate) }}</td>
                            <td>{{ assignment.unassignedDate ? formatDate(assignment.unassignedDate) : '-' }}</td>
                            <td>
                                <span v-if="assignment.assignmentDuration !== null">
                                    {{ assignment.assignmentDuration }} jour{{ assignment.assignmentDuration > 1 ? 's' : '' }}
                                </span>
                                <span v-else>-</span>
                            </td>
                            <td>
                                <span :class="getStatusClass(assignment)">
                                    {{ assignment.statusLabel }}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" @click="editAssignment(assignment)" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteAssignment(assignment)" title="Supprimer">
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
                
                <div class="pagination-info">
                    Page {{ pagination.page }} sur {{ pagination.pages }}
                </div>
                
                <button 
                    class="btn btn-outline" 
                    :disabled="!pagination.hasNext"
                    @click="changePage(pagination.page + 1)"
                >
                    Suivant
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Create/Edit Assignment Modal -->
            <div v-if="showModal" class="modal-overlay show" @click="closeModal">
                <div class="modal-content modal-lg" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? "Modifier l'assignation" : "Nouvelle assignation" }}</h3>
                        <button class="close-btn" @click="closeModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveAssignment">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="assignment-vehicle">Véhicule *</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="assignment-vehicle"
                                            :value="selectedVehicleName || vehicleSearch"
                                            @input="handleVehicleInput"
                                            @focus="handleVehicleFocus"
                                            @blur="handleVehicleBlur"
                                            placeholder="Rechercher un véhicule..."
                                            required
                                        >
                                        <div class="dropdown-options" v-if="showVehicleDropdown && vehicles.length > 0">
                                            <div 
                                                v-for="vehicle in vehicles" 
                                                :key="vehicle.id" 
                                                class="dropdown-option"
                                                @click="selectVehicle(vehicle)"
                                            >
                                                <div class="vehicle-option">
                                                    <div class="vehicle-plate">{{ vehicle.plateNumber }}</div>
                                                    <div class="vehicle-details">{{ vehicle.brand }} {{ vehicle.model }} ({{ vehicle.year }})</div>
                                                </div>
                                            </div>
                                        </div>
                                        <input type="hidden" v-model="form.vehicleId">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="assignment-driver">Conducteur *</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="assignment-driver"
                                            :value="selectedDriverName || driverSearch"
                                            @input="handleDriverInput"
                                            @focus="handleDriverFocus"
                                            @blur="handleDriverBlur"
                                            placeholder="Rechercher un conducteur..."
                                            required
                                        >
                                        <div class="dropdown-options" v-if="showDriverDropdown && drivers.length > 0">
                                            <div 
                                                v-for="driver in drivers" 
                                                :key="driver.id" 
                                                class="dropdown-option"
                                                @click="selectDriver(driver)"
                                            >
                                                <div class="driver-option">
                                                    <div class="driver-name">{{ driver.firstName }} {{ driver.lastName }}</div>
                                                    <div class="driver-email">{{ driver.email }}</div>
                                                    <div v-if="driver.licenseType" class="driver-license">
                                                        {{ driver.licenseType.code }} - {{ driver.licenseType.name }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <input type="hidden" v-model="form.driverId">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="assignment-date">Date d'assignation *</label>
                                    <input 
                                        type="date" 
                                        id="assignment-date"
                                        v-model="form.assignedDate"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="assignment-end-date">Date de fin</label>
                                    <input 
                                        type="date" 
                                        id="assignment-end-date"
                                        v-model="form.unassignedDate"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="assignment-status">Statut</label>
                                <select id="assignment-status" v-model="form.status">
                                    <option value="active">Actif</option>
                                    <option value="inactive">Inactif</option>
                                    <option value="terminated">Terminé</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="assignment-notes">Notes</label>
                                <textarea 
                                    id="assignment-notes"
                                    v-model="form.notes"
                                    rows="3"
                                    placeholder="Notes sur l'assignation..."
                                ></textarea>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="saveAssignment"
                            :disabled="saving"
                        >
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteModal" class="modal-overlay show" @click="closeDeleteModal">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Confirmer la suppression</h3>
                        <button class="close-btn" @click="closeDeleteModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="delete-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Êtes-vous sûr de vouloir supprimer cette assignation ?</p>
                            <p v-if="assignmentToDelete">
                                <strong>{{ assignmentToDelete.vehicle.plateNumber }}</strong> → 
                                {{ assignmentToDelete.driver.firstName }} {{ assignmentToDelete.driver.lastName }}
                            </p>
                            <p class="text-danger">Cette action est irréversible.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="confirmDelete"
                            :disabled="!assignmentToDelete"
                        >
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
            assignments: [],
            vehicles: [],
            drivers: [],
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
            assignmentToDelete: null,
            vehicleSearch: '',
            driverSearch: '',
            vehicleSearchTimeout: null,
            driverSearchTimeout: null,
            selectedVehicleName: '',
            selectedDriverName: '',
            showVehicleDropdown: false,
            showDriverDropdown: false,
            form: {
                id: null,
                vehicleId: '',
                driverId: '',
                assignedDate: '',
                unassignedDate: '',
                status: 'active',
                notes: ''
            },
            searchTimeout: null
        };
    },
    
    watch: {
        'form.vehicleId'(newVehicleId, oldVehicleId) {
            if (newVehicleId !== oldVehicleId && oldVehicleId) {
                this.form.driverId = '';
                this.selectedDriverName = '';
                this.driverSearch = '';
                this.drivers = [];
                this.showDriverDropdown = false;
            }
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadAssignments();
        await this.loadVehicles();
        await this.loadDrivers();
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
        
        async loadAssignments() {
            this.loading = true;
            try {
                const data = await window.apiService.getVehicleAssignments(
                    this.currentPage,
                    this.itemsPerPage,
                    this.searchTerm,
                    this.activeFilter
                );
                if (data.success) {
                    this.assignments = data.data || [];
                    this.pagination = data.pagination;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des assignations:', error);
                this.assignments = [];
            } finally {
                this.loading = false;
            }
        },
        
        async loadVehicles(search = '') {
            try {
                const data = await window.apiService.getAvailableVehicles(search);
                if (data.success) {
                    this.vehicles = data.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules:', error);
                this.vehicles = [];
            }
        },
        
        async loadDrivers(search = '') {
            try {
                const data = await window.apiService.getAvailableDrivers(search);
                if (data.success) {
                    this.drivers = data.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des conducteurs:', error);
                this.drivers = [];
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadAssignments();
            }, 500);
        },
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            this.currentPage = 1;
            this.loadAssignments();
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadAssignments();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editAssignment(assignment) {
            this.isEditing = true;
            this.form = {
                id: assignment.id,
                vehicleId: assignment.vehicle.id,
                driverId: assignment.driver.id,
                assignedDate: assignment.assignedDate,
                unassignedDate: assignment.unassignedDate || '',
                status: assignment.status,
                notes: assignment.notes || ''
            };
            
            this.selectedVehicleName = `${assignment.vehicle.plateNumber} - ${assignment.vehicle.brand?.name} ${assignment.vehicle.model?.name}`;
            this.selectedDriverName = `${assignment.driver.firstName} ${assignment.driver.lastName}`;
            this.vehicleSearch = '';
            this.driverSearch = '';
            this.showVehicleDropdown = false;
            this.showDriverDropdown = false;
            
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        resetForm() {
            this.form = {
                id: null,
                vehicleId: '',
                driverId: '',
                assignedDate: '',
                unassignedDate: '',
                status: 'active',
                notes: ''
            };
            this.vehicleSearch = '';
            this.driverSearch = '';
            this.selectedVehicleName = '';
            this.selectedDriverName = '';
            this.showVehicleDropdown = false;
            this.showDriverDropdown = false;
        },
        
        handleVehicleInput(event) {
            this.vehicleSearch = event.target.value;
            this.selectedVehicleName = '';
            this.form.vehicleId = '';
            this.showVehicleDropdown = true;
            this.searchVehicles();
        },
        
        handleDriverInput(event) {
            this.driverSearch = event.target.value;
            this.selectedDriverName = '';
            this.form.driverId = '';
            this.showDriverDropdown = true;
            this.searchDrivers();
        },
        
        handleVehicleFocus() {
            this.showVehicleDropdown = true;
            if (this.vehicleSearch || !this.selectedVehicleName) {
                this.loadVehicles(this.vehicleSearch);
            }
        },
        
        handleVehicleBlur() {
            setTimeout(() => {
                this.showVehicleDropdown = false;
            }, 200);
        },
        
        handleDriverFocus() {
            this.showDriverDropdown = true;
            if (this.driverSearch || !this.selectedDriverName) {
                this.loadDrivers(this.driverSearch);
            }
        },
        
        handleDriverBlur() {
            setTimeout(() => {
                this.showDriverDropdown = false;
            }, 200);
        },
        
        searchVehicles() {
            clearTimeout(this.vehicleSearchTimeout);
            this.vehicleSearchTimeout = setTimeout(() => {
                this.loadVehicles(this.vehicleSearch);
            }, 300);
        },
        
        searchDrivers() {
            clearTimeout(this.driverSearchTimeout);
            this.driverSearchTimeout = setTimeout(() => {
                this.loadDrivers(this.driverSearch);
            }, 300);
        },
        
        selectVehicle(vehicle) {
            this.form.vehicleId = vehicle.id;
            this.selectedVehicleName = `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}`;
            this.vehicleSearch = '';
            this.vehicles = [];
            this.showVehicleDropdown = false;
        },
        
        selectDriver(driver) {
            this.form.driverId = driver.id;
            this.selectedDriverName = `${driver.firstName} ${driver.lastName}`;
            this.driverSearch = '';
            this.drivers = [];
            this.showDriverDropdown = false;
        },
        
        async saveAssignment() {
            if (!this.form.vehicleId || !this.form.driverId || !this.form.assignedDate) {
                this.showNotification("Véhicule, conducteur et date d'assignation sont requis", 'error');
                return;
            }
            
            this.saving = true;
            try {
                let data;
                if (this.isEditing) {
                    data = await window.apiService.updateVehicleAssignment(this.form.id, this.form);
                } else {
                    data = await window.apiService.createVehicleAssignment(this.form);
                }
                
                if (data.success) {
                    this.closeModal();
                    await this.loadAssignments();
                    this.showNotification(
                        this.isEditing ? 'Assignation modifiée avec succès' : 'Assignation créée avec succès',
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
        
        deleteAssignment(assignment) {
            this.assignmentToDelete = assignment;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.assignmentToDelete = null;
        },
        
        async confirmDelete() {
            if (!this.assignmentToDelete) return;
            
            try {
                const data = await window.apiService.deleteVehicleAssignment(this.assignmentToDelete.id);
                
                if (data.success) {
                    this.closeDeleteModal();
                    await this.loadAssignments();
                    this.showNotification('Assignation supprimée avec succès', 'success');
                } else {
                    this.showNotification(data.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
            }
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            return new Date(dateString).toLocaleDateString('fr-FR');
        },
        
        getStatusClass(assignment) {
            const statusClasses = {
                'active': 'status-active',
                'inactive': 'status-inactive',
                'terminated': 'status-terminated'
            };
            return statusClasses[assignment.status] || 'status-unknown';
        },
        
        showNotification(message, type = 'info') {
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
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
};

// Exposer le composant globalement
window.VehicleAssignmentCrud = VehicleAssignmentCrud;
