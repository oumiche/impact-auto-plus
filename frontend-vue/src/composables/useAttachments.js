import { ref } from 'vue'
import { useNotification } from './useNotification'

/**
 * Composable réutilisable pour la gestion des pièces jointes
 */
export function useAttachments(entityType, entityId, apiMethods) {
  const { success, error, warning } = useNotification()
  
  const existingAttachments = ref([])
  const newAttachments = ref([])
  const uploadingAttachments = ref(false)
  const previewImage = ref(null)

  // Load existing attachments
  const loadAttachments = async () => {
    try {
      const response = await apiMethods.getAttachments(entityId.value)
      if (response.success) {
        existingAttachments.value = response.data || []
      }
    } catch (err) {
      console.error('Error loading attachments:', err)
    }
  }

  // Upload new attachments
  const uploadNewAttachments = async () => {
    if (newAttachments.value.length === 0) return
    
    try {
      uploadingAttachments.value = true
      
      for (const doc of newAttachments.value) {
        if (doc.file) {
          await apiMethods.uploadAttachment(entityId.value, doc.file)
        }
      }
      
      success('Pièces jointes uploadées avec succès')
      newAttachments.value = []
      await loadAttachments()
    } catch (err) {
      console.error('Error uploading attachments:', err)
      warning('Erreur lors de l\'upload de certaines pièces jointes')
    } finally {
      uploadingAttachments.value = false
    }
  }

  // Delete attachment
  const deleteAttachment = async (attachmentId) => {
    try {
      const response = await apiMethods.deleteAttachment(entityId.value, attachmentId)
      if (response.success) {
        success('Pièce jointe supprimée')
        await loadAttachments()
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      console.error('Error deleting attachment:', err)
      error('Erreur lors de la suppression')
    }
  }

  // View attachment (image preview)
  const viewAttachment = (attachment) => {
    previewImage.value = {
      url: getAttachmentUrl(attachment),
      name: attachment.originalName,
      size: formatFileSize(attachment.size)
    }
  }

  const closePreview = () => {
    previewImage.value = null
  }

  // Download attachment
  const downloadAttachment = (attachment) => {
    const link = document.createElement('a')
    link.href = getAttachmentUrl(attachment)
    link.download = attachment.originalName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helpers
  const getAttachmentUrl = (attachment) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://127.0.0.1:8000/api'
    const backendUrl = apiUrl.replace('/api', '')
    return `${backendUrl}/uploads/${entityType}/${entityId.value}/${attachment.fileName}`
  }

  const isImage = (mimeType) => {
    return mimeType && mimeType.startsWith('image/')
  }

  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'fa-file'
    if (mimeType.startsWith('image/')) return 'fa-image'
    if (mimeType === 'application/pdf') return 'fa-file-pdf'
    if (mimeType.includes('word')) return 'fa-file-word'
    if (mimeType.includes('excel')) return 'fa-file-excel'
    return 'fa-file'
  }

  const getFileExtension = (filename) => {
    const ext = filename.split('.').pop()
    return ext.toUpperCase()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    existingAttachments,
    newAttachments,
    uploadingAttachments,
    previewImage,
    loadAttachments,
    uploadNewAttachments,
    deleteAttachment,
    viewAttachment,
    closePreview,
    downloadAttachment,
    getAttachmentUrl,
    isImage,
    getFileIcon,
    getFileExtension,
    formatFileSize,
    formatDate
  }
}

