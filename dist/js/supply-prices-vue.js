/**
 * Impact Auto - Registre des Prix
 * Gestion de l'historique des prix des pièces et services
 */

window.SupplyPricesApp = {
    name: 'SupplyPricesApp',
    
    template: `
        <div class="parameter-crud">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h1 class="section-title">
                        <i class="fas fa-tags"></i>
                        Registre des Prix
                    </h1>
                    <p class="page-subtitle" style="margin-top: 8px;">Historique et analyse des prix des pièces et services</p>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button class="btn btn-primary" @click="showAddModal" v-if="canAdd">
                        <i class="fas fa-plus"></i>
                        Ajouter un prix
                    </button>
                    <button class="btn btn-outline" @click="loadPrices">
                        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
                        Actualiser
                    </button>
                </div>
            </div>

            <!-- Statistiques -->
            <div v-if="statistics" class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
                <div class="kpi-card">
                    <div class="kpi-label">Total Enregistrements</div>
                    <div class="kpi-value">{{ statistics.totalRecords || 0 }}</div>
                </div>
                <div class="kpi-card warning">
                    <div class="kpi-label">Anomalies Détectées</div>
                    <div class="kpi-value">{{ statistics.anomaliesCount || 0 }}</div>
                </div>
                <div class="kpi-card success">
                    <div class="kpi-label">Prix Moyen</div>
                    <div class="kpi-value">
                        {{ formatAmount(statistics.overallAvgPrice || 0) }}
                        <span class="unit">F</span>
                    </div>
                </div>
                <div class="kpi-card" :class="inflationClass">
                    <div class="kpi-label">Inflation Mois</div>
                    <div class="kpi-value">
                        {{ statistics.inflation ? statistics.inflation.toFixed(1) : '0.0' }}
                        <span class="unit">%</span>
                    </div>
                </div>
            </div>

            <!-- Barre de recherche simple -->
            <div style="display: flex; gap: 12px; margin-bottom: 24px; align-items: center;">
                <div class="search-bar-container">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        class="form-control" 
                        v-model="filters.search" 
                        @input="debounceSearch"
                        placeholder="Rechercher une pièce ou service..."
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
                    <div class="form-group">
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
                                    Tapez pour rechercher une marque
                                </div>
                                <div v-else>
                                    <div 
                                        v-for="brand in availableFilterBrands" 
                                        :key="brand.id"
                                        @click="selectFilterBrand(brand)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'"
                                        @mouseout="$event.target.style.background='white'"
                                    >
                                        <div style="font-weight: 600;">{{ brand.name }}</div>
                                        <div v-if="brand.country" style="font-size: 11px; color: #6c757d;">
                                            {{ brand.country }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
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
                                    Tapez pour rechercher un modèle
                                </div>
                                <div v-else>
                                    <div 
                                        v-for="model in availableFilterModels" 
                                        :key="model.id"
                                        @click="selectFilterModel(model)"
                                        style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                        @mouseover="$event.target.style.background='#f8f9fa'"
                                        @mouseout="$event.target.style.background='white'"
                                    >
                                        <div style="font-weight: 600;">{{ model.name }}</div>
                                        <div v-if="model.year" style="font-size: 11px; color: #6c757d;">
                                            Année: {{ model.year }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <small v-if="!selectedFilterBrand" style="color: #6c757d; font-size: 12px; margin-top: 4px; display: block;">
                            Sélectionnez d'abord une marque
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <select class="form-control" v-model="filters.workType" @change="applyFilters">
                            <option value="">Tous types</option>
                            <option value="labor">Main d'œuvre</option>
                            <option value="supply">Pièces</option>
                            <option value="other">Autres</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Source</label>
                        <select class="form-control" v-model="filters.sourceType" @change="applyFilters">
                            <option value="">Toutes sources</option>
                            <option value="auto">Automatique</option>
                            <option value="manual">Manuel</option>
                            <option value="catalog">Catalogue</option>
                            <option value="import">Import</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Année</label>
                        <input 
                            type="number" 
                            class="form-control" 
                            v-model="filters.recordedYear" 
                            @change="applyFilters"
                            placeholder="2025"
                            min="2020"
                            :max="currentYear"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" v-model="filters.anomaliesOnly" @change="applyFilters">
                            Anomalies uniquement
                        </label>
                    </div>
                </div>
                
                <div class="filters-panel-footer">
                    <button class="btn btn-outline" @click="resetFilters" style="flex: 1;">
                        <i class="fas fa-undo"></i>
                        Réinitialiser
                    </button>
                    <button class="btn btn-primary" @click="closeFiltersPanel" style="flex: 1;">
                        <i class="fas fa-check"></i>
                        Appliquer
                    </button>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading && !prices.length" class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Chargement des prix...</p>
            </div>

            <!-- Liste des prix -->
            <div v-else-if="prices.length > 0">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th @click="sort('description')">
                                Pièce/Service
                                <i class="fas fa-sort" v-if="sortBy !== 'description'"></i>
                                <i :class="sortOrder === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'" v-else></i>
                            </th>
                            <th>Véhicule</th>
                            <th @click="sort('unitPrice')">
                                Prix Unitaire
                                <i class="fas fa-sort" v-if="sortBy !== 'unitPrice'"></i>
                                <i :class="sortOrder === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'" v-else></i>
                            </th>
                            <th>Quantité</th>
                            <th>Total</th>
                            <th @click="sort('recordedAt')">
                                Date
                                <i class="fas fa-sort" v-if="sortBy !== 'recordedAt'"></i>
                                <i :class="sortOrder === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'" v-else></i>
                            </th>
                            <th>Fournisseur</th>
                            <th>Source</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="price in prices" :key="price.id">
                            <td>
                                <strong>{{ price.description }}</strong>
                                <br>
                                <small style="color: #6c757d;">{{ getWorkTypeLabel(price.workType) }}</small>
                            </td>
                            <td>
                                <strong>{{ price.vehicle.brand }} {{ price.vehicle.model }}</strong>
                                <br>
                                <small style="color: #6c757d;">{{ price.vehicle.year }}</small>
                            </td>
                            <td class="text-right">
                                <strong>{{ formatAmount(price.unitPrice) }}</strong> {{ price.currency }}
                            </td>
                            <td class="text-center">{{ price.quantity }}</td>
                            <td class="text-right">
                                <strong>{{ formatAmount(price.totalPrice) }}</strong> {{ price.currency }}
                            </td>
                            <td>{{ formatDate(price.recordedAt) }}</td>
                            <td>{{ price.garage || '-' }}</td>
                            <td>
                                <span class="badge" :class="'badge-' + getSourceBadgeClass(price.sourceType)">
                                    {{ price.sourceTypeLabel }}
                                </span>
                            </td>
                            <td>
                                <span v-if="price.isAnomaly" class="badge badge-danger" :title="'Écart: ' + price.deviationPercent + '%'">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    {{ price.anomalyLabel }}
                                </span>
                                <span v-else class="badge badge-success">
                                    {{ price.priceRankLabel }}
                                </span>
                            </td>
                            <td>
                                <button 
                                    class="btn btn-sm btn-outline" 
                                    @click="viewDetails(price)"
                                    title="Détails"
                                >
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button 
                                    v-if="canEdit"
                                    class="btn btn-sm btn-outline" 
                                    @click="edit(price)"
                                    title="Modifier"
                                >
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button 
                                    v-if="canDelete"
                                    class="btn btn-sm btn-danger" 
                                    @click="confirmDelete(price)"
                                    title="Supprimer"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Pagination -->
                <div class="pagination" v-if="pagination.totalPages > 1">
                    <button 
                        class="btn btn-outline btn-sm" 
                        @click="changePage(1)"
                        :disabled="pagination.page === 1"
                    >
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button 
                        class="btn btn-outline btn-sm" 
                        @click="changePage(pagination.page - 1)"
                        :disabled="pagination.page === 1"
                    >
                        <i class="fas fa-angle-left"></i>
                    </button>
                    <span style="padding: 0 16px;">
                        Page {{ pagination.page }} / {{ pagination.totalPages }}
                    </span>
                    <button 
                        class="btn btn-outline btn-sm" 
                        @click="changePage(pagination.page + 1)"
                        :disabled="pagination.page === pagination.totalPages"
                    >
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button 
                        class="btn btn-outline btn-sm" 
                        @click="changePage(pagination.totalPages)"
                        :disabled="pagination.page === pagination.totalPages"
                    >
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!loading" class="empty-state">
                <i class="fas fa-tags empty-state-icon"></i>
                <h3 class="empty-state-title">Aucun prix enregistré</h3>
                <p class="empty-state-text">
                    Les prix seront automatiquement enregistrés lors de la validation des autorisations de travail,
                    ou vous pouvez en ajouter manuellement.
                </p>
            </div>

            <!-- Modal Ajout/Modification -->
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal-dialog" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-plus"></i>
                            {{ modalMode === 'add' ? 'Ajouter un prix' : 'Modifier un prix' }}
                        </h3>
                        <button class="modal-close" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Formulaire -->
                        <form @submit.prevent="submitForm">
                            <div class="form-group">
                                <label class="form-label">Pièce/Service *</label>
                                <div style="position: relative;">
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        v-model="supplySearchTerm"
                                        @focus="onSupplyFocus"
                                        @input="searchSupplies"
                                        :placeholder="selectedFormSupply ? selectedFormSupply.name : 'Rechercher une pièce...'"
                                        autocomplete="off"
                                    >
                                    <button 
                                        v-if="selectedFormSupply" 
                                        type="button"
                                        @click="clearSupplySelection"
                                        style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                    
                                    <!-- Dropdown Supply -->
                                    <div v-if="showFormSupplySearch" 
                                         class="dropdown-menu" 
                                         style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 300px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                        <div v-if="loadingSupplies" style="padding: 20px; text-align: center; color: #6c757d;">
                                            <i class="fas fa-spinner fa-spin"></i>
                                            Chargement...
                                        </div>
                                        <div v-else-if="availableSupplies.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                            <i class="fas fa-search"></i>
                                            Tapez au moins 2 caractères pour rechercher
                                        </div>
                                        <div v-else>
                                            <div 
                                                v-for="supply in availableSupplies" 
                                                :key="supply.id"
                                                @click="selectFormSupply(supply)"
                                                style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                                @mouseover="$event.target.style.background='#f8f9fa'"
                                                @mouseout="$event.target.style.background='white'"
                                            >
                                                <div style="font-weight: 600;">{{ supply.name }}</div>
                                                <div style="font-size: 12px; color: #6c757d;">
                                                    Réf: {{ supply.reference }} - {{ supply.brand || 'N/A' }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <small style="color: #6c757d; font-size: 12px; margin-top: 4px; display: block;">
                                    Description auto-remplie si pièce sélectionnée
                                </small>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Description *</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="form.description"
                                    required
                                    :placeholder="selectedFormSupply ? selectedFormSupply.name : 'Ex: Filtre à huile, Vidange...'"
                                >
                            </div>

                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Type de travail *</label>
                                    <select class="form-control" v-model="form.workType" required>
                                        <option value="supply">Pièce</option>
                                        <option value="labor">Main d'œuvre</option>
                                        <option value="other">Autre</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Catégorie</label>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        v-model="form.category"
                                        placeholder="Optionnel"
                                    >
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Marque</label>
                                    <div style="position: relative;">
                                        <input 
                                            type="text" 
                                            class="form-control" 
                                            v-model="brandSearchTerm"
                                            @focus="onBrandFocus"
                                            @input="searchBrands"
                                            :placeholder="selectedFormBrand ? selectedFormBrand.name : 'Rechercher une marque (optionnel)...'"
                                            autocomplete="off"
                                        >
                                        <button 
                                            v-if="selectedFormBrand" 
                                            type="button"
                                            @click="clearBrandSelection"
                                            style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                                        >
                                            <i class="fas fa-times"></i>
                                        </button>
                                        
                                        <!-- Dropdown Brand -->
                                        <div v-if="showFormBrandSearch" 
                                             class="dropdown-menu" 
                                             style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                            <div v-if="loadingBrands" style="padding: 20px; text-align: center; color: #6c757d;">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                Chargement...
                                            </div>
                                            <div v-else-if="availableBrands.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                                <i class="fas fa-search"></i>
                                                Tapez pour rechercher une marque
                                            </div>
                                            <div v-else>
                                                <div 
                                                    v-for="brand in availableBrands" 
                                                    :key="brand.id"
                                                    @click="selectFormBrand(brand)"
                                                    style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                                    @mouseover="$event.target.style.background='#f8f9fa'"
                                                    @mouseout="$event.target.style.background='white'"
                                                >
                                                    <div style="font-weight: 600;">{{ brand.name }}</div>
                                                    <div v-if="brand.country" style="font-size: 11px; color: #6c757d;">
                                                        {{ brand.country }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Modèle</label>
                                    <div style="position: relative;">
                                        <input 
                                            type="text" 
                                            class="form-control" 
                                            v-model="modelSearchTerm"
                                            @focus="onModelFocus"
                                            @input="searchModels"
                                            :placeholder="selectedFormModel ? selectedFormModel.name : 'Rechercher un modèle (optionnel)...'"
                                            :disabled="!selectedFormBrand"
                                            autocomplete="off"
                                        >
                                        <button 
                                            v-if="selectedFormModel" 
                                            type="button"
                                            @click="clearModelSelection"
                                            style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6c757d; cursor: pointer;"
                                        >
                                            <i class="fas fa-times"></i>
                                        </button>
                                        
                                        <!-- Dropdown Model -->
                                        <div v-if="showFormModelSearch" 
                                             class="dropdown-menu" 
                                             style="position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                            <div v-if="loadingModels" style="padding: 20px; text-align: center; color: #6c757d;">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                Chargement...
                                            </div>
                                            <div v-else-if="availableModels.length === 0" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                                                <i class="fas fa-search"></i>
                                                Tapez pour rechercher un modèle
                                            </div>
                                            <div v-else>
                                                <div 
                                                    v-for="model in availableModels" 
                                                    :key="model.id"
                                                    @click="selectFormModel(model)"
                                                    style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                                                    @mouseover="$event.target.style.background='#f8f9fa'"
                                                    @mouseout="$event.target.style.background='white'"
                                                >
                                                    <div style="font-weight: 600;">{{ model.name }}</div>
                                                    <div v-if="model.year" style="font-size: 11px; color: #6c757d;">
                                                        Année: {{ model.year }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <small v-if="!selectedFormBrand" style="color: #6c757d; font-size: 12px; margin-top: 4px; display: block;">
                                        Sélectionnez d'abord une marque
                                    </small>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Année du véhicule</label>
                                <input 
                                    type="number" 
                                    class="form-control" 
                                    v-model="form.vehicleYear"
                                    min="1990"
                                    :max="currentYear + 1"
                                    placeholder="2015 (optionnel)"
                                >
                            </div>

                            <div class="form-row">
                                <div class="form-group" style="flex: 2;">
                                    <label class="form-label">Prix unitaire (F CFA) *</label>
                                    <input 
                                        type="number" 
                                        class="form-control" 
                                        v-model="form.unitPrice"
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="12000"
                                    >
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Quantité *</label>
                                    <input 
                                        type="number" 
                                        class="form-control" 
                                        v-model="form.quantity"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        placeholder="1"
                                    >
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Date d'enregistrement *</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    v-model="form.recordedAt"
                                    required
                                    :max="today"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Fournisseur / Garage</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="form.garage"
                                    placeholder="Optionnel"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Notes</label>
                                <textarea 
                                    class="form-control" 
                                    v-model="form.notes"
                                    rows="3"
                                    placeholder="Remarques, justifications..."
                                ></textarea>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline" @click="closeModal">
                                    Annuler
                                </button>
                                <button type="submit" class="btn btn-primary" :disabled="submitting">
                                    <i class="fas fa-save"></i>
                                    {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal Détails -->
            <div v-if="showDetailsModal && selectedPrice" class="modal-overlay" @click.self="closeDetailsModal">
                <div class="modal-dialog" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-info-circle"></i>
                            Détails du prix
                        </h3>
                        <button class="modal-close" @click="closeDetailsModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Pièce/Service</label>
                                <p>{{ selectedPrice.description }}</p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Type</label>
                                <p>{{ getWorkTypeLabel(selectedPrice.workType) }}</p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Véhicule</label>
                                <p>{{ selectedPrice.vehicle.info }}</p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Prix Unitaire</label>
                                <p><strong>{{ formatAmount(selectedPrice.unitPrice) }} {{ selectedPrice.currency }}</strong></p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Quantité</label>
                                <p>{{ selectedPrice.quantity }}</p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Prix Total</label>
                                <p><strong>{{ formatAmount(selectedPrice.totalPrice) }} {{ selectedPrice.currency }}</strong></p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Date d'enregistrement</label>
                                <p>{{ formatDate(selectedPrice.recordedAt) }}</p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Source</label>
                                <p>{{ selectedPrice.sourceTypeLabel }}</p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Fournisseur</label>
                                <p>{{ selectedPrice.garage || '-' }}</p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Statut</label>
                                <p>
                                    <span v-if="selectedPrice.isAnomaly" class="badge badge-danger">
                                        {{ selectedPrice.anomalyLabel }}
                                    </span>
                                    <span v-else class="badge badge-success">
                                        {{ selectedPrice.priceRankLabel }}
                                    </span>
                                </p>
                            </div>
                            <div v-if="selectedPrice.deviationPercent">
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Écart vs Moyenne</label>
                                <p>
                                    <strong :class="selectedPrice.isAnomaly ? 'text-danger' : ''">
                                        {{ selectedPrice.deviationPercent }}%
                                    </strong>
                                </p>
                            </div>
                            <div>
                                <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Créé par</label>
                                <p>{{ selectedPrice.createdBy ? selectedPrice.createdBy.email : '-' }}</p>
                            </div>
                        </div>

                        <div v-if="selectedPrice.notes" style="margin-top: 16px;">
                            <label style="font-weight: 600; color: #6c757d; font-size: 12px;">Notes</label>
                            <p>{{ selectedPrice.notes }}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="closeDetailsModal">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            loading: false,
            submitting: false,
            prices: [],
            statistics: null,
            brands: [],
            models: [],
            filteredModels: [],
            
            // Pagination
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0
            },
            
            // Tri
            sortBy: 'recordedAt',
            sortOrder: 'DESC',
            
            // Filtres
            filters: {
                search: '',
                brand: '',
                model: '',
                vehicleYear: '',
                workType: '',
                sourceType: '',
                recordedYear: '',
                anomaliesOnly: false
            },
            searchTimeout: null,
            
            // Modal
            showModal: false,
            showDetailsModal: false,
            modalMode: 'add', // 'add' ou 'edit'
            selectedPrice: null,
            
            // Panneau de filtres
            showFiltersPanel: false,
            
            // Recherche Filtres - Brand
            filterBrandSearchTerm: '',
            availableFilterBrands: [],
            selectedFilterBrand: null,
            showFilterBrandSearch: false,
            filterBrandSearchTimeout: null,
            loadingFilterBrands: false,
            
            // Recherche Filtres - Model
            filterModelSearchTerm: '',
            availableFilterModels: [],
            selectedFilterModel: null,
            showFilterModelSearch: false,
            filterModelSearchTimeout: null,
            loadingFilterModels: false,
            
            // Formulaire
            form: {
                supplyId: '',
                description: '',
                workType: 'supply',
                category: '',
                vehicleBrandId: '',
                vehicleModelId: '',
                vehicleYear: new Date().getFullYear(),
                unitPrice: '',
                quantity: '1',
                recordedAt: new Date().toISOString().split('T')[0],
                garage: '',
                supplier: '',
                notes: ''
            },
            
            // Recherche Supply
            supplySearchTerm: '',
            availableSupplies: [],
            selectedFormSupply: null,
            showFormSupplySearch: false,
            supplySearchTimeout: null,
            loadingSupplies: false,
            
            // Recherche Brand
            brandSearchTerm: '',
            availableBrands: [],
            selectedFormBrand: null,
            showFormBrandSearch: false,
            brandSearchTimeout: null,
            loadingBrands: false,
            
            // Recherche Model
            modelSearchTerm: '',
            availableModels: [],
            selectedFormModel: null,
            showFormModelSearch: false,
            modelSearchTimeout: null,
            loadingModels: false,
            
            // Permissions
            canAdd: true,
            canEdit: false,
            canDelete: false,
            
            currentYear: new Date().getFullYear(),
            today: new Date().toISOString().split('T')[0]
        };
    },
    
    computed: {
        inflationClass() {
            const rate = this.statistics?.inflation || 0;
            if (rate > 10) return 'danger';
            if (rate > 5) return 'warning';
            if (rate < -5) return 'success';
            return '';
        },
        
        activeFiltersCount() {
            let count = 0;
            if (this.filters.brand) count++;
            if (this.filters.model) count++;
            if (this.filters.workType) count++;
            if (this.filters.sourceType) count++;
            if (this.filters.recordedYear) count++;
            if (this.filters.anomaliesOnly) count++;
            return count;
        }
    },
    
    async mounted() {
        await this.waitForApiService();
        await this.loadBrands();
        await this.loadModels();
        await this.loadStatistics();
        await this.loadPrices();
        
        // Charger permissions utilisateur
        this.loadPermissions();
        
        // Fermer les dropdowns quand on clique ailleurs
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    
    methods: {
        async waitForApiService() {
            return new Promise((resolve) => {
                const check = setInterval(() => {
                    if (window.apiService) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
        },
        
        async loadBrands() {
            try {
                const response = await window.apiService.request('/reference/brands?limit=1000');
                if (response.success) {
                    this.brands = response.data;
                }
            } catch (error) {
                console.error('Erreur chargement marques:', error);
            }
        },
        
        async loadModels() {
            try {
                const response = await window.apiService.request('/reference/models?limit=1000');
                if (response.success) {
                    this.models = response.data;
                    this.filteredModels = response.data;
                }
            } catch (error) {
                console.error('Erreur chargement modèles:', error);
            }
        },
        
        async loadStatistics() {
            try {
                const response = await window.apiService.request('/supply-prices/statistics');
                if (response.success) {
                    this.statistics = response.data.statistics;
                    this.statistics.inflation = response.data.inflation.rate;
                }
            } catch (error) {
                console.error('Erreur chargement statistiques:', error);
            }
        },
        
        async loadPrices() {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                params.append('page', this.pagination.page);
                params.append('limit', this.pagination.limit);
                params.append('sortBy', this.sortBy);
                params.append('sortOrder', this.sortOrder);
                
                // Ajouter les filtres
                Object.keys(this.filters).forEach(key => {
                    if (this.filters[key]) {
                        params.append(key, this.filters[key]);
                    }
                });
                
                const response = await window.apiService.request('/supply-prices?' + params.toString());
                if (response.success) {
                    this.prices = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.notifyError('Erreur lors du chargement des prix');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur de connexion');
            } finally {
                this.loading = false;
            }
        },
        
        debounceSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.applyFilters();
            }, 500);
        },
        
        applyFilters() {
            this.pagination.page = 1;
            this.loadPrices();
        },
        
        toggleFiltersPanel() {
            this.showFiltersPanel = !this.showFiltersPanel;
        },
        
        closeFiltersPanel() {
            this.showFiltersPanel = false;
        },
        
        resetFilters() {
            this.filters = {
                search: '',
                brand: '',
                model: '',
                vehicleYear: '',
                workType: '',
                sourceType: '',
                recordedYear: '',
                anomaliesOnly: false
            };
            this.filteredModels = this.models;
            
            // Reset filter search
            this.selectedFilterBrand = null;
            this.selectedFilterModel = null;
            this.filterBrandSearchTerm = '';
            this.filterModelSearchTerm = '';
            this.availableFilterBrands = [];
            this.availableFilterModels = [];
            
            this.applyFilters();
        },
        
        // Recherche Filtre Brand
        async onFilterBrandFocus() {
            this.showFilterBrandSearch = true;
            
            if (this.availableFilterBrands.length === 0) {
                this.loadingFilterBrands = true;
                try {
                    const response = await window.apiService.request('/reference/brands?limit=5');
                    if (response.success) {
                        this.availableFilterBrands = response.data;
                    }
                } catch (error) {
                    console.error('Erreur chargement marques:', error);
                } finally {
                    this.loadingFilterBrands = false;
                }
            }
        },
        
        async searchFilterBrands() {
            clearTimeout(this.filterBrandSearchTimeout);
            this.filterBrandSearchTimeout = setTimeout(async () => {
                if (this.filterBrandSearchTerm.length < 1) {
                    await this.onFilterBrandFocus();
                    return;
                }
                
                this.loadingFilterBrands = true;
                try {
                    const response = await window.apiService.request(`/reference/brands?search=${encodeURIComponent(this.filterBrandSearchTerm)}&limit=20`);
                    if (response.success) {
                        this.availableFilterBrands = response.data;
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
            this.filters.brand = brand.id;
            this.filterBrandSearchTerm = brand.name;
            this.showFilterBrandSearch = false;
            this.availableFilterBrands = [];
            
            // Reset model complètement
            this.selectedFilterModel = null;
            this.filters.model = '';
            this.filterModelSearchTerm = '';
            this.showFilterModelSearch = false;
            this.availableFilterModels = [];
            
            this.applyFilters();
        },
        
        clearFilterBrandSelection() {
            this.selectedFilterBrand = null;
            this.filters.brand = '';
            this.filterBrandSearchTerm = '';
            this.showFilterBrandSearch = false;
            this.availableFilterBrands = [];
            
            // Reset model aussi
            this.selectedFilterModel = null;
            this.filters.model = '';
            this.filterModelSearchTerm = '';
            this.showFilterModelSearch = false;
            this.availableFilterModels = [];
            
            this.applyFilters();
        },
        
        // Recherche Filtre Model
        async onFilterModelFocus() {
            if (!this.selectedFilterBrand) {
                this.availableFilterModels = [];
                return;
            }
            
            this.showFilterModelSearch = true;
            
            // Toujours recharger pour s'assurer d'avoir les bons modèles de la marque
            this.loadingFilterModels = true;
            try {
                const response = await window.apiService.request(`/reference/models?brandId=${this.selectedFilterBrand.id}&limit=5`);
                if (response.success) {
                    this.availableFilterModels = response.data;
                }
            } catch (error) {
                console.error('Erreur chargement modèles:', error);
            } finally {
                this.loadingFilterModels = false;
            }
        },
        
        async searchFilterModels() {
            if (!this.selectedFilterBrand) {
                this.availableFilterModels = [];
                return;
            }
            
            clearTimeout(this.filterModelSearchTimeout);
            this.filterModelSearchTimeout = setTimeout(async () => {
                if (this.filterModelSearchTerm.length < 1) {
                    await this.onFilterModelFocus();
                    return;
                }
                
                this.loadingFilterModels = true;
                try {
                    const response = await window.apiService.request(`/reference/models?search=${encodeURIComponent(this.filterModelSearchTerm)}&brandId=${this.selectedFilterBrand.id}&limit=20`);
                    if (response.success) {
                        this.availableFilterModels = response.data;
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
            this.filters.model = model.id;
            this.filterModelSearchTerm = model.name;
            this.showFilterModelSearch = false;
            this.applyFilters();
        },
        
        clearFilterModelSelection() {
            this.selectedFilterModel = null;
            this.filters.model = '';
            this.filterModelSearchTerm = '';
            this.showFilterModelSearch = false;
            this.availableFilterModels = [];
        },
        
        sort(field) {
            if (this.sortBy === field) {
                this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
            } else {
                this.sortBy = field;
                this.sortOrder = 'DESC';
            }
            this.loadPrices();
        },
        
        changePage(page) {
            this.pagination.page = page;
            this.loadPrices();
        },
        
        showAddModal() {
            this.modalMode = 'add';
            this.resetForm();
            this.showModal = true;
        },
        
        edit(price) {
            this.modalMode = 'edit';
            this.selectedPrice = price;
            
            // Remplir le formulaire
            this.form = {
                supplyId: price.supply?.id || '',
                description: price.description,
                workType: price.workType,
                category: price.category || '',
                vehicleBrandId: '', // Sera rempli après sélection
                vehicleModelId: '', // Sera rempli après sélection
                vehicleYear: price.vehicle.year,
                unitPrice: price.unitPrice,
                quantity: price.quantity,
                recordedAt: price.recordedAt.split(' ')[0],
                garage: price.garage || '',
                supplier: price.supplier || '',
                notes: price.notes || ''
            };
            
            // Pré-remplir les champs de recherche
            if (price.supply) {
                this.selectedFormSupply = price.supply;
                this.supplySearchTerm = price.supply.name;
            }
            
            // Simuler la sélection de marque et modèle pour l'édition
            if (price.vehicle?.brand) {
                this.selectedFormBrand = { 
                    id: price.vehicle.brand.id, 
                    name: price.vehicle.brand
                };
                this.form.vehicleBrandId = price.vehicle.brand.id;
                this.brandSearchTerm = price.vehicle.brand;
            }
            
            if (price.vehicle?.model) {
                this.selectedFormModel = { 
                    id: price.vehicle.model.id, 
                    name: price.vehicle.model
                };
                this.form.vehicleModelId = price.vehicle.model.id;
                this.modelSearchTerm = price.vehicle.model;
            }
            
            this.showModal = true;
        },
        
        viewDetails(price) {
            this.selectedPrice = price;
            this.showDetailsModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.selectedPrice = null;
            this.resetForm();
        },
        
        closeDetailsModal() {
            this.showDetailsModal = false;
            this.selectedPrice = null;
        },
        
        resetForm() {
            this.form = {
                supplyId: '',
                description: '',
                workType: 'supply',
                category: '',
                vehicleBrandId: '',
                vehicleModelId: '',
                vehicleYear: new Date().getFullYear(),
                unitPrice: '',
                quantity: '1',
                recordedAt: new Date().toISOString().split('T')[0],
                garage: '',
                supplier: '',
                notes: ''
            };
            this.selectedFormSupply = null;
            this.selectedFormBrand = null;
            this.selectedFormModel = null;
            this.supplySearchTerm = '';
            this.brandSearchTerm = '';
            this.modelSearchTerm = '';
            this.availableSupplies = [];
            this.availableBrands = [];
            this.availableModels = [];
        },
        
        // Recherche Supply
        async onSupplyFocus() {
            this.showFormSupplySearch = true;
            
            // Pré-charger les 5 premiers si pas de résultats
            if (this.availableSupplies.length === 0) {
                this.loadingSupplies = true;
                try {
                    const response = await window.apiService.request('/supplies?limit=5');
                    if (response.success) {
                        this.availableSupplies = response.data;
                    }
                } catch (error) {
                    console.error('Erreur chargement supplies:', error);
                } finally {
                    this.loadingSupplies = false;
                }
            }
        },
        
        async searchSupplies() {
            clearTimeout(this.supplySearchTimeout);
            this.supplySearchTimeout = setTimeout(async () => {
                if (this.supplySearchTerm.length < 2) {
                    // Recharger les 5 premiers si on efface
                    await this.onSupplyFocus();
                    return;
                }
                
                this.loadingSupplies = true;
                try {
                    const response = await window.apiService.request(`/supplies?search=${encodeURIComponent(this.supplySearchTerm)}&limit=20`);
                    if (response.success) {
                        this.availableSupplies = response.data;
                    }
                } catch (error) {
                    console.error('Erreur recherche supplies:', error);
                } finally {
                    this.loadingSupplies = false;
                }
            }, 300);
        },
        
        selectFormSupply(supply) {
            this.selectedFormSupply = supply;
            this.form.supplyId = supply.id;
            this.form.description = supply.name;
            this.supplySearchTerm = supply.name;
            this.showFormSupplySearch = false;
            
            // Pré-remplir le prix si disponible
            if (supply.unitPrice && (!this.form.unitPrice || this.form.unitPrice == 0)) {
                this.form.unitPrice = supply.unitPrice;
            }
        },
        
        clearSupplySelection() {
            this.selectedFormSupply = null;
            this.form.supplyId = '';
            this.supplySearchTerm = '';
            this.showFormSupplySearch = false;
            this.availableSupplies = [];
        },
        
        // Recherche Brand
        async onBrandFocus() {
            this.showFormBrandSearch = true;
            
            // Pré-charger les 5 premières marques si pas de résultats
            if (this.availableBrands.length === 0) {
                this.loadingBrands = true;
                try {
                    const response = await window.apiService.request('/reference/brands?limit=5');
                    if (response.success) {
                        this.availableBrands = response.data;
                    }
                } catch (error) {
                    console.error('Erreur chargement marques:', error);
                } finally {
                    this.loadingBrands = false;
                }
            }
        },
        
        async searchBrands() {
            clearTimeout(this.brandSearchTimeout);
            this.brandSearchTimeout = setTimeout(async () => {
                if (this.brandSearchTerm.length < 1) {
                    // Recharger les 5 premiers si on efface
                    await this.onBrandFocus();
                    return;
                }
                
                this.loadingBrands = true;
                try {
                    const response = await window.apiService.request(`/reference/brands?search=${encodeURIComponent(this.brandSearchTerm)}&limit=20`);
                    if (response.success) {
                        this.availableBrands = response.data;
                    }
                } catch (error) {
                    console.error('Erreur recherche marques:', error);
                } finally {
                    this.loadingBrands = false;
                }
            }, 300);
        },
        
        selectFormBrand(brand) {
            this.selectedFormBrand = brand;
            this.form.vehicleBrandId = brand.id;
            this.brandSearchTerm = brand.name;
            this.showFormBrandSearch = false;
            
            // Reset model si changement de marque
            this.clearModelSelection();
        },
        
        clearBrandSelection() {
            this.selectedFormBrand = null;
            this.form.vehicleBrandId = '';
            this.brandSearchTerm = '';
            this.showFormBrandSearch = false;
            this.availableBrands = [];
            this.clearModelSelection();
        },
        
        // Recherche Model
        async onModelFocus() {
            if (!this.selectedFormBrand) {
                this.availableModels = [];
                return;
            }
            
            this.showFormModelSearch = true;
            
            // Pré-charger les 5 premiers modèles de la marque si pas de résultats
            if (this.availableModels.length === 0) {
                this.loadingModels = true;
                try {
                    const response = await window.apiService.request(`/reference/models?brandId=${this.selectedFormBrand.id}&limit=5`);
                    if (response.success) {
                        this.availableModels = response.data;
                    }
                } catch (error) {
                    console.error('Erreur chargement modèles:', error);
                } finally {
                    this.loadingModels = false;
                }
            }
        },
        
        async searchModels() {
            if (!this.selectedFormBrand) {
                this.availableModels = [];
                return;
            }
            
            clearTimeout(this.modelSearchTimeout);
            this.modelSearchTimeout = setTimeout(async () => {
                if (this.modelSearchTerm.length < 1) {
                    // Recharger les 5 premiers si on efface
                    await this.onModelFocus();
                    return;
                }
                
                this.loadingModels = true;
                try {
                    const response = await window.apiService.request(`/reference/models?search=${encodeURIComponent(this.modelSearchTerm)}&brandId=${this.selectedFormBrand.id}&limit=20`);
                    if (response.success) {
                        this.availableModels = response.data;
                    }
                } catch (error) {
                    console.error('Erreur recherche modèles:', error);
                } finally {
                    this.loadingModels = false;
                }
            }, 300);
        },
        
        selectFormModel(model) {
            this.selectedFormModel = model;
            this.form.vehicleModelId = model.id;
            this.modelSearchTerm = model.name;
            this.showFormModelSearch = false;
        },
        
        clearModelSelection() {
            this.selectedFormModel = null;
            this.form.vehicleModelId = '';
            this.modelSearchTerm = '';
            this.showFormModelSearch = false;
            this.availableModels = [];
        },
        
        handleClickOutside(event) {
            // Fermer les dropdowns si clic en dehors
            if (!event.target.closest('.form-group')) {
                this.showFormSupplySearch = false;
                this.showFormBrandSearch = false;
                this.showFormModelSearch = false;
                this.showFilterBrandSearch = false;
                this.showFilterModelSearch = false;
            }
        },
        
        async submitForm() {
            this.submitting = true;
            
            try {
                const url = this.modalMode === 'add' 
                    ? '/supply-prices' 
                    : `/supply-prices/${this.selectedPrice.id}`;
                
                const method = this.modalMode === 'add' ? 'POST' : 'PUT';
                
                const response = await window.apiService.request(url, {
                    method: method,
                    body: JSON.stringify(this.form)
                });
                
                if (response.success) {
                    this.notifySuccess(response.message || 'Prix enregistré avec succès');
                    this.closeModal();
                    await this.loadPrices();
                    await this.loadStatistics();
                } else {
                    this.notifyError(response.error || 'Erreur lors de l\'enregistrement');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur lors de l\'enregistrement');
            } finally {
                this.submitting = false;
            }
        },
        
        confirmDelete(price) {
            if (confirm(`Êtes-vous sûr de vouloir supprimer ce prix ?\n\n${price.description} - ${formatAmount(price.unitPrice)} ${price.currency}`)) {
                this.deletePrice(price);
            }
        },
        
        async deletePrice(price) {
            try {
                const response = await window.apiService.request(`/supply-prices/${price.id}`, {
                    method: 'DELETE'
                });
                if (response.success) {
                    this.notifySuccess('Prix supprimé avec succès');
                    await this.loadPrices();
                    await this.loadStatistics();
                } else {
                    this.notifyError(response.error || 'Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur lors de la suppression');
            }
        },
        
        loadPermissions() {
            // TODO: Charger les permissions utilisateur depuis l'API
            // Pour l'instant, on simule
            this.canAdd = true;
            this.canEdit = false; // Seulement admin
            this.canDelete = false; // Seulement admin
        },
        
        // Helpers
        formatAmount(amount) {
            if (amount === null || amount === undefined) return '0';
            return Number(amount).toLocaleString('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },
        
        formatDate(date) {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('fr-FR');
        },
        
        getWorkTypeLabel(type) {
            const labels = {
                'labor': 'Main d\'œuvre',
                'supply': 'Pièce',
                'other': 'Autre'
            };
            return labels[type] || type;
        },
        
        getSourceBadgeClass(source) {
            const classes = {
                'auto': 'info',
                'manual': 'primary',
                'catalog': 'secondary',
                'import': 'warning'
            };
            return classes[source] || 'secondary';
        },
        
        notifySuccess(message) {
            if (window.notificationService) {
                window.notificationService.success(message);
            } else {
                alert(message);
            }
        },
        
        notifyError(message) {
            if (window.notificationService) {
                window.notificationService.error(message);
            } else {
                alert(message);
            }
        }
    }
};
