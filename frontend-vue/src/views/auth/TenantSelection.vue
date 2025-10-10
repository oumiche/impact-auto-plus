<template>
  <div class="tenant-selection-page">
    <div class="container">
      <div class="header">
        <h1>Sélectionnez votre organisation</h1>
        <p class="welcome-text">Bonjour {{ authStore.userFullName }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement des organisations...</p>
      </div>

      <!-- Tenants Grid -->
      <div v-else-if="tenants.length > 0" class="tenants-grid">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="tenant-card"
          @click="selectTenant(tenant)"
          :class="{ 'is-primary': tenant.is_primary }"
        >
          <div class="tenant-icon">
            {{ tenant.name.charAt(0).toUpperCase() }}
          </div>
          <div class="tenant-info">
            <h3>{{ tenant.name }}</h3>
            <p v-if="tenant.description">{{ tenant.description }}</p>
            <span v-if="tenant.is_primary" class="primary-badge">Principal</span>
          </div>
          <div class="tenant-arrow">→</div>
        </div>
      </div>

      <!-- No Tenants -->
      <div v-else class="no-tenants">
        <div class="no-tenants-icon">🏢</div>
        <p>Aucune organisation disponible</p>
        <button @click="handleLogout" class="btn-secondary">
          Se déconnecter
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <!-- Logout Button -->
      <div class="footer">
        <button @click="handleLogout" class="btn-logout">
          Se déconnecter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'

const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()

const tenants = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  await loadTenants()
})

const loadTenants = async () => {
  try {
    loading.value = true
    error.value = null
    
    tenants.value = await tenantStore.fetchTenants()
  } catch (err) {
    console.error('Error loading tenants:', err)
    error.value = err.response?.data?.message || 'Erreur lors du chargement des organisations'
  } finally {
    loading.value = false
  }
}

const selectTenant = async (tenant) => {
  try {
    authStore.selectTenant(tenant)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    console.error('Error selecting tenant:', err)
    error.value = 'Erreur lors de la sélection de l\'organisation'
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped lang="scss">
.tenant-selection-page {
  min-height: 100vh;
  background: #2563eb;
  padding: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
  animation: fadeInDown 0.6s ease-out;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    font-weight: 700;
  }

  .welcome-text {
    font-size: 1.2rem;
    opacity: 0.95;
  }
}

.loading-container {
  text-align: center;
  color: white;
  padding: 4rem 2rem;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1.5rem;
  }

  p {
    font-size: 1.1rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tenants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: fadeInUp 0.6s ease-out;
}

.tenant-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  &.is-primary {
    border: 2px solid #2563eb;
  }

  .tenant-icon {
    width: 60px;
    height: 60px;
    background: #2563eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .tenant-info {
    flex: 1;

    h3 {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
      color: #333;
      font-weight: 600;
    }

    p {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .primary-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #2563eb;
      color: white;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  }

  .tenant-arrow {
    font-size: 1.5rem;
    color: #2563eb;
    transition: transform 0.3s;
  }

  &:hover .tenant-arrow {
    transform: translateX(4px);
  }
}

.no-tenants {
  text-align: center;
  color: white;
  padding: 4rem 2rem;
  animation: fadeIn 0.6s ease-out;

  .no-tenants-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
}

.btn-secondary {
  padding: 0.875rem 2rem;
  background: white;
  color: #2563eb;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
  }
}

.error-message {
  margin-top: 2rem;
  padding: 1rem 1.5rem;
  background-color: rgba(255, 255, 255, 0.95);
  color: #c33;
  border-radius: 8px;
  border-left: 4px solid #c33;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  animation: shake 0.5s ease-out;

  .error-icon {
    font-size: 1.5rem;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.footer {
  text-align: center;
  margin-top: 3rem;
  animation: fadeIn 0.6s ease-out 0.3s both;
}

.btn-logout {
  padding: 0.75rem 2rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: white;
    color: #2563eb;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .tenants-grid {
    grid-template-columns: 1fr;
  }

  .tenant-card {
    padding: 1.5rem;
  }
}
</style>

