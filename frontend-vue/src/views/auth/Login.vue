<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-container">
            <div class="logo-placeholder">IA+</div>
          </div>
          <h1>Connexion</h1>
          <p>Bienvenue sur Impact Auto Plus</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email ou nom d'utilisateur</label>
            <input
              id="email"
              v-model="credentials.email"
              type="text"
              placeholder="admin@impactauto.com"
              required
              :disabled="loading"
              autocomplete="username"
            >
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              placeholder="••••••••"
              required
              :disabled="loading"
              autocomplete="current-password"
            >
          </div>

          <button 
            type="submit" 
            class="btn-primary"
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner"></span>
            <span v-if="loading">Connexion en cours...</span>
            <span v-else>Se connecter</span>
          </button>
        </form>

        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const credentials = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref(null)

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = null
    
    await authStore.login(credentials.email, credentials.password)
    
    // Navigation automatique vers tenant-selection
    router.push({ name: 'TenantSelection' })
  } catch (err) {
    console.error('Login error:', err)
    
    // Gestion des erreurs spécifiques
    if (err.response?.status === 401) {
      error.value = 'Email ou mot de passe incorrect'
    } else if (err.response?.status === 403) {
      error.value = 'Accès refusé. Vérifiez vos permissions'
    } else if (err.response?.status === 500) {
      error.value = 'Erreur du serveur. Veuillez réessayer plus tard'
    } else if (err.message?.includes('Network')) {
      error.value = 'Erreur de connexion. Vérifiez votre connexion internet'
    } else {
      error.value = err.response?.data?.message || 'Erreur de connexion'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 3rem 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;

  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .logo-placeholder {
    width: 80px;
    height: 80px;
    background: #2563eb;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 700;
  }

  p {
    color: #666;
    font-size: 1rem;
  }
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
  }

  input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    &::placeholder {
      color: #999;
    }
  }
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;

  &:hover:not(:disabled) {
    background: #1e40af;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #fee;
  color: #c33;
  border-radius: 8px;
  border-left: 4px solid #c33;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;

  .error-icon {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-header h1 {
    font-size: 1.75rem;
  }
}
</style>

