<template>
  <div class="user-crud">
    <div class="page-header">
      <h1 class="section-title">Gestion des Utilisateurs</h1>
      <p class="page-subtitle">Gérez les utilisateurs et leurs permissions</p>
      
      <div class="header-actions">
        <button @click="openModal" class="btn btn-primary">
          <i class="fas fa-plus"></i> Nouvel Utilisateur
        </button>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Rechercher un utilisateur..."
          class="search-input"
        >
      </div>
      
      <div class="filter-buttons">
        <button 
          v-for="filter in statusFilters" 
          :key="filter.value"
          @click="activeFilter = filter.value"
          :class="['filter-btn', { active: activeFilter === filter.value }]"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Liste des utilisateurs -->
    <div class="users-section" v-if="!loading">
      <div class="users-grid">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id"
          class="user-card"
        >
          <div class="user-header">
            <div class="user-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="user-status">
              <span :class="['status-badge', user.status]">
                {{ getUserStatusLabel(user.status) }}
              </span>
            </div>
          </div>
          
          <div class="user-info">
            <h3 class="user-name">{{ user.firstName }} {{ user.lastName }}</h3>
            <p class="user-email">{{ user.email }}</p>
            <p class="user-role">{{ getUserRoleLabel(user.role) }}</p>
          </div>
          
          <div class="user-actions">
            <button @click="editUser(user)" class="btn btn-sm btn-outline">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="deleteUser(user)" class="btn btn-sm btn-danger">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <i class="fas fa-users"></i>
        <h3>Aucun utilisateur trouvé</h3>
        <p>Il n'y a aucun utilisateur correspondant à vos critères de recherche.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Chargement des utilisateurs...</p>
    </div>

    <!-- Modal d'ajout/modification -->
    <div v-if="showModal" class="modal show" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</h2>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="saveUser" class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Prénom *</label>
              <input 
                id="firstName"
                v-model="form.firstName" 
                type="text" 
                required
                class="form-control"
              >
            </div>
            
            <div class="form-group">
              <label for="lastName">Nom *</label>
              <input 
                id="lastName"
                v-model="form.lastName" 
                type="text" 
                required
                class="form-control"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">Email *</label>
            <input 
              id="email"
              v-model="form.email" 
              type="email" 
              required
              class="form-control"
            >
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="role">Rôle *</label>
              <select id="role" v-model="form.role" required class="form-control">
                <option value="">Sélectionner un rôle</option>
                <option value="admin">Administrateur</option>
                <option value="manager">Gestionnaire</option>
                <option value="user">Utilisateur</option>
                <option value="readonly">Lecture seule</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="status">Statut</label>
              <select id="status" v-model="form.status" class="form-control">
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="phone">Téléphone</label>
            <input 
              id="phone"
              v-model="form.phone" 
              type="tel" 
              class="form-control"
            >
          </div>
          
          <div v-if="!isEditing" class="form-group">
            <label for="password">Mot de passe *</label>
            <input 
              id="password"
              v-model="form.password" 
              type="password" 
              :required="!isEditing"
              class="form-control"
            >
          </div>
          
          <div v-if="!isEditing" class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe *</label>
            <input 
              id="confirmPassword"
              v-model="form.confirmPassword" 
              type="password" 
              :required="!isEditing"
              class="form-control"
            >
          </div>
          
          <div class="form-group">
            <label>
              <input 
                v-model="form.isEmailVerified" 
                type="checkbox"
              >
              Email vérifié
            </label>
          </div>
          
          <div class="form-group">
            <label>
              <input 
                v-model="form.mustChangePassword" 
                type="checkbox"
              >
              Doit changer le mot de passe à la prochaine connexion
            </label>
          </div>
        </form>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Annuler</button>
          <button @click="saveUser" class="btn btn-primary" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            {{ isEditing ? 'Modifier' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de suppression -->
    <div v-if="showDeleteModal" class="modal show" @click.self="closeDeleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Confirmer la suppression</h2>
          <button @click="closeDeleteModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete?.firstName }} {{ userToDelete?.lastName }}</strong> ?</p>
          <p class="text-warning">Cette action est irréversible.</p>
        </div>
        
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-secondary">Annuler</button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="deleting">
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            Supprimer
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
  name: 'UserCrud',
  data() {
    return {
      loading: false,
      saving: false,
      deleting: false,
      users: [],
      searchTerm: '',
      activeFilter: 'all',
      showModal: false,
      showDeleteModal: false,
      isEditing: false,
      currentUser: null,
      userToDelete: null,
      form: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        status: 'active',
        password: '',
        confirmPassword: '',
        isEmailVerified: false,
        mustChangePassword: false
      },
      statusFilters: [
        { value: 'all', label: 'Tous' },
        { value: 'active', label: 'Actifs' },
        { value: 'inactive', label: 'Inactifs' },
        { value: 'suspended', label: 'Suspendus' }
      ],
      roles: [
        { value: 'admin', label: 'Administrateur' },
        { value: 'manager', label: 'Gestionnaire' },
        { value: 'user', label: 'Utilisateur' },
        { value: 'readonly', label: 'Lecture seule' }
      ]
    };
  },
  
  computed: {
    filteredUsers() {
      let filtered = this.users;
      
      // Filtrage par statut
      if (this.activeFilter !== 'all') {
        filtered = filtered.filter(user => user.status === this.activeFilter);
      }
      
      // Filtrage par recherche
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        filtered = filtered.filter(user => 
          user.firstName.toLowerCase().includes(search) ||
          user.lastName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.role.toLowerCase().includes(search)
        );
      }
      
      return filtered;
    }
  },
  
  async mounted() {
    await this.loadUsers();
  },
  
  methods: {
    async loadUsers() {
      this.loading = true;
      try {
        // Vérifier si l'utilisateur est authentifié
        if (!window.apiService.isAuthenticated()) {
          this.showNotification('Vous devez être connecté pour accéder aux utilisateurs', 'error');
          this.users = [];
          return;
        }

        const data = await window.apiService.getUsers();
        if (data.success) {
          this.users = data.data || [];
        } else {
          this.showNotification(data.message || 'Erreur lors du chargement des utilisateurs', 'error');
          this.users = [];
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        
        // Gestion spécifique des erreurs d'authentification
        if (error.message.includes('401') || error.message.includes('JWT Token not found')) {
          this.showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
          // Optionnel: rediriger vers la page de connexion
          // window.location.href = '/login.html';
        } else {
          this.showNotification('Erreur lors du chargement des utilisateurs: ' + error.message, 'error');
        }
        this.users = [];
      } finally {
        this.loading = false;
      }
    },
    
    openModal(user = null) {
      this.isEditing = !!user;
      this.currentUser = user;
      
      if (user) {
        this.form = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || '',
          status: user.status || 'active',
          password: '',
          confirmPassword: '',
          isEmailVerified: user.isEmailVerified || false,
          mustChangePassword: user.mustChangePassword || false
        };
      } else {
        this.resetForm();
      }
      
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
      this.isEditing = false;
      this.currentUser = null;
      this.resetForm();
    },
    
    resetForm() {
      this.form = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        status: 'active',
        password: '',
        confirmPassword: '',
        isEmailVerified: false,
        mustChangePassword: false
      };
    },
    
    async saveUser() {
      if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.role) {
        this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
      }
      
      if (!this.isEditing && (!this.form.password || !this.form.confirmPassword)) {
        this.showNotification('Le mot de passe est obligatoire pour un nouvel utilisateur', 'error');
        return;
      }
      
      if (!this.isEditing && this.form.password !== this.form.confirmPassword) {
        this.showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
      }
      
      this.saving = true;
      try {
        const userData = { ...this.form };
        
        // Ne pas envoyer les champs vides pour l'édition
        if (this.isEditing) {
          delete userData.password;
          delete userData.confirmPassword;
        }
        
        const data = this.isEditing 
          ? await window.apiService.updateUser(this.currentUser.id, userData)
          : await window.apiService.createUser(userData);
        
        if (data.success) {
          this.closeModal();
          await this.loadUsers();
          this.showNotification(
            this.isEditing ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès',
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
    
    editUser(user) {
      this.openModal(user);
    },
    
    deleteUser(user) {
      this.userToDelete = user;
      this.showDeleteModal = true;
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.userToDelete = null;
    },
    
    async confirmDelete() {
      if (!this.userToDelete) return;
      
      this.deleting = true;
      try {
        const data = await window.apiService.deleteUser(this.userToDelete.id);
        
        if (data.success) {
          this.closeDeleteModal();
          await this.loadUsers();
          this.showNotification('Utilisateur supprimé avec succès', 'success');
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
    
    getUserStatusLabel(status) {
      const labels = {
        'active': 'Actif',
        'inactive': 'Inactif',
        'suspended': 'Suspendu'
      };
      return labels[status] || status;
    },
    
    getUserRoleLabel(role) {
      const labels = {
        'admin': 'Administrateur',
        'manager': 'Gestionnaire',
        'user': 'Utilisateur',
        'readonly': 'Lecture seule'
      };
      return labels[role] || role;
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
};
</script>

<style scoped>
.user-crud {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.section-title {
  color: var(--text-primary, #333);
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.page-subtitle {
  color: var(--text-secondary, #666);
  margin: 5px 0 0 0;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
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
  color: var(--text-secondary, #666);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #333);
  box-sizing: border-box;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color, #ddd);
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #333);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-secondary, #f8f9fa);
}

.filter-btn.active {
  background: var(--primary-color, #007bff);
  color: white;
  border-color: var(--primary-color, #007bff);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.user-card {
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary-color, #007bff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.suspended {
  background: #fff3cd;
  color: #856404;
}

.user-info {
  margin-bottom: 15px;
}

.user-name {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.user-email {
  margin: 0 0 5px 0;
  color: var(--text-secondary, #666);
  font-size: 0.9rem;
}

.user-role {
  margin: 0;
  color: var(--primary-color, #007bff);
  font-size: 0.85rem;
  font-weight: 500;
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary, #666);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 20px;
  color: var(--border-color, #ddd);
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary, #666);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 15px;
  color: var(--primary-color, #007bff);
}

/* Modal Styles */
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
  opacity: 1 !important;
  visibility: visible !important;
}

.modal-content {
  background: var(--bg-primary, #fff);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: scale(0.95);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.modal.show .modal-content {
  transform: scale(1) !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color, #ddd);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary, #333);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-secondary, #666);
  cursor: pointer;
  padding: 5px;
}

.modal-body {
  padding: 20px;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--border-color, #ddd);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  margin-bottom: 20px;
  width: 100%;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary, #333);
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #333);
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.4;
}

.form-control:focus {
  border-color: var(--primary-color, #007bff);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  outline: none;
}

.form-group input[type="checkbox"] {
  margin-right: 8px;
}

.text-warning {
  color: #f57c00;
  font-size: 0.9rem;
}

/* Button Styles */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.btn-primary {
  background: var(--primary-color, #007bff);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: var(--bg-secondary, #f8f9fa);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #ddd);
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-outline {
  background: transparent;
  color: var(--primary-color, #007bff);
  border: 1px solid var(--primary-color, #007bff);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color, #007bff);
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Notification Styles */
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.notification-container .notification {
  pointer-events: auto;
}

.notification {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  color: #333333;
  font-size: 14px;
  font-weight: 500;
  min-width: 300px;
  max-width: 500px;
}

.notification i {
  font-size: 16px;
  margin-right: 8px;
}

.notification span {
  flex: 1;
  color: #333333;
  line-height: 1.4;
}

.notification-error {
  border-left: 4px solid #f44336;
  background: #ffebee;
  border-color: #ffcdd2;
}

.notification-error i {
  color: #f44336;
}

.notification-success {
  border-left: 4px solid #4caf50;
  background: #e8f5e8;
  border-color: #c8e6c9;
}

.notification-success i {
  color: #4caf50;
}

.notification-info {
  border-left: 4px solid #2196f3;
  background: #e3f2fd;
  border-color: #bbdefb;
}

.notification-info i {
  color: #2196f3;
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

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style>
