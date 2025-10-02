<template>
  <div class="parameter-crud">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="section-title">Paramètres du Système</h1>
      <p class="page-subtitle">Gérez les paramètres généraux et spécifiques aux tenants</p>
    </div>

    <!-- Search and Filter Bar -->
    <div class="search-filter-bar">
      <div class="search-box">
        <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm"
                        placeholder="Rechercher un paramètre..."
                    >
      </div>
      
      <div class="filter-buttons">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          :class="['filter-btn', { active: activeFilter === filter.value }]"
          @click="setActiveFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
      
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i> Nouveau Paramètre
      </button>
    </div>

    <!-- Loading Indicator -->
    <div v-if="loading" class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i> Chargement des paramètres...
    </div>

    <!-- Parameters Grid -->
    <div v-else-if="filteredParameters.length > 0" class="parameters-grid">
      <div 
        v-for="parameter in filteredParameters" 
        :key="parameter.id"
        class="parameter-card"
      >
        <div class="parameter-header">
          <div class="parameter-key">{{ parameter.key }}</div>
          <div :class="['parameter-category', parameter.category]">
            {{ getCategoryLabel(parameter.category) }}
          </div>
        </div>
        
        <div class="parameter-body">
          <div class="parameter-value">
            {{ formatValue(parameter.value, parameter.type) }}
          </div>
          <div class="parameter-description">
            {{ parameter.description || 'Aucune description' }}
          </div>
          
          <div class="parameter-meta">
            <div class="parameter-type">{{ getTypeLabel(parameter.type) }}</div>
            <div class="parameter-status">
              <div :class="['status-indicator', parameter.isEditable ? 'active' : 'inactive']"></div>
              {{ parameter.isEditable ? 'Modifiable' : 'Lecture seule' }}
            </div>
          </div>
          
          <div class="parameter-actions">
            <button 
              class="button btn-outline btn-sm" 
              @click="openEditModal(parameter)"
              :disabled="!parameter.isEditable"
            >
              <i class="fas fa-edit"></i> Modifier
            </button>
            <button 
              class="button btn-danger btn-sm" 
              @click="confirmDelete(parameter)"
            >
              <i class="fas fa-trash"></i> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-cog"></i>
      <h3>Aucun paramètre trouvé</h3>
      <p v-if="searchTerm || activeFilter !== 'all'">
        Aucun paramètre ne correspond à vos critères de recherche.
      </p>
      <p v-else>
        Commencez par ajouter un nouveau paramètre.
      </p>
      <button class="button btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i> Ajouter un paramètre
      </button>
    </div>

    <!-- Create/Edit Parameter Modal -->
    <div :class="['modal', { show: showModal }]" @click="closeModalOnOverlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Modifier le paramètre' : 'Nouveau paramètre' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveParameter">
            <div class="form-group">
              <label for="param-key">Clé du paramètre *</label>
              <input 
                type="text" 
                id="param-key"
                v-model="form.key"
                required
                :disabled="isEditing && !currentParameter?.isEditable"
              >
            </div>
            
            <div class="form-group">
              <label for="param-value">Valeur *</label>
              <input 
                type="text" 
                id="param-value"
                v-model="form.value"
                required
                :disabled="isEditing && !currentParameter?.isEditable"
              >
            </div>
            
            <div class="form-group">
              <label for="param-type">Type</label>
              <select id="param-type" v-model="form.type">
                <option value="string">Texte</option>
                <option value="integer">Entier</option>
                <option value="float">Décimal</option>
                <option value="boolean">Booléen</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="param-category">Catégorie</label>
              <select id="param-category" v-model="form.category">
                <option value="general">Général</option>
                <option value="tenant">Tenant</option>
                <option value="system">Système</option>
                <option value="ui">Interface</option>
                <option value="notification">Notification</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="param-description">Description</label>
              <textarea 
                id="param-description"
                v-model="form.description"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="param-editable">
                <input 
                  type="checkbox" 
                  id="param-editable"
                  v-model="form.isEditable"
                >
                Paramètre modifiable
              </label>
            </div>
            
            <div class="form-group">
              <label for="param-public">
                <input 
                  type="checkbox" 
                  id="param-public"
                  v-model="form.isPublic"
                >
                Paramètre public (accessible sans authentification)
              </label>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Annuler
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="saveParameter"
            :disabled="saving"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div :class="['modal', { show: showDeleteModal }]" @click="closeDeleteModalOnOverlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirmer la suppression</h3>
          <button class="modal-close" @click="closeDeleteModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer ce paramètre ?</p>
                        <p><strong>{{ parameterToDelete?.key }}</strong></p>
          <p class="text-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Cette action est irréversible.
          </p>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
            Annuler
          </button>
          <button 
            type="button" 
            class="btn btn-danger" 
            @click="deleteParameter"
            :disabled="deleting"
          >
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            {{ deleting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Container -->
    <div class="notification-container" id="notification-container"></div>
  </div>
</template>

<script>
export default {
  name: 'ParameterCrud',
  
  data() {
    return {
      parameters: [],
      loading: false,
      saving: false,
      deleting: false,
      searchTerm: '',
      activeFilter: 'all',
      showModal: false,
      showDeleteModal: false,
      isEditing: false,
      currentParameter: null,
      parameterToDelete: null,
      
      filters: [
        { value: 'all', label: 'Tous' },
        { value: 'general', label: 'Généraux' },
        { value: 'tenant', label: 'Tenant' },
        { value: 'system', label: 'Système' },
        { value: 'ui', label: 'Interface' },
        { value: 'notification', label: 'Notification' }
      ],
      
      form: {
        key: '',
        value: '',
        type: 'string',
        category: 'general',
        description: '',
        isEditable: true,
        isPublic: false
      }
    }
  },
  
  computed: {
    filteredParameters() {
      let filtered = this.parameters;
      
      // Filter by category
      if (this.activeFilter !== 'all') {
        filtered = filtered.filter(param => param.category === this.activeFilter);
      }
      
      // Filter by search term
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        filtered = filtered.filter(param => 
          param.key.toLowerCase().includes(search) ||
          param.description?.toLowerCase().includes(search) ||
          param.value.toLowerCase().includes(search)
        );
      }
      
      return filtered;
    }
  },
  
  async mounted() {
    await this.loadParameters();
  },
  
  methods: {
    async loadParameters() {
      this.loading = true;
      try {
        const data = await window.apiService.getParameters();
        if (data.success) {
          this.parameters = data.data || [];
        } else {
          this.showNotification(data.message || 'Erreur lors du chargement des paramètres', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        this.showNotification('Erreur lors du chargement des paramètres: ' + error.message, 'error');
      } finally {
        this.loading = false;
      }
    },
    
    
    setActiveFilter(filter) {
      this.activeFilter = filter;
    },
    
    openCreateModal() {
      this.isEditing = false;
      this.currentParameter = null;
      this.resetForm();
      this.showModal = true;
    },
    
    openEditModal(parameter) {
      this.isEditing = true;
      this.currentParameter = parameter;
      this.form = {
        key: parameter.key,
        value: parameter.value,
        type: parameter.type,
        category: parameter.category,
        description: parameter.description || '',
        isEditable: parameter.isEditable,
        isPublic: parameter.isPublic || false
      };
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
      this.resetForm();
    },
    
    closeModalOnOverlay(event) {
      if (event.target === event.currentTarget) {
        this.closeModal();
      }
    },
    
    resetForm() {
      this.form = {
        key: '',
        value: '',
        type: 'string',
        category: 'general',
        description: '',
        isEditable: true,
        isPublic: false
      };
    },
    
    async saveParameter() {
      if (!this.form.key || !this.form.value) {
        this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
      }
      
      this.saving = true;
      try {
        let data;
        if (this.isEditing) {
          data = await window.apiService.updateParameter(this.currentParameter.id, this.form);
        } else {
          data = await window.apiService.createParameter(this.form);
        }
        
        if (data.success) {
          this.closeModal();
          await this.loadParameters();
          this.showNotification(
            this.isEditing ? 'Paramètre modifié avec succès' : 'Paramètre créé avec succès',
            'success'
          );
        } else {
          this.showNotification(data.message || 'Erreur lors de la sauvegarde', 'error');
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
      } finally {
        this.saving = false;
      }
    },
    
    confirmDelete(parameter) {
      this.parameterToDelete = parameter;
      this.showDeleteModal = true;
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.parameterToDelete = null;
    },
    
    closeDeleteModalOnOverlay(event) {
      if (event.target === event.currentTarget) {
        this.closeDeleteModal();
      }
    },
    
    async deleteParameter() {
      if (!this.parameterToDelete) return;
      
      this.deleting = true;
      try {
        const data = await window.apiService.deleteParameter(this.parameterToDelete.id);
        
        if (data.success) {
          this.closeDeleteModal();
          await this.loadParameters();
          this.showNotification('Paramètre supprimé avec succès', 'success');
        } else {
          this.showNotification(data.message || 'Erreur lors de la suppression', 'error');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
      } finally {
        this.deleting = false;
      }
    },
    
    getCategoryLabel(category) {
      const labels = {
        'general': 'Général',
        'tenant': 'Tenant',
        'system': 'Système',
        'ui': 'Interface',
        'notification': 'Notification'
      };
      return labels[category] || category;
    },
    
    getTypeLabel(type) {
      const labels = {
        'string': 'Texte',
        'integer': 'Entier',
        'float': 'Décimal',
        'boolean': 'Booléen',
        'json': 'JSON'
      };
      return labels[type] || type;
    },
    
    formatValue(value, type) {
      switch (type) {
        case 'boolean':
          return value === 'true' || value === true ? 'Oui' : 'Non';
        case 'json':
          try {
            return JSON.stringify(JSON.parse(value), null, 2);
          } catch {
            return value;
          }
        default:
          return value;
      }
    },
    
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      `;
      
      const container = document.getElementById('notification-container') || document.body;
      container.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  }
}
</script>

<style scoped>
.parameter-crud {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.search-filter-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-box input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active,
.filter-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.parameters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.parameter-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.parameter-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.parameter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.parameter-key {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.parameter-category {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.parameter-category.general { background: #e3f2fd; color: #1976d2; }
.parameter-category.tenant { background: #f3e5f5; color: #7b1fa2; }
.parameter-category.system { background: #e8f5e8; color: #388e3c; }
.parameter-category.ui { background: #fff3e0; color: #f57c00; }
.parameter-category.notification { background: #fce4ec; color: #c2185b; }

.parameter-value {
  font-family: 'Courier New', monospace;
  background: var(--bg-secondary);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  word-break: break-all;
}

.parameter-description {
  color: var(--text-secondary);
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.parameter-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 0.8rem;
}

.parameter-type {
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.parameter-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.active {
  background: #4caf50;
}

.status-indicator.inactive {
  background: #f44336;
}

.parameter-actions {
  display: flex;
  gap: 8px;
}

.button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-outline:hover {
  background: var(--bg-secondary);
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  padding: 12px 20px;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  padding: 12px 20px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  color: var(--text-tertiary);
}

.empty-state h3 {
  margin-bottom: 12px;
  color: var(--text-primary);
}

.empty-state p {
  margin-bottom: 20px;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.loading-indicator i {
  margin-right: 8px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
}

.modal.show {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  transform: scale(0.9);
  transition: transform 0.3s;
}

.modal.show .modal-content {
  transform: scale(1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.form-group input:disabled {
  background: var(--bg-secondary);
  color: var(--text-tertiary);
}

.form-group label input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.text-warning {
  color: #f57c00;
  font-size: 0.9rem;
}

.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
}

.notification {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

.notification-error {
  border-left: 4px solid #f44336;
}

.notification-success {
  border-left: 4px solid #4caf50;
}

.notification-info {
  border-left: 4px solid #2196f3;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .parameters-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>
