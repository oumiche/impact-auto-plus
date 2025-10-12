<template>
  <DefaultLayout>
    <template #header>
      <h1>Vérifications Terrain</h1>
      <p>Gestion des vérifications terrain des interventions</p>
    </template>

    <template #header-actions>
      <button @click="goToCreate" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvelle vérification
      </button>
    </template>

    <!-- Recherche et bouton filtres -->
    <div class="search-filters-bar">
      <SearchBar 
        v-model="searchQuery" 
        placeholder="Rechercher par intervention, constatations..."
        @search="handleSearch"
      />
      <button @click="showFiltersPanel = true" class="btn-filters">
        <i class="fas fa-filter"></i>
        Filtres
        <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
      </button>
    </div>

    <!-- Panneau de filtres latéral -->
    <FilterPanel
      v-model="showFiltersPanel"
      :active-filters-count="activeFiltersCount"
      @apply="applyFilters"
      @reset="resetFilters"
    >
      <!-- Type de vérification -->
      <div class="filter-section">
        <label class="filter-label">Type de vérification</label>
        <select v-model="filters.verificationType" class="filter-control">
          <option value="">Tous les types</option>
          <option value="before_work">Avant travaux</option>
          <option value="during_work">Pendant travaux</option>
          <option value="after_work">Après travaux</option>
        </select>
      </div>

      <!-- Satisfaisant -->
      <div class="filter-section">
        <label class="filter-label">Résultat</label>
        <select v-model="filters.isSatisfactory" class="filter-control">
          <option value="">Tous</option>
          <option value="true">Satisfaisant</option>
          <option value="false">Non satisfaisant</option>
          <option value="null">En attente</option>
        </select>
      </div>

      <!-- Vérifié par -->
      <div class="filter-section">
        <label class="filter-label">Vérifié par</label>
        <SimpleSelector
          v-model="filters.verifiedBy"
          api-method="getCollaborateurs"
          placeholder="Tous"
        />
      </div>

      <!-- Période -->
      <div class="filter-section">
        <label class="filter-label">Période</label>
        <div class="date-range">
          <div class="date-input-group">
            <label class="date-label">Date début</label>
            <input 
              type="date" 
              v-model="filters.dateFrom"
              :max="filters.dateTo || null"
              class="filter-control"
            />
          </div>
          <div class="date-input-group">
            <label class="date-label">Date fin</label>
            <input 
              type="date" 
              v-model="filters.dateTo"
              :min="filters.dateFrom || null"
              class="filter-control"
            />
          </div>
        </div>
      </div>
    </FilterPanel>

    <!-- Table -->
    <div class="table-container">
      <LoadingSpinner v-if="loading" text="Chargement des vérifications..." />

      <div v-else-if="verifications.length === 0" class="empty-state">
        <i class="fas fa-clipboard-check"></i>
        <p>Aucune vérification trouvée</p>
        <button @click="goToCreate" class="btn-primary">
          <i class="fas fa-plus"></i>
          Créer la première vérification
        </button>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>N° Vérification</th>
            <th>Intervention</th>
            <th>Type</th>
            <th>Date</th>
            <th>Vérifié par</th>
            <th>Résultat</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="verification in verifications" :key="verification.id">
            <td class="verification-number">
              <i class="fas fa-clipboard-check"></i>
              {{ verification.verificationNumber || `VERIF-${verification.id}` }}
            </td>
            <td>
              <div class="intervention-cell">
                <span class="intervention-number">{{ verification.intervention?.interventionNumber || 'N/A' }}</span>
                <span class="intervention-title">{{ verification.intervention?.title || '' }}</span>
              </div>
            </td>
            <td>
              <span class="type-badge" :class="`type-${verification.verificationType}`">
                <i :class="getTypeIcon(verification.verificationType)"></i>
                {{ verification.verificationTypeLabel }}
              </span>
            </td>
            <td>{{ formatDate(verification.verificationDate) }}</td>
            <td>{{ getCollaboratorLabel(verification.verifiedBy) }}</td>
            <td>
              <span class="result-badge" :class="getResultClass(verification.isSatisfactory)">
                <i :class="getResultIcon(verification.isSatisfactory)"></i>
                {{ verification.satisfactionLabel }}
              </span>
            </td>
            <td class="actions-column">
              <div class="action-buttons">
                <button
                  @click="goToEdit(verification.id)"
                  class="btn-icon btn-edit"
                  title="Modifier"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click="confirmDelete(verification)"
                  class="btn-icon btn-delete"
                  title="Supprimer"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn-pagination"
        >
          <i class="fas fa-chevron-left"></i>
          Précédent
        </button>

        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="{ active: page === currentPage }"
            class="btn-page"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn-pagination"
        >
          Suivant
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import { useConfirm } from '@/composables/useConfirm'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const { success, error, warning } = useNotification()
const { confirm } = useConfirm()

// État
const loading = ref(false)
const verifications = ref([])
const searchQuery = ref('')
const showFiltersPanel = ref(false)

// Pagination
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(15)

