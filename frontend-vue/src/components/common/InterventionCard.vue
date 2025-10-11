<template>
  <div class="intervention-card" :class="{ 'card-clickable': clickable }">
    <div class="card-header">
      <div class="header-left">
        <h3 class="intervention-number">
          <i class="fas fa-wrench"></i>
          {{ intervention.interventionNumber || `INT-${intervention.id}` }}
        </h3>
        <StatusBadge :status="intervention.currentStatus" />
      </div>
      <div v-if="showActions" class="card-actions">
        <button 
          v-if="canEdit" 
          @click.stop="$emit('edit', intervention)" 
          class="btn-icon btn-edit" 
          title="Modifier"
        >
          <i class="fas fa-edit"></i>
        </button>
        <button 
          v-if="canDelete" 
          @click.stop="$emit('delete', intervention)" 
          class="btn-icon btn-delete" 
          title="Supprimer"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <div class="card-body">
      <h4 class="intervention-title">{{ intervention.title }}</h4>

      <div class="intervention-info">
        <!-- Véhicule -->
        <div class="info-item">
          <i class="fas fa-car"></i>
          <span>
            <strong>{{ getVehicleLabel(intervention.vehicle) }}</strong>
          </span>
        </div>

        <!-- Conducteur -->
        <div class="info-item" v-if="intervention.driver">
          <i class="fas fa-user"></i>
          <span>{{ getDriverLabel(intervention.driver) }}</span>
        </div>

        <!-- Type -->
        <div class="info-item" v-if="intervention.interventionType">
          <i class="fas fa-tag"></i>
          <span>{{ getInterventionTypeLabel(intervention.interventionType) }}</span>
        </div>

        <!-- Garage -->
        <div class="info-item" v-if="intervention.garage">
          <i class="fas fa-warehouse"></i>
          <span>{{ getGarageLabel(intervention.garage) }}</span>
        </div>

        <!-- Date -->
        <div class="info-item">
          <i class="fas fa-calendar"></i>
          <span>{{ formatDate(intervention.reportedDate) }}</span>
        </div>

        <!-- Priorité -->
        <div class="info-item" v-if="intervention.priority">
          <i :class="`fas ${getPriorityIcon(intervention.priority)}`" :style="{ color: getPriorityColor(intervention.priority) }"></i>
          <span>{{ getPriorityLabel(intervention.priority) }}</span>
        </div>
      </div>

      <!-- Workflow Progress (si demandé) -->
      <div v-if="showWorkflow" class="workflow-section">
        <WorkflowProgressBar 
          :current-status="intervention.currentStatus" 
          :compact="true"
          :show-labels="false"
        />
      </div>

      <!-- Description -->
      <div v-if="intervention.description && showDescription" class="description">
        <p>{{ intervention.description }}</p>
      </div>

      <!-- Quick Stats -->
      <div v-if="showStats" class="quick-stats">
        <div class="stat-item" v-if="intervention.estimatedCost">
          <span class="stat-label">Estimé</span>
          <span class="stat-value">{{ formatCurrency(intervention.estimatedCost) }}</span>
        </div>
        <div class="stat-item" v-if="intervention.actualCost">
          <span class="stat-label">Réel</span>
          <span class="stat-value">{{ formatCurrency(intervention.actualCost) }}</span>
        </div>
        <div class="stat-item" v-if="intervention.estimatedDurationDays">
          <span class="stat-label">Durée</span>
          <span class="stat-value">{{ intervention.estimatedDurationDays }}j</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
import WorkflowProgressBar from './WorkflowProgressBar.vue'

const props = defineProps({
  intervention: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showWorkflow: {
    type: Boolean,
    default: false
  },
  showDescription: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: true
  },
  canDelete: {
    type: Boolean,
    default: true
  }
})

defineEmits(['edit', 'delete', 'click'])

const getVehicleLabel = (vehicle) => {
  if (!vehicle) return 'N/A'
  if (typeof vehicle === 'object') {
    const brand = vehicle.brand?.name || vehicle.brandName || ''
    const model = vehicle.model?.name || vehicle.modelName || ''
    const plate = vehicle.plateNumber || vehicle.plate_number || ''
    return `${brand} ${model} (${plate})`.trim()
  }
  return vehicle
}

const getDriverLabel = (driver) => {
  if (!driver) return ''
  if (typeof driver === 'object') {
    return `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
  }
  return driver
}

const getInterventionTypeLabel = (type) => {
  if (!type) return ''
  return typeof type === 'object' ? type.name : type
}

const getGarageLabel = (garage) => {
  if (!garage) return ''
  return typeof garage === 'object' ? garage.name : garage
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return ''
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente'
  }
  return labels[priority] || priority
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'fa-arrow-down',
    medium: 'fa-minus',
    high: 'fa-arrow-up',
    urgent: 'fa-exclamation-triangle'
  }
  return icons[priority] || 'fa-flag'
}

const getPriorityColor = (priority) => {
  const colors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626'
  }
  return colors[priority] || '#6b7280'
}
</script>

<style scoped lang="scss">
.intervention-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  &.card-clickable {
    cursor: pointer;
    
    &:hover {
      border-color: #3b82f6;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.intervention-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: #3b82f6;
  }
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.intervention-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.intervention-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;

  i {
    font-size: 0.95rem;
    color: #9ca3af;
    width: 16px;
    text-align: center;
  }

  strong {
    color: #374151;
  }
}

.workflow-section {
  margin-top: 0.5rem;
}

.description {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;

  p {
    margin: 0;
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.5;
  }
}

.quick-stats {
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    font-weight: 600;
  }

  .stat-value {
    font-size: 1rem;
    color: #1f2937;
    font-weight: 700;
  }
}
</style>

