/**
 * Impact Auto - Tenant Selection Page JavaScript
 * Gestion de la sélection de tenant pour utilisateurs multi-tenant
 */

class ImpactAutoTenantSelection {
    constructor() {
        this.user = null;
        this.tenants = [];
        this.selectedTenant = null;
        this.tenantList = document.getElementById('tenant-list');
        this.continueButton = document.getElementById('continue-button');
        this.backButton = document.getElementById('back-button');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.errorMessage = document.getElementById('error-message');
        
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
    }

    async loadUserData() {
        // Charger les données utilisateur depuis localStorage (système JWT actuel)
        const userData = localStorage.getItem('current_user');
        const token = localStorage.getItem('auth_token');
        
        if (!userData || !token) {
            this.showError('Données de session manquantes. Veuillez vous reconnecter.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 3000);
            return;
        }

        this.user = JSON.parse(userData);
        
        // Charger les tenants depuis l'API
        await this.loadTenants();
        
        this.updateWelcomeMessage();
        this.renderTenants();
        
        // Vérifier si l'utilisateur vient d'un changement volontaire de tenant
        this.checkTenantChangeContext();
    }

    async loadTenants() {
        try {
            console.log('Loading tenants...');
            const result = await window.apiService.getAvailableTenants();
            console.log('Tenants result:', result);

            if (result.success) {
                this.tenants = result.tenants || [];
                console.log('Tenants loaded:', this.tenants);
            } else {
                this.showError('Erreur lors du chargement des organisations: ' + result.message);
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
            console.error('Error loading tenants:', error);
        }
    }

    updateWelcomeMessage() {
        const userNameElement = document.getElementById('user-name');
        userNameElement.textContent = this.user.firstName || this.user.email || this.user.username || 'Utilisateur';
    }

    checkTenantChangeContext() {
        // Vérifier si l'utilisateur a déjà un tenant sélectionné (changement volontaire)
        const currentTenant = window.apiService.getCurrentTenant();
        if (currentTenant && currentTenant.id) {
            // Sauvegarder le tenant actuel comme tenant précédent
            localStorage.setItem('previous_tenant', JSON.stringify(currentTenant));
            
            // Marquer le tenant actuel comme sélectionné
            const currentTenantElement = document.querySelector(`[data-tenant-id="${currentTenant.id}"]`);
            if (currentTenantElement) {
                this.selectTenant(currentTenant, currentTenantElement);
            }
            
            // Modifier le message pour indiquer un changement de tenant
            const welcomeTitle = document.getElementById('welcome-title');
            if (welcomeTitle) {
                welcomeTitle.innerHTML = `Changer d'Organisation - <span id="user-name">${this.user.firstName || this.user.email || this.user.username || 'Utilisateur'}</span>`;
            }
            
            const welcomeMessage = document.querySelector('.welcome-message p');
            if (welcomeMessage) {
                welcomeMessage.innerHTML = `Vous travaillez actuellement avec <strong>${currentTenant.name}</strong>. Sélectionnez une autre organisation pour changer de contexte.`;
            }
        }
    }

    renderTenants() {
        console.log('Rendering tenants:', this.tenants);
        this.tenantList.innerHTML = '';
        
        // Mettre à jour le compteur de tenants
        const tenantCountElement = document.getElementById('tenant-count');
        if (tenantCountElement) {
            tenantCountElement.textContent = this.tenants.length;
        }
        
        if (this.tenants.length === 0) {
            this.tenantList.innerHTML = '<p class="text-center text-muted">Aucune organisation disponible</p>';
            return;
        }
        
        this.tenants.forEach((tenant, index) => {
            const tenantElement = this.createTenantElement(tenant, index);
            this.tenantList.appendChild(tenantElement);
        });
    }

    createTenantElement(tenant, index) {
        const div = document.createElement('div');
        div.className = 'tenant-item';
        div.dataset.tenantId = tenant.id;
        div.dataset.index = index;
        
        div.innerHTML = `
            <div class="tenant-header">
                <div class="tenant-name">${tenant.name}</div>
                ${tenant.is_primary ? '<div class="primary-badge"><i class="fas fa-star"></i> Principal</div>' : ''}
            </div>
            <div class="tenant-slug">
                <i class="fas fa-link"></i>
                <span>${tenant.slug}</span>
            </div>
            <div class="tenant-description">${tenant.description || 'Organisation de gestion de parc automobile'}</div>
            <div class="tenant-permissions">
                ${tenant.permissions ? tenant.permissions.map(perm => `<span class="permission-tag">${perm}</span>`).join('') : '<span class="permission-tag">Permissions standard</span>'}
            </div>
        `;
        
        div.addEventListener('click', () => this.selectTenant(tenant, div));
        
        return div;
    }

    selectTenant(tenant, element) {
        // Désélectionner tous les autres
        document.querySelectorAll('.tenant-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Sélectionner celui-ci
        element.classList.add('selected');
        this.selectedTenant = tenant;
        this.continueButton.disabled = false;
    }

    setupEventListeners() {
        this.continueButton.addEventListener('click', () => this.handleContinue());
        this.backButton.addEventListener('click', () => this.handleBack());
    }

    async handleContinue() {
        if (!this.selectedTenant) {
            this.showError('Veuillez sélectionner une organisation');
            return;
        }

        this.showLoading(true);

        try {
            const result = await window.apiService.switchTenant(this.selectedTenant.id);

            if (result.success) {
                // Stocker le tenant sélectionné dans localStorage
                localStorage.setItem('current_tenant', JSON.stringify(result.tenant));
                
                // Vérifier si c'est un changement de tenant (pas une première sélection)
                const previousTenant = JSON.parse(localStorage.getItem('previous_tenant') || 'null');
                const isTenantChange = previousTenant && previousTenant.id !== this.selectedTenant.id;
                
                if (isTenantChange) {
                    // Rediriger vers la page précédente ou le dashboard
                    const referrer = document.referrer;
                    if (referrer && !referrer.includes('tenant-selection') && !referrer.includes('login')) {
                        window.location.href = referrer;
                    } else {
                        window.location.href = '/dashboard-vue.html';
                    }
                } else {
                    // Première sélection, rediriger vers le dashboard
                    window.location.href = '/dashboard-vue.html';
                }
            } else {
                this.showError(result.message || 'Erreur lors de la sélection de l\'organisation');
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
            console.error('Tenant selection error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    handleBack() {
        // Retourner à la page de connexion
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_tenant');
        window.location.href = '/login-simple.html';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
        this.continueButton.disabled = show;
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new ImpactAutoTenantSelection();
});
