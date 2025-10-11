<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouveau prix
      </button>
    </template>

    <div class="supply-prices-page">
      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher (description, fourniture, garage, fournisseur)..."
        @search="handleSearch"
      />

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Type de travail</label>
          <select v-model="filters.workType" @change="loadPrices">
            <option value="all">Tous</option>
            <option value="labor">Main d'œuvre</option>
            <option value="supply">Pièces / Fournitures</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Source</label>
          <select v-model="filters.sourceType" @change="loadPrices">
            <option value="all">Toutes</option>
            <option value="manual">Manuel</option>
            <option value="auto">Automatique</option>
            <option value="import">Import</option>
            <option value="catalog">Catalogue</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Anomalies</label>
          <select v-model="filters.isAnomaly" @change="loadPrices">
            <option value="all">Toutes</option>
            <option value="true">Anomalies uniquement</option>
            <option value="false">Prix normaux</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Année</label>
          <input 
            type="number" 
            v-model.number="filters.year" 
            placeholder="Ex: 2025"
            @change="loadPrices"
            min="1990"
            :max="currentYear"
          />
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading && !prices.length" text="Chargement de l'historique des prix..." />

      <!-- Prices List -->
      <div v-else-if="prices.length > 0">
        <div class="prices-grid">
          <div
            v-for="price in prices"
            :key="price.id"
            class="price-card"
            :class="{ 'has-anomaly': price.isAnomaly }"
          >
            <div class="price-header">
              <div class="header-left">
                <h3>{{ price.description }}</h3>
                <div class="badges">
                  <span class="badge badge-type" :class="`type-${price.workType}`">
                    {{ getWorkTypeLabel(price.workType) }}
                  </span>
                  <span v-if="price.category" class="badge badge-category">
                    {{ price.category }}
                  </span>
                  <span class="badge badge-source" :class="`source-${price.sourceType}`">
                    {{ getSourceLabel(price.sourceType) }}
                  </span>
                </div>
              </div>
              <div class="price-actions">
                <button @click="openEditModal(price)" class="btn-icon btn-edit" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(price)" class="btn-icon btn-delete" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="price-details">
              <!-- Pricing Info -->
              <div class="pricing-section">
                <div class="price-item">
                  <span class="label">Prix unitaire:</span>
                  <span class="value">{{ formatPrice(price.unitPrice) }} {{ price.currency }}</span>
                </div>
                <div class="price-item">
                  <span class="label">Quantité:</span>
                  <span class="value">{{ price.quantity }}</span>
                </div>
                <div class="price-item total">
                  <span class="label">Prix total:</span>
                  <span class="value total-value">{{ formatPrice(price.totalPrice) }} {{ price.currency }}</span>
                </div>
              </div>

              <!-- Vehicle Context -->
              <div class="vehicle-context">
                <div class="context-header">
                  <i class="fas fa-car"></i>
                  <strong>Contexte véhicule</strong>
                </div>
                <div class="context-info">
                  <span v-if="price.vehicleBrand">{{ price.vehicleBrand.name }}</span>
                  <span v-if="price.vehicleModel">{{ price.vehicleModel.name }}</span>
                  <span v-if="price.vehicleYear" class="year">{{ price.vehicleYear }}</span>
                </div>
              </div>

              <!-- Anomaly Detection -->
              <div v-if="price.isAnomaly" class="anomaly-section" :class="`anomaly-${getAnomalyLevel(price.deviationPercent)}`">
                <div class="anomaly-header">
                  <i class="fas fa-exclamation-triangle"></i>
                  <strong>Anomalie détectée</strong>
                </div>
                <div class="anomaly-details">
                  <span class="deviation">Écart: {{ price.deviationPercent }}%</span>
                  <span v-if="price.priceRank" class="rank">Rang: {{ getPriceRankLabel(price.priceRank) }}</span>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="additional-info">
                <div v-if="price.garage" class="info-item">
                  <i class="fas fa-warehouse"></i>
                  <span>{{ price.garage }}</span>
                </div>
                <div v-if="price.supplier" class="info-item">
                  <i class="fas fa-truck"></i>
                  <span>{{ price.supplier }}</span>
                </div>
                <div v-if="price.supply" class="info-item">
                  <i class="fas fa-box"></i>
                  <span>{{ price.supply.name }}</span>
                </div>
              </div>

              <!-- Meta Info -->
              <div class="meta-info">
                <span class="meta-item">
                  <i class="fas fa-calendar"></i>
                  {{ formatDate(price.recordedAt) }}
                </span>
                <span v-if="price.createdBy" class="meta-item">
                  <i class="fas fa-user"></i>
                  {{ price.createdBy.firstName }} {{ price.createdBy.lastName }}
                </span>
              </div>

              <!-- Notes -->
              <div v-if="price.notes" class="notes">
                <i class="fas fa-sticky-note"></i>
                <p>{{ price.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total="pagination.total || 0"
          @page-change="handlePageChange"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="fas fa-dollar-sign"></i></div>
        <h3>Aucun historique de prix</h3>
        <p>Commencez par enregistrer votre premier prix</p>
        <button @click="openCreateModal" class="btn-primary">
          <i class="fas fa-plus"></i>
          Enregistrer un prix
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>

      <!-- Create/Edit Modal -->
      <Modal
        v-model="showModal"
        :title="isEditing ? 'Modifier le prix' : 'Nouveau prix'"
        size="large"
      >
        <form @submit.prevent="handleSubmit" class="price-form" id="priceForm">
          <!-- Fourniture -->
          <div class="form-group">
            <SupplySelector
              v-model="form.supplyId"
              label="Fourniture / Service"
              :required="true"
              statusFilter="active"
              @change="handleSupplyChange"
            />
          </div>

          <!-- Description et Type -->
          <div class="form-row">
            <div class="form-group flex-2">
              <label for="description">Description <span class="required">*</span></label>
              <input
                id="description"
                v-model="form.description"
                type="text"
                placeholder="Ex: Changement plaquettes de frein avant"
                required
              />
            </div>

            <div class="form-group">
              <label for="workType">Type <span class="required">*</span></label>
              <select id="workType" v-model="form.workType" required>
                <option value="labor">Main d'œuvre</option>
                <option value="supply">Pièces / Fournitures</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Catégorie</label>
              <input
                id="category"
                v-model="form.category"
                type="text"
                placeholder="Ex: Freinage"
              />
            </div>

            <div class="form-group">
              <label for="sourceType">Source <span class="required">*</span></label>
              <select id="sourceType" v-model="form.sourceType" required>
                <option value="manual">Manuel</option>
                <option value="auto">Automatique</option>
                <option value="import">Import</option>
                <option value="catalog">Catalogue</option>
              </select>
            </div>
          </div>

          <!-- Prix -->
          <div class="form-section pricing-section">
            <h4><i class="fas fa-dollar-sign"></i> Tarification</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="unitPrice">Prix unitaire <span class="required">*</span></label>
                <input
                  id="unitPrice"
                  v-model.number="form.unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  @input="calculateTotal"
                />
              </div>

              <div class="form-group">
                <label for="quantity">Quantité <span class="required">*</span></label>
                <input
                  id="quantity"
                  v-model.number="form.quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1.00"
                  required
                  @input="calculateTotal"
                />
              </div>

              <div class="form-group">
                <label for="totalPrice">Prix total</label>
                <input
                  id="totalPrice"
                  :value="calculatedTotal"
                  type="text"
                  readonly
                  disabled
                  class="calculated-field"
                />
                <small class="form-hint">Calculé automatiquement</small>
              </div>
            </div>
          </div>

          <!-- Contexte Véhicule -->
          <div class="form-section vehicle-section">
            <h4><i class="fas fa-car"></i> Contexte véhicule</h4>
            <div class="form-row">
              <div class="form-group">
                <BrandSelectorSearch
                  v-model="form.vehicleBrandId"
                  label="Marque"
                  placeholder="Rechercher une marque..."
                  @change="handleBrandChange"
                />
              </div>

              <div class="form-group">
                <ModelSelector
                  v-model="form.vehicleModelId"
                  :brandId="form.vehicleBrandId"
                  label="Modèle"
                  placeholder="Rechercher un modèle..."
                  :disabled="!form.vehicleBrandId"
                />
              </div>

              <div class="form-group">
                <label for="vehicleYear">Année <span class="required">*</span></label>
                <input
                  id="vehicleYear"
                  v-model.number="form.vehicleYear"
                  type="number"
                  min="1990"
                  :max="currentYear + 1"
                  placeholder="2025"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Contexte Temporel -->
          <div class="form-section">
            <h4><i class="fas fa-calendar"></i> Contexte temporel</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="recordedAt">Date d'enregistrement <span class="required">*</span></label>
                <input
                  id="recordedAt"
                  v-model="form.recordedAt"
                  type="datetime-local"
                  required
                />
              </div>

              <div class="form-group">
                <label for="validFrom">Valide depuis</label>
                <input
                  id="validFrom"
                  v-model="form.validFrom"
                  type="date"
                />
              </div>

              <div class="form-group">
                <label for="validUntil">Valide jusqu'au</label>
                <input
                  id="validUntil"
                  v-model="form.validUntil"
                  type="date"
                />
              </div>
            </div>
          </div>

          <!-- Informations supplémentaires -->
          <div class="form-row">
            <div class="form-group">
              <label for="garage">Garage</label>
              <input
                id="garage"
                v-model="form.garage"
                type="text"
                placeholder="Nom du garage"
              />
            </div>

            <div class="form-group">
              <label for="supplier">Fournisseur</label>
              <input
                id="supplier"
                v-model="form.supplier"
                type="text"
                placeholder="Nom du fournisseur"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              placeholder="Notes ou commentaires"
            ></textarea>
          </div>
        </form>

        <template #footer>
          <button @click="closeModal" class="btn-secondary">Annuler</button>
          <button form="priceForm" type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}
          </button>
        </template>
      </Modal>
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
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SupplySelector from '@/components/common/SupplySelector.vue'
import BrandSelectorSearch from '@/components/common/BrandSelectorSearch.vue'
import ModelSelector from '@/components/common/ModelSelector.vue'
import apiService from '@/services/api.service'

const { success, error: showError } = useNotification()

const prices = ref([])
const loading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)

