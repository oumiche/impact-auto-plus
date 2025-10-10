/**
 * Service de confirmation centralisé - Version 2 (Approche simplifiée)
 */
class ConfirmationServiceV2 {
    constructor() {
        this.activeConfirmations = new Map();
        this.confirmationCounter = 0;
        this.init();
    }

    init() {
        this.injectCSS();
        console.log('ConfirmationServiceV2 initialisé');
    }

    injectCSS() {
        if (document.getElementById('confirmation-service-css')) return;

        const style = document.createElement('style');
        style.id = 'confirmation-service-css';
        style.textContent = `
            .confirmation-v2-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .confirmation-v2-overlay.show {
                opacity: 1;
            }
            
            .confirmation-v2-modal {
                background: white;
                border-radius: 8px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                transform: scale(0.9);
                transition: transform 0.3s ease;
                position: relative;
            }
            
            .confirmation-v2-overlay.show .confirmation-v2-modal {
                transform: scale(1);
            }
            
            .confirmation-v2-header {
                display: flex;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .confirmation-v2-icon {
                width: 24px;
                height: 24px;
                margin-right: 12px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: 14px;
            }
            
            .confirmation-v2-icon.warning { background: #f59e0b; }
            .confirmation-v2-icon.danger { background: #ef4444; }
            .confirmation-v2-icon.info { background: #3b82f6; }
            .confirmation-v2-icon.success { background: #10b981; }
            
            .confirmation-v2-title {
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0;
            }
            
            .confirmation-v2-message {
                color: #6b7280;
                margin-bottom: 24px;
                line-height: 1.5;
            }
            
            .confirmation-v2-buttons {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            
            .confirmation-v2-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 80px;
            }
            
            .confirmation-v2-btn-cancel {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .confirmation-v2-btn-cancel:hover {
                background: #e5e7eb;
            }
            
            .confirmation-v2-btn-confirm {
                background: #ef4444;
                color: white;
            }
            
            .confirmation-v2-btn-confirm:hover {
                background: #dc2626;
            }
            
            .confirmation-v2-btn-confirm.warning {
                background: #f59e0b;
            }
            
            .confirmation-v2-btn-confirm.warning:hover {
                background: #d97706;
            }
            
            .confirmation-v2-btn-confirm.info {
                background: #3b82f6;
            }
            
            .confirmation-v2-btn-confirm.info:hover {
                background: #2563eb;
            }
            
            .confirmation-v2-btn-confirm.success {
                background: #10b981;
            }
            
            .confirmation-v2-btn-confirm.success:hover {
                background: #059669;
            }
        `;
        document.head.appendChild(style);
    }

    show(config) {
        return new Promise((resolve) => {
            const id = this.generateId();
            const confirmation = this.createConfirmationElement(config, id);
            
            document.body.appendChild(confirmation);
            
            // Forcer le reflow
            confirmation.offsetHeight;
            
            // Afficher avec animation
            confirmation.classList.add('show');
            
            // Stocker la confirmation
            this.activeConfirmations.set(id, {
                element: confirmation,
                resolve: resolve,
                createdAt: Date.now()
            });
            
            console.log('Confirmation V2 créée:', id, 'Total actives:', this.activeConfirmations.size);
            
            // Timeout de sécurité
            const safetyTimeout = setTimeout(() => {
                console.log('Timeout de sécurité pour la confirmation V2:', id);
                this.handleUserChoice(id, false, resolve);
            }, 30000);
            
            // Attendre un peu avant d'activer les interactions
            setTimeout(() => {
                this.setupInteractions(confirmation, id, resolve, safetyTimeout);
            }, 100);
        });
    }

    createConfirmationElement(config, id) {
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-v2-overlay';
        overlay.dataset.confirmationId = id;
        
        const icon = this.getIcon(config.type || 'warning');
        const title = config.title || 'Confirmation';
        const message = config.message || 'Êtes-vous sûr de vouloir continuer ?';
        const confirmText = config.confirmText || 'Confirmer';
        const cancelText = config.cancelText || 'Annuler';
        const confirmClass = config.type || 'danger';
        
        overlay.innerHTML = `
            <div class="confirmation-v2-modal">
                <div class="confirmation-v2-header">
                    <div class="confirmation-v2-icon ${config.type || 'warning'}">${icon}</div>
                    <h3 class="confirmation-v2-title">${title}</h3>
                </div>
                <div class="confirmation-v2-message">${message}</div>
                <div class="confirmation-v2-buttons">
                    <button class="confirmation-v2-btn confirmation-v2-btn-cancel" data-action="cancel">${cancelText}</button>
                    <button class="confirmation-v2-btn confirmation-v2-btn-confirm ${confirmClass}" data-action="confirm">${confirmText}</button>
                </div>
            </div>
        `;
        
        return overlay;
    }

