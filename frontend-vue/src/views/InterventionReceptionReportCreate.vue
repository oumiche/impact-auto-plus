<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'InterventionReceptionReports' }" class="breadcrumb-link">
          <i class="fas fa-arrow-left"></i>
          Retour à la liste
        </router-link>
      </div>
      <h1>Nouveau rapport de réception</h1>
      <p>Créez un nouveau rapport de réception de véhicule</p>
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
            :status-filter="['work_authorized', 'in_progress']"
          />
        </div>

        <!-- Informations de réception -->
        <div class="form-section">
          <h4><i class="fas fa-clipboard-check"></i> Informations de réception</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date de réception <span class="required">*</span></label>
              <input
                v-model="form.receptionDate"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label>Kilométrage (km)</label>
              <input
                v-model.number="form.currentMileage"
                type="number"
                min="0"
                placeholder="Kilométrage actuel"
              />
            </div>
          </div>

          <div class="form-row">
            <SearchableSelector
              v-model="form.receivedById"
              api-method="getCollaborateurs"
              label="Réceptionné par"
              display-field="firstName"
              secondary-field="lastName"
              placeholder="Rechercher un collaborateur..."
            />

            <div class="form-group">
              <label>Niveau de carburant</label>
              <select v-model="form.fuelLevel">
                <option value="">Sélectionner</option>
                <option value="empty">Vide (0%)</option>
                <option value="low">Bas (&lt; 25%)</option>
                <option value="medium">Moyen (25-50%)</option>
                <option value="high">Élevé (50-75%)</option>
                <option value="full">Plein (&gt; 75%)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- État du véhicule -->
        <div class="form-section">
          <h4><i class="fas fa-car"></i> État du véhicule</h4>
          
          <div class="form-group">
            <label>État général</label>
            <select v-model="form.vehicleCondition">
              <option value="">Sélectionner</option>
              <option value="excellent">Excellent</option>
              <option value="good">Bon</option>
              <option value="fair">Moyen</option>
              <option value="poor">Mauvais</option>
            </select>
          </div>

          <div class="form-group">
            <label>Observations sur l'état du véhicule</label>
            <textarea
              v-model="form.vehicleConditionNotes"
              rows="4"
              placeholder="Décrivez l'état général du véhicule à la réception..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>Dommages constatés</label>
            <textarea
              v-model="form.damagedParts"
              rows="3"
              placeholder="Liste des dommages ou rayures constatées..."
            ></textarea>
          </div>
        </div>

        <!-- Éléments du véhicule -->
        <div class="form-section">
          <h4><i class="fas fa-check-square"></i> Vérifications</h4>
          
          <div class="checkbox-grid">
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.hasDocuments" />
              <span>
                <i class="fas fa-file-alt"></i>
                Documents complets
              </span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.hasSpareTire" />
              <span>
                <i class="fas fa-life-ring"></i>
                Roue de secours
              </span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.hasJack" />
              <span>
                <i class="fas fa-wrench"></i>
                Cric et clés
              </span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.hasTriangle" />
              <span>
                <i class="fas fa-triangle-exclamation"></i>
                Triangle de signalisation
              </span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.hasVest" />
              <span>
                <i class="fas fa-vest"></i>
                Gilet de sécurité
              </span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.hasFirstAidKit" />
              <span>
                <i class="fas fa-kit-medical"></i>
                Trousse de secours
              </span>
            </label>
          </div>

          <div class="form-group">
            <label>Remarques sur les équipements</label>
            <textarea
              v-model="form.equipmentNotes"
              rows="3"
              placeholder="Remarques sur les équipements et accessoires..."
            ></textarea>
          </div>
        </div>

        <!-- Satisfaction client -->
        <div class="form-section">
          <h4><i class="fas fa-star"></i> Satisfaction client</h4>
          
          <div class="form-group">
            <label>Niveau de satisfaction</label>
            <select v-model="form.customerSatisfaction">
              <option value="">Non évalué</option>
              <option value="excellent">Excellent</option>
              <option value="good">Bon</option>
              <option value="fair">Moyen</option>
              <option value="poor">Insatisfait</option>
            </select>
          </div>

          <div class="form-group">
            <label>Commentaires du client</label>
            <textarea
              v-model="form.customerComments"
              rows="3"
              placeholder="Commentaires ou remarques du client..."
            ></textarea>
          </div>
        </div>

        <!-- Observations générales -->
        <div class="form-section">
          <h4><i class="fas fa-comment"></i> Observations générales</h4>
          
          <div class="form-group">
            <label>Notes supplémentaires</label>
            <textarea
              v-model="form.additionalNotes"
              rows="4"
              placeholder="Notes ou remarques supplémentaires..."
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
import { useRouter } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import InterventionSelector from '@/components/common/InterventionSelector.vue'
import SearchableSelector from '@/components/common/SearchableSelector.vue'
import apiService from '@/services/api.service'

const router = useRouter()
const { success, error, warning } = useNotification()

// État
const saving = ref(false)
const errorMessage = ref('')

// Formulaire
const form = ref({
  interventionId: null,
  receptionDate: new Date().toISOString().split('T')[0],
  currentMileage: null,
  receivedById: null,
  fuelLevel: '',
  vehicleCondition: '',
  vehicleConditionNotes: '',
  damagedParts: '',
  hasDocuments: false,
  hasSpareTire: false,
  hasJack: false,
  hasTriangle: false,
  hasVest: false,
  hasFirstAidKit: false,
  equipmentNotes: '',
  customerSatisfaction: '',
  customerComments: '',
  additionalNotes: ''
})

// Submit
const handleSubmit = async () => {
  try {
    if (!form.value.interventionId) {
      warning('Veuillez sélectionner une intervention')
      return
    }

    saving.value = true

    const data = {
      interventionId: form.value.interventionId,
      receptionDate: form.value.receptionDate,
      currentMileage: form.value.currentMileage || null,
      receivedById: form.value.receivedById || null,
      fuelLevel: form.value.fuelLevel || null,
      vehicleCondition: form.value.vehicleCondition || null,
      vehicleConditionNotes: form.value.vehicleConditionNotes || null,
      damagedParts: form.value.damagedParts || null,
      hasDocuments: form.value.hasDocuments,
      hasSpareTire: form.value.hasSpareTire,
      hasJack: form.value.hasJack,
      hasTriangle: form.value.hasTriangle,
      hasVest: form.value.hasVest,
      hasFirstAidKit: form.value.hasFirstAidKit,
      equipmentNotes: form.value.equipmentNotes || null,
      customerSatisfaction: form.value.customerSatisfaction || null,
      customerComments: form.value.customerComments || null,
      additionalNotes: form.value.additionalNotes || null
    }

    const response = await apiService.createInterventionReceptionReport(data)

    if (response.success) {
      success('Rapport de réception créé avec succès')
      router.push({ name: 'InterventionReceptionReports' })
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (err) {
    console.error('Error creating reception report:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Erreur lors de la création'
    error('Erreur lors de la création du rapport')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'InterventionReceptionReports' })
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

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
  }

  span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    color: #4b5563;
    font-weight: 500;

    i {
      font-size: 1.1rem;
      color: #6b7280;
    }
  }

  &:has(input:checked) {
    background: #eff6ff;
    border-color: #3b82f6;

    span {
      color: #1f2937;
      
      i {
        color: #3b82f6;
      }
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

