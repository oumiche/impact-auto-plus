<template>
  <DefaultLayout>
    <template #header>
      <div class="analytics-header-content">
        <div>
          <h1>Analytics & Métriques</h1>
          <p>Analysez les performances de votre parc automobile en temps réel</p>
        </div>
        <div class="header-actions">
          <button @click="refreshAnalytics" class="btn-secondary" :disabled="loading">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
            Actualiser
          </button>
          <button @click="exportData" class="btn-primary">
            <i class="fas fa-download"></i>
            Exporter
          </button>
        </div>
      </div>
    </template>

    <!-- Period Selector -->
    <div class="period-selector-container">
      <PeriodSelector
        v-model="selectedPeriod"
        @change="handlePeriodChange"
      />
    </div>

    <!-- Loading global -->
    <div v-if="initialLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Chargement des analytics...</p>
    </div>

    <div v-else class="analytics-content">
      <!-- KPI Cards Grid -->
      <div class="kpis-section">
        <h2 class="section-title">Indicateurs Clés</h2>
        <div class="kpis-grid">
          <KPICard
            v-for="kpi in kpiCards"
            :key="kpi.id"
            :icon="kpi.icon"
            :label="kpi.label"
            :value="kpi.value"
            :trend="kpi.trend"
            :change="kpi.change"
            :color="kpi.color"
          />
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-section">
        <h2 class="section-title">Visualisations</h2>
        
        <div class="charts-grid">
          <!-- Timeline Chart -->
          <div class="chart-container full-width">
            <div class="chart-header">
              <h3>
                <i class="fas fa-chart-line"></i>
                Évolution des Interventions
              </h3>
            </div>
            <div class="chart-body">
              <Line
                v-if="timelineChartData"
                :data="timelineChartData"
                :options="lineChartOptions"
              />
              <div v-else class="chart-empty">
                <i class="fas fa-chart-line"></i>
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          </div>

          <!-- Status Distribution -->
          <div class="chart-container">
            <div class="chart-header">
              <h3>
                <i class="fas fa-chart-pie"></i>
                Répartition par Statut
              </h3>
            </div>
            <div class="chart-body">
              <Doughnut
                v-if="statusChartData"
                :data="statusChartData"
                :options="doughnutChartOptions"
              />
              <div v-else class="chart-empty">
                <i class="fas fa-chart-pie"></i>
                <p>Aucune donnée</p>
              </div>
            </div>
          </div>

          <!-- Costs Evolution -->
          <div class="chart-container">
            <div class="chart-header">
              <h3>
                <i class="fas fa-chart-bar"></i>
                Évolution des Coûts
              </h3>
            </div>
            <div class="chart-body">
              <Bar
                v-if="costsChartData"
                :data="costsChartData"
                :options="barChartOptions"
              />
              <div v-else class="chart-empty">
                <i class="fas fa-chart-bar"></i>
                <p>Aucune donnée</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fleet Analysis -->
      <div class="fleet-section">
        <h2 class="section-title">Analyse de la Flotte</h2>
        
        <div class="fleet-grid">
          <!-- Availability Card -->
          <div class="fleet-card">
            <div class="fleet-card-header">
              <h3>Disponibilité du Parc</h3>
            </div>
            <div class="fleet-card-body">
              <div class="availability-gauge">
                <div class="gauge-value" :class="getAvailabilityClass()">
                  {{ fleetAvailability.toFixed(1) }}
                  <span class="unit">%</span>
                </div>
                <div class="gauge-label">
                  {{ getAvailabilityLabel() }}
                </div>
              </div>
            </div>
          </div>

          <!-- Top Vehicles -->
          <div class="fleet-card">
            <div class="fleet-card-header">
              <h3>Top 5 Véhicules (Coûts)</h3>
            </div>
            <div class="fleet-card-body">
              <div v-if="topVehicles.length > 0" class="top-vehicles-list">
                <div
                  v-for="(vehicle, index) in topVehicles.slice(0, 5)"
                  :key="vehicle.id"
                  class="vehicle-rank-item"
                >
                  <div class="rank-badge">{{ index + 1 }}</div>
                  <div class="vehicle-info">
                    <strong>{{ vehicle.plateNumber }}</strong>
                    <small>{{ vehicle.interventionCount }} interventions</small>
                  </div>
                  <div class="vehicle-cost">
                    {{ formatCurrency(vehicle.totalCost) }}
                  </div>
                </div>
              </div>
              <div v-else class="empty-vehicles">
                <i class="fas fa-car"></i>
                <p>Aucune donnée</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Section -->
      <div class="comparison-section">
        <h2 class="section-title">Comparaison de Périodes</h2>
        
        <div class="comparison-grid">
          <div class="comparison-card current">
            <h4>Période Actuelle</h4>
            <p class="period-label">{{ formatPeriodLabel(period.start, period.end) }}</p>
            <div class="comparison-metrics">
              <div class="metric-row">
                <span class="metric-label">Interventions</span>
                <strong>{{ currentPeriodMetrics.interventions }}</strong>
              </div>
              <div class="metric-row">
                <span class="metric-label">Coûts totaux</span>
                <strong>{{ formatCurrency(currentPeriodMetrics.costs) }}</strong>
              </div>
              <div class="metric-row">
                <span class="metric-label">Durée moyenne</span>
                <strong>{{ currentPeriodMetrics.avgDuration }} jours</strong>
              </div>
            </div>
          </div>

          <div class="comparison-arrow">
            <i class="fas fa-exchange-alt"></i>
          </div>

          <div class="comparison-card previous">
            <h4>Période Précédente</h4>
            <p class="period-label">{{ formatPeriodLabel(previousPeriod.start, previousPeriod.end) }}</p>
            <div class="comparison-metrics">
              <div class="metric-row">
                <span class="metric-label">Interventions</span>
                <strong>{{ previousPeriodMetrics.interventions }}</strong>
              </div>
              <div class="metric-row">
                <span class="metric-label">Coûts totaux</span>
                <strong>{{ formatCurrency(previousPeriodMetrics.costs) }}</strong>
              </div>
              <div class="metric-row">
                <span class="metric-label">Durée moyenne</span>
                <strong>{{ previousPeriodMetrics.avgDuration }} jours</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Differences -->
        <div class="differences-grid">
          <div class="diff-card" :class="getDiffClass(comparisonDiffs.interventions)">
            <i :class="getDiffIcon(comparisonDiffs.interventions)"></i>
            <span>{{ comparisonDiffs.interventions }}% interventions</span>
          </div>
          <div class="diff-card" :class="getDiffClass(comparisonDiffs.costs)">
            <i :class="getDiffIcon(comparisonDiffs.costs)"></i>
            <span>{{ comparisonDiffs.costs }}% coûts</span>
          </div>
          <div class="diff-card" :class="getDiffClass(comparisonDiffs.duration)">
            <i :class="getDiffIcon(comparisonDiffs.duration)"></i>
            <span>{{ comparisonDiffs.duration }}% durée</span>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Line, Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import KPICard from '@/components/common/KPICard.vue'
