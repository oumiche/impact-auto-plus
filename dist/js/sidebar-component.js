/**
 * Composant Sidebar réutilisable - Impact Auto
 */

class SidebarComponent {
  constructor() {
    this.sidebarOpen = false
    this.isMobile = false
    this.user = null
    this.tenant = null
    this.currentPage = ''
    
    this.init()
  }

  init() {
    this.loadUserData()
    this.detectCurrentPage()
    this.checkMobile()
    this.setupEventListeners()
    window.addEventListener('resize', () => this.checkMobile())
  }

  loadUserData() {
    const userData = localStorage.getItem('current_user')
    const tenantData = localStorage.getItem('current_tenant')
    
    if (userData) {
      this.user = JSON.parse(userData)
    }
    if (tenantData) {
      this.tenant = JSON.parse(tenantData)
    }
  }

  detectCurrentPage() {
    const path = window.location.pathname
    if (path.includes('dashboard')) this.currentPage = 'dashboard'
    else if (path.includes('vehicles')) this.currentPage = 'vehicles'
    else if (path.includes('drivers')) this.currentPage = 'drivers'
    else if (path.includes('vehicle-interventions')) this.currentPage = 'vehicle-interventions'
    else if (path.includes('intervention-prediagnostics')) this.currentPage = 'intervention-prediagnostics'
    else if (path.includes('interventions')) this.currentPage = 'interventions'
    else if (path.includes('maintenance')) this.currentPage = 'maintenance'
    else if (path.includes('reports')) this.currentPage = 'reports'
    else if (path.includes('analytics')) this.currentPage = 'analytics'
    else if (path.includes('parametres')) this.currentPage = 'parametres'
    else if (path.includes('users')) this.currentPage = 'users'
    else if (path.includes('code-formats')) this.currentPage = 'code-formats'
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768
    if (!this.isMobile) {
      this.sidebarOpen = false
    }
  }

  setupEventListeners() {
    // Fermer la sidebar en cliquant à l'extérieur sur mobile
    document.addEventListener('click', (event) => {
      const sidebar = document.getElementById('sidebar')
      const menuBtn = document.querySelector('.mobile-menu-btn')
      
      if (this.isMobile && 
          sidebar && 
          !sidebar.contains(event.target) && 
          !menuBtn.contains(event.target)) {
        this.sidebarOpen = false
        this.updateSidebarClass()
      }
    })
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    this.updateSidebarClass()
  }

  updateSidebarClass() {
    const sidebar = document.getElementById('sidebar')
    if (sidebar) {
      if (this.sidebarOpen) {
        sidebar.classList.add('open')
      } else {
        sidebar.classList.remove('open')
      }
    }
  }

  getUserDisplayName() {
    if (!this.user) return 'Administrateur'
    return this.user.first_name || this.user.username || 'Administrateur'
  }

  getUserRole() {
    if (!this.user) return 'Super Admin'
    return this.user.user_type === 'super_admin' ? 'Super Admin' : 'Utilisateur'
  }

  getTenantName() {
    return this.tenant ? this.tenant.name : null
  }

  async logout() {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch('/api/auth/logout.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('current_user')
      localStorage.removeItem('current_tenant')
      window.location.href = '/login.html'
    }
  }
}

// Fonction globale pour basculer la sidebar
window.toggleSidebar = function() {
  if (window.sidebarComponent) {
    window.sidebarComponent.toggleSidebar()
  }
}

// Initialiser le composant sidebar
document.addEventListener('DOMContentLoaded', () => {
  window.sidebarComponent = new SidebarComponent()
})
