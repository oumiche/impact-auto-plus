<template>
  <DefaultLayout>
    <template #header>
      <h1>Factures d'intervention</h1>
      <p>Gérez la facturation et les paiements</p>
    </template>

    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvelle facture
      </button>
    </template>

    <!-- Recherche et bouton filtres -->
    <div class="search-filters-bar">
      <SearchBar 
        v-model="searchQuery" 
        placeholder="Rechercher par n°, intervention, véhicule..."
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
      <!-- Statut -->
      <div class="filter-section">
        <label class="filter-label">Statut</label>
        <select v-model="filters.paymentStatus" class="filter-control">
          <option value="all">Tous</option>
          <option value="draft">Brouillon</option>
          <option value="pending">En attente</option>
          <option value="partial">Paiement partiel</option>
          <option value="paid">Payée</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      <!-- Marque -->
      <div class="filter-section">
        <label class="filter-label">Marque</label>
        <BrandSelectorSearch
          v-model="filters.brandId"
          @change="handleBrandChange"
        />
      </div>

      <!-- Modèle -->
      <div class="filter-section">
        <label class="filter-label">Modèle</label>
        <ModelSelector
          v-model="filters.modelId"
          :brand-id="filters.brandId"
          :disabled="!filters.brandId"
        />
        <small v-if="!filters.brandId" class="filter-hint">Sélectionnez d'abord une marque</small>
      </div>

      <!-- Période -->
      <div class="filter-section">
        <label class="filter-label">Période</label>
        <div class="date-range">
          <div class="date-input-group">
            <label class="date-label">Date début</label>
            <input 
              type="date" 
              v-model="filters.dateStart"
              :max="filters.dateEnd || null"
              class="filter-control"
            />
          </div>
          <div class="date-input-group">
            <label class="date-label">Date fin</label>
            <input 
              type="date" 
              v-model="filters.dateEnd"
              :min="filters.dateStart || null"
              class="filter-control"
            />
          </div>
        </div>
      </div>
    </FilterPanel>

    <!-- Loading state -->
    <LoadingSpinner v-if="loading" text="Chargement des factures..." />

    <!-- Tableau de factures -->
    <div v-else-if="invoices.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Facture</th>
            <th>Intervention</th>
            <th>Date émission</th>
            <th>Échéance</th>
            <th>Montant TTC</th>
            <th>Statut</th>
            <th>Mode paiement</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id" :class="getInvoiceRowClass(invoice)">
            <td class="invoice-number">
              <i class="fas fa-file-invoice"></i>
              {{ invoice.invoiceNumber }}
            </td>
            <td>{{ invoice.intervention?.interventionNumber }} - {{ invoice.intervention?.title }}</td>
            <td>{{ formatDate(invoice.invoiceDate) }}</td>
            <td>
              {{ formatDate(invoice.dueDate) }}
              <span v-if="isOverdue(invoice)" class="overdue-indicator" title="En retard">
                <i class="fas fa-exclamation-triangle"></i>
              </span>
            </td>
            <td class="amount-cell">{{ formatCurrency(invoice.totalAmount) }}</td>
            <td>
              <span class="status-badge" :class="`status-${invoice.paymentStatus}`">
                <i :class="getPaymentStatusIcon(invoice.paymentStatus)"></i>
                {{ getPaymentStatusLabel(invoice.paymentStatus) }}
              </span>
            </td>
            <td>{{ getPaymentMethodLabel(invoice.paymentMethod) || '-' }}</td>
            <td class="actions-column">
              <div class="action-buttons">
                <button 
                  v-if="invoice.paymentStatus !== 'paid'"
                  @click="openPaymentModal(invoice)" 
                  class="btn-icon btn-payment" 
                  title="Marquer comme payée"
                >
                  <i class="fas fa-money-bill-wave"></i>
                </button>
                <button @click="downloadPdf(invoice)" class="btn-icon btn-pdf" title="Télécharger PDF">
                  <i class="fas fa-file-pdf"></i>
                </button>
                <button 
                  @click="openEditModal(invoice)" 
                  class="btn-icon btn-edit" 
                  title="Modifier"
                  :disabled="invoice.paymentStatus === 'paid'"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  @click="confirmDelete(invoice)" 
                  class="btn-icon btn-delete" 
                  title="Supprimer"
                  :disabled="invoice.paymentStatus === 'paid'"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- État vide -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-file-invoice"></i>
      </div>
      <h3>Aucune facture</h3>
      <p>Commencez par créer votre première facture</p>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Créer une facture
      </button>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="pagination.totalPages > 1"
      :current-page="pagination.currentPage"
      :total-pages="pagination.totalPages"
      :total-items="pagination.totalItems"
      @page-change="handlePageChange"
    />

    <!-- Modal Créer/Modifier -->
    <Modal
      v-model="showModal"
      :title="isEditing ? 'Modifier la facture' : 'Nouvelle facture'"
      size="xlarge"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit" class="invoice-form">
        <!-- Intervention et Devis -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention et Devis</h4>
          
          <div class="form-row">
            <InterventionSelector
              v-model="form.interventionId"
              label="Intervention"
              required
              :status-filter="['vehicle_received', 'repair_completed']"
              @change="handleInterventionChange"
            />

            <div class="form-group">
              <label>Copier depuis un devis</label>
              <select v-model="selectedQuoteId" @change="copyFromQuote" :disabled="!form.interventionId">
                <option :value="null">Saisie manuelle</option>
                <option v-for="quote in availableQuotes" :key="quote.id" :value="quote.id">
                  {{ quote.quoteNumber }} - {{ formatCurrency(quote.totalAmount) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="form-section">
          <h4><i class="fas fa-calendar"></i> Dates</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date d'émission <span class="required">*</span></label>
              <input
                v-model="form.invoiceDate"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label>Date d'échéance <span class="required">*</span></label>
              <input
                v-model="form.dueDate"
                type="date"
                required
              />
            </div>
          </div>
        </div>

        <!-- Lignes de facture -->
        <div class="form-section">
          <QuoteLineEditor
            v-model="form.lines"
            @change="handleLinesChange"
          />
        </div>

        <!-- Notes -->
        <div class="form-section">
          <h4><i class="fas fa-sticky-note"></i> Notes</h4>
          
          <div class="form-group">
            <textarea
              v-model="form.notes"
              rows="3"
              placeholder="Notes additionnelles..."
            ></textarea>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" @click="closeModal" class="btn-secondary">
          Annuler
        </button>
        <button type="submit" @click="handleSubmit" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </template>
    </Modal>

    <!-- Modal de paiement -->
    <Modal
      v-model="showPaymentModal"
      title="Enregistrer le paiement"
      size="medium"
      @close="closePaymentModal"
    >
      <form @submit.prevent="handlePayment" class="payment-form">
        <div class="payment-summary">
          <div class="summary-row">
            <span>Facture</span>
            <strong>{{ selectedInvoice?.invoiceNumber }}</strong>
          </div>
          <div class="summary-row total">
            <span>Montant à payer</span>
            <strong>{{ formatCurrency(selectedInvoice?.totalAmount) }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label>Date de paiement <span class="required">*</span></label>
          <input
            v-model="paymentForm.paidAt"
            type="date"
            required
          />
        </div>

        <div class="form-group">
          <label>Mode de paiement <span class="required">*</span></label>
          <select v-model="paymentForm.paymentMethod" required>
            <option value="">Sélectionner...</option>
            <option value="cash">Espèces</option>
            <option value="check">Chèque</option>
            <option value="card">Carte bancaire</option>
            <option value="transfer">Virement</option>
            <option value="mobile">Mobile money</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea
            v-model="paymentForm.notes"
            rows="2"
            placeholder="Référence de transaction, notes..."
          ></textarea>
        </div>
      </form>

      <template #footer>
        <button type="button" @click="closePaymentModal" class="btn-secondary">
          Annuler
        </button>
        <button type="submit" @click="handlePayment" class="btn-primary" :disabled="processingPayment">
          <i v-if="processingPayment" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check"></i>
          {{ processingPayment ? 'Traitement...' : 'Confirmer le paiement' }}
        </button>
      </template>
    </Modal>

    <!-- Notifications d'erreur -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import Modal from '@/components/common/Modal.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import QuoteLineEditor from '@/components/common/QuoteLineEditor.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import apiService from '@/services/api.service'

// Notifications
const { success, error, warning } = useNotification()

// État
const invoices = ref([])
const availableQuotes = ref([])
const selectedQuoteId = ref(null)
const loading = ref(false)
const saving = ref(false)
const processingPayment = ref(false)
const errorMessage = ref('')

// Modals
const showModal = ref(false)
const showPaymentModal = ref(false)
const showFiltersPanel = ref(false)
const isEditing = ref(false)

// Formulaire facture
const form = ref({
  interventionId: null,
  quoteId: null,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: getDefaultDueDate(),
  lines: [],
  notes: ''
})

// Formulaire paiement
const paymentForm = ref({
  paidAt: new Date().toISOString().split('T')[0],
  paymentMethod: '',
  notes: ''
})

const selectedInvoice = ref(null)

// Totaux
const invoiceTotals = ref({
  subtotal: 0,
  totalDiscount: 0,
  totalHT: 0,
  totalTVA: 0,
  totalTTC: 0
})

// Recherche et filtres
const searchQuery = ref('')
const filters = ref({
  paymentStatus: 'all',
  brandId: null,
  modelId: null,
  dateStart: null,
  dateEnd: null
})

// Compteur de filtres actifs
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.paymentStatus !== 'all') count++
  if (filters.value.brandId) count++
  if (filters.value.modelId) count++
  if (filters.value.dateStart) count++
  if (filters.value.dateEnd) count++
  return count
})

