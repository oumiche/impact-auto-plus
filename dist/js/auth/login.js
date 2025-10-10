/**
 * Impact Auto - Login Page JavaScript
 * Gestion de la connexion utilisateur avec support multi-tenant
 */

class ImpactAutoLogin {
    constructor() {
        this.form = document.getElementById('login-form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('login-btn');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.errorMessage = document.getElementById('error-message');
        this.successMessage = document.getElementById('success-message');
        
        this.init();
    }

    init() {
        // Vérifier si l'utilisateur est déjà connecté
        this.checkExistingAuth();
        
        // Ajouter le bouton de déconnexion si nécessaire
        this.addLogoutButton();
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        this.forgotPasswordLink = document.getElementById('forgot-password-link');
        if (this.forgotPasswordLink) {
            this.forgotPasswordLink.addEventListener('click', (e) => this.handleForgotPassword(e));
        }
    }

    checkExistingAuth() {
        // Vérifier si l'utilisateur est déjà connecté
        if (window.apiService && window.apiService.isAuthenticated()) {
            this.showSuccess('Vous êtes déjà connecté. Redirection...');
            
            // Vérifier si un tenant est sélectionné
            const currentTenant = window.apiService.getCurrentTenant();
            if (currentTenant && currentTenant.id) {
                // Tenant sélectionné, rediriger vers le dashboard
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 2000);
            } else {
                // Pas de tenant sélectionné, rediriger vers la sélection
                setTimeout(() => {
                    window.location.href = '/tenant-selection.html';
                }, 2000);
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.form) {
            console.error('Formulaire de connexion non trouvé');
            return;
        }
        
        if (!this.validateForm()) {
            return;
        }

        this.showLoading(true);
        this.clearMessages();

        try {
            // Détecter si c'est un email ou un username
            const identifier = this.emailInput.value.trim();
            const isEmail = identifier.includes('@');
            
            // Utiliser le service API Symfony
            const data = await window.apiService.login(
                identifier,
                this.passwordInput.value,
                isEmail
            );

            if (data.token) {
                // Utiliser directement les données de l'API (pas de données hardcodées)
                const loginData = {
                    token: data.token,
                    user: data.user // Utiliser les vraies données de l'API
                };
                this.handleLoginSuccess(loginData);
            } else {
                this.showError(data.message || 'Erreur de connexion');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Gestion spécifique des erreurs d'authentification
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                this.showError('Email ou mot de passe incorrect');
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                this.showError('Accès refusé. Vérifiez vos permissions');
            } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
                this.showError('Erreur du serveur. Veuillez réessayer plus tard');
            } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                this.showError('Erreur de connexion. Vérifiez votre connexion internet');
            } else {
                this.showError('Erreur de connexion: ' + error.message);
            }
        } finally {
            this.showLoading(false);
        }
    }

    handleLoginSuccess(data) {
        try {
            // Stocker les données dans localStorage (compatible avec le dashboard)
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('current_user', JSON.stringify(data.user));
            
            // Mettre à jour le token dans ApiService
            if (window.apiService) {
                window.apiService.setToken(data.token);
            }
            
            // Afficher un message de succès
            this.showSuccess('Connexion réussie ! Redirection...');
            
            // Rediriger vers la sélection de tenant (les tenants seront chargés depuis l'API)
            setTimeout(() => {
                window.location.href = '/tenant-selection.html';
            }, 1500);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données:', error);
            this.showError('Erreur lors de la sauvegarde des données de connexion');
        }
    }


    redirectToDashboard() {
        // Rediriger vers le dashboard
        window.location.href = '/dashboard-vue.html';
    }

    validateForm() {
        let isValid = true;
        
        if (!this.emailInput || !this.passwordInput) {
            console.error('Éléments de formulaire non trouvés');
            return false;
        }
        
        // Validation email ou username
        if (!this.emailInput.value.trim()) {
            this.showFieldError('email', 'L\'email ou nom d\'utilisateur est requis');
            isValid = false;
        } else {
            this.clearFieldError('email');
        }

        // Validation mot de passe
        if (!this.passwordInput.value) {
            this.showFieldError('password', 'Le mot de passe est requis');
            isValid = false;
        } else {
            this.clearFieldError('password');
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(fieldName + '-error');
        
        field.classList.add('is-danger');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearFieldError(fieldName) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(fieldName + '-error');
        
        field.classList.remove('is-danger');
        errorElement.style.display = 'none';
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    showSuccess(message) {
        if (this.successMessage) {
            this.successMessage.textContent = message;
            this.successMessage.style.display = 'block';
        }
    }

    clearMessages() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
        if (this.successMessage) {
            this.successMessage.style.display = 'none';
        }
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
        
        if (this.loginBtn) {
            this.loginBtn.classList.toggle('is-loading', show);
            this.loginBtn.disabled = show;
        }
    }

    handleForgotPassword(e) {
        e.preventDefault();
        // TODO: Implémenter la réinitialisation de mot de passe
        this.showError('Fonctionnalité de réinitialisation de mot de passe à venir');
    }

    /**
     * Déconnexion de l'utilisateur
     */
    logout() {
        try {
            // Supprimer toutes les données de session
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('current_tenant');
            localStorage.removeItem('available_tenants');
            
            // Réinitialiser ApiService
            if (window.apiService) {
                window.apiService.token = null;
            }
            
            // Afficher un message de déconnexion
            this.showSuccess('Déconnexion réussie');
            
            // Recharger la page après un délai
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            this.showError('Erreur lors de la déconnexion');
        }
    }

    /**
     * Ajouter un bouton de déconnexion si l'utilisateur est connecté
     */
    addLogoutButton() {
        if (window.apiService && window.apiService.isAuthenticated()) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'button is-danger is-outlined is-small';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Se déconnecter';
            logoutBtn.addEventListener('click', () => this.logout());
            
            // Ajouter le bouton dans le footer
            const footer = document.querySelector('.login-footer');
            if (footer) {
                footer.appendChild(logoutBtn);
            }
        }
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new ImpactAutoLogin();
});
