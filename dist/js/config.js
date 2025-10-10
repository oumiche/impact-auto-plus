/**
 * Configuration de l'application Impact Auto
 * Ce fichier centralise les paramètres d'environnement
 */

const AppConfig = {
    // Configuration des URL de l'API selon l'environnement
    API_URLS: {
        development: 'https://127.0.0.1:8000/api',
        production: 'https://iautobackend.zeddev01.com/api'
    },
    
    /**
     * Obtenir l'URL de l'API en fonction de l'environnement actuel
     */
    getApiUrl() {
        const hostname = window.location.hostname;
        
        // Environnement de développement
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return this.API_URLS.development;
        }
        
        // Environnement de production
        if (hostname.includes('zeddev01.com')) {
            return this.API_URLS.production;
        }
        
        // Fallback par défaut
        console.warn('Environnement non reconnu, utilisation de l\'URL de production par défaut');
        return this.API_URLS.production;
    },
    
    /**
     * Vérifier si on est en environnement de développement
     */
    isDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1';
    },
    
    /**
     * Vérifier si on est en environnement de production
     */
    isProduction() {
        return !this.isDevelopment();
    }
};

// Exposer la configuration globalement
window.AppConfig = AppConfig;

// Log pour debug
console.log('AppConfig loaded:', {
    hostname: window.location.hostname,
    apiUrl: AppConfig.getApiUrl(),
    isDevelopment: AppConfig.isDevelopment(),
    isProduction: AppConfig.isProduction()
});
