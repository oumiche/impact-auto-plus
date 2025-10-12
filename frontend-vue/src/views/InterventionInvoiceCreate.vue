<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionInvoices' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Nouvelle facture</h1>
      <p>Créez une nouvelle facture d'intervention</p>
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
            :status-filter="['work_completed', 'pending_invoice']"
          />
        </div>

        <!-- Informations générales -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date de la facture <span class="required">*</span></label>
              <input
                v-model="form.invoiceDate"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label>Date d'échéance</label>
              <input
                v-model="form.dueDate"
                type="date"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Numéro de facture</label>
              <input
                v-model="form.invoiceNumber"
                type="text"
                placeholder="Sera généré automatiquement si vide"
              />
            </div>

            <div class="form-group">
              <label>Statut de paiement</label>
              <select v-model="form.paymentStatus">
                <option value="draft">Brouillon</option>
                <option value="pending">En attente</option>
                <option value="partial">Partiellement payé</option>
                <option value="paid">Payé</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <SearchableSelector
              v-model="form.billedById"
              api-method="getCollaborateurs"
              label="Facturé par"
              display-field="firstName"
              secondary-field="lastName"
              placeholder="Rechercher un collaborateur..."
            />

            <div class="form-group">
              <label>Méthode de paiement</label>
              <select v-model="form.paymentMethod">
                <option value="">Sélectionner</option>
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="card">Carte bancaire</option>
                <option value="transfer">Virement</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Notes de facturation</label>
            <textarea
              v-model="form.notes"
              rows="3"
              placeholder="Notes ou remarques..."
            ></textarea>
          </div>
        </div>

        <!-- Lignes de facturation -->
        <div class="form-section">
          <h4>
            <i class="fas fa-list"></i> 
            Lignes de facturation
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
              <span>TVA ({{ form.vatRate }}%) :</span>
              <strong>{{ formatCurrency(totals.totalVAT) }}</strong>
            </div>
            <div class="total-row">
              <span>Remise :</span>
              <strong>{{ formatCurrency(totals.totalDiscount) }}</strong>
            </div>
            <div class="total-row grand-total">
              <span>Total TTC :</span>
              <strong>{{ formatCurrency(totals.totalTTC) }}</strong>
            </div>
            <div v-if="form.amountPaid > 0" class="total-row">
              <span>Montant payé :</span>
              <strong class="paid-amount">{{ formatCurrency(form.amountPaid) }}</strong>
            </div>
            <div v-if="form.amountPaid > 0" class="total-row remaining">
              <span>Montant restant :</span>
              <strong>{{ formatCurrency(totals.totalTTC - form.amountPaid) }}</strong>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="form-section">
          <h4><i class="fas fa-cog"></i> Options</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Taux de TVA (%)</label>
              <input
                v-model.number="form.vatRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
              />
            </div>

            <div class="form-group">
              <label>Remise globale (%)</label>
              <input
                v-model.number="form.globalDiscountPercent"
                type="number"
                step="0.01"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Montant déjà payé (€)</label>
              <input
                v-model.number="form.amountPaid"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label>Date de paiement</label>
              <input
                v-model="form.paymentDate"
                type="date"
              />
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
import { ref, computed } from 'vue'
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

// Formulaire
const form = ref({
  interventionId: null,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  invoiceNumber: '',
  paymentStatus: 'draft',
  billedById: null,
  paymentMethod: '',
  notes: '',
  vatRate: 20,
  globalDiscountPercent: 0,
  amountPaid: 0,
  paymentDate: '',
  lines: []
})

// Calculs automatiques
const totals = computed(() => {
  let totalHT = 0
  let totalDiscount = 0

  form.value.lines.forEach(line => {
    const lineTotal = (line.quantity || 0) * (line.unitPrice || 0)
    totalHT += lineTotal
    totalDiscount += (lineTotal * (line.discountPercent || 0)) / 100
  })

  // Remise globale
  const globalDiscount = (totalHT * (form.value.globalDiscountPercent || 0)) / 100
  totalDiscount += globalDiscount

  const totalHTAfterDiscount = totalHT - totalDiscount
  const totalVAT = (totalHTAfterDiscount * (form.value.vatRate || 0)) / 100
  const totalTTC = totalHTAfterDiscount + totalVAT

  return {
    totalHT,
    totalDiscount,
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
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value || 0)
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
      invoiceDate: form.value.invoiceDate,
      dueDate: form.value.dueDate || null,
      invoiceNumber: form.value.invoiceNumber || null,
      paymentStatus: form.value.paymentStatus,
      billedById: form.value.billedById || null,
      paymentMethod: form.value.paymentMethod || null,
      notes: form.value.notes || null,
      vatRate: form.value.vatRate,
      globalDiscountPercent: form.value.globalDiscountPercent,
      amountPaid: form.value.amountPaid || 0,
      paymentDate: form.value.paymentDate || null,
      lines: form.value.lines.map((line, index) => ({
        ...line,
        orderIndex: index + 1
      }))
    }

    const response = await apiService.createInterventionInvoice(data)

    if (response.success) {
      success('Facture créée avec succès')
      router.push({ name: 'InterventionInvoices' })
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (err) {
    console.error('Error creating invoice:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la création'
    error('Erreur lors de la création de la facture')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionInvoices' })
}
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

  &.remaining {
    color: #dc2626;
    font-weight: 600;
    
    strong {
      color: #dc2626;
    }
  }

  strong {
    font-size: 1rem;
    color: #1f2937;
    
    &.paid-amount {
      color: #059669;
    }
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

