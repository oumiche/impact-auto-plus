/**
 * Fichier d'inclusion automatique pour Impact Auto
 * Ce script charge automatiquement tous les assets nécessaires
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        vue: {
            useLocal: true,
            local: 'js/vue.global.prod.js',
            cdn: 'https://unpkg.com/vue@3/dist/vue.global.prod.js'
        },
        css: [
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
            'css/impact-auto.css',
            'css/unified-tables.css',
            'css/intervention-search-unified.css',
            /*'css/homepage.css',*/
            'css/parametres-vue.css',
            'css/intervention-types.css',
            'css/vehicle-interventions.css',
            'css/intervention-prediagnostics.css'
        ],
        js: [
            'js/services/ApiService.js',
            'js/services/FileUploadService.js',
            'js/auth/auth-guard.js', 
            'js/sidebar-component.js',
            'js/load-sidebar.js',
            'js/notification-service.js',
            'js/components/NotificationMixin.js',
            'js/confirmation-service-v2.js',
            'js/components/ConfirmationMixin.js',
            'js/components/AttachmentGallery.js',
            'js/components/InterventionSearch.js',
            'js/components/GarageSearch.js',
            'js/components/SimpleInterventionSearch.js',
            'js/components/SimpleGarageSearch.js',
            'js/config/entity-configs.js',
            'js/components/EntitySearch.js',
            'js/components/VehicleSearch.js',
            'js/components/InterventionSearchAdvanced.js',
            'js/components/QuoteSearch.js',
            'js/components/InvoiceSearch.js',
            'js/components/CustomerSearch.js',
            'js/components/SupplySearch.js'
        ]
    };
    
    // Fonction pour charger un CSS
    function loadCSS(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
    
    // Fonction pour charger un script
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    
    // Charger Vue.js
    function loadVue() {
        const vueSrc = CONFIG.vue.useLocal ? CONFIG.vue.local : CONFIG.vue.cdn;
        return loadScript(vueSrc);
    }
    
    // Charger tous les CSS
    function loadAllCSS() {
        CONFIG.css.forEach(loadCSS);
    }
    
    // Charger tous les scripts
    function loadAllScripts() {
        return Promise.all(CONFIG.js.map(loadScript));
    }
    
    // Initialisation
    function init() {
        // Charger CSS immédiatement
        loadAllCSS();
        
        // Charger Vue.js et scripts quand DOM est prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', async () => {
                await loadVue();
                await loadAllScripts();
                
                // Initialiser le sidebar après le chargement des scripts
                if (window.SidebarLoader) {
                    new window.SidebarLoader();
                    window.sidebarLoaderInitialized = true;
                }
                
                console.log('Impact Auto - Assets chargés');
            });
        } else {
            // DOM déjà chargé
            loadVue().then(async () => {
                await loadAllScripts();
                
                // Initialiser le sidebar après le chargement des scripts
                if (window.SidebarLoader) {
                    new window.SidebarLoader();
                    window.sidebarLoaderInitialized = true;
                }
            });
        }
    }
    
    // Démarrer
    init();
    
})();
