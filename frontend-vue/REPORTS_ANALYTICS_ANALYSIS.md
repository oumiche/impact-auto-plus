# 📊 Analyse Reports & Analytics - Ancien système

**Date**: 12 octobre 2025  
**Objectif**: Analyser l'existant avant migration Vue.js moderne

---

## 🎯 État actuel

### Backend (API Symfony)

#### ✅ ReportController.php - **COMPLET** (600+ lignes)

**Route de base**: `/api/reports`

**Endpoints disponibles** (19 endpoints):

#### 1. CRUD Rapports
```http
GET    /api/reports                    # Liste avec pagination
GET    /api/reports/{id}               # Afficher un rapport
POST   /api/reports                    # Créer un rapport
DELETE /api/reports/{id}               # Supprimer un rapport
```

#### 2. Types & Stats
```http
GET /api/reports/types                 # Types de rapports disponibles
GET /api/reports/stats                 # Statistiques des rapports
```

#### 3. Gestion du cache
```http
POST /api/reports/{id}/invalidate-cache              # Invalider cache d'un rapport
POST /api/reports/invalidate-cache/{type}            # Invalider cache par type
POST /api/reports/cleanup-cache                      # Nettoyer caches expirés
GET  /api/reports/cache/stats                        # Stats du cache
POST /api/reports/cache/optimize                     # Optimiser le cache
POST /api/reports/cleanup-old?days=30                # Supprimer vieux rapports
POST /api/reports/cache/warmup?types=dashboard,kpis  # Préchauffer le cache
```

#### 4. Rapports métiers
```http
GET /api/reports/dashboard                   # Tableau de bord interventions
GET /api/reports/kpis?startDate&endDate     # KPIs essentiels
GET /api/reports/costs/by-vehicle           # Coûts par véhicule
GET /api/reports/maintenance/schedule       # Échéancier maintenance
GET /api/reports/failures/analysis          # Analyse des pannes
```

---

## 📋 Services Backend

### ReportService
Génère les données des rapports :
- `generateDashboard()`
- `generateKPIs()`
- `generateCostsByVehicle()`
- `generateMaintenanceSchedule()`
- `generateFailureAnalysis()`

### ReportCacheService
Gestion intelligente du cache :
- Cache avec durée personnalisable
- Préchauffage du cache
- Nettoyage automatique
- Optimisation (suppression doublons)
- Statistiques du cache

---

## 🎨 Frontend existant

### reports.html
Fichier HTML basique qui charge:
- `reports-vue.js` (1275 lignes)
- CSS: `reports-common.css`

### reports-vue.js - Composant Vue 2
**Contenu** :
- Système d'onglets (Overview, Dashboard, KPIs, Costs, Maintenance, Failures)
- Vue d'ensemble avec cartes de rapports
- Dashboard avec :
  - Alertes
  - Statistiques (total interventions, en cours, terminées, en attente)
  - Graphique temporel
  - Top véhicules
  - Répartition par statut
- KPIs avec filtres de dates
- Coûts par véhicule avec filtres
- Maintenance préventive
- Analyse des pannes

**Fonctionnalités** :
- ✅ Chargement des données depuis API
- ✅ Rafraîchissement manuel
- ✅ Cache géré par le backend
- ✅ Export (placeholder)
- ✅ Graphiques (mentions Chart.js)
- ✅ Filtres de dates

---

## 📊 Types de rapports disponibles

D'après l'entity Report, voici les types:

```php
Report::getAvailableTypes() = [
    'dashboard' => 'Tableau de bord',
    'kpis' => 'Indicateurs clés',
    'costs_by_vehicle' => 'Coûts par véhicule',
    'maintenance_schedule' => 'Échéancier maintenance',
    'failure_analysis' => 'Analyse des pannes',
    // + autres types possibles
]
```

---

## 🔄 Analytics

### analytics.html
Fichier HTML **TRÈS BASIQUE** :
- Contenu statique
- Métriques hardcodées
- Pas de JS dynamique
- **À créer entièrement**

### Pas de controller backend spécifique
Les analytics utilisent probablement les endpoints du ReportController

---

## 🎯 Migration à effectuer

### 1. Reports.vue (Migration Vue 2 → Vue 3)

**Tâches** :
- ✅ Migrer de Vue 2 CDN vers Vue 3 Composition API
- ✅ Utiliser les composants modernes (DefaultLayout)
- ✅ Utiliser api.service.js pour les appels API
- ✅ Intégrer les graphiques (Chart.js ou autre)
- ✅ Design moderne cohérent avec le reste de l'app
- ✅ Responsive

**Structure à créer** :
```
Reports.vue
├── Onglets de navigation
├── Vue d'ensemble (cartes cliquables)
├── Dashboard
│   ├── Alertes
│   ├── Stats (4 cartes)
│   ├── Graphique temporel
│   ├── Top véhicules
│   └── Répartition statuts
├── KPIs
│   ├── Filtres dates
│   └── Cartes métriques
├── Coûts par véhicule
│   ├── Filtres
│   └── Tableau/graphique
├── Maintenance
│   └── Planning
└── Analyse pannes
    └── Tableaux/graphiques
```