import PeriodSelector from '@/components/common/PeriodSelector.vue'
import apiService from '@/services/api.service'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { success, error, warning } = useNotification()

// État
const initialLoading = ref(true)
const loading = ref(false)
const selectedPeriod = ref('30d')
const customPeriod = ref({ start: '', end: '' })

// Données
const dashboardData = ref(null)
const kpisData = ref(null)
const costsData = ref(null)

// Period calculé
const period = computed(() => {
  if (selectedPeriod.value === 'custom') {
    return customPeriod.value
  }
  return calculatePeriodDates(selectedPeriod.value)
})

const previousPeriod = computed(() => {
  const current = period.value
  const start = new Date(current.start)
  const end = new Date(current.end)
  const duration = (end - start) / (1000 * 60 * 60 * 24)
  
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - duration)
  
  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0]
  }
})

// KPI Cards
const kpiCards = computed(() => {
  const counters = dashboardData.value?.counters || {}
  const trends = dashboardData.value?.trends || {}
  
  return [
    {
      id: 'vehicles',
      icon: 'fas fa-car',
      label: 'Véhicules Actifs',
      value: counters.totalVehicles || 0,
      trend: trends.vehicles || 'neutral',
      change: trends.vehiclesChange || '',
      color: 'blue'
    },
    {
      id: 'interventions',
      icon: 'fas fa-wrench',
      label: 'Interventions',
      value: counters.total || 0,
      trend: trends.interventions || 'neutral',
      change: trends.interventionsChange || '',
      color: 'green'
    },
    {
      id: 'costs',
      icon: 'fas fa-euro-sign',
      label: 'Coûts Totaux',
      value: formatCurrency(costsData.value?.summary?.totalCosts || 0),
      trend: trends.costs || 'neutral',
      change: trends.costsChange || '',
      color: 'orange'
    },
    {
      id: 'duration',
      icon: 'fas fa-clock',
      label: 'Durée Moyenne',
      value: `${averageDuration.value.toFixed(1)} j`,
      trend: trends.duration || 'neutral',
      change: trends.durationChange || '',
      color: 'purple'
    },
    {
      id: 'satisfaction',
      icon: 'fas fa-star',
      label: 'Satisfaction',
      value: `${satisfactionRate.value.toFixed(1)}%`,
      trend: trends.satisfaction || 'neutral',
      change: trends.satisfactionChange || '',
      color: 'yellow'
    },
    {
      id: 'availability',
      icon: 'fas fa-chart-line',
      label: 'Disponibilité',
      value: `${fleetAvailability.value.toFixed(1)}%`,
      trend: trends.availability || 'neutral',
      change: trends.availabilityChange || '',
      color: 'teal'
    }
  ]
})

