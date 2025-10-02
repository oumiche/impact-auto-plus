/**
 * Impact Auto - Auth Guard
 * Vérification globale de l'authentification et redirection automatique
 */

class AuthGuard {
    constructor() {
        this.apiService = window.apiService;
        this.init();
    }

    init() {
        // Vérifier l'authentification au chargement de la page
        this.checkAuthentication();
        
        // Écouter les changements de localStorage pour détecter la déconnexion
        window.addEventListener('storage', (e) => {
            if (e.key === 'auth_token' && !e.newValue) {
                this.handleLogout();
            }
        });
    }

    /**
     * Vérifier l'authentification de l'utilisateur
     */
    checkAuthentication() {
        // Ignorer la vérification sur les pages de login et de sélection de tenant
        if (this.isLoginPage() || this.isTenantSelectionPage()) {
            return;
        }

        if (!this.apiService.isAuthenticated()) {
            this.handleAuthRequired();
            return;
        }

        // Vérifier si un tenant est sélectionné
        if (!this.hasSelectedTenant()) {
            this.handleTenantRequired();
        }
    }

    /**
     * Vérifier si on est sur une page de login
     */
    isLoginPage() {
        const currentPath = window.location.pathname;
        return currentPath.includes('login') || 
               currentPath.includes('auth') ||
               currentPath === '/' ||
               currentPath === '/index.html';
    }

    /**
     * Vérifier si on est sur la page de sélection de tenant
     */
    isTenantSelectionPage() {
        const currentPath = window.location.pathname;
        return currentPath.includes('tenant-selection');
    }

    /**
     * Vérifier si un tenant est sélectionné
     */
    hasSelectedTenant() {
        const currentTenant = this.apiService.getCurrentTenant();
        return currentTenant && currentTenant.id;
    }

    /**
     * Gérer le cas où l'authentification est requise
     */
    handleAuthRequired() {
        console.warn('Authentification requise - Redirection vers le login');
        
        // Afficher une notification
        this.showAuthNotification('Vous devez être connecté pour accéder à cette page');
        
        // Rediriger vers le login après un délai
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }

    /**
     * Gérer le cas où la sélection de tenant est requise
     */
    handleTenantRequired() {
        console.warn('Sélection de tenant requise - Redirection vers la sélection');
        
        // Afficher une notification
        this.showAuthNotification('Veuillez sélectionner une organisation pour continuer');
        
        // Rediriger vers la page de sélection de tenant après un délai
        setTimeout(() => {
            window.location.href = '/tenant-selection.html';
        }, 2000);
    }

    /**
     * Gérer la déconnexion
     */
    handleLogout() {
        console.log('Déconnexion détectée');
        this.showAuthNotification('Vous avez été déconnecté');
        
        // Rediriger vers le login
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    }

    /**
     * Afficher une notification d'authentification
     */
    showAuthNotification(message) {
        // Supprimer les notifications existantes
        const existingNotifications = document.querySelectorAll('.auth-guard-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Créer une nouvelle notification
        const notification = document.createElement('div');
        notification.className = 'auth-guard-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-shield-alt"></i>
                <span>${message}</span>
                <div class="loading-spinner"></div>
            </div>
        `;
        
        // Styles pour la notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
            text-align: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            animation: slideDown 0.3s ease-out;
        `;
        
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            font-weight: 500;
        `;
        
        // Ajouter l'animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideDown 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Forcer la vérification de l'authentification
     */
    forceCheck() {
        this.checkAuthentication();
    }
}

// Initialiser l'AuthGuard quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que ApiService soit disponible
    if (window.apiService) {
        window.authGuard = new AuthGuard();
    } else {
        // Attendre un peu et réessayer
        setTimeout(() => {
            if (window.apiService) {
                window.authGuard = new AuthGuard();
            }
        }, 100);
    }
});

// Exporter la classe pour utilisation globale
window.AuthGuard = AuthGuard;
