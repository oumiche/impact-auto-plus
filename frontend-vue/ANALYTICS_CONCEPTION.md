# 📊 CONCEPTION DÉTAILLÉE - Analytics.vue

**Date**: 12 octobre 2025  
**Version**: 1.0  
**Statut**: 📋 En conception

---

## 🎯 OBJECTIF

Créer une page **Analytics** moderne et complète pour Impact Auto Plus permettant:
- Visualiser les performances du parc automobile
- Analyser les tendances et évolutions
- Comparer les périodes
- Identifier les optimisations possibles
- Prendre des décisions data-driven

---

## 📐 ARCHITECTURE GLOBALE

### Structure de la page

```
Analytics.vue
├── Header (titre + actions)
├── Période Selector (global)
├── KPI Cards (4-6 cartes)
├── Section Graphiques principaux
│   ├── Timeline interventions
│   ├── Répartition par statut (pie chart)
│   └── Coûts mensuels (bar chart)
├── Section Analyse flotte
│   ├── Top véhicules (coûts)
│   ├── Disponibilité parc
│   └── Utilisation par véhicule
├── Section Analyse interventions
│   ├── Types d'interventions (pie)
│   ├── Durée moyenne par type
│   └── Taux de satisfaction
└── Section Comparaisons
    ├── Période actuelle vs précédente
    ├── Tendances (up/down)
    └── Prévisions
```

---

## 🎨 WIREFRAME DÉTAILLÉ

### Layout Desktop (1920x1080)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ 📊 Analytics & Métriques                    [Period] [Export]│
├─────────────────────────────────────────────────────────────┤
│ PÉRIODE SELECTOR                                            │
│ [7 jours] [30 jours] [3 mois] [6 mois] [1 an] [Personnalisé]│
├─────────────────────────────────────────────────────────────┤
│ KPI CARDS (Grid 2x3)                                        │
│ ┌───────────┬───────────┬───────────┐                      │
│ │ 🚗 Véhic. │ 🔧 Interv.│ 💶 Coûts  │                      │
│ │    45     │    128    │  52,450€  │                      │
│ │  +5.2%    │  -2.1%    │  +12.3%   │                      │
│ └───────────┴───────────┴───────────┘                      │
│ ┌───────────┬───────────┬───────────┐                      │
│ │ ⏱️ Durée  │ ⭐ Satisf.│ 📈 Util.  │                      │
│ │  3.2 j    │   92.5%   │   78.4%   │                      │
│ │  -0.5 j   │  +3.2%    │  -1.8%    │                      │
│ └───────────┴───────────┴───────────┘                      │
├─────────────────────────────────────────────────────────────┤
│ GRAPHIQUES PRINCIPAUX (Grid 2 cols)                         │
│ ┌────────────────────────┬──────────────────────┐          │
│ │ Timeline Interventions │ Répartition Statuts  │          │
│ │ [Line Chart]           │ [Pie Chart]          │          │
│ │                        │                      │          │
│ │                        │                      │          │
│ └────────────────────────┴──────────────────────┘          │
│ ┌─────────────────────────────────────────────┐            │
│ │ Évolution Coûts Mensuels [Bar Chart]        │            │
│ │                                             │            │
│ └─────────────────────────────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ ANALYSE FLOTTE                                              │
│ ┌──────────────────────┬──────────────────────┐            │
│ │ Top 10 Véhicules     │ Disponibilité Flotte │            │
│ │ (Table)              │ (Gauge Chart)        │            │
│ └──────────────────────┴──────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ TENDANCES & COMPARAISONS                                    │
│ [Cards avec comparaison période actuelle vs précédente]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 MÉTRIQUES & KPIs

### KPI Cards principales (6 cartes)

#### 1. **Total Véhicules Actifs**
```javascript
{
  icon: 'fas fa-car',
  label: 'Véhicules Actifs',
  value: 45,
  trend: 'up',
  change: '+5.2%',
  color: 'blue',
  source: 'COUNT(vehicles WHERE status=active)'
}
```

#### 2. **Interventions Totales**
```javascript
{
  icon: 'fas fa-wrench',
  label: 'Interventions',
  value: 128,
  trend: 'down',
  change: '-2.1%',
  color: 'green',
  source: 'COUNT(interventions) for period'
}
```

