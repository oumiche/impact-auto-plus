/**
 * Page Dashboard Classique - Impact Auto
 * Code Vue.js pour la structure dashboard.html existante
 */

class DashboardClassicPage {
    constructor() {
        this.app = null;
        this.init();
    }

    init() {
        // Attendre que Vue.js soit chargé et que la sidebar soit prête
        if (typeof Vue !== 'undefined') {
            this.waitForSidebarAndCreateApp();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.waitForSidebarAndCreateApp();
            });
        }
    }

    waitForSidebarAndCreateApp() {
        // Attendre que la sidebar soit chargée
        const checkSidebar = () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                this.createApp();
            } else {
                setTimeout(checkSidebar, 100);
            }
        };
        checkSidebar();
    }

    createApp() {
        const { createApp } = Vue;

        this.app = createApp({
            data() {
                return {
                    // Statistiques
                    stats: {
                        vehicles: 0,
                        interventions: 0,
                        drivers: 0,
                        maintenanceDue: 0
                    },
                    
                    // État du parc
                    vehicleStatus: {
                        active: 0,
                        maintenance: 0,
                        inactive: 0
                    },
                    
                    // Activité récente
                    recentActivities: [],
                    
                    // Maintenance à venir
                    upcomingMaintenance: [],
                    
                    // Informations tenant
                    tenantName: ''
                }
            },
            
            mounted() {
                this.loadDashboardData();
                this.loadTenantInfo();
            },
            
            methods: {
                async loadDashboardData() {
                    // Simulation du chargement des données
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Statistiques
                    this.stats = {
                        vehicles: 24,
                        interventions: 8,
                        drivers: 18,
                        maintenanceDue: 3
                    };
                    
                    // État du parc
                    this.vehicleStatus = {
                        active: 20,
                        maintenance: 2,
                        inactive: 2
                    };
                    
                    // Activité récente
                    this.recentActivities = [
                        {
                            id: 1,
                            type: 'vehicle',
                            icon: 'fas fa-car',
                            title: 'Nouveau véhicule ajouté',
                            time: 'Il y a 2 heures'
                        },
                        {
                            id: 2,
                            type: 'intervention',
                            icon: 'fas fa-wrench',
                            title: 'Intervention terminée',
                            time: 'Il y a 4 heures'
                        },
                        {
                            id: 3,
                            type: 'maintenance',
                            icon: 'fas fa-tools',
                            title: 'Maintenance programmée',
                            time: 'Il y a 1 jour'
                        },
                        {
                            id: 4,
                            type: 'driver',
                            icon: 'fas fa-user',
                            title: 'Nouveau conducteur enregistré',
                            time: 'Il y a 2 jours'
                        }
                    ];
                    
                    // Maintenance à venir
                    this.upcomingMaintenance = [
                        {
                            id: 1,
                            date: '15 Jan',
                            vehicle: 'Peugeot 308 - AB-123-CD',
                            type: 'Révision 20 000 km'
                        },
                        {
                            id: 2,
                            date: '18 Jan',
                            vehicle: 'Renault Clio - EF-456-GH',
                            type: 'Changement pneus'
                        },
                        {
                            id: 3,
                            date: '22 Jan',
                            vehicle: 'Citroën C3 - IJ-789-KL',
                            type: 'Contrôle technique'
                        }
                    ];
                },
                
                loadTenantInfo() {
                    // Charger les informations du tenant depuis localStorage
                    const tenantData = localStorage.getItem('current_tenant');
                    if (tenantData) {
                        const tenant = JSON.parse(tenantData);
                        this.tenantName = tenant.name;
                    } else {
                        this.tenantName = 'Tenant Principal';
                    }
                },
                
                formatTime(timeString) {
                    return timeString;
                },
                
                getActivityIconClass(type) {
                    const classes = {
                        'vehicle': 'vehicle',
                        'intervention': 'intervention',
                        'maintenance': 'maintenance',
                        'driver': 'driver'
                    };
                    return classes[type] || 'default';
                }
            }
        });

        // Monter l'application
        this.app.mount('#app');
    }
}

// Initialiser la page dashboard classique
document.addEventListener('DOMContentLoaded', () => {
    new DashboardClassicPage();
});

// Export pour utilisation externe
window.DashboardClassicPage = DashboardClassicPage;