// Pagination
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 12
})

const currentPage = computed(() => pagination.value.currentPage)
const totalPages = computed(() => pagination.value.totalPages)

// Méthodes
function getDefaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 30) // +30 jours
  return date.toISOString().split('T')[0]
}

const loadInvoices = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.itemsPerPage
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (filters.value.paymentStatus !== 'all') {
      params.paymentStatus = filters.value.paymentStatus
    }

    if (filters.value.brandId) {
      params.brandId = filters.value.brandId
    }

    if (filters.value.modelId) {
      params.modelId = filters.value.modelId
    }

    if (filters.value.dateStart) {
      params.dateStart = filters.value.dateStart
    }

    if (filters.value.dateEnd) {
      params.dateEnd = filters.value.dateEnd
    }

    const response = await apiService.getInterventionInvoices(params)

    if (response.success) {
      invoices.value = response.data || []
      
      if (response.pagination) {
        pagination.value = {
          currentPage: response.pagination.currentPage || 1,
          totalPages: response.pagination.totalPages || 1,
          totalItems: response.pagination.totalItems || 0,
          itemsPerPage: response.pagination.itemsPerPage || 12
        }
      }
    } else {
      throw new Error(response.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading invoices:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    error('Erreur lors du chargement des factures')
  } finally {
    loading.value = false
  }
}