const searchQuery = ref('')
const filters = ref({
  workType: 'all',
  sourceType: 'all',
  isAnomaly: 'all',
  year: null
})

const pagination = ref({
  total: 0,
  page: 1,
  limit: 12
})

const form = ref({
  supplyId: null,
  description: '',
  workType: 'supply',
  category: '',
  unitPrice: 0,
  quantity: 1,
  vehicleBrandId: null,
  vehicleModelId: null,
  vehicleYear: new Date().getFullYear(),
  recordedAt: '',
  validFrom: '',
  validUntil: '',
  sourceType: 'manual',
  garage: '',
  supplier: '',
  notes: ''
})

const currentYear = new Date().getFullYear()
const currentPage = computed(() => pagination.value.page)
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

const calculatedTotal = computed(() => {
  const total = (form.value.unitPrice || 0) * (form.value.quantity || 1)
  return total.toFixed(2)
})

onMounted(async () => {
  // Initialiser recordedAt avec la date actuelle
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - (offset * 60 * 1000))
  form.value.recordedAt = localDate.toISOString().slice(0, 16)
  
  await loadPrices()
})

const loadPrices = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (filters.value.workType !== 'all') {
      params.workType = filters.value.workType
    }

    if (filters.value.sourceType !== 'all') {
      params.sourceType = filters.value.sourceType
    }

    if (filters.value.isAnomaly !== 'all') {
      params.isAnomaly = filters.value.isAnomaly === 'true'
    }

    if (filters.value.year) {
      params.year = filters.value.year
    }

    const result = await apiService.getSupplyPrices(params)
    
    if (result.success) {
      prices.value = result.data || []
      pagination.value.total = result.pagination?.total || result.data?.length || 0
    } else {
      throw new Error(result.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading prices:', err)
    const errMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    showError(errMsg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadPrices()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadPrices()
}

const formatPrice = (price) => {
  return parseFloat(price || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getWorkTypeLabel = (type) => {
  const labels = {
    labor: 'Main d\'œuvre',
    supply: 'Pièces / Fournitures',
    parts: 'Pièces / Fournitures', // Alias pour compatibilité affichage
    other: 'Autre'
  }
  return labels[type] || type
}

const getSourceLabel = (source) => {
  const labels = {
    manual: 'Manuel',
    auto: 'Auto',
    import: 'Import',
    catalog: 'Catalogue'
  }
  return labels[source] || source
}

const getAnomalyLevel = (deviation) => {
  const abs = Math.abs(deviation || 0)
  if (abs > 50) return 'critical'
  if (abs > 30) return 'high'
  if (abs > 20) return 'medium'
  return 'low'
}

const getPriceRankLabel = (rank) => {
  const labels = {
    very_low: 'Très bas',
    low: 'Bas',
    below_average: 'En dessous de la moyenne',
    average: 'Moyen',
    above_average: 'Au dessus de la moyenne',
    high: 'Élevé',
    very_high: 'Très élevé'
  }
  return labels[rank] || rank
}

const calculateTotal = () => {
  // Le computed calculatedTotal se met à jour automatiquement
}

const handleSupplyChange = (supply) => {
  if (supply) {
    // Auto-remplir certains champs depuis la fourniture
    if (supply.name && !form.value.description) {
      form.value.description = supply.name
    }
    if (supply.category && !form.value.category) {
      form.value.category = typeof supply.category === 'object' ? supply.category.name : supply.category
    }
    if (supply.unitPrice && form.value.unitPrice === 0) {
      form.value.unitPrice = parseFloat(supply.unitPrice)
    }
  }
}

const handleBrandChange = () => {
  // Reset model when brand changes
  form.value.vehicleModelId = null
}

const openCreateModal = () => {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

const openEditModal = (price) => {
  form.value = {
    id: price.id,
    supplyId: price.supply?.id || null,
    description: price.description,
    workType: price.workType,
    category: price.category || '',
    unitPrice: parseFloat(price.unitPrice),
    quantity: parseFloat(price.quantity),
    vehicleBrandId: price.vehicleBrand?.id || null,
    vehicleModelId: price.vehicleModel?.id || null,
    vehicleYear: price.vehicleYear || currentYear,
    recordedAt: price.recordedAt ? new Date(price.recordedAt).toISOString().slice(0, 16) : '',
    validFrom: price.validFrom || '',
    validUntil: price.validUntil || '',
    sourceType: price.sourceType,
    garage: price.garage || '',
    supplier: price.supplier || '',
    notes: price.notes || ''
  }
  isEditing.value = true
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  setTimeout(() => {
    resetForm()
    isEditing.value = false
  }, 300)
}

const resetForm = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - (offset * 60 * 1000))
  
  form.value = {
    supplyId: null,
    description: '',
    workType: 'supply',
    category: '',
    unitPrice: 0,
    quantity: 1,
    vehicleBrandId: null,
    vehicleModelId: null,
    vehicleYear: currentYear,
    recordedAt: localDate.toISOString().slice(0, 16),
    validFrom: '',
    validUntil: '',
    sourceType: 'manual',
    garage: '',
    supplier: '',
    notes: ''
  }
}

const handleSubmit = async () => {
  saving.value = true
  try {
    const data = {
      supplyId: form.value.supplyId,
      description: form.value.description,
      workType: form.value.workType,
      category: form.value.category || null,
      unitPrice: form.value.unitPrice,
      quantity: form.value.quantity,
      vehicleBrandId: form.value.vehicleBrandId || null,
      vehicleModelId: form.value.vehicleModelId || null,
      vehicleYear: form.value.vehicleYear,
      recordedAt: form.value.recordedAt,
      validFrom: form.value.validFrom || null,
      validUntil: form.value.validUntil || null,
      sourceType: form.value.sourceType,
      garage: form.value.garage || null,
      supplier: form.value.supplier || null,
      notes: form.value.notes || null
    }

    console.log('Sending data to backend:', data)

    let result
    if (isEditing.value) {
      result = await apiService.updateSupplyPrice(form.value.id, data)
    } else {
      result = await apiService.createSupplyPrice(data)
    }

    if (result.success) {
      success(isEditing.value ? 'Prix modifié avec succès' : 'Prix enregistré avec succès')
      closeModal()
      await loadPrices()
    } else {
      throw new Error(result.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (err) {
    console.error('Error saving price:', err)
    console.error('Error details:', err.response?.data)
    showError(err.response?.data?.error || err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (price) => {
  if (!confirm(
    `Êtes-vous sûr de vouloir supprimer cet enregistrement ?\n\n` +
    `Description : ${price.description}\n` +
    `Prix : ${formatPrice(price.totalPrice)} ${price.currency}\n\n` +
    `Cette action est irréversible.`
  )) {
    return
  }

  try {
    const result = await apiService.deleteSupplyPrice(price.id)
    
    if (result.success) {
      success('Prix supprimé avec succès')
      await loadPrices()
    } else {
      throw new Error(result.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting price:', err)
    showError(err.response?.data?.message || err.message || 'Erreur lors de la suppression')
  }
}
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.supply-prices-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 600;
      font-size: 0.9rem;
      color: #4b5563;
    }

    select, input {
      padding: 0.625rem;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 0.95rem;
      min-width: 150px;
      transition: all 0.3s;

      &:focus {
        outline: none;
        border-color: #2563eb;
      }
    }
  }
}

.prices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.price-card {
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

  &.has-anomaly {
    border-color: #fca5a5;
    background: linear-gradient(to bottom, #fef2f2, white);
  }

  .price-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f3f4f6;

    .header-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #1f2937;
        font-weight: 700;
        line-height: 1.4;
      }

      .badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
    }

    .price-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .price-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .pricing-section {
      padding: 0.875rem;
      background: #f0fdf4;
      border-radius: 8px;
      border-left: 4px solid #10b981;

      .price-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 600;
          color: #374151;
        }

        .value {
          font-family: monospace;
          font-size: 1rem;
          color: #059669;
        }

        &.total {
          padding-top: 0.5rem;
          border-top: 2px solid #bbf7d0;
          margin-top: 0.5rem;

          .total-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #047857;
          }
        }
      }
    }

    .vehicle-context {
      padding: 0.875rem;
      background: #eff6ff;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;

      .context-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        color: #1e40af;

        i {
          font-size: 1.125rem;
        }
      }

      .context-info {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        span {
          padding: 0.25rem 0.625rem;
          background: white;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #1e40af;
          font-weight: 600;

          &.year {
            background: #dbeafe;
          }
        }
      }
    }

    .anomaly-section {
      padding: 0.875rem;
      border-radius: 8px;
      border-left: 4px solid;

      &.anomaly-critical {
        background: #fef2f2;
        border-color: #ef4444;
        color: #991b1b;
      }

      &.anomaly-high {
        background: #fff7ed;
        border-color: #f97316;
        color: #9a3412;
      }

      &.anomaly-medium {
        background: #fffbeb;
        border-color: #f59e0b;
        color: #78350f;
      }

      &.anomaly-low {
        background: #fef9c3;
        border-color: #eab308;
        color: #713f12;
      }

      .anomaly-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-weight: 700;

        i {
          font-size: 1.125rem;
        }
      }

      .anomaly-details {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        font-weight: 600;

        .deviation {
          font-family: monospace;
        }
      }
    }

    .additional-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;

      .info-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: #f9fafb;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #4b5563;

        i {
          color: #6b7280;
        }
      }
    }

    .meta-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #9ca3af;

        i {
          font-size: 0.75rem;
        }
      }
    }

    .notes {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 6px;
      border-left: 3px solid #fbbf24;

      i {
        color: #f59e0b;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: #78350f;
        line-height: 1.5;
        font-style: italic;
      }
    }
  }
}

