/**
 * Service de gestion des uploads de fichiers
 */
class FileUploadService {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/zip', 'application/x-rar-compressed'
        ];
        this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar'];
    }

    /**
     * Valide un fichier avant l'upload
     * @param {File} file - Le fichier à valider
     * @returns {Object} - {valid: boolean, error: string}
     */
    validateFile(file) {
        // Vérifier la taille
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `Le fichier est trop volumineux (max ${this.formatFileSize(this.maxFileSize)})`
            };
        }

        // Vérifier le type MIME
        if (!this.allowedMimeTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Type de fichier non autorisé'
            };
        }

        // Vérifier l'extension
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.allowedExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
            return {
                valid: false,
                error: 'Extension de fichier non autorisée'
            };
        }

        return { valid: true };
    }

    /**
     * Upload un fichier vers une entité spécifique
     * @param {File} file - Le fichier à uploader
     * @param {string} entityType - Type d'entité (ex: 'intervention_prediagnostic')
     * @param {number} entityId - ID de l'entité
     * @param {string} description - Description optionnelle
     * @returns {Promise<Object>} - Résultat de l'upload
     */
    async uploadFile(file, entityType, entityId, description = '') {
        // Valider le fichier
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Préparer les données
        const formData = new FormData();
        formData.append('file', file);
        if (description) {
            formData.append('description', description);
        }

        try {
            // Déterminer l'endpoint selon le type d'entité
            let endpoint;
            switch (entityType) {
                case 'intervention_prediagnostic':
                    endpoint = `/intervention-prediagnostics/${entityId}/attachments`;
                    break;
                case 'vehicle_intervention':
                    endpoint = `/vehicle-interventions/${entityId}/attachments`;
                    break;
                case 'intervention_quote':
                    endpoint = `/intervention-quotes/${entityId}/attachments`;
                    break;
                default:
                    throw new Error(`Type d'entité non supporté: ${entityType}`);
            }

            // Effectuer l'upload
            const response = await window.apiService.request(endpoint, {
                method: 'POST',
                body: formData
            }, true); // true pour ne pas ajouter Content-Type automatiquement

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    message: `Fichier "${file.name}" uploadé avec succès`
                };
            } else {
                throw new Error(response.message || 'Erreur lors de l\'upload');
            }

        } catch (error) {
            console.error('Erreur upload:', error);
            throw new Error(`Erreur lors de l'upload de "${file.name}": ${error.message}`);
        }
    }

    /**
     * Upload plusieurs fichiers
     * @param {FileList|Array} files - Les fichiers à uploader
     * @param {string} entityType - Type d'entité
     * @param {number} entityId - ID de l'entité
     * @param {Function} onProgress - Callback de progression (optionnel)
     * @returns {Promise<Array>} - Résultats des uploads
     */
    async uploadFiles(files, entityType, entityId, onProgress = null) {
        const fileArray = Array.from(files);
        const results = [];
        let completed = 0;

        for (const file of fileArray) {
            try {
                const result = await this.uploadFile(file, entityType, entityId);
                results.push({ file, result });
                
                completed++;
                if (onProgress) {
                    onProgress(completed, fileArray.length, file.name);
                }
            } catch (error) {
                results.push({ file, error: error.message });
                
                completed++;
                if (onProgress) {
                    onProgress(completed, fileArray.length, file.name, error.message);
                }
            }
        }

        return results;
    }

    /**
     * Récupère la liste des fichiers d'une entité
     * @param {string} entityType - Type d'entité
     * @param {number} entityId - ID de l'entité
     * @returns {Promise<Array>} - Liste des fichiers
     */
    async getFiles(entityType, entityId) {
        try {
            let endpoint;
            switch (entityType) {
                case 'intervention_prediagnostic':
                    endpoint = `/intervention-prediagnostics/${entityId}/attachments`;
                    break;
                case 'vehicle_intervention':
                    endpoint = `/vehicle-interventions/${entityId}/attachments`;
                    break;
                case 'intervention_quote':
                    endpoint = `/intervention-quotes/${entityId}/attachments`;
                    break;
                default:
                    throw new Error(`Type d'entité non supporté: ${entityType}`);
            }

            const response = await window.apiService.request(endpoint);
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Erreur lors de la récupération des fichiers');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des fichiers:', error);
            throw error;
        }
    }

    /**
     * Supprime un fichier
     * @param {string} entityType - Type d'entité
     * @param {number} entityId - ID de l'entité
     * @param {number} fileId - ID du fichier
     * @returns {Promise<Object>} - Résultat de la suppression
     */
    async deleteFile(entityType, entityId, fileId) {
        try {
            let endpoint;
            switch (entityType) {
                case 'intervention_prediagnostic':
                    endpoint = `/intervention-prediagnostics/${entityId}/attachments/${fileId}`;
                    break;
                case 'vehicle_intervention':
                    endpoint = `/vehicle-interventions/${entityId}/attachments/${fileId}`;
                    break;
                case 'intervention_quote':
                    endpoint = `/intervention-quotes/${entityId}/attachments/${fileId}`;
                    break;
                default:
                    throw new Error(`Type d'entité non supporté: ${entityType}`);
            }

            const response = await window.apiService.request(endpoint, {
                method: 'DELETE'
            });

            if (response.success) {
                return {
                    success: true,
                    message: 'Fichier supprimé avec succès'
                };
            } else {
                throw new Error(response.message || 'Erreur lors de la suppression');
            }

        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            throw error;
        }
    }

    /**
     * Télécharge un fichier
     * @param {Object} attachment - Objet attachment avec filePath et originalName
     * @param {string} entityType - Type d'entité (ex: 'intervention_prediagnostic')
     * @param {number} entityId - ID de l'entité
     */
    downloadFile(attachment, entityType, entityId) {
        const link = document.createElement('a');
        // Les fichiers sont servis par le backend sur le port 8000
        link.href = `http://127.0.0.1:8000/uploads/${entityType}/${entityId}/${attachment.fileName}`;
        link.download = attachment.originalName;
        link.click();
    }

    /**
     * Obtient l'icône appropriée pour un type de fichier
     * @param {string} mimeType - Type MIME du fichier
     * @returns {string} - Classe CSS de l'icône
     */
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType === 'application/pdf') return 'fas fa-file-pdf';
        if (mimeType.includes('word')) return 'fas fa-file-word';
        if (mimeType === 'text/plain') return 'fas fa-file-alt';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'fas fa-file-archive';
        return 'fas fa-file';
    }

    /**
     * Formate la taille d'un fichier
     * @param {number} bytes - Taille en bytes
     * @returns {string} - Taille formatée
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Formate une date
     * @param {string} dateString - Date en string
     * @returns {string} - Date formatée
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', {
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    /**
     * Crée une zone d'upload avec drag & drop
     * @param {Object} options - Options de configuration
     * @returns {HTMLElement} - Élément de zone d'upload
     */
    createUploadZone(options = {}) {
        const {
            onDrop = () => {},
            onDragOver = () => {},
            onDragLeave = () => {},
            onFileSelect = () => {},
            multiple = true,
            accept = 'image/*,.pdf,.doc,.docx,.txt,.zip,.rar',
            placeholder = 'Glissez-déposez vos fichiers ici ou cliquez pour sélectionner',
            maxFiles = null
        } = options;

        const container = document.createElement('div');
        container.className = 'upload-area';
        container.innerHTML = `
            <input 
                type="file" 
                style="display: none;" 
                ${multiple ? 'multiple' : ''} 
                accept="${accept}"
            >
            <div class="upload-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>${placeholder}</p>
                <small>Formats acceptés : Images, PDF, Word, TXT, ZIP, RAR (max ${this.formatFileSize(this.maxFileSize)})</small>
            </div>
        `;

        const fileInput = container.querySelector('input[type="file"]');

        // Événements drag & drop
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
            onDragOver(e);
        });

        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            onDragLeave(e);
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            if (maxFiles && files.length > maxFiles) {
                alert(`Maximum ${maxFiles} fichiers autorisés`);
                return;
            }
            onDrop(files);
        });

        // Clic pour sélectionner des fichiers
        container.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (maxFiles && files.length > maxFiles) {
                alert(`Maximum ${maxFiles} fichiers autorisés`);
                return;
            }
            onFileSelect(files);
        });

        return container;
    }
}

// Créer une instance globale
window.fileUploadService = new FileUploadService();

// Export pour les modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadService;
}