#### 3. **Coûts Totaux**
```javascript
{
  icon: 'fas fa-euro-sign',
  label: 'Coûts Totaux',
  value: '52,450€',
  trend: 'up',
  change: '+12.3%',
  color: 'orange',
  source: 'SUM(invoices.totalAmount)'
}
```

#### 4. **Durée Moyenne**
```javascript
{
  icon: 'fas fa-clock',
  label: 'Durée Moyenne',
  value: '3.2 jours',
  trend: 'down',
  change: '-0.5 jours',
  color: 'purple',
  source: 'AVG(completedDate - reportedDate)'
}
```

#### 5. **Taux de Satisfaction**
```javascript
{
  icon: 'fas fa-star',
  label: 'Satisfaction Client',
  value: '92.5%',
  trend: 'up',
  change: '+3.2%',
  color: 'yellow',
  source: 'satisfaction from reception reports'
}
```

#### 6. **Taux d'Utilisation**
```javascript
{
  icon: 'fas fa-chart-line',
  label: 'Taux d\'Utilisation',
  value: '78.4%',
  trend: 'down',
  change: '-1.8%',
  color: 'teal',
  source: '(vehicles in use / total vehicles) * 100'
}
```

---

## 📈 GRAPHIQUES

### 1. Timeline des Interventions (Line Chart)

**Type**: Line Chart avec zones  
**Données**: Nombre d'interventions par jour/semaine/mois  
**Axes**:
- X: Temps (dates)
- Y: Nombre d'interventions

**Options**:
- Multi-lignes (par statut)
- Zones colorées
- Tooltips interactifs
- Zoom/Pan

**Source données**:
```javascript
{
  labels: ['Jan', 'Fev', 'Mar', ...],
  datasets: [
    {
      label: 'Reportées',
      data: [12, 15, 18, ...],
      color: '#3b82f6'
    },
    {
      label: 'En cours',
      data: [8, 10, 12, ...],
      color: '#f59e0b'
    },
    {
      label: 'Terminées',
      data: [20, 25, 30, ...],
      color: '#10b981'
    }
  ]
}
```

---

### 2. Répartition par Statut (Pie Chart)

**Type**: Doughnut Chart  
**Données**: Distribution des interventions par statut

**Structure**:
```javascript
{
  labels: [
    'Reportées',
    'En prédiagnostic',
    'En devis',
    'Travaux en cours',
    'Terminées',
    'Facturées'
  ],
  datasets: [{
    data: [15, 8, 12, 25, 45, 23],
    backgroundColor: [
      '#3b82f6', // bleu
      '#8b5cf6', // violet
      '#f59e0b', // orange
      '#10b981', // vert
      '#06b6d4', // cyan
      '#059669'  // vert foncé
    ]
  }]
}
```

**Features**:
- Légende interactive
- Tooltips avec %
- Animation au chargement
- Click pour filtrer

---

### 3. Évolution Coûts Mensuels (Bar Chart)

**Type**: Bar Chart  
**Données**: Coûts totaux par mois

**Structure**:
```javascript
{
  labels: ['Jan', 'Fev', 'Mar', ...],
  datasets: [
    {
      label: 'Pièces',
      data: [2500, 3200, 2800, ...],
      backgroundColor: '#3b82f6'
    },
    {
      label: 'Main d\'œuvre',
      data: [1800, 2100, 1950, ...],
      backgroundColor: '#10b981'
    }
  ]
}
```

**Features**:
- Stacked bars
- Tooltips détaillés
- Total affiché au-dessus

---

### 4. Top 10 Véhicules (Horizontal Bar Chart)

**Type**: Horizontal Bar Chart  
**Données**: 10 véhicules avec le plus de coûts

**Structure**:
```javascript
{
  labels: ['AB-123-CD', 'EF-456-GH', ...],
  datasets: [{
    label: 'Coûts totaux',
    data: [5420, 4850, 4320, ...],
    backgroundColor: gradient
  }]
}
```

---

### 5. Disponibilité Flotte (Gauge Chart)

**Type**: Gauge/Radial Progress  
**Données**: % de véhicules disponibles

