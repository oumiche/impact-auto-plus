<template>
  <div class="workflow-progress">
    <div v-for="(step, index) in displaySteps" :key="step.code" class="workflow-step">
      <div 
        class="step-indicator"
        :class="{
          'completed': isCompleted(step.order),
          'current': isCurrent(step.code),
          'future': isFuture(step.order),
          'cancelled': currentStatus === 'cancelled'
        }"
        :title="step.label"
      >
        <i :class="`fas ${step.icon}`"></i>
      </div>
      <transition name="fade">
        <div v-if="showLabels" class="step-label">{{ step.label }}</div>
      </transition>
      <div v-if="index < displaySteps.length - 1" class="step-connector" :class="{ 'active': isCompleted(step.order) }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStatus: {
    type: String,
    required: true
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

// Toutes les étapes du workflow
const allSteps = [
  { code: 'reported', label: 'Signalé', icon: 'fa-flag', order: 1 },
  { code: 'in_prediagnostic', label: 'Prédiagnostic', icon: 'fa-clipboard-check', order: 2 },
  { code: 'prediagnostic_completed', label: 'Diag. terminé', icon: 'fa-check', order: 3 },
  { code: 'in_quote', label: 'Devis', icon: 'fa-file-invoice-dollar', order: 4 },
  { code: 'quote_received', label: 'Devis reçu', icon: 'fa-envelope-open', order: 5 },
  { code: 'in_approval', label: 'En accord', icon: 'fa-handshake', order: 6 },
  { code: 'approved', label: 'Approuvé', icon: 'fa-thumbs-up', order: 7 },
  { code: 'in_repair', label: 'Réparation', icon: 'fa-tools', order: 8 },
  { code: 'repair_completed', label: 'Rép. terminée', icon: 'fa-check-circle', order: 9 },
  { code: 'in_reception', label: 'Réception', icon: 'fa-clipboard-list', order: 10 },
  { code: 'vehicle_received', label: 'Reçu', icon: 'fa-check-double', order: 11 }
]

// Afficher uniquement les étapes principales en mode compact
const displaySteps = computed(() => {
  if (props.compact) {
    return [
      allSteps[0],  // Signalé
      allSteps[1],  // Prédiagnostic
      allSteps[3],  // Devis
      allSteps[6],  // Approuvé
      allSteps[7],  // Réparation
      allSteps[10]  // Reçu
    ]
  }
  return allSteps
})

const getCurrentStepOrder = () => {
  const currentStep = allSteps.find(s => s.code === props.currentStatus)
  return currentStep?.order || 0
}

const isCompleted = (stepOrder) => {
  return stepOrder < getCurrentStepOrder()
}

const isCurrent = (stepCode) => {
  return stepCode === props.currentStatus
}

const isFuture = (stepOrder) => {
  return stepOrder > getCurrentStepOrder()
}
</script>

<style scoped lang="scss">
.workflow-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  overflow-x: auto;
  gap: 0.5rem;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
}

.workflow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 80px;
}

.step-indicator {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.3s ease;
  z-index: 2;
  
  &.completed {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  &.current {
    background: #3b82f6;
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    animation: pulse 2s infinite;
  }
  
  &.future {
    background: #e5e7eb;
    color: #9ca3af;
  }
  
  &.cancelled {
    background: #ef4444;
    color: white;
  }
}

.step-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  text-align: center;
  white-space: nowrap;
  
  .workflow-step:has(.completed) & {
    color: #10b981;
  }
  
  .workflow-step:has(.current) & {
    color: #3b82f6;
  }
}

.step-connector {
  position: absolute;
  top: 24px;
  left: calc(50% + 24px);
  right: calc(-50% + 24px);
  height: 3px;
  background: #e5e7eb;
  z-index: 1;
  transition: background 0.3s ease;
  
  &.active {
    background: #10b981;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.6);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

