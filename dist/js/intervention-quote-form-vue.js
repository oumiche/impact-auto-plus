/**
 * Composant Vue.js pour le formulaire de devis
 */
const InterventionQuoteForm = {
    name: 'InterventionQuoteForm',
    
    props: {
        mode: {
            type: String,
            default: 'create',
            validator: value => ['create', 'edit', 'view'].includes(value)
        },
        quoteId: {
            type: [String, Number],
            default: null
        }
    },
    
    data() {
        return {
            form: {
                id: null,
                interventionId: null,
                quoteDate: '',
                validUntil: '',
                totalAmount: '0.00',
                laborCost: '',
                partsCost: '',
                taxAmount: '',
                notes: '',
                lines: []
            },
            availableInterventions: [],
            selectedIntervention: null,
            showInterventionSearch: false,
            searchTimeout: null,
            saving: false,
            loading: false,
            attachments: [],
            isDragOver: false,
            uploadingFiles: false,
            newLine: {
                description: '',
                quantity: 1,
                unitPrice: '0.00',
                totalPrice: '0.00',
                lineType: 'service'
            }
        };
    },
    
    computed: {
        isEditMode() {
            return this.mode === 'edit';
        },
        
        isViewMode() {
            return this.mode === 'view';
        },
        
        isFormValid() {
            const hasBasicInfo = this.form.interventionId && this.form.quoteDate;
            const hasValidLines = this.form.lines.length > 0 && 
                this.form.lines.every(line => line.description.trim().length > 0);
            return hasBasicInfo && hasValidLines;
        },
        
        lineTypes() {
            return [
                { value: 'service', label: 'Service' },
                { value: 'part', label: 'Pièce' },
                { value: 'labor', label: 'Main d\'œuvre' },
                { value: 'other', label: 'Autre' }
            ];
        },
        
        filteredInterventions() {
            if (!this.showInterventionSearch) return [];
            
            return this.availableInterventions.filter(intervention =>
                intervention.displayText.toLowerCase().includes(
                    (this.selectedIntervention?.displayText || '').toLowerCase()
                )
            );
        }
    },
    
    async mounted() {
        await this.loadInterventions();
        
        if (this.isEditMode && this.quoteId) {
            await this.loadQuote();
        } else if (this.isEditMode) {
            // Récupérer l'ID depuis l'URL
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if (id) {
                await this.loadQuote(id);
            }
        } else {
            // Mode création - définir la date actuelle
            this.form.quoteDate = this.formatDateForInput(new Date());
            
            // Définir la date d'expiration à 30 jours
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            this.form.validUntil = this.formatDateForInput(expiryDate);
        }
        
        // Gestionnaire pour fermer le dropdown en cliquant en dehors
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    
    methods: {
        async loadInterventions() {
            this.loading = true;
            try {
                const response = await window.apiService.request('/vehicle-interventions');
                if (response.success && response.data) {
                    const interventions = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableInterventions = interventions.map(intervention => ({
                        ...intervention,
                        displayText: `${intervention.code || 'INT-' + intervention.id} - ${intervention.vehicle.brand || ''} ${intervention.vehicle.model || ''} (${intervention.vehicle.plateNumber}) - ${intervention.title}`
                    }));
                } else {
                    this.availableInterventions = [];
                    console.error('Erreur dans la réponse API:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
                this.showNotification('Erreur lors du chargement des interventions', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadQuote(id = null) {
            const quoteId = id || this.quoteId;
            if (!quoteId) return;
            
            this.loading = true;
            try {
                const response = await window.apiService.request(`/intervention-quotes/${quoteId}`);
                if (response.success) {
                    const quote = response.data;
                    this.form = {
                        id: quote.id,
                        interventionId: quote.interventionId,
                        quoteDate: quote.quoteDate ? this.formatDateForInput(new Date(quote.quoteDate)) : '',
                        validUntil: quote.validUntil ? this.formatDateForInput(new Date(quote.validUntil)) : '',
                        totalAmount: quote.totalAmount || '0.00',
                        laborCost: quote.laborCost || '',
                        partsCost: quote.partsCost || '',
                        taxAmount: quote.taxAmount || '',
                        notes: quote.notes || '',
                        lines: quote.lines || []
                    };
                    
                    // Charger l'intervention sélectionnée
                    if (quote.interventionId) {
                        const intervention = this.availableInterventions.find(int => int.id === quote.interventionId);
                        if (intervention) {
                            this.selectedIntervention = intervention;
                        }
                    }
                    
                    // Charger les pièces jointes
                    await this.loadAttachments();
                } else {
                    this.showNotification('Erreur lors du chargement du devis', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement du devis:', error);
                this.showNotification('Erreur lors du chargement du devis', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadAttachments() {
            if (!this.isEditMode || !this.form.id) return;
            try {
                this.attachments = await window.fileUploadService.getFiles('intervention_quote', this.form.id);
            } catch (error) {
                console.error('Erreur lors du chargement des pièces jointes:', error);
                this.showNotification('Erreur lors du chargement des pièces jointes', 'error');
            }
        },
        
        toggleInterventionSearch() {
            this.showInterventionSearch = !this.showInterventionSearch;
            if (this.showInterventionSearch) {
                this.$nextTick(() => {
                    const input = this.$refs.interventionSearchInput;
                    if (input) input.focus();
                });
            }
        },
        
        selectIntervention(intervention) {
            this.selectedIntervention = intervention;
            this.form.interventionId = intervention.id;
            this.showInterventionSearch = false;
        },
        
        clearIntervention() {
            this.selectedIntervention = null;
            this.form.interventionId = null;
            this.showInterventionSearch = false;
        },
        
        handleClickOutside(event) {
            if (!this.$refs.interventionSearchContainer?.contains(event.target)) {
                this.showInterventionSearch = false;
            }
        },
        
        addLine() {
            if (!this.newLine.description.trim()) {
                this.showNotification('Veuillez saisir une description', 'warning');
                return;
            }
            
            this.form.lines.push({
                ...this.newLine,
                tempId: Date.now() + Math.random()
            });
            
            this.newLine = {
                description: '',
                quantity: 1,
                unitPrice: '0.00',
                totalPrice: '0.00',
                lineType: 'service'
            };
            
            this.calculateTotal();
        },
        
        removeLine(index) {
            this.form.lines.splice(index, 1);
            this.calculateTotal();
        },
        
        updateLineTotal(line) {
            const quantity = parseFloat(line.quantity) || 0;
            const unitPrice = parseFloat(line.unitPrice) || 0;
            line.totalPrice = (quantity * unitPrice).toFixed(2);
            this.calculateTotal();
        },
        
        calculateTotal() {
            let total = 0;
            this.form.lines.forEach(line => {
                total += parseFloat(line.totalPrice) || 0;
            });
            
            this.form.totalAmount = total.toFixed(2);
        },
        
        async saveQuote() {
            if (!this.isFormValid) {
                this.showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
                return;
            }
            
            this.saving = true;
            try {
                const payload = {
                    interventionId: this.form.interventionId,
                    quoteDate: this.form.quoteDate,
                    validUntil: this.form.validUntil,
                    totalAmount: this.form.totalAmount,
                    laborCost: this.form.laborCost || null,
                    partsCost: this.form.partsCost || null,
                    taxAmount: this.form.taxAmount || null,
                    notes: this.form.notes,
                    lines: this.form.lines.map(line => ({
                        description: line.description,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        totalPrice: line.totalPrice,
                        lineType: line.lineType,
                        orderIndex: this.form.lines.indexOf(line) + 1
                    }))
                };
                
                const url = this.isEditMode ? `/intervention-quotes/${this.form.id}` : '/intervention-quotes';
                const method = this.isEditMode ? 'PUT' : 'POST';
                
                const response = await window.apiService.request(url, {
                    method: method,
                    body: JSON.stringify(payload)
                });
                
                if (response.success) {
                    this.showNotification(
                        this.isEditMode ? 'Devis modifié avec succès' : 'Devis créé avec succès', 
                        'success'
                    );
                    
                    if (!this.isEditMode && response.data && response.data.id) {
                        setTimeout(() => {
                            window.location.href = `/intervention-quote-edit.html?id=${response.data.id}`;
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
        
        // Méthodes pour les pièces jointes
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
                this.showNotification('Veuillez d\'abord sauvegarder le devis avant d\'ajouter des pièces jointes', 'warning');
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
                    'intervention_quote', 
                    this.form.id
                );
                this.showNotification(result.message, 'success');
            } catch (error) {
                console.error('Erreur upload:', error);
                this.showNotification(error.message, 'error');
            }
        },
        
        downloadAttachment(attachment) {
            window.fileUploadService.downloadFile(attachment, 'intervention_quote', this.form.id);
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
                    'intervention_quote', 
                    this.form.id, 
                    attachment.id
                );
                this.showNotification('Fichier supprimé avec succès', 'success');
                await this.loadAttachments();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression du fichier', 'error');
            }
        },
        
        formatDateForInput(date) {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        
        goBack() {
            window.history.back();
        },
        
        showNotification(message, type = 'info') {
            if (window.notificationService) {
                window.notificationService.show(message, type);
            } else {
                alert(message);
            }
        }
    },
    
    template: `
        <div class="quote-form-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1>
                                <i class="fas fa-file-invoice-dollar"></i>
                                {{ isEditMode ? 'Modifier le Devis' : 'Nouveau Devis' }}
                            </h1>
                            <p v-if="isEditMode">Modifier les informations du devis</p>
                            <p v-else>Créer un nouveau devis d'intervention</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement...
            </div>

            <form v-else @submit.prevent="saveQuote" class="quote-form">
                <!-- Section Informations générales -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-info-circle"></i> Informations générales</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="intervention-id">Intervention *</label>
                            <div class="intervention-search-container" 
                                 ref="interventionSearchContainer"
                                 :class="{ 'active': showInterventionSearch }">
                                <div class="intervention-search-input" @click="toggleInterventionSearch">
                                    <input 
                                        type="text" 
                                        :value="selectedIntervention ? selectedIntervention.displayText : ''"
                                        placeholder="Sélectionner une intervention..."
                                        readonly
                                    >
                                    <i class="fas fa-search"></i>
                                    <button v-if="form.interventionId" type="button" class="clear-btn" @click.stop="clearIntervention">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                
                                <div v-if="showInterventionSearch" class="intervention-search-dropdown">
                                    <div class="intervention-results">
                                        <div v-if="availableInterventions.length === 0" class="no-results">
                                            Aucune intervention trouvée
                                        </div>
                                        <div v-else>
                                            <div v-for="intervention in availableInterventions" 
                                                 :key="intervention.id"
                                                 class="intervention-item"
                                                 @click="selectIntervention(intervention)">
                                                <div class="intervention-code">{{ intervention.code || 'INT-' + intervention.id }}</div>
                                                <div class="intervention-vehicle">{{ intervention.vehicle.brand }} {{ intervention.vehicle.model }} ({{ intervention.vehicle.plateNumber }})</div>
                                                <div class="intervention-title">{{ intervention.title }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="quote-date">Date du devis *</label>
                            <input 
                                type="date" 
                                id="quote-date"
                                v-model="form.quoteDate"
                                required
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="valid-until">Valide jusqu'au</label>
                            <input 
                                type="date" 
                                id="valid-until"
                                v-model="form.validUntil"
                                class="form-control"
                            >
                        </div>
                    </div>
                </div>

                <!-- Section Lignes du devis -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-list"></i> Lignes du devis</h3>
                    </div>
                    
                    <!-- Formulaire d'ajout de ligne -->
                    <div class="line-form">
                        <div class="form-row">
                            <div class="form-group flex-2">
                                <label>Description *</label>
                                <input 
                                    type="text" 
                                    v-model="newLine.description"
                                    placeholder="Description du service ou de la pièce..."
                                    class="form-control"
                                >
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <select v-model="newLine.lineType" class="form-control">
                                    <option v-for="type in lineTypes" :key="type.value" :value="type.value">
                                        {{ type.label }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Quantité</label>
                                <input 
                                    type="number" 
                                    v-model.number="newLine.quantity"
                                    @input="updateLineTotal(newLine)"
                                    min="1"
                                    step="1"
                                    class="form-control"
                                >
                            </div>
                            <div class="form-group">
                                <label>Prix unitaire (€)</label>
                                <input 
                                    type="number" 
                                    v-model.number="newLine.unitPrice"
                                    @input="updateLineTotal(newLine)"
                                    min="0"
                                    step="0.01"
                                    class="form-control"
                                >
                            </div>
                            <div class="form-group">
                                <label>Total (€)</label>
                                <input 
                                    type="text" 
                                    :value="newLine.totalPrice"
                                    readonly
                                    class="form-control"
                                >
                            </div>
                            <div class="form-group">
                                <label>&nbsp;</label>
                                <button type="button" class="btn btn-primary" @click="addLine">
                                    <i class="fas fa-plus"></i>
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Liste des lignes -->
                    <div v-if="form.lines.length > 0" class="lines-list">
                        <div v-for="(line, index) in form.lines" :key="line.tempId || line.id" class="line-item">
                            <div class="line-content">
                                <div class="line-description">{{ line.description }}</div>
                                <div class="line-details">
                                    <span class="line-type">{{ line.lineType }}</span>
                                    <span class="line-quantity">{{ line.quantity }} × {{ parseFloat(line.unitPrice).toFixed(2) }} €</span>
                                </div>
                            </div>
                            <div class="line-total">{{ parseFloat(line.totalPrice).toFixed(2) }} €</div>
                            <button type="button" class="btn btn-sm btn-danger" @click="removeLine(index)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        
                        <div class="lines-total">
                            <strong>Total: {{ parseFloat(form.totalAmount).toFixed(2) }} €</strong>
                        </div>
                    </div>
                    
                    <div v-else class="no-lines">
                        <i class="fas fa-list"></i>
                        <p>Aucune ligne ajoutée</p>
                    </div>
                </div>

                <!-- Section Détails financiers -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-calculator"></i> Détails financiers</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="labor-cost">Main d'œuvre (€)</label>
                            <input 
                                type="number" 
                                id="labor-cost"
                                v-model.number="form.laborCost"
                                min="0"
                                step="0.01"
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="parts-cost">Pièces (€)</label>
                            <input 
                                type="number" 
                                id="parts-cost"
                                v-model.number="form.partsCost"
                                min="0"
                                step="0.01"
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="tax-amount">Taxes (€)</label>
                            <input 
                                type="number" 
                                id="tax-amount"
                                v-model.number="form.taxAmount"
                                min="0"
                                step="0.01"
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="total-amount">Total (€)</label>
                            <input 
                                type="text" 
                                id="total-amount"
                                :value="form.totalAmount"
                                readonly
                                class="form-control total-input"
                            >
                        </div>
                    </div>
                </div>

                <!-- Section Notes -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                    </div>
                    
                    <div class="form-group">
                        <textarea 
                            v-model="form.notes"
                            placeholder="Notes additionnelles sur le devis..."
                            rows="4"
                            class="form-control"
                        ></textarea>
                    </div>
                </div>

                <!-- Section Pièces jointes -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-paperclip"></i> Pièces jointes</h3>
                    </div>
                    
                    <!-- Zone d'upload -->
                    <div class="upload-area" 
                         :class="{ 'drag-over': isDragOver }" 
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
                        v-if="isEditMode"
                        :attachments="attachments"
                        :entity-type="'intervention_quote'"
                        :entity-id="form.id"
                        :show-actions="true"
                        @download="downloadAttachment"
                        @delete="deleteAttachment"
                    />
                </div>
                
                <!-- Actions du formulaire -->
                <div class="form-actions-bottom">
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-times"></i>
                            Annuler
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="!isFormValid || saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ saving ? 'Sauvegarde...' : (isEditMode ? 'Modifier' : 'Créer') }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `
};
