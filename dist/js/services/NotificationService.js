/**
 * Service de gestion des notifications
 */
class NotificationService {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // Créer le conteneur de notifications s'il n'existe pas
        if (!document.getElementById('notifications')) {
            this.container = document.createElement('div');
            this.container.id = 'notifications';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notifications');
        }

        // Ajouter les styles CSS si nécessaire
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    pointer-events: none;
                }
                
                .notification {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                    border-left: 5px solid #007bff;
                    animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    min-width: 320px;
                    pointer-events: auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .notification.success {
                    border-left-color: #28a745;
                    background: linear-gradient(135deg, #f8fff9 0%, #ffffff 100%);
                }
                
                .notification.error {
                    border-left-color: #dc3545;
                    background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
                }
                
                .notification.warning {
                    border-left-color: #ffc107;
                    background: linear-gradient(135deg, #fffbf0 0%, #ffffff 100%);
                }
                
                .notification.info {
                    border-left-color: #17a2b8;
                    background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
                }
                
                .notification-content {
                    /* Structure simple sans flex */
                }
                
                .notification-message {
                    font-size: 14px;
                    color: #495057;
                    margin: 0;
                    line-height: 1.5;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .notification-message i {
                    font-size: 14px;
                    opacity: 0.8;
                    flex-shrink: 0;
                    margin-top: 2px; /* Aligner avec la première ligne de texte */
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%) scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%) scale(0.8);
                        opacity: 0;
                    }
                }
                
                .notification.removing {
                    animation: slideOut 0.3s ease-in forwards;
                }
                
                /* Styles pour la boîte de confirmation */
                .confirmation-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease-out;
                }
                
                .confirmation-dialog {
                    background: white;
                    border-radius: 16px;
                    padding: 0;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    overflow: hidden;
                }
                
                .confirmation-header {
                    background: #f8f9fa;
                    color: #495057;
                    padding: 24px;
                    text-align: center;
                    position: relative;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .confirmation-icon {
                    width: 60px;
                    height: 60px;
                    background: #e9ecef;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    font-size: 24px;
                    color: #6c757d;
                }
                
                .confirmation-title {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0;
                    margin-bottom: 8px;
                }
                
                .confirmation-subtitle {
                    font-size: 14px;
                    color: #6c757d;
                    margin: 0;
                }
                
                .confirmation-body {
                    padding: 24px;
                    text-align: center;
                }
                
                .confirmation-message {
                    font-size: 16px;
                    color: #495057;
                    line-height: 1.5;
                    margin: 0 0 24px;
                }
                
                .confirmation-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                
                .confirmation-btn {
                    padding: 12px 24px;
                    border-radius: 8px;
                    border: none;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 100px;
                }
                
                .confirmation-btn-cancel {
                    background: #f8f9fa;
                    color: #6c757d;
                    border: 2px solid #e9ecef;
                }
                
                .confirmation-btn-cancel:hover {
                    background: #e9ecef;
                    color: #495057;
                }
                
                .confirmation-btn-confirm {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    color: white;
                    border: 2px solid transparent;
                }
                
                .confirmation-btn-confirm:hover {
                    background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
                }
                
                .confirmation-btn-info {
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white;
                    border: 2px solid transparent;
                }
                
                .confirmation-btn-info:hover {
                    background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scaleIn {
                    from {
                        transform: scale(0.7);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    show(message, type = 'info', title = null, duration = 5000) {
        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            title: title || this.getDefaultTitle(type),
            duration
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto-remove après la durée spécifiée
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }

        return notification.id;
    }

    getDefaultTitle(type) {
        const titles = {
            success: 'Succès',
            error: 'Erreur',
            warning: 'Attention',
            info: 'Information'
        };
        return titles[type] || 'Information';
    }

    renderNotification(notification) {
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${notification.type}`;
        notificationEl.setAttribute('data-id', notification.id);

        const icon = this.getIcon(notification.type);

        notificationEl.innerHTML = `
            <div class="notification-content">
                <p class="notification-message">
                    <i class="fas ${icon}"></i>
                    ${notification.message}
                </p>
            </div>
        `;

        this.container.appendChild(notificationEl);
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    remove(id) {
        const notificationEl = this.container.querySelector(`[data-id="${id}"]`);
        if (notificationEl) {
            notificationEl.classList.add('removing');
            setTimeout(() => {
                if (notificationEl.parentNode) {
                    notificationEl.parentNode.removeChild(notificationEl);
                }
            }, 300);
        }

        // Supprimer de la liste
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    confirm(message, title = 'Confirmation', type = 'warning') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirmation-overlay';
            
            const icon = this.getConfirmationIcon(type);
            const confirmText = this.getConfirmationText(type);
            
            overlay.innerHTML = `
                <div class="confirmation-dialog">
                    <div class="confirmation-header">
                        <div class="confirmation-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <h3 class="confirmation-title">${title}</h3>
                        <p class="confirmation-subtitle">${confirmText}</p>
                    </div>
                    <div class="confirmation-body">
                        <p class="confirmation-message">${message}</p>
                        <div class="confirmation-actions">
                            <button class="confirmation-btn confirmation-btn-cancel" data-action="cancel">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                            <button class="confirmation-btn confirmation-btn-${type === 'delete' ? 'confirm' : 'info'}" data-action="confirm">
                                <i class="fas fa-check"></i> Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Gérer les clics
            const handleClick = (e) => {
                const action = e.target.closest('[data-action]')?.getAttribute('data-action');
                if (action === 'cancel') {
                    this.closeConfirmation(overlay);
                    resolve(false);
                } else if (action === 'confirm') {
                    this.closeConfirmation(overlay);
                    resolve(true);
                } else if (e.target === overlay) {
                    this.closeConfirmation(overlay);
                    resolve(false);
                }
            };
            
            overlay.addEventListener('click', handleClick);
            
            // Gérer la touche Échap
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    this.closeConfirmation(overlay);
                    resolve(false);
                }
            };
            
            document.addEventListener('keydown', handleKeydown);
            
            // Stocker les handlers pour le nettoyage
            overlay._handleClick = handleClick;
            overlay._handleKeydown = handleKeydown;
        });
    }
    
    closeConfirmation(overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.removeEventListener('click', overlay._handleClick);
                document.removeEventListener('keydown', overlay._handleKeydown);
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
    
    getConfirmationIcon(type) {
        const icons = {
            warning: 'fa-exclamation-triangle',
            delete: 'fa-trash-alt',
            info: 'fa-info-circle',
            success: 'fa-check-circle'
        };
        return icons[type] || 'fa-exclamation-triangle';
    }
    
    getConfirmationText(type) {
        const texts = {
            warning: 'Cette action nécessite votre confirmation',
            delete: 'Cette action est irréversible',
            info: 'Veuillez confirmer votre choix',
            success: 'Confirmez pour continuer'
        };
        return texts[type] || 'Veuillez confirmer votre choix';
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    // Méthodes de commodité
    success(message, title = null, duration = 5000) {
        return this.show(message, 'success', title, duration);
    }

    error(message, title = null, duration = 7000) {
        return this.show(message, 'error', title, duration);
    }

    warning(message, title = null, duration = 6000) {
        return this.show(message, 'warning', title, duration);
    }

    info(message, title = null, duration = 5000) {
        return this.show(message, 'info', title, duration);
    }
}

// Initialiser le service globalement
window.notificationService = new NotificationService();
window.NotificationService = NotificationService;
