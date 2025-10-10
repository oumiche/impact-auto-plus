# 📋 Liste des pages à migrer vers Vue.js

## ✅ Pages déjà migrées (7)

1. ✅ **login.html** → `Login.vue`
2. ✅ **tenant-selection.html** → `TenantSelection.vue`
3. ✅ **dashboard-vue.html** → `Dashboard.vue`
4. ✅ **garages.html** → `Garages.vue`
5. ✅ **vehicles.html** → `Vehicles.vue`
6. ✅ **supplies.html** → `Supplies.vue`
7. ✅ **users-vue.html** → `Users.vue`

---

## 🔨 Pages à migrer (priorité haute)

### Gestion des véhicules (8 pages)
- [ ] **marques.html** → `Marques.vue` - Marques de véhicules
- [ ] **modeles.html** → `Modeles.vue` - Modèles de véhicules
- [ ] **vehicle-categories.html** → `VehicleCategories.vue` - Types de véhicules
- [ ] **vehicle-colors.html** → `VehicleColors.vue` - Couleurs
- [ ] **fuel-types-vue.html** → `FuelTypes.vue` - Types de carburant
- [ ] **licence-types-vue.html** → `LicenceTypes.vue` - Types de permis
- [ ] **drivers.html** → `Drivers.vue` - Conducteurs
- [ ] **vehicle-assignments.html** → `VehicleAssignments.vue` - Assignations

### Suivi et maintenance (8 pages)
- [ ] **vehicle-insurances.html** → `VehicleInsurances.vue` - Assurances
- [ ] **vehicle-fuel-logs.html** → `VehicleFuelLogs.vue` - Suivi carburant
- [ ] **vehicle-maintenances.html** → `VehicleMaintenances.vue` - Entretiens
- [ ] **vehicle-interventions.html** → `VehicleInterventions.vue` - Interventions
- [ ] **interventions.html** → `Interventions.vue` - Liste interventions

### Workflow d'intervention (12 pages)
- [ ] **intervention-prediagnostics.html** → `InterventionPrediagnostics.vue`
- [ ] **intervention-prediagnostic-create.html** → Intégré dans le modal
- [ ] **intervention-prediagnostic-edit.html** → Intégré dans le modal
- [ ] **intervention-quotes.html** → `InterventionQuotes.vue`
- [ ] **intervention-quote-create.html** → Intégré dans le modal
- [ ] **intervention-quote-edit.html** → Intégré dans le modal
- [ ] **intervention-work-authorizations.html** → `InterventionWorkAuthorizations.vue`
- [ ] **intervention-work-authorization-create.html** → Intégré dans le modal
- [ ] **intervention-work-authorization-edit.html** → Intégré dans le modal
- [ ] **intervention-invoices.html** → `InterventionInvoices.vue`
- [ ] **intervention-invoice-create.html** → Intégré dans le modal
- [ ] **intervention-invoice-edit.html** → Intégré dans le modal
- [ ] **intervention-invoice-view.html** → Modal de visualisation
- [ ] **intervention-reception-reports.html** → `InterventionReceptionReports.vue`
- [ ] **intervention-reception-report-create.html** → Intégré dans le modal
- [ ] **intervention-reception-report-edit.html** → Intégré dans le modal
- [ ] **intervention-reception-report-view.html** → Modal de visualisation

### Fournitures (3 pages)
- [ ] **supply-categories.html** → `SupplyCategories.vue` - Catégories
- [ ] **supply-prices.html** → `SupplyPrices.vue` - Registre des prix
- [ ] **intervention-types.html** → `InterventionTypes.vue` - Types d'intervention

### Administration (5 pages)
- [ ] **parametres-vue.html** → `Parametres.vue` - Paramètres système
- [ ] **tenants.html** → `Tenants.vue` - Gestion des tenants
- [ ] **user-tenant-permissions.html** → `UserTenantPermissions.vue` - Affectations
- [ ] **code-formats-vue.html** → `CodeFormats.vue` - Formats de code
- [ ] **collaborateurs.html** → `Collaborateurs.vue` - Collaborateurs

### Rapports et Analytics (2 pages)
- [ ] **reports.html** → `Reports.vue` - Rapports
- [ ] **analytics.html** → `Analytics.vue` - Analytics et statistiques

---

## 📊 Statistiques

- **Total pages HTML** : ~45
- **Pages migrées** : 7 (15%)
- **Pages restantes** : 38 (85%)

### Par catégorie :
- ✅ **Authentification** : 2/2 (100%)
- ✅ **Dashboard** : 1/1 (100%)
- ✅ **CRUD de base** : 4/4 (100%)
- ⏳ **Données de base** : 0/8 (0%)
- ⏳ **Gestion avancée** : 0/8 (0%)
- ⏳ **Workflow intervention** : 0/12 (0%)
- ⏳ **Administration** : 0/5 (0%)
- ⏳ **Rapports** : 0/2 (0%)