**Structure**:
```javascript
{
  value: 78.4,
  min: 0,
  max: 100,
  thresholds: [
    { value: 50, color: '#ef4444' },
    { value: 75, color: '#f59e0b' },
    { value: 90, color: '#10b981' }
  ]
}
```

---

### 6. Types d'Interventions (Pie Chart)

**Type**: Pie Chart  
**Données**: Répartition par type

**Structure**:
```javascript
{
  labels: ['Entretien', 'Réparation', 'Panne', 'Révision'],
  datasets: [{
    data: [45, 32, 18, 28],
    backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981']
  }]
}
```

---

## 🔍 SECTIONS DÉTAILLÉES

### Section 1: Header & Actions

**Contenu**:
- Titre : "Analytics & Métriques"
- Sous-titre : "Analysez les performances en temps réel"
- Actions :
  - Bouton "Exporter PDF"
  - Bouton "Exporter Excel"
  - Bouton "Rafraîchir"
  - Selector période

**Layout**:
```html
<div class="analytics-header">
  <div>
    <h1>Analytics & Métriques</h1>
    <p>Analysez les performances en temps réel</p>
  </div>
  <div class="header-actions">
    <PeriodSelector v-model="period" />
    <button @click="exportPDF">PDF</button>
    <button @click="exportExcel">Excel</button>
    <button @click="refresh">Refresh</button>
  </div>
</div>
```

---

### Section 2: Période Selector

**Types de périodes prédéfinies**:
- Derniers 7 jours
- Derniers 30 jours
- Derniers 3 mois
- Derniers 6 mois
- Dernière année
- Personnalisé (date picker)

**Features**:
- Boutons toggle rapides
- Date picker custom
- Auto-refresh au changement
- Sauvegarde préférence

**Component**:
```vue
<PeriodSelector
  v-model="selectedPeriod"
  :presets="['7d', '30d', '3m', '6m', '1y', 'custom']"
  @change="loadAnalytics"
/>
```

---

### Section 3: KPI Cards Grid

**Layout**: Grid 3 colonnes (2x3)

**Structure d'une carte**:
```html
<div class="kpi-card">
  <div class="kpi-icon">
    <i class="fas fa-car"></i>
  </div>
  <div class="kpi-content">
    <p class="kpi-label">Véhicules Actifs</p>
    <p class="kpi-value">45</p>
    <div class="kpi-trend up">
      <i class="fas fa-arrow-up"></i>
      <span>+5.2% vs période précédente</span>
    </div>
  </div>
</div>
```

**States**:
- Trend up : vert + flèche haut
- Trend down : rouge + flèche bas
- Trend neutral : gris + tiret

---

### Section 4: Graphiques Timeline

**Grid 2 colonnes**:

#### Colonne 1: Timeline Interventions
- Type: Line Chart
- Hauteur: 350px
- Multi-datasets (par statut)
- Legend cliquable
- Tooltips riches

#### Colonne 2: Répartition Statuts
- Type: Doughnut Chart
- Hauteur: 350px
- Animation entrance
- Center label (total)
- Click to filter

---

### Section 5: Évolution Coûts

**Full width**: Bar Chart stacked
- Hauteur: 400px
- 2 datasets : Pièces + Main d'œuvre
- Total affiché en haut
- Hover effects
- Gradient backgrounds

---

### Section 6: Analyse Flotte

**Grid 2 colonnes**:

#### Colonne 1: Top 10 Véhicules
**Table interactive**:
```html
<table>
  <thead>
    <tr>
      <th>Rang</th>
      <th>Véhicule</th>
      <th>Interventions</th>
      <th>Coûts</th>
      <th>Impact</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>AB-123-CD</td>
      <td>15</td>
      <td>5,420€</td>
      <td>
        <div class="progress-bar">
          <div class="fill" style="width: 85%"></div>
        </div>
      </td>
    </tr>
  </tbody>
</table>
```

#### Colonne 2: Disponibilité Flotte
- Gauge chart circulaire
- Pourcentage central
- Couleurs seuils
- Légende statuts

---

### Section 7: Analyse Interventions

**Grid 3 colonnes**:

