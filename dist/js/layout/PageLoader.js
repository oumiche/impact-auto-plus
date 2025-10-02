/**
 * Page Loader - Impact Auto
 * Chargement automatique des pages Vue.js selon l'URL
 */

class PageLoader {
    constructor() {
        this.pages = new Map();
        this.currentPage = null;
        this.init();
    }

    init() {
        // Enregistrer les pages disponibles
        this.registerPages();
        
        // Charger la page appropriée
        this.loadCurrentPage();
    }

    registerPages() {
        // Enregistrer les pages avec leurs classes
        this.pages.set('dashboard-vue-simple.html', 'DashboardPage');
        this.pages.set('parametres-vue-simple.html', 'ParametresPage');
        this.pages.set('users-vue-simple.html', 'UsersPage');
        this.pages.set('login-simple.html', 'LoginPage');
        // Ajouter d'autres pages au fur et à mesure
    }

    loadCurrentPage() {
        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop();
        
        const pageClass = this.pages.get(fileName);
        
        if (pageClass && window[pageClass]) {
            console.log(`Chargement de la page: ${pageClass}`);
            this.currentPage = new window[pageClass]();
        } else {
            console.log(`Page non trouvée: ${fileName}`);
            this.loadDefaultPage();
        }
    }

    loadDefaultPage() {
        // Page par défaut si aucune page spécifique n'est trouvée
        console.log('Chargement de la page par défaut');
    }

    // Méthode pour charger dynamiquement une page
    async loadPage(pageName) {
        try {
            const response = await fetch(`js/pages/${pageName}.js`);
            const script = await response.text();
            
            // Évaluer le script
            eval(script);
            
            // Initialiser la page
            const pageClass = window[pageName];
            if (pageClass) {
                this.currentPage = new pageClass();
            }
        } catch (error) {
            console.error(`Erreur lors du chargement de la page ${pageName}:`, error);
        }
    }
}

// Initialiser le chargeur de pages
document.addEventListener('DOMContentLoaded', () => {
    new PageLoader();
});

// Export pour utilisation externe
window.PageLoader = PageLoader;
