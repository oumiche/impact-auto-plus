<template>
  <DefaultLayout>
    <div class="dashboard">
      <!-- Welcome Message -->
      <div class="welcome-message">
        <h2>Bienvenue, {{ authStore.userFullName }} !</h2>
        <p>Bienvenue dans votre espace de gestion de parc automobile - {{ authStore.currentTenant?.name }}</p>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon vehicles">
            <i class="icon">🚗</i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedStats.vehicles }}</div>
            <div class="stat-label">Véhicules</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon interventions">
            <i class="icon">🔧</i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedStats.interventions }}</div>
            <div class="stat-label">Interventions</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon drivers">
            <i class="icon">👤</i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedStats.drivers }}</div>
            <div class="stat-label">Conducteurs</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon maintenance">
            <i class="icon">🛠️</i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedStats.maintenance }}</div>
            <div class="stat-label">Entretiens</div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Recent Activity -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="icon">🕐</i> Activité Récente
            </h3>
          </div>
          <div class="recent-activity">
            <div v-if="recentActivities.length === 0" class="no-data">
              <i class="icon">ℹ️</i>
              <p>Aucune activité récente</p>
            </div>
            <div v-else v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-icon" :class="`activity-${activity.type}`">
                <i class="icon">{{ activity.icon }}</i>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="icon">⚡</i> Actions Rapides
            </h3>
          </div>
          <div class="quick-actions">
            <router-link :to="{ name: 'Vehicles' }" class="quick-action">
              <i class="icon">➕</i>
              <span>Nouveau Véhicule</span>
            </router-link>
            <router-link :to="{ name: 'VehicleInterventions' }" class="quick-action">
              <i class="icon">🔧</i>
              <span>Nouvelle Intervention</span>
            </router-link>
            <router-link :to="{ name: 'Drivers' }" class="quick-action">
              <i class="icon">👤</i>
              <span>Nouveau Conducteur</span>
            </router-link>
            <router-link :to="{ name: 'Reports' }" class="quick-action">
              <i class="icon">📊</i>
              <span>Générer Rapport</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Additional Content Grid -->
      <div class="content-grid">
        <!-- Vehicle Status Overview -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="icon">📈</i> État du Parc
            </h3>
          </div>
          <div class="vehicle-status-overview">
            <div class="status-item">
              <div class="status-indicator active"></div>
              <div class="status-info">
                <div class="status-count">{{ vehicleStatus.active }}</div>
                <div class="status-label">Véhicules Actifs</div>
              </div>
            </div>
            <div class="status-item">
              <div class="status-indicator maintenance"></div>
              <div class="status-info">
                <div class="status-count">{{ vehicleStatus.maintenance }}</div>
                <div class="status-label">En Entretien</div>
              </div>
            </div>
            <div class="status-item">
              <div class="status-indicator inactive"></div>
              <div class="status-info">
                <div class="status-count">{{ vehicleStatus.inactive }}</div>
                <div class="status-label">Hors Service</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Maintenance -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="icon">📅</i> Entretiens à Venir
            </h3>
          </div>
          <div class="upcoming-maintenance">
            <div v-if="upcomingMaintenance.length === 0" class="no-data">
              <i class="icon">ℹ️</i>
              <p>Aucun entretien programmé</p>
            </div>
            <div v-else v-for="maintenance in upcomingMaintenance" :key="maintenance.id" class="maintenance-item">
              <div class="maintenance-date">{{ maintenance.date }}</div>
              <div class="maintenance-info">
                <div class="maintenance-vehicle">{{ maintenance.vehicle }}</div>
                <div class="maintenance-type">{{ maintenance.type }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import apiService from '@/services/api.service'

const authStore = useAuthStore()

const stats = ref({
  vehicles: 0,
  interventions: 0,
  drivers: 0,
  maintenance: 0
})

const animatedStats = ref({
  vehicles: 0,
  interventions: 0,
  drivers: 0,
  maintenance: 0
})

const recentActivities = ref([])
const vehicleStatus = ref({
  active: 0,
  maintenance: 0,
  inactive: 0
})
const upcomingMaintenance = ref([])
const loading = ref(true)

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Charger les stats (simulées pour l'instant)
    stats.value = {
      vehicles: 45,
      interventions: 128,
      drivers: 32,
      maintenance: 8
    }
    
    // Animer les compteurs
    animateCounters()
    
    // Données simulées pour la démo
    vehicleStatus.value = {
      active: 38,
      maintenance: 5,
      inactive: 2
    }
    
    recentActivities.value = [
      { id: 1, title: 'Révision - ABC-123', time: 'Il y a 15 min', icon: '🔧', type: 'info' },
      { id: 2, title: 'Réparation - XYZ-789', time: 'Il y a 1 h', icon: '🔧', type: 'warning' },
      { id: 3, title: 'Contrôle technique - DEF-456', time: 'Il y a 2 h', icon: '✅', type: 'success' }
    ]
    
    upcomingMaintenance.value = [
      { id: 1, date: '15 Oct', vehicle: 'ABC-123', type: 'Révision annuelle' },
      { id: 2, date: '18 Oct', vehicle: 'XYZ-789', type: 'Changement pneus' },
      { id: 3, date: '22 Oct', vehicle: 'DEF-456', type: 'Contrôle technique' }
    ]
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

const animateCounters = () => {
  const duration = 1500
  const steps = 60
  const interval = duration / steps
  
  Object.keys(stats.value).forEach(stat => {
    const target = stats.value[stat]
    let current = 0
    let step = 0
    
    const timer = setInterval(() => {
      step++
      const progress = 1 - Math.pow(1 - step / steps, 3)
      current = Math.floor(target * progress)
      
      animatedStats.value[stat] = current
      
      if (step >= steps) {
        animatedStats.value[stat] = target
        clearInterval(timer)
      }
    }, interval)
  })
}
</script>

<style scoped lang="scss">
.dashboard {
}

.welcome-message {
  background: #2563eb;
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  p {
    opacity: 0.95;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;

    &.vehicles {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
    }

    &.interventions {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    &.drivers {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    &.maintenance {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }

  .stat-content {
    flex: 1;

    .stat-value {
      font-size: 2.25rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.95rem;
      color: #64748b;
      font-weight: 500;
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .card-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .icon {
        font-size: 1.25rem;
      }
    }
  }
}

.recent-activity {
  padding: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background: #f8fafc;
  }

  .activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;

    &.activity-success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    &.activity-warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    &.activity-info {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
    }

    &.activity-error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }

  .activity-content {
    flex: 1;

    .activity-title {
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.875rem;
      color: #64748b;
    }
  }
}

.quick-actions {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-decoration: none;
  color: #1e293b;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
    transform: translateX(4px);
  }

  .icon {
    font-size: 1.25rem;
  }
}

.vehicle-status-overview {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;

    &.active {
      background: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
    }

    &.maintenance {
      background: #f59e0b;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
    }

    &.inactive {
      background: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }
  }

  .status-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .status-count {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .status-label {
      font-size: 0.95rem;
      color: #64748b;
    }
  }
}

.upcoming-maintenance {
  padding: 1rem;
}

.maintenance-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background: #f8fafc;
  }

  .maintenance-date {
    width: 60px;
    height: 60px;
    background: #2563eb;
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .maintenance-info {
    flex: 1;

    .maintenance-vehicle {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .maintenance-type {
      font-size: 0.875rem;
      color: #64748b;
    }
  }
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;

  .icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    display: block;
  }

  p {
    font-size: 0.95rem;
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>

