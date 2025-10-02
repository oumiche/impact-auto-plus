<template>
  <div class="dashboard-stats">
    <div class="stats-grid">
      <div 
        class="stat-card" 
        :class="stat.type"
        v-for="stat in stats" 
        :key="stat.key"
      >
        <div class="stat-icon" :class="stat.type">
          <i :class="stat.icon"></i>
        </div>
        <div class="stat-value">{{ formatNumber(stat.value) }}</div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-change" v-if="stat.change !== undefined">
          <i 
            :class="stat.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"
            :style="{ color: stat.change >= 0 ? '#27ae60' : '#e74c3c' }"
          ></i>
          <span :style="{ color: stat.change >= 0 ? '#27ae60' : '#e74c3c' }">
            {{ Math.abs(stat.change) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardStats',
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      stats: [
        {
          key: 'vehicles',
          label: 'Véhicules',
          icon: 'fas fa-car',
          type: 'primary',
          value: 0
        },
        {
          key: 'interventions',
          label: 'Interventions',
          icon: 'fas fa-wrench',
          type: 'success',
          value: 0
        },
        {
          key: 'drivers',
          label: 'Conducteurs',
          icon: 'fas fa-user',
          type: 'warning',
          value: 0
        },
        {
          key: 'maintenance_due',
          label: 'Maintenance Due',
          icon: 'fas fa-exclamation-triangle',
          type: 'danger',
          value: 0
        }
      ]
    }
  },
  watch: {
    data: {
      handler(newData) {
        this.updateStats(newData)
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    updateStats(data) {
      this.stats.forEach(stat => {
        if (data[stat.key] !== undefined) {
          stat.value = data[stat.key]
        }
      })
    },

    formatNumber(value) {
      if (typeof value !== 'number') return '0'
      
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M'
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K'
      }
      
      return value.toString()
    }
  }
}
</script>

<style scoped>
.dashboard-stats {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  transition: transform 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.primary {
  border-left: 4px solid var(--impact-secondary, #3498db);
}

.stat-card.success {
  border-left: 4px solid var(--impact-success, #27ae60);
}

.stat-card.warning {
  border-left: 4px solid var(--impact-warning, #f39c12);
}

.stat-card.danger {
  border-left: 4px solid var(--impact-accent, #e74c3c);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.stat-icon.primary {
  color: var(--impact-secondary, #3498db);
}

.stat-icon.success {
  color: var(--impact-success, #27ae60);
}

.stat-icon.warning {
  color: var(--impact-warning, #f39c12);
}

.stat-icon.danger {
  color: var(--impact-accent, #e74c3c);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--impact-dark, #34495e);
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-change i {
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
