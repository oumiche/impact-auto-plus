/**
 * Fonctions utilitaires pour les confirmations dans Vue.js
 * Ces fonctions sont ajoutées globalement et peuvent être utilisées dans tous les composants
 */

// Fonctions utilitaires globales - Version 2
window.confirmWarning = function(options) {
    if (window.ConfirmationServiceV2) {
        return window.ConfirmationServiceV2.warning(options);
    }
    console.error('ConfirmationServiceV2 non disponible');
    return Promise.resolve(false);
};

window.confirmDanger = function(options) {
    if (window.ConfirmationServiceV2) {
        return window.ConfirmationServiceV2.danger(options);
    }
    console.error('ConfirmationServiceV2 non disponible');
    return Promise.resolve(false);
};

window.confirmInfo = function(options) {
    if (window.ConfirmationServiceV2) {
        return window.ConfirmationServiceV2.info(options);
    }
    console.error('ConfirmationServiceV2 non disponible');
    return Promise.resolve(false);
};

window.confirmSuccess = function(options) {
    if (window.ConfirmationServiceV2) {
        return window.ConfirmationServiceV2.success(options);
    }
    console.error('ConfirmationServiceV2 non disponible');
    return Promise.resolve(false);
};

window.confirmDestructive = function(options) {
    if (window.ConfirmationServiceV2) {
        return window.ConfirmationServiceV2.danger(options); // V2 n'a pas destructive, utilise danger
    }
    console.error('ConfirmationServiceV2 non disponible');
    return Promise.resolve(false);
};

window.confirm = function(options) {
    if (window.ConfirmationServiceV2) {
        return window.ConfirmationServiceV2.show(options);
    }
    console.error('ConfirmationServiceV2 non disponible');
    return Promise.resolve(false);
};

// Fonctions utilitaires pour le débogage - Version 2
window.closeAllConfirmations = function() {
    if (window.ConfirmationServiceV2) {
        window.ConfirmationServiceV2.closeAll();
    }
};

window.forceCleanupConfirmations = function() {
    if (window.ConfirmationServiceV2) {
        window.ConfirmationServiceV2.forceCleanup();
    }
};

window.debugConfirmations = function() {
    if (window.ConfirmationServiceV2) {
        console.log('ConfirmationServiceV2 actif:', window.ConfirmationServiceV2);
        console.log('Confirmations actives:', window.ConfirmationServiceV2.activeConfirmations.size);
    }
};

/**
 * Mixin Vue.js pour faciliter l'utilisation du service de confirmations
 * Utilisation : Ajoutez ce mixin à vos composants Vue
 */
const ConfirmationMixin = {
    methods: {
        /**
         * Affiche une confirmation d'avertissement
         * @param {Object} options - Options de la confirmation
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmWarning(options = {}) {
            return window.confirmWarning(options);
        },

        /**
         * Affiche une confirmation de danger
         * @param {Object} options - Options de la confirmation
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmDanger(options = {}) {
            return window.confirmDanger(options);
        },

        /**
         * Affiche une confirmation d'information
         * @param {Object} options - Options de la confirmation
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmInfo(options = {}) {
            return window.confirmInfo(options);
        },

        /**
         * Affiche une confirmation de succès
         * @param {Object} options - Options de la confirmation
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmSuccess(options = {}) {
            return window.confirmSuccess(options);
        },

        /**
         * Affiche une confirmation destructive (suppression)
         * @param {Object} options - Options de la confirmation
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmDestructive(options = {}) {
            return window.confirmDestructive(options);
        },

        /**
         * Affiche une confirmation générique
         * @param {Object} options - Options de la confirmation
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirm(options = {}) {
            return window.confirm(options);
        },

        /**
         * Méthode de convenance pour les confirmations de suppression
         * @param {string} itemName - Nom de l'élément à supprimer
         * @param {Object} additionalOptions - Options supplémentaires
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmDelete(itemName, additionalOptions = {}) {
            return window.confirmDestructive({
                title: 'Confirmer la suppression',
                message: `Êtes-vous sûr de vouloir supprimer "${itemName}" ?`,
                details: {
                    title: 'Attention',
                    content: 'Cette action est irréversible et ne peut pas être annulée.'
                },
                buttons: {
                    confirm: 'Supprimer',
                    cancel: 'Annuler'
                },
                ...additionalOptions
            });
        },

        /**
         * Méthode de convenance pour les confirmations de modification
         * @param {string} itemName - Nom de l'élément à modifier
         * @param {Object} additionalOptions - Options supplémentaires
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmEdit(itemName, additionalOptions = {}) {
            return window.confirmWarning({
                title: 'Confirmer la modification',
                message: `Êtes-vous sûr de vouloir modifier "${itemName}" ?`,
                buttons: {
                    confirm: 'Modifier',
                    cancel: 'Annuler'
                },
                ...additionalOptions
            });
        },

        /**
         * Méthode de convenance pour les confirmations d'action critique
         * @param {string} action - Action à effectuer
         * @param {string} itemName - Nom de l'élément concerné
         * @param {Object} additionalOptions - Options supplémentaires
         * @returns {Promise<boolean>} - Promise qui se résout avec true si confirmé
         */
        $confirmAction(action, itemName, additionalOptions = {}) {
            return window.confirmWarning({
                title: `Confirmer ${action}`,
                message: `Êtes-vous sûr de vouloir ${action.toLowerCase()} "${itemName}" ?`,
                buttons: {
                    confirm: action,
                    cancel: 'Annuler'
                },
                ...additionalOptions
            });
        }
    }
};

// Enregistrer le mixin globalement
if (typeof window !== 'undefined' && window.Vue) {
    // Pour Vue 2
    window.ConfirmationMixin = ConfirmationMixin;
} else if (typeof window !== 'undefined') {
    // Pour Vue 3 ou autres frameworks
    window.ConfirmationMixin = ConfirmationMixin;
}

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmationMixin;
}