const loadQuotesForIntervention = async (interventionId) => {
  if (!interventionId) {
    availableQuotes.value = []
    return
  }

  try {
    const response = await apiService.getInterventionQuotes({
      interventionId: interventionId,
      isValidated: true,
      limit: 100
    })

    if (response.success) {
      availableQuotes.value = response.data || []
    }
  } catch (err) {
    console.error('Error loading quotes:', err)
  }
}

const copyFromQuote = async () => {
  if (!selectedQuoteId.value) {
    return
  }

  try {
    const response = await apiService.getInterventionQuote(selectedQuoteId.value)
    
    if (response.success && response.data) {
      form.value.quoteId = selectedQuoteId.value
      
      // Copier les lignes
      if (response.data.lines) {
        form.value.lines = response.data.lines.map(line => ({
          supplyId: line.supply?.id || null,
          workType: line.workType || 'supply',
          description: line.description || '',
          quantity: parseFloat(line.quantity) || 1,
          unitPrice: parseFloat(line.unitPrice) || 0,
          discountPercentage: parseFloat(line.discountPercentage) || null,
          discountAmount: parseFloat(line.discountAmount) || null,
          taxRate: parseFloat(line.taxRate) || 18,
          lineTotal: parseFloat(line.lineTotal) || 0,
          notes: line.notes || ''
        }))
        
        success('Lignes copiées depuis le devis')
      }
    }
  } catch (err) {
    console.error('Error loading quote:', err)
    error('Erreur lors du chargement du devis')
  }
}

