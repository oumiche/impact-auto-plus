/**
 * Configuration centralisée pour Impact Auto
 * Ce fichier contient toutes les URLs et configurations communes
 */

window.ImpactAutoConfig = {
    // Version de l'application
    version: '1.0.0',
    
    // Configuration Vue.js
    vue: {
        // Utiliser Vue.js local ou CDN
        useLocal: true,
        
        // URLs pour Vue.js
        local: {
            prod: 'js/vue.global.prod.js',
            dev: 'js/vue.global.js'
        },
        
        cdn: {
            prod: 'https://unpkg.com/vue@3/dist/vue.global.prod.js',
            dev: 'https://unpkg.com/vue@3/dist/vue.global.js'
        }
    },
    
    // Configuration API
    api: {
        baseUrl: '/api',
        timeout: 30000
    },
    
    // Configuration des assets
    assets: {
        css: [
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
            'css/impact-auto.css'
        ],
        js: [
            'js/services/ApiService.js',
            'js/auth/auth-guard.js',
            'js/sidebar-component.js',
            'js/load-sidebar.js',
            'js/services/NotificationService.js'
        ]
    }
};

/**
 * Fonction pour charger Vue.js dynamiquement
 */
window.loadVue = function() {
    const config = window.ImpactAutoConfig.vue;
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    
    const vueUrl = config.useLocal 
        ? (isProduction ? config.local.prod : config.local.dev)
        : (isProduction ? config.cdn.prod : config.cdn.dev);
    
    return new Promise((resolve, reject) => {
        if (window.Vue) {
            resolve(window.Vue);
            return;
        }
        
        const script = document.createElement('script');
        script.src = vueUrl;
        script.onload = () => resolve(window.Vue);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Fonction pour charger tous les assets CSS
 */
window.loadCSS = function() {
    const config = window.ImpactAutoConfig.assets.css;
    
    config.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    });
};

/**
 * Fonction pour charger tous les scripts JS
 */
window.loadScripts = function() {
    const config = window.ImpactAutoConfig.assets.js;
    
    return Promise.all(config.map(src => {
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
    }));
};

/**
 * Fonction d'initialisation complète
 */
window.initializeApp = async function() {
    try {
        // Charger CSS
        window.loadCSS();
        
        // Charger Vue.js
        await window.loadVue();
        
        // Charger scripts
        await window.loadScripts();
        
        console.log('Impact Auto - Application initialisée');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }
};