**Composants à créer/réutiliser** :
- `StatCard.vue` : Carte de statistique
- `AlertCard.vue` : Carte d'alerte
- `DateRangeFilter.vue` : Filtres de dates
- Graphiques : Chart.js intégré

---

### 2. Analytics.vue (Création complète)

**Tâches** :
- 🆕 Créer entièrement le composant
- 🆕 Définir les métriques à afficher
- 🆕 Intégrer des graphiques avancés
- 🆕 Tableaux de bord interactifs
- 🆕 Utiliser les endpoints Reports existants

**Idées de contenu** :
- Métriques en temps réel
- Comparaisons période/période
- Prévisions
- Tendances
- Analyse de performance
- Ratios et indicateurs
- Heatmaps
- Graphiques avancés

---

## 📦 Dépendances frontend

### À installer
```bash
npm install chart.js vue-chartjs
# ou
npm install apexcharts vue3-apexcharts
```

### Déjà disponibles
- Vue 3 ✅
- Vue Router ✅
- api.service.js ✅
- DefaultLayout ✅
- Composants communs ✅

---

## 🔌 Méthodes API à ajouter dans api.service.js

```javascript
// Reports
getReports(params)
getReport(id)
createReport(data)
deleteReport(id)
getReportTypes()
getReportStats()

// Cache management
invalidateReportCache(id)
invalidateReportCacheByType(type)
cleanupReportCache()
optimizeReportCache()
warmupReportCache(types)
getReportCacheStats()
cleanupOldReports(days)

// Business reports
getReportDashboard(refresh = false)
getReportKPIs(startDate, endDate)
getReportCostsByVehicle(vehicleId, startDate, endDate)
getReportMaintenanceSchedule(days = 90)
getReportFailuresAnalysis(startDate, endDate)
```

---

## 📊 Données des rapports

### Dashboard
```json
{
  "alerts": [
    {
      "type": "maintenance_due",
      "severity": "warning",
      "count": 5,
      "message": "..."
    }
  ],
  "statistics": {
    "totalInterventions": 150,
    "inProgress": 25,
    "completed": 120,
    "pending": 5
  },
  "timeline": [
    { "date": "2025-01", "count": 45 }
  ],
  "topVehicles": [
    { "vehicle": {...}, "interventionCount": 15 }
  ],
  "statusDistribution": {
    "reported": 10,
    "in_progress": 25,
    "completed": 120
  }
}
```

### KPIs
```json
{
  "averageCost": 1250.50,
  "averageDuration": 3.2,
  "completionRate": 92.5,
  "satisfactionRate": 87.3,
  "utilizationRate": 78.5
}
```

---

## 🎨 Design proposé

### Layout
```
┌─────────────────────────────────────────┐
│ Header: Titre + Actions (Refresh, Export)│
├─────────────────────────────────────────┤
│ Tabs: Overview | Dashboard | KPIs | ... │
├─────────────────────────────────────────┤
│                                          │
│  Contenu du rapport sélectionné         │
│  - Cartes de stats                      │
│  - Graphiques                           │
│  - Tableaux                             │
│  - Filtres                              │
│                                          │
└─────────────────────────────────────────┘
```

### Cartes de statistiques
```
┌────────────────┬────────────────┐
│ 150            │ 3.2 jours      │
│ Interventions  │ Durée moyenne  │
│ +12%           │ -0.5 jours     │
└────────────────┴────────────────┘
```

---

## ⏱️ Estimation de temps

### Reports.vue
- Structure de base et onglets : 1h
- Dashboard complet : 2h
- KPIs : 1h
- Coûts par véhicule : 1h
- Maintenance : 30 min
- Analyse pannes : 1h
- **Total Reports** : **6-7 heures**

### Analytics.vue
- Design et structure : 1h
- Métriques et graphiques : 2h
- Interactions et filtres : 1h
- **Total Analytics** : **4 heures**

### API Service
- Ajout méthodes : 30 min

---

## ✅ Avantages du système existant

- ✅ Backend complet et fonctionnel
- ✅ Cache intelligent intégré
- ✅ Services métiers bien structurés
- ✅ Multi-tenant géré
- ✅ Données déjà structurées
- ✅ Logic métier testée

---

## 🎯 Prochaines étapes recommandées

### Phase 1: Reports (2-3 heures)
1. Créer Reports.vue avec structure de base
2. Ajouter méthodes API dans api.service.js
3. Implémenter Dashboard (alertes + stats)
4. Ajouter graphiques Chart.js
5. Implémenter KPIs avec filtres

### Phase 2: Reports Suite (2-3 heures)
6. Coûts par véhicule
7. Maintenance schedule
8. Analyse des pannes
9. Export PDF/Excel

### Phase 3: Analytics (3-4 heures)
10. Créer Analytics.vue from scratch
11. Métriques avancées
12. Graphiques interactifs
13. Dashboards personnalisés

---

## 🎉 Conclusion

**Backend** : ✅ 100% prêt avec 19 endpoints
**Frontend** : ⏳ À migrer/créer

Le backend est excellent et complet. La migration frontend sera principalement cosmétique (Vue 2 → Vue 3) avec amélioration du design pour s'aligner sur le reste de l'application.

**Difficulté** : Moyenne  
**Temps estimé** : 10-12 heures total

---

*Document créé le 12 octobre 2025*

