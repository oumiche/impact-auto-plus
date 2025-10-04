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
                garageId: null,
                quoteDate: '',
                validUntil: '',
                receivedDate: '',
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
            currency: 'FCFA', // Devise par défaut
            newLine: {
                supplyId: null,
                workType: '',
                quantity: 1,
                unitPrice: '0.00',
                totalPrice: '0.00',
                discountPercentage: '',
                discountAmount: '',
                taxRate: '',
                notes: ''
            },
            availableSupplies: [],
            selectedSupply: null,
            showSupplySearch: false,
            availableGarages: [],
            selectedGarage: null,
            showGarageSearch: false,
            showOCR: false
        };
    },
    
    components: {
        AttachmentGallery: window.AttachmentGallery,
        OCRProcessor: window.OCRProcessor
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
                this.form.lines.every(line => line.supplyId);
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
        },
        
        filteredSupplies() {
            if (!this.showSupplySearch) return [];
            
            return this.availableSupplies.filter(supply =>
                supply.displayText.toLowerCase().includes(
                    (this.selectedSupply?.displayText || '').toLowerCase()
                )
            );
        },
        
        filteredGarages() {
            if (!this.showGarageSearch) return [];
            
            return this.availableGarages.filter(garage =>
                garage.displayText.toLowerCase().includes(
                    (this.selectedGarage?.displayText || '').toLowerCase()
                )
            );
        },
        
        workTypeOptions() {
            return [
                { value: '', label: 'Sélectionner un type' },
                { value: 'labor', label: 'Main d\'œuvre' },
                { value: 'supply', label: 'Fourniture' },
                { value: 'other', label: 'Divers' }
            ];
        },
        
        financialSummary() {
            const summary = {
                labor: { lines: [], total: 0 },
                supply: { lines: [], total: 0 },
                other: { lines: [], total: 0 },
                total: 0
            };
            
            this.form.lines.forEach(line => {
                const lineTotal = parseFloat(line.totalPrice || line.lineTotal || 0);
                const workType = line.workType || 'other';
                
                if (summary[workType]) {
                    summary[workType].lines.push(line);
                    summary[workType].total += lineTotal;
                } else {
                    summary.other.lines.push(line);
                    summary.other.total += lineTotal;
                }
                
                summary.total += lineTotal;
            });
            
            return summary;
        }
    },
    
    async mounted() {
        await this.loadInterventions();
        await this.loadSupplies();
        await this.loadGarages();
        await this.loadCurrency();
        
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
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                console.log('=== CURRENCY API RESPONSE ===');
                console.log('Response:', response);
                console.log('Success:', response.success);
                console.log('Data:', response.data);
                console.log('Currency value:', response.data?.currency || response.data?.value);
                
                if (response.success && response.data) {
                    this.currency = response.data.currency || response.data.value || 'FCFA';
                } else {
                    this.currency = 'FCFA'; // Fallback
                }
                
                console.log('Final currency set to:', this.currency);
                console.log('=== END CURRENCY LOG ===');
            } catch (error) {
                console.error('Erreur lors du chargement de la devise:', error);
                this.currency = 'FCFA'; // Fallback
                console.log('Currency fallback set to:', this.currency);
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
        
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                if (response.success && response.data) {
                    this.currency = response.data.value || 'FCFA';
                }
            } catch (error) {
                console.warn('Impossible de charger la devise depuis les paramètres, utilisation de la devise par défaut:', error);
                // Garder la devise par défaut (FCFA)
            }
        },
        
        async loadSupplies() {
            try {
                const response = await window.apiService.request('/supplies');
                if (response.success && response.data) {
                    const supplies = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableSupplies = supplies.map(supply => ({
                        ...supply,
                        displayText: `${supply.reference} - ${supply.name} (${supply.brand || 'N/A'}) - ${parseFloat(supply.unitPrice).toFixed(2)} ${this.currency}`
                    }));
                } else {
                    this.availableSupplies = [];
                    console.error('Erreur dans la réponse API supplies:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des fournitures:', error);
                this.showNotification('Erreur lors du chargement des designations', 'error');
            }
        },
        
        async loadGarages() {
            try {
                const response = await window.apiService.request('/garages');
                if (response.success && response.data) {
                    const garages = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableGarages = garages.map(garage => ({
                        ...garage,
                        displayText: `${garage.name} - ${garage.address || 'Adresse non renseignée'}`
                    }));
                } else {
                    this.availableGarages = [];
                    console.error('Erreur dans la réponse API garages:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des garages:', error);
                this.showNotification('Erreur lors du chargement des garages', 'error');
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
                        garageId: quote.garageId || null,
                        quoteDate: quote.quoteDate ? this.formatDateForInput(new Date(quote.quoteDate)) : '',
                        validUntil: quote.validUntil ? this.formatDateForInput(new Date(quote.validUntil)) : '',
                        receivedDate: quote.receivedDate ? this.formatDateForInput(new Date(quote.receivedDate)) : '',
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
                    
                    // Charger le garage sélectionné
                    if (quote.garageId) {
                        const garage = this.availableGarages.find(garage => garage.id === quote.garageId);
                        if (garage) {
                            this.selectedGarage = garage;
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
                console.log('=== LOADING ATTACHMENTS ===');
                console.log('Entity type: intervention_quote');
                console.log('Entity ID:', this.form.id);
                
                this.attachments = await window.fileUploadService.getFiles('intervention_quote', this.form.id);
                
                console.log('Attachments loaded:', this.attachments);
                console.log('Number of attachments:', this.attachments.length);
                console.log('=== END LOADING ATTACHMENTS ===');
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
            if (!this.$refs.supplySearchContainer?.contains(event.target)) {
                this.showSupplySearch = false;
            }
            if (!this.$refs.garageSearchContainer?.contains(event.target)) {
                this.showGarageSearch = false;
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
            this.newLine.supplyId = supply.id;
            this.newLine.unitPrice = supply.unitPrice;
            this.updateLineTotal();
            this.showSupplySearch = false;
        },
        
        clearSupply() {
            this.selectedSupply = null;
            this.newLine.supplyId = null;
            this.newLine.unitPrice = '0.00';
            this.showSupplySearch = false;
        },
        
        toggleGarageSearch() {
            this.showGarageSearch = !this.showGarageSearch;
            if (this.showGarageSearch) {
                this.$nextTick(() => {
                    const input = this.$refs.garageSearchInput;
                    if (input) input.focus();
                });
            }
        },
        
        selectGarage(garage) {
            this.selectedGarage = garage;
            this.form.garageId = garage.id;
            this.showGarageSearch = false;
        },
        
        clearGarage() {
            this.selectedGarage = null;
            this.form.garageId = null;
            this.showGarageSearch = false;
        },
        
        getWorkTypeLabel(value) {
            const option = this.workTypeOptions.find(opt => opt.value === value);
            return option ? option.label : value;
        },
        
        getLineDisplayName(line) {
            // Utiliser supplyName directement (déjà traité par le backend)
            return line.supplyName || 'Fourniture';
        },
        
        // Méthodes OCR
        openOCR() {
            this.showOCR = true;
        },
        
        closeOCR() {
            this.showOCR = false;
        },
        
        async handleOCRDataExtracted(data) {
            console.log('Données OCR reçues:', data);
            
            try {
                // Appliquer les données extraites au formulaire
                if (data.quoteNumber) {
                    // Le numéro de devis est généré automatiquement, on peut l'ignorer ou l'afficher
                    console.log('Numéro de devis détecté:', data.quoteNumber);
                }
                
                // Appliquer les dates
                if (data.dates && data.dates.length > 0) {
                    // Utiliser la première date trouvée comme date de devis
                    const quoteDate = data.dates[0];
                    this.form.quoteDate = this.formatDateForInput(new Date(quoteDate.split('/').reverse().join('-')));
                    
                    // Si plusieurs dates, utiliser la dernière comme date de réception
                    if (data.dates.length > 1) {
                        const receivedDate = data.dates[data.dates.length - 1];
                        this.form.receivedDate = this.formatDateForInput(new Date(receivedDate.split('/').reverse().join('-')));
                    }
                }
                
                // Appliquer les lignes de devis
                if (data.lines && data.lines.length > 0) {
                    // Vider les lignes existantes
                    this.form.lines = [];
                    
                    // Ajouter les lignes extraites
                    data.lines.forEach((line, index) => {
                        const newLine = {
                            supplyId: line.supplyId || null, // ID de la fourniture si créée
                            workType: line.supplyId ? 'supply' : 'other', // 'supply' si fourniture associée
                            quantity: line.quantity || 1,
                            unitPrice: line.unitPrice ? line.unitPrice.toString() : (line.totalPrice ? (line.totalPrice / line.quantity).toString() : '0.00'),
                            totalPrice: line.totalPrice ? line.totalPrice.toString() : '0.00',
                            discountPercentage: '',
                            discountAmount: '',
                            taxRate: '',
                            notes: line.description || '',
                            tempId: Date.now() + Math.random() + index,
                            // Données supplémentaires pour l'affichage
                            supplyName: line.supplyName || line.description,
                            supplyReference: line.supplyReference || '',
                            displayName: line.supplyName || line.description
                        };
                        
                        this.form.lines.push(newLine);
                    });
                    
                    // Recharger les fournitures pour inclure les nouvelles
                    if (data.lines.some(line => line.supplyId)) {
                        await this.loadSupplies();
                    }
                }
                
                // Calculer le total des lignes
                this.calculateTotal();
                
                // Appliquer les totaux si disponibles
                if (data.totals && data.totals.calculated) {
                    console.log('Total OCR calculé:', data.totals.calculated);
                }
                
                this.showNotification('Données OCR appliquées avec succès', 'success');
                this.closeOCR();
                
            } catch (error) {
                console.error('Erreur lors de l\'application des données OCR:', error);
                this.showNotification('Erreur lors de l\'application des données OCR', 'error');
            }
        },
        
        addLine() {
            if (!this.newLine.supplyId) {
                this.showNotification('Veuillez sélectionner une designation', 'warning');
                return;
            }
            
            // Récupérer les données de la supply sélectionnée
            const supplyData = this.selectedSupply || this.availableSupplies.find(s => s.id === this.newLine.supplyId);
            
            const lineToAdd = {
                ...this.newLine,
                supplyName: supplyData?.name || 'Fourniture',
                supplyReference: supplyData?.reference || '',
                displayName: supplyData?.name || 'Fourniture',
                tempId: Date.now() + Math.random()
            };
            
            this.form.lines.push(lineToAdd);
            
            this.newLine = {
                supplyId: null,
                workType: '',
                quantity: 1,
                unitPrice: '0.00',
                totalPrice: '0.00',
                discountPercentage: '',
                discountAmount: '',
                taxRate: '',
                notes: ''
            };
            
            this.selectedSupply = null;
            this.calculateTotal();
        },
        
        removeLine(index) {
            this.form.lines.splice(index, 1);
            this.calculateTotal();
        },
        
        updateLineTotal() {
            const quantity = parseFloat(this.newLine.quantity) || 0;
            const unitPrice = parseFloat(this.newLine.unitPrice) || 0;
            let subtotal = quantity * unitPrice;
            
            // Appliquer la remise
            if (this.newLine.discountPercentage) {
                const discount = subtotal * (parseFloat(this.newLine.discountPercentage) / 100);
                subtotal -= discount;
            }
            
            // Appliquer la taxe
            if (this.newLine.taxRate) {
                const tax = subtotal * (parseFloat(this.newLine.taxRate) / 100);
                subtotal += tax;
            }
            
            this.newLine.totalPrice = subtotal.toFixed(2);
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
                    garageId: this.form.garageId || null,
                    quoteDate: this.form.quoteDate,
                    validUntil: this.form.validUntil,
                    receivedDate: this.form.receivedDate,
                    totalAmount: this.form.totalAmount,
                    laborCost: this.form.laborCost || null,
                    partsCost: this.form.partsCost || null,
                    taxAmount: this.form.taxAmount || null,
                    notes: this.form.notes,
                    lines: this.form.lines.map(line => ({
                        supplyId: line.supplyId,
                        workType: line.workType || null,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discountPercentage: line.discountPercentage || null,
                        discountAmount: line.discountAmount || null,
                        taxRate: line.taxRate || null,
                        notes: line.notes || null,
                        lineNumber: this.form.lines.indexOf(line) + 1
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
                console.log('=== UPLOADING FILE ===');
                console.log('File:', file.name);
                console.log('Entity type: intervention_quote');
                console.log('Entity ID:', this.form.id);
                
                const result = await window.fileUploadService.uploadFile(
                    file, 
                    'intervention_quote', 
                    this.form.id
                );
                
                console.log('Upload result:', result);
                this.showNotification(result.message, 'success');
                console.log('=== END UPLOAD ===');
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
                        <button v-if="!isEditMode" class="btn btn-outline" @click="openOCR">
                            <i class="fas fa-eye"></i>
                            OCR
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
                        
                        <div class="form-group">
                            <label for="received-date">Date de réception</label>
                            <input 
                                type="date" 
                                id="received-date"
                                v-model="form.receivedDate"
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="garage">Garage</label>
                            <div class="intervention-search-container" ref="garageSearchContainer">
                                <div class="intervention-search-input" @click="toggleGarageSearch">
                                    <input 
                                        type="text" 
                                        :value="selectedGarage ? selectedGarage.displayText : ''"
                                        placeholder="Sélectionner un garage..."
                                        readonly
                                    >
                                    <i class="fas fa-search"></i>
                                    <button v-if="form.garageId" type="button" class="clear-btn" @click.stop="clearGarage">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div v-if="showGarageSearch" class="intervention-search-dropdown">
                                    <div class="intervention-results">
                                        <div 
                                            v-for="garage in filteredGarages" 
                                            :key="garage.id"
                                            @click="selectGarage(garage)"
                                            class="intervention-item"
                                        >
                                            <div class="intervention-code">{{ garage.name }}</div>
                                            <div class="intervention-name">{{ garage.address || 'Adresse non renseignée' }}</div>
                                        </div>
                                        <div v-if="filteredGarages.length === 0" class="intervention-no-results">
                                            Aucun garage trouvé
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            <div class="form-group">
                                <label>Type de travaux</label>
                                <select v-model="newLine.workType" class="form-control">
                                    <option v-for="option in workTypeOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group flex-2">
                                <label>Designation *</label>
                                <div class="supply-search-container" 
                                     ref="supplySearchContainer"
                                     :class="{ 'active': showSupplySearch }">
                                    <div class="supply-search-input" @click="toggleSupplySearch">
                                        <input 
                                            type="text" 
                                            :value="selectedSupply ? selectedSupply.displayText : ''"
                                            placeholder="Sélectionner une designation..."
                                            readonly
                                        >
                                        <i class="fas fa-search"></i>
                                        <button v-if="newLine.supplyId" type="button" class="clear-btn" @click.stop="clearSupply">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    
                                    <div v-if="showSupplySearch" class="supply-search-dropdown">
                                        <div class="supply-results">
                                            <div v-if="availableSupplies.length === 0" class="no-results">
                                                Aucune designation trouvée
                                            </div>
                                            <div v-else>
                                                <div v-for="supply in filteredSupplies" 
                                                     :key="supply.id"
                                                     class="supply-item"
                                                     @click="selectSupply(supply)">
                                                    <div class="supply-reference">{{ supply.reference }}</div>
                                                    <div class="supply-name">{{ supply.name }}</div>
                                                    <div class="supply-brand">{{ supply.brand || 'N/A' }}</div>
                                                    <div class="supply-price">{{ parseFloat(supply.unitPrice).toFixed(2) }} {{ currency }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Quantité</label>
                                <input 
                                    type="number" 
                                    v-model.number="newLine.quantity"
                                    @input="updateLineTotal()"
                                    min="1"
                                    step="1"
                                    class="form-control"
                                >
                            </div>
                            <div class="form-group">
                                <label>Prix unitaire ({{ currency }})</label>
                                <input 
                                    type="number" 
                                    v-model.number="newLine.unitPrice"
                                    @input="updateLineTotal()"
                                    min="0"
                                    step="0.01"
                                    class="form-control"
                                >
                            </div>
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
                    <div v-if="form.lines.length > 0" class="lines-list">
                        <div v-for="(line, index) in form.lines" :key="line.tempId || line.id" class="line-item">
                            <div class="line-content">
                                <div class="line-description">{{ getLineDisplayName(line) }}</div>
                                <div class="line-details">
                                    <span v-if="line.supplyReference && line.supplyReference.trim() !== ''" class="line-reference">{{ line.supplyReference }}</span>
                                    <span v-if="line.workType" class="line-work-type">
                                        {{ getWorkTypeLabel(line.workType) }}
                                    </span>
                                    <span class="line-quantity">{{ line.quantity }} × {{ parseFloat(line.unitPrice || line.effectiveUnitPrice || 0).toFixed(2) }} {{ currency }}</span>
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
                            <strong>Total: {{ parseFloat(form.totalAmount).toFixed(2) }} {{ currency }}</strong>
                        </div>
                    </div>
                    
                    <div v-else class="no-lines">
                        <i class="fas fa-list"></i>
                        <p>Aucune ligne ajoutée</p>
                    </div>
                </div>

                <!-- Section Détails financiers par type de travaux -->
                <div class="form-section" v-if="form.lines.length > 0">
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
                        
                        <!-- Divers -->
                        <div v-if="financialSummary.other.lines.length > 0" class="work-type-summary">
                            <div class="work-type-header">
                                <h4><i class="fas fa-ellipsis-h"></i> Divers</h4>
                                <span class="work-type-total">{{ financialSummary.other.total.toFixed(2) }} {{ currency }}</span>
                            </div>
                            <div class="work-type-details">
                                <span class="line-count">{{ financialSummary.other.lines.length }} ligne(s)</span>
                            </div>
                        </div>
                        
                        <!-- Total général -->
                        <div class="total-summary">
                            <div class="total-header">
                                <h3><i class="fas fa-calculator"></i> Total général</h3>
                                <span class="total-amount">{{ financialSummary.total.toFixed(2) }} {{ currency }}</span>
                            </div>
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
            
            <!-- Modal OCR -->
            <OCRProcessor 
                v-if="showOCR"
                entity-type="intervention_quote"
                @data-extracted="handleOCRDataExtracted"
                @close="closeOCR"
            />
        </div>
    `
};
