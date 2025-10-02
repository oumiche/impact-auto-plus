# Charte Graphique Vue.js - Impact Auto

## Vue d'ensemble

Cette charte graphique est spécifiquement conçue pour l'intégration avec **Vue.js 2.6** et **Buefy** dans le projet Impact Auto.

## Technologies utilisées

- **Vue.js 2.6** : Framework JavaScript
- **Buefy 0.7.10** : Framework UI basé sur Bulma
- **Sass** : Préprocesseur CSS
- **Font Awesome** : Icônes

## Palette de couleurs

### Couleurs principales
```scss
// Variables SCSS pour Vue.js
$primary: #1e3c72;        // Bleu principal
$primary-light: #2a5298;  // Bleu secondaire
$accent: #ffd700;         // Or accent
$light: #f8f9fa;          // Gris clair
$border: #e0e0e0;         // Gris bordure
$text: #333333;           // Texte principal
```

### Couleurs Buefy personnalisées
```scss
// Dans votre fichier main.scss
@import "~buefy/src/scss/buefy";

// Personnalisation des couleurs Buefy
$primary: #1e3c72;
$info: #2a5298;
$warning: #ffd700;
$light: #f8f9fa;
```

## Typographie

### Police principale
```scss
$family-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

### Hiérarchie des tailles
```scss
$size-1: 2.5rem;  // H1
$size-2: 2rem;    // H2
$size-3: 1.5rem;  // H3
$size-4: 1.2rem;  // H4
$size-5: 1rem;    // Body
$size-6: 0.9rem;  // Small
$size-7: 0.8rem;  // Extra small
```

## Composants Vue.js

### 1. Layout principal avec sidebar

```vue
<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h1 class="logo">IMPACT AUTO</h1>
        <p class="logo-subtitle">Gestion de Parc Automobile</p>
      </div>
      
      <nav class="sidebar-nav">
        <b-menu>
          <b-menu-list label="Gestion">
            <b-menu-item icon="car" label="Véhicules" tag="router-link" to="/vehicles"></b-menu-item>
            <b-menu-item icon="user" label="Conducteurs" tag="router-link" to="/drivers"></b-menu-item>
            <b-menu-item icon="wrench" label="Interventions" tag="router-link" to="/interventions"></b-menu-item>
          </b-menu-list>
          
          <b-menu-list label="Rapports">
            <b-menu-item icon="chart-bar" label="Tableau de bord" tag="router-link" to="/dashboard"></b-menu-item>
            <b-menu-item icon="file-alt" label="Rapports" tag="router-link" to="/reports"></b-menu-item>
          </b-menu-list>
        </b-menu>
      </nav>
    </aside>

    <!-- Contenu principal -->
    <main class="main-content">
      <header class="top-bar">
        <b-button @click="toggleSidebar" icon="bars" class="is-primary"></b-button>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <div class="user-menu">
          <b-dropdown>
            <b-button slot="trigger" icon="user"></b-button>
            <b-dropdown-item>Profil</b-dropdown-item>
            <b-dropdown-item>Paramètres</b-dropdown-item>
            <b-dropdown-item divided>Déconnexion</b-dropdown-item>
          </b-dropdown>
        </div>
      </header>
      
      <div class="content">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'AppLayout',
  data() {
    return {
      sidebarCollapsed: false
    }
  },
  computed: {
    pageTitle() {
      return this.$route.meta.title || 'Impact Auto'
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    }
  }
}
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  background: linear-gradient(180deg, $primary 0%, $primary-light 100%);
  color: white;
  transition: width 0.3s ease;
  
  &.is-collapsed {
    width: 60px;
    
    .logo-subtitle,
    .menu-label {
      display: none;
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid $border;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content {
  flex: 1;
  padding: 2rem;
  background: $light;
}
</style>
```

### 2. Composant de carte véhicule

```vue
<template>
  <div class="vehicle-card">
    <div class="card-header">
      <h3 class="vehicle-title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
      <p class="vehicle-plate">{{ vehicle.plateNumber }}</p>
    </div>
    
    <div class="card-content">
      <p class="vehicle-description">{{ vehicle.description }}</p>
      
      <div class="vehicle-badges">
        <b-tag :type="getStatusType(vehicle.status)">
          {{ getStatusLabel(vehicle.status) }}
        </b-tag>
        <b-tag type="is-info">{{ vehicle.category }}</b-tag>
      </div>
    </div>
    
    <div class="card-footer">
      <b-button @click="editVehicle" type="is-primary" size="is-small">
        Modifier
      </b-button>
      <b-button @click="viewDetails" type="is-light" size="is-small">
        Détails
      </b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VehicleCard',
  props: {
    vehicle: {
      type: Object,
      required: true
    }
  },
  methods: {
    getStatusType(status) {
      const statusTypes = {
        'active': 'is-success',
        'maintenance': 'is-warning',
        'out_of_service': 'is-danger'
      }
      return statusTypes[status] || 'is-light'
    },
    getStatusLabel(status) {
      const statusLabels = {
        'active': 'Actif',
        'maintenance': 'Maintenance',
        'out_of_service': 'Hors service'
      }
      return statusLabels[status] || status
    },
    editVehicle() {
      this.$emit('edit', this.vehicle)
    },
    viewDetails() {
      this.$emit('view', this.vehicle)
    }
  }
}
</script>

<style lang="scss" scoped>
.vehicle-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid $border;
  background: $light;
}