#### Card 1: Types d'interventions
- Pie chart
- Top 5 types
- Pourcentages

#### Card 2: Durée moyenne par type
- Horizontal bar chart
- Comparison labels
- Color coding

#### Card 3: Satisfaction client
- Gauge chart
- Note moyenne
- Distribution excellent/bon/moyen/mauvais

---

### Section 8: Comparaisons Périodes

**Layout**: Cards comparatives

```html
<div class="comparison-grid">
  <div class="comparison-card">
    <h4>Période actuelle</h4>
    <p class="period-label">01/09 - 30/09</p>
    <div class="comparison-metrics">
      <div>Interventions: <strong>42</strong></div>
      <div>Coûts: <strong>15,240€</strong></div>
      <div>Durée moy: <strong>3.1j</strong></div>
    </div>
  </div>

  <div class="comparison-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="comparison-card">
    <h4>Période précédente</h4>
    <p class="period-label">01/08 - 31/08</p>
    <div class="comparison-metrics">
      <div>Interventions: <strong>38</strong></div>
      <div>Coûts: <strong>13,580€</strong></div>
      <div>Durée moy: <strong>3.5j</strong></div>
    </div>
  </div>

  <div class="comparison-diff">
    <div class="diff-item up">
      <i class="fas fa-arrow-up"></i>
      +10.5% interventions
    </div>
    <div class="diff-item up">
      <i class="fas fa-arrow-up"></i>
      +12.2% coûts
    </div>
    <div class="diff-item down">
      <i class="fas fa-arrow-down"></i>
      -11.4% durée
    </div>
  </div>
</div>
```

---

## 🔌 API ENDPOINTS UTILISÉS

### Existants (via Reports)

```javascript
// Dashboard data
getReportDashboard(refresh)
→ Returns: counters, interventionsInProgress, alerts, availability, trends

// KPIs
getReportKPIs(startDate, endDate)
→ Returns: kpis object with metrics and trends

// Costs
getReportCostsByVehicle(vehicleId, startDate, endDate)
→ Returns: summary, monthlyEvolution, costsByType

// Maintenance
getReportMaintenanceSchedule(days)
→ Returns: upcoming, overdue, summary

// Failures
getReportFailuresAnalysis(startDate, endDate)
→ Returns: analysis by failure type
```

### Nouveaux à créer (optionnel)

```javascript
// Analytics spécifiques
async getAnalyticsOverview(startDate, endDate) {
  // Métriques agrégées pour Analytics
  // Peut réutiliser les endpoints existants
}

async getAnalyticsComparison(period1, period2) {
  // Comparaison de 2 périodes
}

async getAnalyticsTrends(metric, period) {
  // Tendances pour une métrique spécifique
}
```

**Note**: On peut composer avec les endpoints existants !

---

## 🎨 DESIGN SYSTEM

### Couleurs des KPIs

```scss
$kpi-colors: (
  blue: #3b82f6,
  green: #10b981,
  orange: #f59e0b,
  purple: #8b5cf6,
  yellow: #fbbf24,
  teal: #14b8a6,
  red: #ef4444
);
```

### Gradients pour graphiques

```scss
.chart-gradient-blue {
  background: linear-gradient(180deg, #3b82f6 0%, #1e40af 100%);
}

.chart-gradient-green {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
}
```

### Trends

```scss
.trend-up {
  color: #10b981;
  .arrow { transform: rotate(-45deg); }
}

.trend-down {
  color: #ef4444;
  .arrow { transform: rotate(45deg); }
}

.trend-neutral {
  color: #6b7280;
}
```

---

## 🧩 COMPOSANTS À CRÉER

### 1. PeriodSelector.vue

**Props**:
- `modelValue` : Période sélectionnée
- `presets` : Array de périodes prédéfinies

**Events**:
- `update:modelValue`
- `change`

**Template**:
```html
<div class="period-selector">
  <button
    v-for="preset in presets"
    :class="{ active: period === preset }"
    @click="select(preset)"
  >
    {{ getLabel(preset) }}
  </button>
  <button @click="showCustom">
    <i class="fas fa-calendar"></i>
    Personnalisé
  </button>
</div>
```

---

### 2. KPICard.vue

