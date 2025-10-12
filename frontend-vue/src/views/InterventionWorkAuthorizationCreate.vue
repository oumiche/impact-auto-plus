<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionWorkAuthorizations' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Nouvel Accord Travaux</h1>
      <p>Créez un nouvel accord de travaux manuellement ou importez depuis un devis validé</p>
    </template>

    <template #header-actions>
      <button @click="goBack" class="btn-secondary" type="button">
        <i class="fas fa-arrow-left"></i>
        Retour
      </button>
    </template>

    <div class="form-page-container">
      <form @submit.prevent="handleSubmit" class="form-page">
        <!-- Intervention et Devis -->
        <div class="form-section">
          <h4><i class="fas fa-wrench"></i> Intervention et Devis</h4>
          
          <InterventionSelector
            v-model="form.interventionId"
            label="Intervention"
            required
          />

          <div class="form-group">
            <label>Devis associé (optionnel)</label>
            <select v-model="form.quoteId" @change="onQuoteChange">
              <option :value="null">-- Aucun devis (création manuelle) --</option>
              <option 
                v-for="quote in availableQuotes" 
                :key="quote.id" 
                :value="quote.id"
              >
                {{ quote.quoteNumber }} - {{ formatCurrency(quote.totalAmount) }}
              </option>
            </select>
            <div v-if="availableQuotes.length === 0 && form.interventionId" class="info-message">
              <i class="fas fa-info-circle"></i>
              Aucun devis validé trouvé pour cette intervention. Vous pouvez créer l'accord manuellement.
            </div>
            <button 
              v-if="form.quoteId" 
              type="button" 
              @click="importFromQuote" 
              class="btn-import"
              :disabled="importing"
            >
              <i v-if="importing" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-file-import"></i>
              {{ importing ? 'Import en cours...' : 'Importer les lignes du devis' }}
            </button>
          </div>
        </div>

        <!-- Informations générales -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date de l'autorisation <span class="required">*</span></label>
              <input
                v-model="form.authorizationDate"
                type="date"
                required
              />
            </div>

            <SearchableSelector
              v-model="form.authorizedBy"
              api-method="getCollaborateurs"
              label="Autorisé par"
              display-field="firstName"
              secondary-field="lastName"
              placeholder="Rechercher un collaborateur..."
              required
            />
          </div>

          <div class="form-group">
            <label>Instructions particulières</label>
            <textarea
              v-model="form.specialInstructions"
              rows="4"
              placeholder="Instructions spéciales pour les travaux..."
            ></textarea>
          </div>
        </div>

        <!-- Travaux autorisés -->
        <div class="form-section">
          <h4>
            <i class="fas fa-list-check"></i> 
            Lignes de l'accord
            <button type="button" @click="addLine" class="btn-add-item">
              <i class="fas fa-plus-circle"></i>
              Ajouter une ligne
            </button>
          </h4>

          <div v-if="form.lines.length === 0" class="no-items">
            <i class="fas fa-info-circle"></i>
            <div>
              <strong>Aucune ligne ajoutée.</strong>
              <p>Vous pouvez :</p>
              <ul>
                <li>Cliquer sur "Ajouter une ligne" pour créer manuellement</li>
                <li v-if="form.quoteId">Cliquer sur "Importer les lignes du devis" ci-dessus</li>
                <li v-else-if="availableQuotes.length > 0">Sélectionner un devis ci-dessus puis importer</li>
              </ul>
            </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SearchableSelector from '@/components/common/SearchableSelector.vue'
import QuoteLineEditor from '@/components/common/QuoteLineEditor.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const route = useRoute()
const { success, error, warning } = useNotification()

// État
const saving = ref(false)
const importing = ref(false)
const errorMessage = ref('')
const availableQuotes = ref([])
const currency = ref('F CFA')
const currencyLoaded = ref(false)

// Formulaire
const form = ref({
  interventionId: null,
  quoteId: null,
  authorizationDate: new Date().toISOString().split('T')[0],
  authorizedBy: null,
  specialInstructions: '',
  lines: []
})

