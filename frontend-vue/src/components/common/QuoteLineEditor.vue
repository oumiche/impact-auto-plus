<template>
  <div class="quote-line-editor">
    <div v-if="lines.length === 0" class="no-lines">
      <i class="fas fa-info-circle"></i>
      Aucune ligne. Cliquez sur "Ajouter une ligne"
    </div>

    <div v-else class="lines-table">
      <!-- Header -->
      <div class="table-header">
        <div class="col-num">#</div>
        <div class="col-supply">Fourniture *</div>
        <div class="col-type">Type *</div>
        <div class="col-qty">Qté *</div>
        <div class="col-price">P.U. (XOF) *</div>
        <div class="col-discount">Remise</div>
        <div class="col-tax">TVA %</div>
        <div class="col-total">Total</div>
        <div class="col-actions"></div>
      </div>

      <!-- Lines -->
      <div
        v-for="(line, index) in lines"
        :key="index"
        class="table-row"
      >
        <div class="col-num">{{ index + 1 }}</div>
        
        <div class="col-supply">
          <SupplySelector
            v-model="line.supplyId"
            :required="true"
            :disabled="props.disabled"
            @change="handleSupplyChange(line, $event)"
          />
          <PriceIndicator
            v-if="line.priceSuggestion"
            :suggestion="line.priceSuggestion"
            :current-price="line.unitPrice"
            :loading="line.loadingPrice"
          />
        </div>
        
        <div class="col-type">
          <select v-model="line.workType" required :disabled="props.disabled" @change="calculateLineTotal(line)">
            <option value="supply">Fourniture</option>
            <option value="labor">Main d'œuvre</option>
            <option value="other">Autre</option>
          </select>
        </div>
        
        <div class="col-qty">
          <input
            v-model.number="line.quantity"
            type="number"
            min="0.01"
            step="0.01"
            required
            :disabled="props.disabled"
            @input="calculateLineTotal(line)"
          />
        </div>
        
        <div class="col-price">
          <input
            v-model.number="line.unitPrice"
            type="number"
            min="0"
            step="100"
            required
            :disabled="props.disabled"
            @input="calculateLineTotal(line)"
          />
        </div>
        
        <div class="col-discount">
          <div class="discount-inputs">
            <input
              v-model.number="line.discountPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="%"
              :disabled="props.disabled"
              @input="handleDiscountPercentageChange(line)"
            />
            <span class="or">ou</span>
            <input
              v-model.number="line.discountAmount"
              type="number"
              min="0"
              step="1"
              placeholder="XOF"
              :disabled="props.disabled"
              @input="handleDiscountAmountChange(line)"
            />
          </div>
        </div>
        
        <div class="col-tax">
          <input
            v-model.number="line.taxRate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            :disabled="props.disabled"
            @input="calculateLineTotal(line)"
          />
        </div>
        
        <div class="col-total">
          <div class="line-total">{{ formatCurrency(line.lineTotal || 0) }}</div>
        </div>
        
        <div class="col-actions">
          <button
            v-if="!props.disabled"
            type="button"
            @click="removeLine(index)"
            class="btn-icon btn-delete"
            title="Supprimer"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SupplySelector from './SupplySelector.vue'
import PriceIndicator from './PriceIndicator.vue'
import apiService from '@/services/api.service'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// État
const lines = ref([...props.modelValue])
const isUpdating = ref(false)
const isCalculating = ref(false)

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (isUpdating.value) return
  lines.value = [...newVal]
}, { deep: true })

watch(lines, () => {
  emitUpdate()
}, { deep: true })

// Totaux calculés
const totals = computed(() => {
  const subtotal = lines.value.reduce((sum, line) => {
    const qty = parseFloat(line.quantity) || 0
    const price = parseFloat(line.unitPrice) || 0
    return sum + (qty * price)
  }, 0)

  const totalDiscount = lines.value.reduce((sum, line) => {
    return sum + (parseFloat(line.discountAmount) || 0)
  }, 0)

  const totalHT = subtotal - totalDiscount

  const totalTVA = lines.value.reduce((sum, line) => {
    const lineHT = (parseFloat(line.lineTotal) || 0)
    const taxRate = parseFloat(line.taxRate) || 0
    const lineTVA = (lineHT * taxRate) / 100
    return sum + lineTVA
  }, 0)

  const totalTTC = totalHT + totalTVA

  return {
    subtotal,
    totalDiscount,
    totalHT,
    totalTVA,
    totalTTC
  }
})

