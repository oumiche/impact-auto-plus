<template>
  <DefaultLayout>
    <template #header>
      <h1>Rapports & Tableaux de Bord</h1>
      <p>Analysez les performances de vos interventions</p>
    </template>

    <!-- Actions globales -->
    <div class="page-actions">
      <button @click="refreshCurrentReport" class="btn-primary" :disabled="loading">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Actualiser
      </button>
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

    <!-- Contenu des onglets -->
    <div class="reports-content">
      <!-- Overview -->
      <div v-if="activeTab === 'overview'" class="reports-overview">
        <div class="reports-grid">
          <div
            v-for="report in availableReports"
            :key="report.type"
            class="report-card"
            @click="selectReport(report.type)"
          >
            <div class="report-card-icon" :class="report.type">
              <i :class="report.icon"></i>
            </div>
            <h3 class="report-card-title">{{ report.title }}</h3>
            <p class="report-card-category">{{ report.category }}</p>
            <p class="report-card-description">{{ report.description }}</p>
            <div class="report-card-action">
              <span>Voir le rapport</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard -->
      <div v-else-if="activeTab === 'dashboard'" class="report-view">
        <div class="report-header">
          <h2>
            <i class="fas fa-tachometer-alt"></i>
            Tableau de Bord Interventions
          </h2>
          <button @click="exportReport" class="btn-secondary">
            <i class="fas fa-download"></i>
            Exporter
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Génération du rapport...</p>
        </div>

        <!-- Dashboard Content -->
        <div v-else-if="dashboardData" class="dashboard-content">
          <!-- Alertes -->
          <div v-if="dashboardData.alerts && dashboardData.alerts.length > 0" class="alerts-section">
            <h3>Alertes</h3>
            <div class="alerts-grid">
              <div
                v-for="alert in dashboardData.alerts"
                :key="alert.type"
                class="alert-card"
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
          </div>

          <!-- Stats KPIs -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-clipboard-list"></i>
              </div>
              <div class="stat-content">
                <p class="stat-label">Total Interventions</p>
                <p class="stat-value">{{ dashboardData.counters?.total || 0 }}</p>
              </div>
            </div>

            <div class="stat-card success">
              <div class="stat-icon">
                <i class="fas fa-tasks"></i>
              </div>
              <div class="stat-content">
                <p class="stat-label">En cours</p>
                <p class="stat-value">{{ dashboardData.interventionsInProgress?.length || 0 }}</p>
              </div>
            </div>

            <div class="stat-card warning">
              <div class="stat-icon">
                <i class="fas fa-car"></i>
              </div>
              <div class="stat-content">
                <p class="stat-label">Disponibilité Flotte</p>
                <p class="stat-value">
                  {{ dashboardData.fleetAvailability?.toFixed(1) || 0 }}
                  <span class="unit">%</span>
                </p>
              </div>
            </div>

            <div class="stat-card error">
              <div class="stat-icon">
                <i class="fas fa-exclamation-circle"></i>
              </div>
              <div class="stat-content">
                <p class="stat-label">Priorité Haute</p>
                <p class="stat-value">{{ dashboardData.byPriority?.high || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Interventions en cours -->
          <div v-if="dashboardData.interventionsInProgress && dashboardData.interventionsInProgress.length > 0" class="table-section">
            <h3>Interventions en cours</h3>
            <table class="data-table">
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
                    <div class="vehicle-info">
                      <strong>{{ intervention.vehicle?.plateNumber }}</strong>
                      <small>{{ intervention.vehicle?.brand }} {{ intervention.vehicle?.model }}</small>
                    </div>
                  </td>
                  <td>{{ intervention.interventionType || '-' }}</td>
                  <td>
                    <span class="badge badge-info">
                      {{ intervention.statusLabel }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getPriorityClass(intervention.priority)">
                      {{ formatPriority(intervention.priority) }}
                    </span>
                  </td>
                  <td>{{ formatDate(intervention.reportedDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Metadata -->
          <div class="report-metadata">
            <small>
              <i class="fas fa-clock"></i>
              Généré le {{ formatDateTime(dashboardData.generatedAt) }}
              <span v-if="reportMetadata?.cached">
                • En cache jusqu'à {{ formatDateTime(reportMetadata.cachedUntil) }}
              </span>
            </small>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="fas fa-chart-line"></i>
          <p>Aucune donnée disponible</p>
        </div>
      </div>

      <!-- KPIs -->
      <div v-else-if="activeTab === 'kpis'" class="report-view">
        <div class="report-header">
          <h2>
            <i class="fas fa-chart-bar"></i>
            Indicateurs de Performance (KPIs)
          </h2>
        </div>

        <!-- Filtres de dates -->
        <div class="report-filters">
          <div class="form-group">
            <label>Date de début</label>
            <input v-model="kpiFilters.startDate" type="date" />
          </div>
          <div class="form-group">
            <label>Date de fin</label>
            <input v-model="kpiFilters.endDate" type="date" />
          </div>
          <button @click="loadKPIs" class="btn-primary">
            <i class="fas fa-search"></i>
            Appliquer
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Calcul des KPIs...</p>
        </div>

        <!-- KPIs Content -->
        <div v-else-if="kpisData && kpisData.kpis" class="kpis-content">
          <div class="kpis-grid">
            <div
              v-for="(kpi, key) in kpisData.kpis"
              :key="key"
              class="kpi-card"
              :class="getTrendClass(kpi.trend)"
            >
              <div class="kpi-header">
                <span class="kpi-label">{{ formatKpiLabel(key) }}</span>
                <span v-if="kpi.trend && kpi.trend !== 'neutral'" class="kpi-trend" :class="kpi.trend">
                  <i :class="getTrendIcon(kpi.trend)"></i>
                </span>
              </div>
              <div class="kpi-value">
                {{ formatKpiValue(kpi.value, kpi.unit) }}
                <span v-if="kpi.unit" class="unit">{{ kpi.unit }}</span>
              </div>
              <div v-if="kpi.previousValue !== undefined" class="kpi-comparison">
                vs période précédente: {{ formatKpiValue(kpi.previousValue, kpi.unit) }} {{ kpi.unit }}
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="report-metadata">
            <small>
              <i class="fas fa-calendar"></i>
              Période: {{ formatDate(kpisData.period?.start) }} - {{ formatDate(kpisData.period?.end) }}
            </small>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="fas fa-chart-bar"></i>
          <p>Aucune donnée disponible</p>
        </div>
      </div>

      <!-- Costs -->
      <div v-else-if="activeTab === 'costs'" class="report-view">
        <div class="report-header">
          <h2>
            <i class="fas fa-euro-sign"></i>
            Rapport des Coûts
          </h2>
        </div>

        <!-- Filtres -->
        <div class="report-filters">
          <div class="form-group">
            <label>Véhicule (optionnel)</label>
            <input v-model.number="costFilters.vehicleId" type="number" placeholder="ID du véhicule" />
          </div>
          <div class="form-group">
            <label>Date de début</label>
            <input v-model="costFilters.startDate" type="date" />
          </div>
          <div class="form-group">
            <label>Date de fin</label>
            <input v-model="costFilters.endDate" type="date" />
          </div>
          <button @click="loadCosts" class="btn-primary">
            <i class="fas fa-search"></i>
            Appliquer
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Calcul des coûts...</p>
        </div>

        <!-- Costs Content -->
        <div v-else-if="costsData" class="costs-content">
          <div class="costs-summary">
            <h3>Résumé des coûts</h3>
            <p class="total-cost">{{ formatCurrency(costsData.totalCost || 0) }}</p>
          </div>

          <!-- Table ou graphique -->
          <div v-if="costsData.details" class="table-section">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Interventions</th>
                  <th>Coût total</th>
                  <th>Coût moyen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in costsData.details" :key="item.vehicleId">
                  <td>{{ item.vehicle }}</td>
                  <td>{{ item.count }}</td>
                  <td>{{ formatCurrency(item.totalCost) }}</td>
                  <td>{{ formatCurrency(item.averageCost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="fas fa-euro-sign"></i>
          <p>Aucune donnée disponible</p>
        </div>
      </div>

      <!-- Maintenance -->
      <div v-else-if="activeTab === 'maintenance'" class="report-view">
        <div class="report-header">
          <h2>
            <i class="fas fa-wrench"></i>
            Échéancier de Maintenance
          </h2>
        </div>

        <!-- Filtre jours -->
        <div class="report-filters">
          <div class="form-group">
            <label>Horizon (jours)</label>
            <select v-model.number="maintenanceDays" @change="loadMaintenance">
              <option :value="30">30 jours</option>
              <option :value="60">60 jours</option>
              <option :value="90">90 jours</option>
              <option :value="180">180 jours</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Chargement de l'échéancier...</p>
        </div>

        <!-- Maintenance Content -->
        <div v-else-if="maintenanceData" class="maintenance-content">
          <div v-if="maintenanceData.schedule && maintenanceData.schedule.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Type maintenance</th>
                  <th>Date prévue</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in maintenanceData.schedule" :key="item.id">
                  <td>{{ item.vehicle }}</td>
                  <td>{{ item.maintenanceType }}</td>
                  <td>{{ formatDate(item.scheduledDate) }}</td>
                  <td>
                    <span class="badge" :class="getMaintenanceStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-check-circle"></i>
            <p>Aucune maintenance prévue</p>
          </div>
        </div>
      </div>

      <!-- Failures -->
      <div v-else-if="activeTab === 'failures'" class="report-view">
        <div class="report-header">
          <h2>
            <i class="fas fa-exclamation-triangle"></i>
            Analyse des Pannes
          </h2>
        </div>

        <!-- Filtres -->
        <div class="report-filters">
          <div class="form-group">
            <label>Date de début</label>
            <input v-model="failureFilters.startDate" type="date" />
          </div>
          <div class="form-group">
            <label>Date de fin</label>
            <input v-model="failureFilters.endDate" type="date" />
          </div>
          <button @click="loadFailures" class="btn-primary">
            <i class="fas fa-search"></i>
            Appliquer
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Analyse en cours...</p>
        </div>

        <!-- Failures Content -->
        <div v-else-if="failuresData" class="failures-content">
          <div v-if="failuresData.analysis && failuresData.analysis.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Type de panne</th>
                  <th>Occurr

ences</th>
                  <th>Coût total</th>
                  <th>Coût moyen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in failuresData.analysis" :key="item.type">
                  <td>{{ item.failureType }}</td>
                  <td>{{ item.count }}</td>
                  <td>{{ formatCurrency(item.totalCost) }}</td>
                  <td>{{ formatCurrency(item.averageCost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-check-circle"></i>
            <p>Aucune panne enregistrée</p>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import apiService from '@/services/api.service'

const { success, error, warning } = useNotification()

// État
const loading = ref(false)
const activeTab = ref('overview')
const reportMetadata = ref(null)

// Données des rapports
const dashboardData = ref(null)
const kpisData = ref(null)
const costsData = ref(null)
const maintenanceData = ref(null)
const failuresData = ref(null)

// Filtres
const kpiFilters = ref({
  startDate: '',
  endDate: ''
})

const costFilters = ref({
  vehicleId: null,
  startDate: '',
  endDate: ''
})

const failureFilters = ref({
  startDate: '',
  endDate: ''
})

const maintenanceDays = ref(90)

// Onglets
const tabs = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: 'fas fa-th-large' },
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { id: 'kpis', label: 'KPIs', icon: 'fas fa-chart-bar' },
  { id: 'costs', label: 'Coûts', icon: 'fas fa-euro-sign' },
  { id: 'maintenance', label: 'Maintenance', icon: 'fas fa-wrench' },
  { id: 'failures', label: 'Pannes', icon: 'fas fa-exclamation-triangle' }
]

// Rapports disponibles
const availableReports = [
  {
    type: 'dashboard',
    title: 'Tableau de Bord',
    category: 'Vue d\'ensemble',
    description: 'Vue synthétique de toutes les interventions en cours et statistiques clés',
    icon: 'fas fa-tachometer-alt'
  },
  {
    type: 'kpis',
    title: 'Indicateurs Clés (KPIs)',
    category: 'Performance',
    description: 'Métriques de performance et indicateurs de suivi des interventions',
    icon: 'fas fa-chart-bar'
  },
  {
    type: 'costs',
    title: 'Analyse des Coûts',
    category: 'Finance',
    description: 'Coûts détaillés par véhicule et période',
    icon: 'fas fa-euro-sign'
  },
  {
    type: 'maintenance',
    title: 'Échéancier Maintenance',
    category: 'Préventif',
    description: 'Planning des maintenances préventives à venir',
    icon: 'fas fa-wrench'
  },
  {
    type: 'failures',
    title: 'Analyse des Pannes',
    category: 'Analyse',
    description: 'Analyse statistique des types de pannes et défaillances',
    icon: 'fas fa-exclamation-triangle'
  }
]

// Méthodes
const selectTab = async (tabId) => {
  activeTab.value = tabId
  
  // Charger les données selon l'onglet
  if (tabId === 'dashboard') {
    await loadDashboard()
  } else if (tabId === 'kpis') {
    await loadKPIs()
  } else if (tabId === 'costs') {
    await loadCosts()
  } else if (tabId === 'maintenance') {
    await loadMaintenance()
  } else if (tabId === 'failures') {
    await loadFailures()
  }
}

const selectReport = (reportType) => {
  const tabMap = {
    'dashboard': 'dashboard',
    'kpis': 'kpis',
    'costs': 'costs',
    'maintenance': 'maintenance',
    'failures': 'failures'
  }
  
  const tab = tabMap[reportType]
  if (tab) {
    selectTab(tab)
  }
}

const loadDashboard = async () => {
  try {
    loading.value = true
    const response = await apiService.getReportDashboard(false)
    
    if (response.success) {
      dashboardData.value = response.data
      reportMetadata.value = response.metadata || null
    }
  } catch (err) {
    console.error('Error loading dashboard:', err)
    error('Erreur lors du chargement du dashboard')
  } finally {
    loading.value = false
  }
}

const loadKPIs = async () => {
  try {
    loading.value = true
    const response = await apiService.getReportKPIs(
      kpiFilters.value.startDate || null,
      kpiFilters.value.endDate || null
    )
    
    if (response.success) {
      kpisData.value = response.data
    }
  } catch (err) {
    console.error('Error loading KPIs:', err)
    error('Erreur lors du chargement des KPIs')
  } finally {
    loading.value = false
  }
}

const loadCosts = async () => {
  try {
    loading.value = true
    const response = await apiService.getReportCostsByVehicle(
      costFilters.value.vehicleId || null,
      costFilters.value.startDate || null,
      costFilters.value.endDate || null
    )
    
    if (response.success) {
      costsData.value = response.data
    }
  } catch (err) {
    console.error('Error loading costs:', err)
    error('Erreur lors du chargement des coûts')
  } finally {
    loading.value = false
  }
}

const loadMaintenance = async () => {
  try {
    loading.value = true
    const response = await apiService.getReportMaintenanceSchedule(maintenanceDays.value)
    
    if (response.success) {
      maintenanceData.value = response.data
    }
  } catch (err) {
    console.error('Error loading maintenance:', err)
    error('Erreur lors du chargement de la maintenance')
  } finally {
    loading.value = false
  }
}

const loadFailures = async () => {
  try {
    loading.value = true
    const response = await apiService.getReportFailuresAnalysis(
      failureFilters.value.startDate || null,
      failureFilters.value.endDate || null
    )
    
    if (response.success) {
      failuresData.value = response.data
    }
  } catch (err) {
    console.error('Error loading failures:', err)
    error('Erreur lors du chargement de l\'analyse des pannes')
  } finally {
    loading.value = false
  }
}

const refreshCurrentReport = async () => {
  await selectTab(activeTab.value)
}

const exportReport = () => {
  warning('Export en cours de développement')
}

// Helpers
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value || 0)
}

const formatPriority = (priority) => {
  const labels = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente'
  }
  return labels[priority] || priority
}

const formatKpiLabel = (key) => {
  const labels = {
    averageCost: 'Coût moyen',
    averageDuration: 'Durée moyenne',
    completionRate: 'Taux de complétion',
    satisfactionRate: 'Satisfaction',
    utilizationRate: 'Taux d\'utilisation'
  }
  return labels[key] || key
}

const formatKpiValue = (value, unit) => {
  if (unit === '%' || unit === 'percent') {
    return value.toFixed(1)
  }
  if (unit === '€' || unit === 'EUR') {
    return formatCurrency(value)
  }
  if (unit === 'days' || unit === 'jours') {
    return value.toFixed(1)
  }
  return value
}

const getPriorityClass = (priority) => {
  const classes = {
    low: 'badge-success',
    medium: 'badge-warning',
    high: 'badge-error',
    urgent: 'badge-error'
  }
  return classes[priority] || ''
}

const getTrendClass = (trend) => {
  if (trend === 'up') return 'trend-up'
  if (trend === 'down') return 'trend-down'
  return ''
}

const getTrendIcon = (trend) => {
  if (trend === 'up') return 'fas fa-arrow-up'
  if (trend === 'down') return 'fas fa-arrow-down'
  return 'fas fa-minus'
}

const getMaintenanceStatusClass = (status) => {
  const classes = {
    'upcoming': 'badge-warning',
    'overdue': 'badge-error',
    'completed': 'badge-success'
  }
  return classes[status] || ''
}

// Lifecycle
onMounted(() => {
  // Charger les stats au démarrage
})
</script>

<style scoped lang="scss">
.page-actions {
  margin-bottom: 1.5rem;
}

// Onglets
.reports-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

.report-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #3b82f6;
    background: #f3f4f6;
  }

  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  i {
    font-size: 1.1rem;
  }
}

// Overview Grid
.reports-overview {
  padding: 1rem 0;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.report-card {
  padding: 2rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }
}

.report-card-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border-radius: 12px;
  margin-bottom: 1.5rem;

  i {
    font-size: 2rem;
    color: #3b82f6;
  }
}

.report-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.report-card-category {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.report-card-description {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.report-card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #3b82f6;
  font-weight: 600;
  font-size: 0.95rem;
}

// Report View
.report-view {
  background: white;
  border-radius: 12px;
  padding: 2rem;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;

  h2 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;

    i {
      color: #3b82f6;
    }
  }
}

// Filtres
.report-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;

  &.success {
    border-left: 4px solid #10b981;
  }

  &.warning {
    border-left: 4px solid #f59e0b;
  }

  &.error {
    border-left: 4px solid #ef4444;
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border-radius: 12px;

  i {
    font-size: 1.75rem;
    color: #3b82f6;
  }
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  .unit {
    font-size: 1.25rem;
    color: #6b7280;
    margin-left: 0.25rem;
  }
}

// Alertes
.alerts-section {
  margin-bottom: 2rem;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}

.alerts-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;

  &.warning {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
  }

  &.error {
    background: #fee2e2;
    border-left: 4px solid #ef4444;
  }
}

.alert-icon {
  i {
    font-size: 1.5rem;
    color: #f59e0b;
  }
}

.alert-message {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.alert-count {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

// KPIs Grid
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;

  &.trend-up {
    border-left: 4px solid #10b981;
  }

  &.trend-down {
    border-left: 4px solid #ef4444;
  }
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.kpi-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;

  &.up {
    color: #10b981;
  }

  &.down {
    color: #ef4444;
  }
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.kpi-comparison {
  font-size: 0.875rem;
  color: #6b7280;
}

// Table
.table-section {
  margin-bottom: 2rem;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  small {
    color: #6b7280;
    font-size: 0.875rem;
  }
}

// Metadata
.report-metadata {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  text-align: right;

  small {
    color: #6b7280;
    font-size: 0.875rem;
  }
}

// Loading state
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #3b82f6;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }
}

// Empty state
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #9ca3af;

  i {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.125rem;
    margin: 0;
  }
}
</style>

