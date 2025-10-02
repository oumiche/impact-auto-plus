/**
 * Layout Vue.js centralisé - Impact Auto
 * Gestion commune de la sidebar et des styles pour toutes les vues
 */

class VueLayout {
    constructor() {
        this.sidebarLoaded = false;
        this.init();
    }

    init() {
        this.loadSidebar();
        this.setupCommonStyles();
        this.setupCommonScripts();
    }

    loadSidebar() {
        if (this.sidebarLoaded) return;

        // Charger la sidebar depuis le template
        fetch('/templates/sidebar.html')
            .then(response => response.text())
            .then(html => {
                // Insérer la sidebar au début du body
                document.body.insertAdjacentHTML('afterbegin', html);
                this.sidebarLoaded = true;
                this.setupSidebarEvents();
            })
            .catch(error => {
                console.error('Erreur lors du chargement de la sidebar:', error);
                this.loadFallbackSidebar();
            });
    }

    loadFallbackSidebar() {
        const sidebarHTML = `
            <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
            <nav class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="logo">IMPACT AUTO</div>
                    <div class="logo-subtitle">Gestion de Parc Automobile</div>
                </div>
                <div class="sidebar-nav">
                    <div class="nav-section">
                        <div class="nav-section-title">Tableau de Bord</div>
                        <a href="dashboard-vue-simple.html" class="nav-item" data-page="dashboard">
                            <i class="fas fa-tachometer-alt"></i> Dashboard
                        </a>
                    </div>
                    <div class="nav-section">
                        <div class="nav-section-title">Gestion</div>
                        <a href="vehicles.html" class="nav-item" data-page="vehicles">
                            <i class="fas fa-car"></i> Véhicules
                        </a>
                        <a href="drivers.html" class="nav-item" data-page="drivers">
                            <i class="fas fa-users"></i> Conducteurs
                        </a>
                        <a href="interventions.html" class="nav-item" data-page="interventions">
                            <i class="fas fa-tools"></i> Interventions
                        </a>
                        <a href="maintenance.html" class="nav-item" data-page="maintenance">
                            <i class="fas fa-wrench"></i> Maintenance
                        </a>
                    </div>
                    <div class="nav-section">
                        <div class="nav-section-title">Rapports</div>
                        <a href="reports.html" class="nav-item" data-page="reports">
                            <i class="fas fa-chart-bar"></i> Rapports
                        </a>
                        <a href="analytics.html" class="nav-item" data-page="analytics">
                            <i class="fas fa-chart-line"></i> Analytics
                        </a>
                    </div>
                    <div class="nav-section">
                        <div class="nav-section-title">Administration</div>
                        <a href="parametres-vue-simple.html" class="nav-item" data-page="parametres">
                            <i class="fas fa-cog"></i> Paramètres
                        </a>
                        <a href="users-vue-simple.html" class="nav-item" data-page="users">
                            <i class="fas fa-users"></i> Utilisateurs
                        </a>
                    </div>
                </div>
                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name" id="user-display-name">Administrateur</div>
                            <div class="user-role" id="user-role">Super Admin</div>
                        </div>
                    </div>
                    <button class="logout-btn" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </nav>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        this.sidebarLoaded = true;
        this.setupSidebarEvents();
    }

    setupSidebarEvents() {
        // Gérer le bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Mettre à jour les informations utilisateur
        this.updateUserInfo();
        
        // Définir la page active
        this.setActivePage();
    }

    updateUserInfo() {
        const userData = localStorage.getItem('current_user');
        const tenantData = localStorage.getItem('current_tenant');
        
        if (userData) {
            const user = JSON.parse(userData);
            const userDisplayName = document.getElementById('user-display-name');
            const userRole = document.getElementById('user-role');
            
            if (userDisplayName) {
                userDisplayName.textContent = user.first_name || user.username || 'Administrateur';
            }
            if (userRole) {
                userRole.textContent = user.user_type === 'super_admin' ? 'Super Admin' : 'Utilisateur';
            }
        }

        if (tenantData) {
            const tenant = JSON.parse(tenantData);
            const tenantNameDisplay = document.getElementById('tenant-name-display');
            const tenantInfo = document.getElementById('tenant-info');
            
            if (tenantNameDisplay) {
                tenantNameDisplay.textContent = tenant.name;
            }
            if (tenantInfo) {
                tenantInfo.style.display = 'block';
            }
        }
    }

    setActivePage() {
        const path = window.location.pathname;
        let currentPage = '';
        
        if (path.includes('dashboard')) currentPage = 'dashboard';
        else if (path.includes('vehicles')) currentPage = 'vehicles';
        else if (path.includes('drivers')) currentPage = 'drivers';
        else if (path.includes('interventions')) currentPage = 'interventions';
        else if (path.includes('maintenance')) currentPage = 'maintenance';
        else if (path.includes('reports')) currentPage = 'reports';
        else if (path.includes('analytics')) currentPage = 'analytics';
        else if (path.includes('parametres')) currentPage = 'parametres';
        else if (path.includes('users')) currentPage = 'users';

        // Retirer la classe active de tous les éléments
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        // Ajouter la classe active à l'élément correspondant
        const activeItem = document.querySelector(`[data-page="${currentPage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    setupCommonStyles() {
        // Ajouter les styles communs si pas déjà présents
        if (!document.getElementById('vue-layout-styles')) {
            const style = document.createElement('style');
            style.id = 'vue-layout-styles';
            style.textContent = `
                /* Styles communs pour les vues Vue.js */
                .vue-page {
                    margin-left: 280px;
                    min-height: 100vh;
                    background: #f5f7fa;
                    padding: 2rem;
                }

                .vue-page-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .vue-page-header h1 {
                    font-size: 2rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .vue-page-header p {
                    opacity: 0.9;
                    font-size: 1.1rem;
                }

                .vue-content {
                    background: white;
                    border-radius: 10px;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .vue-page {
                        margin-left: 0;
                        padding: 1rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupCommonScripts() {
        // Fonction globale pour basculer la sidebar
        window.toggleSidebar = function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('open');
            }
        };
    }

    async logout() {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                await fetch('/api/auth/logout.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('current_tenant');
            window.location.href = 'login-simple.html';
        }
    }
}

// Initialiser le layout automatiquement
document.addEventListener('DOMContentLoaded', () => {
    window.vueLayout = new VueLayout();
});

// Export pour utilisation dans les composants Vue
window.VueLayout = VueLayout;