// Méthodes
const addLine = () => {
  lines.value.push({
    supplyId: null,
    workType: 'supply',
    quantity: 1,
    unitPrice: 0,
    discountPercentage: null,
    discountAmount: null,
    taxRate: 18, // TVA par défaut
    lineTotal: 0,
    notes: ''
  })
}

const removeLine = (index) => {
  lines.value.splice(index, 1)
}

const handleSupplyChange = async (line, supply) => {
  if (supply && supply.unitPrice) {
    line.unitPrice = supply.unitPrice
    calculateLineTotal(line)
  }
  
  // Charger la suggestion de prix
  if (supply && supply.id) {
    line.loadingPrice = true
    try {
      const response = await apiService.getPriceSuggestion({
        supply: supply.id,
        description: supply.name
      })
      
      if (response.success && response.data) {
        line.priceSuggestion = response.data
      }
    } catch (err) {
      console.warn('Impossible de charger la suggestion de prix:', err)
    } finally {
      line.loadingPrice = false
    }
  }
}

const handleDiscountPercentageChange = (line) => {
  if (isCalculating.value) return
  isCalculating.value = true
  
  // Valider le pourcentage (0-100)
  if (line.discountPercentage < 0) {
    line.discountPercentage = 0
  }
  if (line.discountPercentage > 100) {
    line.discountPercentage = 100
  }
  
  const qty = parseFloat(line.quantity) || 0
  const price = parseFloat(line.unitPrice) || 0
  const subtotal = qty * price
  
  if (line.discountPercentage) {
    line.discountAmount = Math.round((subtotal * parseFloat(line.discountPercentage)) / 100)
  } else {
    line.discountAmount = 0
  }
  calculateLineTotal(line)
  
  setTimeout(() => {
    isCalculating.value = false
  }, 0)
}

const handleDiscountAmountChange = (line) => {
  if (isCalculating.value) return
  isCalculating.value = true
  
  const qty = parseFloat(line.quantity) || 0
  const price = parseFloat(line.unitPrice) || 0
  const subtotal = qty * price
  
  // Valider que la remise ne dépasse pas le sous-total
  if (line.discountAmount < 0) {
    line.discountAmount = 0
  }
  if (line.discountAmount > subtotal) {
    line.discountAmount = subtotal
  }
  
  if (line.discountAmount && subtotal > 0) {
    line.discountPercentage = Math.round(((parseFloat(line.discountAmount) / subtotal) * 100) * 100) / 100
  } else {
    line.discountPercentage = 0
  }
  calculateLineTotal(line)
  
  setTimeout(() => {
    isCalculating.value = false
  }, 0)
}

const calculateLineTotal = (line) => {
  const qty = parseFloat(line.quantity) || 0
  const price = parseFloat(line.unitPrice) || 0
  const discount = parseFloat(line.discountAmount) || 0
  
  line.lineTotal = (qty * price) - discount
}

const emitUpdate = () => {
  isUpdating.value = true
  
  // Ajouter lineNumber automatiquement
  const linesWithNumbers = lines.value.map((line, index) => ({
    ...line,
    lineNumber: index + 1
  }))
  
  emit('update:modelValue', linesWithNumbers)
  emit('change', {
    lines: linesWithNumbers,
    totals: totals.value
  })
  
  // Réinitialiser le flag après un court délai pour permettre les futures mises à jour
  setTimeout(() => {
    isUpdating.value = false
  }, 0)
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 XOF'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

// Exposer les totaux pour le parent
defineExpose({
  totals
})
</script>

<style scoped lang="scss">
.quote-line-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-lines {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;

  i {
    font-size: 1.5rem;
    color: #9ca3af;
  }
}

.lines-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: visible;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 40px 2fr 1fr 0.8fr 1.2fr 1.5fr 0.8fr 1.2fr 50px;
  gap: 0.5rem;
  align-items: start;
}

.col-supply {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.table-header {
  padding: 0.75rem 0.5rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
}

.table-row {
  padding: 1rem 0.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  input,
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
}

.col-num {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #6b7280;
}

.discount-inputs {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  input {
    flex: 1;
    min-width: 0;
  }

  .or {
    font-size: 0.75rem;
    color: #9ca3af;
  }
}

.line-total {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
  text-align: right;
}

.col-actions {
  display: flex;
  justify-content: center;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.85rem;

  &.btn-delete {
    background: #fef2f2;
    color: #dc2626;

    &:hover {
      background: #dc2626;
      color: white;
      transform: scale(1.15);
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    }
  }
}
</style>

