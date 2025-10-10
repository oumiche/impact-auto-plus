<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>Page non trouvée</h2>
      <p>La page que vous recherchez n'existe pas.</p>
      <router-link :to="{ name: 'Dashboard' }" class="btn-home">
        Retour au tableau de bord
      </router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  padding: 2rem;
}

.content {
  text-align: center;
  color: white;

  h1 {
    font-size: 8rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
}

.btn-home {
  display: inline-block;
  padding: 1rem 2rem;
  background: white;
  color: #2563eb;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
  }
}
</style>

