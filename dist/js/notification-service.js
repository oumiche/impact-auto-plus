/**
 * Service de notifications centralisé pour l'application Impact Auto
 * Gère l'affichage, l'animation et la suppression des notifications
 */
class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Map(); // Pour tracker les notifications actives
        this.maxNotifications = 5; // Nombre maximum de notifications affichées
        this.defaultDuration = 5000; // Durée par défaut en ms
        this.init();
    }

    /**
     * Initialise le service de notifications
     */
    init() {
        this.createContainer();
        this.setupGlobalStyles();
    }

    /**
     * Crée le conteneur de notifications s'il n'existe pas
     */
    createContainer() {
        if (!this.container) {
            // Attendre que le DOM soit prêt
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.createContainer();
                });
                return;
            }
            
            // Vérifier que document.body existe
            if (!document.body) {
                console.warn('document.body non disponible, retry dans 100ms');
                setTimeout(() => this.createContainer(), 100);
                return;
            }
            
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
            console.log('Notification container créé');
        }
    }

    /**
     * Configure les styles globaux si nécessaire
     */
    setupGlobalStyles() {
        // Vérifier si les styles sont déjà présents
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none;
                    max-width: 400px;
                }

                .notification-container .notification {
                    pointer-events: auto;
                }

                .notification {
                    position: relative;
                    padding: 12px 16px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    min-width: 300px;
                    max-width: 400px;
                    height: auto;
                    min-height: auto;
                    max-height: none;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .notification i {
                    font-size: 1.1rem;
                    flex-shrink: 0;
                }

                .notification-success i {
                    color: #28a745;
                }

                .notification-error i {
                    color: #dc3545;
                }

                .notification-warning i {
                    color: #ffc107;
                }

                .notification-info i {
                    color: #17a2b8;
                }

                .notification span {
                    flex: 1;
                    line-height: 1.4;
                }

                .notification-close {
                    background: none;
                    border: none;
                    color: #6c757d;
                    cursor: pointer;
                    padding: 4px 6px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    font-size: 12px;
                    margin-left: 8px;
                    opacity: 0.7;
                }

                .notification-close:hover {
                    background: #f8f9fa;
                    color: #495057;
                    opacity: 1;
                }

                .notification-success {
                    background: #ffffff;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                    border-left: 4px solid #28a745;
                    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.15);
                }

                .notification-error {
                    background: #ffffff;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                    border-left: 4px solid #dc3545;
                    box-shadow: 0 2px 8px rgba(220, 53, 69, 0.15);
                }

                .notification-warning {
                    background: #ffffff;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                    border-left: 4px solid #ffc107;
                    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15);
                }

                .notification-info {
                    background: #ffffff;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                    border-left: 4px solid #17a2b8;
                    box-shadow: 0 2px 8px rgba(23, 162, 184, 0.15);
                }

                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 2px;
                    background: rgba(108, 117, 125, 0.2);
                    border-radius: 0 0 8px 8px;
                    transition: width linear;
                }

                /* Animations */
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .notification-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                    
                    .notification {
                        min-width: auto;
                        max-width: none;
                        width: 100%;
                    }
                }

                /* Animation pour le progress bar */
                .notification-progress-animated {
                    animation: progressBar linear;
                }

                @keyframes progressBar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Affiche une notification
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de notification (success, error, warning, info)
     * @param {Object} options - Options supplémentaires
     * @param {number} options.duration - Durée d'affichage en ms (défaut: 5000)
     * @param {boolean} options.closable - Si la notification peut être fermée manuellement (défaut: true)
     * @param {boolean} options.progress - Si afficher une barre de progression (défaut: true)
     * @param {string} options.icon - Icône personnalisée
     * @returns {string} - ID de la notification
     */
    show(message, type = 'info', options = {}) {
        // S'assurer que le container existe
        this.createContainer();
        
        // Attendre un peu si le container n'est pas encore prêt
        if (!this.container) {
            setTimeout(() => this.show(message, type, options), 50);
            return;
        }
        
        const {
            duration = this.defaultDuration,
            closable = true,
            progress = true,
            icon = null
        } = options;

        // Limiter le nombre de notifications
        if (this.notifications.size >= this.maxNotifications) {
            this.removeOldest();
        }

        const id = this.generateId();
        const notification = this.createNotificationElement(id, message, type, {
            closable,
            progress,
            icon
        });

        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Animation d'entrée
        this.animateIn(notification);

        // Gestion de la suppression automatique
        if (duration > 0) {
            this.scheduleRemoval(id, duration, progress);
        }

        return id;
    }

    /**
     * Crée l'élément DOM de la notification
     */
    createNotificationElement(id, message, type, options) {
        const notification = document.createElement('div');
        notification.id = `notification-${id}`;
        notification.className = `notification notification-${type}`;
        notification.dataset.notificationId = id;

        // Icône
        const iconClass = options.icon || this.getDefaultIcon(type);
        
        // Message
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        // Bouton de fermeture
        let closeButton = '';
        if (options.closable) {
            closeButton = `
                <button class="notification-close" onclick="window.notificationService.remove('${id}')" title="Fermer">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }

        // Barre de progression
        let progressBar = '';
        if (options.progress) {
            progressBar = '<div class="notification-progress"></div>';
        }

        notification.innerHTML = `
            <i class="${iconClass}"></i>
            ${messageSpan.outerHTML}
            ${closeButton}
            ${progressBar}
        `;

        return notification;
    }

    /**
     * Obtient l'icône par défaut selon le type
     */
    getDefaultIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Anime l'entrée de la notification
     */
    animateIn(notification) {
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
    }

    /**
     * Anime la sortie de la notification
     */
    animateOut(notification, callback) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    /**
     * Programme la suppression automatique
     */
    scheduleRemoval(id, duration, showProgress) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        // Barre de progression
        if (showProgress) {
            const progressBar = notification.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${duration}ms`;
                progressBar.classList.add('notification-progress-animated');
            }
        }

        // Suppression automatique
        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    /**
     * Supprime une notification par son ID
     */
    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        this.animateOut(notification, () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        });
    }

    /**
     * Supprime toutes les notifications
     */
    removeAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.remove(id));
    }

    /**
     * Supprime la notification la plus ancienne
     */
    removeOldest() {
        const firstId = this.notifications.keys().next().value;
        if (firstId) {
            this.remove(firstId);
        }
    }

    /**
     * Génère un ID unique pour la notification
     */
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Méthodes de convenance pour chaque type
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
}

// Créer l'instance globale
window.notificationService = new NotificationService();
window.NotificationService = window.notificationService; // Alias avec majuscule

// Exporter pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}
