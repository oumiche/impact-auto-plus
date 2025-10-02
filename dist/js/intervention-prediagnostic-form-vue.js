const InterventionPrediagnosticForm = {
    props: {
        mode: {
            type: String,
            default: 'create', // 'create' ou 'edit'
            validator: value => ['create', 'edit'].includes(value)
        },
        prediagnosticId: {
            type: [String, Number],
            default: null
        }
    },
    
    template: `
        <div class="prediagnostic-form-container">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-outline" @click="goBack" title="Retour">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="header-text">
                            <h1 class="section-title">
                                {{ isEditMode ? 'Modifier le Prédiagnostic' : 'Nouveau Prédiagnostic' }}
                            </h1>
                            <p class="page-subtitle">
                                {{ isEditMode ? 'Modifiez les informations du prédiagnostic' : 'Créez un nouveau prédiagnostic d\\'intervention' }}
                            </p>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="form-actions">
                            <button class="btn btn-outline" @click="goBack">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Form Content -->
            <div class="form-container">
                <form @submit.prevent="savePrediagnostic" class="prediagnostic-form">
                    <!-- Section Intervention -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3><i class="fas fa-wrench"></i> Informations sur l'Intervention</h3>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group full-width">
                                <label for="intervention-search">Intervention *</label>
                                <div class="intervention-search-container">
                                    <input 
                                        type="text" 
                                        id="intervention-search"
                                        :value="selectedIntervention ? selectedIntervention.displayText : ''"
                                        placeholder="Rechercher une intervention..."
                                        @click="toggleInterventionSearch"
                                        @input="onInterventionSearch"
                                        readonly
                                        required
                                        class="intervention-search-input"
                                    >
                                    <button 
                                        type="button" 
                                        @click="toggleInterventionSearch"
                                        class="intervention-search-toggle"
                                        :class="{ 'active': showInterventionSearch }"
                                    >
                                        <i class="fas fa-search"></i>
                                    </button>
                                    
                                    <div v-if="showInterventionSearch" class="intervention-search-dropdown">
                                        <div class="search-input-container">
                                            <input 
                                                type="text" 
                                                placeholder="Tapez pour rechercher..."
                                                @input="onInterventionSearch"
                                                class="search-input"
                                                ref="searchInput"
                                            >
                                        </div>
                                        <div class="intervention-results">
                                            <div v-if="loading" class="loading-message">
                                                <i class="fas fa-spinner fa-spin"></i> Chargement...
                                            </div>
                                            <div v-else-if="availableInterventions.length === 0" class="no-results">
                                                Aucune intervention trouvée
                                            </div>
                                            <div 
                                                v-else
                                                v-for="intervention in availableInterventions" 
                                                :key="intervention.id"
                                                @click="selectIntervention(intervention)"
                                                class="intervention-result-item"
                                            >
                                                <div class="intervention-code">{{ intervention.code || 'INT-' + intervention.id }}</div>
                                                <div class="intervention-title">{{ intervention.title }}</div>
                                                <div class="intervention-vehicle">
                                                    {{ intervention.vehicle.brand }} {{ intervention.vehicle.model }} 
                                                    ({{ intervention.vehicle.plateNumber }})
                                                </div>
                                                <div class="intervention-status">
                                                    <span class="status-badge" :class="'status-' + intervention.currentStatus">
                                                        {{ intervention.statusLabel }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="selectedIntervention" class="intervention-info">
                                    <div class="info-item">
                                        <span class="label">Véhicule:</span>
                                        <span class="value">{{ selectedIntervention.vehicle.plateNumber }} - {{ selectedIntervention.vehicle.brand }} {{ selectedIntervention.vehicle.model }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">Motif:</span>
                                        <span class="value">{{ selectedIntervention.title }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="prediagnostic-date">Date du prédiagnostic</label>
                                <input 
                                    type="datetime-local" 
                                    id="prediagnostic-date"
                                    v-model="form.prediagnosticDate" 
                                    class="form-control"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Section Personnel -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3><i class="fas fa-users"></i> Personnel</h3>
                        </div>
                        
                        <div class="form-group expert-full-width">
                            <label for="expert-id">Expert</label>
                            <div class="collaborator-search-container" :class="{ 'active': showCollaboratorSearch }">
                                    <div class="collaborator-search-input" @click="toggleCollaboratorSearch">
                                        <input 
                                            type="text" 
                                            :value="selectedCollaborator ? selectedCollaborator.firstName + ' ' + selectedCollaborator.lastName : ''"
                                            placeholder="Rechercher un expert..."
                                            readonly
                                        >
                                        <i class="fas fa-search"></i>
                                        <button v-if="form.expertId" type="button" class="clear-btn" @click.stop="clearCollaborator">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    
                                    <div v-if="showCollaboratorSearch" class="collaborator-search-dropdown">
                                        <div class="search-input-container">
                                            <input 
                                                ref="collaboratorSearchInput"
                                                type="text" 
                                                v-model="collaboratorSearchQuery"
                                                @input="onCollaboratorSearch"
                                                placeholder="Tapez pour rechercher..."
                                                class="search-input"
                                            >
                                            <i class="fas fa-search"></i>
                                        </div>
                                        
                                        <div v-if="loadingCollaborators" class="loading-message">
                                            <i class="fas fa-spinner fa-spin"></i>
                                            Chargement...
                                        </div>
                                        
                                        <div v-else-if="filteredCollaborators.length === 0" class="no-results">
                                            <i class="fas fa-search"></i>
                                            Aucun collaborateur trouvé
                                        </div>
                                        
                                        <div v-else class="collaborator-results">
                                            <div 
                                                v-for="collaborator in filteredCollaborators" 
                                                :key="collaborator.id"
                                                class="collaborator-result-item"
                                                :class="{ 'selected': form.expertId === collaborator.id }"
                                                @click="selectCollaborator(collaborator)"
                                            >
                                                <div class="collaborator-info">
                                                    <div class="collaborator-name">
                                                        {{ collaborator.firstName }} {{ collaborator.lastName }}
                                                    </div>
                                                    <div class="collaborator-details">
                                                        <span v-if="collaborator.position" class="collaborator-position">
                                                            {{ collaborator.position }}
                                                        </span>
                                                        <span v-if="collaborator.department" class="collaborator-department">
                                                            - {{ collaborator.department }}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div v-if="form.expertId === collaborator.id" class="selected-indicator">
                                                    <i class="fas fa-check"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </div>



                    <!-- Section Opérations -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3><i class="fas fa-list"></i> Opérations à Effectuer</h3>
                            <button type="button" class="btn btn-sm btn-primary" @click="addItem">
                                <i class="fas fa-plus"></i> Ajouter une opération
                            </button>
                        </div>
                        
                        <div v-if="form.items.length === 0" class="no-items">
                            <p>Aucune opération définie. Cliquez sur "Ajouter une opération" pour commencer.</p>
                        </div>
                        
                        <div v-else class="items-list">
                            <div 
                                v-for="(item, index) in form.items" 
                                :key="item.tempId || index" 
                                class="item-card"
                                :class="{ 'is-dragging': item.isDragging }"
                            >
                                <div class="item-header">
                                    <div class="item-order">
                                        <span class="order-number">{{ index + 1 }}</span>
                                        <button 
                                            type="button" 
                                            class="btn-drag" 
                                            @mousedown="startDrag(index, $event)"
                                            title="Réorganiser"
                                        >
                                            <i class="fas fa-grip-vertical"></i>
                                        </button>
                                    </div>
                                    <button 
                                        type="button" 
                                        class="btn btn-sm btn-danger" 
                                        @click="removeItem(index)"
                                        title="Supprimer cette opération"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                
                                <div class="item-content">
                                    <div class="form-group full-width">
                                        <label :for="'operation-label-' + index">Libellé de l'opération *</label>
                                        <input 
                                            type="text" 
                                            :id="'operation-label-' + index"
                                            v-model="item.operationLabel"
                                            placeholder="Ex: Remplacement du filtre à air"
                                            required
                                        >
                                    </div>
                                    
                                    <div class="operation-types">
                                        <label class="section-label">Type d'opération :</label>
                                        <div class="type-checkboxes">
                                            <label class="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    v-model="item.isExchange"
                                                >
                                                <span class="checkmark"></span>
                                                <i class="fas fa-exchange-alt"></i>
                                                Échange
                                            </label>
                                            
                                            <label class="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    v-model="item.isControl"
                                                >
                                                <span class="checkmark"></span>
                                                <i class="fas fa-search"></i>
                                                Contrôle
                                            </label>
                                            
                                            <label class="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    v-model="item.isRepair"
                                                >
                                                <span class="checkmark"></span>
                                                <i class="fas fa-wrench"></i>
                                                Réparation
                                            </label>
                                            
                                            <label class="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    v-model="item.isPainting"
                                                >
                                                <span class="checkmark"></span>
                                                <i class="fas fa-paint-brush"></i>
                                                Peinture
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section Signatures -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3><i class="fas fa-signature"></i> Signatures</h3>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="signature-expert">Signature Expert</label>
                            <textarea 
                                id="signature-expert"
                                v-model="form.signatureExpert"
                                placeholder="Signature de l'expert..."
                                rows="2"
                            ></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="signature-repairer">Signature Réparateur</label>
                                <textarea 
                                    id="signature-repairer"
                                    v-model="form.signatureRepairer"
                                    placeholder="Signature du réparateur..."
                                    rows="2"
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="signature-insured">Signature Assuré</label>
                                <textarea 
                                    id="signature-insured"
                                    v-model="form.signatureInsured"
                                    placeholder="Signature de l'assuré..."
                                    rows="2"
                                ></textarea>
                            </div>
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
                             @drop.prevent="handleDrop">
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
                                <p>Glissez-déposez vos fichiers ici ou <button type="button" @click="$refs.fileInput.click()" class="upload-link">cliquez pour sélectionner</button></p>
                                <small>Formats acceptés : Images, PDF, Word, TXT, ZIP, RAR (max 10MB)</small>
                            </div>
                        </div>
                        
                    <!-- Galerie des fichiers uploadés (composant réutilisable) -->
                    <AttachmentGallery 
                        :attachments="attachments"
                        :entity-type="'intervention_prediagnostic'"
                        :entity-id="form.id"
                        :show-actions="true"
                        @download="downloadAttachment"
                        @delete="deleteAttachment"
                    />
                    </div>
                    
                    <!-- Actions du formulaire -->
                    <div class="form-actions-bottom">
                        <div class="form-actions">
                            <button class="btn btn-outline" @click="goBack">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                            <button 
                                class="btn btn-primary" 
                                @click="savePrediagnostic" 
                                :disabled="saving || !isFormValid"
                            >
                                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                <i v-else class="fas fa-save"></i>
                                {{ isEditMode ? 'Modifier' : 'Créer' }}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Notifications -->
        <div id="notifications"></div>
    `,
    
    data() {
        return {
            form: {
                id: null,
                interventionId: '',
                prediagnosticDate: '',
                expertId: null,
                signatureExpert: '',
                signatureRepairer: '',
                signatureInsured: '',
                items: []
            },
            availableInterventions: [],
            selectedIntervention: null,
            showInterventionSearch: false,
            searchTimeout: null,
            collaborators: [],
            filteredCollaborators: [],
            showCollaboratorSearch: false,
            collaboratorSearchQuery: '',
            loadingCollaborators: false,
            collaboratorSearchTimeout: null,
            selectedCollaborator: null,
            saving: false,
            loading: false,
            attachments: [],
            isDragOver: false,
            uploadingFiles: false
        };
    },
    
    components: {
        AttachmentGallery: window.AttachmentGallery
    },
    
    computed: {
        isEditMode() {
            return this.mode === 'edit';
        },
        
        isFormValid() {
            const hasBasicInfo = this.form.interventionId;
            
            // Vérifier que tous les items ont un libellé
            const validItems = this.form.items.every(item => 
                item.operationLabel && item.operationLabel.trim().length > 0
            );
            
            return hasBasicInfo && validItems;
        }
    },
    
    async mounted() {
        await this.loadInterventions();
        await this.loadCollaborators();
        
        if (this.isEditMode && this.prediagnosticId) {
            await this.loadPrediagnostic();
        } else {
            // Définir la date actuelle par défaut
            this.form.prediagnosticDate = this.formatDateForInput(new Date());
        }
        
        // Gestionnaire pour fermer le dropdown en cliquant en dehors
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.intervention-search-container')) {
                this.closeInterventionSearch();
            }
            if (!event.target.closest('.collaborator-search-container')) {
                this.closeCollaboratorSearch();
            }
        });
    },
    
    methods: {
        async loadInterventions(search = '') {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                params.append('limit', '20');
                if (search) {
                    params.append('search', search);
                }
                
                // Utiliser la route principale qui fonctionne
                const response = await window.apiService.request(`/vehicle-interventions?${params.toString()}`);
                if (response.success && response.data) {
                    // L'API retourne directement les données dans response.data
                    const interventions = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    // Ajouter le displayText pour chaque intervention
                    this.availableInterventions = interventions.map(intervention => ({
                        ...intervention,
                        displayText: `${intervention.code || 'INT-' + intervention.id} - ${intervention.vehicle.brand || ''} ${intervention.vehicle.model || ''} (${intervention.vehicle.plateNumber}) - ${intervention.title}`,
                        statusLabel: this.getStatusLabel(intervention.currentStatus)
                    }));
                } else {
                    this.availableInterventions = [];
                    console.error('Erreur dans la réponse API:', response);
                    console.error('response.success:', response.success);
                    console.error('response.data:', response.data);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
                this.showNotification('Erreur lors du chargement des interventions', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadPrediagnostic() {
            if (!this.prediagnosticId) return;
            
            this.loading = true;
            try {
                const response = await window.apiService.request(`/intervention-prediagnostics/${this.prediagnosticId}`);
                if (response.success) {
                    const prediagnostic = response.data;
                    this.form = {
                        id: prediagnostic.id,
                        interventionId: prediagnostic.interventionId,
                        prediagnosticDate: prediagnostic.prediagnosticDate ? 
                            this.formatDateForInput(new Date(prediagnostic.prediagnosticDate)) : '',
                        expertId: prediagnostic.expertId || null,
                        signatureExpert: prediagnostic.signatureExpert || '',
                        signatureRepairer: prediagnostic.signatureRepairer || '',
                        signatureInsured: prediagnostic.signatureInsured || '',
                        items: prediagnostic.items || []
                    };
                    
                    // Formater les items pour s'assurer qu'ils ont la bonne structure
                    if (prediagnostic.items && prediagnostic.items.length > 0) {
                        this.form.items = prediagnostic.items.map(item => ({
                            tempId: item.id || Date.now() + Math.random(),
                            operationLabel: item.operationLabel || '',
                            isExchange: item.isExchange || false,
                            isControl: item.isControl || false,
                            isRepair: item.isRepair || false,
                            isPainting: item.isPainting || false,
                            orderIndex: item.orderIndex || 1
                        }));
                    }
                    
                    
                    // Charger l'intervention sélectionnée
                    if (prediagnostic.interventionId) {
                        const intervention = this.availableInterventions.find(int => int.id === prediagnostic.interventionId);
                        if (intervention) {
                            this.selectedIntervention = intervention;
                        } else {
                            // Si l'intervention n'est pas dans la liste, la récupérer séparément
                            await this.loadInterventions();
                            const intervention = this.availableInterventions.find(int => int.id === prediagnostic.interventionId);
                            if (intervention) {
                                this.selectedIntervention = intervention;
                            }
                        }
                    }
                    
                    // Charger le collaborateur sélectionné
                    if (prediagnostic.expertId) {
                        const collaborator = this.collaborators.find(coll => coll.id === prediagnostic.expertId);
                        if (collaborator) {
                            this.selectedCollaborator = collaborator;
                        } else {
                            // Si le collaborateur n'est pas dans la liste, le récupérer séparément
                            await this.loadCollaborators();
                            const collaborator = this.collaborators.find(coll => coll.id === prediagnostic.expertId);
                            if (collaborator) {
                                this.selectedCollaborator = collaborator;
                            }
                        }
                    }
                } else {
                    this.showNotification('Erreur lors du chargement du prédiagnostic', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                this.showNotification('Erreur lors du chargement du prédiagnostic', 'error');
            } finally {
                this.loading = false;
            }
            
            // Charger les pièces jointes en mode édition
            if (this.isEditMode) {
                await this.loadAttachments();
            }
        },
        
        
        onInterventionChange() {
            // Cette méthode est maintenant gérée par selectIntervention
            if (this.form.interventionId && this.selectedIntervention) {
                // L'intervention est déjà sélectionnée via selectIntervention
                return;
            }
            this.selectedIntervention = null;
        },
        
        async savePrediagnostic() {
            if (!this.isFormValid) {
                this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }
            
            this.saving = true;
            try {
                const prediagnosticData = {
                    interventionId: this.form.interventionId,
                    prediagnosticDate: this.form.prediagnosticDate || null,
                    expertId: this.form.expertId || null,
                    signatureExpert: this.form.signatureExpert || null,
                    signatureRepairer: this.form.signatureRepairer || null,
                    signatureInsured: this.form.signatureInsured || null,
                    items: this.form.items.map((item, index) => ({
                        operationLabel: item.operationLabel,
                        isExchange: item.isExchange,
                        isControl: item.isControl,
                        isRepair: item.isRepair,
                        isPainting: item.isPainting,
                        orderIndex: index + 1
                    }))
                };
                
                console.log('Données à envoyer:', prediagnosticData);
                console.log('Items à envoyer:', prediagnosticData.items);
                
                let response;
                if (this.isEditMode) {
                    response = await window.apiService.request(`/intervention-prediagnostics/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(prediagnosticData)
                    });
                } else {
                    response = await window.apiService.request('/intervention-prediagnostics', {
                        method: 'POST',
                        body: JSON.stringify(prediagnosticData)
                    });
                }
                
                if (response.success) {
                    this.showNotification(
                        this.isEditMode ? 'Prédiagnostic modifié avec succès' : 'Prédiagnostic créé avec succès', 
                        'success'
                    );
                    
                    // Rediriger en mode création vers la page d'édition
                    if (!this.isEditMode && response.data && response.data.id) {
                        setTimeout(() => {
                            window.location.href = `/intervention-prediagnostic-edit.html?id=${response.data.id}`;
                        }, 1500);
                    }
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },
        
        goBack() {
            window.history.back();
        },
        
        formatDateForInput(date) {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        },
        
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
        
        
        showNotification(message, type = 'info') {
            if (window.notificationService) {
                window.notificationService.show(message, type);
            } else {
                alert(message);
            }
        },
        
        // Méthodes pour gérer les items
        addItem() {
            const newItem = {
                tempId: Date.now() + Math.random(),
                operationLabel: '',
                isExchange: false,
                isControl: false,
                isRepair: false,
                isPainting: false,
                orderIndex: this.form.items.length + 1
            };
            this.form.items.push(newItem);
        },
        
        async removeItem(index) {
            const item = this.form.items[index];
            const confirmed = await window.notificationService.confirm(
                `Êtes-vous sûr de vouloir supprimer l'opération "${item.operationLabel || 'sans libellé'}" ?`,
                'Supprimer l\'opération',
                'delete'
            );
            
            if (confirmed) {
                this.form.items.splice(index, 1);
                // Réorganiser les index
                this.form.items.forEach((item, idx) => {
                    item.orderIndex = idx + 1;
                });
            }
        },
        
        startDrag(index, event) {
            // TODO: Implémenter le drag & drop pour réorganiser les items
            console.log('Drag started for item:', index);
        },
        
        // Méthodes pour la recherche d'interventions
        onInterventionSearch(event) {
            const searchTerm = event.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadInterventions(searchTerm);
                }, 300);
            }
        },
        
        selectIntervention(intervention) {
            this.form.interventionId = intervention.id;
            this.selectedIntervention = intervention;
            this.showInterventionSearch = false;
        },
        
        toggleInterventionSearch() {
            this.showInterventionSearch = !this.showInterventionSearch;
            if (this.showInterventionSearch && (!this.availableInterventions || this.availableInterventions.length === 0)) {
                this.loadInterventions();
            }
            if (this.showInterventionSearch) {
                // Focus sur le champ de recherche après un court délai
                this.$nextTick(() => {
                    const searchInput = this.$refs.searchInput;
                    if (searchInput) {
                        searchInput.focus();
                    }
                });
            }
        },
        
        closeInterventionSearch() {
            this.showInterventionSearch = false;
        },
        
        async loadCollaborators(search = '') {
            try {
                this.loadingCollaborators = true;
                const params = new URLSearchParams();
                if (search) {
                    params.append('search', search);
                }
                params.append('limit', '20');
                
                const response = await window.apiService.request(`/collaborateurs?${params.toString()}`, {
                    method: 'GET'
                });
                
                if (response.success && response.data) {
                    this.collaborators = response.data;
                    this.filteredCollaborators = response.data;
                } else {
                    this.collaborators = [];
                    this.filteredCollaborators = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des collaborateurs:', error);
                this.collaborators = [];
                this.filteredCollaborators = [];
            } finally {
                this.loadingCollaborators = false;
            }
        },
        
        onCollaboratorSearch(event) {
            const searchTerm = event.target.value.trim();
            
            if (this.collaboratorSearchTimeout) {
                clearTimeout(this.collaboratorSearchTimeout);
            }
            
            this.collaboratorSearchTimeout = setTimeout(() => {
                this.loadCollaborators(searchTerm);
            }, 300);
        },
        
        selectCollaborator(collaborator) {
            this.form.expertId = collaborator.id;
            this.selectedCollaborator = collaborator;
            this.showCollaboratorSearch = false;
            this.collaboratorSearchQuery = '';
        },
        
        clearCollaborator() {
            this.form.expertId = null;
            this.selectedCollaborator = null;
        },
        
        toggleCollaboratorSearch() {
            this.showCollaboratorSearch = !this.showCollaboratorSearch;
            if (this.showCollaboratorSearch && (!this.collaborators || this.collaborators.length === 0)) {
                this.loadCollaborators();
            }
            if (this.showCollaboratorSearch) {
                this.$nextTick(() => {
                    const searchInput = this.$refs.collaboratorSearchInput;
                    if (searchInput) {
                        searchInput.focus();
                    }
                });
            }
        },
        
        closeCollaboratorSearch() {
            this.showCollaboratorSearch = false;
        },
        
        getStatusLabel(status) {
            const statusLabels = {
                'reported': 'Signalé',
                'in_prediagnostic': 'En prédiagnostique',
                'prediagnostic_completed': 'Prédiagnostique terminé',
                'in_quote': 'En devis',
                'quote_received': 'Devis reçu',
                'in_approval': 'En accord',
                'approved': 'Accord donné',
                'in_repair': 'En réparation',
                'repair_completed': 'Réparation terminée',
                'in_reception': 'En réception',
                'vehicle_received': 'Véhicule reçu',
                'cancelled': 'Annulé'
            };
            return statusLabels[status] || status;
        },
        
        resetForm() {
            this.form = {
                id: null,
                interventionId: '',
                prediagnosticDate: '',
                expertId: null,
                signatureExpert: '',
                signatureRepairer: '',
                signatureInsured: '',
                items: []
            };
            this.attachments = [];
        },

        // Méthodes pour les pièces jointes
        async loadAttachments() {
            if (!this.isEditMode || !this.form.id) return;
            
            try {
                this.attachments = await window.fileUploadService.getFiles('intervention_prediagnostic', this.form.id);
            } catch (error) {
                console.error('Erreur lors du chargement des pièces jointes:', error);
                this.showNotification('Erreur lors du chargement des pièces jointes', 'error');
            }
        },

        handleDragOver(e) {
            e.preventDefault();
            this.isDragOver = true;
        },

        handleDragLeave(e) {
            e.preventDefault();
            this.isDragOver = false;
        },

        handleDrop(e) {
            e.preventDefault();
            this.isDragOver = false;
            const files = Array.from(e.dataTransfer.files);
            this.uploadFiles(files);
        },

        handleFileSelect(e) {
            const files = Array.from(e.target.files);
            this.uploadFiles(files);
        },

        async uploadFiles(files) {
            if (!files.length) return;
            
            if (!this.isEditMode) {
                this.showNotification('Veuillez d\'abord sauvegarder le prédiagnostic avant d\'ajouter des pièces jointes', 'warning');
                return;
            }

            this.uploadingFiles = true;
            
            for (const file of files) {
                await this.uploadFile(file);
            }
            
            this.uploadingFiles = false;
            await this.loadAttachments();
        },

        async uploadFile(file) {
            try {
                const result = await window.fileUploadService.uploadFile(
                    file, 
                    'intervention_prediagnostic', 
                    this.form.id
                );
                
                this.showNotification(result.message, 'success');
            } catch (error) {
                console.error('Erreur upload:', error);
                this.showNotification(error.message, 'error');
            }
        },

        getFileIcon(mimeType) {
            return window.fileUploadService.getFileIcon(mimeType);
        },

        formatFileSize(bytes) {
            return window.fileUploadService.formatFileSize(bytes);
        },

        downloadAttachment(attachment) {
            window.fileUploadService.downloadFile(attachment, 'intervention_prediagnostic', this.form.id);
        },

        async deleteAttachment(attachment) {
            const confirmed = await window.notificationService.confirm(
                `Êtes-vous sûr de vouloir supprimer le fichier "${attachment.originalName}" ?`,
                'Supprimer le fichier',
                'delete'
            );
            
            if (!confirmed) return;
            
            try {
                await window.fileUploadService.deleteFile(
                    'intervention_prediagnostic', 
                    this.form.id, 
                    attachment.id
                );
                
                this.showNotification('Fichier supprimé avec succès', 'success');
                await this.loadAttachments();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression du fichier', 'error');
            }
        }
    }
};