**Props**:
- `icon` : Classe icon FA
- `label` : Texte label
- `value` : Valeur principale
- `trend` : 'up' | 'down' | 'neutral'
- `change` : Texte changement
- `color` : Couleur du thème

**Template**:
```html
<div class="kpi-card" :class="color">
  <div class="kpi-icon">
    <i :class="icon"></i>
  </div>
  <div class="kpi-content">
    <p class="kpi-label">{{ label }}</p>
    <p class="kpi-value">{{ value }}</p>
    <div class="kpi-trend" :class="trend">
      <i :class="getTrendIcon()"></i>
      <span>{{ change }}</span>
    </div>
  </div>
</div>
```

---

### 3. LineChart.vue (Chart wrapper)

**Props**:
- `data` : Dataset
- `options` : Options Chart.js
- `height` : Hauteur

**Using**: vue-chartjs + Chart.js

```vue
<script setup>
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, ... } from 'chart.js'

ChartJS.register(...)

const props = defineProps(['data', 'options', 'height'])
</script>

<template>
  <Line :data="data" :options="options" :height="height" />
</template>
```

---

### 4. PieChart.vue

**Props**: Similaires à LineChart

**Features**:
- Doughnut style
- Center text
- Legend position

---

### 5. ComparisonCard.vue

**Props**:
- `current` : Données période actuelle
- `previous` : Données période précédente
- `metrics` : Array de métriques à comparer

**Template**:
```html
<div class="comparison-container">
  <div class="period-card current">
    <h4>{{ current.label }}</h4>
    <div class="metrics">
      <div v-for="metric in metrics">
        {{ metric.label }}: {{ current[metric.key] }}
      </div>
    </div>
  </div>

  <div class="comparison-arrow">→</div>

  <div class="period-card previous">
    <!-- Similar -->
  </div>

  <div class="differences">
    <div v-for="diff in calculateDiffs()">
      <i :class="diff.icon"></i>
      {{ diff.text }}
    </div>
  </div>
</div>
```

---

## 📦 DÉPENDANCES

### NPM Packages nécessaires

```json
{
  "dependencies": {
    "chart.js": "^4.4.0",
    "vue-chartjs": "^5.3.0"
  }
}
```

**Installation**:
```bash
npm install chart.js vue-chartjs
```

### Plugins Chart.js

```javascript
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
```

---

## 🔄 FLUX DE DONNÉES

### 1. Chargement initial

```javascript
onMounted(async () => {
  await loadAnalytics()
})

const loadAnalytics = async () => {
  loading.value = true
  
  try {
    // Charger en parallèle
    const [dashboard, kpis, costs] = await Promise.all([
      apiService.getReportDashboard(),
      apiService.getReportKPIs(period.start, period.end),
      apiService.getReportCostsByVehicle(null, period.start, period.end)
    ])
    
    // Transformer les données pour les graphiques
    processData(dashboard, kpis, costs)
    
  } catch (err) {
    error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}
```

### 2. Changement de période

```javascript
const changePeriod = async (newPeriod) => {
  period.value = newPeriod
  await loadAnalytics()
}
```

### 3. Export

```javascript
const exportPDF = async () => {
  // Option 1: Client-side (html2pdf)
  // Option 2: Server-side endpoint
  
  warning('Export en développement')
}
```

---

## 📊 CALCULS & MÉTRIQUES

### Métriques principales

#### 1. Nombre total d'interventions
```javascript
const totalInterventions = computed(() => {
  return dashboardData.value?.counters?.total || 0
})
```

#### 2. Coût total
```javascript
const totalCosts = computed(() => {
  return costsData.value?.summary?.totalCosts || 0
})
```

#### 3. Durée moyenne
```javascript
const averageDuration = computed(() => {
  if (!interventions.value.length) return 0
  
  const total = interventions.value.reduce((sum, i) => {
    const start = new Date(i.reportedDate)
    const end = new Date(i.completedDate || new Date())
    const days = (end - start) / (1000 * 60 * 60 * 24)
    return sum + days
  }, 0)
  
  return total / interventions.value.length
})
```