const handleInterventionChange = (intervention) => {
  if (intervention) {
    loadQuotesForIntervention(intervention.id)
  } else {
    availableQuotes.value = []
    selectedQuoteId.value = null
  }
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadInvoices()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadInvoices()
}

const resetFilters = () => {
  filters.value = {
    paymentStatus: 'all',
    brandId: null,
    modelId: null,
    dateStart: null,
    dateEnd: null
  }
  pagination.value.currentPage = 1
  loadInvoices()
}

const handleBrandChange = () => {
  filters.value.modelId = null
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadInvoices()
}

const openCreateModal = () => {
  isEditing.value = false
  resetForm()
  showModal.value = true
}

const openEditModal = (invoice) => {
  if (invoice.paymentStatus === 'paid') {
    warning('Impossible de modifier une facture déjà payée')
    return
  }

  isEditing.value = true
  form.value = {
    id: invoice.id,
    interventionId: invoice.intervention?.id || null,
    quoteId: invoice.quote?.id || null,
    invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split(/[T\s]/)[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice.dueDate ? invoice.dueDate.split(/[T\s]/)[0] : getDefaultDueDate(),
    lines: invoice.lines ? invoice.lines.map(line => ({
      id: line.id,
      supplyId: line.supply?.id || null,
      workType: line.workType || 'supply',
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 1,
      unitPrice: parseFloat(line.unitPrice) || 0,
      discountPercentage: parseFloat(line.discountPercentage) || null,
      discountAmount: parseFloat(line.discountAmount) || null,
      taxRate: parseFloat(line.taxRate) || 18,
      lineTotal: parseFloat(line.lineTotal) || 0,
      notes: line.notes || ''
    })) : [],
    notes: invoice.notes || ''
  }
  
  if (form.value.interventionId) {
    loadQuotesForIntervention(form.value.interventionId)
  }
  
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    interventionId: null,
    quoteId: null,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: getDefaultDueDate(),
    lines: [],
    notes: ''
  }
  selectedQuoteId.value = null
  availableQuotes.value = []
  invoiceTotals.value = {
    subtotal: 0,
    totalDiscount: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0
  }
}

const handleLinesChange = (data) => {
  invoiceTotals.value = data.totals
}

