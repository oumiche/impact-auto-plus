<template>
  <span class="status-badge" :class="`status-${status}`">
    <i v-if="showIcon" :class="`fas ${getStatusIcon(status)}`"></i>
    {{ getStatusLabel(status) }}
  </span>
</template>

<script setup>
const props = defineProps({
  status: {
    type: String,
    required: true
  },
  showIcon: {
    type: Boolean,
    default: true
  }
})

const getStatusLabel = (status) => {
  const labels = {
    // Workflow principal
    reported: 'Signalé',
    in_prediagnostic: 'En prédiagnostique',
    prediagnostic_completed: 'Prédiagnostic terminé',
    in_quote: 'En devis',
    quote_received: 'Devis reçu',
    in_approval: 'En accord',
    approved: 'Accord donné',
    in_repair: 'En réparation',
    repair_completed: 'Réparation terminée',
    in_reception: 'En réception',
    vehicle_received: 'Véhicule reçu',
    cancelled: 'Annulé',
    // Autres statuts possibles
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Rejeté',
    paid: 'Payé',
    overdue: 'En retard'
  }
  return labels[status] || status
}

const getStatusIcon = (status) => {
  const icons = {
    // Workflow principal
    reported: 'fa-flag',
    in_prediagnostic: 'fa-clipboard-check',
    prediagnostic_completed: 'fa-check',
    in_quote: 'fa-file-invoice-dollar',
    quote_received: 'fa-envelope-open',
    in_approval: 'fa-handshake',
    approved: 'fa-thumbs-up',
    in_repair: 'fa-tools',
    repair_completed: 'fa-check-circle',
    in_reception: 'fa-clipboard-list',
    vehicle_received: 'fa-check-double',
    cancelled: 'fa-times-circle',
    // Autres
    pending: 'fa-clock',
    in_progress: 'fa-spinner',
    completed: 'fa-check',
    draft: 'fa-file',
    sent: 'fa-paper-plane',
    accepted: 'fa-check-circle',
    rejected: 'fa-times-circle',
    paid: 'fa-money-bill-wave',
    overdue: 'fa-exclamation-triangle'
  }
  return icons[status] || 'fa-circle'
}
</script>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;

  i {
    font-size: 0.85rem;
  }

  // Workflow statuts
  &.status-reported {
    background: #e0e7ff;
    color: #3730a3;
  }

  &.status-in-prediagnostic {
    background: #fef3c7;
    color: #92400e;
  }

  &.status-prediagnostic-completed {
    background: #d1fae5;
    color: #065f46;
  }

  &.status-in-quote {
    background: #dbeafe;
    color: #1e40af;
  }

  &.status-quote-received {
    background: #bfdbfe;
    color: #1e3a8a;
  }

  &.status-in-approval {
    background: #fde68a;
    color: #78350f;
  }

  &.status-approved {
    background: #86efac;
    color: #166534;
  }

  &.status-in-repair {
    background: #fbbf24;
    color: #92400e;
  }

  &.status-repair-completed {
    background: #6ee7b7;
    color: #047857;
  }

  &.status-in-reception {
    background: #93c5fd;
    color: #1e3a8a;
  }

  &.status-vehicle-received {
    background: #34d399;
    color: #064e3b;
  }

  &.status-cancelled {
    background: #fecaca;
    color: #991b1b;
  }

  // Statuts génériques
  &.status-pending {
    background: #fef3c7;
    color: #92400e;
  }

  &.status-in-progress {
    background: #dbeafe;
    color: #1e40af;
  }

  &.status-completed {
    background: #d1fae5;
    color: #065f46;
  }

  &.status-draft {
    background: #f3f4f6;
    color: #6b7280;
  }

  &.status-sent {
    background: #dbeafe;
    color: #1e40af;
  }

  &.status-accepted {
    background: #d1fae5;
    color: #065f46;
  }

  &.status-rejected {
    background: #fee2e2;
    color: #991b1b;
  }

  &.status-paid {
    background: #d1fae5;
    color: #065f46;
  }

  &.status-overdue {
    background: #fee2e2;
    color: #991b1b;
  }
}
</style>

