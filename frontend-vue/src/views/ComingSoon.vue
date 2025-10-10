<template>
  <DefaultLayout>
    <div class="coming-soon">
      <div class="coming-soon-content">
        <div class="icon">🚧</div>
        <h2>Page en cours de développement</h2>
        <p>Cette fonctionnalité sera bientôt disponible.</p>
        <router-link :to="{ name: 'Dashboard' }" class="btn-primary">
          Retour au tableau de bord
        </router-link>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
</script>

<style scoped lang="scss">
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.coming-soon-content {
  text-align: center;
  max-width: 500px;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .icon {
    font-size: 5rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #333;
  }

  p {
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    background: #1e40af;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
  }
}
</style>