// Watcher sur l'intervention pour charger les devis
watch(() => form.value.interventionId, async (newInterventionId, oldInterventionId) => {
  console.log('👀 Watcher interventionId déclenché:', { newInterventionId, oldInterventionId })
  
  if (newInterventionId !== oldInterventionId) {
    console.log('🔄 Changement d\'intervention détecté')
    // Réinitialiser le devis et les lignes quand on change d'intervention
    form.value.quoteId = null
    form.value.lines = []
    availableQuotes.value = []
    
    if (newInterventionId) {
      await loadQuotesForIntervention(newInterventionId)
    }
  }
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

// Charger les devis disponibles pour l'intervention sélectionnée
const loadQuotesForIntervention = async (interventionId) => {
  try {
    console.log('🔍 Chargement des devis pour l\'intervention:', interventionId)
    const response = await apiService.getInterventionQuotes()
    console.log('📦 Réponse API devis:', response)
    
    if (response.success && response.data) {
      // Filtrer les devis validés pour cette intervention
      const filtered = response.data.filter(
        quote => quote.interventionId === interventionId && quote.isValidated
      )
      console.log('✅ Devis filtrés:', filtered.length, 'sur', response.data.length)
      availableQuotes.value = filtered
      
      // Si on a un quoteId dans les query params et qu'il est dans la liste, le sélectionner
      if (route.query.quoteId) {
        const quoteIdFromQuery = parseInt(route.query.quoteId)
        const quoteExists = filtered.find(q => q.id === quoteIdFromQuery)
        if (quoteExists) {
          console.log('🎯 Pré-sélection du devis:', quoteIdFromQuery)
          form.value.quoteId = quoteIdFromQuery
        } else {
          console.warn('⚠️ Le devis', quoteIdFromQuery, 'n\'est pas dans la liste des devis validés')
        }
      }
    } else {
      console.warn('❌ Réponse API invalide:', response)
      availableQuotes.value = []
    }
  } catch (err) {
    console.error('❌ Erreur lors du chargement des devis:', err)
    availableQuotes.value = []
  }
}

// Changement de devis
const onQuoteChange = () => {
  // On ne fait rien automatiquement, l'utilisateur doit cliquer sur "Importer"
}

// Importer les lignes depuis le devis sélectionné
const importFromQuote = async () => {
  if (!form.value.quoteId) {
    warning('Aucun devis sélectionné')
    return
  }

  try {
    importing.value = true
    console.log('📥 Import des lignes du devis:', form.value.quoteId)
    
    // Appeler l'endpoint spécial pour récupérer les lignes formatées
    const response = await apiService.getQuoteLinesForAuthorization(form.value.quoteId)
    console.log('📦 Réponse API lignes:', response)
    
    if (response.success && response.data) {
      console.log('📋 Lignes reçues:', response.data.lines)
      
      // Remplacer les lignes existantes par celles du devis
      form.value.lines = response.data.lines.map(line => ({
        tempId: line.tempId || `temp_${Date.now()}_${Math.random()}`,
        lineNumber: line.lineNumber,
        supply: line.supply,
        supplyId: line.supply?.id || null,
        workType: line.workType,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercentage: line.discountPercentage,
        discountAmount: line.discountAmount,
        taxRate: line.taxRate,
        notes: line.notes,
        lineTotal: line.totalPrice,
        description: line.description,
        displayName: line.displayName
      }))
      
      console.log('✅ Lignes importées:', form.value.lines)
      success(`${form.value.lines.length} ligne(s) importée(s) depuis le devis`)
    } else {
      console.error('❌ Réponse invalide:', response)
      throw new Error(response.message || 'Erreur lors de l\'import')
    }
  } catch (err) {
    console.error('❌ Erreur import:', err)
    error('Erreur lors de l\'import des lignes du devis')
  } finally {
    importing.value = false
  }
}

// Méthodes - Lignes
const addLine = () => {
  form.value.lines.push({
    tempId: `temp_${Date.now()}_${Math.random()}`,
    supply: null,
    supplyId: null,
    workType: 'labor',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discountPercentage: 0,
    discountAmount: 0,
    taxRate: 0,
    lineTotal: 0,
    lineNumber: form.value.lines.length + 1,
    notes: ''
  })
}

const removeLine = (index) => {
  form.value.lines.splice(index, 1)
  // Réorganiser les lineNumber
  form.value.lines.forEach((line, idx) => {
    line.lineNumber = idx + 1
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

    if (!form.value.authorizedBy) {
      warning('Veuillez sélectionner la personne qui autorise')
      return
    }

    if (form.value.lines.length === 0) {
      warning('Veuillez ajouter au moins une ligne')
      return
    }

    // Vérifier que toutes les lignes ont une fourniture
    const linesWithoutSupply = form.value.lines.filter(line => !line.supplyId)
    if (linesWithoutSupply.length > 0) {
      warning('Toutes les lignes doivent avoir une fourniture associée')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      quoteId: form.value.quoteId || null,
      authorizationDate: form.value.authorizationDate,
      authorizedBy: form.value.authorizedBy,
      specialInstructions: form.value.specialInstructions || null,
      lines: form.value.lines.map((line, index) => ({
        supplyId: line.supplyId,
        workType: line.workType || 'labor',
        description: line.description || line.notes || '',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercentage: line.discountPercentage || null,
        discountAmount: line.discountAmount || null,
        taxRate: line.taxRate || null,
        notes: line.notes || null,
        lineNumber: index + 1
      }))
    }

    const response = await apiService.createInterventionWorkAuthorization(data)

    if (response.success) {
      success('Accord Travaux créé avec succès')
      router.push({ name: 'InterventionWorkAuthorizations' })
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (err) {
    console.error('Error creating work authorization:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la création'
    error('Erreur lors de la création de l\'Accord Travaux')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionWorkAuthorizations' })
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
onMounted(async () => {
  console.log('🚀 Composant InterventionWorkAuthorizationCreate monté')
  console.log('📋 Form initial:', form.value)
  console.log('🔗 Query params:', route.query)
  
  await loadCurrency()
  
  // Pré-remplir l'intervention depuis les query params si fournie
  if (route.query.interventionId) {
    console.log('📥 Pré-remplissage intervention depuis query:', route.query.interventionId)
    form.value.interventionId = parseInt(route.query.interventionId)
    // Le watcher va automatiquement charger les devis et sélectionner le bon quoteId
  }
  
  console.log('✅ Montage terminé')
})
</script>

<style scoped lang="scss">
@import '@/views/crud-styles.scss';

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
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  margin-bottom: 1rem;

  i {
    font-size: 1.5rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }

  div {
    flex: 1;

    strong {
      color: #374151;
      display: block;
      margin-bottom: 0.5rem;
    }

    p {
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }

    ul {
      margin: 0.5rem 0 0 1.25rem;
      padding: 0;
      font-size: 0.9rem;

      li {
        margin: 0.375rem 0;
        line-height: 1.4;
      }
    }
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

.btn-import {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
}

select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;

  i {
    color: #3b82f6;
    font-size: 1rem;
  }
}
</style>

