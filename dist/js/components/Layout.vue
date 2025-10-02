<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <Sidebar />
    
    <!-- Main Content -->
    <main class="main-content">
      <slot></slot>
    </main>
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue'

export default {
  name: 'Layout',
  components: {
    Sidebar
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 2rem;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
}
</style>