const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (form.value.lines.length === 0) {
      warning('Veuillez ajouter au moins une ligne')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      quoteId: form.value.quoteId || null,
      invoiceDate: form.value.invoiceDate,
      dueDate: form.value.dueDate,
      subtotal: invoiceTotals.value.totalHT,
      taxAmount: invoiceTotals.value.totalTVA,
      totalAmount: invoiceTotals.value.totalTTC,
      lines: form.value.lines,
      notes: form.value.notes || null
    }

    let response
    if (isEditing.value) {
      response = await apiService.updateInterventionInvoice(form.value.id, data)
    } else {
      response = await apiService.createInterventionInvoice(data)
    }

    if (response.success) {
      success(isEditing.value ? 'Facture modifiée avec succès' : 'Facture créée avec succès')
      closeModal()
      await loadInvoices()
    } else {
      throw new Error(response.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving invoice:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const openPaymentModal = (invoice) => {
  selectedInvoice.value = invoice
  paymentForm.value = {
    paidAt: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    notes: ''
  }
  showPaymentModal.value = true
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  selectedInvoice.value = null
  paymentForm.value = {
    paidAt: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    notes: ''
  }
}

const handlePayment = async () => {
  try {
    if (!paymentForm.value.paymentMethod) {
      warning('Veuillez sélectionner un mode de paiement')
      return
    }

    processingPayment.value = true

    const data = {
      paymentMethod: paymentForm.value.paymentMethod,
      paidAt: paymentForm.value.paidAt,
      notes: paymentForm.value.notes || null
    }

    const response = await apiService.markInvoiceAsPaid(selectedInvoice.value.id, data)

    if (response.success) {
      success('Facture marquée comme payée')
      closePaymentModal()
      await loadInvoices()
    } else {
      throw new Error(response.message || 'Erreur lors du paiement')
    }
  } catch (err) {
    console.error('Error processing payment:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors du paiement')
  } finally {
    processingPayment.value = false
  }
}

const downloadPdf = async (invoice) => {
  try {
    const blob = await apiService.downloadInvoicePdf(invoice.id)
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoice.invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    success('PDF téléchargé avec succès')
  } catch (err) {
    console.error('Error downloading PDF:', err)
    error('Erreur lors du téléchargement du PDF')
  }
}

const confirmDelete = async (invoice) => {
  if (invoice.paymentStatus === 'paid') {
    warning('Impossible de supprimer une facture déjà payée')
    return
  }

  if (!confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoiceNumber} ?`)) {
    return
  }

  try {
    const response = await apiService.deleteInterventionInvoice(invoice.id)
    if (response.success) {
      success('Facture supprimée avec succès')
      await loadInvoices()
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting invoice:', err)
    error(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}

// Helpers
const getInvoiceStatusClass = (invoice) => {
  if (invoice.paymentStatus === 'paid') return 'invoice-paid'
  if (isOverdue(invoice)) return 'invoice-overdue'
  return ''
}

const getInvoiceRowClass = (invoice) => {
  if (invoice.paymentStatus === 'paid') return 'row-paid'
  if (isOverdue(invoice)) return 'row-overdue'
  return ''
}

const isOverdue = (invoice) => {
  if (invoice.paymentStatus === 'paid' || !invoice.dueDate) return false
  const today = new Date()
  const dueDate = new Date(invoice.dueDate)
  return dueDate < today
}

const getPaymentStatusLabel = (status) => {
  const labels = {
    draft: 'Brouillon',
    pending: 'En attente',
    partial: 'Paiement partiel',
    paid: 'Payée',
    overdue: 'En retard'
  }
  return labels[status] || status
}

const getPaymentStatusIcon = (status) => {
  const icons = {
    draft: 'fa-file',
    pending: 'fa-clock',
    partial: 'fa-coins',
    paid: 'fa-check-circle',
    overdue: 'fa-exclamation-triangle'
  }
  return icons[status] || 'fa-file-invoice'
}

const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: 'Espèces',
    check: 'Chèque',
    card: 'Carte bancaire',
    transfer: 'Virement',
    mobile: 'Mobile money',
    other: 'Autre'
  }
  return labels[method] || method
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
  if (!amount && amount !== 0) return '0 XOF'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

// Lifecycle
onMounted(() => {
  loadInvoices()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.invoice-number {
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: #3b82f6;
  }
}

.row-paid {
  background: #f0fdf4 !important;
}

.row-overdue {
  background: #fef2f2 !important;
}

.amount-cell {
  font-weight: 700;
  color: #1f2937;
  font-size: 1.05rem;
}

.overdue-indicator {
  margin-left: 0.5rem;
  color: #ef4444;

  i {
    font-size: 0.9rem;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;

  &.status-draft {
    background: #f3f4f6;
    color: #6b7280;
  }

  &.status-pending {
    background: #fef3c7;
    color: #92400e;
  }

  &.status-partial {
    background: #dbeafe;
    color: #1e40af;
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

.btn-payment {
  color: #10b981;
  
  &:hover {
    background: #d1fae5;
    color: #059669;
  }
}

.btn-pdf {
  color: #ef4444;
  
  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
}

.invoice-form,
.payment-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payment-summary {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }

  &.total {
    padding-top: 1rem;
    border-top: 3px solid #3b82f6;
    margin-top: 0.5rem;

    span,
    strong {
      font-size: 1.25rem;
      color: #1f2937;
    }
  }

  span {
    color: #6b7280;
    font-size: 0.95rem;
  }

  strong {
    color: #1f2937;
    font-size: 1.05rem;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #3b82f6;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }
}
</style>

