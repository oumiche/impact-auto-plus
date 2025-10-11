<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionPrediagnostics' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Nouveau prédiagnostic</h1>
      <p>Créez un nouveau prédiagnostic d'intervention</p>
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
            :status-filter="['reported', 'in_prediagnostic']"
          />
        </div>

        <!-- Informations générales -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations générales</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date du prédiagnostic <span class="required">*</span></label>
              <input
                v-model="form.prediagnosticDate"
                type="date"
                required
              />
            </div>

            <SimpleSelector
              v-model="form.expertId"
              api-method="getCollaborateurs"
              label="Expert"
              placeholder="Sélectionner un expert"
            />
          </div>
        </div>

        <!-- Opérations / Items -->
        <div class="form-section">
          <h4>
            <i class="fas fa-list-check"></i> 
            Opérations à réaliser
            <button type="button" @click="addItem" class="btn-add-item">
              <i class="fas fa-plus-circle"></i>
              Ajouter une opération
            </button>
          </h4>

          <div v-if="form.items.length === 0" class="no-items">
            <i class="fas fa-info-circle"></i>
            Aucune opération ajoutée. Cliquez sur "Ajouter une opération"
          </div>

          <div v-else class="items-list">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="item-row"
            >
              <div class="item-number">{{ index + 1 }}</div>
              
              <div class="item-fields">
                <input
                  v-model="item.operationLabel"
                  type="text"
                  placeholder="Description de l'opération (ex: Changer pare-choc avant)"
                  required
                />
                
                <div class="item-checkboxes">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isExchange" />
                    <span><i class="fas fa-exchange-alt"></i> Échange</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isRepair" />
                    <span><i class="fas fa-wrench"></i> Réparation</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isPainting" />
                    <span><i class="fas fa-paint-brush"></i> Peinture</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.isControl" />
                    <span><i class="fas fa-check-square"></i> Contrôle</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                @click="removeItem(index)"
                class="btn-icon btn-delete"
                title="Supprimer"
              >
                <i class="fas fa-trash"></i>
              </button>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SimpleSelector from '@/components/common/SimpleSelector.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const { success, error, warning } = useNotification()

// État
const saving = ref(false)
const errorMessage = ref('')

// Formulaire
const form = ref({
  interventionId: null,
  prediagnosticDate: new Date().toISOString().split('T')[0],
  expertId: null,
  items: []
})

// Méthodes
const addItem = () => {
  form.value.items.push({
    operationLabel: '',
    isExchange: false,
    isRepair: false,
    isPainting: false,
    isControl: false
  })
}

const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (form.value.items.length === 0) {
      warning('Veuillez ajouter au moins une opération')
      return
    }

    saving.value = true

    // Préparer les items avec orderIndex
    const items = form.value.items.map((item, index) => ({
      ...item,
      orderIndex: index + 1
    }))

    const data = {
      interventionId: form.value.interventionId,
      prediagnosticDate: form.value.prediagnosticDate,
      expertId: form.value.expertId || null,
      items: items
    }

    const response = await apiService.createInterventionPrediagnostic(data)

    if (response.success) {
      success('Prédiagnostic créé avec succès')
      router.push({ name: 'InterventionPrediagnostics' })
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (err) {
    console.error('Error creating prediagnostic:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la création'
    error('Erreur lors de la création du prédiagnostic')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionPrediagnostics' })
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

  i {
    font-size: 1rem;
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

  i {
    font-size: 1.5rem;
    color: #9ca3af;
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-row {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.item-number {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.item-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    display: flex;
    align-items: center;
    gap: 0.375rem;

    i {
      font-size: 0.9rem;
    }
  }

  &:hover {
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

