import { useNotificationStore } from '@/stores/notification'

export function useNotification() {
  const notificationStore = useNotificationStore()

  return {
    success: (message, duration) => notificationStore.success(message, duration),
    error: (message, duration) => notificationStore.error(message, duration),
    warning: (message, duration) => notificationStore.warning(message, duration),
    info: (message, duration) => notificationStore.info(message, duration),
    notify: (message, type, duration) => notificationStore.addNotification(message, type, duration)
  }
}

