/**
 * Impact Auto - Dashboard JavaScript
 * Gestion du dashboard principal avec statistiques et navigation
 * Compatible avec la charte graphique Impact Auto
 */

class ImpactAutoDashboard {
    constructor() {
        this.user = null;
        this.tenant = null;
        this.session = null;
        this.canSwitch = false;
        
        this.init();
    }

    async init() {
        this.loadUserData();
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    loadUserData() {
        // Charger les données depuis localStorage (compatible avec le système d'auth)
        const userData = localStorage.getItem('current_user');
        const tenantData = localStorage.getItem('current_tenant');
        const token = localStorage.getItem('auth_token');

        if (!userData || !token) {
            this.redirectToLogin();
            return;
        }

        this.user = JSON.parse(userData);
        this.tenant = tenantData ? JSON.parse(tenantData) : null;
        this.canSwitch = this.user && this.user.user_type === 'super_admin';

        this.updateUserInterface();
    }

    updateUserInterface() {
        // Mettre à jour le nom d'utilisateur
        const userDisplayName = document.getElementById('user-display-name');
        const userRole = document.getElementById('user-role');
        
        if (userDisplayName && this.user) {
            userDisplayName.textContent = this.user.first_name || this.user.username || 'Administrateur';
        }
        
        if (userRole && this.user) {
            userRole.textContent = this.user.user_type === 'super_admin' ? 'Super Admin' : 'Utilisateur';
        }

        // Mettre à jour le nom du tenant
        const tenantNameDisplay = document.getElementById('tenant-name-display');
        const tenantNameDisplayHeader = document.getElementById('tenant-name-display-header');
        const tenantInfo = document.getElementById('tenant-info');
        
        if (this.tenant && this.tenant.name) {
            if (tenantNameDisplay) {
                tenantNameDisplay.textContent = this.tenant.name;
            }
            if (tenantNameDisplayHeader) {
                tenantNameDisplayHeader.textContent = ` - ${this.tenant.name}`;
            }
            if (tenantInfo) {
                tenantInfo.style.display = 'block';
            }
        } else {
            if (tenantInfo) {
                tenantInfo.style.display = 'none';
            }
        }
    }

    async loadDashboardData() {
        try {
            // Simulation de données - à remplacer par des appels API réels
            await this.loadStats();
            await this.loadRecentActivity();
            await this.loadMaintenanceData();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    async loadStats() {
        // Simulation de données - à remplacer par des appels API réels
        const stats = {
            vehicles: 24,
            interventions: 18,
            drivers: 12,
            maintenanceDue: 3
        };

        // Mettre à jour les cartes de statistiques
        this.updateStatCard('vehicles-count', stats.vehicles);
        this.updateStatCard('interventions-count', stats.interventions);
        this.updateStatCard('drivers-count', stats.drivers);
        this.updateStatCard('maintenance-due', stats.maintenanceDue);
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animation de compteur
            this.animateCounter(element, 0, value, 1000);
        }
    }

    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    async loadRecentActivity() {
        // Simulation de données - à remplacer par des appels API réels
        const activities = [
            {
                type: 'vehicle',
                title: 'Nouveau véhicule ajouté',
                time: 'Il y a 2 heures',
                icon: 'fas fa-car'
            },
            {
                type: 'intervention',
                title: 'Intervention terminée',
                time: 'Il y a 4 heures',
                icon: 'fas fa-wrench'
            },
            {
                type: 'maintenance',
                title: 'Maintenance programmée',
                time: 'Il y a 1 jour',
                icon: 'fas fa-tools'
            }
        ];

        const container = document.getElementById('recent-activity');
        if (container) {
            container.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    async loadMaintenanceData() {
        // Simulation de données - à remplacer par des appels API réels
        const maintenanceData = {
            active: 18,
            maintenance: 3,
            inactive: 3
        };

        // Mettre à jour les indicateurs d'état
        this.updateStatCard('active-vehicles', maintenanceData.active);
        this.updateStatCard('maintenance-vehicles', maintenanceData.maintenance);
        this.updateStatCard('inactive-vehicles', maintenanceData.inactive);
    }

    setupEventListeners() {
        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Actions rapides
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.preventDefault();
                const href = action.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            });
        });

        // Navigation sidebar
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Retirer la classe active de tous les éléments
                navItems.forEach(nav => nav.classList.remove('active'));
                // Ajouter la classe active à l'élément cliqué
                item.classList.add('active');
            });
        });
    }

    async handleLogout() {
        try {
            // Utiliser apiService pour déconnecter
            if (window.apiService) {
                await window.apiService.logout();
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            // Nettoyer le localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('current_tenant');
            
            // Rediriger vers la page de connexion
            window.location.href = '/login.html';
        }
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }
}

// Fonction pour basculer la sidebar sur mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Fermer la sidebar en cliquant à l'extérieur sur mobile
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth <= 768 && 
        sidebar && 
        !sidebar.contains(e.target) && 
        !menuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new ImpactAutoDashboard();
});
