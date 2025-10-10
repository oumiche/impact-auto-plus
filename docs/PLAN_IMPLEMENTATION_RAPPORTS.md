# Plan d'Implémentation - Système de Rapports
## Impact Auto Plus

---

## 📋 Vue d'Ensemble

**Durée totale estimée** : 8-10 semaines  
**Approche** : Agile - Livraisons itératives  
**Équipe recommandée** : 1-2 développeurs  

---

## 🎯 Phase 1 - MVP (Semaines 1-3)

### **Objectif**
Délivrer les rapports essentiels pour un usage immédiat opérationnel.

### **Livrables**
4 rapports fonctionnels + Infrastructure de base

---

### Semaine 1 : Infrastructure & Tableau de Bord

#### **Jour 1-2 : Setup Infrastructure**
- [ ] Créer l'entité `Report` dans la base de données
  ```sql
  - id, type, name, description
  - parameters (JSON)
  - generated_at, generated_by
  - cache_duration
  - is_public
  ```
- [ ] Créer le contrôleur `ReportController`
- [ ] Créer le service `ReportService` (logique métier)
- [ ] Créer le service `ReportCacheService` (cache des calculs)
- [ ] Créer la page principale `/reports.html`
- [ ] Créer le CSS commun `reports-common.css`

**Estimation** : 2 jours  
**Complexité** : Moyenne

---

#### **Jour 3-5 : Tableau de Bord Interventions**

**Backend** :
- [ ] Route : `GET /api/reports/dashboard`
- [ ] Méthode : `getDashboardData()`
  - Compteurs par statut
  - Liste interventions en cours
  - Alertes (urgentes, en retard)
  - Taux de disponibilité

**Frontend** :
- [ ] Composant Vue : `DashboardReport.vue`
- [ ] Cartes KPIs avec compteurs animés
- [ ] Liste interventions avec filtrage rapide
- [ ] Section alertes avec icônes et couleurs
- [ ] Graphique simple (interventions par statut)

**Tests** :
- [ ] Test avec 0 intervention
- [ ] Test avec >100 interventions
- [ ] Test alertes urgentes
- [ ] Test responsive

**Estimation** : 3 jours  
**Complexité** : Moyenne-Haute

---

### Semaine 2 : Rapports Coûts & Maintenance

#### **Jour 1-3 : Rapport Coûts par Véhicule**

