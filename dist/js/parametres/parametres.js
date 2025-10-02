/**
 * Impact Auto - Gestion des Paramètres
 * CRUD complet pour les paramètres système
 */

class ParametresManager {
    constructor() {
        this.parameters = [];
        this.currentParameter = null;
        this.searchTerm = '';
        
        this.init();
    }

    async init() {
        this.checkAuthentication();
        this.setupEventListeners();
        await this.loadParameters();
    }

    checkAuthentication() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // L'affichage utilisateur est maintenant géré par le composant sidebar
    }

    // La mise à jour de l'interface utilisateur est maintenant gérée par le composant sidebar

    setupEventListeners() {
        // Bouton d'ajout
        const addBtn = document.getElementById('add-parameter-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openParameterModal();
            });
        }

        // Bouton de sauvegarde (modal-save dans le HTML)
        const saveBtn = document.getElementById('modal-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveParameter();
            });
        }

        // Bouton de suppression (delete-confirm dans le HTML)
        const deleteBtn = document.getElementById('delete-confirm');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteParameter();
            });
        }

        // Recherche
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.renderParameters();
            });
        }

        // Le bouton de déconnexion est maintenant géré par le composant sidebar

        // Navigation sidebar
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    async loadParameters() {
        this.showLoading(true);
        
        try {
            // Utiliser l'API Symfony
            const data = await window.apiService.getParameters();
            
            if (data.success) {
                this.parameters = data.data;
                this.renderParameters();
            } else {
                this.showError(data.message || 'Erreur lors du chargement des paramètres');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            this.showError('Erreur lors du chargement des paramètres: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderParameters() {
        const grid = document.getElementById('parameters-grid');
        
        if (this.parameters.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-cog"></i>
                    <h3>Aucun paramètre trouvé</h3>
                    <p>Commencez par ajouter un nouveau paramètre.</p>
                    <button class="button btn-primary" onclick="parametresManager.openParameterModal()">
                        <i class="fas fa-plus"></i> Ajouter un paramètre
                    </button>
                </div>
            `;
            return;
        }

        const filteredParameters = this.parameters.filter(param => 
            param.key.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            param.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            param.category.toLowerCase().includes(this.searchTerm.toLowerCase())
        );

        grid.innerHTML = filteredParameters.map(param => `
            <div class="parameter-card">
                <div class="parameter-header">
                    <div class="parameter-key">${param.key}</div>
                    <div class="parameter-category ${param.category}">${this.getCategoryLabel(param.category)}</div>
                </div>
                <div class="parameter-body">
                    <div class="parameter-value">${this.formatValue(param.value, param.type)}</div>
                    <div class="parameter-description">${param.description || 'Aucune description'}</div>
                    <div class="parameter-meta">
                        <div class="parameter-type">${this.getTypeLabel(param.type)}</div>
                        <div class="parameter-status">
                            <div class="status-indicator ${param.is_active ? 'active' : 'inactive'}"></div>
                            ${param.is_active ? 'Actif' : 'Inactif'}
                        </div>
                    </div>
                    <div class="parameter-actions">
                        <button class="button btn-outline btn-sm" onclick="parametresManager.editParameter(${param.id})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="button btn-danger btn-sm" onclick="parametresManager.confirmDelete(${param.id})">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCategoryLabel(category) {
        const labels = {
            'general': 'Général',
            'tenant': 'Tenant',
            'system': 'Système',
            'ui': 'Interface',
            'notification': 'Notification'
        };
        return labels[category] || category;
    }

    getTypeLabel(type) {
        const labels = {
            'string': 'Texte',
            'number': 'Nombre',
            'boolean': 'Booléen',
            'json': 'JSON'
        };
        return labels[type] || type;
    }

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
    }

    openParameterModal(parameter = null) {
        this.currentParameter = parameter;
        const modal = document.getElementById('parameter-modal');
        const form = document.getElementById('parameter-form');
        
        if (!modal) {
            console.error('Modal parameter-modal non trouvé');
            return;
        }
        
        if (parameter) {
            const modalTitle = document.getElementById('modal-title');
            if (modalTitle) modalTitle.textContent = 'Modifier le paramètre';
            
            const paramKey = document.getElementById('param-key');
            if (paramKey) paramKey.value = parameter.key;
            
            const paramValue = document.getElementById('param-value');
            if (paramValue) paramValue.value = parameter.value;
            
            const paramType = document.getElementById('param-type');
            if (paramType) paramType.value = parameter.type;
            
            const paramDescription = document.getElementById('param-description');
            if (paramDescription) paramDescription.value = parameter.description || '';
            
            const paramEditable = document.getElementById('param-editable');
            if (paramEditable) paramEditable.checked = parameter.is_editable;
        } else {
            const modalTitle = document.getElementById('modal-title');
            if (modalTitle) modalTitle.textContent = 'Nouveau paramètre';
            
            if (form) form.reset();
            
            const paramEditable = document.getElementById('param-editable');
            if (paramEditable) paramEditable.checked = true;
        }
        
        modal.classList.add('show');
    }

    closeParameterModal() {
        const modal = document.getElementById('parameter-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentParameter = null;
    }

    async saveParameter() {
        const form = document.getElementById('parameter-form');
        const formData = new FormData(form);
        
        const parameter = {
            key: formData.get('key'),
            value: formData.get('value'),
            description: formData.get('description'),
            category: formData.get('category'),
            type: formData.get('type'),
            is_active: formData.get('is_active') === 'on'
        };

        if (!parameter.key || !parameter.value) {
            this.showError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            let data;
            if (this.currentParameter) {
                // Mise à jour
                data = await window.apiService.updateParameter(this.currentParameter.id, parameter);
            } else {
                // Création
                data = await window.apiService.createParameter(parameter);
            }

            if (data.success) {
                this.closeParameterModal();
                await this.loadParameters();
                this.showSuccess(this.currentParameter ? 'Paramètre modifié avec succès' : 'Paramètre créé avec succès');
            } else {
                this.showError(data.message || 'Erreur lors de la sauvegarde du paramètre');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showError('Erreur lors de la sauvegarde du paramètre: ' + error.message);
        }
    }

    async createParameter(parameter) {
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        parameter.id = Date.now(); // ID temporaire
        parameter.created_at = new Date().toISOString();
        parameter.updated_at = new Date().toISOString();
        
        this.parameters.push(parameter);
    }

    async updateParameter(parameter) {
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const index = this.parameters.findIndex(p => p.id === parameter.id);
        if (index !== -1) {
            parameter.updated_at = new Date().toISOString();
            this.parameters[index] = { ...this.parameters[index], ...parameter };
        }
    }

    editParameter(id) {
        const parameter = this.parameters.find(p => p.id === id);
        if (parameter) {
            this.openParameterModal(parameter);
        }
    }

    confirmDelete(id) {
        this.currentParameter = this.parameters.find(p => p.id === id);
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentParameter = null;
    }

    async deleteParameter() {
        if (!this.currentParameter) return;

        try {
            const data = await window.apiService.deleteParameter(this.currentParameter.id);
            
            if (data.success) {
                this.closeDeleteModal();
                await this.loadParameters();
                this.showSuccess('Paramètre supprimé avec succès');
            } else {
                this.showError(data.message || 'Erreur lors de la suppression du paramètre');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.showError('Erreur lors de la suppression du paramètre: ' + error.message);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
        
        // Alternative: utiliser l'élément loading-indicator qui existe dans le HTML
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        // Créer une notification d'erreur
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        // Créer une notification de succès
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // La déconnexion est maintenant gérée par le composant sidebar
}

// Fonctions globales pour les modals
function closeParameterModal() {
    parametresManager.closeParameterModal();
}

function closeDeleteModal() {
    parametresManager.closeDeleteModal();
}

// Le toggleSidebar est maintenant géré par le composant sidebar

// Initialiser l'application
let parametresManager;
document.addEventListener('DOMContentLoaded', () => {
    parametresManager = new ParametresManager();
});
