<template>
  <div id="app">
    <router-view />
    <NotificationContainer />
    <ConfirmModal
      :show="modalState.show"
      :title="modalState.title"
      :message="modalState.message"
      :type="modalState.type"
      :confirm-text="modalState.confirmText"
      :cancel-text="modalState.cancelText"
      :confirm-icon="modalState.confirmIcon"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NotificationContainer from '@/components/common/NotificationContainer.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useConfirm } from '@/composables/useConfirm'

const authStore = useAuthStore()
const { modalState, handleConfirm, handleCancel } = useConfirm()

onMounted(() => {
  // Initialiser l'authentification au chargement de l'app
  authStore.initialize()
})
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}
</style>

