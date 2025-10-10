/**
 * Chargement dynamique du sidebar - Impact Auto
 */

class SidebarLoader {
  constructor() {
    this.sidebarLoaded = false
    this.init()
  }

  async init() {
    await this.loadSidebar()
    this.setupSidebar()
  }

  async loadSidebar() {
    if (this.sidebarLoaded) return

    try {
      const response = await fetch('/templates/sidebar.html')
      const sidebarHTML = await response.text()
      
      // Insérer le sidebar au début du body
      document.body.insertAdjacentHTML('afterbegin', sidebarHTML)
      this.sidebarLoaded = true
    } catch (error) {
      console.error('Erreur lors du chargement du sidebar:', error)
      // Fallback: sidebar intégré
      this.loadFallbackSidebar()
    }
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
            <a href="/dashboard-vue.html" class="nav-item" data-page="dashboard">
              <i class="fas fa-home"></i> Dashboard
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-section-title">Gestion</div>
            <a href="/vehicles.html" class="nav-item" data-page="vehicles">
              <i class="fas fa-car"></i> Véhicules
            </a>
            <a href="/drivers.html" class="nav-item" data-page="drivers">
              <i class="fas fa-user"></i> Conducteurs
            </a>
            <a href="/interventions.html" class="nav-item" data-page="interventions">
              <i class="fas fa-wrench"></i> Interventions
            </a>
            <a href="/intervention-quotes.html" class="nav-item" data-page="intervention-quotes">
              <i class="fas fa-file-invoice-dollar"></i> Devis d'Intervention
            </a>
            <a href="/intervention-work-authorizations.html" class="nav-item" data-page="intervention-work-authorizations">
              <i class="fas fa-clipboard-check"></i> Autorisations de Travail
            </a>
            <a href="/intervention-invoices.html" class="nav-item" data-page="intervention-invoices">
              <i class="fas fa-file-invoice"></i> Factures d'Intervention
            </a>
            <a href="/intervention-reception-reports.html" class="nav-item" data-page="intervention-reception-reports">
              <i class="fas fa-clipboard-list"></i> Rapports de Réception
            </a>
            <a href="/maintenance.html" class="nav-item" data-page="maintenance">
              <i class="fas fa-tools"></i> Entretien
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-section-title">Rapports</div>
            <a href="/reports.html" class="nav-item" data-page="reports">
              <i class="fas fa-chart-bar"></i> Rapports
            </a>
            <a href="/analytics.html" class="nav-item" data-page="analytics">
              <i class="fas fa-chart-line"></i> Analytics
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-section-title">Administration</div>
            <a href="/parametres.html" class="nav-item" data-page="parametres">
              <i class="fas fa-cog"></i> Paramètres
            </a>
            <a href="/users.html" class="nav-item" data-page="users">
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
          <div class="tenant-info" id="tenant-info" style="display: none;">
            <div class="tenant-name" id="tenant-name-display">Tenant Actuel</div>
          </div>
          <button class="logout-btn" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Déconnexion
          </button>
        </div>
      </nav>
    `
    
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML)
    this.sidebarLoaded = true
  }

  setupSidebar() {
    // Si SidebarComponent existe, réinitialiser ou créer
    if (window.sidebarComponent) {
      // Réattacher les événements car le DOM a changé
      if (typeof window.sidebarComponent.attachLogoutButton === 'function') {
        window.sidebarComponent.attachLogoutButton()
      }
      // Mettre à jour les informations utilisateur
      this.updateUserInfo()
      this.setActivePage()
    } else if (window.SidebarComponent) {
      // Créer une nouvelle instance si elle n'existe pas
      window.sidebarComponent = new window.SidebarComponent()
      // Attacher le bouton logout après la création
      if (typeof window.sidebarComponent.attachLogoutButton === 'function') {
        window.sidebarComponent.attachLogoutButton()
      }
      this.updateUserInfo()
      this.setActivePage()
    } else {
      // Fallback simple
      this.setupSimpleSidebar()
    }
  }

  setupSimpleSidebar() {
    // Mettre à jour les informations utilisateur
    this.updateUserInfo()
    
    // Gérer la navigation active
    this.setActivePage()
    
    // Gérer le bouton de déconnexion
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout())
    }
  }

  updateUserInfo() {
    const userData = localStorage.getItem('current_user')
    const tenantData = localStorage.getItem('current_tenant')
    
    if (userData) {
      const user = JSON.parse(userData)
      const userDisplayName = document.getElementById('user-display-name')
      const userRole = document.getElementById('user-role')
      
      if (userDisplayName) {
        userDisplayName.textContent = user.first_name || user.username || 'Administrateur'
      }
      if (userRole) {
        userRole.textContent = user.user_type === 'super_admin' ? 'Super Admin' : 'Utilisateur'
      }
    }

    if (tenantData) {
      const tenant = JSON.parse(tenantData)
      const tenantNameDisplay = document.getElementById('tenant-name-display')
      const tenantInfo = document.getElementById('tenant-info')
      
      if (tenantNameDisplay) {
        tenantNameDisplay.textContent = tenant.name
      }
      if (tenantInfo) {
        tenantInfo.style.display = 'block'
      }
    }
  }

  setActivePage() {
    const path = window.location.pathname
    let currentPage = ''
    
    // Tableau de bord
    if (path.includes('dashboard')) currentPage = 'dashboard'
    else if (path.includes('tenant-selection')) currentPage = 'tenant-selection'
    
    // Données de base
    else if (path.includes('marques')) currentPage = 'marques'
    else if (path.includes('modeles')) currentPage = 'modeles'
    else if (path.includes('vehicle-categories')) currentPage = 'vehicle-categories'
    else if (path.includes('vehicle-colors')) currentPage = 'vehicle-colors'
    else if (path.includes('fuel-types')) currentPage = 'fuel-types'
    else if (path.includes('licence-types')) currentPage = 'licence-types'
    else if (path.includes('supply-categories')) currentPage = 'supply-categories'
    else if (path.includes('supplies')) currentPage = 'supplies'
    else if (path.includes('intervention-types')) currentPage = 'intervention-types'
    
    // Gestion
    else if (path.includes('garages')) currentPage = 'garages'
    else if (path.includes('vehicles')) currentPage = 'vehicles'
    else if (path.includes('drivers')) currentPage = 'drivers'
    else if (path.includes('vehicle-assignments')) currentPage = 'vehicle-assignments'
    else if (path.includes('vehicle-insurances')) currentPage = 'vehicle-insurances'
    else if (path.includes('vehicle-fuel-logs')) currentPage = 'vehicle-fuel-logs'
    else if (path.includes('vehicle-maintenances')) currentPage = 'vehicle-maintenances'
    
    // Suivi
    else if (path.includes('vehicle-interventions')) currentPage = 'vehicle-interventions'
    else if (path.includes('intervention-prediagnostics')) currentPage = 'intervention-prediagnostics'
    else if (path.includes('intervention-quotes')) currentPage = 'intervention-quotes'
    else if (path.includes('intervention-invoices')) currentPage = 'intervention-invoices'
    else if (path.includes('intervention-work-authorizations')) currentPage = 'intervention-work-authorizations'
    else if (path.includes('intervention-reception-reports')) currentPage = 'intervention-reception-reports'
    
    // Rapports
    else if (path.includes('reports')) currentPage = 'reports'
    else if (path.includes('analytics')) currentPage = 'analytics'
    
    // Administration
    else if (path.includes('parametres')) currentPage = 'parametres'
    else if (path.includes('users')) currentPage = 'users'
    else if (path.includes('tenants')) currentPage = 'tenants'
    else if (path.includes('user-tenant-permissions')) currentPage = 'user-tenant-permissions'
    else if (path.includes('code-formats')) currentPage = 'code-formats'

    // Retirer la classe active de tous les éléments
    const navItems = document.querySelectorAll('.nav-item')
    navItems.forEach(item => item.classList.remove('active'))

    // Ajouter la classe active à l'élément correspondant
    const activeItem = document.querySelector(`[data-page="${currentPage}"]`)
    if (activeItem) {
      activeItem.classList.add('active')
      
      // Faire défiler automatiquement vers l'élément actif
      this.scrollToActiveItem(activeItem)
    }
  }

  scrollToActiveItem(activeItem) {
    // Attendre un court délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      const sidebar = document.getElementById('sidebar')
      if (!sidebar) return

      const sidebarNav = sidebar.querySelector('.sidebar-nav')
      if (!sidebarNav) return

      // Calculer la position de l'élément actif par rapport au conteneur de navigation
      const activeItemRect = activeItem.getBoundingClientRect()
      const sidebarNavRect = sidebarNav.getBoundingClientRect()
      
      // Position relative de l'élément actif dans le conteneur
      const relativeTop = activeItemRect.top - sidebarNavRect.top
      const relativeBottom = activeItemRect.bottom - sidebarNavRect.top
      
      // Hauteur du conteneur de navigation
      const containerHeight = sidebarNavRect.height
      
      // Vérifier si l'élément est visible
      const isVisible = relativeTop >= 0 && relativeBottom <= containerHeight
      
      if (!isVisible) {
        // Calculer la position de défilement pour centrer l'élément
        const scrollTop = sidebarNav.scrollTop + relativeTop - (containerHeight / 2) + (activeItemRect.height / 2)
        
        // Faire défiler en douceur
        sidebarNav.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        })
      }
    }, 100) // Délai de 100ms pour s'assurer que le DOM est prêt
  }

  async logout() {
    try {
      // Utiliser apiService pour déconnecter
      if (window.apiService) {
        await window.apiService.logout()
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('current_user')
      localStorage.removeItem('current_tenant')
      
      // Rediriger vers la page de connexion
      window.location.href = '/login.html'
    }
  }
}

// Fonction globale pour basculer la sidebar
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.toggle('open')
  }
}

// Exposer la classe globalement
window.SidebarLoader = SidebarLoader

// Initialiser le chargement du sidebar (seulement si pas déjà fait par app-includes.js)
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier si le sidebar n'est pas déjà chargé
  if (!document.getElementById('sidebar') && !window.sidebarLoaderInitialized) {
    new SidebarLoader()
    window.sidebarLoaderInitialized = true
  }
})
