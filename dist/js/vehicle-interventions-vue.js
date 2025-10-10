const VehicleInterventionCrud = {
    components: {
        WorkflowManager: window.WorkflowManager
    },
    template: `
        <div class="vehicle-intervention-crud">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1 class="section-title">Gestion des Interventions</h1>
                            <p class="page-subtitle">Suivez et gérez toutes les interventions sur vos véhicules</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="fas fa-plus"></i>
                            Nouvelle Intervention
                        </button>
                    </div>
                </div>
            </div>

            <!-- Barre de recherche simple et bouton filtres -->
            <div style="display: flex; gap: 12px; margin-bottom: 24px; align-items: center;">
                <div class="search-bar-container" style="flex: 1;">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        class="form-control" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher par code, véhicule, marque, modèle, motif..."
                    >
                </div>
                <button class="btn btn-outline" @click="toggleFiltersPanel" style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    <i class="fas fa-filter"></i>
                    Filtres
                    <span v-if="activeFiltersCount > 0" class="badge-count">{{ activeFiltersCount }}</span>
                </button>
            </div>

            <!-- Panneau de filtres latéral -->
            <div v-if="showFiltersPanel" class="filters-overlay" @click="closeFiltersPanel"></div>
            <div class="filters-panel" :class="{ 'filters-panel-open': showFiltersPanel }">
                <div class="filters-panel-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-filter"></i>
                        Filtres Avancés
                    </h3>
                    <button class="btn-icon" @click="closeFiltersPanel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="filters-panel-body">
                    <!-- Filtre par marque -->
                    <div class="filter-section">
                        <label class="form-label">Marque</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="filterBrandSearchTerm"
                                @focus="onFilterBrandFocus"
                                @input="searchFilterBrands"
                                :placeholder="selectedFilterBrand ? selectedFilterBrand.name : 'Rechercher une marque...'"
                                autocomplete="off"
                            >
                            <button 
                                v-if="selectedFilterBrand" 
                                type="button"
                                @click="clearFilterBrandSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                            
                            <!-- Dropdown Brand -->
                            <div v-if="showFilterBrandSearch" 
                                 class="dropdown-menu" 
                                 style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterBrands" style="padding: 20px; text-align: center; color: #6c757d;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    Chargement...
                                </div>
                                <div v-else-if="availableFilterBrands.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                    <i class="fas fa-search"></i>
                                    Aucune marque trouvée
                                </div>
                                <div v-else>
                                    <div v-if="filterBrandSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;">
                                        <i class="fas fa-star"></i> MARQUES POPULAIRES
                                    </div>
                                    <div 
                                        v-for="brand in availableFilterBrands" 
                                        :key="brand.id"
                                        @click="selectFilterBrand(brand)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'"
                                        @mouseout="$event.target.style.background='white'"
                                    >
                                        <div style="font-weight: 600;">{{ brand.name }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filtre par modèle -->
                    <div class="filter-section">
                        <label class="form-label">Modèle</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="filterModelSearchTerm"
                                @focus="onFilterModelFocus"
                                @input="searchFilterModels"
                                :placeholder="selectedFilterModel ? selectedFilterModel.name : 'Rechercher un modèle...'"
                                :disabled="!selectedFilterBrand"
                                autocomplete="off"
                            >
                            <button 
                                v-if="selectedFilterModel" 
                                type="button"
                                @click="clearFilterModelSelection"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                            
                            <!-- Dropdown Model -->
                            <div v-if="showFilterModelSearch" 
                                 class="dropdown-menu" 
                                 style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <div v-if="loadingFilterModels" style="padding: 20px; text-align: center; color: #6c757d;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    Chargement...
                                </div>
                                <div v-else-if="availableFilterModels.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                    <i class="fas fa-search"></i>
                                    Aucun modèle trouvé
                                </div>
                                <div v-else>
                                    <div v-if="filterModelSearchTerm.length === 0" style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 11px; font-weight: 600;">
                                        <i class="fas fa-star"></i> MODÈLES POPULAIRES
                                    </div>
                                    <div 
                                        v-for="model in availableFilterModels" 
                                        :key="model.id"
                                        @click="selectFilterModel(model)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'"
                                        @mouseout="$event.target.style.background='white'"
                                    >
                                        <div style="font-weight: 600;">{{ model.name }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <small v-if="!selectedFilterBrand" style="color: #6c757d; font-size: 12px; margin-top: 4px; display: block;">
                            Sélectionnez d'abord une marque
                        </small>
                    </div>
                    
                    <!-- Période -->
                    <div class="filter-section">
                        <label class="form-label">Période</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <label style="font-size: 12px; color: #6c757d; display: block; margin-bottom: 4px;">Date début</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    v-model="dateStart"
                                    :max="dateEnd || null"
                                >
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6c757d; display: block; margin-bottom: 4px;">Date fin</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    v-model="dateEnd"
                                    :min="dateStart || null"
                                >
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filtre par statut -->
                    <div class="filter-section">
                        <label class="form-label">Statut</label>
                        <select v-model="statusFilter" class="form-control">
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
                            <option value="invoiced">Facturé</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                    </div>

                    <!-- Filtre par priorité -->
                    <div class="filter-section">
                        <label class="form-label">Priorité</label>
                        <select v-model="priorityFilter" class="form-control">
                            <option value="">Toutes les priorités</option>
                            <option value="low">Basse</option>
                            <option value="medium">Moyenne</option>
                            <option value="high">Haute</option>
                            <option value="urgent">Urgente</option>
                        </select>
                    </div>

                    <!-- Boutons d'action du panneau -->
                    <div class="filters-panel-actions">
                        <button class="btn btn-outline" @click="resetFilters">
                            <i class="fas fa-redo"></i>
                            Réinitialiser
                        </button>
                        <button class="btn btn-primary" @click="applyFilters">
                            <i class="fas fa-check"></i>
                            Appliquer
                        </button>
                    </div>
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
                                            {{ intervention.vehicle.brand?.name }} {{ intervention.vehicle.model?.name }} ({{ intervention.vehicle.year }})
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
                                            {{ intervention.statusLabel || getStatusLabel(intervention.currentStatus) }}
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
                                                <button type="button" @click="clearVehicle" class="clear-btn" title="Supprimer la sélection">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="selectedVehicle" class="selected-item-details">
                                            <div class="info-item" v-if="selectedVehicle.vin">
                                                <span class="label">VIN:</span>
                                                <span class="value">{{ selectedVehicle.vin }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedVehicle.year">
                                                <span class="label">Année:</span>
                                                <span class="value">{{ selectedVehicle.year }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedVehicle.color">
                                                <span class="label">Couleur:</span>
                                                <span class="value">{{ selectedVehicle.color.name }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedVehicle.fuelType">
                                                <span class="label">Carburant:</span>
                                                <span class="value">{{ selectedVehicle.fuelType.name }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedVehicle.category">
                                                <span class="label">Catégorie:</span>
                                                <span class="value">{{ selectedVehicle.category.name }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedVehicle.mileage">
                                                <span class="label">Kilométrage:</span>
                                                <span class="value">{{ formatNumber(selectedVehicle.mileage) }} km</span>
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
                                                <button type="button" @click="clearDriver" class="clear-btn" title="Supprimer la sélection">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="selectedDriver" class="selected-item-details">
                                            <div class="info-item" v-if="selectedDriver.phone">
                                                <span class="label">Téléphone:</span>
                                                <span class="value">{{ selectedDriver.phone }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedDriver.email">
                                                <span class="label">Email:</span>
                                                <span class="value">{{ selectedDriver.email }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedDriver.licenseNumber">
                                                <span class="label">Permis:</span>
                                                <span class="value">{{ selectedDriver.licenseNumber }}</span>
                                            </div>
                                            <div class="info-item" v-if="selectedDriver.licenseExpiryDate">
                                                <span class="label">Expiration:</span>
                                                <span class="value">{{ formatDateOnly(selectedDriver.licenseExpiryDate) }}</span>
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
                                <label for="description">Ressenti utilisateur</label>
                                <textarea 
                                    id="description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Décrivez le ressenti de l'utilisateur concernant le problème..."
                                ></textarea>
                            </div>
                            
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
                            
                            <div class="form-group">
                                <label for="priority">Priorité</label>
                                <select id="priority" v-model="form.priority">
                                    <option value="low">Basse</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="high">Haute</option>
                                    <option value="urgent">Urgente</option>
                                </select>
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
                                <span :class="['status-badge', 'status-' + selectedDriverForDetails.status]">
                                    {{ getDriverStatusLabel(selectedDriverForDetails.status) }}
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
            showFiltersPanel: false,
            // Filtres avancés - Marque
            filterBrandSearchTerm: '',
            selectedFilterBrand: null,
            availableFilterBrands: [],
            showFilterBrandSearch: false,
            loadingFilterBrands: false,
            brandSearchTimeout: null,
            // Filtres avancés - Modèle
            filterModelSearchTerm: '',
            selectedFilterModel: null,
            availableFilterModels: [],
            showFilterModelSearch: false,
            loadingFilterModels: false,
            modelSearchTimeout: null,
            // Filtres avancés - Période
            dateStart: '',
            dateEnd: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showVehicleDetailsModal: false,
            showWorkflowModal: false,
            workflowIntervention: null,
            selectedVehicleForDetails: null,
            showDriverDetailsModal: false,
            selectedDriverForDetails: null,
            isEditing: false,
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
    
    computed: {
        activeFiltersCount() {
            let count = 0;
            if (this.statusFilter) count++;
            if (this.priorityFilter) count++;
            if (this.selectedFilterBrand) count++;
            if (this.selectedFilterModel) count++;
            if (this.dateStart) count++;
            if (this.dateEnd) count++;
            return count;
        }
    },
    
    async mounted() {
        // Attendre que l'API service soit disponible
        await this.waitForApiService();
        await this.loadInterventions();
        await this.loadInterventionTypes();
        
        // Fermer les dropdowns quand on clique ailleurs
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
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
                
                // Ajouter les filtres avancés
                if (this.selectedFilterBrand) {
                    params.append('brand', this.selectedFilterBrand.id);
                }
                if (this.selectedFilterModel) {
                    params.append('model', this.selectedFilterModel.id);
                }
                if (this.dateStart) {
                    params.append('startDate', this.dateStart);
                }
                if (this.dateEnd) {
                    params.append('endDate', this.dateEnd);
                }
                
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
                    this.$notifyError('Erreur lors du chargement des interventions: ' + response.message);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
                this.$notifyApiError(error, 'Erreur lors du chargement des interventions');
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
                const response = await window.apiService.request(`/intervention-types/search?search=${encodeURIComponent(searchTerm)}&limit=10`);
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
                const response = await window.apiService.request('/intervention-types/search?limit=10');
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
                    const response = await window.apiService.request('/vehicles/admin?limit=10&search=' + encodeURIComponent(searchTerm));
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
                    const response = await window.apiService.request('/drivers/admin?limit=10&search=' + encodeURIComponent(searchTerm));
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
                const response = await window.apiService.request('/vehicles/admin?limit=10');
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
                const response = await window.apiService.request('/drivers/admin?limit=10');
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
                this.$notifyError('Veuillez sélectionner un véhicule');
                return;
            }
            
            try {
                this.saving = true;
                const response = await window.apiService.request(`/vehicles/${this.form.vehicleId}/sync-mileage`, { method: 'POST' });
                
                if (response.success) {
                    this.form.odometerReading = response.data.newMileage;
                    this.$notifySuccess(`Kilométrage synchronisé: ${response.data.newMileage} km`);
                } else {
                    this.$notifyError('Erreur lors de la synchronisation: ' + response.message);
                }
            } catch (error) {
                console.error('Erreur lors de la synchronisation:', error);
                this.$notifyApiError(error, 'Erreur lors de la synchronisation du kilométrage');
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
        
        getDriverStatusLabel(status) {
            const labels = {
                'active': 'Actif',
                'inactive': 'Inactif',
                'suspended': 'Suspendu',
                'terminated': 'Résilié'
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
        
        toggleFiltersPanel() {
            this.showFiltersPanel = !this.showFiltersPanel;
        },
        
        closeFiltersPanel() {
            this.showFiltersPanel = false;
        },
        
        applyFilters() {
            this.currentPage = 1;
            this.loadInterventions();
            this.closeFiltersPanel();
        },
        
        resetFilters() {
            this.statusFilter = '';
            this.priorityFilter = '';
            this.selectedFilterBrand = null;
            this.selectedFilterModel = null;
            this.filterBrandSearchTerm = '';
            this.filterModelSearchTerm = '';
            this.dateStart = '';
            this.dateEnd = '';
            this.currentPage = 1;
            this.loadInterventions();
        },
        
        // Méthodes pour le filtre Marque
        async onFilterBrandFocus() {
            this.showFilterBrandSearch = true;
            // Précharger les 5 premières marques si aucune recherche
            if (this.filterBrandSearchTerm.length === 0 && this.availableFilterBrands.length === 0) {
                await this.loadTopBrands();
            } else if (this.filterBrandSearchTerm.length >= 2) {
                this.searchFilterBrands();
            }
        },
        
        async loadTopBrands() {
            this.loadingFilterBrands = true;
            try {
                const response = await window.apiService.getVehicleBrands('', 5);
                if (response.success) {
                    this.availableFilterBrands = response.data || [];
                    this.showFilterBrandSearch = true;
                }
            } catch (error) {
                console.error('Erreur chargement marques:', error);
            } finally {
                this.loadingFilterBrands = false;
            }
        },
        
        async searchFilterBrands() {
            clearTimeout(this.brandSearchTimeout);
            
            if (this.filterBrandSearchTerm.length === 0) {
                await this.loadTopBrands();
                return;
            }
            
            if (this.filterBrandSearchTerm.length < 2) {
                return;
            }
            
            this.brandSearchTimeout = setTimeout(async () => {
                this.loadingFilterBrands = true;
                try {
                    const response = await window.apiService.getVehicleBrands(this.filterBrandSearchTerm, 50);
                    if (response.success) {
                        this.availableFilterBrands = response.data || [];
                        this.showFilterBrandSearch = true;
                    }
                } catch (error) {
                    console.error('Erreur recherche marques:', error);
                } finally {
                    this.loadingFilterBrands = false;
                }
            }, 300);
        },
        
        selectFilterBrand(brand) {
            this.selectedFilterBrand = brand;
            this.filterBrandSearchTerm = brand.name;
            this.showFilterBrandSearch = false;
            this.availableFilterBrands = [];
            // Réinitialiser le modèle car la marque a changé
            this.selectedFilterModel = null;
            this.filterModelSearchTerm = '';
        },
        
        clearFilterBrandSelection() {
            this.selectedFilterBrand = null;
            this.filterBrandSearchTerm = '';
            this.showFilterBrandSearch = false;
            // Réinitialiser aussi le modèle
            this.selectedFilterModel = null;
            this.filterModelSearchTerm = '';
        },
        
        // Méthodes pour le filtre Modèle
        async onFilterModelFocus() {
            if (!this.selectedFilterBrand) return;
            this.showFilterModelSearch = true;
            // Précharger les 5 premiers modèles si aucune recherche
            if (this.filterModelSearchTerm.length === 0 && this.availableFilterModels.length === 0) {
                await this.loadTopModels();
            } else if (this.filterModelSearchTerm.length >= 2) {
                this.searchFilterModels();
            }
        },
        
        async loadTopModels() {
            if (!this.selectedFilterBrand) return;
            
            this.loadingFilterModels = true;
            try {
                const response = await window.apiService.getVehicleModels(
                    this.selectedFilterBrand.id,
                    '',
                    5
                );
                if (response.success) {
                    this.availableFilterModels = response.data || [];
                    this.showFilterModelSearch = true;
                }
            } catch (error) {
                console.error('Erreur chargement modèles:', error);
            } finally {
                this.loadingFilterModels = false;
            }
        },
        
        async searchFilterModels() {
            clearTimeout(this.modelSearchTimeout);
            
            if (!this.selectedFilterBrand) {
                this.availableFilterModels = [];
                this.showFilterModelSearch = false;
                return;
            }
            
            if (this.filterModelSearchTerm.length === 0) {
                await this.loadTopModels();
                return;
            }
            
            if (this.filterModelSearchTerm.length < 2) {
                return;
            }
            
            this.modelSearchTimeout = setTimeout(async () => {
                this.loadingFilterModels = true;
                try {
                    const response = await window.apiService.getVehicleModels(
                        this.selectedFilterBrand.id,
                        this.filterModelSearchTerm,
                        50
                    );
                    if (response.success) {
                        this.availableFilterModels = response.data || [];
                        this.showFilterModelSearch = true;
                    }
                } catch (error) {
                    console.error('Erreur recherche modèles:', error);
                } finally {
                    this.loadingFilterModels = false;
                }
            }, 300);
        },
        
        selectFilterModel(model) {
            this.selectedFilterModel = model;
            this.filterModelSearchTerm = model.name;
            this.showFilterModelSearch = false;
            this.availableFilterModels = [];
        },
        
        clearFilterModelSelection() {
            this.selectedFilterModel = null;
            this.filterModelSearchTerm = '';
            this.showFilterModelSearch = false;
        },
        
        handleClickOutside(event) {
            // Fermer les dropdowns de filtres si on clique ailleurs
            const target = event.target;
            if (!target.closest('.filter-section')) {
                this.showFilterBrandSearch = false;
                this.showFilterModelSearch = false;
            }
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
                this.$notifyError('Le véhicule et le titre sont requis');
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
                    this.$notifySuccess(response.message);
                    this.closeModal();
                    this.loadInterventions();
                } else {
                    this.$notifyError('Erreur: ' + response.message);
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.$notifyApiError(error, 'Erreur lors de la sauvegarde');
            } finally {
                this.saving = false;
            }
        },
        
        async deleteIntervention(intervention) {
            const confirmed = await window.confirmDestructive({
                title: 'Confirmer la suppression',
                message: `Êtes-vous sûr de vouloir supprimer l'intervention "${intervention.title}" ?`,
                details: {
                    title: 'Détails',
                    content: `Véhicule: ${intervention.vehicle.plateNumber} - ${intervention.vehicle.brand.name} ${intervention.vehicle.model.name}`
                },
                buttons: {
                    confirm: 'Supprimer',
                    cancel: 'Annuler'
                }
            });

            if (confirmed) {
                await this.confirmDelete(intervention);
            }
        },
        
        async confirmDelete(intervention) {
            try {
                const response = await window.apiService.request(`/vehicle-interventions/${intervention.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.$notifySuccess(response.message);
                    this.loadInterventions();
                } else {
                    this.$notifyError('Erreur: ' + response.message);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.$notifyApiError(error, 'Erreur lors de la suppression');
            }
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
        
        statusLabel(status) {
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
                'invoiced': 'Facturé',
                'cancelled': 'Annulé'
            };
            return labels[status] || status;
        },
        
        getStatusLabel(status) {
            return this.statusLabel(status);
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
                'invoiced': 'status-invoiced',
                'cancelled': 'status-cancelled'
            };
            return statusClasses[status] || 'status-unknown';
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        },
        
        formatDateOnly(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
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

        // Méthodes de notification
        $notifySuccess(message, options = {}) {
            return window.notifySuccess(message, options);
        },

        $notifyError(message, options = {}) {
            return window.notifyError(message, options);
        },

        $notifyWarning(message, options = {}) {
            return window.notifyWarning(message, options);
        },

        $notifyInfo(message, options = {}) {
            return window.notifyInfo(message, options);
        },

        $notify(message, type = 'info', options = {}) {
            return window.notify(message, type, options);
        },

        $notifyApiError(error, defaultMessage = 'Une erreur est survenue') {
            return window.notifyApiError(error, defaultMessage);
        },

        $notifyApiSuccess(message, options = {}) {
            return window.notifyApiSuccess(message, options);
        }
    }
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined') {
    window.VehicleInterventionCrud = VehicleInterventionCrud;
    console.log('VehicleInterventionCrud component registered globally');
}


