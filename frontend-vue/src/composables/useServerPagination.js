import { ref } from 'vue'

/**
 * Composable pour gérer la pagination et la recherche côté serveur
 * @param {Function} fetchFunction - Fonction pour charger les données (doit accepter params)
 * @param {number} defaultLimit - Nombre d'éléments par page (défaut: 12)
 */
export function useServerPagination(fetchFunction, defaultLimit = 12) {
  const items = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const pagination = ref({
    page: 1,
    limit: defaultLimit,
    total: 0,
    totalPages: 0
  })

  let searchTimeout = null

  /**
   * Charger les données avec pagination et recherche
   */
  const loadItems = async () => {
    try {
      loading.value = true
      const params = {
        page: pagination.value.page,
        limit: pagination.value.limit
      }

      if (searchQuery.value) {
        params.search = searchQuery.value
      }

      const response = await fetchFunction(params)
      items.value = response.data || []

      // Mettre à jour les infos de pagination
      if (response.pagination) {
        pagination.value.total = response.pagination.total
        pagination.value.totalPages = response.pagination.totalPages || response.pagination.pages
      }
    } catch (error) {
      console.error('Error loading items:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Gérer la recherche avec debounce
   */
  const handleSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout)

    searchTimeout = setTimeout(() => {
      pagination.value.page = 1
      loadItems()
    }, 500)
  }

  /**
   * Changer de page
   */
  const handlePageChange = (page) => {
    pagination.value.page = page
    loadItems()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * Recharger les données (utile après création/modification/suppression)
   */
  const reload = () => {
    loadItems()
  }

  /**
   * Reset à la première page
   */
  const resetToFirstPage = () => {
    pagination.value.page = 1
    loadItems()
  }

  return {
    // State
    items,
    loading,
    searchQuery,
    pagination,
    // Methods
    loadItems,
    handleSearch,
    handlePageChange,
    reload,
    resetToFirstPage
  }
}

