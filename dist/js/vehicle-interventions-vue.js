const VehicleInterventionCrud = {
    components: {
        WorkflowManager: window.WorkflowManager
    },
    template: `
        <div class="vehicle-intervention-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Interventions</h1>
                <p class="page-subtitle">Suivez et gérez toutes les interventions sur vos véhicules</p>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher une intervention..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="statusFilter" @change="loadInterventions" class="filter-select">
                        <option value="">Tous les statuts</option>
                        <option value="reported">Signalé</option>
                        <option value="in_prediagnostic">En prédiagnostic</option>
                        <option value="prediagnostic_completed">Prédiagnostic terminé</option>
                        <option value="in_quote">En devis</option>
                        <option value="quote_received">Devis reçu</option>
                        <option value="in_approval">En accord</option>
                        <option value="approved">Accord donné</option>
                        <option value="in_repair">En réparation</option>
                        <option value="repair_completed">Réparation terminée</option>
                        <option value="in_reception">En réception</option>
                        <option value="vehicle_received">Véhicule reçu</option>
                        <option value="cancelled">Annulé</option>
                    </select>
                    
                    <select v-model="priorityFilter" @change="loadInterventions" class="filter-select">
                        <option value="">Toutes les priorités</option>
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                        <option value="urgent">Urgente</option>
                    </select>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" @click="openCreateModal">
                        <i class="fas fa-plus"></i>
                        Nouvelle Intervention
                    </button>
                </div>
            </div>

            <!-- Liste des interventions -->
            <div class="data-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement des interventions...</p>
                </div>
                
                <div v-else-if="interventions.length === 0" class="no-data">
                    <i class="fas fa-tools"></i>
                    <h3>Aucune intervention trouvée</h3>
                    <p>Commencez par créer votre première intervention.</p>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table vehicle-interventions-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Véhicule</th>
                                <th>Motif</th>
                                <th>Type</th>
                                <th>Priorité</th>
                                <th>Statut</th>
                                <th>Kilométrage</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="intervention in interventions" :key="intervention.id">
                                <td>
                                    <code v-if="intervention.code" class="entity-code">{{ intervention.code }}</code>
                                    <span v-else class="no-code">-</span>
                                </td>
                                <td>
                                    <div class="vehicle-info">
                                        <div class="vehicle-plate">{{ intervention.vehicle.plateNumber }}</div>
                                        <div class="vehicle-details">
                                            {{ intervention.vehicle.brand }} {{ intervention.vehicle.model }}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="intervention-motif">{{ intervention.title }}</div>
                                    <div v-if="intervention.description" class="intervention-desc">
                                        {{ truncateText(intervention.description, 50) }}
                                    </div>
                                </td>
                                <td>
                                    <span v-if="intervention.interventionType" class="intervention-type-badge">
                                        {{ intervention.interventionType.name }}
                                    </span>
                                    <span v-else class="no-type">Non spécifié</span>
                                </td>
                                <td>
                                    <span :class="['priority-badge', 'priority-' + intervention.priority]">
                                        {{ getPriorityLabel(intervention.priority) }}
                                    </span>
                                </td>
                                <td>
                                    <div class="workflow-cell">
                                        <span class="status-badge" :class="getStatusClass(intervention.currentStatus)">
                                            {{ getStatusLabel(intervention.currentStatus) }}
                                        </span>
                                        <button 
                                            class="btn btn-sm btn-outline" 
                                            @click="showWorkflow(intervention)"
                                            title="Gérer le workflow"
                                        >
                                            <i class="fas fa-cogs"></i>
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <div v-if="intervention.odometerReading" class="odometer-info">
                                        {{ formatNumber(intervention.odometerReading) }} km
                                    </div>
                                    <div v-else class="no-odometer">-</div>
                                </td>
                                <td>
                                    <div class="date-info">{{ formatDate(intervention.reportedDate) }}</div>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-outline" @click="editIntervention(intervention)" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteIntervention(intervention)" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
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
                        <h3>{{ isEditing ? "Modifier l'intervention" : "Nouvelle intervention" }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveIntervention">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="vehicle">Véhicule *</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="vehicle"
                                            v-model="vehicleSearchTerm"
                                            @input="searchVehicles"
                                            @focus="onVehicleFocus"
                                            @blur="hideVehicleDropdown"
                                            placeholder="Rechercher un véhicule..."
                                            :style="{ display: selectedVehicle ? 'none' : 'block' }"
                                            required
                                        >
                                        <div v-if="showVehicleDropdown && vehicleSearchResults.length > 0" class="dropdown-results">
                                            <div 
                                                v-for="vehicle in vehicleSearchResults" 
                                                :key="vehicle.id"
                                                class="dropdown-item vehicle-item"
                                                @click="selectVehicle(vehicle)"
                                            >
                                                <div class="vehicle-info-dropdown">
                                                    <div class="vehicle-main">{{ vehicle.plateNumber }} - {{ vehicle.brand.name }} {{ vehicle.model.name }}</div>
                                                    <div class="vehicle-details-dropdown">
                                                        <span v-if="vehicle.year">{{ vehicle.year }}</span>
                                                        <span v-if="vehicle.color">{{ vehicle.color.name }}</span>
                                                        <span v-if="vehicle.fuelType">{{ vehicle.fuelType.name }}</span>
                                                        <span v-if="vehicle.category">{{ vehicle.category.name }}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    class="vehicle-details-btn"
                                                    @click.stop="showVehicleDetails(vehicle)"
                                                    title="Voir les détails"
                                                >
                                                    <i class="fas fa-info-circle"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="selectedVehicle" class="selected-item">
                                            <span>{{ selectedVehicle.plateNumber }} - {{ selectedVehicle.brand.name }} {{ selectedVehicle.model.name }}</span>
                                            <div class="selected-item-actions">
                                                <button type="button" @click="showVehicleDetails(selectedVehicle)" class="details-btn" title="Voir les détails">
                                                    <i class="fas fa-info-circle"></i>
                                                </button>
                                                <button type="button" @click="clearVehicle" class="clear-btn" title="Supprimer la sélection">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="driver">Conducteur</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="driver"
                                            v-model="driverSearchTerm"
                                            @input="searchDrivers"
                                            @focus="onDriverFocus"
                                            @blur="hideDriverDropdown"
                                            placeholder="Rechercher un conducteur..."
                                            :style="{ display: selectedDriver ? 'none' : 'block' }"
                                        >
                                        <div v-if="showDriverDropdown && driverSearchResults.length > 0" class="dropdown-results">
                                            <div 
                                                v-for="driver in driverSearchResults" 
                                                :key="driver.id"
                                                class="dropdown-item driver-item"
                                                @click="selectDriver(driver)"
                                            >
                                                <div class="driver-info">
                                                    <div class="driver-name">{{ driver.fullName }}</div>
                                                    <div class="driver-details">
                                                        <span v-if="driver.phone">{{ driver.phone }}</span>
                                                        <span v-if="driver.email">{{ driver.email }}</span>
                                                        <span v-if="driver.licenseNumber">Permis: {{ driver.licenseNumber }}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    class="driver-details-btn"
                                                    @click.stop="showDriverDetails(driver)"
                                                    title="Voir les détails"
                                                >
                                                    <i class="fas fa-info-circle"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="selectedDriver" class="selected-item">
                                            <span>{{ selectedDriver.fullName }}</span>
                                            <div class="selected-item-actions">
                                                <button type="button" @click="showDriverDetails(selectedDriver)" class="details-btn" title="Voir les détails">
                                                    <i class="fas fa-info-circle"></i>
                                                </button>
                                                <button type="button" @click="clearDriver" class="clear-btn" title="Supprimer la sélection">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="title">Motif *</label>
                                <input 
                                    type="text" 
                                    id="title"
                                    v-model="form.title"
                                    placeholder="Ex: Problème de freins"
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="description">Description</label>
                                <textarea 
                                    id="description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description détaillée du problème..."
                                ></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="intervention-type">Type d'intervention</label>
                                    <div class="searchable-select">
                                        <input 
                                            type="text" 
                                            id="intervention-type"
                                            v-model="interventionTypeSearch"
                                            @input="handleInterventionTypeSearch"
                                            @focus="onInterventionTypeFocus"
                                            @blur="onInterventionTypeBlur"
                                            placeholder="Rechercher un type d'intervention..."
                                            autocomplete="off"
                                            autocorrect="off"
                                            autocapitalize="off"
                                            spellcheck="false"
                                        >
                                        <div v-if="showInterventionTypeDropdown && interventionTypeSearchResults.length > 0" class="dropdown-options">
                                            <div v-if="interventionTypeSearch.length < 2" class="dropdown-header">
                                                <i class="fas fa-star"></i>
                                                Types suggérés
                                            </div>
                                            <div 
                                                v-for="type in interventionTypeSearchResults" 
                                                :key="type.id" 
                                                class="dropdown-option"
                                                @click="selectInterventionType(type)"
                                            >
                                                <div class="type-option">
                                                    <div class="type-name">{{ type.name }}</div>
                                                    <div v-if="type.description" class="type-description">
                                                        {{ type.description }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="priority">Priorité</label>
                                    <select id="priority" v-model="form.priority">
                                        <option value="low">Basse</option>
                                        <option value="medium">Moyenne</option>
                                        <option value="high">Haute</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="status">Statut</label>
                                    <select id="status" v-model="form.currentStatus">
                                        <option value="reported">Signalé</option>
                                        <option value="in_progress">En cours</option>
                                        <option value="completed">Terminé</option>
                                        <option value="closed">Clôturé</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="estimated-duration">Durée estimée (jours)</label>
                                    <input 
                                        type="number" 
                                        id="estimated-duration"
                                        v-model="form.estimatedDurationDays"
                                        min="1"
                                        placeholder="Ex: 3"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="odometer-reading">Kilométrage</label>
                                    <div class="input-with-button">
                                        <input 
                                            type="number" 
                                            id="odometer-reading"
                                            v-model="form.odometerReading"
                                            min="0"
                                            placeholder="Ex: 150000"
                                        >
                                        <button 
                                            type="button" 
                                            class="btn btn-sm btn-outline" 
                                            @click="syncVehicleMileageFromTracking" 
                                            :disabled="saving || !form.vehicleId"
                                            title="Synchroniser depuis le dispositif de tracking"
                                        >
                                            <i class="fas fa-satellite-dish"></i>
                                        </button>
                                    </div>
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
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-primary" @click="saveIntervention" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ isEditing ? 'Modifier' : 'Créer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de détails du véhicule -->
            <div v-if="showVehicleDetailsModal" class="modal-overlay" @click="closeVehicleDetailsModal">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Détails du véhicule</h3>
                        <button class="close-btn" @click="closeVehicleDetailsModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body" v-if="selectedVehicleForDetails">
                        <div class="vehicle-details-content">
                            <div class="detail-row">
                                <label>Plaque d'immatriculation:</label>
                                <span>{{ selectedVehicleForDetails.plateNumber }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.vin">
                                <label>VIN:</label>
                                <span>{{ selectedVehicleForDetails.vin }}</span>
                            </div>
                            <div class="detail-row">
                                <label>Marque:</label>
                                <span>{{ selectedVehicleForDetails.brand.name }}</span>
                            </div>
                            <div class="detail-row">
                                <label>Modèle:</label>
                                <span>{{ selectedVehicleForDetails.model.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.year">
                                <label>Année:</label>
                                <span>{{ selectedVehicleForDetails.year }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.color">
                                <label>Couleur:</label>
                                <span>{{ selectedVehicleForDetails.color.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.category">
                                <label>Catégorie:</label>
                                <span>{{ selectedVehicleForDetails.category.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.fuelType">
                                <label>Type de carburant:</label>
                                <span>{{ selectedVehicleForDetails.fuelType.name }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.engineSize">
                                <label>Cylindrée:</label>
                                <span>{{ selectedVehicleForDetails.engineSize }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedVehicleForDetails.mileage">
                                <label>Kilométrage:</label>
                                <span>{{ selectedVehicleForDetails.mileage }} km</span>
                            </div>
                            <div class="detail-row">
                                <label>Statut:</label>
                                <span :class="['status-badge', 'status-' + selectedVehicleForDetails.status]">
                                    {{ getVehicleStatusLabel(selectedVehicleForDetails.status) }}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeVehicleDetailsModal">
                            Fermer
                        </button>
                        <button type="button" class="btn btn-primary" @click="selectVehicleFromDetails">
                            Sélectionner ce véhicule
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de détails du conducteur -->
            <div v-if="showDriverDetailsModal" class="modal-overlay" @click="closeDriverDetailsModal">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Détails du conducteur</h3>
                        <button class="close-btn" @click="closeDriverDetailsModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body" v-if="selectedDriverForDetails">
                        <div class="driver-details-content">
                            <div class="detail-row">
                                <label>Nom complet:</label>
                                <span>{{ selectedDriverForDetails.fullName }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedDriverForDetails.phone">
                                <label>Téléphone:</label>
                                <span>{{ selectedDriverForDetails.phone }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedDriverForDetails.email">
                                <label>Email:</label>
                                <span>{{ selectedDriverForDetails.email }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedDriverForDetails.licenseNumber">
                                <label>Numéro de permis:</label>
                                <span>{{ selectedDriverForDetails.licenseNumber }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedDriverForDetails.licenseExpiryDate">
                                <label>Expiration du permis:</label>
                                <span>{{ formatDate(selectedDriverForDetails.licenseExpiryDate) }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedDriverForDetails.address">
                                <label>Adresse:</label>
                                <span>{{ selectedDriverForDetails.address }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedDriverForDetails.emergencyContact">
                                <label>Contact d'urgence:</label>
                                <span>{{ selectedDriverForDetails.emergencyContact }}</span>
                            </div>
                            <div class="detail-row" v-if="selectedDriverForDetails.emergencyPhone">
                                <label>Téléphone d'urgence:</label>
                                <span>{{ selectedDriverForDetails.emergencyPhone }}</span>
                            </div>
                            <div class="detail-row">
                                <label>Statut:</label>
                                <span :class="['status-badge', selectedDriverForDetails.isActive ? 'status-active' : 'status-inactive']">
                                    {{ selectedDriverForDetails.isActive ? 'Actif' : 'Inactif' }}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDriverDetailsModal">
                            Fermer
                        </button>
                        <button type="button" class="btn btn-primary" @click="selectDriverFromDetails">
                            Sélectionner ce conducteur
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de suppression -->
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
                            <p v-if="interventionToDelete">
                                Êtes-vous sûr de vouloir supprimer l'intervention 
                                <strong>{{ interventionToDelete.title }}</strong> ?
                            </p>
                            <p class="text-muted">Cette action est irréversible.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Modal du workflow -->
            <div v-if="showWorkflowModal" class="modal-overlay" @click="closeWorkflowModal">
                <div class="modal-content workflow-modal" @click.stop>
                    <div class="modal-header">
                        <h3>Gestion du Workflow</h3>
                        <button class="modal-close" @click="closeWorkflowModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <WorkflowManager 
                            v-if="workflowIntervention"
                            :intervention="workflowIntervention"
                            @workflow-updated="onWorkflowUpdated"
                        />
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            interventions: [],
            availableVehicles: [],
            availableDrivers: [],
            interventionTypes: [],
            interventionTypeSearch: '',
            interventionTypeSearchResults: [],
            showInterventionTypeDropdown: false,
            selectedInterventionType: null,
            loading: false,
            saving: false,
            searchTerm: '',
            statusFilter: '',
            priorityFilter: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            showVehicleDetailsModal: false,
            showWorkflowModal: false,
            workflowIntervention: null,
            selectedVehicleForDetails: null,
            showDriverDetailsModal: false,
            selectedDriverForDetails: null,
            isEditing: false,
            interventionToDelete: null,
            searchTimeout: null,
            // Nouvelles propriétés pour la recherche
            vehicleSearchTerm: '',
            vehicleSearchResults: [],
            showVehicleDropdown: false,
            selectedVehicle: null,
            driverSearchTerm: '',
            driverSearchResults: [],
            showDriverDropdown: false,
            selectedDriver: null,
            vehicleSearchTimeout: null,
            driverSearchTimeout: null,
            form: {
                id: null,
                vehicleId: '',
                driverId: '',
                interventionTypeId: '',
                title: '',
                description: '',
                priority: 'medium',
                currentStatus: 'reported',
                estimatedDurationDays: '',
                odometerReading: '',
                notes: ''
            }
        };
    },
    
    mounted() {
        this.loadInterventions();
        this.loadInterventionTypes();
    },
    
    methods: {
        async loadInterventions() {
            this.loading = true;
            try {
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    search: this.searchTerm,
                    status: this.statusFilter,
                    priority: this.priorityFilter
                });
                
                const response = await window.apiService.request(`/vehicle-interventions?${params.toString()}`);
                
                if (response.success) {
                    this.interventions = response.data;
                    this.pagination = response.pagination;
                    
                    // Debug pour voir les données chargées
                    console.log('DEBUG LOAD - interventions loaded:', this.interventions);
                    if (this.interventions.length > 0) {
                        console.log('DEBUG LOAD - first intervention:', this.interventions[0]);
                        console.log('DEBUG LOAD - estimatedDurationDays:', this.interventions[0].estimatedDurationDays);
                        console.log('DEBUG LOAD - odometerReading:', this.interventions[0].odometerReading);
                        console.log('DEBUG LOAD - notes:', this.interventions[0].notes);
                    }
                } else {
                    this.showNotification('Erreur lors du chargement des interventions: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
                this.showNotification('Erreur lors du chargement des interventions', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        
        async loadInterventionTypes() {
            try {
                const response = await window.apiService.request('/intervention-types/active');
                if (response.success) {
                    this.interventionTypes = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types d\'intervention:', error);
            }
        },

        async searchInterventionTypes(searchTerm) {
            try {
                const response = await window.apiService.searchInterventionTypes(searchTerm, 10);
                if (response.success) {
                    this.interventionTypeSearchResults = response.data;
                }
            } catch (error) {
                console.error('Erreur lors de la recherche des types d\'intervention:', error);
                this.interventionTypeSearchResults = [];
            }
        },

        handleInterventionTypeSearch() {
            if (this.interventionTypeSearch.length >= 2) {
                this.searchInterventionTypes(this.interventionTypeSearch);
            } else if (this.interventionTypeSearch.length === 0) {
                this.interventionTypeSearchResults = [];
            }
        },

        onInterventionTypeFocus() {
            this.showInterventionTypeDropdown = true;
            if (this.interventionTypeSearch.length >= 2) {
                this.searchInterventionTypes(this.interventionTypeSearch);
            } else if (this.interventionTypeSearch.length === 0) {
                this.loadInitialInterventionTypes();
            }
        },

        onInterventionTypeBlur() {
            setTimeout(() => {
                this.showInterventionTypeDropdown = false;
            }, 200);
        },

        async loadInitialInterventionTypes() {
            try {
                const response = await window.apiService.searchInterventionTypes('', 10);
                if (response.success) {
                    this.interventionTypeSearchResults = response.data.slice(0, 5);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types d\'intervention initiaux:', error);
                this.interventionTypeSearchResults = [];
            }
        },

        selectInterventionType(type) {
            this.selectedInterventionType = type;
            this.interventionTypeSearch = type.name;
            this.form.interventionTypeId = type.id;
            this.showInterventionTypeDropdown = false;
        },

        cleanFormData(formData) {
            const cleaned = { ...formData };
            
            // Nettoyer les champs numériques vides
            if (cleaned.estimatedDurationDays === '' || cleaned.estimatedDurationDays === null) {
                delete cleaned.estimatedDurationDays;
            } else if (cleaned.estimatedDurationDays !== undefined && cleaned.estimatedDurationDays !== '') {
                cleaned.estimatedDurationDays = parseInt(cleaned.estimatedDurationDays);
            }
            
            if (cleaned.actualDurationDays === '' || cleaned.actualDurationDays === null) {
                delete cleaned.actualDurationDays;
            } else if (cleaned.actualDurationDays !== undefined && cleaned.actualDurationDays !== '') {
                cleaned.actualDurationDays = parseInt(cleaned.actualDurationDays);
            }
            
            if (cleaned.odometerReading === '' || cleaned.odometerReading === null) {
                delete cleaned.odometerReading;
            } else if (cleaned.odometerReading !== undefined && cleaned.odometerReading !== '') {
                cleaned.odometerReading = parseInt(cleaned.odometerReading);
            }
            
            if (cleaned.assignedTo === '' || cleaned.assignedTo === null) {
                delete cleaned.assignedTo;
            } else if (cleaned.assignedTo !== undefined && cleaned.assignedTo !== '') {
                cleaned.assignedTo = parseInt(cleaned.assignedTo);
            }
            
            // Nettoyer les champs de chaîne vides
            if (cleaned.driverId === '') {
                delete cleaned.driverId;
            }
            
            if (cleaned.interventionTypeId === '') {
                delete cleaned.interventionTypeId;
            }
            
            return cleaned;
        },
        
        // Méthodes de recherche côté serveur
        async searchVehicles() {
            clearTimeout(this.vehicleSearchTimeout);
            this.vehicleSearchTimeout = setTimeout(async () => {
                if (this.vehicleSearchTerm.length < 2) {
                    this.vehicleSearchResults = [];
                    return;
                }
                
                try {
                    const response = await window.apiService.getVehicles(
                        null, 
                        this.vehicleSearchTerm, 
                        'active', 
                        1, 
                        20
                    );
                    if (response.success) {
                        this.vehicleSearchResults = response.data;
                    }
                } catch (error) {
                    console.error('Erreur lors de la recherche de véhicules:', error);
                    this.vehicleSearchResults = [];
                }
            }, 300);
        },
        
        async searchDrivers() {
            clearTimeout(this.driverSearchTimeout);
            this.driverSearchTimeout = setTimeout(async () => {
                if (this.driverSearchTerm.length < 2) {
                    this.driverSearchResults = [];
                    return;
                }
                
                try {
                    const response = await window.apiService.getDrivers(
                        null, 
                        this.driverSearchTerm, 
                        'active', 
                        1, 
                        20
                    );
                    if (response.success) {
                        this.driverSearchResults = response.data;
                    }
                } catch (error) {
                    console.error('Erreur lors de la recherche de conducteurs:', error);
                    this.driverSearchResults = [];
                }
            }, 300);
        },
        
        selectVehicle(vehicle) {
            this.selectedVehicle = vehicle;
            this.form.vehicleId = vehicle.id;
            this.vehicleSearchTerm = '';
            this.showVehicleDropdown = false;
            this.vehicleSearchResults = [];
        },
        
        selectDriver(driver) {
            this.selectedDriver = driver;
            this.form.driverId = driver.id;
            this.driverSearchTerm = '';
            this.showDriverDropdown = false;
            this.driverSearchResults = [];
        },
        
        clearVehicle() {
            this.selectedVehicle = null;
            this.form.vehicleId = '';
            this.vehicleSearchTerm = '';
            this.vehicleSearchResults = [];
        },
        
        clearDriver() {
            this.selectedDriver = null;
            this.form.driverId = '';
            this.driverSearchTerm = '';
            this.driverSearchResults = [];
        },
        
        hideVehicleDropdown() {
            setTimeout(() => {
                this.showVehicleDropdown = false;
            }, 200);
        },
        
        async onVehicleFocus() {
            this.showVehicleDropdown = true;
            // Si pas de résultats et pas de terme de recherche, charger les 5 premiers véhicules
            if (this.vehicleSearchResults.length === 0 && !this.vehicleSearchTerm) {
                await this.loadInitialVehicles();
            }
        },
        
        async onDriverFocus() {
            this.showDriverDropdown = true;
            // Si pas de résultats et pas de terme de recherche, charger les 5 premiers conducteurs
            if (this.driverSearchResults.length === 0 && !this.driverSearchTerm) {
                await this.loadInitialDrivers();
            }
        },
        
        async loadInitialVehicles() {
            try {
                const response = await window.apiService.getVehicles(
                    null, 
                    '', 
                    'active', 
                    1, 
                    5
                );
                if (response.success) {
                    this.vehicleSearchResults = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules initiaux:', error);
                this.vehicleSearchResults = [];
            }
        },
        
        async loadInitialDrivers() {
            try {
                const response = await window.apiService.getDrivers(
                    null, 
                    '', 
                    'active', 
                    1, 
                    5
                );
                if (response.success) {
                    this.driverSearchResults = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des conducteurs initiaux:', error);
                this.driverSearchResults = [];
            }
        },
        
        async syncVehicleMileageFromTracking() {
            if (!this.form.vehicleId) {
                this.showNotification('Veuillez sélectionner un véhicule', 'error');
                return;
            }
            
            try {
                this.saving = true;
                const response = await window.apiService.syncVehicleMileageFromTracking(this.form.vehicleId);
                
                if (response.success) {
                    this.form.odometerReading = response.data.newMileage;
                    this.showNotification(`Kilométrage synchronisé: ${response.data.newMileage} km`, 'success');
                } else {
                    this.showNotification('Erreur lors de la synchronisation: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la synchronisation:', error);
                this.showNotification('Erreur lors de la synchronisation du kilométrage', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        hideDriverDropdown() {
            setTimeout(() => {
                this.showDriverDropdown = false;
            }, 200);
        },
        
        showDriverDetails(driver) {
            this.selectedDriverForDetails = driver;
            this.showDriverDetailsModal = true;
        },
        
        closeDriverDetailsModal() {
            this.showDriverDetailsModal = false;
            this.selectedDriverForDetails = null;
        },
        
        selectDriverFromDetails() {
            if (this.selectedDriverForDetails) {
                this.selectDriver(this.selectedDriverForDetails);
                this.closeDriverDetailsModal();
            }
        },
        
        showVehicleDetails(vehicle) {
            this.selectedVehicleForDetails = vehicle;
            this.showVehicleDetailsModal = true;
        },
        
        closeVehicleDetailsModal() {
            this.showVehicleDetailsModal = false;
            this.selectedVehicleForDetails = null;
        },
        
        showWorkflow(intervention) {
            this.workflowIntervention = intervention;
            this.showWorkflowModal = true;
        },
        
        closeWorkflowModal() {
            this.showWorkflowModal = false;
            this.workflowIntervention = null;
        },
        
        onWorkflowUpdated() {
            this.loadInterventions();
            this.closeWorkflowModal();
        },
        
        selectVehicleFromDetails() {
            if (this.selectedVehicleForDetails) {
                this.selectVehicle(this.selectedVehicleForDetails);
                this.closeVehicleDetailsModal();
            }
        },
        
        getVehicleStatusLabel(status) {
            const labels = {
                'active': 'Actif',
                'maintenance': 'En maintenance',
                'inactive': 'Inactif',
                'sold': 'Vendu',
                'scrapped': 'Mis au rebut'
            };
            return labels[status] || status;
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadInterventions();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadInterventions();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editIntervention(intervention) {
            console.log('DEBUG EDIT - intervention data:', intervention);
            console.log('DEBUG EDIT - estimatedDurationDays from intervention:', intervention.estimatedDurationDays);
            
            this.isEditing = true;
            this.form = {
                id: intervention.id,
                vehicleId: intervention.vehicle.id,
                driverId: intervention.driver ? intervention.driver.id : '',
                interventionTypeId: intervention.interventionType ? intervention.interventionType.id : '',
                title: intervention.title,
                description: intervention.description || '',
                priority: intervention.priority,
                currentStatus: intervention.currentStatus,
                estimatedDurationDays: intervention.estimatedDurationDays !== null ? intervention.estimatedDurationDays : '',
                odometerReading: intervention.odometerReading !== null ? intervention.odometerReading : '',
                notes: intervention.notes || ''
            };
            
            console.log('DEBUG EDIT - form after setting:', this.form);
            console.log('DEBUG EDIT - estimatedDurationDays in form:', this.form.estimatedDurationDays);
            
            // Pré-remplir les champs de recherche
            this.selectedVehicle = intervention.vehicle;
            this.vehicleSearchTerm = '';
            this.selectedDriver = intervention.driver || null;
            this.driverSearchTerm = '';
            this.selectedInterventionType = intervention.interventionType || null;
            this.interventionTypeSearch = intervention.interventionType ? intervention.interventionType.name : '';
            
            this.showModal = true;
        },
        
        async saveIntervention() {
            if (!this.form.vehicleId || !this.form.title.trim()) {
                this.showNotification('Le véhicule et le titre sont requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                // Nettoyer les données avant l'envoi
                const cleanData = this.cleanFormData(this.form);
                
                let response;
                if (this.isEditing) {
                    response = await window.apiService.request(`/vehicle-interventions/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(cleanData)
                    });
                } else {
                    response = await window.apiService.request('/vehicle-interventions', {
                        method: 'POST',
                        body: JSON.stringify(cleanData)
                    });
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadInterventions();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        deleteIntervention(intervention) {
            this.interventionToDelete = intervention;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.interventionToDelete) return;
            
            try {
                const response = await window.apiService.request(`/vehicle-interventions/${this.interventionToDelete.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadInterventions();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.interventionToDelete = null;
        },
        
        resetForm() {
            this.form = {
                id: null,
                vehicleId: '',
                driverId: '',
                interventionTypeId: '',
                title: '',
                description: '',
                priority: 'medium',
                currentStatus: 'reported',
                estimatedDurationDays: '',
                odometerReading: '',
                notes: ''
            };
            
            // Réinitialiser les champs de recherche
            this.selectedVehicle = null;
            this.vehicleSearchTerm = '';
            this.vehicleSearchResults = [];
            this.showVehicleDropdown = false;
            this.selectedDriver = null;
            this.driverSearchTerm = '';
            this.driverSearchResults = [];
            this.showDriverDropdown = false;
            this.selectedInterventionType = null;
            this.interventionTypeSearch = '';
            this.interventionTypeSearchResults = [];
            this.showInterventionTypeDropdown = false;
        },
        
        getPriorityLabel(priority) {
            const labels = {
                'low': 'Basse',
                'medium': 'Moyenne',
                'high': 'Haute',
                'urgent': 'Urgente'
            };
            return labels[priority] || priority;
        },
        
        getStatusLabel(status) {
            const labels = {
                'reported': 'Signalé',
                'in_prediagnostic': 'En prédiagnostic',
                'prediagnostic_completed': 'Prédiagnostic terminé',
                'in_quote': 'En devis',
                'quote_received': 'Devis reçu',
                'in_approval': 'En accord',
                'approved': 'Accord donné',
                'in_repair': 'En réparation',
                'repair_completed': 'Réparation terminée',
                'in_reception': 'En réception',
                'vehicle_received': 'Véhicule reçu',
                'cancelled': 'Annulé'
            };
            return labels[status] || status;
        },

        getStatusClass(status) {
            const statusClasses = {
                'reported': 'status-reported',
                'in_prediagnostic': 'status-in-prediagnostic',
                'prediagnostic_completed': 'status-prediagnostic-completed',
                'in_quote': 'status-in-quote',
                'quote_received': 'status-quote-received',
                'in_approval': 'status-in-approval',
                'approved': 'status-approved',
                'in_repair': 'status-in-repair',
                'repair_completed': 'status-repair-completed',
                'in_reception': 'status-in-reception',
                'vehicle_received': 'status-vehicle-received',
                'cancelled': 'status-cancelled'
            };
            return statusClasses[status] || 'status-unknown';
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        },
        
        formatNumber(number) {
            if (!number) return '0';
            return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        },
        
        truncateText(text, maxLength) {
            if (!text) return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        },
        
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined') {
    window.VehicleInterventionCrud = VehicleInterventionCrud;
    console.log('VehicleInterventionCrud component registered globally');
}


