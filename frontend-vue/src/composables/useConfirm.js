import { ref } from 'vue'

const modalState = ref({
  show: false,
  title: '',
  message: '',
  type: 'warning',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  confirmIcon: null,
  resolvePromise: null,
  rejectPromise: null
})

export function useConfirm() {
  const confirm = ({
    title = 'Confirmation',
    message = 'Êtes-vous sûr de vouloir continuer ?',
    type = 'warning',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    confirmIcon = null
  } = {}) => {
    return new Promise((resolve, reject) => {
      modalState.value = {
        show: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        confirmIcon,
        resolvePromise: resolve,
        rejectPromise: reject
      }
    })
  }

  const handleConfirm = () => {
    if (modalState.value.resolvePromise) {
      modalState.value.resolvePromise(true)
    }
    modalState.value.show = false
  }

  const handleCancel = () => {
    if (modalState.value.rejectPromise) {
      modalState.value.rejectPromise(false)
    }
    modalState.value.show = false
  }

  return {
    modalState,
    confirm,
    handleConfirm,
    handleCancel
  }
}