.vehicle-title {
  color: $primary;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.vehicle-plate {
  color: $text;
  font-weight: 500;
}

.card-content {
  padding: 1.5rem;
}

.vehicle-badges {
  margin-top: 1rem;
  
  .tag {
    margin-right: 0.5rem;
  }
}

.card-footer {
  padding: 1rem 1.5rem;
  background: $light;
  display: flex;
  gap: 0.5rem;
}
</style>
```

### 3. Composant de formulaire d'intervention

```vue
<template>
  <div class="intervention-form">
    <b-field label="Véhicule" :type="errors.vehicle ? 'is-danger' : ''" :message="errors.vehicle">
      <b-select v-model="form.vehicleId" placeholder="Sélectionner un véhicule" expanded>
        <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
          {{ vehicle.brand }} {{ vehicle.model }} - {{ vehicle.plateNumber }}
        </option>
      </b-select>
    </b-field>

    <b-field label="Type d'intervention" :type="errors.type ? 'is-danger' : ''" :message="errors.type">
      <b-select v-model="form.type" placeholder="Sélectionner le type" expanded>
        <option value="maintenance">Maintenance</option>
        <option value="repair">Réparation</option>
        <option value="inspection">Contrôle</option>
      </b-select>
    </b-field>

    <b-field label="Description" :type="errors.description ? 'is-danger' : ''" :message="errors.description">
      <b-input
        v-model="form.description"
        type="textarea"
        placeholder="Décrire l'intervention..."
        rows="4"
      ></b-input>
    </b-field>

    <b-field label="Priorité">
      <b-radio v-model="form.priority" native-value="low">Faible</b-radio>
      <b-radio v-model="form.priority" native-value="medium">Moyenne</b-radio>
      <b-radio v-model="form.priority" native-value="high">Élevée</b-radio>
      <b-radio v-model="form.priority" native-value="urgent">Urgente</b-radio>
    </b-field>

    <div class="form-actions">
      <b-button @click="submit" type="is-primary" :loading="loading">
        Créer l'intervention
      </b-button>
      <b-button @click="cancel" type="is-light">
        Annuler
      </b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InterventionForm',
  data() {
    return {
      form: {
        vehicleId: null,
        type: null,
        description: '',
        priority: 'medium'
      },
      errors: {},
      loading: false
    }
  },
  props: {
    vehicles: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    async submit() {
      this.loading = true
      this.errors = {}
      
      try {
        // Validation
        if (!this.form.vehicleId) {
          this.errors.vehicle = 'Véhicule requis'
        }
        if (!this.form.type) {
          this.errors.type = 'Type requis'
        }
        if (!this.form.description.trim()) {
          this.errors.description = 'Description requise'
        }
        
        if (Object.keys(this.errors).length > 0) {
          return
        }
        
        // Soumission
        await this.$store.dispatch('interventions/create', this.form)
        this.$buefy.toast.open({
          message: 'Intervention créée avec succès',
          type: 'is-success'
        })
        this.$emit('success')
        
      } catch (error) {
        this.$buefy.toast.open({
          message: 'Erreur lors de la création',
          type: 'is-danger'
        })
      } finally {
        this.loading = false
      }
    },
    cancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="scss" scoped>
.intervention-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}
</style>
```

### 4. Composant de tableau de bord

```vue
<template>
  <div class="dashboard">
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-car"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-value">{{ metrics.vehicles }}</h3>
          <p class="metric-label">Véhicules</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-user"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-value">{{ metrics.drivers }}</h3>
          <p class="metric-label">Conducteurs</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-wrench"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-value">{{ metrics.interventions }}</h3>
          <p class="metric-label">Interventions</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-value">{{ metrics.alerts }}</h3>
          <p class="metric-label">Alertes</p>
        </div>
      </div>
    </div>
    
    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-title">Interventions par mois</h3>
        <div class="chart-placeholder">
          <!-- Intégration avec Chart.js ou autre librairie -->
        </div>
      </div>
      
      <div class="chart-card">
        <h3 class="chart-title">Coûts par catégorie</h3>
        <div class="chart-placeholder">
          <!-- Intégration avec Chart.js ou autre librairie -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      metrics: {
        vehicles: 24,
        drivers: 18,
        interventions: 12,
        alerts: 3
      }
    }
  },
  mounted() {
    this.loadMetrics()
  },
  methods: {
    async loadMetrics() {
      try {
        const data = await this.$store.dispatch('dashboard/getMetrics')
        this.metrics = data
      } catch (error) {
        console.error('Erreur lors du chargement des métriques:', error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, $primary, $primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: $primary;
  margin-bottom: 0.5rem;
}

.metric-label {
  color: $text;
  font-size: 0.9rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-title {
  color: $primary;
  margin-bottom: 1rem;
}

.chart-placeholder {
  height: 200px;
  background: $light;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text;
}
</style>
```

## Configuration Buefy

### 1. Configuration principale

```javascript
// main.js
import Vue from 'vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import './assets/scss/main.scss'

Vue.use(Buefy, {
  defaultIconComponent: 'vue-fontawesome',
  defaultIconPack: 'fas'
})
```

### 2. Configuration des couleurs

```scss
// assets/scss/main.scss
@import "~buefy/src/scss/buefy";

// Variables personnalisées
$primary: #1e3c72;
$info: #2a5298;
$warning: #ffd700;
$light: #f8f9fa;
$border: #e0e0e0;
$text: #333333;

// Personnalisation des composants
.button.is-primary {
  background: linear-gradient(135deg, $primary, $info);
  border: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
  }
}

.card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.menu-list a.is-active {
  background: rgba(255, 215, 0, 0.2);
  border-left: 3px solid $warning;
}
```

## Responsive Design

### Breakpoints
```scss
// Breakpoints personnalisés
$mobile: 768px;
$tablet: 1024px;
$desktop: 1200px;

// Mixins responsive
@mixin mobile {
  @media (max-width: #{$mobile - 1px}) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: #{$mobile}) and (max-width: #{$tablet - 1px}) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: #{$tablet}) {
    @content;
  }
}
```

### Utilisation dans les composants
```vue
<style lang="scss" scoped>
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @include desktop {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
```

## Icônes Font Awesome

### Configuration
```javascript
// main.js
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(fas)
Vue.component('vue-fontawesome', FontAwesomeIcon)
```

### Utilisation
```vue
<template>
  <div>
    <i class="fas fa-car"></i>
    <i class="fas fa-user"></i>
    <i class="fas fa-wrench"></i>
    <i class="fas fa-chart-bar"></i>
  </div>
</template>
```

## Conclusion

Cette charte graphique est parfaitement compatible avec Vue.js 2.6 et Buefy. Elle utilise :

- **Variables SCSS** pour la cohérence des couleurs
- **Composants Vue.js** réutilisables
- **Buefy** pour les composants UI de base
- **Font Awesome** pour les icônes
- **Design responsive** avec des breakpoints personnalisés
- **Animations CSS** pour les interactions

La charte respecte les conventions de Vue.js et s'intègre parfaitement avec l'écosystème existant de FileGator.
