import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { 
      requiresAuth: false,
      layout: 'auth'
    }
  },
  {
    path: '/tenant-selection',
    name: 'TenantSelection',
    component: () => import('@/views/auth/TenantSelection.vue'),
    meta: { 
      requiresAuth: true,
      layout: 'auth'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiresTenant: true,
      layout: 'default'
    }
  },
  {
    path: '/garages',
    name: 'Garages',
    component: () => import('@/views/Garages.vue'),
    meta: { 
      requiresAuth: true,
      requiresTenant: true,
      layout: 'default'
    }
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: () => import('@/views/Vehicles.vue'),
    meta: { 
      requiresAuth: true,
      requiresTenant: true,
      layout: 'default'
    }
  },
  {
    path: '/supplies',
    name: 'Supplies',
    component: () => import('@/views/Supplies.vue'),
    meta: { 
      requiresAuth: true,
      requiresTenant: true,
      layout: 'default'
    }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Users.vue'),
    meta: { 
      requiresAuth: true,
      requiresTenant: true,
      requiresRole: 'ROLE_ADMIN',
      layout: 'default'
    }
  },
  // Données de base
  {
    path: '/marques',
    name: 'Marques',
    component: () => import('@/views/Marques.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/modeles',
    name: 'Modeles',
    component: () => import('@/views/Modeles.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/vehicle-categories',
    name: 'VehicleCategories',
    component: () => import('@/views/VehicleCategories.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/vehicle-colors',
    name: 'VehicleColors',
    component: () => import('@/views/VehicleColors.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/fuel-types',
    name: 'FuelTypes',
    component: () => import('@/views/FuelTypes.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/licence-types',
    name: 'LicenceTypes',
    component: () => import('@/views/LicenceTypes.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/supply-categories',
    name: 'SupplyCategories',
    component: () => import('@/views/SupplyCategories.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/intervention-types',
    name: 'InterventionTypes',
    component: () => import('@/views/InterventionTypes.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/collaborateurs',
    name: 'Collaborateurs',
    component: () => import('@/views/Collaborateurs.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  // Gestion
  {
    path: '/drivers',
    name: 'Drivers',
    component: () => import('@/views/Drivers.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/vehicle-assignments',
    name: 'VehicleAssignments',
    component: () => import('@/views/VehicleAssignments.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/vehicle-insurances',
    name: 'VehicleInsurances',
    component: () => import('@/views/VehicleInsurances.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/vehicle-fuel-logs',
    name: 'VehicleFuelLogs',
    component: () => import('@/views/VehicleFuelLogs.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/vehicle-maintenances',
    name: 'VehicleMaintenances',
    component: () => import('@/views/VehicleMaintenances.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  // Suivi
  {
    path: '/vehicle-interventions',
    name: 'VehicleInterventions',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/intervention-prediagnostics',
    name: 'InterventionPrediagnostics',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/intervention-quotes',
    name: 'InterventionQuotes',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/intervention-invoices',
    name: 'InterventionInvoices',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/intervention-work-authorizations',
    name: 'InterventionWorkAuthorizations',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/intervention-reception-reports',
    name: 'InterventionReceptionReports',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  // Rapports
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true }
  },
  // Administration
  {
    path: '/parametres',
    name: 'Parametres',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true, requiresRole: 'ROLE_ADMIN' }
  },
  {
    path: '/tenants',
    name: 'Tenants',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true, requiresRole: 'ROLE_ADMIN' }
  },
  {
    path: '/user-tenant-permissions',
    name: 'UserTenantPermissions',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true, requiresRole: 'ROLE_ADMIN' }
  },
  {
    path: '/code-formats',
    name: 'CodeFormats',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true, requiresRole: 'ROLE_ADMIN' }
  },
  {
    path: '/supply-prices',
    name: 'SupplyPrices',
    component: () => import('@/views/ComingSoon.vue'),
    meta: { requiresAuth: true, requiresTenant: true, requiresRole: 'ROLE_ADMIN' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { layout: 'minimal' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// ==================== NAVIGATION GUARDS ====================

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Vérifier l'authentification
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ 
      name: 'Login', 
      query: { redirect: to.fullPath } 
    })
  }
  
  // Vérifier la sélection de tenant
  if (to.meta.requiresTenant && !authStore.hasTenantSelected) {
    return next({ name: 'TenantSelection' })
  }
  
  // Vérifier les rôles
  if (to.meta.requiresRole && !authStore.hasRole(to.meta.requiresRole)) {
    console.warn(`Access denied: missing role ${to.meta.requiresRole}`)
    return next({ name: 'Dashboard' })
  }
  
  // Rediriger si déjà connecté et tente d'accéder à login
  if (to.name === 'Login' && authStore.isAuthenticated) {
    if (authStore.hasTenantSelected) {
      return next({ name: 'Dashboard' })
    } else {
      return next({ name: 'TenantSelection' })
    }
  }
  
  next()
})

// After navigation hook
router.afterEach((to) => {
  // Mettre à jour le titre de la page
  document.title = to.meta.title || 'Impact Auto Plus'
})

export default router

