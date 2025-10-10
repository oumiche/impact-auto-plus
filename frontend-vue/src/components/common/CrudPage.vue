<template>
  <DefaultLayout>
    <template #header-actions>
      <button @click="openCreateModal" class="btn-primary">
        <span class="icon">➕</span>
        {{ createButtonLabel }}
      </button>
    </template>

    <div class="crud-page">
      <!-- Loading -->
      <LoadingSpinner v-if="loading && !items.length" :text="`Chargement des ${entityNamePlural}...`" />

      <!-- Items List -->
      <div v-else-if="items.length > 0" class="items-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-card"
        >
          <div class="item-header">
            <h3>{{ getItemTitle(item) }}</h3>
            <div class="item-actions">
              <button @click="openEditModal(item)" class="btn-icon" title="Modifier">
                ✏️
              </button>
              <button @click="confirmDelete(item)" class="btn-icon btn-danger" title="Supprimer">
                🗑️
              </button>
            </div>
          </div>

          <div class="item-info">
            <slot name="item-content" :item="item"></slot>
          </div>

          <div class="item-footer" v-if="$slots['item-footer']">
            <slot name="item-footer" :item="item"></slot>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">{{ emptyIcon }}</div>
        <h3>Aucun {{ entityNameSingular }}</h3>
        <p>Commencez par créer votre premier {{ entityNameSingular }}</p>
        <button @click="openCreateModal" class="btn-primary">
          <span class="icon">➕</span>
          {{ createButtonLabel }}
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <!-- Create/Edit Modal -->
      <Modal
        v-model="showModal"
        :title="isEditing ? `Modifier ${entityNameSingular}` : `Nouveau ${entityNameSingular}`"
        :size="modalSize"
      >
        <slot name="form" :form="currentForm" :isEditing="isEditing"></slot>

        <template #footer>
          <button @click="showModal = false" class="btn-secondary" type="button">
            Annuler
          </button>
          <button @click="handleSubmit" class="btn-primary" type="button" :disabled="submitting">
            <span v-if="submitting">Enregistrement...</span>
            <span v-else>{{ isEditing ? 'Modifier' : 'Créer' }}</span>
          </button>
        </template>
      </Modal>

      <!-- Delete Confirmation Modal -->
      <Modal
        v-model="showDeleteModal"
        title="Confirmer la suppression"
        size="small"
      >
        <p>Êtes-vous sûr de vouloir supprimer <strong>{{ getItemTitle(itemToDelete) }}</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>

        <template #footer>
          <button @click="showDeleteModal = false" class="btn-secondary">
            Annuler
          </button>
          <button @click="handleDelete" class="btn-danger" :disabled="submitting">
            <span v-if="submitting">Suppression...</span>
            <span v-else>Supprimer</span>
          </button>
        </template>
      </Modal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Modal from '@/components/common/Modal.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  entityNameSingular: {
    type: String,
    required: true
  },
  entityNamePlural: {
    type: String,
    required: true
  },
  createButtonLabel: {
    type: String,
    required: true
  },
  emptyIcon: {
    type: String,
    default: '📋'
  },
  modalSize: {
    type: String,
    default: 'medium'
  },
  getItemTitle: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['create', 'update', 'delete'])

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const itemToDelete = ref(null)
const currentForm = ref({})

const openCreateModal = () => {
  isEditing.value = false
  currentForm.value = {}
  emit('create', currentForm)
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  currentForm.value = { ...item }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    
    if (isEditing.value) {
      await emit('update', currentForm.value)
    } else {
      await emit('create', currentForm.value)
    }
    
    showModal.value = false
  } catch (error) {
    console.error('Error submitting:', error)
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  try {
    submitting.value = true
    await emit('delete', itemToDelete.value)
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (error) {
    console.error('Error deleting:', error)
  } finally {
    submitting.value = false
  }
}

defineExpose({
  openCreateModal,
  openEditModal,
  currentForm
})
</script>

<style scoped lang="scss">
.crud-page {
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #1e40af;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.2rem;
  }
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #e5e5e5;
  }
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #dc2626;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.item-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    color: #333;
    margin: 0;
    font-weight: 600;
    flex: 1;
  }
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;

  &:hover {
    background: #e5e5e5;
  }

  &.btn-danger:hover {
    background: #fee;
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.item-footer {
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
  }
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  border-left: 4px solid #c33;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .error-icon {
    font-size: 1.2rem;
  }
}

.warning-text {
  color: #ef4444;
  font-weight: 600;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
}
</style>

