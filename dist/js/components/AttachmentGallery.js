/**
 * Composant galerie de pièces jointes réutilisable
 * Affiche les fichiers sous forme de galerie avec aperçus
 */
const AttachmentGallery = {
    name: 'AttachmentGallery',
    
    props: {
        attachments: {
            type: Array,
            default: () => []
        },
        entityType: {
            type: String,
            required: true
        },
        entityId: {
            type: [Number, String],
            required: true
        },
        showActions: {
            type: Boolean,
            default: true
        },
        maxPreviewSize: {
            type: String,
            default: '280px'
        }
    },
    
    data() {
        return {
            previewModal: {
                show: false,
                attachment: null
            }
        };
    },
    
    methods: {
        /**
         * Vérifie si un fichier est une image
         */
        isImage(mimeType) {
            return mimeType && mimeType.startsWith('image/');
        },
        
        /**
         * Génère l'URL d'aperçu pour un fichier
         */
        getFilePreviewUrl(attachment) {
            if (!attachment || !attachment.filePath) return '';
            // Les fichiers sont servis par le backend sur le port 8000
            return `http://127.0.0.1:8000/uploads/${this.entityType}/${this.entityId}/${attachment.fileName}`;
        },
        
        /**
         * Ouvre la modal d'aperçu
         */
        openPreview(attachment) {
            this.previewModal = {
                show: true,
                attachment: attachment
            };
        },
        
        /**
         * Ferme la modal d'aperçu
         */
        closePreview() {
            this.previewModal = {
                show: false,
                attachment: null
            };
        },
        
        /**
         * Retourne l'icône FontAwesome appropriée pour un type MIME
         */
        getFileIcon(mimeType) {
            if (!mimeType) return 'fas fa-file';
            if (mimeType.startsWith('image/')) return 'fas fa-image';
            if (mimeType === 'application/pdf') return 'fas fa-file-pdf';
            if (mimeType.includes('word')) return 'fas fa-file-word';
            if (mimeType === 'text/plain') return 'fas fa-file-alt';
            if (mimeType.includes('zip') || mimeType.includes('rar')) return 'fas fa-file-archive';
            return 'fas fa-file';
        },
        
        /**
         * Formate la taille d'un fichier
         */
        formatFileSize(bytes) {
            if (!bytes || bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },
        
        /**
         * Formate une date
         */
        formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        /**
         * Émet un événement pour télécharger un fichier
         */
        downloadFile(attachment) {
            this.$emit('download', attachment);
        },
        
        /**
         * Émet un événement pour supprimer un fichier
         */
        deleteFile(attachment) {
            this.$emit('delete', attachment);
        }
    },
    
    template: `
        <div class="attachment-gallery-container">
            <!-- Galerie des fichiers -->
            <div v-if="attachments.length > 0" class="attachments-gallery" :style="{ '--min-size': maxPreviewSize }">
                <div v-for="attachment in attachments" :key="attachment.id" class="attachment-gallery-item">
                    <!-- Aperçu pour les images -->
                    <div v-if="isImage(attachment.mimeType)" class="attachment-preview">
                        <img :src="getFilePreviewUrl(attachment)" 
                             :alt="attachment.originalName"
                             @click="openPreview(attachment)"
                             class="preview-image">
                        <div class="preview-overlay">
                            <button type="button" class="preview-btn" @click="openPreview(attachment)" title="Aperçu">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Icône pour les autres fichiers -->
                    <div v-else class="attachment-icon">
                        <i :class="getFileIcon(attachment.mimeType)"></i>
                    </div>
                    
                    <!-- Informations du fichier -->
                    <div class="attachment-details">
                        <div class="file-name" :title="attachment.originalName">{{ attachment.originalName }}</div>
                        <div class="file-meta">{{ formatFileSize(attachment.fileSize) }} • {{ formatDate(attachment.uploadedAt) }}</div>
                    </div>
                    
                    <!-- Actions -->
                    <div v-if="showActions" class="attachment-actions">
                        <button type="button" class="btn btn-sm btn-outline" @click="downloadFile(attachment)" title="Télécharger">
                            <i class="fas fa-download"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" @click="deleteFile(attachment)" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Message si aucun fichier -->
            <div v-else class="no-attachments">
                <i class="fas fa-paperclip"></i>
                <p>Aucune pièce jointe</p>
            </div>
            
            <!-- Modal d'aperçu -->
            <div v-if="previewModal.show" class="preview-modal" @click="closePreview">
                <div class="preview-modal-content" @click.stop>
                    <button type="button" class="preview-close" @click="closePreview">
                        <i class="fas fa-times"></i>
                    </button>
                    <img v-if="previewModal.attachment" 
                         :src="getFilePreviewUrl(previewModal.attachment)" 
                         :alt="previewModal.attachment.originalName"
                         class="preview-modal-image">
                    <div class="preview-modal-info">
                        <h3>{{ previewModal.attachment?.originalName }}</h3>
                        <p>{{ formatFileSize(previewModal.attachment?.fileSize) }} • {{ formatDate(previewModal.attachment?.uploadedAt) }}</p>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Rendre le composant disponible globalement
if (typeof window !== 'undefined') {
    window.AttachmentGallery = AttachmentGallery;
}

// Exporter pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttachmentGallery;
}
