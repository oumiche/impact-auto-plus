/**
 * Composant Vue.js pour le formulaire de rapport de réception d'intervention
 */
const InterventionReceptionReportForm = {
    name: 'InterventionReceptionReportForm',
    
    components: {
        AttachmentGallery: window.AttachmentGallery
    },
    
    data() {
        return {
            isEditMode: false,
            reportId: null,
            loading: false,
            saving: false,
            
            form: {
                interventionId: '',
                receptionDate: '',
                vehicleCondition: '',
                workCompleted: '',
                remainingIssues: '',
                customerSatisfaction: 'good',
                isVehicleReady: true
            },
            
            // Intervention search
            availableInterventions: [],
            selectedIntervention: null,
            showInterventionSearch: false,
            interventionSearchQuery: '',
            interventionSearchTimeout: null,
            
            // Pièces jointes
            attachments: [],
            uploadingFiles: false,
            isDragOver: false
        };
    },
    
    computed: {
        pageTitle() {
            return this.isEditMode ? 'Modifier le Rapport de Réception' : 'Nouveau Rapport de Réception';
        },
        
        isFormValid() {
            return this.form.interventionId && 
                   this.form.receptionDate &&
                   this.form.vehicleCondition &&
                   this.form.workCompleted &&
                   this.form.customerSatisfaction;
        }
    },
    
    async mounted() {
        await this.waitForApiService();
        
        // Récupérer l'ID depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
            this.isEditMode = true;
            this.reportId = parseInt(id);
            await this.loadReport(this.reportId);
        } else {
            // Mode création - initialiser avec la date du jour
            this.form.receptionDate = new Date().toISOString().split('T')[0];
        }
        
        // Charger les interventions disponibles
        await this.loadInterventions();
    },
    
    methods: {
        async waitForApiService() {
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window.apiService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.apiService) {
                console.error('ApiService non disponible après 5 secondes');
                throw new Error('ApiService non disponible');
            }
        },
        
        async loadReport(id) {
            try {
                this.loading = true;
                const response = await window.apiService.request(`/intervention-reception-reports/${id}`);
                
                if (response.success) {
                    const report = response.data;
                    this.form = {
                        interventionId: report.interventionId,
                        receptionDate: report.receptionDate,
                        vehicleCondition: report.vehicleCondition || '',
                        workCompleted: report.workCompleted || '',
                        remainingIssues: report.remainingIssues || '',
                        customerSatisfaction: report.customerSatisfaction || 'good',
                        isVehicleReady: report.isVehicleReady
                    };
                    
                    // Charger l'intervention complète
                    if (report.intervention) {
                        this.selectedIntervention = report.intervention;
                    }
                    
                    // Charger les pièces jointes
                    await this.loadAttachments();
                } else {
                    this.showNotification('Erreur lors du chargement du rapport', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement du rapport:', error);
                this.showNotification('Erreur lors du chargement du rapport', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadInterventions() {
            try {
                const params = new URLSearchParams({
                    search: this.interventionSearchQuery,
                    limit: 50
                });
                
                const response = await window.apiService.request(`/vehicle-interventions?${params.toString()}`);
                
                if (response.success) {
                    this.availableInterventions = response.data || [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
            }
        },
        
        async saveReport() {
            if (!this.isFormValid) {
                this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }
            
            try {
                this.saving = true;
                
                const url = this.isEditMode 
                    ? `/intervention-reception-reports/${this.reportId}`
                    : `/intervention-reception-reports`;
                    
                const method = this.isEditMode ? 'PUT' : 'POST';
                
                const response = await window.apiService.request(url, {
                    method: method,
                    body: JSON.stringify(this.form)
                });
                
                if (response.success) {
                    this.showNotification(
                        this.isEditMode ? 'Rapport modifié avec succès' : 'Rapport créé avec succès',
                        'success'
                    );
                    
                    // Mettre à jour l'ID du rapport si c'est une création
                    if (!this.isEditMode && response.data?.id) {
                        this.reportId = response.data.id;
                        this.isEditMode = true;
                        // Charger les pièces jointes maintenant que l'ID existe
                        await this.loadAttachments();
                    }
                    
                    // Rediriger vers la liste
                    setTimeout(() => {
                        window.location.href = '/intervention-reception-reports.html';
                    }, 1000);
                } else {
                    this.showNotification('Erreur: ' + (response.message || 'Erreur inconnue'), 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde du rapport', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        selectIntervention(intervention) {
            this.selectedIntervention = intervention;
            this.form.interventionId = intervention.id;
            this.showInterventionSearch = false;
        },
        
        toggleInterventionSearch() {
            this.showInterventionSearch = !this.showInterventionSearch;
        },
        
        onInterventionSearch(event) {
            this.interventionSearchQuery = event.target.value;
            clearTimeout(this.interventionSearchTimeout);
            this.interventionSearchTimeout = setTimeout(() => {
                this.loadInterventions();
            }, 300);
        },
        
        goBack() {
            window.location.href = '/intervention-reception-reports.html';
        },
        
        // Méthodes de gestion des pièces jointes
        async loadAttachments() {
            if (!this.isEditMode || !this.reportId) return;
            
            // Vérifier que le service est disponible
            if (!window.fileUploadService) {
                console.warn('FileUploadService non disponible');
                return;
            }
            
            try {
                this.attachments = await window.fileUploadService.getFiles('intervention_reception_report', this.reportId);
            } catch (error) {
                console.error('Erreur lors du chargement des pièces jointes:', error);
            }
        },
        
        async uploadFiles(files) {
            if (!this.reportId) {
                this.showNotification('Veuillez d\'abord sauvegarder le rapport avant d\'ajouter des pièces jointes', 'warning');
                return;
            }
            
            if (!window.fileUploadService) {
                this.showNotification('Service d\'upload non disponible', 'error');
                return;
            }
            
            this.uploadingFiles = true;
            
            try {
                for (const file of files) {
                    await this.uploadFile(file);
                }
                
                this.showNotification('Pièces jointes ajoutées avec succès', 'success');
                await this.loadAttachments();
            } catch (error) {
                console.error('Erreur lors de l\'upload:', error);
                this.showNotification('Erreur lors de l\'ajout des pièces jointes', 'error');
            } finally {
                this.uploadingFiles = false;
            }
        },
        
        async uploadFile(file) {
            try {
                const result = await window.fileUploadService.uploadFile(
                    file, 
                    'intervention_reception_report', 
                    this.reportId
                );
                
                this.showNotification(result.message, 'success');
                await this.loadAttachments();
            } catch (error) {
                console.error('Erreur upload:', error);
                this.showNotification(error.message, 'error');
            }
        },
        
        async deleteAttachment(attachmentId) {
            try {
                const confirmed = await window.confirmDestructive({
                    title: 'Supprimer la pièce jointe',
                    message: 'Êtes-vous sûr de vouloir supprimer cette pièce jointe ?',
                    confirmText: 'Supprimer',
                    cancelText: 'Annuler'
                });
                
                if (!confirmed) return;
                
                await window.fileUploadService.deleteFile(
                    'intervention_reception_report', 
                    this.reportId, 
                    attachmentId
                );
                
                this.showNotification('Pièce jointe supprimée avec succès', 'success');
                await this.loadAttachments();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression de la pièce jointe', 'error');
            }
        },
        
        async downloadAttachment(attachment) {
            try {
                await window.fileUploadService.downloadFile(
                    'intervention_reception_report', 
                    this.reportId, 
                    attachment.id
                );
            } catch (error) {
                console.error('Erreur lors du téléchargement:', error);
                this.showNotification('Erreur lors du téléchargement du fichier', 'error');
            }
        },
        
        // Méthodes pour la gestion des fichiers (drag & drop et sélection)
        openFileDialog() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        
        handleFileSelect(event) {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                this.uploadFiles(files);
            }
        },
        
        handleFileDrop(event) {
            this.isDragOver = false;
            const files = Array.from(event.dataTransfer.files);
            if (files.length > 0) {
                this.uploadFiles(files);
            }
        },

        handleDragOver(event) {
            event.preventDefault();
            this.isDragOver = true;
        },

        handleDragLeave(event) {
            event.preventDefault();
            this.isDragOver = false;
        },
        
        // Méthodes de notification
        showNotification(message, type = 'info') {
            switch (type) {
                case 'success':
                    this.$notifySuccess(message);
                    break;
                case 'error':
                    this.$notifyError(message);
                    break;
                case 'warning':
                    this.$notifyWarning(message);
                    break;
                default:
                    this.$notifyInfo(message);
            }
        },

        $notifySuccess(message, options = {}) {
            if (window.notifySuccess) {
                return window.notifySuccess(message, options);
            } else {
                console.log('[SUCCESS]', message);
            }
        },

        $notifyError(message, options = {}) {
            if (window.notifyError) {
                return window.notifyError(message, options);
            } else {
                console.log('[ERROR]', message);
            }
        },

        $notifyWarning(message, options = {}) {
            if (window.notifyWarning) {
                return window.notifyWarning(message, options);
            } else {
                console.log('[WARNING]', message);
            }
        },

        $notifyInfo(message, options = {}) {
            if (window.notifyInfo) {
                return window.notifyInfo(message, options);
            } else {
                console.log('[INFO]', message);
            }
        }
    },
    
    template: `
        <div class="reception-report-form-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1><i class="fas fa-clipboard-check"></i> {{ pageTitle }}</h1>
                            <p>Créer un rapport de réception pour une intervention</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contenu du formulaire -->
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement...
            </div>
            
            <form v-else @submit.prevent="saveReport" class="reception-report-form">
                <!-- Section Intervention -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-wrench"></i> Intervention</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group full-width">
                            <label for="intervention">Intervention *</label>
                            <div class="searchable-select">
                                <input 
                                    v-if="!selectedIntervention"
                                    type="text" 
                                    placeholder="Rechercher une intervention..."
                                    @focus="toggleInterventionSearch"
                                    @input="onInterventionSearch"
                                    readonly
                                    required
                                >
                                <div v-else class="selected-item">
                                    <span>{{ selectedIntervention.code || selectedIntervention.interventionNumber }} - {{ selectedIntervention.title }}</span>
                                    <button type="button" @click="selectedIntervention = null; form.interventionId = ''" class="clear-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                
                                <div v-if="showInterventionSearch" class="intervention-search-dropdown">
                                    <div class="search-input-container">
                                        <input 
                                            type="text" 
                                            placeholder="Rechercher..."
                                            @input="onInterventionSearch"
                                            class="search-input"
                                        >
                                    </div>
                                    <div class="intervention-results">
                                        <div
                                            v-for="intervention in availableInterventions"
                                            :key="intervention.id"
                                            @click="selectIntervention(intervention)"
                                            class="intervention-result-item"
                                        >
                                            <div class="intervention-code">{{ intervention.code || 'INT-' + intervention.id }}</div>
                                            <div class="intervention-title">{{ intervention.title }}</div>
                                            <div class="intervention-vehicle">
                                                {{ intervention.vehicle?.brand?.name }} {{ intervention.vehicle?.model?.name }} 
                                                ({{ intervention.vehicle?.plateNumber }})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Informations de l'intervention sélectionnée -->
                                <div v-if="selectedIntervention" class="intervention-info">
                                    <div class="info-item">
                                        <span class="label">Véhicule:</span>
                                        <span class="value">{{ selectedIntervention.vehicle?.plateNumber }} - {{ selectedIntervention.vehicle?.brand?.name }} {{ selectedIntervention.vehicle?.model?.name }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">Motif:</span>
                                        <span class="value">{{ selectedIntervention.title }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">Statut:</span>
                                        <span class="value">{{ selectedIntervention.statusLabel }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section Réception -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-calendar-check"></i> Informations de Réception</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reception-date">Date de réception *</label>
                            <input 
                                type="date" 
                                id="reception-date"
                                v-model="form.receptionDate" 
                                required
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="customer-satisfaction">Satisfaction client *</label>
                            <select id="customer-satisfaction" v-model="form.customerSatisfaction" required>
                                <option value="excellent">Excellent</option>
                                <option value="good">Bon</option>
                                <option value="fair">Moyen</option>
                                <option value="poor">Mauvais</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" v-model="form.isVehicleReady">
                            Véhicule prêt à être restitué
                        </label>
                    </div>
                </div>

                <!-- Section Détails -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-clipboard-list"></i> Détails de la Réception</h3>
                    </div>
                    
                    <div class="form-group">
                        <label for="vehicle-condition">État du véhicule *</label>
                        <textarea 
                            id="vehicle-condition"
                            v-model="form.vehicleCondition"
                            rows="4"
                            placeholder="Décrivez l'état général du véhicule à la réception..."
                            required
                        ></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="work-completed">Travaux effectués *</label>
                        <textarea 
                            id="work-completed"
                            v-model="form.workCompleted"
                            rows="4"
                            placeholder="Listez les travaux effectués sur le véhicule..."
                            required
                        ></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="remaining-issues">Problèmes restants</label>
                        <textarea 
                            id="remaining-issues"
                            v-model="form.remainingIssues"
                            rows="3"
                            placeholder="Décrivez les problèmes restants ou observations particulières..."
                        ></textarea>
                    </div>
                </div>

                <!-- Section Pièces jointes -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-paperclip"></i> Pièces jointes</h3>
                    </div>
                    
                    <!-- Zone d'upload -->
                    <div class="upload-area" :class="{ 'drag-over': isDragOver }" 
                         @dragover.prevent="handleDragOver" 
                         @dragleave.prevent="handleDragLeave" 
                         @drop.prevent="handleFileDrop">
                        <input 
                            type="file" 
                            ref="fileInput" 
                            @change="handleFileSelect" 
                            multiple 
                            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                            style="display: none;"
                        >
                        <div class="upload-content">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Glissez-déposez vos fichiers ici ou <button type="button" @click="openFileDialog" class="upload-link">cliquez pour sélectionner</button></p>
                            <small>Formats acceptés : Images, PDF, Word, TXT, ZIP, RAR (max 10MB)</small>
                        </div>
                    </div>
                    
                    <div v-if="uploadingFiles" class="uploading-indicator">
                        <i class="fas fa-spinner fa-spin"></i>
                        Upload en cours...
                    </div>
                    
                    <!-- Galerie des fichiers uploadés (composant réutilisable) -->
                    <AttachmentGallery 
                        :attachments="attachments"
                        :entity-type="'intervention_reception_report'"
                        :entity-id="reportId"
                        :show-actions="true"
                        @download="downloadAttachment"
                        @delete="deleteAttachment"
                    />
                </div>

                <!-- Actions -->
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" @click="goBack" :disabled="saving">
                        <i class="fas fa-times"></i>
                        Annuler
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="!isFormValid || saving">
                        <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-save"></i>
                        {{ isEditMode ? 'Modifier' : 'Créer' }}
                    </button>
                </div>
            </form>
        </div>
    `
};

// Exposer le composant globalement
if (typeof window !== 'undefined') {
    window.InterventionReceptionReportForm = InterventionReceptionReportForm;
}