#### 4. Taux de satisfaction
```javascript
const satisfactionRate = computed(() => {
  const reports = receptionReportsData.value || []
  if (!reports.length) return 0
  
  const satisfactory = reports.filter(r => 
    r.customerSatisfaction === 'excellent' || 
    r.customerSatisfaction === 'good'
  ).length
  
  return (satisfactory / reports.length) * 100
})
```

#### 5. Disponibilité flotte
```javascript
const fleetAvailability = computed(() => {
  return dashboardData.value?.fleetAvailability || 0
})
```

#### 6. Taux d'utilisation
```javascript
const utilizationRate = computed(() => {
  const total = vehicles.value.length
  const inUse = vehicles.value.filter(v => 
    v.currentAssignment !== null
  ).length
  
  return total > 0 ? (inUse / total) * 100 : 0
})
```

---

### Comparaisons période

```javascript
const calculatePeriodComparison = (current, previous, metric) => {
  const diff = current - previous
  const percentChange = previous > 0 
    ? ((diff / previous) * 100).toFixed(1)
    : 0
  
  return {
    diff,
    percentChange,
    trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
    label: `${diff > 0 ? '+' : ''}${percentChange}%`
  }
}
```

---

## 🎯 DONNÉES GRAPHIQUES

### Timeline Chart Data

```javascript
const timelineChartData = computed(() => {
  const data = processTimelineData(dashboardData.value)
  
  return {
    labels: data.labels, // ['Jan', 'Fev', ...]
    datasets: [
      {
        label: 'Reportées',
        data: data.reported,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'En cours',
        data: data.inProgress,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Terminées',
        data: data.completed,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }
})
```

### Pie Chart Data

```javascript
const statusDistributionData = computed(() => {
  const counters = dashboardData.value?.counters || {}
  
  return {
    labels: [
      'Reportées',
      'Prédiagnostic',
      'Devis',
      'En cours',
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
        '#3b82f6', '#8b5cf6', '#f59e0b', 
        '#10b981', '#06b6d4', '#059669'
      ],
      borderWidth: 0
    }]
  }
})
```

### Bar Chart Data (Costs)

```javascript
const costsChartData = computed(() => {
  const monthly = costsData.value?.monthlyEvolution || []
  
  return {
    labels: monthly.map(m => m.month),
    datasets: [
      {
        label: 'Pièces',
        data: monthly.map(m => m.partsCost || 0),
        backgroundColor: '#3b82f6'
      },
      {
        label: 'Main d\'œuvre',
        data: monthly.map(m => m.laborCost || 0),
        backgroundColor: '#10b981'
      }
    ]
  }
})
```

---

## ⚙️ OPTIONS CHART.JS

### Options communes

```javascript
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
          family: 'Inter, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      cornerRadius: 8
    }
  },
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  }
}
```

### Options Line Chart

```javascript
const lineChartOptions = {
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
}
```

### Options Pie/Doughnut

```javascript
const pieChartOptions = {
  ...commonChartOptions,
  cutout: '65%', // Pour doughnut
  plugins: {
    ...commonChartOptions.plugins,
    legend: {
      position: 'right'
    }
  }
}
```

---

## 💾 GESTION D'ÉTAT

### State management

```javascript
// Données
const dashboardData = ref(null)
const kpisData = ref(null)
const costsData = ref(null)
const maintenanceData = ref(null)
const failuresData = ref(null)

// UI State
const loading = ref(false)
const selectedPeriod = ref('30d')
const customPeriod = ref({
  start: '',
  end: ''
})

// Computed periods
const period = computed(() => {
  if (selectedPeriod.value === 'custom') {
    return customPeriod.value
  }
  
  return calculatePeriodDates(selectedPeriod.value)
})
```

### Period calculator

```javascript
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
```

---

## 🎭 INTERACTIONS UTILISATEUR

### 1. Clic sur KPI Card
→ Affiche détails en modal ou scroll vers graphique

### 2. Hover sur graphique
→ Tooltip avec détails

### 3. Click sur légende graphique
→ Show/Hide dataset

### 4. Click sur période
→ Recharge toutes les données

### 5. Export
→ Télécharge PDF ou Excel

---

## 📱 RESPONSIVE DESIGN

