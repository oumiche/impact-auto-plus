/**
 * Service de confirmations centralisé - VERSION ARCHIVÉE
 * Utilisez maintenant confirmation-service-v2.js
 * 
 * Service de confirmations centralisé pour l'application Impact Auto
 * Gère l'affichage, l'animation et la gestion des boîtes de confirmation
 */
class ConfirmationService {
    constructor() {
        this.container = null;
        this.activeConfirmations = new Map(); // Pour tracker les confirmations actives
        this.zIndexBase = 10000; // Z-index de base pour les confirmations
        this.init();
    }

    /**
     * Initialise le service de confirmations
     */
    init() {
        this.createContainer();
        this.setupGlobalStyles();
    }

    /**
     * Crée le conteneur de confirmations s'il n'existe pas
     */
    createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'confirmation-container';
            this.container.className = 'confirmation-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Configure les styles globaux si nécessaire
     */
    setupGlobalStyles() {
        // Vérifier si les styles sont déjà présents
        if (!document.getElementById('confirmation-styles')) {
            const style = document.createElement('style');
            style.id = 'confirmation-styles';
            style.textContent = `
                .confirmation-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    pointer-events: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .confirmation-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(2px);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: auto;
                }

                .confirmation-overlay.show {
                    opacity: 1;
                }

                .confirmation-modal {
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    min-width: 400px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    opacity: 0;
                    transform: scale(0.8) translateY(-20px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: auto;
                    position: relative;
                    z-index: 1;
                }

                .confirmation-modal.show {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }

                .confirmation-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 20px 24px 16px;
                    border-bottom: 1px solid #e9ecef;
                }

                .confirmation-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .confirmation-icon-warning {
                    background: #fff3cd;
                    color: #856404;
                    border: 2px solid #ffeaa7;
                }

                .confirmation-icon-danger {
                    background: #f8d7da;
                    color: #721c24;
                    border: 2px solid #f5c6cb;
                }

                .confirmation-icon-info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 2px solid #bee5eb;
                }

                .confirmation-icon-success {
                    background: #d4edda;
                    color: #155724;
                    border: 2px solid #c3e6cb;
                }

                .confirmation-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 0;
                    flex: 1;
                }

                .confirmation-body {
                    padding: 20px 24px;
                }

                .confirmation-message {
                    font-size: 14px;
                    color: #495057;
                    line-height: 1.5;
                    margin: 0;
                }

                .confirmation-details {
                    margin-top: 12px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 3px solid #6c757d;
                }

                .confirmation-details-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #6c757d;
                    margin: 0 0 4px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .confirmation-details-content {
                    font-size: 13px;
                    color: #495057;
                    margin: 0;
                }

                .confirmation-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 16px 24px 20px;
                    border-top: 1px solid #e9ecef;
                    background: #f8f9fa;
                    border-radius: 0 0 12px 12px;
                }

                .confirmation-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 80px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .confirmation-btn-primary {
                    background: #007bff;
                    color: white;
                }

                .confirmation-btn-primary:hover {
                    background: #0056b3;
                }

                .confirmation-btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .confirmation-btn-secondary:hover {
                    background: #545b62;
                }

                .confirmation-btn-danger {
                    background: #dc3545;
                    color: white;
                }

                .confirmation-btn-danger:hover {
                    background: #c82333;
                }

                .confirmation-btn-outline {
                    background: transparent;
                    color: #6c757d;
                    border: 1px solid #dee2e6;
                }

                .confirmation-btn-outline:hover {
                    background: #f8f9fa;
                    color: #495057;
                }

                .confirmation-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Animation pour la fermeture */
                .confirmation-modal.closing {
                    opacity: 0;
                    transform: scale(0.8) translateY(-20px);
                }

                .confirmation-overlay.closing {
                    opacity: 0;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .confirmation-modal {
                        min-width: auto;
                        width: 95%;
                        margin: 20px;
                    }
                    
                    .confirmation-header {
                        padding: 16px 20px 12px;
                    }
                    
                    .confirmation-body {
                        padding: 16px 20px;
                    }
                    
                    .confirmation-footer {
                        padding: 12px 20px 16px;
                        flex-direction: column;
                    }
                    
                    .confirmation-btn {
                        width: 100%;
                    }
                }

                /* Styles pour les types spéciaux */
                .confirmation-type-destructive .confirmation-icon {
                    background: #f8d7da;
                    color: #721c24;
                    border-color: #f5c6cb;
                }

                .confirmation-type-destructive .confirmation-title {
                    color: #721c24;
                }

                .confirmation-type-destructive .confirmation-btn-primary {
                    background: #dc3545;
                }

                .confirmation-type-destructive .confirmation-btn-primary:hover {
                    background: #c82333;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Affiche une confirmation
     * @param {Object} options - Options de la confirmation
     * @param {string} options.title - Titre de la confirmation
     * @param {string} options.message - Message principal
     * @param {string} options.type - Type de confirmation (warning, danger, info, success)
     * @param {Object} options.details - Détails supplémentaires
     * @param {string} options.details.title - Titre des détails
     * @param {string} options.details.content - Contenu des détails
     * @param {Object} options.buttons - Configuration des boutons
     * @param {string} options.buttons.confirm - Texte du bouton de confirmation
     * @param {string} options.buttons.cancel - Texte du bouton d'annulation
     * @param {boolean} options.destructive - Si la confirmation est destructive
     * @returns {Promise} - Promise qui se résout avec le choix de l'utilisateur
     */
    show(options = {}) {
        const {
            title = 'Confirmation',
            message = 'Êtes-vous sûr de vouloir continuer ?',
            type = 'warning',
            details = null,
            buttons = {},
            destructive = false
        } = options;

        const {
            confirm = 'Confirmer',
            cancel = 'Annuler'
        } = buttons;

        return new Promise((resolve) => {
            const id = this.generateId();
            const confirmation = this.createConfirmationElement(id, {
                title,
                message,
                type,
                details,
                confirm,
                cancel,
                destructive
            });

            this.container.appendChild(confirmation);
            
            // Timeout de sécurité (60 secondes)
            const safetyTimeout = setTimeout(() => {
                console.warn('Timeout de sécurité pour la confirmation:', id);
                this.handleUserChoice(id, false, resolve);
            }, 60000);

            this.activeConfirmations.set(id, { element: confirmation, resolve, safetyTimeout });

            // Animation d'entrée
            this.animateIn(confirmation);

            // Gestion des clics sur les boutons (immédiatement, pas avec setTimeout)
            this.setupButtonHandlers(confirmation, id, resolve);

            // Debug
            console.log('Confirmation créée:', id, 'Total actives:', this.activeConfirmations.size);
        });
    }

    /**
     * Crée l'élément DOM de la confirmation
     */
    createConfirmationElement(id, options) {
        const { title, message, type, details, confirm, cancel, destructive } = options;

        const confirmation = document.createElement('div');
        confirmation.id = `confirmation-${id}`;
        confirmation.className = `confirmation-overlay ${destructive ? 'confirmation-type-destructive' : ''}`;
        confirmation.dataset.confirmationId = id;
        
        // Empêcher immédiatement tous les événements
        confirmation.style.pointerEvents = 'auto';
        confirmation.addEventListener('click', (e) => {
            e.stopPropagation();
        }, true);
        confirmation.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        }, true);

        // Icône selon le type
        const iconClass = this.getIconClass(type, destructive);
        const iconText = this.getIconText(type, destructive);

        // Détails optionnels
        let detailsHtml = '';
        if (details && details.content) {
            detailsHtml = `
                <div class="confirmation-details">
                    ${details.title ? `<div class="confirmation-details-title">${details.title}</div>` : ''}
                    <div class="confirmation-details-content">${details.content}</div>
                </div>
            `;
        }

        confirmation.innerHTML = `
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <div class="confirmation-icon ${iconClass}">
                        <i class="${iconText}"></i>
                    </div>
                    <h3 class="confirmation-title">${title}</h3>
                </div>
                <div class="confirmation-body">
                    <p class="confirmation-message">${message}</p>
                    ${detailsHtml}
                </div>
                <div class="confirmation-footer">
                    <button class="confirmation-btn confirmation-btn-outline" data-action="cancel">
                        ${cancel}
                    </button>
                    <button class="confirmation-btn confirmation-btn-primary" data-action="confirm">
                        ${confirm}
                    </button>
                </div>
            </div>
        `;

        return confirmation;
    }

    /**
     * Obtient la classe CSS de l'icône selon le type
     */
    getIconClass(type, destructive) {
        if (destructive) return 'confirmation-icon-danger';
        
        const classes = {
            warning: 'confirmation-icon-warning',
            danger: 'confirmation-icon-danger',
            info: 'confirmation-icon-info',
            success: 'confirmation-icon-success'
        };
        return classes[type] || classes.warning;
    }

    /**
     * Obtient l'icône Font Awesome selon le type
     */
    getIconText(type, destructive) {
        if (destructive) return 'fas fa-exclamation-triangle';
        
        const icons = {
            warning: 'fas fa-exclamation-triangle',
            danger: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle'
        };
        return icons[type] || icons.warning;
    }

    /**
     * Anime l'entrée de la confirmation
     */
    animateIn(confirmation) {
        // Forcer le reflow pour s'assurer que les styles sont appliqués
        confirmation.offsetHeight;
        
        setTimeout(() => {
            confirmation.classList.add('show');
        }, 50);
    }

    /**
     * Anime la sortie de la confirmation
     */
    animateOut(confirmation, callback) {
        const modal = confirmation.querySelector('.confirmation-modal');
        const overlay = confirmation;

        modal.classList.add('closing');
        overlay.classList.add('closing');

        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    /**
     * Configure les gestionnaires d'événements des boutons
     */
    setupButtonHandlers(confirmation, id, resolve) {
        // Attendre que l'élément soit complètement rendu
        setTimeout(() => {
            const buttons = confirmation.querySelectorAll('[data-action]');
            console.log('Configuration des boutons:', buttons.length);
            
            buttons.forEach(button => {
                // Empêcher les clics immédiats
                button.style.pointerEvents = 'none';
                
                setTimeout(() => {
                    button.style.pointerEvents = 'auto';
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        console.log('Bouton cliqué:', button.dataset.action);
                        const action = button.dataset.action;
                        this.handleUserChoice(id, action === 'confirm', resolve);
                    });
                }, 500); // Délai de 500ms avant d'activer les boutons
            });

            // Fermeture en cliquant sur l'overlay (avec délai)
            setTimeout(() => {
                confirmation.addEventListener('click', (e) => {
                    if (e.target === confirmation) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        console.log('Overlay cliqué');
                        this.handleUserChoice(id, false, resolve);
                    }
                });
            }, 500);

            // Fermeture avec Escape
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    console.log('Escape pressé');
                    this.handleUserChoice(id, false, resolve);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

            // Stocker le handler pour pouvoir le supprimer
            confirmation.dataset.escapeHandler = 'true';
        }, 100);
    }

    /**
     * Gère le choix de l'utilisateur
     */
    handleUserChoice(id, confirmed, resolve) {
        console.log('handleUserChoice appelé:', id, confirmed);
        
        const confirmationData = this.activeConfirmations.get(id);
        if (!confirmationData) {
            console.log('Pas de données pour l\'ID:', id);
            return;
        }

        // Supprimer immédiatement de la map pour éviter les doubles appels
        this.activeConfirmations.delete(id);
        console.log('Confirmation supprimée de la map:', id);

        const { element, resolve: originalResolve, safetyTimeout } = confirmationData;

        // Annuler le timeout de sécurité
        if (safetyTimeout) {
            clearTimeout(safetyTimeout);
            console.log('Timeout de sécurité annulé:', id);
        }

        // Supprimer immédiatement l'élément du DOM
        if (element) {
            // Supprimer tous les event listeners
            const clone = element.cloneNode(true);
            if (element.parentNode) {
                element.parentNode.replaceChild(clone, element);
                clone.parentNode.removeChild(clone);
            }
            console.log('Élément supprimé du DOM:', id);
        }

        // Résoudre la promesse immédiatement
        if (typeof originalResolve === 'function') {
            console.log('Résolution de la promesse:', confirmed);
            originalResolve(confirmed);
        }
    }

    /**
     * Méthodes de convenance pour chaque type
     */
    warning(options) {
        return this.show({ ...options, type: 'warning' });
    }

    danger(options) {
        return this.show({ ...options, type: 'danger' });
    }

    info(options) {
        return this.show({ ...options, type: 'info' });
    }

    success(options) {
        return this.show({ ...options, type: 'success' });
    }

    /**
     * Confirmation destructive (suppression, etc.)
     */
    destructive(options) {
        return this.show({ ...options, destructive: true, type: 'danger' });
    }

    /**
     * Génère un ID unique pour la confirmation
     */
    generateId() {
        return 'confirm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Ferme toutes les confirmations ouvertes
     */
    closeAll() {
        const ids = Array.from(this.activeConfirmations.keys());
        ids.forEach(id => {
            const confirmationData = this.activeConfirmations.get(id);
            if (confirmationData) {
                const { element, resolve } = confirmationData;
                
                // Nettoyer l'élément
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                
                // Résoudre la promesse
                if (typeof resolve === 'function') {
                    resolve(false);
                }
            }
        });
        
        // Vider la map
        this.activeConfirmations.clear();
    }

    /**
     * Force le nettoyage complet (en cas de problème)
     */
    forceCleanup() {
        console.log('=== FORCE CLEANUP ===');
        
        // Supprimer tous les éléments de confirmation du DOM
        const confirmations = document.querySelectorAll('.confirmation-overlay');
        console.log('Éléments à supprimer:', confirmations.length);
        
        confirmations.forEach((confirmation, index) => {
            console.log(`Suppression élément ${index + 1}:`, confirmation.id);
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        });
        
        // Vider la map et résoudre toutes les promesses
        console.log('Confirmations actives avant cleanup:', this.activeConfirmations.size);
        this.activeConfirmations.forEach(({ resolve, safetyTimeout }, id) => {
            if (safetyTimeout) {
                clearTimeout(safetyTimeout);
            }
            if (typeof resolve === 'function') {
                resolve(false);
            }
        });
        this.activeConfirmations.clear();
        
        // Vérifier qu'il ne reste rien
        const remaining = document.querySelectorAll('.confirmation-overlay');
        console.log('Éléments restants après cleanup:', remaining.length);
        console.log('===================');
    }

    /**
     * Affiche l'état de débogage
     */
    debug() {
        console.log('=== ConfirmationService Debug ===');
        console.log('Confirmations actives:', this.activeConfirmations.size);
        console.log('Conteneur:', this.container);
        console.log('Éléments DOM:', document.querySelectorAll('.confirmation-overlay').length);
        this.activeConfirmations.forEach((data, id) => {
            console.log(`- ${id}:`, data.element);
        });
        console.log('================================');
    }
}

// Créer l'instance globale
window.confirmationService = new ConfirmationService();

// Exporter pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmationService;
}
