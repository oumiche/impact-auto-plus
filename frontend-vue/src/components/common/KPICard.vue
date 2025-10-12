<template>
  <div class="kpi-card" :class="[color, trendClass]">
    <div class="kpi-icon" :class="color">
      <i :class="icon"></i>
    </div>
    <div class="kpi-content">
      <p class="kpi-label">{{ label }}</p>
      <p class="kpi-value">{{ value }}</p>
      <div v-if="trend && change" class="kpi-trend" :class="trend">
        <i :class="getTrendIcon()"></i>
        <span>{{ change }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  trend: {
    type: String,
    validator: (value) => ['up', 'down', 'neutral', ''].includes(value),
    default: ''
  },
  change: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'orange', 'purple', 'yellow', 'teal', 'red'].includes(value)
  }
})

const trendClass = computed(() => {
  if (!props.trend) return ''
  return `trend-${props.trend}`
})

const getTrendIcon = () => {
  if (props.trend === 'up') return 'fas fa-arrow-up'
  if (props.trend === 'down') return 'fas fa-arrow-down'
  return 'fas fa-minus'
}
</script>

<style scoped lang="scss">
.kpi-card {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.75rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  &.trend-up {
    border-left: 4px solid #10b981;
  }

  &.trend-down {
    border-left: 4px solid #ef4444;
  }
}

.kpi-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;

  i {
    font-size: 1.75rem;
  }

  &.blue {
    background: #dbeafe;
    color: #3b82f6;
  }

  &.green {
    background: #d1fae5;
    color: #10b981;
  }

  &.orange {
    background: #fed7aa;
    color: #f59e0b;
  }

  &.purple {
    background: #ede9fe;
    color: #8b5cf6;
  }

  &.yellow {
    background: #fef3c7;
    color: #fbbf24;
  }

  &.teal {
    background: #ccfbf1;
    color: #14b8a6;
  }

  &.red {
    background: #fee2e2;
    color: #ef4444;
  }
}

.kpi-content {
  flex: 1;
  min-width: 0;
}

.kpi-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.kpi-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;

  &.up {
    color: #10b981;
  }

  &.down {
    color: #ef4444;
  }

  &.neutral {
    color: #6b7280;
  }

  i {
    font-size: 0.875rem;
  }
}

// Responsive
@media (max-width: 768px) {
  .kpi-card {
    padding: 1.25rem;
    gap: 1rem;
  }

  .kpi-icon {
    width: 48px;
    height: 48px;

    i {
      font-size: 1.5rem;
    }
  }

  .kpi-value {
    font-size: 1.75rem;
  }
}
</style>