### Desktop (> 1024px)
- Grid 3 colonnes pour KPIs
- Grid 2 colonnes pour graphiques
- Tables complètes

### Tablet (768px - 1024px)
- Grid 2 colonnes pour KPIs
- Graphiques full width
- Tables scrollables

### Mobile (< 768px)
- KPIs en colonne simple
- Graphiques stacked
- Tables très simplifiées
- Period selector en dropdown

---

## 🚀 FONCTIONNALITÉS AVANCÉES

### Phase 1 (MVP - 3-4h)
- ✅ KPI Cards (6)
- ✅ Timeline Chart
- ✅ Status Pie Chart
- ✅ Costs Bar Chart
- ✅ Period Selector
- ✅ Basic comparisons

### Phase 2 (Optionnel - +2h)
- Gauge charts
- Top 10 vehicles table
- Satisfaction chart
- Export PDF/Excel réel
- Heatmap calendrier

### Phase 3 (Future - +4h)
- Dashboards personnalisés
- Sauvegarde de layouts
- Widgets drag & drop
- Alerts configurables
- Real-time updates

---

## 📋 STRUCTURE FICHIER

```vue
<template>
  <DefaultLayout>
    <!-- Header -->
    <!-- Period Selector -->
    <!-- KPI Cards Grid -->
    <!-- Charts Grid -->
    <!-- Fleet Analysis -->
    <!-- Comparisons -->
  </DefaultLayout>
</template>

<script setup>
// Imports
import { ref, computed, onMounted, watch } from 'vue'
import { Line, Pie, Bar } from 'vue-chartjs'
// ...

// State
const loading = ref(false)
// ...

// Computed
const kpiCards = computed(() => [...])
const chartData = computed(() => [...])
// ...

// Methods
const loadAnalytics = async () => {}
const changePeriod = () => {}
const exportData = () => {}
// ...

// Lifecycle
onMounted(() => {})
watch(period, () => {})
</script>

<style scoped lang="scss">
// Layout
.analytics-header { ... }
.kpi-grid { ... }
.charts-grid { ... }

// Components
.kpi-card { ... }
.chart-container { ... }

// Responsive
@media (max-width: 768px) { ... }
</style>
```

**Estimation taille**: 800-1000 lignes

---

## 🎨 MOCKUP VISUEL

### KPI Card Design

```
┌────────────────────────────────┐
│ 🚗                             │
│ Véhicules Actifs               │
│                                │
│        45                      │
│                                │
│ ↗ +5.2% vs période préc.       │
└────────────────────────────────┘
```

### Chart Container

```
┌─────────────────────────────────────┐
│ Timeline des Interventions          │
├─────────────────────────────────────┤
│                                     │
│    [Line Chart with 3 lines]        │
│                                     │
│    📊 Interactive tooltip           │
│                                     │
└─────────────────────────────────────┘
```

---

## ⏱️ PLANNING D'IMPLÉMENTATION

### Étape 1: Structure de base (45 min)
- Créer Analytics.vue
- DefaultLayout
- Header & period selector
- State management

### Étape 2: KPI Cards (45 min)
- Créer KPICard.vue
- Grid layout
- 6 KPIs implémentés
- Animations

### Étape 3: Timeline Chart (30 min)
- Installer Chart.js
- Créer LineChart wrapper
- Intégrer données
- Styling

### Étape 4: Pie & Bar Charts (45 min)
- PieChart component
- BarChart component
- Status distribution
- Costs evolution

### Étape 5: Fleet Analysis (30 min)
- Top vehicles table
- Availability gauge
- Styling

### Étape 6: Comparisons (30 min)
- ComparisonCard component
- Period vs period
- Diff calculations

### Étape 7: Polish & Testing (30 min)
- Responsive
- Loading states
- Empty states
- Error handling

**Total**: ~4 heures

---

## ✅ CHECKLIST PRÉ-IMPLÉMENTATION

### Prérequis
- [ ] Installer Chart.js et vue-chartjs
- [ ] Vérifier endpoints API disponibles
- [ ] Créer branche git (optionnel)