    getIcon(type) {
        const icons = {
            warning: '⚠',
            danger: '🗑',
            info: 'ℹ',
            success: '✓'
        };
        return icons[type] || icons.warning;
    }

    setupInteractions(confirmation, id, resolve, safetyTimeout) {
        const modal = confirmation.querySelector('.confirmation-v2-modal');
        const buttons = confirmation.querySelectorAll('[data-action]');
        
        console.log('Configuration des interactions V2 pour:', id);
        
        // Gestionnaire pour les boutons
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const action = button.dataset.action;
                console.log('Bouton cliqué V2:', action);
                this.handleUserChoice(id, action === 'confirm', resolve, safetyTimeout);
            });
        });
        
        // Gestionnaire pour l'overlay (fermer en cliquant à côté)
        confirmation.addEventListener('click', (e) => {
            if (e.target === confirmation) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Overlay cliqué V2 - fermeture');
                this.handleUserChoice(id, false, resolve, safetyTimeout);
            }
        });
        
        // Gestionnaire pour Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Escape pressé V2');
                this.handleUserChoice(id, false, resolve, safetyTimeout);
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
        
        // Stocker le handler pour le nettoyer plus tard
        confirmation._escapeHandler = escapeHandler;
    }

    handleUserChoice(id, confirmed, resolve, safetyTimeout) {
        console.log('Choix utilisateur V2:', id, confirmed);
        
        const confirmationData = this.activeConfirmations.get(id);
        if (!confirmationData) {
            console.log('Confirmation V2 non trouvée:', id);
            return;
        }
        
        // Nettoyer le timeout de sécurité
        if (safetyTimeout) {
            clearTimeout(safetyTimeout);
        }
        
        // Nettoyer l'event listener Escape
        const confirmation = confirmationData.element;
        const escapeHandler = confirmation._escapeHandler;
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
        }
        
        // Animation de sortie
        confirmation.classList.remove('show');
        
        setTimeout(() => {
            // Supprimer du DOM
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
            
            // Supprimer de la map
            this.activeConfirmations.delete(id);
            console.log('Confirmation V2 supprimée:', id, 'Total actives:', this.activeConfirmations.size);
            
            // Résoudre la promesse
            resolve(confirmed);
        }, 300); // Attendre la fin de l'animation
    }

    generateId() {
        return `confirm_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Méthodes de convenance
    warning(config) {
        return this.show({ ...config, type: 'warning' });
    }

    danger(config) {
        return this.show({ ...config, type: 'danger' });
    }

    info(config) {
        return this.show({ ...config, type: 'info' });
    }

    success(config) {
        return this.show({ ...config, type: 'success' });
    }

    // Nettoyage
    closeAll() {
        console.log('Fermeture de toutes les confirmations V2');
        this.activeConfirmations.forEach((data, id) => {
            this.handleUserChoice(id, false, data.resolve);
        });
    }

    forceCleanup() {
        console.log('Nettoyage forcé des confirmations V2');
        document.querySelectorAll('.confirmation-v2-overlay').forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        this.activeConfirmations.clear();
    }
}

// Instance globale
window.ConfirmationServiceV2 = new ConfirmationServiceV2();

// Alias pour compatibilité
window.confirmationService = window.ConfirmationServiceV2;

// Fonctions globales
window.confirmV2 = (config) => window.ConfirmationServiceV2.show(config);
window.confirmWarningV2 = (config) => window.ConfirmationServiceV2.warning(config);
window.confirmDangerV2 = (config) => window.ConfirmationServiceV2.danger(config);
window.confirmInfoV2 = (config) => window.ConfirmationServiceV2.info(config);
window.confirmSuccessV2 = (config) => window.ConfirmationServiceV2.success(config);
window.closeAllConfirmationsV2 = () => window.ConfirmationServiceV2.closeAll();
window.forceCleanupConfirmationsV2 = () => window.ConfirmationServiceV2.forceCleanup();