// Computed metrics
const averageDuration = computed(() => {
  const interventions = dashboardData.value?.interventionsInProgress || []
  if (interventions.length === 0) return 0
  
  // Calculer durée moyenne (simulation)
  return 3.2
})

const satisfactionRate = computed(() => {
  // À calculer depuis reception reports
  return 92.5
})

const fleetAvailability = computed(() => {
  return dashboardData.value?.fleetAvailability || 0
})

const topVehicles = computed(() => {
  // À extraire de costsData
  return costsData.value?.topVehicles || []
})

// Current period metrics
const currentPeriodMetrics = computed(() => {
  return {
    interventions: dashboardData.value?.counters?.total || 0,
    costs: costsData.value?.summary?.totalCosts || 0,
    avgDuration: averageDuration.value.toFixed(1)
  }
})

// Previous period metrics (simulation)
const previousPeriodMetrics = computed(() => {
  return {
    interventions: Math.round(currentPeriodMetrics.value.interventions * 0.92),
    costs: Math.round(currentPeriodMetrics.value.costs * 0.88),
    avgDuration: (parseFloat(currentPeriodMetrics.value.avgDuration) + 0.5).toFixed(1)
  }
})

// Comparison diffs
const comparisonDiffs = computed(() => {
  const calcDiff = (current, previous) => {
    if (previous === 0) return '+0.0'
    const diff = ((current - previous) / previous * 100).toFixed(1)
    return diff > 0 ? `+${diff}` : diff
  }
  
  return {
    interventions: calcDiff(
      currentPeriodMetrics.value.interventions,
      previousPeriodMetrics.value.interventions
    ),
    costs: calcDiff(
      currentPeriodMetrics.value.costs,
      previousPeriodMetrics.value.costs
    ),
    duration: calcDiff(
      parseFloat(currentPeriodMetrics.value.avgDuration),
      parseFloat(previousPeriodMetrics.value.avgDuration)
    )
  }
})