### Composants à créer
- [ ] Analytics.vue (page principale)
- [ ] PeriodSelector.vue
- [ ] KPICard.vue
- [ ] LineChart.vue
- [ ] PieChart.vue
- [ ] BarChart.vue (optionnel, peut réutiliser vue-chartjs)
- [ ] ComparisonCard.vue (optionnel)

### Méthodes API
- [x] Déjà ajoutées dans api.service.js ✅

### Route
- [ ] Ajouter route `/analytics`

---

## 🎯 CRITÈRES DE SUCCÈS

### Fonctionnels
- ✅ Affiche 6 KPIs avec trends
- ✅ 3+ graphiques interactifs
- ✅ Period selector fonctionnel
- ✅ Comparaisons périodes
- ✅ Responsive (mobile/tablet/desktop)
- ✅ Loading states
- ✅ Error handling

### Techniques
- ✅ 0 erreur de linting
- ✅ Vue 3 Composition API
- ✅ TypeScript-ready
- ✅ Performance (< 2s loading)
- ✅ Accessible (ARIA labels)

### Design
- ✅ Cohérent avec l'app
- ✅ Couleurs harmonieuses
- ✅ Animations fluides
- ✅ UX intuitive

---

## 📚 RÉFÉRENCES

### Chart.js
- Docs: https://www.chartjs.org/docs/latest/
- Vue-chartjs: https://vue-chartjs.org/
- Exemples: https://www.chartjs.org/docs/latest/samples/

### Design inspiration
- Tailwind UI Stats
- Material Design Metrics
- AdminLTE Charts

### Color schemes
- Tailwind CSS colors
- Chart.js default palette
- Custom Impact Auto Plus theme

---

## 🔮 ÉVOLUTIONS FUTURES

### V2.0 (Future)
- Real-time updates (WebSocket)
- Prévisions ML
- Recommandations automatiques
- Benchmarking (comparaison garages)

### V3.0 (Future)
- Dashboards personnalisables
- Widget marketplace
- Exports programmés
- Alertes intelligentes

---

## 💡 BONNES PRATIQUES

### Performance
- Lazy load graphiques
- Debounce period changes
- Cache data localement
- Virtualiser longues listes

### UX
- Loading skeletons
- Empty states informatifs
- Error recovery
- Offline mode (cache)

### Code
- Composants réutilisables
- Helpers testables
- Comments en français
- Props typées

---

## 🎉 RÉSUMÉ EXÉCUTIF

### Objectif
Page Analytics moderne avec visualisations riches

### Features clés
- 6 KPI Cards avec trends
- 5+ graphiques interactifs (Chart.js)
- Period selector flexible
- Comparaisons périodes
- Analyse flotte détaillée
- Export données

### Technologies
- Vue 3 Composition API
- Chart.js + vue-chartjs
- SCSS modulaire
- API REST existante

### Estimation
- **MVP**: 3-4 heures
- **Complet**: 6-8 heures
- **Full featured**: 10-12 heures

### Difficulté
⭐⭐⭐ Moyenne (3/5)

### ROI
🔥 Élevé - Page essentielle pour la prise de décision

---

## ✅ VALIDATION

### Questions pour l'utilisateur

1. **Graphiques prioritaires** ?
   - Timeline ✅ 
   - Pie charts ✅
   - Bar charts ✅
   - Autres ?

2. **Fonctionnalités MVP** ?
   - 6 KPIs ✅
   - 3-5 graphiques ✅
   - Period selector ✅
   - Export PDF/Excel ?

3. **Timeline d'implémentation** ?
   - MVP maintenant (3-4h) ?
   - Full featured plus tard ?

4. **Librairie graphiques** ?
   - Chart.js (recommandé) ✅
   - ApexCharts (alternative)
   - Autre ?

---

## 📝 PROCHAINE ÉTAPE

Une fois validé, je procède à l'implémentation dans cet ordre:

1. Installer dépendances (Chart.js)
2. Créer composants de base (KPICard, PeriodSelector)
3. Créer Analytics.vue structure
4. Implémenter KPIs
5. Ajouter graphiques un par un
6. Polish & responsive
7. Tests & debugging

**Temps estimé total**: 3-4 heures pour MVP

---

**Document prêt pour validation et implémentation !** 🚀

---

*Conception créée le 12 octobre 2025*

