<template>
  <div class="quote-line-editor">
    <div class="editor-header">
      <h4>
        <i class="fas fa-list-ol"></i>
        Lignes du devis
      </h4>
      <button type="button" @click="addLine" class="btn-add-line">
        <i class="fas fa-plus-circle"></i>
        Ajouter une ligne
      </button>
    </div>

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
            @change="handleSupplyChange(line, $event)"
          />
        </div>
        
        <div class="col-type">
          <select v-model="line.workType" required @change="calculateLineTotal(line)">
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
              @input="handleDiscountPercentageChange(line)"
            />
            <span class="or">ou</span>
            <input
              v-model.number="line.discountAmount"
              type="number"
              min="0"
              step="100"
              placeholder="XOF"
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
            @input="calculateLineTotal(line)"
          />
        </div>
        
        <div class="col-total">
          <div class="line-total">{{ formatCurrency(line.lineTotal || 0) }}</div>
        </div>
        
        <div class="col-actions">
          <button
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

    <!-- Totaux -->
    <div v-if="lines.length > 0" class="totals-section">
      <div class="totals-grid">
        <div class="total-row">
          <span class="total-label">Sous-total HT:</span>
          <span class="total-value">{{ formatCurrency(totals.subtotal) }}</span>
        </div>
        <div class="total-row" v-if="totals.totalDiscount > 0">
          <span class="total-label">Remises:</span>
          <span class="total-value discount">- {{ formatCurrency(totals.totalDiscount) }}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Total HT:</span>
          <span class="total-value">{{ formatCurrency(totals.totalHT) }}</span>
        </div>
        <div class="total-row">
          <span class="total-label">TVA:</span>
          <span class="total-value">{{ formatCurrency(totals.totalTVA) }}</span>
        </div>
        <div class="total-row grand-total">
          <span class="total-label">Total TTC:</span>
          <span class="total-value">{{ formatCurrency(totals.totalTTC) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SupplySelector from './SupplySelector.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// État
const lines = ref([...props.modelValue])

// Watchers
watch(() => props.modelValue, (newVal) => {
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

const handleSupplyChange = (line, supply) => {
  if (supply && supply.unitPrice) {
    line.unitPrice = supply.unitPrice
    calculateLineTotal(line)
  }
}

const handleDiscountPercentageChange = (line) => {
  if (line.discountPercentage) {
    const subtotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0)
    line.discountAmount = (subtotal * parseFloat(line.discountPercentage)) / 100
  } else {
    line.discountAmount = null
  }
  calculateLineTotal(line)
}

const handleDiscountAmountChange = (line) => {
  if (line.discountAmount) {
    const subtotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0)
    if (subtotal > 0) {
      line.discountPercentage = (parseFloat(line.discountAmount) / subtotal) * 100
    }
  } else {
    line.discountPercentage = null
  }
  calculateLineTotal(line)
}

const calculateLineTotal = (line) => {
  const qty = parseFloat(line.quantity) || 0
  const price = parseFloat(line.unitPrice) || 0
  const discount = parseFloat(line.discountAmount) || 0
  
  line.lineTotal = (qty * price) - discount
}

const emitUpdate = () => {
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

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;

  h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;

    i {
      color: #3b82f6;
    }
  }
}

.btn-add-line {
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

  i {
    font-size: 1rem;
  }
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
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 40px 2fr 1fr 0.8fr 1.2fr 1.5fr 0.8fr 1.2fr 50px;
  gap: 0.5rem;
  align-items: center;
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

.totals-section {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.totals-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  margin-left: auto;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }

  &.grand-total {
    padding: 1rem 0;
    border-top: 3px solid #3b82f6;
    margin-top: 0.5rem;

    .total-label,
    .total-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }
  }
}

.total-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.95rem;
}

.total-value {
  font-weight: 700;
  color: #1f2937;
  font-size: 1.05rem;

  &.discount {
    color: #ef4444;
  }
}
</style>

