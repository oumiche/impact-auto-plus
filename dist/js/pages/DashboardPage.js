/**
 * Page Dashboard - Impact Auto
 * Code Vue.js spécifique au tableau de bord
 */

class DashboardPage {
    constructor() {
        this.app = null;
        this.init();
    }

    init() {
        // Attendre que Vue.js soit chargé
        if (typeof Vue !== 'undefined') {
            this.createApp();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.createApp();
            });
        }
    }

    createApp() {
        const { createApp } = Vue;

        this.app = createApp({
            data() {
                return {
                    isLoading: true,
                    stats: {
                        vehicles: 0,
                        drivers: 0,
                        maintenances: 0,
                        alerts: 0
                    },
                    recentActivities: [],
                    alerts: []
                }
            },
            mounted() {
                this.loadDashboardData();
            },
            methods: {
                async loadDashboardData() {
                    // Simulation du chargement des données
                    this.isLoading = true;
                    
                    // Simuler un délai d'API
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Données simulées
                    this.stats = {
                        vehicles: 24,
                        drivers: 18,
                        maintenances: 7,
                        alerts: 3
                    };

                    this.recentActivities = [
                        {
                            id: 1,
                            type: 'maintenance',
                            icon: 'fas fa-wrench',
                            title: 'Maintenance programmée - Renault Clio',
                            time: 'Il y a 2 heures'
                        },
                        {
                            id: 2,
                            type: 'alert',
                            icon: 'fas fa-exclamation-triangle',
                            title: 'Alerte: Contrôle technique expiré',
                            time: 'Il y a 4 heures'
                        },
                        {
                            id: 3,
                            type: 'info',
                            icon: 'fas fa-plus',
                            title: 'Nouveau véhicule ajouté',
                            time: 'Il y a 6 heures'
                        },
                        {
                            id: 4,
                            type: 'maintenance',
                            icon: 'fas fa-wrench',
                            title: 'Réparation terminée - Peugeot 308',
                            time: 'Il y a 1 jour'
                        },
                        {
                            id: 5,
                            type: 'info',
                            icon: 'fas fa-user',
                            title: 'Nouveau conducteur enregistré',
                            time: 'Il y a 2 jours'
                        }
                    ];

                    this.alerts = [
                        {
                            id: 1,
                            level: 'critical',
                            icon: 'fas fa-exclamation-circle',
                            title: 'Contrôle technique expiré',
                            description: '3 véhicules nécessitent un contrôle technique urgent'
                        },
                        {
                            id: 2,
                            level: 'warning',
                            icon: 'fas fa-exclamation-triangle',
                            title: 'Maintenance préventive',
                            description: '5 véhicules approchent de leur échéance de maintenance'
                        },
                        {
                            id: 3,
                            level: 'info',
                            icon: 'fas fa-info-circle',
                            title: 'Mise à jour disponible',
                            description: 'Une nouvelle version du système est disponible'
                        }
                    ];

                    this.isLoading = false;
                },
                navigateTo(page) {
                    // Simulation de navigation
                    const routes = {
                        'vehicles': 'vehicles.html',
                        'drivers': 'drivers.html',
                        'maintenance': 'maintenance.html',
                        'reports': 'reports.html',
                        'parameters': 'parametres-vue-simple.html',
                        'alerts': 'alerts.html'
                    };
                    
                    if (routes[page]) {
                        window.location.href = routes[page];
                    } else {
                        alert(`Page ${page} en cours de développement`);
                    }
                }
            }
        });

        // Monter l'application
        this.app.mount('#app');
    }
}

// Initialiser la page dashboard
document.addEventListener('DOMContentLoaded', () => {
    new DashboardPage();
});

// Export pour utilisation externe
window.DashboardPage = DashboardPage;
