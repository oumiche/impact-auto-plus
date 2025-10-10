/**
 * Composant Vue.js pour la visualisation d'un rapport de réception
 */
window.InterventionReceptionReportViewApp = {
    data() {
        return {
            loading: false,
            report: null,
            reportId: null
        }
    },
    
    async mounted() {
        await this.waitForApiService();
        this.loadReport();
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
        
        async loadReport() {
            try {
                this.loading = true;
                
                const urlParams = new URLSearchParams(window.location.search);
                this.reportId = urlParams.get('id');
                
                if (!this.reportId) {
                    this.showNotification('ID de rapport manquant', 'error');
                    this.goBack();
                    return;
                }
                
                const response = await window.apiService.request(`/intervention-reception-reports/${this.reportId}`);
                
                if (response.success) {
                    this.report = response.data;
                } else {
                    this.showNotification(response.message || 'Erreur lors du chargement du rapport', 'error');
                    this.goBack();
                }
            } catch (error) {
                console.error('Error loading reception report:', error);
                this.showNotification('Erreur lors du chargement du rapport', 'error');
                this.goBack();
            } finally {
                this.loading = false;
            }
        },
        
        async deleteReport() {
            if (!this.report) return;
            
            const confirmed = await window.confirmDestructive({
                title: 'Supprimer le rapport',
                message: `Supprimer le rapport de réception ${this.report.receptionNumber || this.report.code || 'RR-' + this.reportId} ?`,
                confirmText: 'Supprimer',
                cancelText: 'Annuler'
            });
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${this.reportId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('Rapport supprimé avec succès', 'success');
                    setTimeout(() => this.goBack(), 1000);
                } else {
                    this.showNotification(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting report:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },
        
        async generatePdf() {
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${this.reportId}/pdf`);
                
                if (response.success) {
                    this.showNotification('Génération de PDF à implémenter', 'info');
                } else {
                    this.showNotification(response.message || 'Erreur lors de la génération du PDF', 'error');
                }
            } catch (error) {
                console.error('Error generating PDF:', error);
                this.showNotification('Erreur lors de la génération du PDF', 'error');
            }
        },
        
        goBack() {
            window.location.href = '/intervention-reception-reports.html';
        },
        
        goToEdit() {
            window.location.href = `/intervention-reception-report-edit.html?id=${this.reportId}`;
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        getSatisfactionClass(satisfaction) {
            const classes = {
                'excellent': 'satisfaction-excellent',
                'good': 'satisfaction-good',
                'fair': 'satisfaction-fair',
                'poor': 'satisfaction-poor'
            };
            return classes[satisfaction] || '';
        },
        
        getSatisfactionIcon(satisfaction) {
            const icons = {
                'excellent': 'fas fa-star',
                'good': 'fas fa-smile',
                'fair': 'fas fa-meh',
                'poor': 'fas fa-frown'
            };
            return icons[satisfaction] || 'fas fa-question';
        },
        
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
        <div class="reception-report-view-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1><i class="fas fa-clipboard-check"></i> Détails du Rapport de Réception</h1>
                            <p v-if="report">{{ report.receptionNumber || report.code || 'RR-' + reportId }}</p>
                        </div>
                    </div>
                    <div v-if="report" class="header-right">
                        <button class="btn btn-outline" @click="generatePdf">
                            <i class="fas fa-file-pdf"></i>
                            PDF
                        </button>
                        <button class="btn btn-primary" @click="goToEdit">
                            <i class="fas fa-edit"></i>
                            Modifier
                        </button>
                        <button class="btn btn-danger" @click="deleteReport">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>

            <!-- Contenu du rapport -->
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement...
            </div>
            
            <div v-else-if="report" class="report-content">
                <!-- Section Intervention -->
                <div class="info-section">
                    <div class="section-header">
                        <h2><i class="fas fa-wrench"></i> Intervention</h2>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Code:</span>
                            <span class="value">{{ report.intervention?.code || report.intervention?.interventionNumber }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Titre:</span>
                            <span class="value">{{ report.intervention?.title }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Véhicule:</span>
                            <span class="value">
                                {{ report.intervention?.vehicle?.plateNumber }} - 
                                {{ report.intervention?.vehicle?.brand?.name }} 
                                {{ report.intervention?.vehicle?.model?.name }}
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="label">Statut intervention:</span>
                            <span class="value">
                                <span class="status-badge" :class="'status-' + report.intervention?.currentStatus">
                                    {{ report.intervention?.statusLabel }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Section Réception -->
                <div class="info-section">
                    <div class="section-header">
                        <h2><i class="fas fa-calendar-check"></i> Informations de Réception</h2>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Date de réception:</span>
                            <span class="value">{{ formatDate(report.receptionDate) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Satisfaction client:</span>
                            <span class="value">
                                <span class="satisfaction-badge" :class="getSatisfactionClass(report.customerSatisfaction)">
                                    <i :class="getSatisfactionIcon(report.customerSatisfaction)"></i>
                                    {{ report.satisfactionLabel }}
                                </span>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="label">Véhicule prêt:</span>
                            <span class="value">
                                <span v-if="report.isVehicleReady" class="badge-success">
                                    <i class="fas fa-check-circle"></i> Oui
                                </span>
                                <span v-else class="badge-warning">
                                    <i class="fas fa-exclamation-circle"></i> Non
                                </span>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="label">Suivi requis:</span>
                            <span class="value">
                                <span v-if="report.requiresFollowUp" class="badge-danger">
                                    <i class="fas fa-flag"></i> Oui
                                </span>
                                <span v-else class="badge-info">
                                    <i class="fas fa-check"></i> Non
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Section Détails -->
                <div class="info-section">
                    <div class="section-header">
                        <h2><i class="fas fa-clipboard-list"></i> Détails de la Réception</h2>
                    </div>
                    
                    <div class="detail-block">
                        <h3>État du véhicule</h3>
                        <p class="detail-content">{{ report.vehicleCondition || 'Non renseigné' }}</p>
                    </div>
                    
                    <div class="detail-block">
                        <h3>Travaux effectués</h3>
                        <p class="detail-content">{{ report.workCompleted || 'Non renseigné' }}</p>
                    </div>
                    
                    <div v-if="report.remainingIssues" class="detail-block alert">
                        <h3><i class="fas fa-exclamation-triangle"></i> Problèmes restants</h3>
                        <p class="detail-content">{{ report.remainingIssues }}</p>
                    </div>
                </div>

                <!-- Section Métadonnées -->
                <div class="info-section">
                    <div class="section-header">
                        <h2><i class="fas fa-info-circle"></i> Informations du Rapport</h2>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Numéro de réception:</span>
                            <span class="value"><code>{{ report.receptionNumber || report.code || 'N/A' }}</code></span>
                        </div>
                        <div class="info-item">
                            <span class="label">Date de création:</span>
                            <span class="value">{{ formatDate(report.createdAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