// Timeline Chart Data
const timelineChartData = computed(() => {
  if (!dashboardData.value) return null
  
  // Générer les données pour les 12 derniers mois
  const months = []
  const reported = []
  const inProgress = []
  const completed = []
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    months.push(date.toLocaleDateString('fr-FR', { month: 'short' }))
    
    // Simulation - à remplacer par vraies données
    reported.push(Math.floor(Math.random() * 15) + 5)
    inProgress.push(Math.floor(Math.random() * 10) + 3)
    completed.push(Math.floor(Math.random() * 20) + 10)
  }
  
  return {
    labels: months,
    datasets: [
      {
        label: 'Reportées',
        data: reported,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'En cours',
        data: inProgress,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Terminées',
        data: completed,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }
})

// Status Chart Data
const statusChartData = computed(() => {
  const counters = dashboardData.value?.counters || {}
  
  return {
    labels: [
      'Reportées',
      'Prédiagnostic',
      'Devis',
      'Travaux',
      'Terminées',
      'Facturées'
    ],
    datasets: [{
      data: [
        counters.reported || 0,
        counters.in_prediagnostic || 0,
        counters.in_quotation || 0,
        counters.in_progress || 0,
        counters.completed || 0,
        counters.invoiced || 0
      ],
      backgroundColor: [
        '#3b82f6',
        '#8b5cf6',
        '#f59e0b',
        '#10b981',
        '#06b6d4',
        '#059669'
      ],
      borderWidth: 0
    }]
  }
})

// Costs Chart Data
const costsChartData = computed(() => {
  const monthly = costsData.value?.monthlyEvolution || []
  
  if (monthly.length === 0) {
    // Simulation data
    const months = []
    const costs = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push(date.toLocaleDateString('fr-FR', { month: 'short' }))
      costs.push(Math.floor(Math.random() * 5000) + 2000)
    }
    
    return {
      labels: months,
      datasets: [{
        label: 'Coûts totaux',
        data: costs,
        backgroundColor: '#3b82f6'
      }]
    }
  }
  
  return {
    labels: monthly.map(m => m.month),
    datasets: [{
      label: 'Coûts totaux',
      data: monthly.map(m => m.cost),
      backgroundColor: '#3b82f6'
    }]
  }
})

// Chart Options
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 15,
        font: {
          size: 12
        },
        usePointStyle: true
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      }
    }
  },
  animation: {
    duration: 750
  }
}

const lineChartOptions = computed(() => ({
  ...commonChartOptions,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}))

const doughnutChartOptions = computed(() => ({
  ...commonChartOptions,
  cutout: '65%',
  plugins: {
    ...commonChartOptions.plugins,
    legend: {
      position: 'right',
      labels: {
        padding: 12,
        font: {
          size: 11
        }
      }
    }
  }
}))

const barChartOptions = computed(() => ({
  ...commonChartOptions,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => formatCurrency(value)
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}))

