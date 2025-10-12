<template>
  <div v-if="suggestion && suggestion.hasEnoughData" class="price-indicator">
    <div class="price-info" :class="alertClass">
      <i :class="alertIcon"></i>
      <div class="price-details">
        <div class="price-stats">
          <span class="label">Prix moyen:</span>
          <strong>{{ formatPrice(suggestion.averagePrice) }}</strong>
        </div>
        <div class="price-range">
          <span class="range-label">Fourchette:</span>
          <span class="range-value">{{ formatPrice(suggestion.minPrice) }} - {{ formatPrice(suggestion.maxPrice) }}</span>
        </div>
        <div v-if="suggestion.lastPrice" class="last-price">
          <span>Dernier: {{ formatPrice(suggestion.lastPrice.price) }}</span>
          <span class="date">({{ formatDate(suggestion.lastPrice.date) }})</span>
        </div>
      </div>
    </div>
    <div class="confidence-badge" :class="`confidence-${suggestion.confidence}`">
      {{ confidenceLabel }}
    </div>
  </div>
  <div v-else-if="loading" class="price-indicator loading">
    <i class="fas fa-spinner fa-spin"></i>
    <span>Vérification du prix...</span>
  </div>
  <div v-else-if="suggestion && !suggestion.hasEnoughData" class="price-indicator no-data">
    <i class="fas fa-info-circle"></i>
    <span>Aucun historique de prix disponible pour cette fourniture</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  suggestion: {
    type: Object,
    default: null
  },
  currentPrice: {
    type: [Number, String],
    default: 0
  },
  currency: {
    type: String,
    default: 'F CFA'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const deviation = computed(() => {
  if (!props.suggestion?.averagePrice || !props.currentPrice) return 0
  const current = parseFloat(props.currentPrice) || 0
  return ((current - props.suggestion.averagePrice) / props.suggestion.averagePrice) * 100
})

const alertClass = computed(() => {
  const dev = Math.abs(deviation.value)
  if (dev > 50) return 'alert-critical'
  if (dev > 30) return 'alert-high'
  if (dev > 15) return 'alert-medium'
  return 'alert-normal'
})

const alertIcon = computed(() => {
  const dev = Math.abs(deviation.value)
  if (dev > 50) return 'fas fa-exclamation-triangle'
  if (dev > 30) return 'fas fa-exclamation-circle'
  if (dev > 15) return 'fas fa-info-circle'
  return 'fas fa-check-circle'
})

const confidenceLabel = computed(() => {
  const labels = {
    high: 'Fiable',
    medium: 'Moyen',
    low: 'Peu de données',
    none: 'Aucune donnée'
  }
  return labels[props.suggestion?.confidence] || 'N/A'
})

const formatPrice = (value) => {
  if (!value && value !== 0) return 'N/A'
  return `${new Intl.NumberFormat('fr-FR').format(value)} ${props.currency}`
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR')
}
</script>

<style scoped lang="scss">
.price-indicator {
  margin-top: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  &.loading {
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #6b7280;

    i {
      font-size: 0.9rem;
    }
  }

  &.no-data {
    padding: 0.5rem;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #9ca3af;

    i {
      font-size: 0.9rem;
      color: #6b7280;
    }
  }
}

.price-info {
  flex: 1;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.85rem;

  i {
    font-size: 1.1rem;
    margin-top: 0.125rem;
  }

  &.alert-normal {
    background: #f0fdf4;
    border-color: #86efac;
    color: #166534;

    i {
      color: #16a34a;
    }
  }

  &.alert-medium {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1e40af;

    i {
      color: #3b82f6;
    }
  }

  &.alert-high {
    background: #fef3c7;
    border-color: #fde68a;
    color: #92400e;

    i {
      color: #f59e0b;
    }
  }

  &.alert-critical {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;

    i {
      color: #dc2626;
    }
  }
}

.price-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-stats,
.price-range,
.last-price {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label,
.range-label {
  font-weight: 500;
  opacity: 0.8;
}

strong,
.range-value {
  font-weight: 700;
}

.date {
  font-size: 0.75rem;
  opacity: 0.7;
  font-style: italic;
}

.confidence-badge {
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;

  &.confidence-high {
    background: #d1fae5;
    color: #065f46;
  }

  &.confidence-medium {
    background: #fef3c7;
    color: #92400e;
  }

  &.confidence-low {
    background: #fee2e2;
    color: #991b1b;
  }

  &.confidence-none {
    background: #f3f4f6;
    color: #6b7280;
  }
}
</style>

