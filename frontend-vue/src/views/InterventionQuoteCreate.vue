<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionQuotes' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Nouveau devis</h1>
      <p>Créez un nouveau devis d'intervention</p>
    </template>

    <template #header-actions>
      <button @click="goBack" class="btn-secondary" type="button">
        <i class="fas fa-arrow-left"></i>
        Retour
      </button>
    </template>

    <div class="form-page-container">
      <form @submit.prevent="handleSubmit" class="form-page">
        <!-- Intervention -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention</h4>
          
          <InterventionSelector
            v-model="form.interventionId"
            label="Intervention"
            required
            :status-filter="['prediagnostic_completed', 'in_quote']"
          />
        </div>

        <!-- Informations générales -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date du devis <span class="required">*</span></label>
              <input
                v-model="form.quoteDate"
                type="date"
                required
              />
            </div>

            <SearchableSelector
              v-model="form.garageId"
              api-method="getGarages"
              label="Garage"
              display-field="name"
              secondary-field="address"
              placeholder="Rechercher un garage..."
            />
          </div>

          <div class="form-group">
            <label>Observations</label>
            <textarea
              v-model="form.observations"
              rows="3"
              placeholder="Observations ou remarques..."
            ></textarea>
          </div>
        </div>

        <!-- Lignes du devis -->
        <div class="form-section">
          <h4>
            <i class="fas fa-list"></i> 
            Lignes du devis
            <button type="button" @click="addLine" class="btn-add-item">
              <i class="fas fa-plus-circle"></i>
              Ajouter une ligne
            </button>
          </h4>

          <div v-if="form.lines.length === 0" class="no-items">
            <i class="fas fa-info-circle"></i>
            Aucune ligne ajoutée. Cliquez sur "Ajouter une ligne"
          </div>

          <QuoteLineEditor
            v-else
            v-model="form.lines"
            @remove="removeLine"
          />

          <!-- Totaux -->
          <div class="totals-section">
            <div class="total-row">
              <span>Total HT :</span>
              <strong>{{ formatCurrency(totals.totalHT) }}</strong>
            </div>
            <div class="total-row">
              <span>TVA :</span>
              <strong>{{ formatCurrency(totals.totalVAT) }}</strong>
            </div>
            <div class="total-row grand-total">
              <span>Total TTC :</span>
              <strong>{{ formatCurrency(totals.totalTTC) }}</strong>
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-secondary">
            <i class="fas fa-times"></i>
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Notifications d'erreur -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SearchableSelector from '@/components/common/SearchableSelector.vue'
import QuoteLineEditor from '@/components/common/QuoteLineEditor.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const { success, error, warning } = useNotification()

// État
const saving = ref(false)
const errorMessage = ref('')
const currency = ref('F CFA')
const currencyLoaded = ref(false)

// Formulaire
const form = ref({
  interventionId: null,
  quoteDate: new Date().toISOString().split('T')[0],
  garageId: null,
  observations: '',
  lines: []
})

// Calculs automatiques
const totals = computed(() => {
  let totalHT = 0
  let totalVAT = 0

  form.value.lines.forEach(line => {
    const lineHT = parseFloat(line.lineTotal) || 0
    const lineTax = (lineHT * (parseFloat(line.taxRate) || 0)) / 100
    
    totalHT += lineHT
    totalVAT += lineTax
  })

  const totalTTC = totalHT + totalVAT

  return {
    totalHT,
    totalVAT,
    totalTTC
  }
})

// Méthodes - Lignes
const addLine = () => {
  form.value.lines.push({
    description: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    discountPercentage: 0,
    discountAmount: 0,
    taxRate: 0,
    lineTotal: 0,
    orderIndex: form.value.lines.length + 1
  })
}

const removeLine = (index) => {
  form.value.lines.splice(index, 1)
  // Réorganiser les orderIndex
  form.value.lines.forEach((line, idx) => {
    line.orderIndex = idx + 1
  })
}

// Helpers
const formatCurrency = (value) => {
  const amount = value || 0
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency.value}`
}

// Submit
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
      quoteDate: form.value.quoteDate,
      garageId: form.value.garageId || null,
      observations: form.value.observations || null,
      lines: form.value.lines.map((line, index) => ({
        ...line,
        orderIndex: index + 1
      }))
    }

    const response = await apiService.createInterventionQuote(data)

    if (response.success) {
      success('Devis créé avec succès')
      // Rediriger vers la page d'édition du devis créé
      if (response.data && response.data.id) {
        router.push({ name: 'InterventionQuoteEdit', params: { id: response.data.id } })
      } else {
        router.push({ name: 'InterventionQuotes' })
      }
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (err) {
    console.error('Error creating quote:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la création'
    error('Erreur lors de la création du devis')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionQuotes' })
}

// Charger la devise
const loadCurrency = async () => {
  if (currencyLoaded.value) return
  
  try {
    const response = await apiService.getCurrency()
    if (response.success && response.data) {
      currency.value = response.data.value || 'F CFA'
    }
  } catch (err) {
    console.warn('Impossible de charger la devise, utilisation de F CFA par défaut')
  } finally {
    currencyLoaded.value = true
  }
}

// Lifecycle
onMounted(() => {
  loadCurrency()
})
</script>

<style scoped lang="scss">
@import './crud-styles.scss';

.breadcrumb {
  margin-bottom: 1rem;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    color: #2563eb;
    text-decoration: underline;
  }
}

.form-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem 2rem;
}

.form-page {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-section {
  margin-bottom: 2rem;

  h4 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;

    i {
      color: #3b82f6;
    }
  }
}

.btn-add-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }
}

.no-items {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  margin-bottom: 1rem;

  i {
    font-size: 1.5rem;
    color: #9ca3af;
  }
}

.totals-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.95rem;
  color: #4b5563;

  &.grand-total {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 2px solid #d1d5db;
    font-size: 1.1rem;
    color: #1f2937;
    
    strong {
      color: #059669;
      font-size: 1.25rem;
    }
  }

  strong {
    font-size: 1rem;
    color: #1f2937;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
  margin-top: 2rem;
}
</style>

