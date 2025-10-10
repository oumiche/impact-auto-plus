/**
 * Composant Vue.js pour gérer le workflow des interventions
 */
const WorkflowManager = {
    name: 'WorkflowManager',
    
    props: {
        intervention: {
            type: Object,
            required: true
        },
        readonly: {
            type: Boolean,
            default: false
        }
    },
    
    data() {
        return {
            workflowStatus: null,
            loading: false,
            showWorkflowModal: false
        };
    },
    
    computed: {
        currentStatus() {
            return this.workflowStatus?.currentStatus || this.intervention.currentStatus;
        },
        
        statusLabel() {
            return this.workflowStatus?.statusLabel || this.intervention.statusLabel;
        },
        
        workflowProgress() {
            return this.workflowStatus?.workflowProgress || 0;
        },
        
        workflowStage() {
            return this.workflowStatus?.workflowStage || 'inconnu';
        },
        
        validTransitions() {
            return this.workflowStatus?.validTransitions || [];
        },
        
        allStatuses() {
            return this.workflowStatus?.allStatuses || {};
        },
        
        isCompleted() {
            return this.workflowStatus?.isCompleted || false;
        },
        
        isCancelled() {
            return this.workflowStatus?.isCancelled || false;
        },
        
        isInProgress() {
            return this.workflowStatus?.isInProgress || false;
        },
        
        daysInCurrentStatus() {
            return this.workflowStatus?.daysInCurrentStatus || 0;
        },
        
        estimatedCompletionDate() {
            return this.workflowStatus?.estimatedCompletionDate;
        },
        
        statusClass() {
            return `status-badge status-${this.currentStatus.replace(/_/g, '-')}`;
        },
        
        progressBarStyle() {
            return {
                width: `${this.workflowProgress}%`
            };
        },
        
        nextActions() {
            const actions = [];
            
            switch (this.currentStatus) {
                case 'reported':
                    actions.push({
                        label: 'Démarrer le prédiagnostic',
                        action: 'startPrediagnostic',
                        icon: 'fas fa-play',
                        class: 'btn-primary'
                    });
                    break;
                    
                case 'in_prediagnostic':
                    actions.push({
                        label: 'Terminer le prédiagnostic',
                        action: 'completePrediagnostic',
                        icon: 'fas fa-check',
                        class: 'btn-success'
                    });
                    break;
                    
                case 'prediagnostic_completed':
                    actions.push({
                        label: 'Créer un devis',
                        action: 'startQuote',
                        icon: 'fas fa-file-invoice-dollar',
                        class: 'btn-info'
                    });
                    break;
                    
                case 'in_quote':
                    actions.push({
                        label: 'Devis reçu',
                        action: 'receiveQuote',
                        icon: 'fas fa-envelope',
                        class: 'btn-info'
                    });
                    break;
                    
                case 'quote_received':
                    actions.push({
                        label: 'Demander l\'approbation',
                        action: 'startApproval',
                        icon: 'fas fa-hand-paper',
                        class: 'btn-warning'
                    });
                    break;
                    
                case 'in_approval':
                    actions.push({
                        label: 'Approuver le devis',
                        action: 'approveQuote',
                        icon: 'fas fa-thumbs-up',
                        class: 'btn-success'
                    });
                    break;
                    
                case 'approved':
                    actions.push({
                        label: 'Démarrer la réparation',
                        action: 'startRepair',
                        icon: 'fas fa-tools',
                        class: 'btn-primary'
                    });
                    break;
                    
                case 'in_repair':
                    actions.push({
                        label: 'Terminer la réparation',
                        action: 'completeRepair',
                        icon: 'fas fa-check-circle',
                        class: 'btn-success'
                    });
                    break;
                    
                case 'repair_completed':
                    actions.push({
                        label: 'Démarrer la réception',
                        action: 'startReception',
                        icon: 'fas fa-car',
                        class: 'btn-info'
                    });
                    break;
                    
                case 'in_reception':
                    actions.push({
                        label: 'Véhicule reçu',
                        action: 'receiveVehicle',
                        icon: 'fas fa-check-double',
                        class: 'btn-success'
                    });
                    break;
            }
            
            // Ajouter l'action d'annulation si pas terminé
            if (!this.isCompleted && !this.isCancelled) {
                actions.push({
                    label: 'Annuler',
                    action: 'cancel',
                    icon: 'fas fa-times',
                    class: 'btn-danger'
                });
            }
            
            return actions;
        }
    },
    
    async mounted() {
        // Vérifier que les services requis sont disponibles
        this.checkRequiredServices();
        await this.loadWorkflowStatus();
    },
    
    template: `
        <div class="workflow-manager">
            <!-- Affichage du statut actuel -->
            <div class="workflow-status">
                <div class="status-info">
                    <span :class="statusClass">{{ statusLabel }}</span>
                    <span class="workflow-stage">{{ workflowStage }}</span>
                </div>
                
                <!-- Barre de progression -->
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" :style="progressBarStyle"></div>
                    </div>
                    <span class="progress-text">{{ workflowProgress }}%</span>
                </div>
                
                <!-- Informations supplémentaires -->
                <div class="workflow-info">
                    <small v-if="daysInCurrentStatus > 0">
                        <i class="fas fa-clock"></i>
                        {{ daysInCurrentStatus }} jour(s) dans ce statut
                    </small>
                    <small v-if="estimatedCompletionDate">
                        <i class="fas fa-calendar"></i>
                        Fin estimée: {{ formatDate(estimatedCompletionDate) }}
                    </small>
                </div>
            </div>
            
            <!-- Actions disponibles -->
            <div v-if="!readonly && nextActions.length > 0" class="workflow-actions">
                <button 
                    v-for="action in nextActions" 
                    :key="action.action"
                    :class="['btn', 'btn-sm', action.class]"
                    @click="executeAction(action.action)"
                    :disabled="loading"
                >
                    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                    <i v-else :class="action.icon"></i>
                    {{ action.label }}
                </button>
                
                <button 
                    class="btn btn-outline btn-sm" 
                    @click="showWorkflowDetails"
                    title="Voir les détails du workflow"
                >
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
            
            <!-- Modal des détails du workflow -->
            <div v-if="showWorkflowModal" class="workflow-modal-overlay" @click="closeWorkflowModal">
                <div class="workflow-modal" @click.stop>
                    <div class="modal-header">
                        <h3>Détails du Workflow</h3>
                        <button class="modal-close" @click="closeWorkflowModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-content">
                        <div class="workflow-details">
                            <div class="detail-row">
                                <label>Statut actuel:</label>
                                <span :class="statusClass">{{ statusLabel }}</span>
                            </div>
                            
                            <div class="detail-row">
                                <label>Progression:</label>
                                <span>{{ workflowProgress }}%</span>
                            </div>
                            
                            <div class="detail-row">
                                <label>Étape:</label>
                                <span>{{ workflowStage }}</span>
                            </div>
                            
                            <div class="detail-row">
                                <label>Dans ce statut depuis:</label>
                                <span>{{ daysInCurrentStatus }} jour(s)</span>
                            </div>
                            
                            <div v-if="estimatedCompletionDate" class="detail-row">
                                <label>Fin estimée:</label>
                                <span>{{ formatDate(estimatedCompletionDate) }}</span>
                            </div>
                            
                            <div v-if="validTransitions.length > 0" class="detail-row">
                                <label>Transitions possibles:</label>
                                <div class="valid-transitions">
                                    <span 
                                        v-for="status in validTransitions" 
                                        :key="status"
                                        class="transition-status"
                                    >
                                        {{ allStatuses[status] || status }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="workflow-timeline">
                            <h4>Étapes du workflow:</h4>
                            <div class="timeline">
                                <div 
                                    v-for="(label, status) in allStatuses" 
                                    :key="status"
                                    :class="['timeline-step', { 
                                        'active': status === currentStatus,
                                        'completed': workflowProgress > this.getProgressForStatus(status),
                                        'disabled': status !== currentStatus && !validTransitions.includes(status)
                                    }]"
                                >
                                    <div class="step-indicator"></div>
                                    <div class="step-label">{{ label }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    methods: {
        checkRequiredServices() {
            const requiredServices = [
                { name: 'apiService', obj: window.apiService },
                { name: 'notificationService', obj: window.notificationService }
            ];
            
            const missingServices = requiredServices.filter(service => !service.obj);
            
            if (missingServices.length > 0) {
                console.warn('WorkflowManager: Services manquants:', missingServices.map(s => s.name));
                console.warn('WorkflowManager: Certaines fonctionnalités peuvent ne pas fonctionner correctement');
            } else {
                console.log('WorkflowManager: Tous les services requis sont disponibles');
            }
        },
        
        async loadWorkflowStatus() {
            if (!this.intervention.id) return;
            
            this.loading = true;
            try {
                const response = await window.apiService.request(`/vehicle-interventions/${this.intervention.id}/workflow/status`);
                if (response.success) {
                    this.workflowStatus = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement du statut workflow:', error);
            } finally {
                this.loading = false;
            }
        },
        
        async executeAction(actionName) {
            if (this.readonly) return;
            
            const action = this.nextActions.find(a => a.action === actionName);
            if (!action) return;
            
            // Vérifier que le service de notification est disponible
            let confirmed = false;
            if (!window.notificationService || typeof window.notificationService.confirm !== 'function') {
                console.error('NotificationService not available');
                confirmed = confirm(`Êtes-vous sûr de vouloir "${action.label.toLowerCase()}" ?`);
            } else {
                confirmed = await window.notificationService.confirm(
                    `Êtes-vous sûr de vouloir "${action.label.toLowerCase()}" ?`,
                    'Confirmer l\'action',
                    action.class.replace('btn-', '')
                );
            }
            
            if (!confirmed) return;
            
            this.loading = true;
            try {
                let response;
                
                switch (actionName) {
                    case 'startPrediagnostic':
                        response = await window.apiService.request(`/vehicle-interventions/${this.intervention.id}/workflow/prediagnostic/start`, {
                            method: 'POST'
                        });
                        break;
                        
                    case 'completePrediagnostic':
                        response = await window.apiService.request(`/vehicle-interventions/${this.intervention.id}/workflow/prediagnostic/complete`, {
                            method: 'POST'
                        });
                        break;
                        
                    case 'startQuote':
                        response = await window.apiService.request(`/vehicle-interventions/${this.intervention.id}/workflow/quote/start`, {
                            method: 'POST'
                        });
                        break;
                        
                    case 'approveQuote':
                        response = await window.apiService.request(`/vehicle-interventions/${this.intervention.id}/workflow/approve`, {
                            method: 'POST'
                        });
                        break;
                        
                    case 'cancel':
                        response = await window.apiService.request(`/vehicle-interventions/${this.intervention.id}/workflow/cancel`, {
                            method: 'POST'
                        });
                        break;
                        
                    default:
                        // Pour les autres actions, utiliser la transition générique
                        response = await window.apiService.request(`/vehicle-interventions/${this.intervention.id}/workflow/transition`, {
                            method: 'POST',
                            body: JSON.stringify({
                                newStatus: this.getStatusFromAction(actionName)
                            })
                        });
                }
                
                if (response.success) {
                    this.showNotification('Action exécutée avec succès', 'success');
                    await this.loadWorkflowStatus();
                    this.$emit('workflow-updated', response.data);
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'exécution de l\'action:', error);
                this.showNotification('Erreur lors de l\'exécution de l\'action', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        getStatusFromAction(actionName) {
            const statusMap = {
                'receiveQuote': 'quote_received',
                'startApproval': 'in_approval',
                'startRepair': 'in_repair',
                'completeRepair': 'repair_completed',
                'startReception': 'in_reception',
                'receiveVehicle': 'vehicle_received'
            };
            
            return statusMap[actionName] || this.currentStatus;
        },
        
        showWorkflowDetails() {
            this.showWorkflowModal = true;
        },
        
        closeWorkflowModal() {
            this.showWorkflowModal = false;
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        showNotification(message, type = 'info') {
            if (window.notificationService) {
                window.notificationService.show(message, type);
            } else {
                alert(message);
            }
        },
        
        getProgressForStatus(status) {
            const statusOrder = {
                'reported': 0,
                'in_prediagnostic': 8,
                'prediagnostic_completed': 16,
                'in_quote': 25,
                'quote_received': 33,
                'in_approval': 41,
                'approved': 50,
                'in_repair': 60,
                'repair_completed': 70,
                'in_reception': 80,
                'vehicle_received': 90,
                'invoiced': 100,
                'cancelled': 0
            };
            
            return statusOrder[status] || 0;
        }
    }
};

// Rendre le composant globalement disponible
window.WorkflowManager = WorkflowManager;
