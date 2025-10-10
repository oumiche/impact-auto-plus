// Dashboard Vue.js Component
const DashboardVue = {
    data() {
        return {
            tenantName: '',
            stats: {
                vehicles: 0,
                interventions: 0,
                drivers: 0,
                maintenance: 0
            },
            animatedStats: {
                vehicles: 0,
                interventions: 0,
                drivers: 0,
                maintenance: 0
            },
            recentActivities: [],
            vehicleStatus: {
                active: 0,
                maintenance: 0,
                inactive: 0
            },
            upcomingMaintenance: [],
            loading: true,
            error: null
        };
    },
    
    async mounted() {
        await this.waitForApiService();
        
        // Vérifier l'authentification avant de charger les données
        if (!this.checkAuthentication()) {
            return;
        }
        
        await this.loadDashboardData();
    },
    
    methods: {
        async waitForApiService() {
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window.apiService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.apiService) {
                throw new Error('API Service non disponible après 5 secondes');
            }
        },
        
        checkAuthentication() {
            // Vérifier que l'utilisateur est authentifié
            if (!window.apiService.isAuthenticated()) {
                console.warn('Utilisateur non authentifié - Redirection vers le login');
                this.error = 'Session expirée. Redirection vers la page de connexion...';
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return false;
            }
            
            // Vérifier qu'un tenant est sélectionné
            const currentTenant = window.apiService.getCurrentTenant();
            if (!currentTenant || !currentTenant.id) {
                console.warn('Aucun tenant sélectionné - Redirection vers la sélection');
                this.error = 'Aucune organisation sélectionnée. Redirection...';
                setTimeout(() => {
                    window.location.href = '/tenant-selection.html';
                }, 2000);
                return false;
            }
            
            // Récupérer le nom du tenant pour l'affichage
            this.tenantName = currentTenant.name || '';
            
            return true;
        },
        
        async loadDashboardData() {
            this.loading = true;
            this.error = null;
            
            try {
                // Charger toutes les données en parallèle
                await Promise.all([
                    this.loadStats(),
                    this.loadVehicleStatus(),
                    this.loadUpcomingMaintenance(),
                    this.loadRecentActivities()
                ]);
            } catch (error) {
                console.error('Erreur lors du chargement du dashboard:', error);
                
                // Gérer les erreurs d'authentification
                if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
                    this.error = 'Session expirée. Veuillez vous reconnecter.';
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {
                    this.error = error.message || 'Une erreur est survenue lors du chargement des données';
                }
            } finally {
                this.loading = false;
            }
        },
        
        async loadStats() {
            try {
                // Charger les statistiques depuis différentes API
                const [vehiclesData, interventionsData, driversData, maintenanceData] = await Promise.all([
                    window.apiService.getVehicles(1, 1),
                    window.apiService.getVehicleInterventions(1, 1),
                    window.apiService.getDrivers(1, 1),
                    window.apiService.getVehicleMaintenances(1, 1)
                ]);
                
                this.stats.vehicles = vehiclesData.pagination?.totalItems || vehiclesData.pagination?.total || 0;
                this.stats.interventions = interventionsData.pagination?.totalItems || interventionsData.pagination?.total || 0;
                this.stats.drivers = driversData.pagination?.totalItems || driversData.pagination?.total || 0;
                this.stats.maintenance = maintenanceData.pagination?.totalItems || maintenanceData.pagination?.total || 0;
                
                // Animer les compteurs
                this.animateCounters();
            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
                // Les statistiques restent à 0 en cas d'erreur
                this.stats = {
                    vehicles: 0,
                    interventions: 0,
                    drivers: 0,
                    maintenance: 0
                };
            }
        },
        
        async loadVehicleStatus() {
            try {
                // Charger tous les véhicules pour calculer les statuts
                const response = await window.apiService.getVehicles(1, 1000);
                
                if (response.success && response.data) {
                    const vehicles = response.data;
                    
                    // Compter les véhicules par statut
            this.vehicleStatus = {
                        active: vehicles.filter(v => v.status === 'active' || v.status === 'disponible').length,
                        maintenance: vehicles.filter(v => v.status === 'maintenance' || v.status === 'en_maintenance').length,
                        inactive: vehicles.filter(v => v.status === 'inactive' || v.status === 'hors_service').length
                    };
                }
            } catch (error) {
                console.error('Erreur lors du chargement du statut des véhicules:', error);
            }
        },
        
        async loadUpcomingMaintenance() {
            try {
                // Charger les prochaines maintenances programmées
                const response = await window.apiService.getVehicleMaintenances(1, 5, '', '', 'scheduled');
                
                if (response.success && response.data) {
                    this.upcomingMaintenance = response.data.map(maintenance => ({
                        id: maintenance.id,
                        date: this.formatDate(maintenance.scheduledDate || maintenance.maintenanceDate),
                        vehicle: maintenance.vehicle?.plateNumber || 'N/A',
                        type: maintenance.type?.name || maintenance.description || 'Entretien'
                    })).slice(0, 5);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des maintenances à venir:', error);
                this.upcomingMaintenance = [];
            }
        },
        
        async loadRecentActivities() {
            try {
                // Charger les dernières interventions
                const response = await window.apiService.getVehicleInterventions(1, 5);
                
                if (response.success && response.data) {
                    this.recentActivities = response.data.map(intervention => ({
                        id: intervention.id,
                        title: `${intervention.type?.name || 'Intervention'} - ${intervention.vehicle?.plateNumber || 'Véhicule'}`,
                        time: this.formatDateTime(intervention.startDate || intervention.createdAt),
                        icon: 'fas fa-wrench',
                        type: this.getInterventionType(intervention.currentStatus)
                    })).slice(0, 5);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des activités récentes:', error);
                this.recentActivities = [];
            }
        },
        
        getInterventionType(status) {
            const statusMap = {
                'completed': 'success',
                'terminated': 'success',
                'in_progress': 'info',
                'pending': 'warning',
                'reception': 'info',
                'diagnosed': 'info',
                'quoted': 'warning',
                'authorized': 'info',
                'cancelled': 'error'
            };
            return statusMap[status] || 'info';
        },
        
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            const options = { day: 'numeric', month: 'short' };
            return date.toLocaleDateString('fr-FR', options);
        },
        
        formatDateTime(dateString) {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            
            if (diffMinutes < 60) {
                return `Il y a ${diffMinutes} min`;
            } else if (diffHours < 24) {
                return `Il y a ${diffHours} h`;
            } else if (diffDays < 7) {
                return `Il y a ${diffDays} j`;
            } else {
                return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            }
        },
        
        animateCounters() {
            // Animation des compteurs avec easing
            const duration = 1500; // 1.5 secondes
            const steps = 60; // 60 frames
            const interval = duration / steps;
            
            const stats = ['vehicles', 'interventions', 'drivers', 'maintenance'];
            
            stats.forEach(stat => {
                const target = this.stats[stat];
                const increment = target / steps;
                let current = 0;
                let step = 0;
                
                const timer = setInterval(() => {
                    step++;
                    // Easing out cubic pour une animation plus naturelle
                    const progress = 1 - Math.pow(1 - step / steps, 3);
                    current = Math.floor(target * progress);
                    
                    this.animatedStats[stat] = current;
                    
                    if (step >= steps) {
                        this.animatedStats[stat] = target;
                        clearInterval(timer);
                    }
                }, interval);
            });
        },
        
        getActivityIconClass(type) {
            // Retourne la classe CSS pour l'icône selon le type d'activité
            switch (type) {
                case 'success':
                    return 'activity-icon-success';
                case 'warning':
                    return 'activity-icon-warning';
                case 'info':
                    return 'activity-icon-info';
                case 'error':
                    return 'activity-icon-error';
                default:
                    return 'activity-icon-info';
            }
        }
    },
    
    template: `
        <main>
            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Chargement du tableau de bord...</p>
            </div>
            
            <!-- Error State -->
            <div v-else-if="error" class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur lors du chargement : {{ error }}</p>
                <button @click="loadDashboardData" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Réessayer
                </button>
            </div>
            
            <!-- Dashboard Content -->
            <div v-else>
            <!-- Dashboard Header -->
            <div class="dashboard-header">
                <h1 class="section-title">Tableau de Bord</h1>
                <p class="dashboard-subtitle">
                    Bienvenue dans votre espace de gestion de parc automobile
                    <span v-if="tenantName">{{ tenantName }}</span>
                </p>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ animatedStats.vehicles }}</div>
                        <div class="stat-label">Véhicules</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-wrench"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ animatedStats.interventions }}</div>
                        <div class="stat-label">Interventions</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ animatedStats.drivers }}</div>
                        <div class="stat-label">Conducteurs</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tools"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ animatedStats.maintenance }}</div>
                        <div class="stat-label">Entretien</div>
                    </div>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="content-grid">
                <!-- Recent Activity -->
                <div class="content-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-clock"></i> Activité Récente
                        </h3>
                    </div>
                    <div class="recent-activity">
                        <div v-if="recentActivities.length === 0" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <p>Aucune activité récente</p>
                        </div>
                        <div v-else v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                            <div class="activity-icon" :class="getActivityIconClass(activity.type)">
                                <i :class="activity.icon"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">{{ activity.title }}</div>
                                <div class="activity-time">{{ activity.time }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="content-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-bolt"></i> Actions Rapides
                        </h3>
                    </div>
                    <div class="quick-actions">
                        <a href="/vehicles.html?action=add" class="quick-action">
                            <i class="fas fa-plus"></i>
                            <span>Nouveau Véhicule</span>
                        </a>
                        <a href="/interventions.html?action=add" class="quick-action">
                            <i class="fas fa-wrench"></i>
                            <span>Nouvelle Intervention</span>
                        </a>
                        <a href="/drivers.html?action=add" class="quick-action">
                            <i class="fas fa-user-plus"></i>
                            <span>Nouveau Conducteur</span>
                        </a>
                        <a href="/reports.html" class="quick-action">
                            <i class="fas fa-chart-bar"></i>
                            <span>Générer Rapport</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Additional Dashboard Content -->
            <div class="content-grid">
                <!-- Vehicle Status Overview -->
                <div class="content-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-pie"></i> État du Parc
                        </h3>
                    </div>
                    <div class="vehicle-status-overview">
                        <div class="status-item">
                            <div class="status-indicator active"></div>
                            <div class="status-info">
                                <div class="status-count">{{ vehicleStatus.active }}</div>
                                <div class="status-label">Véhicules Actifs</div>
                            </div>
                        </div>
                        <div class="status-item">
                            <div class="status-indicator maintenance"></div>
                            <div class="status-info">
                                <div class="status-count">{{ vehicleStatus.maintenance }}</div>
                                <div class="status-label">En Entretien</div>
                            </div>
                        </div>
                        <div class="status-item">
                            <div class="status-indicator inactive"></div>
                            <div class="status-info">
                                <div class="status-count">{{ vehicleStatus.inactive }}</div>
                                <div class="status-label">Hors Service</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Upcoming Maintenance -->
                <div class="content-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-calendar-alt"></i> Entretien à Venir
                        </h3>
                    </div>
                    <div class="upcoming-maintenance">
                        <div v-if="upcomingMaintenance.length === 0" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <p>Aucun entretien à venir</p>
                        </div>
                        <div v-else v-for="maintenance in upcomingMaintenance" :key="maintenance.id" class="maintenance-item">
                            <div class="maintenance-date">{{ maintenance.date }}</div>
                            <div class="maintenance-info">
                                <div class="maintenance-vehicle">{{ maintenance.vehicle }}</div>
                                <div class="maintenance-type">{{ maintenance.type }}</div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `
};

// Exposer le composant globalement
window.DashboardVue = DashboardVue;
