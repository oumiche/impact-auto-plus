/**
 * Impact Auto - Page d'Accueil JavaScript
 * Gestion des interactions et redirections
 */

(function() {
    'use strict';
    
    // Variables globales
    let inactivityTimer;
    
    // Initialisation au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        initializeHomepage();
    });
    
    /**
     * Initialise la page d'accueil
     */
    function initializeHomepage() {
        setupButtonHandlers();
        setupSmoothScroll();
        setupInactivityTimer();
    }
    
    /**
     * Configure les gestionnaires d'événements pour les boutons
     */
    function setupButtonHandlers() {
        const loginButton = document.querySelector('a[href="login.html"]');
        
        if (loginButton) {
            loginButton.addEventListener('click', function(e) {
                e.preventDefault();
                showLoading();
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            });
        }
    }
    
    /**
     * Configure le scroll fluide pour les liens d'ancrage
     */
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    /**
     * Configure le timer d'inactivité
     */
    function setupInactivityTimer() {
        // Démarrer le timer d'inactivité
        resetInactivityTimer();
        
        // Réinitialiser le timer sur toute interaction
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });
    }
    
    /**
     * Affiche l'overlay de chargement
     */
    function showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }
    
    /**
     * Masque l'overlay de chargement
     */
    function hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }
    
    /**
     * Réinitialise le timer d'inactivité
     */
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            showLoading();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }, 10000); // 10 secondes
    }
    
    /**
     * Fonction utilitaire pour le scroll fluide
     */
    function smoothScrollTo(target) {
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    /**
     * Fonction utilitaire pour les animations
     */
    function animateElement(element, animationClass) {
        if (element) {
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
            }, 1000);
        }
    }
    
    // Exposer les fonctions globales si nécessaire
    window.ImpactAutoHomepage = {
        showLoading: showLoading,
        hideLoading: hideLoading,
        smoothScrollTo: smoothScrollTo,
        animateElement: animateElement
    };
    
})();
