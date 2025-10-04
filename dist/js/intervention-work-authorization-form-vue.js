// Composant Vue pour le formulaire d'autorisation de travail
const InterventionWorkAuthorizationForm = {
    props: {
        mode: {
            type: String,
            default: 'create'
        },
        authorizationId: {
            type: [String, Number],
            default: null
        }
    },
    
    data() {
        return {
            loading: false,
            saving: false,
            currency: 'FCFA',
            authorization: {
                id: null,
                interventionId: null,
                quoteId: null,
                authorizedBy: null,
                authorizationDate: null,
                maxAmount: null,
                specialInstructions: '',
                isUrgent: false
            },
            lines: [],
            newLine: {
                supply: null,
                workType: '',
                lineNumber: 1,
                description: '',
                quantity: 1,
                unitPrice: 0,
                discountPercentage: 0,
                discountAmount: 0,
                taxRate: 0,
                notes: '',
                tempId: null
            },
            availableInterventions: [],
            availableQuotes: [],
            availableSupplies: [],
            selectedIntervention: null,
            selectedQuote: null,
            selectedSupply: null,
            showInterventionSearch: false,
            showQuoteSearch: false,
            showSupplySearch: false,
            searchTimeout: null,
            attachments: [],
            isDragOver: false,
            uploadingFiles: false,
            errors: {}
        };
    },
    
    components: {
        AttachmentGallery: window.AttachmentGallery
    },
    
    computed: {
        isEditMode() {
            return this.mode === 'edit';
        },
        
        isCreateMode() {
            return this.mode === 'create';
        },
        
        pageTitle() {
            return this.isEditMode ? "Modifier l'Autorisation de Travail" : "Nouvelle Autorisation de Travail";
        },
        
        submitButtonText() {
            return this.saving ? 'Enregistrement...' : (this.isEditMode ? 'Modifier' : 'Créer');
        },
        
        isFormValid() {
            return this.authorization.interventionId && 
                   this.authorization.authorizationDate;
        },
        
        filteredInterventions() {
            if (!this.showInterventionSearch || !this.availableInterventions) return [];
            
            return this.availableInterventions.filter(intervention => {
                if (!intervention || !intervention.displayText) return false;
                const searchText = (this.selectedIntervention?.displayText || '').toLowerCase();
                return intervention.displayText.toLowerCase().includes(searchText);
            });
        },
        
        filteredQuotes() {
            if (!this.showQuoteSearch || !this.availableQuotes) return [];
            
            return this.availableQuotes.filter(quote => {
                if (!quote || !quote.displayText) return false;
                const searchText = (this.selectedQuote?.displayText || '').toLowerCase();
                return quote.displayText.toLowerCase().includes(searchText);
            });
        },
        
        filteredSupplies() {
            if (!this.showSupplySearch || !this.availableSupplies) return [];
            
            return this.availableSupplies.filter(supply => {
                if (!supply || !supply.displayText) return false;
                const searchText = (this.selectedSupply?.displayText || '').toLowerCase();
                return supply.displayText.toLowerCase().includes(searchText);
            });
        },
        
        financialSummary() {
            const summary = {
                labor: { lines: [], total: 0 },
                supply: { lines: [], total: 0 },
                other: { lines: [], total: 0 }
            };
            
            this.lines.forEach(line => {
                const total = parseFloat(line.totalPrice || line.lineTotal || 0);
                
                if (line.supply) {
                    summary.supply.lines.push(line);
                    summary.supply.total += total;
                } else if (line.description.toLowerCase().includes('main') || line.description.toLowerCase().includes('travail')) {
                    summary.labor.lines.push(line);
                    summary.labor.total += total;
                } else {
                    summary.other.lines.push(line);
                    summary.other.total += total;
                }
            });
            
            return summary;
        },
        
        workTypeOptions() {
            return [
                { value: '', label: 'Sélectionner un type' },
                { value: 'labor', label: 'Main d\'œuvre' },
                { value: 'supply', label: 'Fourniture' },
                { value: 'other', label: 'Autre' }
            ];
        }
    },
    
    async mounted() {
        this.loadSidebar();
        await this.loadCurrency();
        await this.loadInterventions();
        await this.loadSupplies();
        
        if (this.isEditMode && this.authorizationId) {
            await this.loadAuthorization();
        }
        
        // Ajouter l'écouteur pour fermer les dropdowns au clic extérieur
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        // Nettoyer l'écouteur d'événement
        document.removeEventListener('click', this.handleClickOutside);
    },
    
    methods: {
        loadSidebar() {
            if (window.loadSidebar) {
                window.loadSidebar();
            }
        },
        
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                if (response.success && response.data) {
                    this.currency = response.data.value || 'FCFA';
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la devise:', error);
                this.currency = 'FCFA'; // Fallback
            }
        },
        
        async loadInterventions() {
            this.loading = true;
            try {
                const response = await window.apiService.request('/vehicle-interventions');
                if (response.success && response.data) {
                    const interventions = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableInterventions = interventions.map(intervention => ({
                        ...intervention,
                        displayText: `${intervention.code || 'INT-' + intervention.id} - ${intervention.vehicle?.brand || 'N/A'} ${intervention.vehicle?.model || 'N/A'} (${intervention.vehicle?.plateNumber || 'N/A'}) - ${intervention.title || 'N/A'}`
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
        
        async loadQuotes(interventionId = null) {
            try {
                let url = '/intervention-quotes';
                if (interventionId) {
                    url += `?intervention_id=${interventionId}`;
                }
                
                const response = await window.apiService.request(url);
                if (response.success && response.data) {
                    const quotes = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableQuotes = quotes.map(quote => ({
                        ...quote,
                        displayText: `DEVIS-${quote.id} - ${quote.intervention?.vehicle?.brand || 'N/A'} ${quote.intervention?.vehicle?.model || 'N/A'} (${quote.intervention?.vehicle?.plateNumber || 'N/A'}) - ${parseFloat(quote.totalAmount || 0).toFixed(2)} ${this.currency}`
                    }));
                } else {
                    this.availableQuotes = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des devis:', error);
                this.showNotification('Erreur lors du chargement des devis', 'error');
            }
        },
        
        async loadSupplies() {
            try {
                const response = await window.apiService.request('/supplies');
                if (response.success && response.data) {
                    const supplies = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableSupplies = supplies.map(supply => ({
                        ...supply,
                        displayText: `${supply.reference || 'REF-' + supply.id} - ${supply.name} - ${parseFloat(supply.unitPrice || 0).toFixed(2)} ${this.currency}`
                    }));
                } else {
                    this.availableSupplies = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des fournitures:', error);
                this.showNotification('Erreur lors du chargement des fournitures', 'error');
            }
        },
        
        async loadAuthorization() {
            this.loading = true;
            try {
                const response = await window.apiService.request(`/intervention-work-authorizations/${this.authorizationId}`);
                if (response.success && response.data) {
                    this.authorization = {
                        id: response.data.id,
                        interventionId: response.data.intervention?.id,
                        quoteId: response.data.quote?.id,
                        authorizedBy: response.data.authorizedBy,
                        authorizationDate: response.data.authorizationDate,
                        maxAmount: response.data.maxAmount,
                        specialInstructions: response.data.specialInstructions || '',
                        isUrgent: response.data.isUrgent
                    };
                    
                    // Charger les lignes si elles existent
                    if (response.data.lines) {
                        this.lines = response.data.lines;
                    }
                    
                    // Charger l'intervention sélectionnée
                    if (response.data.intervention) {
                        this.selectedIntervention = {
                            ...response.data.intervention,
                            displayText: `${response.data.intervention.code || 'INT-' + response.data.intervention.id} - ${response.data.intervention.vehicle?.brand || 'N/A'} ${response.data.intervention.vehicle?.model || 'N/A'} (${response.data.intervention.vehicle?.plateNumber || 'N/A'}) - ${response.data.intervention.title || 'N/A'}`
                        };
                        
                        // Charger les devis pour cette intervention
                        await this.loadQuotes(response.data.intervention.id);
                        
                        // Charger le devis sélectionné
                        if (response.data.quote) {
                            this.selectedQuote = {
                                ...response.data.quote,
                                displayText: `DEVIS-${response.data.quote.id} - ${response.data.quote.intervention?.vehicle?.brand || 'N/A'} ${response.data.quote.intervention?.vehicle?.model || 'N/A'} (${response.data.quote.intervention?.vehicle?.plateNumber || 'N/A'}) - ${parseFloat(response.data.quote.totalAmount || 0).toFixed(2)} ${this.currency}`
                            };
                        }
                    }
                    
                    // Charger les pièces jointes
                    await this.loadAttachments();
                }
            } catch (error) {
                console.error('Erreur lors du chargement de l\'autorisation:', error);
                this.showNotification('Erreur lors du chargement de l\'autorisation', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        updateLineTotal() {
            const quantity = parseFloat(this.newLine.quantity) || 0;
            const unitPrice = parseFloat(this.newLine.unitPrice) || 0;
            const discountPercentage = parseFloat(this.newLine.discountPercentage) || 0;
            const taxRate = parseFloat(this.newLine.taxRate) || 0;
            
            let subtotal = quantity * unitPrice;
            
            // Appliquer la remise
            if (discountPercentage > 0) {
                const discount = subtotal * (discountPercentage / 100);
                subtotal -= discount;
            }
            
            // Appliquer la taxe
            if (taxRate > 0) {
                const tax = subtotal * (taxRate / 100);
                subtotal += tax;
            }
            
            this.newLine.totalPrice = subtotal.toFixed(2);
        },
        
        addLine() {
            if (!this.newLine.description || this.newLine.description.trim() === '') {
                this.showNotification('Veuillez saisir une description', 'error');
                return;
            }
            
            if (this.newLine.quantity <= 0) {
                this.showNotification('La quantité doit être supérieure à 0', 'error');
                return;
            }
            
            if (this.newLine.unitPrice <= 0) {
                this.showNotification('Le prix unitaire doit être supérieur à 0', 'error');
                return;
            }
            
            const line = {
                ...this.newLine,
                tempId: Date.now() + Math.random(),
                lineNumber: this.lines.length + 1
            };
            
            this.lines.push(line);
            this.resetNewLine();
        },
        
        removeLine(index) {
            this.lines.splice(index, 1);
            // Réorganiser les numéros de ligne
            this.lines.forEach((line, idx) => {
                line.lineNumber = idx + 1;
            });
        },
        
        resetNewLine() {
            this.newLine = {
                supply: null,
                workType: '',
                lineNumber: this.lines.length + 1,
                description: '',
                quantity: 1,
                unitPrice: 0,
                discountPercentage: 0,
                discountAmount: 0,
                taxRate: 0,
                notes: '',
                tempId: null
            };
            this.selectedSupply = null;
        },
        
        getLineDisplayName(line) {
            if (line.supply) {
                return `${line.supply.reference || 'REF-' + line.supply.id} - ${line.supply.name}`;
            }
            return line.description;
        },
        
        getWorkTypeLabel(workType) {
            const option = this.workTypeOptions.find(opt => opt.value === workType);
            return option ? option.label : workType;
        },
        
        getTotalAmount() {
            return this.lines.reduce((total, line) => {
                return total + parseFloat(line.totalPrice || line.lineTotal || 0);
            }, 0).toFixed(2);
        },
        
        showNotification(message, type = 'info') {
            window.notificationService.show(message, type);
        },
        
        resetForm() {
            this.authorization = {
                interventionId: null,
                quoteId: null,
                authorizedBy: null,
                authorizationDate: null,
                maxAmount: null,
                specialInstructions: '',
                isUrgent: false
            };
            this.lines = [];
            this.resetNewLine();
            this.errors = {};
        },
        
        async submitForm() {
            if (!this.isFormValid) {
                this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }
            
            this.saving = true;
            
            try {
                const data = {
                    ...this.authorization,
                    lines: this.lines.map(line => ({
                        supplyId: line.supply?.id,
                        workType: line.workType,
                        lineNumber: line.lineNumber,
                        description: line.description,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discountPercentage: line.discountPercentage,
                        discountAmount: line.discountAmount,
                        taxRate: line.taxRate,
                        notes: line.notes
                    }))
                };
                
                let response;
                if (this.isEditMode) {
                    response = await window.apiService.request(`/intervention-work-authorizations/${this.authorizationId}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                } else {
                    response = await window.apiService.request('/intervention-work-authorizations', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                }
                
                if (response.success) {
                    // En mode création, récupérer l'ID de l'autorisation créée
                    if (this.isCreateMode && response.data && response.data.id) {
                        this.authorization.id = response.data.id;
                    }
                    
                    this.showNotification(
                        this.isEditMode ? 'Autorisation modifiée avec succès' : 'Autorisation créée avec succès',
                        'success'
                    );
                    
                    setTimeout(() => {
                        window.location.href = '/intervention-work-authorizations.html';
                    }, 1500);
                } else {
                    this.showNotification(response.message || 'Erreur lors de l\'enregistrement', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'enregistrement:', error);
                this.showNotification('Erreur lors de l\'enregistrement', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        goBack() {
            window.location.href = '/intervention-work-authorizations.html';
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
            this.authorization.interventionId = intervention.id;
            this.showInterventionSearch = false;
            
            // Charger les devis pour cette intervention
            this.loadQuotes(intervention.id);
            
            // Réinitialiser le devis sélectionné
            this.selectedQuote = null;
            this.authorization.quoteId = null;
        },
        
        clearIntervention() {
            this.selectedIntervention = null;
            this.authorization.interventionId = null;
            this.showInterventionSearch = false;
            
            // Réinitialiser les devis et le devis sélectionné
            this.availableQuotes = [];
            this.selectedQuote = null;
            this.authorization.quoteId = null;
        },
        
        toggleQuoteSearch() {
            this.showQuoteSearch = !this.showQuoteSearch;
            if (this.showQuoteSearch) {
                this.$nextTick(() => {
                    const input = this.$refs.quoteSearchInput;
                    if (input) input.focus();
                });
            }
        },
        
        selectQuote(quote) {
            this.selectedQuote = quote;
            this.authorization.quoteId = quote.id;
            this.showQuoteSearch = false;
        },
        
        clearQuote() {
            this.selectedQuote = null;
            this.authorization.quoteId = null;
            this.showQuoteSearch = false;
        },
        
        handleClickOutside(event) {
            if (!this.$refs.interventionSearchContainer?.contains(event.target)) {
                this.showInterventionSearch = false;
            }
            if (!this.$refs.quoteSearchContainer?.contains(event.target)) {
                this.showQuoteSearch = false;
            }
            if (!this.$refs.supplySearchContainer?.contains(event.target)) {
                this.showSupplySearch = false;
            }
        },
        
        toggleSupplySearch() {
            this.showSupplySearch = !this.showSupplySearch;
            if (this.showSupplySearch) {
                this.$nextTick(() => {
                    const input = this.$refs.supplySearchInput;
                    if (input) input.focus();
                });
            }
        },
        
        selectSupply(supply) {
            this.selectedSupply = supply;
            this.newLine.supply = supply;
            this.showSupplySearch = false;
            
            // Remplir automatiquement la description et le prix unitaire
            if (supply) {
                this.newLine.description = supply.name;
                this.newLine.unitPrice = parseFloat(supply.unitPrice || 0);
                this.updateLineTotal();
            }
        },
        
        clearSupply() {
            this.selectedSupply = null;
            this.newLine.supply = null;
            this.showSupplySearch = false;
        },
        
        async loadAttachments() {
            if (!this.isEditMode || !this.authorization.id) return;
            try {
                console.log('=== LOADING ATTACHMENTS ===');
                console.log('Entity type: intervention_work_authorization');
                console.log('Entity ID:', this.authorization.id);
                
                this.attachments = await window.fileUploadService.getFiles('intervention_work_authorization', this.authorization.id);
                
                console.log('Attachments loaded:', this.attachments);
                console.log('Number of attachments:', this.attachments.length);
                console.log('=== END LOADING ATTACHMENTS ===');
            } catch (error) {
                console.error('Erreur lors du chargement des pièces jointes:', error);
                this.showNotification('Erreur lors du chargement des pièces jointes', 'error');
            }
        },
        
        async uploadFile(file) {
            if (!this.authorization.id) {
                this.showNotification('Veuillez d\'abord enregistrer l\'autorisation avant d\'ajouter des pièces jointes', 'error');
                return;
            }
            
            try {
                console.log('=== UPLOADING FILE ===');
                console.log('File:', file.name);
                console.log('Entity type: intervention_work_authorization');
                console.log('Entity ID:', this.authorization.id);
                
                const result = await window.fileUploadService.uploadFile(
                    file, 
                    'intervention_work_authorization', 
                    this.authorization.id
                );
                
                console.log('Upload result:', result);
                console.log('=== END UPLOADING FILE ===');
                
                if (result.success) {
                    this.showNotification('Fichier uploadé avec succès', 'success');
                    await this.loadAttachments();
                } else {
                    this.showNotification(result.message || 'Erreur lors de l\'upload', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'upload:', error);
                this.showNotification('Erreur lors de l\'upload du fichier', 'error');
            }
        },
        
        downloadAttachment(attachment) {
            window.fileUploadService.downloadFile(attachment, 'intervention_work_authorization', this.authorization.id);
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
                    'intervention_work_authorization', 
                    this.authorization.id, 
                    attachment.id
                );
                this.showNotification('Fichier supprimé avec succès', 'success');
                await this.loadAttachments();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression du fichier', 'error');
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
        
        async handleDrop(event) {
            event.preventDefault();
            this.isDragOver = false;
            
            const files = Array.from(event.dataTransfer.files);
            await this.processFiles(files);
        },
        
        async handleFileSelect(event) {
            const files = Array.from(event.target.files);
            await this.processFiles(files);
            // Reset input
            event.target.value = '';
        },
        
        async processFiles(files) {
            if (files.length === 0) return;
            
            this.uploadingFiles = true;
            
            try {
                for (const file of files) {
                    // Vérifier la taille du fichier (10MB max)
                    if (file.size > 10 * 1024 * 1024) {
                        this.showNotification(`Le fichier "${file.name}" est trop volumineux (max 10MB)`, 'error');
                        continue;
                    }
                    
                    await this.uploadFile(file);
                }
            } finally {
                this.uploadingFiles = false;
            }
        }
    },
    
    template: `
        <div class="authorization-form-container">
            <!-- En-tête -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-text">
                            <h1>{{ pageTitle }}</h1>
                            <p>Gérez les autorisations de travail pour les interventions véhicules</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button type="button" class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                    </div>
                </div>
            </div>

            <!-- État de chargement -->
            <div v-if="loading" class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement en cours...</p>
                    </div>
                </div>

            <!-- Formulaire -->
            <div v-else class="authorization-form">
                <form @submit.prevent="submitForm">
                    <!-- Section Informations générales -->
                        <div class="form-section">
                        <div class="section-header">
                            <h3><i class="fas fa-info-circle"></i> Informations générales</h3>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Intervention *</label>
                                <div class="intervention-search-container" 
                                     ref="interventionSearchContainer"
                                     :class="{ 'active': showInterventionSearch }">
                                    <div class="intervention-search-input" @click="toggleInterventionSearch">
                                        <input 
                                            type="text" 
                                            ref="interventionSearchInput"
                                            :value="selectedIntervention ? selectedIntervention.displayText : ''"
                                            placeholder="Sélectionner une intervention..."
                                            readonly
                                            class="form-control"
                                            :class="{ 'is-invalid': errors.interventionId }"
                                            required
                                        >
                                        <i class="fas fa-search"></i>
                                        <button v-if="authorization.interventionId" type="button" class="clear-btn" @click.stop="clearIntervention">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    
                                    <div v-if="showInterventionSearch" class="intervention-search-dropdown">
                                        <div class="intervention-results">
                                            <div v-if="availableInterventions.length === 0" class="intervention-no-results">
                                                Aucune intervention trouvée
                                            </div>
                                            <div v-else>
                                                <div v-for="intervention in availableInterventions" 
                                                     :key="intervention.id"
                                                     class="intervention-item"
                                                     @click="selectIntervention(intervention)">
                                                    <div class="intervention-code">{{ intervention.code || 'INT-' + intervention.id }}</div>
                                                    <div class="intervention-vehicle">{{ intervention.vehicle?.brand || 'N/A' }} {{ intervention.vehicle?.model || 'N/A' }} ({{ intervention.vehicle?.plateNumber || 'N/A' }})</div>
                                                    <div class="intervention-title">{{ intervention.title || 'N/A' }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="errors.interventionId" class="invalid-feedback">{{ errors.interventionId }}</div>
                            </div>
                            
                            <div class="form-group">
                                <label>Devis (optionnel)</label>
                                <div class="quote-search-container" 
                                     ref="quoteSearchContainer"
                                     :class="{ 'active': showQuoteSearch }">
                                    <div class="quote-search-input" @click="toggleQuoteSearch">
                                        <input 
                                            type="text" 
                                            ref="quoteSearchInput"
                                            :value="selectedQuote ? selectedQuote.displayText : ''"
                                            placeholder="Sélectionner un devis..."
                                            readonly
                                            class="form-control"
                                            :disabled="!authorization.interventionId"
                                        >
                                        <i class="fas fa-search"></i>
                                        <button v-if="authorization.quoteId" type="button" class="clear-btn" @click.stop="clearQuote">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    
                                    <div v-if="showQuoteSearch" class="quote-search-dropdown">
                                        <div class="intervention-results">
                                            <div v-if="availableQuotes.length === 0" class="quote-no-results">
                                                {{ authorization.interventionId ? "Aucun devis trouvé pour cette intervention" : "Sélectionnez d'abord une intervention" }}
                                            </div>
                                            <div v-else>
                                                <div v-for="quote in availableQuotes" 
                                                     :key="quote.id"
                                                     class="intervention-item"
                                                     @click="selectQuote(quote)">
                                                    <div class="quote-code">DEVIS-{{ quote.id }}</div>
                                                    <div class="quote-vehicle">{{ quote.intervention?.vehicle?.brand || 'N/A' }} {{ quote.intervention?.vehicle?.model || 'N/A' }} ({{ quote.intervention?.vehicle?.plateNumber || 'N/A' }})</div>
                                                    <div class="quote-title">{{ parseFloat(quote.totalAmount || 0).toFixed(2) }} {{ currency }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Autorisé par *</label>
                                <input 
                                    type="text" 
                                    v-model="authorization.authorizedBy" 
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.authorizedBy }"
                                    placeholder="Nom de la personne qui autorise"
                                    required
                                >
                                <div v-if="errors.authorizedBy" class="invalid-feedback">{{ errors.authorizedBy }}</div>
                            </div>

                            <div class="form-group">
                                <label>Date d'autorisation *</label>
                                <input 
                                    type="date" 
                                    v-model="authorization.authorizationDate" 
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.authorizationDate }"
                                    required
                                >
                                <div v-if="errors.authorizationDate" class="invalid-feedback">{{ errors.authorizationDate }}</div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Montant maximum ({{ currency }})</label>
                                <input 
                                    type="number"
                                    v-model.number="authorization.maxAmount" 
                                    class="form-control"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                >
                                <div class="form-text">Laissez vide pour un montant illimité</div>
                            </div>

                            <div class="form-group">
                                <div class="form-check">
                                    <input 
                                        type="checkbox"
                                        v-model="authorization.isUrgent" 
                                        class="form-check-input"
                                        id="isUrgent"
                                    >
                                    <label class="form-check-label" for="isUrgent">
                                        Intervention urgente
                                </label>
                                </div>
                            </div>
                            </div>

                            <div class="form-group">
                            <label>Instructions spéciales</label>
                                <textarea 
                                    v-model="authorization.specialInstructions" 
                                class="form-control"
                                rows="3"
                                    placeholder="Instructions particulières pour cette autorisation..."
                                ></textarea>
                        </div>
                    </div>

                    <!-- Section Lignes d'autorisation -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3><i class="fas fa-list"></i> Lignes d'autorisation</h3>
                        </div>
                        
                        <!-- Formulaire d'ajout de ligne -->
                        <div class="add-line-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Type de travaux</label>
                                    <select v-model="newLine.workType" class="form-control">
                                        <option v-for="option in workTypeOptions" :key="option.value" :value="option.value">
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Désignation</label>
                                    <div class="supply-search-container" 
                                         ref="supplySearchContainer"
                                         :class="{ 'active': showSupplySearch }">
                                        <div class="supply-search-input" @click="toggleSupplySearch">
                                            <input 
                                                type="text" 
                                                ref="supplySearchInput"
                                                :value="selectedSupply ? selectedSupply.displayText : ''"
                                                placeholder="Sélectionner une fourniture..."
                                                readonly
                                                class="form-control"
                                            >
                                            <i class="fas fa-search"></i>
                                            <button v-if="newLine.supply" type="button" class="clear-btn" @click.stop="clearSupply">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        
                                        <div v-if="showSupplySearch" class="supply-search-dropdown">
                                            <div class="intervention-results">
                                                <div v-if="availableSupplies.length === 0" class="quote-no-results">
                                                    Aucune fourniture trouvée
                                                </div>
                                                <div v-else>
                                                    <div v-for="supply in availableSupplies" 
                                                         :key="supply.id"
                                                         class="intervention-item"
                                                         @click="selectSupply(supply)">
                                                        <div class="intervention-code">{{ supply.reference || 'REF-' + supply.id }}</div>
                                                        <div class="intervention-vehicle">{{ supply.name }}</div>
                                                        <div class="intervention-title">{{ parseFloat(supply.unitPrice || 0).toFixed(2) }} {{ currency }}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Description *</label>
                                    <input 
                                        type="text" 
                                        v-model="newLine.description" 
                                        class="form-control"
                                        placeholder="Description de la ligne"
                                        required
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Quantité *</label>
                                    <input 
                                        type="number" 
                                        v-model.number="newLine.quantity"
                                        @input="updateLineTotal()"
                                        min="0.01"
                                        step="0.01"
                                        class="form-control"
                                        placeholder="1.00"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label>Prix unitaire ({{ currency }}) *</label>
                                    <input 
                                        type="number" 
                                        v-model.number="newLine.unitPrice"
                                        @input="updateLineTotal()"
                                        min="0"
                                        step="0.01"
                                        class="form-control"
                                        placeholder="0.00"
                                        required
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Remise (%)</label>
                                    <input 
                                        type="number" 
                                        v-model.number="newLine.discountPercentage"
                                        @input="updateLineTotal()"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        class="form-control"
                                        placeholder="0.00"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label>Taxe (%)</label>
                                    <input 
                                        type="number" 
                                        v-model.number="newLine.taxRate"
                                        @input="updateLineTotal()"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        class="form-control"
                                        placeholder="0.00"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Total ({{ currency }})</label>
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
                        <div v-if="lines.length > 0" class="lines-list">
                            <div v-for="(line, index) in lines" :key="line.tempId || line.id" class="line-item">
                                <div class="line-content">
                                    <div class="line-description">{{ getLineDisplayName(line) }}</div>
                                    <div class="line-details">
                                        <span v-if="line.workType" class="line-work-type">{{ getWorkTypeLabel(line.workType) }}</span>
                                        <span class="line-quantity">{{ line.quantity }} × {{ parseFloat(line.unitPrice || 0).toFixed(2) }} {{ currency }}</span>
                                        <span v-if="line.discountPercentage" class="line-discount">Remise: {{ line.discountPercentage }}%</span>
                                        <span v-if="line.taxRate" class="line-tax">Taxe: {{ line.taxRate }}%</span>
                                    </div>
                                </div>
                                <div class="line-total">{{ parseFloat(line.totalPrice || line.lineTotal || 0).toFixed(2) }} {{ currency }}</div>
                                <button type="button" class="btn btn-sm btn-danger" @click="removeLine(index)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            
                            <div class="lines-total">
                                <strong>Total: {{ getTotalAmount() }} {{ currency }}</strong>
                            </div>
                        </div>
                        
                        <div v-else class="no-lines">
                            <i class="fas fa-list"></i>
                            <p>Aucune ligne ajoutée</p>
                        </div>
                    </div>

                    <!-- Section Détails financiers -->
                    <div class="form-section" v-if="lines.length > 0">
                        <div class="section-header">
                            <h3><i class="fas fa-calculator"></i> Détails financiers</h3>
                        </div>
                        
                        <div class="financial-summary">
                            <!-- Main d'œuvre -->
                            <div v-if="financialSummary.labor.lines.length > 0" class="work-type-summary">
                                <div class="work-type-header">
                                    <h4><i class="fas fa-tools"></i> Main d'œuvre</h4>
                                    <span class="work-type-total">{{ financialSummary.labor.total.toFixed(2) }} {{ currency }}</span>
                                </div>
                                <div class="work-type-details">
                                    <span class="line-count">{{ financialSummary.labor.lines.length }} ligne(s)</span>
                                </div>
                            </div>
                            
                            <!-- Fournitures -->
                            <div v-if="financialSummary.supply.lines.length > 0" class="work-type-summary">
                                <div class="work-type-header">
                                    <h4><i class="fas fa-box"></i> Fournitures</h4>
                                    <span class="work-type-total">{{ financialSummary.supply.total.toFixed(2) }} {{ currency }}</span>
                                </div>
                                <div class="work-type-details">
                                    <span class="line-count">{{ financialSummary.supply.lines.length }} ligne(s)</span>
                                </div>
                            </div>
                            
                            <!-- Autres -->
                            <div v-if="financialSummary.other.lines.length > 0" class="work-type-summary">
                                <div class="work-type-header">
                                    <h4><i class="fas fa-cog"></i> Autres</h4>
                                    <span class="work-type-total">{{ financialSummary.other.total.toFixed(2) }} {{ currency }}</span>
                                </div>
                                <div class="work-type-details">
                                    <span class="line-count">{{ financialSummary.other.lines.length }} ligne(s)</span>
                                </div>
                            </div>
                            
                            <div class="total-summary">
                                <div class="total-amount">
                                    <strong>Total général: {{ getTotalAmount() }} {{ currency }}</strong>
                                </div>
                                <div v-if="authorization.maxAmount" class="budget-info">
                                    <span class="budget-remaining">
                                        Budget restant: {{ (parseFloat(authorization.maxAmount) - parseFloat(getTotalAmount())).toFixed(2) }} {{ currency }}
                                    </span>
                                </div>
                            </div>
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
                            :attachments="attachments"
                            :entity-type="'intervention_work_authorization'"
                            :entity-id="authorization.id"
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
                                {{ submitButtonText }}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};