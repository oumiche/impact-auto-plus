<template>
  <teleport to="body">
    <div class="notification-container">
      <transition-group name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification"
          :class="`notification-${notification.type}`"
          @click="removeNotification(notification.id)"
        >
          <div class="notification-icon">
            <span v-if="notification.type === 'success'">✓</span>
            <span v-else-if="notification.type === 'error'">✕</span>
            <span v-else-if="notification.type === 'warning'">⚠</span>
            <span v-else>ℹ</span>
          </div>
          <div class="notification-content">
            <p>{{ notification.message }}</p>
          </div>
          <button class="notification-close" @click.stop="removeNotification(notification.id)">
            ×
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)

const removeNotification = (id) => {
  notificationStore.removeNotification(id)
}
</script>

<style scoped lang="scss">
.notification-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: auto;
  min-width: 300px;
  border-left: 4px solid;

  &.notification-success {
    border-left-color: #10b981;

    .notification-icon {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
  }

  &.notification-error {
    border-left-color: #ef4444;

    .notification-icon {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }

  &.notification-warning {
    border-left-color: #f59e0b;

    .notification-icon {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
  }

  &.notification-info {
    border-left-color: #2563eb;

    .notification-icon {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
    }
  }
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;

  p {
    margin: 0;
    color: #1e293b;
    font-size: 0.95rem;
    font-weight: 500;
  }
}

.notification-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
}

// Animations
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .notification-container {
    left: 10px;
    right: 10px;
    max-width: none;
  }

  .notification {
    min-width: auto;
  }
}
</style>

