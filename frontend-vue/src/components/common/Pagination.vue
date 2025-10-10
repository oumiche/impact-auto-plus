<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      @click="goToPage(1)"
      :disabled="currentPage === 1"
      class="pagination-btn"
      title="Première page"
    >
      «
    </button>
    
    <button
      @click="goToPage(currentPage - 1)"
      :disabled="currentPage === 1"
      class="pagination-btn"
      title="Page précédente"
    >
      ‹
    </button>

    <div class="pagination-pages">
      <button
        v-for="page in visiblePages"
        :key="page"
        @click="goToPage(page)"
        :class="['pagination-btn', { active: page === currentPage }]"
      >
        {{ page }}
      </button>
    </div>

    <button
      @click="goToPage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="pagination-btn"
      title="Page suivante"
    >
      ›
    </button>

    <button
      @click="goToPage(totalPages)"
      :disabled="currentPage === totalPages"
      class="pagination-btn"
      title="Dernière page"
    >
      »
    </button>

    <div class="pagination-info">
      Page {{ currentPage }} sur {{ totalPages }} ({{ total }} résultat{{ total > 1 ? 's' : '' }})
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['page-change'])

const visiblePages = computed(() => {
  const pages = []
  const half = Math.floor(props.maxVisiblePages / 2)
  
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(props.totalPages, start + props.maxVisiblePages - 1)
  
  // Ajuster le début si on est proche de la fin
  if (end - start + 1 < props.maxVisiblePages) {
    start = Math.max(1, end - props.maxVisiblePages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<style scoped lang="scss">
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1.5rem 0;
  flex-wrap: wrap;
}

.pagination-btn {
  min-width: 40px;
  height: 40px;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e2e8f0;
  background: white;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #2563eb;
    color: #2563eb;
    transform: translateY(-2px);
  }

  &.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
    cursor: default;
    transform: none;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
}

.pagination-pages {
  display: flex;
  gap: 0.5rem;
}

.pagination-info {
  margin-left: 1rem;
  color: #64748b;
  font-size: 0.875rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .pagination {
    gap: 0.25rem;
  }

  .pagination-btn {
    min-width: 36px;
    height: 36px;
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .pagination-info {
    width: 100%;
    text-align: center;
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>