---

## 🎯 Stratégie de migration recommandée

### Phase 1 : Pages simples CRUD (2-3 jours)
Migrer les pages de données de base qui suivent le même pattern que Garages :
1. Marques
2. Modèles
3. VehicleCategories
4. VehicleColors
5. FuelTypes
6. LicenceTypes
7. SupplyCategories
8. InterventionTypes

**Pattern** : Liste + Modal Create/Edit + Confirmation Delete

### Phase 2 : Pages de gestion (3-4 jours)
Pages plus complexes avec relations :
1. Drivers
2. VehicleAssignments
3. VehicleInsurances
4. VehicleFuelLogs
5. VehicleMaintenances

**Pattern** : Liste + Formulaires complexes + Relations

### Phase 3 : Workflow d'intervention (5-7 jours)
Le plus complexe - workflow complet :
1. InterventionPrediagnostics (Réception)
2. InterventionQuotes (Devis)
3. InterventionWorkAuthorizations (Autorisation)
4. InterventionInvoices (Facturation)
5. InterventionReceptionReports (Rapport de réception)

**Pattern** : Workflow avec étapes + PDF generation + Signatures

### Phase 4 : Administration (2-3 jours)
1. Parametres
2. Tenants
3. UserTenantPermissions
4. CodeFormats
5. SupplyPrices
6. Collaborateurs

**Pattern** : Configuration système + Permissions

### Phase 5 : Rapports (2-3 jours)
1. Reports - Génération de rapports
2. Analytics - Graphiques et statistiques

**Pattern** : Visualisation de données + Charts + Export

---

## 🛠️ Composants à créer pour faciliter la migration

### Composants de base
- [x] Modal
- [x] LoadingSpinner
- [x] Sidebar
- [x] DefaultLayout
- [ ] DataTable - Table avec tri, pagination, recherche
- [ ] SearchBar - Barre de recherche avec filtres
- [ ] DatePicker - Sélecteur de dates
- [ ] FileUpload - Upload de fichiers/images
- [ ] ConfirmDialog - Dialog de confirmation réutilisable

### Composants métier
- [ ] VehicleSelector - Sélecteur de véhicule
- [ ] DriverSelector - Sélecteur de conducteur
- [ ] GarageSelector - Sélecteur de garage
- [ ] StatusBadge - Badge de statut réutilisable
- [ ] PriceDisplay - Affichage formaté des prix
- [ ] DateDisplay - Affichage formaté des dates

### Composants avancés
- [ ] WorkflowStepper - Stepper pour le workflow d'intervention
- [ ] PDFViewer - Visualiseur de PDF
- [ ] SignaturePad - Pad de signature
- [ ] ChartCard - Carte avec graphique
- [ ] ExportButton - Bouton d'export (PDF, Excel, CSV)

---

## 📝 Template de page CRUD simple

```vue
<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        ➕ Nouveau
      </button>
    </template>

    <div class="page">
      <LoadingSpinner v-if="loading" />
      
      <div v-else-if="items.length > 0" class="items-grid">
        <!-- Liste des items -->
      </div>
      
      <div v-else class="empty-state">
        <!-- Empty state -->
      </div>

      <Modal v-model="showModal" :title="modalTitle">
        <!-- Formulaire -->
      </Modal>

      <Modal v-model="showDeleteModal" title="Confirmer">
        <!-- Confirmation -->
      </Modal>
    </div>
  </DefaultLayout>
</template>

<script setup>
// Imports
// State
// Methods CRUD
</script>

<style scoped lang="scss">
// Styles
</style>
```

---

## 🎯 Estimation du temps

### Par type de page
- **CRUD simple** : 30-45 min/page
- **CRUD avec relations** : 1-2h/page
- **Workflow complexe** : 3-4h/page
- **Rapports/Analytics** : 2-3h/page

### Total estimé
- **Pages simples** (8) : 4-6 heures
- **Pages moyennes** (5) : 5-10 heures
- **Pages complexes** (12) : 36-48 heures
- **Administration** (6) : 12-18 heures
- **Rapports** (2) : 4-6 heures

**Total global** : 61-88 heures (8-11 jours de travail)

---

## 💡 Recommandations

1. **Commencer par les pages simples** - Marques, Modèles, Catégories
2. **Créer des composants réutilisables** - DataTable, Selectors
3. **Tester au fur et à mesure** - Ne pas tout migrer d'un coup
4. **Garder l'ancien système** en parallèle pendant la migration
5. **Documenter les spécificités** de chaque page

---

## 🚀 Prochaine étape suggérée

**Migrer les 8 pages de données de base** (CRUD simples) :
- Marques
- Modèles
- VehicleCategories
- VehicleColors
- FuelTypes
- LicenceTypes
- SupplyCategories
- InterventionTypes

Ces pages suivent toutes le même pattern que Garages et peuvent être migrées rapidement.

**Voulez-vous que je commence par ces 8 pages ?**