// Methods
const calculatePeriodDates = (preset) => {
  const end = new Date()
  const start = new Date()
  
  switch (preset) {
    case '7d':
      start.setDate(end.getDate() - 7)
      break
    case '30d':
      start.setDate(end.getDate() - 30)
      break
    case '3m':
      start.setMonth(end.getMonth() - 3)
      break
    case '6m':
      start.setMonth(end.getMonth() - 6)
      break
    case '1y':
      start.setFullYear(end.getFullYear() - 1)
      break
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

const loadAnalytics = async () => {
  try {
    loading.value = true
    
    // Charger en parallèle
    const [dashboard, kpis, costs] = await Promise.all([
      apiService.getReportDashboard(false),
      apiService.getReportKPIs(period.value.start, period.value.end),
      apiService.getReportCostsByVehicle(null, period.value.start, period.value.end)
    ])
    
    if (dashboard.success) {
      dashboardData.value = dashboard.data
    }
    
    if (kpis.success) {
      kpisData.value = kpis.data
    }
    
    if (costs.success) {
      costsData.value = costs.data
    }
    
  } catch (err) {
    console.error('Error loading analytics:', err)
    error('Erreur lors du chargement des analytics')
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

const handlePeriodChange = (value) => {
  if (typeof value === 'object' && value.start && value.end) {
    customPeriod.value = { start: value.start, end: value.end }
  }
  loadAnalytics()
}

const refreshAnalytics = async () => {
  await loadAnalytics()
  success('Analytics actualisés')
}

const exportData = () => {
  warning('Export en cours de développement')
}

// Helpers
const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatPeriodLabel = (start, end) => {
  return `${formatDate(start)} - ${formatDate(end)}`
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

const getAvailabilityClass = () => {
  const value = fleetAvailability.value
  if (value >= 90) return 'excellent'
  if (value >= 75) return 'good'
  if (value >= 50) return 'fair'
  return 'poor'
}

const getAvailabilityLabel = () => {
  const value = fleetAvailability.value
  if (value >= 90) return 'Excellent'
  if (value >= 75) return 'Bon'
  if (value >= 50) return 'Moyen'
  return 'Faible'
}

const getDiffClass = (diff) => {
  const value = parseFloat(diff)
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getDiffIcon = (diff) => {
  const value = parseFloat(diff)
  if (value > 0) return 'fas fa-arrow-up'
  if (value < 0) return 'fas fa-arrow-down'
  return 'fas fa-minus'
}

// Lifecycle
onMounted(() => {
  loadAnalytics()
})
</script>

<style scoped lang="scss">
.analytics-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.period-selector-container {
  margin-bottom: 2rem;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

// Sections
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: #3b82f6;
  }
}

// KPIs
.kpis-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

// Charts
.charts-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.chart-container {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.chart-header {
  padding: 1.25rem 1.5rem;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: #3b82f6;
    }
  }
}

.chart-body {
  padding: 1.5rem;
  height: 350px;
  position: relative;
}

.chart-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;

  i {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.95rem;
    margin: 0;
  }
}

// Fleet
.fleet-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
}

.fleet-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.fleet-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.fleet-card-header {
  padding: 1.25rem 1.5rem;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }
}

.fleet-card-body {
  padding: 1.5rem;
}

.availability-gauge {
  text-align: center;
  padding: 2rem 0;
}

.gauge-value {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 0.5rem;

  .unit {
    font-size: 2rem;
    color: #6b7280;
  }

  &.excellent {
    color: #10b981;
  }

  &.good {
    color: #3b82f6;
  }

  &.fair {
    color: #f59e0b;
  }

  &.poor {
    color: #ef4444;
  }
}

.gauge-label {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
}

.top-vehicles-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.vehicle-rank-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.vehicle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  strong {
    color: #1f2937;
    font-size: 0.95rem;
  }

  small {
    color: #6b7280;
    font-size: 0.8rem;
  }
}

.vehicle-cost {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1rem;
}

.empty-vehicles {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;

  i {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0;
  }
}

// Comparison
.comparison-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.comparison-card {
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;

  &.current {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.previous {
    background: #f9fafb;
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
  }

  .period-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1.25rem 0;
  }
}

.comparison-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }

  .metric-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  strong {
    font-size: 1rem;
    color: #1f2937;
  }
}

.comparison-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;

  i {
    font-size: 2rem;
  }
}

.differences-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.diff-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;

  &.positive {
    background: #d1fae5;
    color: #065f46;
  }

  &.negative {
    background: #fee2e2;
    color: #991b1b;
  }

  &.neutral {
    background: #f3f4f6;
    color: #6b7280;
  }

  i {
    font-size: 1rem;
  }
}

// Loading & Empty
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

// Responsive
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .fleet-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    
    button {
      flex: 1;
    }
  }

  .kpis-grid {
    grid-template-columns: 1fr;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .comparison-arrow {
    display: none;
  }

  .differences-grid {
    grid-template-columns: 1fr;
  }
}
</style>