// Tri
const sortBy = ref('verificationDate')
const sortOrder = ref('desc')

// Filtres
const filters = ref({
  verificationType: '',
  isSatisfactory: '',
  verifiedBy: null,
  dateFrom: '',
  dateTo: ''
})

// Computed
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.verificationType) count++
  if (filters.value.isSatisfactory) count++
  if (filters.value.verifiedBy) count++
  if (filters.value.dateFrom) count++
  if (filters.value.dateTo) count++
  return count
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Méthodes
const loadVerifications = async () => {
  try {
    loading.value = true

    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      ...filters.value
    }

    const response = await apiService.getInterventionFieldVerifications(params)

    if (response.success) {
      verifications.value = response.data || []
      totalPages.value = response.totalPages || 1
    } else {
      throw new Error(response.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading field verifications:', err)
    error('Erreur lors du chargement des vérifications')
    verifications.value = []
  } finally {
    loading.value = false
  }
}

// Navigation
const goToCreate = () => {
  router.push({ name: 'InterventionFieldVerificationCreate' })
}

const goToEdit = (id) => {
  router.push({ name: 'InterventionFieldVerificationEdit', params: { id } })
}

const confirmDelete = async (verification) => {
  const interventionInfo = verification.intervention?.interventionNumber || `#${verification.id}`
  
  try {
    await confirm({
      title: 'Supprimer la vérification',
      message: `Êtes-vous sûr de vouloir supprimer la vérification de l'intervention ${interventionInfo} ? Cette action est irréversible.`,
      type: 'danger',
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler',
      confirmIcon: 'fas fa-trash'
    })
  } catch {
    return // L'utilisateur a annulé
  }

  try {
    const response = await apiService.deleteInterventionFieldVerification(verification.id)

    if (response.success) {
      success('Vérification supprimée avec succès')
      await loadVerifications()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting verification:', err)
    error('Erreur lors de la suppression')
  }
}

const sort = (field) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
  loadVerifications()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadVerifications()
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadVerifications()
}

const applyFilters = () => {
  currentPage.value = 1
  showFiltersPanel.value = false
  loadVerifications()
}

const resetFilters = () => {
  filters.value = {
    verificationType: '',
    isSatisfactory: '',
    verifiedBy: null,
    dateFrom: '',
    dateTo: ''
  }
  currentPage.value = 1
  loadVerifications()
}

// Helpers
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getVerificationTypeLabel = (type) => {
  const types = {
    before_work: 'Avant travaux',
    during_work: 'Pendant travaux',
    after_work: 'Après travaux'
  }
  return types[type] || type
}

const getTypeIcon = (type) => {
  const icons = {
    before_work: 'fas fa-clipboard-list',
    during_work: 'fas fa-tools',
    after_work: 'fas fa-check-double'
  }
  return icons[type] || 'fas fa-clipboard-check'
}

const getResultLabel = (isSatisfactory) => {
  if (isSatisfactory === null || isSatisfactory === undefined) return 'En attente'
  return isSatisfactory ? 'Satisfaisant' : 'Non satisfaisant'
}

const getResultIcon = (isSatisfactory) => {
  if (isSatisfactory === null || isSatisfactory === undefined) return 'fas fa-clock'
  return isSatisfactory ? 'fas fa-check-circle' : 'fas fa-times-circle'
}

const getCollaboratorLabel = (collaborator) => {
  if (!collaborator) return '-'
  if (typeof collaborator === 'object') {
    return `${collaborator.firstName || ''} ${collaborator.lastName || ''}`.trim() || '-'
  }
  return collaborator
}

const getResultClass = (isSatisfactory) => {
  if (isSatisfactory === null || isSatisfactory === undefined) return 'result-pending'
  return isSatisfactory ? 'result-satisfactory' : 'result-unsatisfactory'
}

// Lifecycle
onMounted(() => {
  loadVerifications()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.verification-number {
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: #7c3aed;
  }
}

.intervention-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .intervention-number {
    font-weight: 600;
    color: #3b82f6;
    font-size: 0.9rem;
  }

  .intervention-title {
    font-size: 0.85rem;
    color: #6b7280;
  }
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;

  i {
    font-size: 0.9rem;
  }

  &.type-before_work {
    background: #dbeafe;
    color: #1e40af;
    
    i {
      color: #3b82f6;
    }
  }

  &.type-during_work {
    background: #fef3c7;
    color: #92400e;
    
    i {
      color: #f59e0b;
    }
  }

  &.type-after_work {
    background: #d1fae5;
    color: #065f46;
    
    i {
      color: #10b981;
    }
  }
}

.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;

  i {
    font-size: 0.9rem;
  }

  &.result-satisfactory {
    background: #d1fae5;
    color: #065f46;
    
    i {
      color: #10b981;
    }
  }

  &.result-unsatisfactory {
    background: #fee2e2;
    color: #991b1b;
    
    i {
      color: #ef4444;
    }
  }

  &.result-pending {
    background: #fef3c7;
    color: #92400e;
    
    i {
      color: #f59e0b;
    }
  }
}
</style>

