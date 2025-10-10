<template>
  <div class="default-layout">
    <Sidebar />
    <div class="layout-content">
      <header class="top-header">
        <div class="header-content">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <div class="header-actions">
            <slot name="header-actions"></slot>
          </div>
        </div>
      </header>
      <main class="main-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/common/Sidebar.vue'

const route = useRoute()

const pageTitle = computed(() => {
  const titles = {
    // Tableau de Bord
    'Dashboard': 'Tableau de bord',
    'TenantSelection': 'Sélection d\'organisation',
    
    // Données de base
    'Marques': 'Marques Véhicules',
    'Modeles': 'Modèles Véhicules',
    'VehicleCategories': 'Types de Véhicules',
    'VehicleColors': 'Couleurs Véhicules',
    'FuelTypes': 'Types d\'énergie',
    'LicenceTypes': 'Types de permis',
    'SupplyCategories': 'Types de Fournitures',
    'Supplies': 'Fournitures',
    'InterventionTypes': 'Types d\'Intervention',
    'Collaborateurs': 'Collaborateurs',
    
    // Gestion
    'Garages': 'Garages',
    'Vehicles': 'Véhicules',
    'Drivers': 'Conducteurs',
    'VehicleAssignments': 'Assignations de Véhicules',
    'VehicleInsurances': 'Assurances Véhicules',
    'VehicleFuelLogs': 'Suivi de Carburant',
    'VehicleMaintenances': 'Entretiens Véhicules',
    
    // Suivi
    'VehicleInterventions': 'Interventions',
    'InterventionPrediagnostics': 'Prédiagnostics',
    'InterventionQuotes': 'Devis',
    'InterventionInvoices': 'Factures',
    'InterventionWorkAuthorizations': 'Autorisations de Travaux',
    'InterventionReceptionReports': 'Rapports de Réception',
    
    // Rapports
    'Reports': 'Rapports',
    'Analytics': 'Analytics',
    
    // Administration
    'Parametres': 'Paramètres',
    'Users': 'Utilisateurs',
    'Tenants': 'Tenants',
    'UserTenantPermissions': 'Affectations Utilisateurs',
    'CodeFormats': 'Formats de Code',
    'SupplyPrices': 'Registre des Prix'
  }
  return titles[route.name] || route.name
})
</script>

<style scoped lang="scss">
.default-layout {
  min-height: 100vh;
  display: flex;
  background: #f5f5f5;
}

.layout-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.top-header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .layout-content {
    margin-left: 0;
  }

  .header-content {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>