.badge-type {
  &.type-labor {
    background: #eff6ff;
    color: #1e40af;
  }

  &.type-supply {
    background: #f0fdf4;
    color: #15803d;
  }

  &.type-parts {
    background: #f0fdf4;
    color: #15803d;
  }

  &.type-other {
    background: #fef3c7;
    color: #92400e;
  }
}

.badge-category {
  background: #f3e8ff;
  color: #6b21a8;
}

.badge-source {
  font-size: 0.75rem;

  &.source-manual {
    background: #e0f2fe;
    color: #075985;
  }

  &.source-auto {
    background: #dcfce7;
    color: #166534;
  }

  &.source-import {
    background: #fce7f3;
    color: #9f1239;
  }

  &.source-catalog {
    background: #f5f3ff;
    color: #5b21b6;
  }
}

.price-form {
  .form-section {
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid #e5e7eb;

    h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #1f2937;
      font-weight: 600;
    }

    &.pricing-section {
      background: #f0fdf4;
      border-color: #bbf7d0;

      h4 {
        color: #15803d;
      }
    }

    &.vehicle-section {
      background: #eff6ff;
      border-color: #bfdbfe;

      h4 {
        color: #1e40af;
      }
    }
  }

  .calculated-field {
    background: #f3f4f6;
    cursor: not-allowed;
    font-family: monospace;
    font-weight: 700;
    color: #059669;
  }

  .flex-2 {
    flex: 2;
  }
}

@media (max-width: 768px) {
  .prices-grid {
    grid-template-columns: 1fr;
  }
}
</style>