**Backend** :
- [ ] Route : `GET /api/reports/costs/by-vehicle`
- [ ] Paramètres : `vehicleId, startDate, endDate`
- [ ] Calculer :
  - Total coûts (main d'œuvre + pièces)
  - Coût moyen par intervention
  - Évolution mensuelle
  - Répartition par type

**Frontend** :
- [ ] Composant : `VehicleCostsReport.vue`
- [ ] Sélecteur de véhicule (autocomplete)
- [ ] Sélecteur de période
- [ ] Tableau récapitulatif
- [ ] Graphique en ligne (évolution)
- [ ] Graphique camembert (répartition)
- [ ] Export PDF/Excel

**Estimation** : 3 jours  
**Complexité** : Haute

---

#### **Jour 4-5 : Échéancier Maintenance Préventive**

**Backend** :
- [ ] Route : `GET /api/reports/maintenance/schedule`
- [ ] Calculer prochaines maintenances :
  - Basées sur kilométrage
  - Basées sur date dernière intervention
  - Selon plan constructeur
- [ ] Identifier retards
- [ ] Priorités (urgent, à venir, normal)

**Frontend** :
- [ ] Composant : `MaintenanceScheduleReport.vue`
- [ ] Timeline/calendrier des maintenances
- [ ] Filtres : 30/60/90 jours
- [ ] Badges de priorité
- [ ] Actions rapides (créer intervention)

**Estimation** : 2 jours  
**Complexité** : Moyenne

---

### Semaine 3 : KPIs & Finalisation Phase 1

#### **Jour 1-2 : KPIs Essentiels**

**Backend** :
- [ ] Route : `GET /api/reports/kpis`
- [ ] Calculer KPIs :
  ```php
  - disponibilité_parc = (vehicules_disponibles / total_vehicules) * 100
  - cout_moyen_km = total_couts / total_km_parcourus
  - interventions_en_cours = count(interventions WHERE status != closed)
  - delai_moyen_reparation = avg(completed_date - started_date)
  - satisfaction_moyenne = avg(reception_reports.satisfaction_score)
  ```
- [ ] Comparer avec période précédente (N vs N-1)
- [ ] Indicateurs de tendance (↗ ↘ →)

**Frontend** :
- [ ] Composant : `KPIsReport.vue`
- [ ] Cartes KPIs avec jauges/gauges
- [ ] Indicateurs de tendance visuels
- [ ] Graphiques d'évolution
- [ ] Comparaisons période

**Estimation** : 2 jours  
**Complexité** : Moyenne

---

#### **Jour 3-5 : Tests, Documentation & Déploiement**

- [ ] **Tests d'intégration** : tous les rapports
- [ ] **Tests de performance** : avec données volumineuses
- [ ] **Documentation utilisateur** : guides d'utilisation
- [ ] **Documentation technique** : API, calculs
- [ ] **Formation équipe** : démo et formation
- [ ] **Déploiement production** : Phase 1

**Estimation** : 3 jours

---

## 🚀 Phase 2 - Extension (Semaines 4-7)

### **Objectif**
Ajouter les rapports d'analyse et d'optimisation.

---

### Semaine 4 : Analyses Coûts Avancées

#### **Jour 1-3 : Analyse Détaillée des Coûts**

**Backend** :
- [ ] Route : `GET /api/reports/costs/detailed`
- [ ] Paramètres : `startDate, endDate, groupBy, filters`
- [ ] Analyses :
  - Par type d'intervention (préventif/correctif)
  - Par catégorie véhicule
  - Par garage/fournisseur
  - Tendances et projections
- [ ] Calculs statistiques :
  - Moyenne, médiane, écart-type
  - Min, max, quartiles

**Frontend** :
- [ ] Composant : `DetailedCostsReport.vue`
- [ ] Filtres multiples (dates, types, catégories)
- [ ] Tableaux dynamiques
- [ ] Graphiques multi-séries
- [ ] Comparaisons période sur période
- [ ] Drill-down (clic pour détails)

**Estimation** : 3 jours  
**Complexité** : Haute

---

#### **Jour 4-5 : Rapport Performance Réparations**

**Backend** :
- [ ] Route : `GET /api/reports/performance/repairs`
- [ ] Métriques :
  - Temps moyen par étape workflow
  - Temps total par type intervention
  - Taux de réouverture
  - Respect des délais (%)
  - Satisfaction moyenne

**Frontend** :
- [ ] Composant : `RepairPerformanceReport.vue`
- [ ] Graphiques en barres (temps par étape)
- [ ] Indicateurs de performance (KPIs)
- [ ] Tableaux des meilleures/pires performances
- [ ] Filtres par période, type, garage

**Estimation** : 2 jours  
**Complexité** : Moyenne-Haute

---

### Semaine 5 : Analyses Techniques

#### **Jour 1-3 : Analyse des Pannes**

**Backend** :
- [ ] Route : `GET /api/reports/failures/analysis`
- [ ] Données à agréger :
  - Pannes récurrentes (GROUP BY type, COUNT)
  - MTBF = total_km / nombre_pannes
  - Pièces changées (fréquence)
  - Taux par marque/modèle
- [ ] Identifier patterns et anomalies

**Frontend** :
- [ ] Composant : `FailureAnalysisReport.vue`
- [ ] Top 10 pannes (bar chart)
- [ ] Matrice marque/type panne (heatmap)
- [ ] Liste pièces fréquemment changées
- [ ] Recommandations automatiques

**Estimation** : 3 jours  
**Complexité** : Haute

---

#### **Jour 4-5 : Rapports par Conducteur**

**Backend** :
- [ ] Route : `GET /api/reports/drivers/performance`
- [ ] Calculs par conducteur :
  - Nombre interventions
  - Km parcourus
  - Taux incident = interventions / km
  - Coûts totaux
  - Score (pondéré)

**Frontend** :
- [ ] Composant : `DriverPerformanceReport.vue`
- [ ] Tableau classement conducteurs
- [ ] Détails par conducteur
- [ ] Graphiques comparatifs
- [ ] Alertes conducteurs à risque

**Estimation** : 2 jours  
**Complexité** : Moyenne

---

### Semaine 6 : Analyses Budgétaires

#### **Jour 1-3 : Analyse Budgétaire**

**Backend** :
- [ ] Créer entité `Budget` (si n'existe pas)
  - budget_annuel, budget_mensuel
  - par catégorie
- [ ] Route : `GET /api/reports/budget/analysis`
- [ ] Calculs :
  - Budget vs Réalisé
  - Écarts et variations
  - Prévisions (régression linéaire simple)
  - Saisonnalité

**Frontend** :
- [ ] Composant : `BudgetAnalysisReport.vue`
- [ ] Graphique Budget vs Réalisé
- [ ] Jauge de consommation budget
- [ ] Prévisions avec courbe
- [ ] Alertes dépassement

**Estimation** : 3 jours  
**Complexité** : Haute

---

#### **Jour 4-5 : Rapport Devis vs Factures**

**Backend** :
- [ ] Route : `GET /api/reports/quotes-vs-invoices`
- [ ] Comparer devis acceptés vs factures
- [ ] Calculer écarts (% et montant)
- [ ] Identifier dépassements fréquents

**Frontend** :
- [ ] Composant : `QuotesVsInvoicesReport.vue`
- [ ] Tableau comparatif
- [ ] Taux de dépassement moyen
- [ ] Top dépassements
- [ ] Alertes dépassements significatifs

**Estimation** : 2 jours  
**Complexité** : Moyenne

---

### Semaine 7 : Finalisation Phase 2

#### **Jour 1-2 : Fiche de Vie Véhicule**

**Backend** :
- [ ] Route : `GET /api/reports/vehicle/{id}/lifecycle`
- [ ] Agréger toutes données véhicule :
  - Historique interventions
  - TCO cumulé
  - Kilométrage et projections
  - Taux immobilisation

**Frontend** :
- [ ] Composant : `VehicleLifecycleReport.vue`
- [ ] Timeline des événements
- [ ] Graphiques TCO
- [ ] Recommandation réforme (algorithme)
- [ ] Export PDF complet

**Estimation** : 2 jours  
**Complexité** : Haute

---

#### **Jour 3-5 : Tests & Optimisation Phase 2**

- [ ] Tests de performance avec gros volumes
- [ ] Optimisation requêtes SQL (indexes)
- [ ] Mise en cache des rapports lourds
- [ ] Documentation complète
- [ ] Formation utilisateurs
- [ ] Déploiement Phase 2

**Estimation** : 3 jours

---

## 🎓 Phase 3 - Avancé (Semaines 8-10)

### **Objectif**
Fonctionnalités avancées et personnalisation.

---

### Semaine 8 : Performance Fournisseurs & Exports

#### **Jour 1-3 : Performance Fournisseurs/Garages**

**Backend** :
- [ ] Créer entité `Garage` (si n'existe pas)
- [ ] Route : `GET /api/reports/suppliers/performance`
- [ ] Évaluation multi-critères :
  - Délais moyens
  - Qualité (taux reprise)
  - Respect devis
  - Tarifs comparés
  - Note globale

**Frontend** :
- [ ] Composant : `SupplierPerformanceReport.vue`
- [ ] Tableau de classement
- [ ] Radar charts (critères multiples)
- [ ] Historique par fournisseur
- [ ] Recommandations

**Estimation** : 3 jours  
**Complexité** : Haute

---

#### **Jour 4-5 : Système d'Export**

**Backend** :
- [ ] Service `ReportExportService`
- [ ] Export PDF (librairie DomPDF ou TCPDF)
- [ ] Export Excel (PhpSpreadsheet)
- [ ] Export CSV
- [ ] Routes : `GET /api/reports/{type}/export?format=pdf|excel|csv`

**Frontend** :
- [ ] Boutons export sur tous rapports
- [ ] Options export (colonnes, format)
- [ ] Téléchargement automatique
- [ ] Prévisualisation PDF

**Estimation** : 2 jours  
**Complexité** : Moyenne

---

### Semaine 9 : Personnalisation & Automatisation

#### **Jour 1-3 : Rapports Personnalisables**

**Backend** :
- [ ] Entité `ReportTemplate` :
  - Nom, type de rapport
  - Filtres sauvegardés
  - Colonnes sélectionnées
  - Paramètres par défaut
- [ ] Routes CRUD templates
- [ ] Association user → templates

**Frontend** :
- [ ] Interface configuration rapport
- [ ] Sauvegarde de templates
- [ ] Gestion favoris
- [ ] Partage entre utilisateurs

**Estimation** : 3 jours  
**Complexité** : Moyenne

---

#### **Jour 4-5 : Génération Automatique**

**Backend** :
- [ ] Service `ReportScheduler` (Symfony Messenger)
- [ ] Entité `ScheduledReport` :
  - Fréquence (daily, weekly, monthly)
  - Template associé
  - Destinataires (emails)
  - Dernière exécution
- [ ] Command : `app:reports:generate`
- [ ] Envoi email avec PDF attaché

**Frontend** :
- [ ] Interface planification rapports
- [ ] Sélection fréquence
- [ ] Sélection destinataires
- [ ] Historique envois

**Estimation** : 2 jours  
**Complexité** : Haute

---

### Semaine 10 : Visualisations Avancées & Tests

#### **Jour 1-3 : Bibliothèque de Graphiques**

**Frontend** :
- [ ] Intégrer Chart.js ou ApexCharts
- [ ] Créer composants réutilisables :
  - `LineChart.vue`
  - `BarChart.vue`
  - `PieChart.vue`
  - `StackedBarChart.vue`
  - `HeatmapChart.vue`
  - `GaugeChart.vue`
- [ ] Options interactives (zoom, tooltips)
- [ ] Export graphiques en image

**Estimation** : 3 jours  
**Complexité** : Moyenne

---

#### **Jour 4-5 : Tests Finaux & Documentation**

- [ ] Tests end-to-end complets
- [ ] Tests de charge
- [ ] Audit de performance
- [ ] Documentation complète API
- [ ] Guide utilisateur avec captures
- [ ] Vidéos de formation
- [ ] Déploiement Phase 3

**Estimation** : 2 jours

---

## 📊 Détails par Rapport

### 1. Dashboard Interventions

**Données requises** :
```php
// Compteurs
$byStatus = $interventionRepo->countByStatus($tenant);

// Délais moyens
$avgDelays = [
    'prediagnostic' => AVG(started_date - reported_date),
    'quote' => AVG(quote_received_date - in_quote_date),
    'repair' => AVG(completed_date - started_date)
];

// Disponibilité
$disponibilite = (
    count(vehicles WHERE status = 'active') / 
    count(all vehicles)
) * 100;

// Alertes
$urgent = interventions WHERE priority = 'urgent' AND status != 'completed';
$retard = interventions WHERE estimated_completion < NOW() AND status != 'completed';
```

**Interface** :
```
┌─────────────────────────────────────────┐
│  📊 DASHBOARD INTERVENTIONS             │
├─────────────────────────────────────────┤
│  [5 Signalé] [3 Diagnostic] [8 Répar.] │
│                                         │
│  Délais Moyens:                         │
│  ████████░░ Prédiag: 2j                 │
│  ███████████████░░ Devis: 3j            │
│  ████████████████████░░ Répar: 5j       │
│                                         │
│  ⚠️ 2 interventions en retard            │
│  🔴 1 intervention urgente               │
│                                         │
│  Disponibilité: ████████░░ 87%          │
└─────────────────────────────────────────┘
```

---

### 2. Coûts par Véhicule

**Requête SQL optimisée** :
```sql
SELECT 
    v.id,
    v.plate_number,
    COUNT(i.id) as nb_interventions,
    SUM(inv.total_amount) as total_cost,
    AVG(inv.total_amount) as avg_cost,
    SUM(CASE WHEN i.intervention_type.is_preventive THEN inv.total_amount ELSE 0 END) as preventive_cost,
    SUM(CASE WHEN NOT i.intervention_type.is_preventive THEN inv.total_amount ELSE 0 END) as corrective_cost
FROM vehicles v
LEFT JOIN vehicle_interventions i ON v.id = i.vehicle_id
LEFT JOIN intervention_invoices inv ON i.id = inv.intervention_id
WHERE v.tenant_id = :tenant_id
  AND inv.created_at BETWEEN :start_date AND :end_date
GROUP BY v.id
ORDER BY total_cost DESC
```

**Optimisations** :
- Index sur `(vehicle_id, created_at)`
- Cache résultats (1 heure)
- Pagination si >100 véhicules

---

### 3. Échéancier Maintenance

**Algorithme de calcul** :
```php
foreach ($vehicles as $vehicle) {
    $lastMaintenance = getLastMaintenance($vehicle);
    $currentKm = $vehicle->getMileage();
    
    // Maintenance kilométrique
    $nextKmMaintenance = ceil($currentKm / 10000) * 10000;
    $kmUntilNext = $nextKmMaintenance - $currentKm;
    
    // Maintenance temporelle (6 mois)
    $nextDateMaintenance = $lastMaintenance->addMonths(6);
    $daysUntilNext = $nextDateMaintenance->diffInDays(now());
    
    // Priorité
    if ($kmUntilNext < 500 || $daysUntilNext < 7) {
        $priority = 'urgent';
    } elseif ($kmUntilNext < 1000 || $daysUntilNext < 30) {
        $priority = 'soon';
    } else {
        $priority = 'normal';
    }
}
```

---

### 4. KPIs Dashboard

**Calculs temps réel** :
```php
class KPIService {
    public function getKPIs($tenant, $period = 'month') {
        return [
            'disponibilite' => $this->calculateAvailability($tenant),
            'cout_km' => $this->calculateCostPerKm($tenant, $period),
            'interventions_actives' => $this->countActiveInterventions($tenant),
            'delai_moyen' => $this->calculateAverageDelay($tenant, $period),
            'satisfaction' => $this->calculateSatisfaction($tenant, $period),
            'budget_utilise' => $this->calculateBudgetUsage($tenant, $period)
        ];
    }
    
    private function calculateAvailability($tenant) {
        $total = Vehicle::where('tenant_id', $tenant->id)->count();
        $inMaintenance = VehicleIntervention::where('tenant_id', $tenant->id)
            ->whereIn('current_status', ['in_repair', 'in_prediagnostic'])
            ->distinct('vehicle_id')
            ->count();
        
        return round((($total - $inMaintenance) / $total) * 100, 2);
    }
}
```

---

## 🗄️ Structure Base de Données

### **Nouvelles Tables Nécessaires**

```sql
-- Table des rapports générés
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parameters JSON,
    generated_at DATETIME NOT NULL,
    generated_by INT,
    cache_duration INT DEFAULT 3600,
    is_public BOOLEAN DEFAULT FALSE,
    file_path VARCHAR(500),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (generated_by) REFERENCES users(id),
    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_generated_at (generated_at)
);

-- Templates de rapports
CREATE TABLE report_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    user_id INT,
    name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    default_parameters JSON,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Planification rapports automatiques
CREATE TABLE scheduled_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    template_id INT NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    day_of_week INT, -- pour weekly
    day_of_month INT, -- pour monthly
    time TIME NOT NULL,
    recipients JSON, -- emails
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at DATETIME,
    next_run_at DATETIME,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (template_id) REFERENCES report_templates(id)
);

-- Budgets (si n'existe pas)
CREATE TABLE budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    category VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    UNIQUE KEY unique_budget (tenant_id, year, month, category)
);

-- Garages/Fournisseurs (si n'existe pas)
CREATE TABLE garages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    rating DECIMAL(3,2), -- Note /5
    is_preferred BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

### **Modifications Tables Existantes**

```sql
-- Ajouter si manquant
ALTER TABLE vehicle_interventions 
    ADD COLUMN garage_id INT,
    ADD COLUMN is_preventive BOOLEAN DEFAULT FALSE,
    ADD FOREIGN KEY (garage_id) REFERENCES garages(id);

ALTER TABLE intervention_invoices
    ADD COLUMN labor_cost DECIMAL(10,2),
    ADD COLUMN parts_cost DECIMAL(10,2);

ALTER TABLE intervention_types
    ADD COLUMN is_preventive BOOLEAN DEFAULT FALSE,
    ADD COLUMN category VARCHAR(50);
```

---

## 🔧 Architecture Technique

### **Structure Backend**

```
api/src/
├── Controller/
│   └── ReportController.php
├── Entity/
│   ├── Report.php
│   ├── ReportTemplate.php
│   ├── ScheduledReport.php
│   ├── Budget.php
│   └── Garage.php
├── Service/
│   ├── Report/
│   │   ├── ReportService.php
│   │   ├── ReportCacheService.php
│   │   ├── ReportExportService.php
│   │   ├── ReportSchedulerService.php
│   │   ├── KPICalculator.php
│   │   └── Reports/
│   │       ├── DashboardReport.php
│   │       ├── CostsReport.php
│   │       ├── MaintenanceScheduleReport.php
│   │       ├── KPIsReport.php
│   │       └── ...
├── Repository/
│   ├── ReportRepository.php
│   └── ...
```

### **Structure Frontend**

```
dist/
├── reports.html (page principale)
├── js/
│   ├── reports-main-vue.js
│   └── components/
│       ├── reports/
│       │   ├── DashboardReport.vue
│       │   ├── VehicleCostsReport.vue
│       │   ├── MaintenanceScheduleReport.vue
│       │   ├── KPIsReport.vue
│       │   └── ...
│       └── charts/
│           ├── LineChart.vue
│           ├── BarChart.vue
│           ├── PieChart.vue
│           └── GaugeChart.vue
├── css/
│   ├── reports-common.css
│   ├── reports-dashboard.css
│   └── charts.css
```

---

## 📦 Dépendances & Librairies

### **Backend (PHP)**

```json
{
    "require": {
        "phpoffice/phpspreadsheet": "^1.29",
        "dompdf/dompdf": "^2.0",
        "symfony/messenger": "^6.0"
    }
}
```

### **Frontend (JavaScript)**

```json
{
    "dependencies": {
        "chart.js": "^4.4.0",
        "apexcharts": "^3.44.0",
        "date-fns": "^2.30.0",
        "xlsx": "^0.18.5"
    }
}
```

---

## ⚡ Optimisations Performance

### **Stratégies de Cache**

```php
// Cache des rapports lourds
class ReportCacheService {
    public function getCachedOrGenerate($reportType, $params, $ttl = 3600) {
        $cacheKey = "report:{$reportType}:" . md5(json_encode($params));
        
        if ($cached = $this->cache->get($cacheKey)) {
            return $cached;
        }
        
        $data = $this->generateReport($reportType, $params);
        $this->cache->set($cacheKey, $data, $ttl);
        
        return $data;
    }
}
```

### **Indexes Recommandés**

```sql
-- Pour les rapports de coûts
CREATE INDEX idx_invoices_vehicle_date ON intervention_invoices(intervention_id, created_at);
CREATE INDEX idx_interventions_dates ON vehicle_interventions(reported_date, completed_date);

-- Pour les rapports par statut
CREATE INDEX idx_interventions_status ON vehicle_interventions(current_status, tenant_id);

-- Pour les rapports maintenance
CREATE INDEX idx_maintenances_vehicle_date ON vehicle_maintenances(vehicle_id, maintenance_date);
```

### **Requêtes Optimisées**

- Utiliser `SELECT` spécifiques (pas `SELECT *`)
- Eager loading avec `JOIN` pour éviter N+1
- Pagination systématique
- LIMIT sur les top N
- Agrégation côté base (COUNT, SUM, AVG)

---

## 🎨 Standards UI/UX

### **Charte Graphique Rapports**

**Couleurs** :
- Primaire : #667eea (violet)
- Succès : #28a745 (vert)
- Warning : #ffc107 (jaune)
- Danger : #dc3545 (rouge)
- Info : #17a2b8 (bleu clair)

**Typographie** :
- Titres : 28px, bold
- Sous-titres : 18px, semi-bold
- Corps : 14px, regular
- Petits textes : 12px

**Espacements** :
- Sections : 30px margin
- Cards : 20px padding
- Éléments : 15px gap

**Composants réutilisables** :
- `.report-card` : carte de rapport
- `.stat-card` : carte statistique
- `.kpi-widget` : widget KPI
- `.chart-container` : conteneur graphique
- `.export-button` : bouton export

---

## 🔐 Sécurité & Permissions

### **Niveaux d'Accès**

```php
// Permissions par rôle
'ROLE_ADMIN' => [
    'reports.view_all',
    'reports.export',
    'reports.create_template',
    'reports.schedule'
],
'ROLE_MANAGER' => [
    'reports.view_own_tenant',
    'reports.export',
    'reports.create_template'
],
'ROLE_USER' => [
    'reports.view_basic'
]
```

### **Filtrage des Données**

- Toujours filtrer par `tenant_id`
- Logs des accès aux rapports
- Anonymisation données sensibles (si export externe)
- Validation des paramètres d'entrée

---

## 📱 Support Mobile

### **Rapports Mobile-Friendly**

**Priorités** :
1. Dashboard simplifié
2. KPIs essentiels
3. Alertes
4. Liste interventions en cours
5. Échéancier maintenance (vue semaine)

**Adaptations** :
- Graphiques responsifs
- Tableaux scrollables horizontalement
- Actions tactiles (swipe, tap)
- Chargement progressif
- Mode hors-ligne (cache local)

---

## 📧 Système d'Alertes

### **Types d'Alertes Automatiques**

**Quotidiennes (8h)** :
- Nouvelles interventions urgentes
- Interventions dépassant délai
- Véhicules immobilisés >7 jours

**Hebdomadaires (Lundi 9h)** :
- Synthèse de la semaine
- Maintenances à planifier
- Budget consommé

**Mensuelles (1er du mois 9h)** :
- Rapport financier complet
- KPIs du mois
- Comparaison vs objectifs

**Événementielles** :
- Contrôle technique dans 30 jours
- Assurance expirante dans 15 jours
- Permis expirant dans 30 jours
- Budget mensuel atteint à 80%
- Seuil d'alerte coût véhicule

---

## 🧪 Plan de Tests

### **Phase 1 - Tests Unitaires**

```php
// ReportServiceTest.php
testDashboardDataStructure()
testCostsCalculationAccuracy()
testMaintenanceScheduleGeneration()
testKPIsCalculation()
testCacheExpiration()
```

### **Phase 2 - Tests d'Intégration**

- [ ] Test avec 0 véhicule
- [ ] Test avec 1 véhicule
- [ ] Test avec 100 véhicules
- [ ] Test avec 1000 interventions
- [ ] Test export PDF/Excel
- [ ] Test envoi email automatique

### **Phase 3 - Tests de Performance**

**Critères de performance** :
- Dashboard : < 2 secondes
- Rapport simple : < 3 secondes
- Rapport complexe : < 5 secondes
- Export PDF : < 10 secondes
- Export Excel : < 15 secondes

**Outils** :
- Symfony Profiler
- Blackfire.io
- Apache JMeter (tests charge)

---

## 📚 Documentation Livrables

### **Documentation Technique**

1. **API Reference** : Tous endpoints avec exemples
2. **Architecture** : Diagrammes et explications
3. **Guide développeur** : Comment ajouter un nouveau rapport
4. **Calculs** : Formules et algorithmes détaillés

### **Documentation Utilisateur**

1. **Guide de démarrage** : Premiers pas
2. **Manuel complet** : Tous les rapports expliqués
3. **FAQ** : Questions fréquentes
4. **Tutoriels vidéo** : Principaux rapports

### **Formation**

- Session 1h : Présentation générale
- Session 2h : Utilisation pratique
- Session 1h : Fonctionnalités avancées
- Support post-formation : 2 semaines

---

## 💰 Budget & Ressources

### **Estimation Temps**

| Phase | Durée | Jours/Homme |
|-------|-------|-------------|
| Phase 1 - MVP | 3 semaines | 15 jours |
| Phase 2 - Extension | 4 semaines | 20 jours |
| Phase 3 - Avancé | 3 semaines | 15 jours |
| **TOTAL** | **10 semaines** | **50 jours** |

### **Ressources Humaines**

**Option 1 : 1 développeur senior**
- Durée : 10 semaines calendaires
- Avantage : Cohérence technique
- Inconvénient : Durée longue

**Option 2 : 2 développeurs (1 backend + 1 frontend)**
- Durée : 5-6 semaines calendaires
- Avantage : Parallélisation, rapidité
- Inconvénient : Coordination nécessaire

**Recommandation** : Option 2 pour Phase 1, puis 1 dev pour Phases 2-3

---

## 📈 Indicateurs de Succès

### **Critères de Réussite - Phase 1**

✅ 4 rapports fonctionnels et utilisés quotidiennement  
✅ Temps de chargement < 3 secondes  
✅ 0 bug bloquant  
✅ Feedback utilisateurs positif (>4/5)  
✅ Données cohérentes avec la réalité  

### **Critères de Réussite - Phase 2**

✅ 8 rapports supplémentaires fonctionnels  
✅ Export PDF/Excel opérationnel  
✅ Adoption par 80%+ des utilisateurs  
✅ Économies mesurables (>5% coûts)  

### **Critères de Réussite - Phase 3**

✅ Rapports automatisés envoyés  
✅ Templates personnalisés utilisés  
✅ Performance maintenue avec volume croissant  
✅ ROI positif démontré  

---

## 🔄 Maintenance Continue

### **Support Post-Déploiement**

**Mois 1-3** :
- Bug fixes prioritaires
- Optimisations performance
- Ajustements UX selon feedback
- Formation complémentaire

**Mois 4-6** :
- Nouveaux rapports selon besoins
- Améliorations fonctionnelles
- Intégrations externes

**Annuel** :
- Revue des KPIs et seuils
- Mise à jour calculs
- Nouvelles visualisations
- Audit performance

---

## 🎯 Quick Wins (Gains Rapides)

### **Actions Immédiates (1-2 jours)**

1. **Liste interventions en retard** : Requête simple, impact immédiat
2. **Top 5 véhicules coûteux** : Requête d'agrégation basique
3. **Alertes CT/Assurances expirantes** : Calcul de dates
4. **Disponibilité temps réel** : Compteur simple

### **Gains Attendus**

- Visibilité immédiate sur retards
- Identification véhicules problématiques
- Prévention non-conformité
- Prise de décision rapide

---

## 📞 Support & Assistance

### **Pendant l'Implémentation**

- **Réunions hebdomadaires** : Point d'avancement
- **Démos** : Fin de chaque phase
- **Feedback continu** : Ajustements en cours de route
- **Canal Slack/Teams** : Questions/réponses rapides

### **Post-Déploiement**

- **Hotline** : Support bugs critiques
- **Documentation** : Toujours à jour
- **Formations** : Nouveaux utilisateurs
- **Évolutions** : Planification trimestrielle

---

## ✅ Checklist de Démarrage

### **Avant de Commencer**

- [ ] Valider le périmètre fonctionnel
- [ ] Confirmer les priorités de Phase 1
- [ ] Préparer les données de test
- [ ] Configurer environnement dev/test
- [ ] Désigner référent métier
- [ ] Planifier les revues d'avancement

### **Première Semaine**

- [ ] Kickoff meeting avec l'équipe
- [ ] Setup infrastructure base
- [ ] Créer les migrations DB
- [ ] Initialiser les repositories Git
- [ ] Configurer CI/CD pour rapports
- [ ] Commencer Dashboard (priorité 1)

---

## 🎓 Formation Requise

### **Équipe Développement**

- Doctrine ORM (agrégations)
- Chart.js / ApexCharts
- Export PDF/Excel en PHP
- Symfony Messenger (planification)
- Optimisation SQL

### **Équipe Métier**

- Lecture et interprétation des rapports
- Utilisation des filtres
- Création de templates
- Export et partage
- Planification des rapports automatiques

---

## 📊 ROI Détaillé

### **Investissement**

**Développement** :
- Phase 1 : 15 jours × 500€/jour = 7 500€
- Phase 2 : 20 jours × 500€/jour = 10 000€
- Phase 3 : 15 jours × 500€/jour = 7 500€
- **Total** : 25 000€

**Formation & Documentation** : 2 000€  
**Infrastructure** : 500€/an  

**TOTAL INVESTISSEMENT** : ~27 500€

---

### **Gains Annuels Estimés**

**Réduction coûts maintenance** : 
- Budget actuel estimé : 100 000€/an
- Économies via préventif : 15% = 15 000€/an
- Optimisation fournisseurs : 5% = 5 000€/an

**Gains productivité** :
- Temps admin économisé : 10h/semaine = 520h/an
- Valorisation : 520h × 30€/h = 15 600€/an

**Évitement amendes/risques** :
- Non-conformité évitée : ~5 000€/an

**TOTAL GAINS** : ~40 600€/an

---

### **Retour sur Investissement**

```
ROI = (Gains - Investissement) / Investissement
ROI = (40 600 - 27 500) / 27 500
ROI = 47,6% la première année

Amortissement : 8 mois
Gains nets année 1 : 13 100€
Gains nets années suivantes : 40 600€/an (récurrent)
```

---

## 🚦 Risques & Mitigation

### **Risques Identifiés**

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Données manquantes | Haut | Moyenne | Validation et migration des données existantes |
| Performance insuffisante | Moyen | Faible | Tests de charge dès Phase 1 |
| Non-adoption utilisateurs | Haut | Moyenne | Formation et itérations selon feedback |
| Complexité sous-estimée | Moyen | Moyenne | Approche MVP, scope ajustable |
| Bugs en production | Moyen | Faible | Tests exhaustifs, déploiement progressif |

### **Plan de Contingence**

- **Buffer temps** : +20% sur estimations
- **Scope réduction** : Priorisation stricte
- **Support dédié** : 1 mois post-déploiement
- **Rollback** : Possibilité de retour arrière

---

## 📅 Planning Détaillé (Gantt)

```
Sem 1  : [████████████] Infrastructure + Dashboard
Sem 2  : [████████████] Coûts + Maintenance  
Sem 3  : [████████████] KPIs + Tests Phase 1
         └─> LIVRAISON PHASE 1
Sem 4  : [████████████] Analyses Coûts Avancées
Sem 5  : [████████████] Analyses Techniques
Sem 6  : [████████████] Budget + Devis vs Factures
Sem 7  : [████████████] Fiche Vie + Tests Phase 2
         └─> LIVRAISON PHASE 2
Sem 8  : [████████████] Fournisseurs + Exports
Sem 9  : [████████████] Personnalisation + Auto
Sem 10 : [████████████] Graphiques + Tests Phase 3
         └─> LIVRAISON PHASE 3
```

---

## 🎯 Métriques de Suivi du Projet

### **Indicateurs Hebdomadaires**

- **Vélocité** : Story points complétés
- **Qualité** : Nombre de bugs trouvés/corrigés
- **Coverage** : % code testé
- **Performance** : Temps chargement rapports

### **Revues de Sprint**

- Démo des fonctionnalités terminées
- Feedback utilisateurs pilotes
- Ajustement du backlog
- Planification semaine suivante

---

## 🌟 Évolutions Futures (Phase 4+)

### **Intelligence Artificielle & Machine Learning**

- **Prédiction des pannes** : ML basé sur historique
- **Optimisation stocks** : Pièces à commander
- **Recommandations automatiques** : Quand réformer
- **Détection anomalies** : Coûts inhabituels

### **Intégrations Avancées**

- **Télématique** : Données GPS temps réel
- **Constructeurs** : API garanties et rappels
- **Comptabilité** : Synchronisation automatique
- **Carte grise** : Vérification validité

### **Analytics Avancés**

- **Analyse prédictive** : Forecasting
- **Clustering** : Segmentation véhicules
- **Benchmarking** : Comparaison avec standards
- **What-if Analysis** : Simulations scénarios

---

## 📝 Conclusion

Ce plan d'implémentation propose une approche **progressive, pragmatique et ROI-orientée**.

### **Points Clés**

✅ **Phase 1** délivre de la valeur immédiate (3 semaines)  
✅ **Approche itérative** permet ajustements continus  
✅ **ROI positif** dès la première année  
✅ **Scalabilité** assurée par bonne architecture  
✅ **Maintenance** facilitée par code propre et testé  

### **Prochaines Étapes**

1. **Validation** de ce plan par les parties prenantes
2. **Priorisation** définitive des rapports Phase 1
3. **Allocation** des ressources (dev, budget)
4. **Kickoff** meeting et démarrage
5. **Go!** 🚀

---

**Document préparé pour** : Impact Auto Plus  
**Version** : 1.0  
**Date** : Octobre 2025  
**Auteur** : Équipe Technique  
**Statut** : Proposition - En attente validation

