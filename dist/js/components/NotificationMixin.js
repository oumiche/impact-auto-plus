/**
 * Fonctions utilitaires pour les notifications dans Vue.js
 * Ces fonctions sont ajoutées globalement et peuvent être utilisées dans tous les composants
 */

// Fonctions utilitaires globales
window.notifySuccess = function(message, options = {}) {
    if (window.notificationService) {
        return window.notificationService.success(message, options);
    }
    console.error('NotificationService non disponible');
};

window.notifyError = function(message, options = {}) {
    if (window.notificationService) {
        return window.notificationService.error(message, options);
    }
    console.error('NotificationService non disponible');
};

window.notifyWarning = function(message, options = {}) {
    if (window.notificationService) {
        return window.notificationService.warning(message, options);
    }
    console.error('NotificationService non disponible');
};

window.notifyInfo = function(message, options = {}) {
    if (window.notificationService) {
        return window.notificationService.info(message, options);
    }
    console.error('NotificationService non disponible');
};

window.notify = function(message, type = 'info', options = {}) {
    if (window.notificationService) {
        return window.notificationService.show(message, type, options);
    }
    console.error('NotificationService non disponible');
};

window.notifyApiError = function(error, defaultMessage = 'Une erreur est survenue') {
    let message = defaultMessage;
    
    if (typeof error === 'string') {
        message = error;
    } else if (error && error.message) {
        message = error.message;
    } else if (error && error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
    }
    
    return window.notifyError(message);
};

window.notifyApiSuccess = function(message, options = {}) {
    return window.notifySuccess(message, options);
};

/**
 * Mixin Vue.js pour faciliter l'utilisation du service de notifications
 * Utilisation : Ajoutez ce mixin à vos composants Vue
 */
const NotificationMixin = {
    methods: {
        /**
         * Affiche une notification de succès
         * @param {string} message - Le message à afficher
         * @param {Object} options - Options supplémentaires
         * @returns {string} - ID de la notification
         */
        $notifySuccess(message, options = {}) {
            return window.notifySuccess(message, options);
        },

        /**
         * Affiche une notification d'erreur
         * @param {string} message - Le message à afficher
         * @param {Object} options - Options supplémentaires
         * @returns {string} - ID de la notification
         */
        $notifyError(message, options = {}) {
            return window.notifyError(message, options);
        },

        /**
         * Affiche une notification d'avertissement
         * @param {string} message - Le message à afficher
         * @param {Object} options - Options supplémentaires
         * @returns {string} - ID de la notification
         */
        $notifyWarning(message, options = {}) {
            return window.notifyWarning(message, options);
        },

        /**
         * Affiche une notification d'information
         * @param {string} message - Le message à afficher
         * @param {Object} options - Options supplémentaires
         * @returns {string} - ID de la notification
         */
        $notifyInfo(message, options = {}) {
            return window.notifyInfo(message, options);
        },

        /**
         * Affiche une notification générique
         * @param {string} message - Le message à afficher
         * @param {string} type - Le type de notification (success, error, warning, info)
         * @param {Object} options - Options supplémentaires
         * @returns {string} - ID de la notification
         */
        $notify(message, type = 'info', options = {}) {
            return window.notify(message, type, options);
        },

        /**
         * Supprime une notification par son ID
         * @param {string} id - ID de la notification
         */
        $removeNotification(id) {
            if (window.notificationService) {
                window.notificationService.remove(id);
            }
        },

        /**
         * Supprime toutes les notifications
         */
        $clearNotifications() {
            if (window.notificationService) {
                window.notificationService.removeAll();
            }
        },

        /**
         * Méthode de convenance pour les notifications d'erreur d'API
         * @param {Error|string} error - L'erreur à afficher
         * @param {string} defaultMessage - Message par défaut si l'erreur n'a pas de message
         */
        $notifyApiError(error, defaultMessage = 'Une erreur est survenue') {
            return window.notifyApiError(error, defaultMessage);
        },

        /**
         * Méthode de convenance pour les notifications de succès d'API
         * @param {string} message - Le message de succès
         * @param {Object} options - Options supplémentaires
         */
        $notifyApiSuccess(message, options = {}) {
            return window.notifyApiSuccess(message, options);
        }
    }
};

// Enregistrer le mixin globalement
if (typeof window !== 'undefined' && window.Vue) {
    // Pour Vue 2
    window.NotificationMixin = NotificationMixin;
} else if (typeof window !== 'undefined') {
    // Pour Vue 3 ou autres frameworks
    window.NotificationMixin = NotificationMixin;
}

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationMixin;
}
