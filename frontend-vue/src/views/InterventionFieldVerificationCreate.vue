<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionFieldVerifications' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Nouvelle Vérification Terrain</h1>
      <p>Créez une nouvelle vérification terrain pour une intervention</p>
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
          />
        </div>

        <!-- Informations de vérification -->
        <div class="form-section">
          <h4><i class="fas fa-info-circle"></i> Informations de vérification</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date de vérification <span class="required">*</span></label>
              <input
                v-model="form.verificationDate"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label>Type de vérification <span class="required">*</span></label>
              <select v-model="form.verificationType" required>
                <option value="before_work">Avant travaux</option>
                <option value="during_work">Pendant travaux</option>
                <option value="after_work">Après travaux</option>
              </select>
            </div>
          </div>

          <SearchableSelector
            v-model="form.verifiedBy"
            api-method="getCollaborateurs"
            label="Vérifié par"
            display-field="firstName"
            secondary-field="lastName"
            placeholder="Rechercher un collaborateur..."
            required
          />
        </div>

        <!-- Constatations -->
        <div class="form-section">
          <h4><i class="fas fa-clipboard-list"></i> Constatations</h4>
          
          <div class="form-group">
            <label>Constatations <span class="required">*</span></label>
            <textarea
              v-model="form.findings"
              rows="5"
              placeholder="Décrivez vos constatations..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Résultat de la vérification</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="form.isSatisfactory"
                  :value="true"
                />
                <span class="radio-label satisfactory">
                  <i class="fas fa-check-circle"></i>
                  Satisfaisant
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="form.isSatisfactory"
                  :value="false"
                />
                <span class="radio-label unsatisfactory">
                  <i class="fas fa-times-circle"></i>
                  Non satisfaisant
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="form.isSatisfactory"
                  :value="null"
                />
                <span class="radio-label pending">
                  <i class="fas fa-clock"></i>
                  En attente
                </span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Recommandations</label>
            <textarea
              v-model="form.recommendations"
              rows="4"
              placeholder="Vos recommandations..."
            ></textarea>
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
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SearchableSelector from '@/components/common/SearchableSelector.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const route = useRoute()
const { success, error, warning } = useNotification()

// État
const saving = ref(false)
const errorMessage = ref('')

// Formulaire
const form = ref({
  interventionId: null,
  verificationDate: new Date().toISOString().split('T')[0],
  verificationType: 'before_work',
  verifiedBy: null,
  photosTaken: 0,
  findings: '',
  isSatisfactory: null,
  recommendations: ''
})

// Submit
const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    if (!form.value.verifiedBy) {
      warning('Veuillez sélectionner la personne qui vérifie')
      return
    }

    if (!form.value.findings || form.value.findings.trim() === '') {
      warning('Veuillez saisir des constatations')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      verificationDate: form.value.verificationDate,
      verificationType: form.value.verificationType,
      verifiedBy: form.value.verifiedBy,
      photosTaken: form.value.photosTaken || 0,
      findings: form.value.findings,
      isSatisfactory: form.value.isSatisfactory,
      recommendations: form.value.recommendations || null
    }

    const response = await apiService.createInterventionFieldVerification(data)

    if (response.success) {
      success('Vérification terrain créée avec succès')
      router.push({ name: 'InterventionFieldVerifications' })
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (err) {
    console.error('Error creating field verification:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la création'
    error('Erreur lors de la création de la vérification')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionFieldVerifications' })
}
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

.radio-group {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type="radio"] {
    margin-right: 0.5rem;
    cursor: pointer;
  }

  .radio-label {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s;

    i {
      font-size: 1rem;
    }

    &.satisfactory {
      color: #059669;
      
      i {
        color: #10b981;
      }
    }

    &.unsatisfactory {
      color: #dc2626;
      
      i {
        color: #ef4444;
      }
    }

    &.pending {
      color: #d97706;
      
      i {
        color: #f59e0b;
      }
    }
  }

  input[type="radio"]:checked + .radio-label {
    &.satisfactory {
      background: #d1fae5;
      border-color: #10b981;
    }

    &.unsatisfactory {
      background: #fee2e2;
      border-color: #ef4444;
    }

    &.pending {
      background: #fef3c7;
      border-color: #f59e0b;
    }
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

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
  margin-top: 2rem;
}
</style>

