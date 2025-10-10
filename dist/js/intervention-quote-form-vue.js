const InterventionQuoteForm = {
    props: {
        mode: {
            type: String,
            default: 'create', // 'create' ou 'edit'
            validator: value => ['create', 'edit'].includes(value)
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
                lines: [],
                isValidated: false
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
            currency: 'FCFA', // Devise par défaut, sera chargée depuis les paramètres
            newLine: {
                supplyId: null,
                workType: '',
                quantity: 1,
                unitPrice: 0,
                discountType: 'percentage',
                discountValue: 0,
                taxRate: 0
            },
            priceSuggestion: null,
            loadingSuggestion: false,
            availableSupplies: [],
            selectedSupply: null,
            showSupplySearch: false,
            availableGarages: [],
            selectedGarage: null,
            showGarageSearch: false,
            showOCR: false,
            attachments: [],
            isDragOver: false,
            linkedAuthorizations: [],
            linkedInvoices: [],
            canCancelValidation: false
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
        
        isCreateMode() {
            return this.mode === 'create';
        },
        
        isFormValid() {
            const isValid = this.form.interventionId && 
                   this.form.quoteDate && 
                   this.form.validUntil &&
                   this.form.totalAmount && 
                   parseFloat(this.form.totalAmount) > 0;
            
            console.log('=== VALIDATION FORMULAIRE ===');
            console.log('interventionId:', this.form.interventionId);
            console.log('quoteDate:', this.form.quoteDate);
            console.log('validUntil:', this.form.validUntil);
            console.log('totalAmount:', this.form.totalAmount);
            console.log('parseFloat(totalAmount):', parseFloat(this.form.totalAmount));
            console.log('isValid:', isValid);
            
            return isValid;
        },
        
        isReadOnly() {
            return this.isEditMode && this.form.isValidated;
        },
        
        canModify() {
            return !this.isReadOnly;
        },
        
        statusMessage() {
            if (this.form.isValidated) {
                return 'Ce devis est validé et ne peut plus être modifié';
            }
            return '';
        },
        
        calculatedTotals() {
            // Calculer le coût main d'œuvre (somme des lignes de type 'labor')
            const laborCost = this.form.lines.reduce((sum, line) => {
                if (line.workType === 'labor') {
                    let lineHT = parseFloat(line.quantity) * parseFloat(line.unitPrice);
                    
                    // Appliquer les remises
                    if (line.discountType === 'percentage' && line.discountValue > 0) {
                        lineHT = lineHT * (1 - line.discountValue / 100);
                    } else if (line.discountType === 'amount' && line.discountValue > 0) {
                        lineHT = lineHT - line.discountValue;
                    }
                    
                    return sum + lineHT;
                }
                return sum;
            }, 0);
            
            // Calculer le coût pièces (somme des lignes de type 'supply')
            const partsCost = this.form.lines.reduce((sum, line) => {
                if (line.workType === 'supply') {
                    let lineHT = parseFloat(line.quantity) * parseFloat(line.unitPrice);
                    
                    // Appliquer les remises
                    if (line.discountType === 'percentage' && line.discountValue > 0) {
                        lineHT = lineHT * (1 - line.discountValue / 100);
                    } else if (line.discountType === 'amount' && line.discountValue > 0) {
                        lineHT = lineHT - line.discountValue;
                    }
                    
                    return sum + lineHT;
                }
                return sum;
            }, 0);
            
            // Calculer le coût autres (somme des lignes de type 'other')
            const otherCost = this.form.lines.reduce((sum, line) => {
                if (line.workType === 'other') {
                    let lineHT = parseFloat(line.quantity) * parseFloat(line.unitPrice);
                    
                    // Appliquer les remises
                    if (line.discountType === 'percentage' && line.discountValue > 0) {
                        lineHT = lineHT * (1 - line.discountValue / 100);
                    } else if (line.discountType === 'amount' && line.discountValue > 0) {
                        lineHT = lineHT - line.discountValue;
                    }
                    
                    return sum + lineHT;
                }
                return sum;
            }, 0);
            
            // Calculer le total HT (lignes + coûts additionnels)
            const linesTotalHT = this.form.lines.reduce((sum, line) => {
                // Pour chaque ligne, calculer le montant HT (avant TVA)
                let lineHT = parseFloat(line.quantity) * parseFloat(line.unitPrice);
                
                // Appliquer les remises
                if (line.discountPercentage > 0) {
                    lineHT = lineHT * (1 - line.discountPercentage / 100);
                } else if (line.discountAmount > 0) {
                    lineHT = lineHT - line.discountAmount;
                }
                
                return sum + lineHT;
            }, 0);
            
            const totalHT = linesTotalHT;
            
            // Calculer la TVA totale
            const totalTaxAmount = this.form.lines.reduce((sum, line) => {
                let lineHT = parseFloat(line.quantity) * parseFloat(line.unitPrice);
                
                // Appliquer les remises
                if (line.discountPercentage > 0) {
                    lineHT = lineHT * (1 - line.discountPercentage / 100);
                } else if (line.discountAmount > 0) {
                    lineHT = lineHT - line.discountAmount;
                }
                
                // Calculer la TVA sur cette ligne
                const lineTax = lineHT * (parseFloat(line.taxRate) || 0) / 100;
                return sum + lineTax;
            }, 0);
            
            const totalTTC = totalHT + totalTaxAmount;
            
            return {
                laborCost: laborCost.toFixed(2),
                partsCost: partsCost.toFixed(2),
                otherCost: otherCost.toFixed(2),
                totalHT: totalHT.toFixed(2),
                taxAmount: totalTaxAmount.toFixed(2),
                totalTTC: totalTTC.toFixed(2)
            };
        },
        
        isPriceOutOfRange() {
            if (!this.priceSuggestion || !this.newLine.unitPrice || this.newLine.unitPrice == 0) {
                return false;
            }
            
            const price = parseFloat(this.newLine.unitPrice);
            const avg = this.priceSuggestion.averagePrice;
            
            if (!avg) return false;
            
            const deviation = Math.abs(((price - avg) / avg) * 100);
            return deviation > 20; // Alerte si écart > 20%
        },
        
        priceDeviationText() {
            if (!this.priceSuggestion || !this.newLine.unitPrice) {
                return '';
            }
            
            const price = parseFloat(this.newLine.unitPrice);
            const avg = this.priceSuggestion.averagePrice;
            
            if (!avg) return '';
            
            const deviation = ((price - avg) / avg) * 100;
            const absDeviation = Math.abs(deviation);
            
            if (deviation > 0) {
                return `supérieur de +${absDeviation.toFixed(0)}%`;
            } else {
                return `inférieur de -${absDeviation.toFixed(0)}%`;
            }
        }
    },
    
    methods: {
        goBack() {
            window.history.back();
        },
        
        openOCR() {
            this.showOCR = true;
        },
        
        showNotification(message, type = 'info') {
            if (window.notificationService) {
                window.notificationService.show(message, type);
                } else {
                alert(message);
            }
        },
        
        confirmAction(message) {
            if (window.confirmationServiceV2) {
                return window.confirmationServiceV2.confirm(message);
                } else {
                return confirm(message);
            }
        },
        
        formatDateForInput(date) {
            return date.toISOString().split('T')[0];
        },
        
        initializeDefaultDates() {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7); // 7 jours plus tard
            
            // Date de devis = aujourd'hui
            this.form.quoteDate = this.formatDateForInput(today);
            
            // Date de validité = dans 7 jours
            this.form.validUntil = this.formatDateForInput(nextWeek);
            
            // Date de réception = aujourd'hui (optionnel)
            this.form.receivedDate = this.formatDateForInput(today);
            
            console.log('Dates initialisées:', {
                quoteDate: this.form.quoteDate,
                validUntil: this.form.validUntil,
                receivedDate: this.form.receivedDate
            });
        },
        
        
        selectIntervention(intervention) {
            if (intervention) {
            this.selectedIntervention = intervention;
            this.form.interventionId = intervention.id;
                this.showInterventionSearch = false;
            } else {
                this.selectedIntervention = null;
                this.form.interventionId = null;
            }
        },
        
        selectGarage(garage) {
            if (garage) {
            this.selectedGarage = garage;
            this.form.garageId = garage.id;
                this.showGarageSearch = false;
            } else {
                this.selectedGarage = null;
                this.form.garageId = null;
            }
        },
        
        clearIntervention() {
            this.selectIntervention(null);
        },
        
        clearGarage() {
            this.selectGarage(null);
        },
        
        getStatusLabel(status) {
            const statusLabels = {
                'pending': 'En attente',
                'in-progress': 'En cours',
                'completed': 'Terminée',
                'cancelled': 'Annulée',
                'on-hold': 'En pause'
            };
            return statusLabels[status] || status;
        },
        
        getWorkTypeLabel(workType) {
            const workTypeLabels = {
                'labor': 'Main d\'œuvre',
                'supply': 'Pièce',
                'other': 'Autre'
            };
            return workTypeLabels[workType] || workType;
        },
        
        onInterventionChange() {
            if (this.selectedIntervention) {
                this.form.interventionId = this.selectedIntervention.id;
            } else {
                this.form.interventionId = null;
            }
        },
        
        onGarageChange() {
            if (this.selectedGarage) {
                this.form.garageId = this.selectedGarage.id;
            } else {
                this.form.garageId = null;
            }
        },
        
        async saveQuote() {
            if (!this.isFormValid) {
                this.showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
                return;
            }
            
            this.saving = true;
            
            try {
                console.log('=== SAUVEGARDE DEVIS ===');
                console.log('Données du formulaire:', this.form);
                
                // Préparer les données pour l'envoi
                const quoteData = {
                    interventionId: this.form.interventionId,
                    garageId: this.form.garageId,
                    quoteDate: this.form.quoteDate,
                    validUntil: this.form.validUntil,
                    receivedDate: this.form.receivedDate || null,
                    totalAmount: this.form.totalAmount,
                    laborCost: this.calculatedTotals.laborCost,
                    partsCost: this.calculatedTotals.partsCost,
                    taxAmount: this.calculatedTotals.taxAmount,
                    notes: this.form.notes,
                    lines: this.form.lines.map(line => ({
                        supplyId: line.supplyId,
                        workType: line.workType,
                        lineNumber: line.lineNumber,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discountPercentage: line.discountType === 'percentage' ? line.discountValue : null,
                        discountAmount: line.discountType === 'amount' ? line.discountValue : null,
                        taxRate: line.taxRate,
                        lineTotal: line.lineTotal
                    }))
                };
                
                console.log('Données préparées:', quoteData);
                
                // Attendre que l'API soit disponible
                let attempts = 0;
                while (!window.apiService && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.apiService) {
                    throw new Error('ApiService non disponible');
                }
                
                // Envoyer les données au backend
                let endpoint, method, successMessage;
                
                if (this.isEditMode && this.form.id) {
                    // Mode édition : PUT
                    endpoint = `/intervention-quotes/${this.form.id}`;
                    method = 'PUT';
                    successMessage = 'Devis modifié avec succès';
                } else {
                    // Mode création : POST
                    endpoint = '/intervention-quotes';
                    method = 'POST';
                    successMessage = 'Devis créé avec succès';
                }
                
                const response = await window.apiService.request(endpoint, {
                    method: method,
                    body: JSON.stringify(quoteData),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Réponse du serveur:', response);
                
                if (response.success) {
                    this.showNotification(successMessage, 'success');
                    
                    // Charger les pièces jointes après création/modification
                    if (response.data && response.data.id) {
                        this.form.id = response.data.id;
                        await this.loadAttachments();
                    }
                    
                    // Rediriger vers la liste des devis
                    setTimeout(() => {
                        window.location.href = '/intervention-quotes.html';
                    }, 1500);
                } else {
                    throw new Error(response.message || `Erreur lors de la ${this.isEditMode ? 'modification' : 'création'} du devis`);
                }
                
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification(`Erreur lors de la ${this.isEditMode ? 'modification' : 'création'} du devis: ` + error.message, 'error');
            } finally {
                this.saving = false;
            }
        },
        
        debugButtonClick(event) {
            console.log('=== CLIC BOUTON DEBUG ===');
            console.log('Event:', event);
            console.log('isFormValid:', this.isFormValid);
            console.log('saving:', this.saving);
            console.log('Button disabled:', !this.isFormValid || this.saving);
            
            if (!this.isFormValid) {
                console.log('Formulaire non valide - bouton désactivé');
                return;
            }
            
            if (this.saving) {
                console.log('Sauvegarde en cours - bouton désactivé');
                return;
            }
            
            console.log('Appel de saveQuote...');
            this.saveQuote();
        },
        
        async loadQuoteData() {
            if (!this.isEditMode || !this.quoteId) {
                return;
            }

            try {
                console.log('=== CHARGEMENT DONNEES DEVIS ===');
                console.log('Quote ID:', this.quoteId);
                
                // Attendre que l'API soit disponible
                let attempts = 0;
                while (!window.apiService && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.apiService) {
                    throw new Error('ApiService non disponible');
                }
                
                // Charger les données du devis
                const response = await window.apiService.request(`/intervention-quotes/${this.quoteId}`);
                console.log('Réponse du serveur:', response);
                
                if (response.success && response.data) {
                    const quoteData = response.data;
                    
                    // Remplir le formulaire avec les données
                    this.form.id = quoteData.id;
                    this.form.interventionId = quoteData.interventionId;
                    this.form.garageId = quoteData.garageId;
                    this.form.quoteDate = quoteData.quoteDate ? quoteData.quoteDate.split(' ')[0] : '';
                    this.form.validUntil = quoteData.validUntil ? quoteData.validUntil.split(' ')[0] : '';
                    this.form.receivedDate = quoteData.receivedDate ? quoteData.receivedDate.split(' ')[0] : '';
                    this.form.totalAmount = quoteData.totalAmount || '0.00';
                    this.form.laborCost = quoteData.laborCost || '';
                    this.form.partsCost = quoteData.partsCost || '';
                    this.form.taxAmount = quoteData.taxAmount || '';
                    this.form.notes = quoteData.notes || '';
                    this.form.isValidated = quoteData.isValidated || false;
                    
                    // Charger les lignes du devis
                    if (quoteData.lines && Array.isArray(quoteData.lines)) {
                        this.form.lines = quoteData.lines.map(line => ({
                            id: line.id,
                            supplyId: line.supplyId,
                            workType: line.workType,
                            lineNumber: line.lineNumber,
                            quantity: line.quantity,
                            unitPrice: line.unitPrice,
                            discountType: line.discountPercentage ? 'percentage' : (line.discountAmount ? 'amount' : 'none'),
                            discountValue: line.discountPercentage || line.discountAmount || 0,
                            taxRate: line.taxRate || 0,
                            lineTotal: line.lineTotal
                        }));
                    }
                    
                    // Charger les détails de l'intervention sélectionnée
                    if (quoteData.interventionId) {
                        await this.loadInterventionDetails(quoteData.interventionId);
                    }
                    
                    // Charger les détails du garage sélectionné
                    if (quoteData.garageId) {
                        await this.loadGarageDetails(quoteData.garageId);
                    }
                    
                    // Charger les liens avec les accords et factures
                    await this.loadQuoteLinks();
                    
                    console.log('Données du devis chargées:', this.form);
                } else {
                    throw new Error(response.message || 'Erreur lors du chargement du devis');
                }
                
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                this.showNotification('Erreur lors du chargement du devis: ' + error.message, 'error');
            }
        },
        
        async loadQuoteLinks() {
            if (!this.form.id) return;
            
            try {
                // Charger les autorisations liées
                const authResponse = await window.apiService.request(`/intervention-work-authorizations?quoteId=${this.form.id}`);
                if (authResponse.success) {
                    this.linkedAuthorizations = authResponse.data || [];
                }
                
                // Charger les factures liées
                const invoiceResponse = await window.apiService.request(`/intervention-invoices?quoteId=${this.form.id}`);
                if (invoiceResponse.success) {
                    this.linkedInvoices = invoiceResponse.data || [];
                }
                
                // Déterminer si on peut annuler la validation
                this.canCancelValidation = this.form.isValidated && this.linkedAuthorizations.length === 0 && this.linkedInvoices.length === 0;
                
            } catch (error) {
                console.error('Erreur lors du chargement des liens:', error);
            }
        },
        
        
        async cancelValidation() {
            if (!this.canCancelValidation) return;
            
            const confirmed = await this.confirmAction('Êtes-vous sûr de vouloir annuler la validation de ce devis ?');
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-quotes/${this.form.id}/cancel-validation`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showNotification('Validation annulée avec succès', 'success');
                    this.form.isValidated = false;
                    this.canCancelValidation = false;
                } else {
                    this.showNotification(response.message || 'Erreur lors de l\'annulation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'annulation de la validation:', error);
                this.showNotification('Erreur lors de l\'annulation de la validation', 'error');
            }
        },
        
        
        async validateQuote() {
            if (!this.form.id) return;
            
            const confirmed = await this.confirmAction('Êtes-vous sûr de vouloir valider ce devis ?');
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-quotes/${this.form.id}/validate`, {
                    method: 'POST',
                    body: JSON.stringify({
                        validatedBy: 1 // ID de l'utilisateur actuel - à récupérer dynamiquement
                    })
                });
                
                if (response.success) {
                    this.showNotification('Devis validé avec succès', 'success');
                    this.form.isValidated = true;
                    this.canCancelValidation = true;
                    // Recharger les données pour mettre à jour l'interface
                    await this.loadQuoteData();
                } else {
                    this.showNotification(response.message || 'Erreur lors de la validation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la validation:', error);
                this.showNotification('Erreur lors de la validation du devis', 'error');
            }
        },
        
        async loadInterventionDetails(interventionId) {
            try {
                const response = await window.apiService.request(`/vehicle-interventions/${interventionId}`);
                if (response.success && response.data) {
                    this.selectedIntervention = {
                        id: response.data.id,
                        code: response.data.interventionNumber,
                        title: response.data.title,
                        vehicle: {
                            brand: response.data.vehicle?.brand?.name || '',
                            model: response.data.vehicle?.model?.name || '',
                            plateNumber: response.data.vehicle?.plateNumber || ''
                        },
                        status: response.data.status,
                        description: response.data.description,
                        displayText: `${response.data.interventionNumber} - ${response.data.title}`
                    };
                }
            } catch (error) {
                console.error('Erreur lors du chargement des détails de l\'intervention:', error);
            }
        },
        
        async loadGarageDetails(garageId) {
            try {
                const response = await window.apiService.request(`/garages/admin/${garageId}`);
                if (response.success && response.data) {
                    this.selectedGarage = {
                        id: response.data.id,
                        name: response.data.name,
                        address: response.data.address,
                        phone: response.data.phone,
                        email: response.data.email,
                        contactPerson: response.data.contactPerson,
                        displayText: `${response.data.name} - ${response.data.address}`
                    };
                }
            } catch (error) {
                console.error('Erreur lors du chargement des détails du garage:', error);
            }
        },
        
        // Méthodes pour la gestion des pièces jointes
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

            for (const file of files) {
                await this.uploadFile(file);
            }
        },

        async uploadFile(file) {
            try {
                const result = await window.fileUploadService.uploadFile(
                    file, 
                    'intervention_quote', 
                    this.form.id
                );
                
                this.showNotification(result.message, 'success');
                await this.loadAttachments();
            } catch (error) {
                console.error('Erreur upload:', error);
                this.showNotification(error.message, 'error');
            }
        },

        async loadAttachments() {
            if (!this.isEditMode || !this.form.id) return;
            
            // Vérifier que le service est disponible
            if (!window.fileUploadService) {
                console.warn('FileUploadService non disponible');
                return;
            }
            
            try {
                this.attachments = await window.fileUploadService.getFiles('intervention_quote', this.form.id);
            } catch (error) {
                console.error('Erreur lors du chargement des pièces jointes:', error);
            }
        },

        async downloadAttachment(attachment) {
            try {
                await window.fileUploadService.downloadFile(
                    'intervention_quote', 
                    this.form.id, 
                    attachment.id
                );
            } catch (error) {
                console.error('Erreur lors du téléchargement:', error);
                this.showNotification('Erreur lors du téléchargement du fichier', 'error');
            }
        },

        async deleteAttachment(attachment) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                return;
            }
            
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
        
        // Méthodes pour la gestion des lignes de devis
        addLine() {
            if (!this.selectedSupply || !this.newLine.workType || !this.newLine.quantity || !this.newLine.unitPrice) {
                if (!this.selectedSupply) {
                    this.showNotification('Veuillez sélectionner une désignation', 'warning');
                } else if (!this.newLine.workType) {
                    this.showNotification('Veuillez sélectionner un type de travail', 'warning');
                } else if (!this.newLine.quantity) {
                    this.showNotification('Veuillez saisir une quantité', 'warning');
                } else if (!this.newLine.unitPrice) {
                    this.showNotification('Veuillez saisir un prix unitaire', 'warning');
                }
                return;
            }
            
            const quantity = parseFloat(this.newLine.quantity);
            const unitPrice = parseFloat(this.newLine.unitPrice);
            const discountValue = parseFloat(this.newLine.discountValue) || 0;
            const taxRate = parseFloat(this.newLine.taxRate) || 0;
            
            // Calculer le total de la ligne
            let lineTotal = quantity * unitPrice;
            
            console.log('Calcul ligne:', {
                quantity,
                unitPrice,
                lineTotalAvantRemise: lineTotal,
                discountType: this.newLine.discountType,
                discountValue,
                taxRate
            });
            
            // Appliquer la remise selon le type
            if (this.newLine.discountType === 'percentage' && discountValue > 0) {
                lineTotal = lineTotal * (1 - discountValue / 100);
                console.log('Après remise %:', lineTotal);
            } else if (this.newLine.discountType === 'amount' && discountValue > 0) {
                lineTotal = lineTotal - discountValue;
                console.log('Après remise montant:', lineTotal);
            }
            
            // Appliquer la TVA
            if (taxRate > 0) {
                lineTotal = lineTotal * (1 + taxRate / 100);
                console.log('Après TVA:', lineTotal);
            }
            
            console.log('Total ligne final:', lineTotal);
            
            const line = {
                id: Date.now(), // ID temporaire
                supply: this.selectedSupply,
                supplyId: this.selectedSupply.id,
                workType: this.newLine.workType,
                quantity: quantity,
                unitPrice: unitPrice,
                discountType: this.newLine.discountType,
                discountValue: discountValue,
                taxRate: taxRate,
                lineTotal: lineTotal
            };
            
            this.form.lines.push(line);
            this.resetNewLine();
            this.calculateTotal();
            console.log('Ligne ajoutée, nouveau total:', this.form.totalAmount);
        },
        
        removeLine(index) {
            this.form.lines.splice(index, 1);
            this.calculateTotal();
        },
        
        resetNewLine() {
            this.newLine = {
                supplyId: null,
                workType: '',
                quantity: 1,
                unitPrice: 0,
                discountType: 'percentage',
                discountValue: 0,
                taxRate: 0
            };
            this.selectedSupply = null;
            this.priceSuggestion = null;
        },
        
        formatAmount(amount) {
            if (amount === null || amount === undefined) return '0';
            return Number(amount).toLocaleString('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },
        
        formatShortDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short'
            });
        },
        
        getConfidenceLabel(confidence) {
            const labels = {
                'high': 'Élevée',
                'medium': 'Moyenne',
                'low': 'Faible',
                'none': 'Aucune'
            };
            return labels[confidence] || 'N/A';
        },
        
        getConfidenceClass(confidence) {
            const classes = {
                'high': 'text-success',
                'medium': 'text-warning',
                'low': 'text-warning',
                'none': 'text-muted'
            };
            return classes[confidence] || 'text-muted';
        },
        
        calculateTotal() {
            console.log('=== CALCUL TOTAL ===');
            
            let total = 0;
            
            // Calculer le total des lignes (incluant déjà les remises et TVA)
            const linesTotal = this.form.lines.reduce((sum, line) => {
                const lineTotal = parseFloat(line.lineTotal) || 0;
                console.log(`Ligne ${line.id}: ${lineTotal}`);
                return sum + lineTotal;
            }, 0);
            
            console.log('Total lignes:', linesTotal);
            
            // Ajouter les coûts de main d'œuvre et pièces si spécifiés
            const laborCost = parseFloat(this.form.laborCost) || 0;
            const partsCost = parseFloat(this.form.partsCost) || 0;
            const taxAmount = parseFloat(this.form.taxAmount) || 0;
            
            console.log('Coûts additionnels:', { laborCost, partsCost, taxAmount });
            
            total = linesTotal + laborCost + partsCost + taxAmount;
            
            // Mettre à jour le total automatiquement
            this.form.totalAmount = total.toFixed(2);
            
            console.log('Total final:', this.form.totalAmount);
            console.log('=== FIN CALCUL ===');
        },
        
        formatAmount(amount) {
            if (!amount) return `0,00 ${this.currency}`;
            return new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount) + ` ${this.currency}`;
        },
        
        removeLine(index) {
            this.form.lines.splice(index, 1);
            this.calculateTotal();
        },
        
        
        
        getWorkTypeLabel(workType) {
            const labels = {
                'labor': 'Main doeuvre',
                'supply': 'Fourniture',
                'other': 'Autre'
            };
            return labels[workType] || 'Autre';
        },
        
        goBack() {
            window.history.back();
        },
        
        onInterventionSearch(event) {
            const searchTerm = event.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadInterventions(searchTerm);
                }, 300);
            }
        },
        
        onGarageSearch(event) {
            const searchTerm = event.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadGarages(searchTerm);
                }, 300);
            }
        },
        
        toggleInterventionSearch() {
            this.showInterventionSearch = !this.showInterventionSearch;
            if (this.showInterventionSearch && (!this.availableInterventions || this.availableInterventions.length === 0)) {
                this.loadInterventions();
            }
            if (this.showInterventionSearch) {
                this.$nextTick(() => {
                    const searchInput = this.$refs.interventionSearchInput;
                    if (searchInput) {
                        searchInput.focus();
                    }
                });
            }
        },
        
        closeInterventionSearch() {
            this.showInterventionSearch = false;
        },
        
        toggleGarageSearch() {
            this.showGarageSearch = !this.showGarageSearch;
            if (this.showGarageSearch && (!this.availableGarages || this.availableGarages.length === 0)) {
                this.loadGarages();
            }
            if (this.showGarageSearch) {
                this.$nextTick(() => {
                    const searchInput = this.$refs.garageSearchInput;
                    if (searchInput) {
                        searchInput.focus();
                    }
                });
            }
        },
        
        closeGarageSearch() {
            this.showGarageSearch = false;
        },
        
        onSupplySearch(event) {
            const searchTerm = event.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadSupplies(searchTerm);
                }, 300);
            }
        },
        
        toggleSupplySearch() {
            this.showSupplySearch = !this.showSupplySearch;
            if (this.showSupplySearch && (!this.availableSupplies || this.availableSupplies.length === 0)) {
                this.loadSupplies();
            }
            if (this.showSupplySearch) {
                this.$nextTick(() => {
                    const searchInput = this.$refs.supplySearchInput;
                    if (searchInput) {
                        searchInput.focus();
                    }
                });
            }
        },
        
        closeSupplySearch() {
            this.showSupplySearch = false;
        },
        
        async selectSupply(supply) {
            this.selectedSupply = supply;
            this.newLine.supplyId = supply.id;
            this.newLine.unitPrice = supply.unitPrice;
            this.showSupplySearch = false;
            
            // Charger les suggestions de prix
            await this.loadPriceSuggestion();
        },
        
        async loadPriceSuggestion() {
            if (!this.selectedSupply || !this.selectedIntervention) {
                this.priceSuggestion = null;
                return;
            }
            
            this.loadingSuggestion = true;
            try {
                const vehicle = this.selectedIntervention.vehicle;
                const params = new URLSearchParams();
                params.append('supply', this.selectedSupply.id);
                if (vehicle.model && vehicle.model.id) {
                    params.append('model', vehicle.model.id);
                }
                params.append('description', this.selectedSupply.name);
                
                const response = await window.apiService.request(`/supply-prices/suggestion?${params.toString()}`);
                
                if (response.success && response.data.hasEnoughData) {
                    this.priceSuggestion = response.data;
                    
                    // Optionnel : pré-remplir avec le prix suggéré si le champ est vide ou = 0
                    if ((!this.newLine.unitPrice || this.newLine.unitPrice == 0) && response.data.averagePrice) {
                        this.newLine.unitPrice = response.data.averagePrice;
                    }
                } else {
                    this.priceSuggestion = null;
                }
            } catch (error) {
                console.warn('Impossible de charger les suggestions de prix:', error);
                this.priceSuggestion = null;
            } finally {
                this.loadingSuggestion = false;
            }
        },
        
        async loadSupplies(search = '') {
            try {
                const params = new URLSearchParams();
                params.append('limit', '20');
                if (search) {
                    params.append('search', search);
                }
                
                const response = await window.apiService.request(`/supplies?${params.toString()}`);
                if (response.success && response.data) {
                    const supplies = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    this.availableSupplies = supplies.map(supply => ({
                        ...supply,
                        displayText: `${supply.reference} - ${supply.name} (${supply.brand || 'N/A'}) - ${this.formatAmount(supply.unitPrice)}`
                    }));
                } else {
                    this.availableSupplies = [];
                    console.error('Erreur dans la réponse API:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des fournitures:', error);
                this.showNotification('Erreur lors du chargement des fournitures', 'error');
            }
        },
        
        async loadInterventions(search = '') {
            try {
                this.loading = true;
                
                // Attendre que ApiService soit disponible
                let attempts = 0;
                const maxAttempts = 50; // 5 secondes max
                
                while (!window.apiService && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.apiService) {
                    console.error('ApiService non disponible après 5 secondes');
                    throw new Error('ApiService non disponible');
                }
                
                const params = new URLSearchParams();
                params.append('limit', '20');
                if (search) {
                    params.append('search', search);
                }
                
                const response = await window.apiService.request(`/vehicle-interventions?${params.toString()}`);
                if (response.success && response.data) {
                    const interventions = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableInterventions = interventions.map(intervention => ({
                        ...intervention,
                        displayText: `${intervention.code || 'INT-' + intervention.id} - ${intervention.vehicle.brand?.name || ''} ${intervention.vehicle.model?.name || ''} (${intervention.vehicle.plateNumber}) - ${intervention.title}`
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
        
        async loadGarages(search = '') {
            try {
                // Attendre que ApiService soit disponible
                let attempts = 0;
                const maxAttempts = 50; // 5 secondes max
                
                while (!window.apiService && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.apiService) {
                    console.error('ApiService non disponible après 5 secondes');
                    throw new Error('ApiService non disponible');
                }
                
                const params = new URLSearchParams();
                params.append('limit', '20');
                if (search) {
                    params.append('search', search);
                }
                
                const response = await window.apiService.request(`/garages?${params.toString()}`);
                if (response.success && response.data) {
                    const garages = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    this.availableGarages = garages.map(garage => ({
                        ...garage,
                        displayText: `${garage.name} - ${garage.address || 'Adresse non renseignée'}`
                    }));
                } else {
                    this.availableGarages = [];
                    console.error('Erreur dans la réponse API:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des garages:', error);
                this.showNotification('Erreur lors du chargement des garages', 'error');
            }
        },
        
        async loadCurrency() {
            try {
                console.log('Chargement de la devise...');
                
                // Attendre que apiService soit disponible
                let attempts = 0;
                while (!window.apiService && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.apiService) {
                    console.warn('ApiService non disponible pour charger la devise');
                    return;
                }
                
                const response = await window.apiService.request('/parameters/currency');
                console.log('Devise chargée:', response);
                
                if (response.success && response.data && response.data.value) {
                    this.currency = response.data.value;
                    console.log('Devise mise à jour:', this.currency);
                }
                
            } catch (error) {
                console.error('Erreur lors du chargement de la devise:', error);
                // Garder la valeur par défaut
            }
        },
        
        
        getFilteredGarages(searchTerm) {
            const allGarages = [
                {
                    id: 1,
                    name: "Garage Central",
                    address: "123 Rue Principale",
                    displayText: "Garage Central - 123 Rue Principale"
                },
                {
                    id: 2,
                    name: "Auto Service Plus",
                    address: "456 Avenue du Commerce",
                    displayText: "Auto Service Plus - 456 Avenue du Commerce"
                },
                {
                    id: 3,
                    name: "Garage Moderne",
                    address: "789 Boulevard de la République",
                    displayText: "Garage Moderne - 789 Boulevard de la République"
                }
            ];
            
            if (!searchTerm) return allGarages;
            
            return allGarages.filter(garage => 
                garage.name.toLowerCase().includes(searchTerm) ||
                garage.address.toLowerCase().includes(searchTerm)
            );
        }
    },
    
    async mounted() {
        console.log("=== MOUNTED - InterventionQuoteForm ===");
        console.log("Mode:", this.mode);
        console.log("Vue version:", Vue.version);
        
        // Initialiser les dates par défaut pour le mode création
        if (this.isCreateMode) {
            this.initializeDefaultDates();
        }
        
        // Charger les données initiales depuis le serveur
        await this.loadCurrency();
        await this.loadInterventions('');
        await this.loadGarages('');
        await this.loadSupplies('');
        console.log("Available interventions:", this.availableInterventions.length);
        console.log("Available garages:", this.availableGarages.length);
        console.log("Available supplies:", this.availableSupplies.length);
        console.log("ApiService disponible pour intervention-quote-form");
        
        // Charger les données du devis si en mode édition
        if (this.isEditMode) {
            await this.loadQuoteData();
        }
        
        // Charger les pièces jointes si en mode édition
        if (this.isEditMode && this.form.id) {
            await this.loadAttachments();
        }
        
        // Calculer le total initial
        this.calculateTotal();
        
        // Test de réactivité
        setTimeout(() => {
            console.log("After timeout - interventions:", this.availableInterventions.length);
            console.log("After timeout - garages:", this.availableGarages.length);
        }, 1000);
        
        // Gestionnaire pour fermer les dropdowns en cliquant en dehors
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.intervention-search-container')) {
                this.closeInterventionSearch();
                this.closeGarageSearch();
            }
        });
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
                            <h1><i class="fas fa-file-invoice"></i> {{ isEditMode ? 'Modifier le Devis' : 'Créer un Devis' }}</h1>
                            <p>Gérer les devis d'intervention</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contenu du formulaire -->
            <!-- Message de statut -->
            <div v-if="isEditMode && statusMessage" class="status-message" :class="{ 'status-validated': form.isValidated }">
                <div class="status-content">
                    <i class="fas" :class="form.isValidated ? 'fa-check-circle' : 'fa-exclamation-triangle'"></i>
                    <span>{{ statusMessage }}</span>
                </div>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement...
            </div>
            
            <form v-else @submit.prevent="saveQuote" class="quote-form" :class="{ 'readonly': isReadOnly }">
                <!-- Section Informations générales -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-info-circle"></i> Informations générales</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="intervention-search">Intervention *</label>
                            <div class="intervention-search-container" :class="{ 'disabled': isReadOnly }">
                                <input 
                                    type="text" 
                                    id="intervention-search"
                                    :value="selectedIntervention ? selectedIntervention.displayText : ''"
                                    placeholder="Rechercher une intervention..."
                                    @click="!isReadOnly && toggleInterventionSearch()"
                                    @input="!isReadOnly && onInterventionSearch($event)"
                                    readonly
                                    :disabled="isReadOnly"
                                    required
                                    class="intervention-search-input"
                                    :class="{ 'disabled': isReadOnly }"
                                >
                                <button 
                                    type="button" 
                                    @click="!isReadOnly && toggleInterventionSearch()"
                                    class="intervention-search-toggle"
                                    :class="{ 'active': showInterventionSearch }"
                                    :disabled="isReadOnly"
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
                                            ref="interventionSearchInput"
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
                                                {{ intervention.vehicle.brand?.name }} {{ intervention.vehicle.model?.name }} ({{ intervention.vehicle.plateNumber }})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Informations détaillées de l'intervention sélectionnée -->
                            <div v-if="selectedIntervention" class="selected-item-details">
                                <div class="detail-section">
                                    <h4><i class="fas fa-info-circle"></i> Détails de l'intervention</h4>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <span class="detail-label">Code:</span>
                                            <span class="detail-value">{{ selectedIntervention.code || 'INT-' + selectedIntervention.id }}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Titre:</span>
                                            <span class="detail-value">{{ selectedIntervention.title || 'Non spécifié' }}</span>
                                        </div>
                                        <div v-if="selectedIntervention.vehicle" class="detail-item">
                                            <span class="detail-label">Véhicule:</span>
                                            <span class="detail-value">
                                                {{ selectedIntervention.vehicle.plateNumber || 'N/A' }} - 
                                                {{ selectedIntervention.vehicle.brand?.name || 'N/A' }} 
                                                {{ selectedIntervention.vehicle.model?.name || 'N/A' }}
                                            </span>
                                        </div>
                                        <div v-if="selectedIntervention.status" class="detail-item">
                                            <span class="detail-label">Statut:</span>
                                            <span class="detail-value status-badge" :class="'status-' + selectedIntervention.status">
                                                {{ getStatusLabel(selectedIntervention.status) }}
                                            </span>
                                        </div>
                                        <div v-if="selectedIntervention.description" class="detail-item full-width">
                                            <span class="detail-label">Description:</span>
                                            <span class="detail-value">{{ selectedIntervention.description }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="garage-search">Garage</label>
                            <div class="intervention-search-container">
                                <input 
                                    type="text" 
                                    id="garage-search"
                                    :value="selectedGarage ? selectedGarage.displayText : ''"
                                    placeholder="Rechercher un garage..."
                                    @click="toggleGarageSearch"
                                    @input="onGarageSearch"
                                    readonly
                                    class="intervention-search-input"
                                >
                                <button 
                                    type="button" 
                                    @click="toggleGarageSearch"
                                    class="intervention-search-toggle"
                                    :class="{ 'active': showGarageSearch }"
                                >
                                    <i class="fas fa-search"></i>
                                </button>
                                
                                <div v-if="showGarageSearch" class="intervention-search-dropdown">
                                    <div class="search-input-container">
                                        <input 
                                            type="text" 
                                            placeholder="Tapez pour rechercher..."
                                            @input="onGarageSearch"
                                            class="search-input"
                                            ref="garageSearchInput"
                                        >
                                    </div>
                                    <div class="intervention-results">
                                        <div v-if="loading" class="loading-message">
                                            <i class="fas fa-spinner fa-spin"></i> Chargement...
                                        </div>
                                        <div v-else-if="availableGarages.length === 0" class="no-results">
                                            Aucun garage trouvé
                                        </div>
                                        <div 
                                            v-else
                                            v-for="garage in availableGarages" 
                                            :key="garage.id"
                                            @click="selectGarage(garage)"
                                            class="intervention-result-item"
                                        >
                                            <div class="intervention-code">{{ garage.name }}</div>
                                            <div class="intervention-title">{{ garage.address }}</div>
                                            <div v-if="garage.phone" class="intervention-vehicle">{{ garage.phone }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Informations détaillées du garage sélectionné -->
                            <div v-if="selectedGarage" class="selected-item-details">
                                <div class="detail-section">
                                    <h4><i class="fas fa-building"></i> Détails du garage</h4>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <span class="detail-label">Nom:</span>
                                            <span class="detail-value">{{ selectedGarage.name }}</span>
                                        </div>
                                        <div v-if="selectedGarage.address" class="detail-item">
                                            <span class="detail-label">Adresse:</span>
                                            <span class="detail-value">{{ selectedGarage.address }}</span>
                                        </div>
                                        <div v-if="selectedGarage.phone" class="detail-item">
                                            <span class="detail-label">Téléphone:</span>
                                            <span class="detail-value">{{ selectedGarage.phone }}</span>
                                        </div>
                                        <div v-if="selectedGarage.email" class="detail-item">
                                            <span class="detail-label">Email:</span>
                                            <span class="detail-value">{{ selectedGarage.email }}</span>
                                        </div>
                                        <div v-if="selectedGarage.contactPerson" class="detail-item">
                                            <span class="detail-label">Contact:</span>
                                            <span class="detail-value">{{ selectedGarage.contactPerson }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section Dates -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-calendar-alt"></i> Dates</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="quoteDate">Date de devis *</label>
                            <input 
                                type="date" 
                                id="quoteDate"
                                v-model="form.quoteDate"
                                :disabled="isReadOnly"
                                :readonly="isReadOnly"
                                required
                                class="form-control"
                                :class="{ 'readonly': isReadOnly }"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="validUntil">Valide jusqu'au *</label>
                            <input 
                                type="date" 
                                id="validUntil"
                                v-model="form.validUntil"
                                :disabled="isReadOnly"
                                :readonly="isReadOnly"
                                required
                                class="form-control"
                                :class="{ 'readonly': isReadOnly }"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="receivedDate">Date de réception</label>
                            <input 
                                type="date" 
                                id="receivedDate"
                                v-model="form.receivedDate"
                                :disabled="isReadOnly"
                                :readonly="isReadOnly"
                                class="form-control"
                                :class="{ 'readonly': isReadOnly }"
                            >
                        </div>
                    </div>
                </div>


                <!-- Section Lignes de devis -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-list"></i> Lignes de devis</h3>
                    </div>
                    
                    <!-- Ajouter une nouvelle ligne -->
                    <div class="new-line-form" v-if="true">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type de travail *</label>
                                <select 
                                    v-model="newLine.workType"
                                    required
                                    class="form-control"
                                >
                                    <option value="">Sélectionner un type...</option>
                                    <option value="labor">Main d'œuvre</option>
                                    <option value="supply">Fourniture</option>
                                    <option value="other">Autre</option>
            </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Désignation *</label>
                                <div class="intervention-search-container">
                                    <input 
                                        type="text" 
                                        :value="selectedSupply ? selectedSupply.displayText : ''"
                                        placeholder="Rechercher une fourniture..."
                                        @click="toggleSupplySearch"
                                        @input="onSupplySearch"
                                        readonly
                                        required
                                        class="intervention-search-input"
                                    >
                                    <button 
                                        type="button" 
                                        @click="toggleSupplySearch"
                                        class="intervention-search-toggle"
                                        :class="{ 'active': showSupplySearch }"
                                    >
                                        <i class="fas fa-search"></i>
                                    </button>
                                    
                                    <div v-if="showSupplySearch" class="intervention-search-dropdown">
                                        <div class="search-input-container">
                                            <input 
                                                type="text" 
                                                placeholder="Tapez pour rechercher..."
                                                @input="onSupplySearch"
                                                class="search-input"
                                                ref="supplySearchInput"
                                            >
                                        </div>
                                        <div class="intervention-results">
                                            <div v-if="loading" class="loading-message">
                                                <i class="fas fa-spinner fa-spin"></i> Chargement...
                                            </div>
                                            <div v-else-if="availableSupplies.length === 0" class="no-results">
                                                Aucune fourniture trouvée
                                            </div>
                                            <div 
                                                v-else
                                                v-for="supply in availableSupplies" 
                                                :key="supply.id"
                                                @click="selectSupply(supply)"
                                                class="intervention-result-item"
                                            >
                                                <div class="intervention-code">{{ supply.reference }}</div>
                                                <div class="intervention-title">{{ supply.name }}</div>
                                                <div class="intervention-vehicle">
                                                    {{ supply.brand || '' }} - {{ formatAmount(supply.unitPrice) }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Quantité *</label>
                                <input 
                                    type="number" 
                                    v-model="newLine.quantity"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    class="form-control"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label>Prix unitaire *</label>
                                <input 
                                    type="number" 
                                    v-model="newLine.unitPrice"
                                    step="0.01"
                                    min="0"
                                    required
                                    class="form-control"
                                    :class="{'field-warning': isPriceOutOfRange}"
                                >
                                
                                <!-- Suggestions de prix -->
                                <div v-if="loadingSuggestion" style="margin-top: 8px; font-size: 12px; color: #6c757d;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    Chargement des prix...
                                </div>
                                
                                <div v-else-if="priceSuggestion" style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #0d6efd;">
                                    <div style="font-weight: 600; margin-bottom: 8px; color: #0d6efd;">
                                        <i class="fas fa-info-circle"></i>
                                        Historique des prix ({{ priceSuggestion.sampleSize }} enregistrements)
                                    </div>
                                    
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                                        <div>
                                            <strong>Prix moyen :</strong>
                                            <span style="color: #198754; font-weight: 600;">
                                                {{ formatAmount(priceSuggestion.averagePrice) }} {{ currency }}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>Fourchette :</strong>
                                            {{ formatAmount(priceSuggestion.minPrice) }} - {{ formatAmount(priceSuggestion.maxPrice) }} {{ currency }}
                                        </div>
                                        <div v-if="priceSuggestion.lastPrice">
                                            <strong>Dernier prix :</strong>
                                            {{ formatAmount(priceSuggestion.lastPrice.price) }} {{ currency }}
                                            <small>({{ formatShortDate(priceSuggestion.lastPrice.date) }})</small>
                                        </div>
                                        <div>
                                            <strong>Confiance :</strong>
                                            <span :class="getConfidenceClass(priceSuggestion.confidence)">
                                                {{ getConfidenceLabel(priceSuggestion.confidence) }}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div v-if="isPriceOutOfRange" style="margin-top: 8px; padding: 8px; background: #fff3cd; border-radius: 4px; color: #856404; font-size: 12px;">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <strong>Attention :</strong> Le prix saisi ({{ formatAmount(newLine.unitPrice) }} {{ currency }}) est 
                                        <strong>{{ priceDeviationText }}</strong> par rapport à la moyenne.
                                    </div>
                                    
                                    <div v-if="priceSuggestion.lastPrice && priceSuggestion.lastPrice.garage" style="margin-top: 6px; font-size: 11px; color: #6c757d;">
                                        <i class="fas fa-store"></i>
                                        Dernier fournisseur : {{ priceSuggestion.lastPrice.garage }}
                                    </div>
                                </div>
                                
                                <div v-else-if="selectedSupply && selectedIntervention && !loadingSuggestion" style="margin-top: 8px; font-size: 12px; color: #6c757d;">
                                    <i class="fas fa-info-circle"></i>
                                    Pas d'historique disponible pour cette pièce et ce modèle
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type de remise</label>
                                <select v-model="newLine.discountType" class="form-control">
                                    <option value="">Aucune remise</option>
                                    <option value="percentage">Remise en %</option>
                                    <option value="amount">Remise en montant</option>
            </select>
                            </div>
                            
                            <div class="form-group" v-if="newLine.discountType">
                                <label>{{ newLine.discountType === 'percentage' ? 'Remise (%)' : 'Montant remise' }}</label>
                                <input 
                                    type="number" 
                                    v-model="newLine.discountValue"
                                    step="0.01"
                                    min="0"
                                    :max="newLine.discountType === 'percentage' ? 100 : null"
                                    class="form-control"
                                    :placeholder="newLine.discountType === 'percentage' ? 'Ex: 10' : 'Ex: 500'"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label>Taux TVA (%)</label>
                                <input 
                                    type="number" 
                                    v-model="newLine.taxRate"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    class="form-control"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label>&nbsp;</label>
                                <button type="button" @click="addLine" class="btn btn-primary" :disabled="isReadOnly">
                                    <i class="fas fa-plus"></i>
                                    Ajouter
                                </button>
                            </div>
                        </div>
                        </div>
                        
                    </div>
                    
                    <!-- Liste des lignes -->
                    <div class="lines-list" v-if="form.lines.length > 0">
                        <div class="line-item" v-for="(line, index) in form.lines" :key="line.id">
                            <div class="line-content">
                                <div class="line-header">
                                    <div class="line-supply">{{ line.supply?.name || 'Fourniture' }}</div>
                                    <div class="line-reference">{{ line.supply?.reference || '' }}</div>
                                </div>
                                <div class="line-work-type">{{ getWorkTypeLabel(line.workType) }}</div>
                                <div class="line-details">
                                    <span class="line-quantity">{{ line.quantity }} ×</span>
                                    <span class="line-unit-price">{{ formatAmount(line.unitPrice) }}</span>
                                    <span v-if="line.discountType === 'percentage' && line.discountValue" class="line-discount">
                                        -{{ line.discountValue }}%
                                    </span>
                                    <span v-if="line.discountType === 'amount' && line.discountValue" class="line-discount">
                                        -{{ formatAmount(line.discountValue) }}
                                    </span>
                                    <span v-if="line.taxRate" class="line-tax">
                                        TVA {{ line.taxRate }}%
                                    </span>
                                    <span class="line-total">{{ formatAmount(line.lineTotal) }}</span>
                                </div>
                            </div>
                            <div class="line-actions" v-if="true">
                                <button type="button" @click="removeLine(index)" class="btn btn-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="no-lines">
                        <p>Aucune ligne de devis ajoutée</p>
                    </div>
                </div>

                <!-- Section Montants -->
                <div class="form-section montants-section">
                    <div class="section-header">
                        <h3><i class="fas fa-euro-sign"></i> Montants</h3>
                    </div>
                    
                    
                    <!-- Totaux calculés -->
                    <div class="totals-display">
                        <div class="total-item">
                            <span class="total-label">Coût main d'œuvre</span>
                            <span class="total-value">{{ formatAmount(calculatedTotals.laborCost) }}</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">Coût pièces</span>
                            <span class="total-value">{{ formatAmount(calculatedTotals.partsCost) }}</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">Coût autres</span>
                            <span class="total-value">{{ formatAmount(calculatedTotals.otherCost) }}</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">Total HT</span>
                            <span class="total-value">{{ formatAmount(calculatedTotals.totalHT) }}</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">Montant TVA</span>
                            <span class="total-value">{{ formatAmount(calculatedTotals.taxAmount) }}</span>
                        </div>
                        <div class="total-item total-final">
                            <span class="total-label">Total TTC</span>
                            <span class="total-value">{{ formatAmount(calculatedTotals.totalTTC) }}</span>
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
                        :entity-type="'intervention_quote'"
                        :entity-id="form.id"
                        :show-actions="true"
                        @download="downloadAttachment"
                        @delete="deleteAttachment"
                    />
                </div>

                <!-- Actions du formulaire -->
                <div class="form-actions-bottom actions-right">
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-times"></i>
                            Annuler
                        </button>
                        
                        <button 
                            type="submit" 
                            class="btn btn-primary" 
                            :disabled="!isFormValid || saving || isReadOnly"
                            @click="debugButtonClick"
                        >
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ isReadOnly ? 'Devis verrouillé (lecture seule)' : (saving ? 'Sauvegarde...' : (isEditMode ? 'Modifier le devis' : 'Créer le devis')) }}
                        </button>
                        
                        <!-- Boutons d'approbation/validation -->
                        <button 
                            v-if="isEditMode && !form.isValidated" 
                            type="button" 
                            class="btn btn-info" 
                            @click="validateQuote"
                            :disabled="saving || !isFormValid"
                        >
                            <i class="fas fa-check-circle"></i>
                            Valider le devis
                        </button>
                        
                        <button 
                            v-if="isEditMode && canCancelValidation" 
                            type="button" 
                            class="btn btn-warning" 
                            @click="cancelValidation"
                            :disabled="saving"
                        >
                            <i class="fas fa-undo"></i>
                            Annuler la validation
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `,
};

// Rendre le composant globalement disponible
window.InterventionQuoteForm = InterventionQuoteForm;