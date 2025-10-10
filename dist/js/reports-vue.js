/**
 * Impact Auto - Composant Rapports
 * Gestion des rapports d'interventions
 */

window.ReportsApp = {
    name: 'ReportsApp',
    
    template: `
        <div class="reports-container">
            <!-- Header -->
            <div class="reports-header">
                <h1 class="reports-title">
                    <i class="fas fa-chart-line"></i>
                    Rapports & Tableaux de Bord
                </h1>
                <div class="report-content-actions">
                    <button class="btn btn-outline" @click="refreshCurrentReport" :disabled="loading">
                        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
                        Actualiser
                    </button>
                </div>
            </div>

            <!-- Navigation par onglets -->
            <div class="reports-tabs">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.id"
                    class="report-tab"
                    :class="{ active: activeTab === tab.id }"
                    @click="selectTab(tab.id)"
                >
                    <i :class="tab.icon"></i>
                    {{ tab.label }}
                </button>
            </div>

            <!-- Vue d'ensemble des rapports -->
            <div v-if="activeTab === 'overview'" class="reports-grid">
                <div 
                    v-for="report in availableReports" 
                    :key="report.type"
                    class="report-card"
                    @click="selectReport(report.type)"
                >
                    <div class="report-card-header">
                        <div class="report-card-icon" :class="report.type">
                            <i :class="report.icon"></i>
                        </div>
                        <div>
                            <h3 class="report-card-title">{{ report.title }}</h3>
                            <p class="report-card-subtitle">{{ report.category }}</p>
                        </div>
                    </div>
                    <p class="report-card-description">{{ report.description }}</p>
                    <div class="report-card-footer">
                        <span class="report-card-action">
                            <i class="fas fa-arrow-right"></i>
                            Voir le rapport
                        </span>
                        <span v-if="report.cached" class="report-card-badge cached">
                            En cache
                        </span>
                    </div>
                </div>
            </div>

            <!-- Contenu du rapport sélectionné -->
            <div v-else>
                <!-- Dashboard -->
                <div v-if="activeTab === 'dashboard'" class="report-content">
                    <div class="report-content-header">
                        <h2 class="report-content-title">
                            <i class="fas fa-tachometer-alt"></i>
                            Tableau de Bord Interventions
                        </h2>
                        <div class="report-content-actions">
                            <button class="btn btn-outline btn-icon" @click="exportReport" title="Exporter">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Loading -->
                    <div v-if="loading" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Génération du rapport...</p>
                    </div>

                    <!-- Contenu Dashboard -->
                    <div v-else-if="dashboardData">
                        <!-- Alertes -->
                        <div v-if="dashboardData.alerts && dashboardData.alerts.length > 0" class="alerts-container">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">Alertes</h3>
                            <div 
                                v-for="alert in dashboardData.alerts" 
                                :key="alert.type"
                                class="alert-item"
                                :class="alert.severity"
                            >
                                <div class="alert-icon">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <div class="alert-content">
                                    <p class="alert-message">{{ alert.message }}</p>
                                    <p class="alert-count">{{ alert.count }} élément(s)</p>
                                </div>
                            </div>
                        </div>

                        <!-- KPIs -->
                        <div class="kpi-grid">
                            <div class="kpi-card">
                                <div class="kpi-header">
                                    <span class="kpi-label">Total Interventions</span>
                                </div>
                                <div class="kpi-value">
                                    {{ dashboardData.counters?.total || 0 }}
                                </div>
                            </div>

                            <div class="kpi-card success">
                                <div class="kpi-header">
                                    <span class="kpi-label">En cours</span>
                                </div>
                                <div class="kpi-value">
                                    {{ dashboardData.interventionsInProgress?.length || 0 }}
                                </div>
                            </div>

                            <div class="kpi-card warning">
                                <div class="kpi-header">
                                    <span class="kpi-label">Disponibilité</span>
                                    <span 
                                        v-if="dashboardData.fleetAvailability" 
                                        class="kpi-trend"
                                        :class="getTrendClass(dashboardData.fleetAvailability)"
                                    >
                                        <i :class="getTrendIcon(dashboardData.fleetAvailability)"></i>
                                    </span>
                                </div>
                                <div class="kpi-value">
                                    {{ dashboardData.fleetAvailability?.toFixed(1) || 0 }}
                                    <span class="unit">%</span>
                                </div>
                            </div>

                            <div class="kpi-card">
                                <div class="kpi-header">
                                    <span class="kpi-label">Priorité Haute</span>
                                </div>
                                <div class="kpi-value">
                                    {{ dashboardData.byPriority?.high || 0 }}
                                </div>
                            </div>
                        </div>

                        <!-- Interventions en cours -->
                        <div v-if="dashboardData.interventionsInProgress && dashboardData.interventionsInProgress.length > 0">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">Interventions en cours</h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Véhicule</th>
                                        <th>Type</th>
                                        <th>Statut</th>
                                        <th>Priorité</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="intervention in dashboardData.interventionsInProgress.slice(0, 10)" :key="intervention.id">
                                        <td><strong>{{ intervention.interventionNumber }}</strong></td>
                                        <td>
                                            {{ intervention.vehicle.plateNumber }}<br>
                                            <small style="color: #6c757d;">{{ intervention.vehicle.brand }} {{ intervention.vehicle.model }}</small>
                                        </td>
                                        <td>{{ intervention.interventionType || '-' }}</td>
                                        <td>
                                            <span class="badge badge-info">
                                                {{ intervention.statusLabel }}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge" :class="getPriorityBadgeClass(intervention.priority)">
                                                {{ formatPriority(intervention.priority) }}
                                            </span>
                                        </td>
                                        <td>{{ formatDate(intervention.reportedDate) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Metadata -->
                        <div v-if="reportMetadata" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #dee2e6; text-align: right;">
                            <small style="color: #6c757d;">
                                <i class="fas fa-clock"></i>
                                Généré le {{ formatDateTime(dashboardData.generatedAt) }}
                                <span v-if="reportMetadata.cached">
                                    • En cache jusqu'à {{ formatDateTime(reportMetadata.cachedUntil) }}
                                </span>
                                <span v-if="reportMetadata.executionTime">
                                    • Temps : {{ reportMetadata.executionTime }}s
                                </span>
                            </small>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="empty-state">
                        <i class="fas fa-chart-line empty-state-icon"></i>
                        <h3 class="empty-state-title">Aucune donnée disponible</h3>
                        <p class="empty-state-text">Générez le rapport pour voir les données</p>
                    </div>
                </div>

                <!-- KPIs -->
                <div v-else-if="activeTab === 'kpis'" class="report-content">
                    <div class="report-content-header">
                        <h2 class="report-content-title">
                            <i class="fas fa-chart-bar"></i>
                            Indicateurs de Performance (KPIs)
                        </h2>
                    </div>

                    <!-- Loading -->
                    <div v-if="loading" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Calcul des KPIs...</p>
                    </div>

                    <!-- Contenu KPIs -->
                    <div v-else-if="kpisData && kpisData.kpis">
                        <div class="kpi-grid">
                            <div 
                                v-for="(kpi, key) in kpisData.kpis" 
                                :key="key"
                                class="kpi-card"
                                :class="getKpiCardClass(kpi.trend)"
                            >
                                <div class="kpi-header">
                                    <span class="kpi-label">{{ formatKpiLabel(key) }}</span>
                                    <span 
                                        v-if="kpi.trend && kpi.trend !== 'neutral'" 
                                        class="kpi-trend"
                                        :class="kpi.trend"
                                    >
                                        <i :class="getTrendIcon(kpi.trend)"></i>
                                        {{ kpi.trend === 'up' ? '+' : '-' }}
                                    </span>
                                </div>
                                <div class="kpi-value">
                                    {{ formatKpiValue(kpi.value, kpi.unit) }}
                                    <span class="unit" v-if="kpi.unit">{{ kpi.unit }}</span>
                                </div>
                                <div v-if="kpi.previousValue !== undefined" class="kpi-comparison">
                                    vs période précédente: {{ formatKpiValue(kpi.previousValue, kpi.unit) }} {{ kpi.unit }}
                                </div>
                            </div>
                        </div>

                        <!-- Metadata -->
                        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #dee2e6; text-align: right;">
                            <small style="color: #6c757d;">
                                <i class="fas fa-calendar"></i>
                                Période: {{ formatDate(kpisData.period.start) }} - {{ formatDate(kpisData.period.end) }}
                            </small>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="empty-state">
                        <i class="fas fa-chart-bar empty-state-icon"></i>
                        <h3 class="empty-state-title">Aucune donnée disponible</h3>
                        <p class="empty-state-text">Générez le rapport pour voir les KPIs</p>
                    </div>
                </div>

                <!-- Coûts -->
                <div v-else-if="activeTab === 'costs'" class="report-content">
                    <div class="report-content-header">
                        <h2 class="report-content-title">
                            <i class="fas fa-euro-sign"></i>
                            Rapport des Coûts
                        </h2>
                    </div>

                    <!-- Filtres -->
                    <div class="report-filters">
                        <div class="filter-group" style="flex: 2; min-width: 300px;">
                            <label class="filter-label">Véhicule</label>
                            <div class="searchable-select">
                                <input 
                                    type="text" 
                                    v-model="vehicleSearch"
                                    @input="handleVehicleSearch"
                                    @focus="onVehicleSearchFocus"
                                    @blur="onVehicleSearchBlur"
                                    placeholder="Tous les véhicules"
                                    class="filter-input"
                                >
                                <i class="fas fa-search search-icon"></i>
                                <button 
                                    v-if="selectedVehicle" 
                                    type="button" 
                                    class="clear-icon" 
                                    @click="clearVehicleSelection"
                                    @mousedown.prevent
                                >
                                    <i class="fas fa-times"></i>
                                </button>
                                <div v-if="showVehicleDropdown && vehicleSearchResults.length > 0" class="dropdown-options">
                                    <div 
                                        v-for="vehicle in vehicleSearchResults" 
                                        :key="vehicle.id"
                                        @mousedown.prevent
                                        @click="selectVehicle(vehicle)"
                                        class="dropdown-option"
                                    >
                                        <div class="vehicle-option">
                                            <div class="vehicle-plate">{{ vehicle.plateNumber }}</div>
                                            <div class="vehicle-details">
                                                {{ vehicle.brand?.name || vehicle.brand }} {{ vehicle.model?.name || vehicle.model }} <span v-if="vehicle.year">({{ vehicle.year }})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Date début</label>
                            <input type="date" class="filter-input" v-model="costsFilters.startDate">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Date fin</label>
                            <input type="date" class="filter-input" v-model="costsFilters.endDate">
                        </div>
                        <div class="filter-group">
                            <button class="btn btn-primary" @click="loadCostsReport">
                                <i class="fas fa-search"></i>
                                Générer
                            </button>
                        </div>
                    </div>

                    <!-- Loading -->
                    <div v-if="loading" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Calcul des coûts...</p>
                    </div>

                    <!-- Contenu Coûts -->
                    <div v-else-if="costsData">
                        <div class="kpi-grid">
                            <div class="kpi-card">
                                <div class="kpi-label">Coûts Totaux</div>
                                <div class="kpi-value">
                                    {{ formatAmount(costsData.summary?.totalCosts || 0) }}
                                    <span class="unit">{{ costsData.summary?.currency || '€' }}</span>
                                </div>
                            </div>
                            <div class="kpi-card">
                                <div class="kpi-label">Coût Moyen</div>
                                <div class="kpi-value">
                                    {{ formatAmount(costsData.summary?.averageCostPerIntervention || 0) }}
                                    <span class="unit">{{ costsData.summary?.currency || '€' }}</span>
                                </div>
                            </div>
                            <div class="kpi-card success">
                                <div class="kpi-label">Main d'œuvre</div>
                                <div class="kpi-value">
                                    {{ formatAmount(costsData.summary?.laborCosts || 0) }}
                                    <span class="unit">{{ costsData.summary?.currency || '€' }}</span>
                                </div>
                            </div>
                            <div class="kpi-card warning">
                                <div class="kpi-label">Pièces</div>
                                <div class="kpi-value">
                                    {{ formatAmount(costsData.summary?.partsCosts || 0) }}
                                    <span class="unit">{{ costsData.summary?.currency || '€' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Répartition par type -->
                        <div v-if="costsData.costsByType && costsData.costsByType.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">Répartition par type</h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Type d'intervention</th>
                                        <th>Coût</th>
                                        <th>Pourcentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in costsData.costsByType" :key="item.type">
                                        <td>{{ item.type }}</td>
                                        <td><strong>{{ formatAmount(item.cost) }} {{ costsData.summary?.currency || '€' }}</strong></td>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="flex: 1; background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden;">
                                                    <div 
                                                        style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2);"
                                                        :style="{ width: item.percentage + '%' }"
                                                    ></div>
                                                </div>
                                                <span>{{ item.percentage }}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="empty-state">
                        <i class="fas fa-euro-sign empty-state-icon"></i>
                        <h3 class="empty-state-title">Sélectionnez les filtres</h3>
                        <p class="empty-state-text">Générez un rapport pour voir les coûts</p>
                    </div>
                </div>

                <!-- Entretien -->
                <div v-else-if="activeTab === 'maintenance'" class="report-content">
                    <div class="report-content-header">
                        <h2 class="report-content-title">
                            <i class="fas fa-wrench"></i>
                            Échéancier Entretien
                        </h2>
                    </div>

                    <!-- Filtres -->
                    <div class="report-filters">
                        <div class="filter-group">
                            <label class="filter-label">Période</label>
                            <select class="filter-select" v-model="maintenanceFilters.days" @change="loadMaintenanceReport">
                                <option value="30">30 jours</option>
                                <option value="60">60 jours</option>
                                <option value="90">90 jours</option>
                                <option value="180">6 mois</option>
                            </select>
                        </div>
                    </div>

                    <!-- Loading -->
                    <div v-if="loading" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Calcul de l'échéancier...</p>
                    </div>

                    <!-- Contenu Maintenance -->
                    <div v-else-if="maintenanceData">
                        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
                            <div class="kpi-card">
                                <div class="kpi-label">Total Véhicules</div>
                                <div class="kpi-value">{{ maintenanceData.summary?.totalVehicles || 0 }}</div>
                            </div>
                            <div class="kpi-card warning">
                                <div class="kpi-label">Entretiens à venir</div>
                                <div class="kpi-value">{{ maintenanceData.summary?.upcomingCount || 0 }}</div>
                            </div>
                            <div class="kpi-card danger">
                                <div class="kpi-label">En retard</div>
                                <div class="kpi-value">{{ maintenanceData.summary?.overdueCount || 0 }}</div>
                            </div>
                        </div>

                        <!-- Entretiens en retard -->
                        <div v-if="maintenanceData.overdueMaintenances && maintenanceData.overdueMaintenances.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600; color: #dc3545;">
                                <i class="fas fa-exclamation-triangle"></i>
                                Entretiens en retard
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Véhicule</th>
                                        <th>Kilométrage</th>
                                        <th>Dernière maintenance</th>
                                        <th>Priorité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in maintenanceData.overdueMaintenances" :key="item.vehicle.id">
                                        <td>
                                            <strong>{{ item.vehicle.plateNumber }}</strong><br>
                                            <small style="color: #6c757d;">{{ item.vehicle.brand }} {{ item.vehicle.model }}</small>
                                        </td>
                                        <td>{{ item.vehicle.mileage?.toLocaleString() || '-' }} km</td>
                                        <td>{{ item.lastMaintenance ? formatDate(item.lastMaintenance.date) : 'Jamais' }}</td>
                                        <td>
                                            <span class="badge badge-danger">{{ item.priority }}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Entretiens à venir -->
                        <div v-if="maintenanceData.upcomingMaintenances && maintenanceData.upcomingMaintenances.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">
                                <i class="fas fa-calendar-alt"></i>
                                Entretiens à venir
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Véhicule</th>
                                        <th>Kilométrage</th>
                                        <th>Prochaine maintenance</th>
                                        <th>Dans</th>
                                        <th>Priorité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in maintenanceData.upcomingMaintenances" :key="item.vehicle.id">
                                        <td>
                                            <strong>{{ item.vehicle.plateNumber }}</strong><br>
                                            <small style="color: #6c757d;">{{ item.vehicle.brand }} {{ item.vehicle.model }}</small>
                                        </td>
                                        <td>{{ item.vehicle.mileage?.toLocaleString() || '-' }} km</td>
                                        <td>{{ item.nextMaintenanceDate ? formatDate(item.nextMaintenanceDate) : '-' }}</td>
                                        <td>{{ item.daysUntilMaintenance }} jours</td>
                                        <td>
                                            <span class="badge" :class="'badge-' + getPriorityColor(item.priority)">
                                                {{ item.priority }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="empty-state">
                        <i class="fas fa-wrench empty-state-icon"></i>
                        <h3 class="empty-state-title">Aucune donnée disponible</h3>
                        <p class="empty-state-text">Générez le rapport pour voir l'échéancier</p>
                    </div>
                </div>

                <!-- Analyse des Pannes -->
                <div v-else-if="activeTab === 'failures'" class="report-content">
                    <div class="report-content-header">
                        <h2 class="report-content-title">
                            <i class="fas fa-exclamation-triangle"></i>
                            Analyse des Pannes
                        </h2>
                    </div>

                    <!-- Filtres -->
                    <div class="report-filters">
                        <div class="filter-group">
                            <label class="filter-label">Date début</label>
                            <input type="date" class="filter-input" v-model="failuresFilters.startDate" @change="loadFailuresReport">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Date fin</label>
                            <input type="date" class="filter-input" v-model="failuresFilters.endDate" @change="loadFailuresReport">
                        </div>
                    </div>

                    <!-- Loading -->
                    <div v-if="loading" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Analyse des pannes en cours...</p>
                    </div>

                    <!-- Contenu Failures -->
                    <div v-else-if="failuresData">
                        <!-- Résumé -->
                        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
                            <div class="kpi-card">
                                <div class="kpi-label">Total Pannes</div>
                                <div class="kpi-value">{{ failuresData.summary?.totalFailures || 0 }}</div>
                            </div>
                            <div class="kpi-card danger">
                                <div class="kpi-label">Coût Total</div>
                                <div class="kpi-value">
                                    {{ formatAmount(failuresData.summary?.totalCost || 0) }}
                                    <span class="unit">{{ failuresData.summary?.currency || 'F CFA' }}</span>
                                </div>
                            </div>
                            <div class="kpi-card warning">
                                <div class="kpi-label">Coût Moyen/Panne</div>
                                <div class="kpi-value">
                                    {{ formatAmount(failuresData.summary?.averageCostPerFailure || 0) }}
                                    <span class="unit">{{ failuresData.summary?.currency || 'F CFA' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Top Pannes Récurrentes -->
                        <div v-if="failuresData.failuresByType && failuresData.failuresByType.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">
                                <i class="fas fa-redo"></i>
                                Top 10 - Pannes Récurrentes
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Type de Panne</th>
                                        <th>Nombre</th>
                                        <th>Coût Total</th>
                                        <th>Coût Moyen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in failuresData.failuresByType" :key="item.type">
                                        <td><strong>{{ item.type }}</strong></td>
                                        <td>{{ item.count }}</td>
                                        <td>{{ formatAmount(item.totalCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                        <td>{{ formatAmount(item.averageCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- MTBF - Véhicules Problématiques -->
                        <div v-if="failuresData.mtbf && failuresData.mtbf.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600; color: #dc3545;">
                                <i class="fas fa-chart-line"></i>
                                MTBF - Véhicules les Plus Problématiques
                            </h3>
                            <p style="margin-bottom: 12px; color: #6c757d; font-size: 14px;">
                                MTBF (Mean Time Between Failures) = Temps moyen entre pannes. Plus la valeur est faible, plus le véhicule est problématique.
                            </p>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Véhicule</th>
                                        <th>MTBF (jours)</th>
                                        <th>Nombre de Pannes</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in failuresData.mtbf.slice(0, 15)" :key="item.vehicle.id">
                                        <td>
                                            <strong>{{ item.vehicle.plateNumber }}</strong><br>
                                            <small style="color: #6c757d;">{{ item.vehicle.brand }} {{ item.vehicle.model }}</small>
                                        </td>
                                        <td>
                                            <strong :class="item.mtbf < 30 ? 'text-danger' : item.mtbf < 60 ? 'text-warning' : ''">
                                                {{ item.mtbf }} jours
                                            </strong>
                                        </td>
                                        <td>{{ item.failureCount }}</td>
                                        <td>
                                            <span v-if="item.mtbf < 30" class="badge badge-danger">Critique</span>
                                            <span v-else-if="item.mtbf < 60" class="badge badge-warning">À surveiller</span>
                                            <span v-else class="badge badge-info">Normal</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pièces les Plus Changées -->
                        <div v-if="failuresData.mostChangedParts && failuresData.mostChangedParts.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">
                                <i class="fas fa-cogs"></i>
                                Pièces les Plus Remplacées
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Pièce</th>
                                        <th>Nb Remplacements</th>
                                        <th>Quantité</th>
                                        <th>Coût Total</th>
                                        <th>Coût Moyen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in failuresData.mostChangedParts" :key="item.name">
                                        <td><strong>{{ item.name }}</strong></td>
                                        <td>{{ item.count }}</td>
                                        <td>{{ item.quantity }}</td>
                                        <td>{{ formatAmount(item.totalCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                        <td>{{ formatAmount(item.averageCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pannes par Marque -->
                        <div v-if="failuresData.failuresByBrand && failuresData.failuresByBrand.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">
                                <i class="fas fa-car"></i>
                                Pannes par Marque
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Marque</th>
                                        <th>Nombre</th>
                                        <th>Coût Total</th>
                                        <th>Coût Moyen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in failuresData.failuresByBrand" :key="item.brand">
                                        <td><strong>{{ item.brand }}</strong></td>
                                        <td>{{ item.count }}</td>
                                        <td>{{ formatAmount(item.totalCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                        <td>{{ formatAmount(item.averageCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pannes par Modèle -->
                        <div v-if="failuresData.failuresByModel && failuresData.failuresByModel.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">
                                <i class="fas fa-car-side"></i>
                                Pannes par Modèle
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Modèle</th>
                                        <th>Nombre</th>
                                        <th>Coût Total</th>
                                        <th>Coût Moyen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in failuresData.failuresByModel" :key="item.model">
                                        <td><strong>{{ item.model }}</strong></td>
                                        <td>{{ item.count }}</td>
                                        <td>{{ formatAmount(item.totalCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                        <td>{{ formatAmount(item.averageCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pannes par Âge -->
                        <div v-if="failuresData.failuresByAge && failuresData.failuresByAge.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">
                                <i class="fas fa-calendar"></i>
                                Pannes par Âge du Véhicule
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Tranche d'Âge</th>
                                        <th>Nombre de Pannes</th>
                                        <th>Coût Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in failuresData.failuresByAge" :key="item.ageRange">
                                        <td><strong>{{ item.ageRange }}</strong></td>
                                        <td>{{ item.count }}</td>
                                        <td>{{ formatAmount(item.totalCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pannes par Kilométrage -->
                        <div v-if="failuresData.failuresByKm && failuresData.failuresByKm.length > 0" style="margin-top: 24px;">
                            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">
                                <i class="fas fa-tachometer-alt"></i>
                                Pannes par Kilométrage
                            </h3>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Tranche de Kilométrage</th>
                                        <th>Nombre de Pannes</th>
                                        <th>Coût Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in failuresData.failuresByKm" :key="item.kmRange">
                                        <td><strong>{{ item.kmRange }}</strong></td>
                                        <td>{{ item.count }}</td>
                                        <td>{{ formatAmount(item.totalCost) }} {{ failuresData.summary?.currency || 'F CFA' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="empty-state">
                        <i class="fas fa-exclamation-triangle empty-state-icon"></i>
                        <h3 class="empty-state-title">Aucune donnée disponible</h3>
                        <p class="empty-state-text">Sélectionnez une période pour voir l'analyse des pannes</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            activeTab: 'overview',
            loading: false,
            reportMetadata: null,
            
            // Tabs
            tabs: [
                { id: 'overview', label: 'Vue d\'ensemble', icon: 'fas fa-th-large' },
                { id: 'dashboard', label: 'Tableau de bord', icon: 'fas fa-tachometer-alt' },
                { id: 'kpis', label: 'KPIs', icon: 'fas fa-chart-bar' },
                { id: 'costs', label: 'Coûts', icon: 'fas fa-euro-sign' },
                { id: 'maintenance', label: 'Entretien', icon: 'fas fa-wrench' },
                { id: 'failures', label: 'Pannes', icon: 'fas fa-exclamation-triangle' }
            ],
            
            // Rapports disponibles
            availableReports: [
                {
                    type: 'dashboard',
                    icon: 'fas fa-tachometer-alt',
                    title: 'Tableau de Bord',
                    category: 'Opérationnel',
                    description: 'Vue d\'ensemble des interventions en cours, alertes et disponibilité du parc.',
                    cached: false
                },
                {
                    type: 'kpis',
                    icon: 'fas fa-chart-bar',
                    title: 'KPIs Essentiels',
                    category: 'Performance',
                    description: 'Indicateurs clés : disponibilité, coûts, délais, satisfaction.',
                    cached: false
                },
                {
                    type: 'costs',
                    icon: 'fas fa-euro-sign',
                    title: 'Coûts par Véhicule',
                    category: 'Financier',
                    description: 'Analyse détaillée des coûts d\'intervention par véhicule.',
                    cached: false
                },
                {
                    type: 'maintenance',
                    icon: 'fas fa-wrench',
                    title: 'Échéancier Entretien',
                    category: 'Préventif',
                    description: 'Planification des maintenances préventives par véhicule.',
                    cached: false
                },
                {
                    type: 'failures',
                    icon: 'fas fa-exclamation-triangle',
                    title: 'Analyse des Pannes',
                    category: 'Technique',
                    description: 'Pannes récurrentes, MTBF, pièces les plus changées et analyse de fiabilité.',
                    cached: false
                }
            ],
            
            // Données des rapports
            dashboardData: null,
            kpisData: null,
            costsData: null,
            maintenanceData: null,
            failuresData: null,
            
            // Filtres
            costsFilters: {
                vehicleId: '',
                startDate: '',
                endDate: ''
            },
            selectedVehicle: null,
            vehicleSearch: '',
            vehicleSearchResults: [],
            showVehicleDropdown: false,
            vehicleSearchTimeout: null,
            maintenanceFilters: {
                days: '90'
            },
            failuresFilters: {
                startDate: '',
                endDate: ''
            }
        };
    },
    
    async mounted() {
        await this.waitForApiService();
        // Charger automatiquement le dashboard
        this.selectTab('dashboard');
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
        
        selectTab(tabId) {
            this.activeTab = tabId;
            
            // Charger automatiquement les données selon l'onglet
            if (tabId === 'dashboard' && !this.dashboardData) {
                this.loadDashboard();
            } else if (tabId === 'kpis' && !this.kpisData) {
                this.loadKPIs();
            } else if (tabId === 'maintenance' && !this.maintenanceData) {
                this.loadMaintenanceReport();
            } else if (tabId === 'failures' && !this.failuresData) {
                this.loadFailuresReport();
            }
        },
        
        selectReport(type) {
            const tabMapping = {
                'dashboard': 'dashboard',
                'kpis': 'kpis',
                'costs': 'costs',
                'maintenance': 'maintenance',
                'failures': 'failures'
            };
            
            this.selectTab(tabMapping[type] || 'overview');
        },
        
        async loadDashboard() {
            this.loading = true;
            try {
                const response = await window.apiService.request('/reports/dashboard');
                if (response.success) {
                    this.dashboardData = response.data;
                    this.reportMetadata = {
                        cached: response.cached || false,
                        cachedUntil: response.cachedUntil,
                        executionTime: response.executionTime
                    };
                } else {
                    this.notifyError('Erreur lors du chargement du tableau de bord');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur de connexion');
            } finally {
                this.loading = false;
            }
        },
        
        async loadKPIs() {
            this.loading = true;
            try {
                const response = await window.apiService.request('/reports/kpis');
                if (response.success) {
                    this.kpisData = response.data;
                } else {
                    this.notifyError('Erreur lors du chargement des KPIs');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur de connexion');
            } finally {
                this.loading = false;
            }
        },
        
        async searchVehicles(search = '') {
            try {
                // getVehicles(tenantId, search, status, page, limit)
                // Charger 10 véhicules si recherche vide, 50 sinon
                const limit = search === '' ? 10 : 50;
                const response = await window.apiService.getVehicles(null, search, 'all', 1, limit);
                if (response.success) {
                    this.vehicleSearchResults = response.data;
                }
            } catch (error) {
                console.error('Erreur lors de la recherche de véhicules:', error);
                this.vehicleSearchResults = [];
            }
        },
        
        handleVehicleSearch() {
            clearTimeout(this.vehicleSearchTimeout);
            this.vehicleSearchTimeout = setTimeout(() => {
                if (this.vehicleSearch.length >= 2) {
                    this.searchVehicles(this.vehicleSearch);
                } else if (this.vehicleSearch.length === 0) {
                    // Recharger les 10 premiers si on efface tout
                    this.searchVehicles('');
                }
            }, 300);
        },
        
        onVehicleSearchFocus() {
            this.showVehicleDropdown = true;
            // Précharger les 10 premiers véhicules si la recherche est vide
            if (this.vehicleSearch.length === 0 && this.vehicleSearchResults.length === 0) {
                this.searchVehicles('');
            } else if (this.vehicleSearch.length >= 2) {
                this.searchVehicles(this.vehicleSearch);
            }
        },
        
        onVehicleSearchBlur() {
            setTimeout(() => {
                this.showVehicleDropdown = false;
            }, 200);
        },
        
        selectVehicle(vehicle) {
            this.selectedVehicle = vehicle;
            this.costsFilters.vehicleId = vehicle.id;
            const brand = vehicle.brand?.name || vehicle.brand || '';
            const model = vehicle.model?.name || vehicle.model || '';
            this.vehicleSearch = `${vehicle.plateNumber} - ${brand} ${model}`.trim();
            this.showVehicleDropdown = false;
            this.vehicleSearchResults = [];
        },
        
        clearVehicleSelection() {
            this.selectedVehicle = null;
            this.costsFilters.vehicleId = '';
            this.vehicleSearch = '';
            this.vehicleSearchResults = [];
        },
        
        async loadCostsReport() {
            this.loading = true;
            try {
                let url = '/reports/costs/by-vehicle?';
                if (this.costsFilters.vehicleId) url += `vehicleId=${this.costsFilters.vehicleId}&`;
                if (this.costsFilters.startDate) url += `startDate=${this.costsFilters.startDate}&`;
                if (this.costsFilters.endDate) url += `endDate=${this.costsFilters.endDate}&`;
                
                const response = await window.apiService.request(url);
                if (response.success) {
                    this.costsData = response.data;
                } else {
                    this.notifyError('Erreur lors du chargement des coûts');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur de connexion');
            } finally {
                this.loading = false;
            }
        },
        
        async loadMaintenanceReport() {
            this.loading = true;
            try {
                const response = await window.apiService.request(`/reports/maintenance/schedule?days=${this.maintenanceFilters.days}`);
                if (response.success) {
                    this.maintenanceData = response.data;
                } else {
                    this.notifyError('Erreur lors du chargement de l\'échéancier');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur de connexion');
            } finally {
                this.loading = false;
            }
        },
        
        async loadFailuresReport() {
            this.loading = true;
            try {
                // Construire l'URL avec les filtres de date si disponibles
                let url = '/reports/failures/analysis';
                const params = new URLSearchParams();
                
                if (this.failuresFilters?.startDate) {
                    params.append('startDate', this.failuresFilters.startDate);
                }
                if (this.failuresFilters?.endDate) {
                    params.append('endDate', this.failuresFilters.endDate);
                }
                
                if (params.toString()) {
                    url += '?' + params.toString();
                }
                
                const response = await window.apiService.request(url);
                if (response.success) {
                    this.failuresData = response.data;
                    this.reportMetadata = {
                        cached: response.cached || false,
                        cachedUntil: response.cachedUntil,
                        executionTime: response.executionTime
                    };
                } else {
                    this.notifyError('Erreur lors du chargement de l\'analyse des pannes');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.notifyError('Erreur de connexion');
            } finally {
                this.loading = false;
            }
        },
        
        async refreshCurrentReport() {
            if (this.activeTab === 'dashboard') {
                await this.loadDashboard();
            } else if (this.activeTab === 'kpis') {
                await this.loadKPIs();
            } else if (this.activeTab === 'costs') {
                await this.loadCostsReport();
            } else if (this.activeTab === 'maintenance') {
                await this.loadMaintenanceReport();
            } else if (this.activeTab === 'failures') {
                await this.loadFailuresReport();
            }
        },
        
        exportReport() {
            this.notifyInfo('Fonctionnalité d\'export en cours de développement');
        },
        
        // Helpers
        formatAmount(amount) {
            if (amount === null || amount === undefined) return '0';
            // Formater avec séparateur de milliers (espace) et 2 décimales
            return Number(amount).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },
        
        formatKpiValue(value, unit) {
            if (value === null || value === undefined) return '0';
            
            // Si c'est une devise (F CFA, €, $, etc.), formater avec 2 décimales
            if (unit && (unit.includes('CFA') || unit.includes('€') || unit.includes('$') || unit.includes('MAD'))) {
                return Number(value).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
            
            // Si c'est un pourcentage, formater avec 1 décimale
            if (unit === '%') {
                return Number(value).toLocaleString('fr-FR', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                });
            }
            
            // Pour les nombres entiers (interventions, jours, etc.)
            if (Number.isInteger(Number(value))) {
                return Number(value).toLocaleString('fr-FR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            }
            
            // Par défaut, 2 décimales
            return Number(value).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        formatDateTime(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleString('fr-FR');
        },
        
        formatPriority(priority) {
            const labels = {
                'low': 'Faible',
                'medium': 'Moyenne',
                'high': 'Haute'
            };
            return labels[priority] || priority;
        },
        
        formatKpiLabel(key) {
            const labels = {
                'fleetAvailability': 'Disponibilité du parc',
                'costPerKm': 'Coût moyen au km',
                'interventionsInProgress': 'Interventions en cours',
                'averageRepairDelay': 'Délai moyen réparation',
                'averageSatisfaction': 'Satisfaction moyenne',
                'totalInterventions': 'Total interventions'
            };
            return labels[key] || key;
        },
        
        getPriorityBadgeClass(priority) {
            return {
                'low': 'badge-info',
                'medium': 'badge-warning',
                'high': 'badge-danger'
            }[priority] || 'badge-info';
        },
        
        getPriorityColor(priority) {
            return {
                'urgent': 'danger',
                'high': 'warning',
                'medium': 'info',
                'normal': 'success'
            }[priority] || 'info';
        },
        
        getKpiCardClass(trend) {
            return {
                'up': 'success',
                'down': 'danger',
                'neutral': ''
            }[trend] || '';
        },
        
        getTrendClass(value) {
            if (typeof value === 'number') {
                return value > 80 ? 'up' : value < 60 ? 'down' : 'neutral';
            }
            return value;
        },
        
        getTrendIcon(trend) {
            if (typeof trend === 'number') {
                return trend > 80 ? 'fas fa-arrow-up' : trend < 60 ? 'fas fa-arrow-down' : 'fas fa-minus';
            }
            return {
                'up': 'fas fa-arrow-up',
                'down': 'fas fa-arrow-down',
                'neutral': 'fas fa-minus'
            }[trend] || 'fas fa-minus';
        },
        
        // Notifications
        notifySuccess(message) {
            if (window.notifySuccess) {
                window.notifySuccess(message);
            }
        },
        
        notifyError(message) {
            if (window.notifyError) {
                window.notifyError(message);
            }
        },
        
        notifyInfo(message) {
            if (window.notifyInfo) {
                window.notifyInfo(message);
            }
        }
    }
};

