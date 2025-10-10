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
            form: {
                id: null,
                interventionId: null,
                quoteId: null,
                authorizedBy: null,
                authorizationDate: null,
                specialInstructions: '',
                lines: []
            },
            loading: false,
            saving: false,
            validating: false,
            cancelling: false,
            isValidationEnabled: false,
            currency: 'FCFA',
            availableInterventions: [],
            availableQuotes: [],
            availableSupplies: [],
            availableCollaborateurs: [],
            selectedIntervention: null,
            selectedQuote: null,
            selectedSupply: null,
            showInterventionSearch: false,
            showQuoteSearch: false,
            showSupplySearch: false,
            showCollaborateurSearch: false,
            searchTimeout: null,
            newLine: {
                supply: null,
                workType: '',
                lineNumber: 1,
                quantity: 1,
                unitPrice: 0,
                discountPercentage: 0,
                discountAmount: 0,
                taxRate: 0,
                notes: '',
                tempId: null
            },
            attachments: [],
            isDragOver: false,
            uploadingFiles: false,
            errors: {},
            // Etat interne pour ne pas muter les props
            modeInternal: 'create',
            authorizationIdInternal: null,
            // Gestion de l'édition des lignes
            editingLineIndex: null,
            editingLine: {
                supply: null,
                workType: '',
                lineNumber: 1,
                quantity: 1,
                unitPrice: 0,
                discountPercentage: 0,
                discountAmount: 0,
                taxRate: 0,
                notes: '',
                tempId: null
            },
            showEditingSupplySearch: false
        };
    },
    
    components: {
        AttachmentGallery: window.AttachmentGallery
    },
    
    computed: {
        isEditMode() {
            return (this.modeInternal || this.mode) === 'edit';
        },
        
        isCreateMode() {
            return (this.modeInternal || this.mode) === 'create';
        },
        
        currentAuthorizationId() {
            return this.authorizationIdInternal || this.authorizationId || this.form.id;
        },
        
        pageTitle() {
            return this.isEditMode ? "Modifier l'Accord Travaux" : "Nouvel Accord Travaux";
        },
        
        
        isFormValid() {
            return this.form.interventionId && 
                   this.form.authorizationDate;
        },
        
        isEditingLineValid() {
            const isValid = this.editingLine.supply && 
                           this.editingLine.workType && 
                           this.editingLine.quantity > 0 && 
                           this.editingLine.unitPrice >= 0;
            
            console.log('=== VALIDATION EDITING LINE ===');
            console.log('Supply:', this.editingLine.supply);
            console.log('WorkType:', this.editingLine.workType);
            console.log('Quantity:', this.editingLine.quantity);
            console.log('UnitPrice:', this.editingLine.unitPrice);
            console.log('Is valid:', isValid);
            
            return isValid;
        },
        
        editingLineTotal() {
            const quantity = parseFloat(this.editingLine.quantity) || 0;
            const unitPrice = parseFloat(this.editingLine.unitPrice) || 0;
            const discountPercentage = parseFloat(this.editingLine.discountPercentage) || 0;
            const taxRate = parseFloat(this.editingLine.taxRate) || 0;
            
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
            
            return subtotal.toFixed(2);
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
            
            this.form.lines.forEach(line => {
                const total = parseFloat(line.totalPrice || line.lineTotal || 0);
                
                // Utiliser le workType pour catégoriser les lignes
                if (line.workType === 'supply') {
                    summary.supply.lines.push(line);
                    summary.supply.total += total;
                } else if (line.workType === 'labor') {
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
                { value: 'labor', label: 'Main d\'œuvre' },
                { value: 'supply', label: 'Fourniture' },
                { value: 'other', label: 'Autre' }
            ];
        },
        
        selectedCollaborateur() {
            if (!this.form.authorizedBy) {
                console.log('selectedCollaborateur: no form.authorizedBy');
                return null;
            }
            console.log('selectedCollaborateur: looking for ID', this.form.authorizedBy);
            console.log('selectedCollaborateur: availableCollaborateurs', this.availableCollaborateurs);
            const found = this.availableCollaborateurs.find(c => c.id === this.form.authorizedBy);
            console.log('selectedCollaborateur: found', found);
            return found || null;
        },
        
        isReadOnly() {
            return this.isEditMode && !this.isValidationEnabled;
        },
        
        submitButtonText() {
            if (this.isReadOnly) {
                return 'Autorisation validée (lecture seule)';
            }
            return this.saving ? 'Enregistrement...' : (this.isEditMode ? 'Modifier' : 'Créer');
        }
    },
    
    async mounted() {
        console.log('=== COMPONENT MOUNTED ===');
        console.log('Current URL:', window.location.href);
        
        await this.waitForApiService();
        this.loadSidebar();
        await this.loadCurrency();
        await this.loadInterventions();
        await this.loadSupplies();
        await this.loadCollaborateurs();
        
        // Détecter le mode édition depuis l'URL
        this.detectEditMode();
        
        console.log('After detectEditMode:');
        console.log('- isEditMode:', this.isEditMode);
        console.log('- authorizationId:', this.authorizationId);
        
        if (this.isEditMode && this.currentAuthorizationId) {
            console.log('Loading authorization...');
            await this.loadAuthorization();
        } else {
            console.log('Not loading authorization - isEditMode:', this.isEditMode, 'authorizationId:', this.currentAuthorizationId);
        }
        
        // Ajouter l'écouteur pour fermer les dropdowns au clic extérieur
        document.addEventListener('click', this.handleClickOutside);
    },
    
    beforeUnmount() {
        // Nettoyer l'écouteur d'événement
        document.removeEventListener('click', this.handleClickOutside);
    },
    
    methods: {
        async waitForApiService() {
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
            
            console.log('ApiService disponible pour intervention-work-authorization-form');
        },
        
        detectEditMode() {
            // Détecter le mode édition depuis l'URL
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            
            console.log('=== DETECT EDIT MODE ===');
            console.log('URL:', window.location.href);
            console.log('ID from URL:', id);
            
            if (id) {
                this.modeInternal = 'edit';
                this.authorizationIdInternal = id;
                this.form.id = id;
                console.log('Edit mode activated, authorizationId:', this.authorizationIdInternal);
            } else {
                console.log('No ID found, staying in create mode');
            }
        },
        
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
        
        async loadInterventions(search = '') {
            this.loading = true;
            try {
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
                        displayText: `${intervention.interventionNumber || intervention.code || 'INT-' + intervention.id} - ${intervention.vehicle?.brand?.name || 'N/A'} ${intervention.vehicle?.model?.name || 'N/A'} (${intervention.vehicle?.plateNumber || 'N/A'}) - ${intervention.title || 'N/A'}`
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
        
        async loadQuotes(interventionId = null, search = '') {
            try {
                const params = new URLSearchParams();
                if (interventionId) {
                    params.append('intervention_id', interventionId);
                }
                if (search) {
                    params.append('search', search);
                }
                
                let url = '/intervention-quotes';
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }
                
                const response = await window.apiService.request(url);
                if (response.success && response.data) {
                    const quotes = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    
                    this.availableQuotes = quotes.map(quote => {
                        const vehicle = quote.vehicle; // Les données sont directement dans vehicle, pas dans intervention.vehicle
                        const vehicleInfo = vehicle ? 
                            `${vehicle.brand || 'Marque inconnue'} ${vehicle.model || 'Modèle inconnu'} (${vehicle.plateNumber || 'Plaque inconnue'})` :
                            'Véhicule non spécifié';
                        
                        return {
                        ...quote,
                            displayText: `${quote.quoteNumber || 'DEVIS-' + quote.id} - ${vehicleInfo} - ${parseFloat(quote.totalAmount || 0).toFixed(2)} ${this.currency}`
                        };
                    });
                } else {
                    this.availableQuotes = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des devis:', error);
                this.showNotification('Erreur lors du chargement des devis', 'error');
            }
        },
        
        async loadCollaborateurs() {
            try {
                const response = await window.apiService.request('/intervention-work-authorizations/collaborateurs');
                if (response.success && response.data) {
                    this.availableCollaborateurs = response.data.map(collaborateur => ({
                        ...collaborateur,
                        displayText: `${collaborateur.firstName} ${collaborateur.lastName} - ${collaborateur.position || 'Poste non défini'}`
                    }));
                } else {
                    this.availableCollaborateurs = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des collaborateurs:', error);
                this.showNotification('Erreur lors du chargement des collaborateurs', 'error');
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
        
        async loadQuoteLines(quoteId) {
            try {
                console.log('Chargement des lignes du devis pour accord:', quoteId);
                
                // Utiliser le nouvel endpoint spécialisé
                const response = await window.apiService.request(`/intervention-quotes/${quoteId}/lines-for-authorization`);
                if (response.success && response.data) {
                    const data = response.data;
                    const quoteLines = data.lines || [];
                    
                    console.log('Lignes formatées chargées:', data);
                    console.log('Lignes du devis:', quoteLines);
                    
                    if (quoteLines.length === 0) {
                        console.warn('Aucune ligne trouvée pour ce devis');
                        this.showNotification('Aucune ligne trouvée pour ce devis', 'warning');
                        return;
                    }
                    
                    // Les lignes sont déjà formatées pour les accords
                    this.form.lines = quoteLines.map(line => ({
                        tempId: line.tempId,
                        lineNumber: line.lineNumber,
                        supply: line.supply,
                        // Associer l'ID de la fourniture pour la persistance backend
                        supplyId: line.supplyId || (line.supply && line.supply.id) || null,
                        workType: line.workType,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discountPercentage: line.discountPercentage,
                        discountAmount: line.discountAmount,
                        taxRate: line.taxRate,
                        notes: line.notes,
                        totalPrice: line.totalPrice,
                        description: line.description,
                        displayName: line.displayName
                    }));
                    
                    // Synchroniser le montant de devis (Total HT) pour le calcul de la différence
                    if (!this.selectedQuote) {
                        this.selectedQuote = { id: quoteId };
                    }
                    this.selectedQuote.totalAmount = parseFloat(data.totalAmount || 0);
                    this.selectedQuote.quoteNumber = data.quoteNumber || this.selectedQuote.quoteNumber;

                    console.log('Lignes d\'accord créées:', this.form.lines);
                    
                    this.showNotification(`${this.form.lines.length} ligne(s) chargée(s) depuis le devis ${data.quoteNumber}`, 'success');
                } else {
                    console.warn('Devis non trouvé');
                    this.showNotification('Devis non trouvé', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des lignes du devis:', error);
                this.showNotification('Erreur lors du chargement des lignes du devis', 'error');
            }
        },
        
        async loadAuthorization() {
            this.loading = true;
            console.log('=== LOADING AUTHORIZATION ===');
            console.log('Authorization ID:', this.currentAuthorizationId);
            console.log('API URL:', `/intervention-work-authorizations/${this.currentAuthorizationId}`);
            
            try {
                const response = await window.apiService.request(`/intervention-work-authorizations/${this.currentAuthorizationId}`);
                console.log('API Response:', response);
                
                if (response.success && response.data) {
                    const data = response.data;
                    
                    console.log('=== LOADED DATA ===');
                    console.log('Raw data:', data);
                    console.log('interventionId:', data.interventionId);
                    console.log('quoteId:', data.quoteId);
                    console.log('authorizedBy:', data.authorizedBy);
                    console.log('authorizationDate:', data.authorizationDate);
                    console.log('lines:', data.lines);
                    
                    // Mapper correctement les champs renvoyés par le backend
                    this.form = {
                        id: data.id,
                        interventionId: data.interventionId || null,
                        quoteId: data.quoteId || null,
                        authorizedBy: (data.authorizedBy && data.authorizedBy.id) ? data.authorizedBy.id : (data.authorizedBy || null),
                        authorizationDate: data.authorizationDate ? (data.authorizationDate.includes('T') ? data.authorizationDate.split('T')[0] : data.authorizationDate.split(' ')[0]) : null,
                        specialInstructions: data.specialInstructions || '',
                        lines: []
                    };
                    
                    console.log('=== MAPPED FORM ===');
                    console.log('form.interventionId:', this.form.interventionId);
                    console.log('form.quoteId:', this.form.quoteId);
                    console.log('form.authorizedBy:', this.form.authorizedBy);
                    console.log('form.authorizationDate:', this.form.authorizationDate);
                    
                    // Charger les lignes si elles existent
                    if (data.lines && Array.isArray(data.lines)) {
                        this.form.lines = data.lines.map(line => {
                            const supply = line.supplyId ? {
                                id: line.supplyId,
                                name: line.supplyName || 'Fourniture',
                                reference: line.supplyReference || null,
                                displayText: `${line.supplyReference || 'REF-' + line.supplyId} - ${line.supplyName || 'Fourniture'}`
                            } : null;
                            
                            return {
                            ...line,
                            tempId: line.id || Date.now() + Math.random(),
                                totalPrice: line.lineTotal || line.totalPrice || 0,
                                supply: supply,
                                workType: line.workType || 'labor' // Définir un workType par défaut
                            };
                        });
                    }
                    
                    // Construire l'intervention sélectionnée à partir des infos disponibles
                    if (this.form.interventionId) {
                        this.selectedIntervention = {
                            id: this.form.interventionId,
                            interventionNumber: data.interventionCode,
                            vehicle: data.vehicle || null,
                            title: data.interventionTitle || ''
                        };
                        this.selectedIntervention.displayText = `${this.selectedIntervention.interventionNumber || ('INT-' + this.selectedIntervention.id)} - ${(this.selectedIntervention.vehicle?.brand?.name || 'N/A')} ${(this.selectedIntervention.vehicle?.model?.name || 'N/A')} (${this.selectedIntervention.vehicle?.plateNumber || 'N/A'}) - ${this.selectedIntervention.title || 'N/A'}`;
                        
                        // Charger les devis pour cette intervention puis sélectionner celui de l'accord
                        await this.loadQuotes(this.form.interventionId);
                        if (this.form.quoteId) {
                            const found = this.availableQuotes.find(q => q.id === this.form.quoteId);
                            if (found) {
                                this.selectedQuote = found;
                            } else {
                                // Fallback minimal si non présent dans la liste
                            this.selectedQuote = {
                                    id: this.form.quoteId,
                                    quoteNumber: data.quoteNumber,
                                    totalAmount: data.quoteTotalAmount || 0,
                                    displayText: `${data.quoteNumber || ('DEVIS-' + this.form.quoteId)}`
                                };
                            }
                        }
                    }
                    
                    // Charger le collaborateur sélectionné
                    if (data.authorizedBy && typeof data.authorizedBy === 'object') {
                        // Le collaborateur est déjà chargé dans la réponse
                        const collaborateur = {
                            ...data.authorizedBy,
                            displayText: `${data.authorizedBy.firstName} ${data.authorizedBy.lastName} - ${data.authorizedBy.position || 'Poste non défini'}`
                        };
                        this.availableCollaborateurs = [collaborateur];
                        console.log('=== COLLABORATEUR LOADED ===');
                        console.log('availableCollaborateurs:', this.availableCollaborateurs);
                        console.log('form.authorizedBy:', this.form.authorizedBy);
                    } else if (this.form.authorizedBy) {
                        // Charger tous les collaborateurs puis trouver celui sélectionné
                        await this.loadCollaborateurs();
                        console.log('=== COLLABORATEURS LOADED ===');
                        console.log('availableCollaborateurs:', this.availableCollaborateurs);
                        console.log('form.authorizedBy:', this.form.authorizedBy);
                    }
                    
                    // Charger les pièces jointes
                    await this.loadAttachments();
                    
                    // Activer le bouton de validation si l'autorisation n'est pas encore validée
                    this.isValidationEnabled = !data.isValidated;
                }
            } catch (error) {
                console.error('Erreur lors du chargement de l\'accord:', error);
                    this.showNotification('Erreur lors du chargement de l\'accord', 'error');
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
                lineNumber: this.form.lines.length + 1
            };
            
            this.form.lines.push(line);
            this.resetNewLine();
        },
        
        async removeLine(index) {
            const line = this.form.lines[index];
            const lineName = this.getLineDisplayName(line);
            
            const confirmed = await this.confirmAction(`Supprimer la ligne "${lineName}" ?`);
            if (!confirmed) return;
            
            this.form.lines.splice(index, 1);
            // Réorganiser les numéros de ligne
            this.form.lines.forEach((line, idx) => {
                line.lineNumber = idx + 1;
            });
        },
        
        resetNewLine() {
            this.newLine = {
                supply: null,
                workType: '',
                lineNumber: this.form.lines.length + 1,
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
                const reference = line.supply.reference || `REF-${line.supply.id}`;
                const name = line.supply.name || 'Fourniture';
                return `${reference} - ${name}`;
            }
            // Fallback vers la description si disponible
            if (line.description) {
                return line.description;
            }
            return `Ligne ${line.lineNumber}`;
        },
        
        getWorkTypeLabel(workType) {
            const option = this.workTypeOptions.find(opt => opt.value === workType);
            return option ? option.label : workType;
        },
        
        getTotalAmount() {
            return this.form.lines.reduce((total, line) => {
                return total + parseFloat(line.totalPrice || line.lineTotal || 0);
            }, 0).toFixed(2);
        },
        
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        showNotification(message, type = 'info') {
            switch (type) {
                case 'success':
                    if (window.notifySuccess) {
                        window.notifySuccess(message);
                    } else {
                        console.log('[SUCCESS]', message);
                    }
                    break;
                case 'error':
                    if (window.notifyError) {
                        window.notifyError(message);
                    } else {
                        console.log('[ERROR]', message);
                    }
                    break;
                case 'warning':
                    if (window.notifyWarning) {
                        window.notifyWarning(message);
                    } else {
                        console.log('[WARNING]', message);
                    }
                    break;
                default:
                    if (window.notifyInfo) {
                        window.notifyInfo(message);
                    } else {
                        console.log('[INFO]', message);
                    }
            }
        },
        
        resetForm() {
            this.form = {
                id: null,
                interventionId: null,
                quoteId: null,
                authorizedBy: null,
                authorizationDate: null,
                specialInstructions: '',
                lines: []
            };
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
                    ...this.form,
                    lines: this.form.lines.map(line => ({
                        supplyId: line.supplyId || (line.supply && line.supply.id) || null,
                        workType: line.workType,
                        lineNumber: line.lineNumber,
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
                    response = await window.apiService.request(`/intervention-work-authorizations/${this.currentAuthorizationId}`, {
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
                    this.showNotification(
                        this.isEditMode ? 'Accord modifié avec succès' : 'Accord créé avec succès',
                        'success'
                    );
                    
                    // En mode création, rediriger vers la page d'édition
                    if (this.isCreateMode && response.data && response.data.id) {
                    setTimeout(() => {
                            window.location.href = `/intervention-work-authorization-edit.html?id=${response.data.id}`;
                    }, 1500);
                    }
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
        
        async validateAuthorization() {
            if (!this.form.id) {
                this.showNotification('Impossible de valider une autorisation sans ID', 'error');
                return;
            }
            
            const confirmed = await this.confirmAction('Êtes-vous sûr de vouloir valider cette autorisation ? Cette action est irréversible.');
            if (!confirmed) return;
            
            this.validating = true;
            
            try {
                const response = await window.apiService.request(`/intervention-work-authorizations/${this.form.id}/validate`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showNotification('Autorisation validée avec succès', 'success');
                    this.isValidationEnabled = false;
                    // Recharger les données pour mettre à jour le statut
                    await this.loadAuthorization();
                } else {
                    this.showNotification(response.message || 'Erreur lors de la validation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la validation:', error);
                this.showNotification('Erreur lors de la validation', 'error');
            } finally {
                this.validating = false;
            }
        },
        
        async cancelValidation() {
            if (!this.form.id) {
                this.showNotification('Impossible d\'annuler la validation sans ID', 'error');
                return;
            }
            
            const confirmed = await this.confirmAction('Êtes-vous sûr de vouloir annuler la validation de cette autorisation ? Cela permettra de la modifier à nouveau.');
            if (!confirmed) return;
            
            this.cancelling = true;
            
            try {
                const response = await window.apiService.request(`/intervention-work-authorizations/${this.form.id}/cancel-validation`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showNotification('Validation annulée avec succès', 'success');
                    this.isValidationEnabled = true;
                    // Recharger les données pour mettre à jour le statut
                    await this.loadAuthorization();
                } else {
                    this.showNotification(response.message || 'Erreur lors de l\'annulation de la validation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'annulation de la validation:', error);
                this.showNotification('Erreur lors de l\'annulation de la validation', 'error');
            } finally {
                this.cancelling = false;
            }
        },
        
        toggleInterventionSearch() {
            this.showInterventionSearch = !this.showInterventionSearch;
            if (this.showInterventionSearch) {
                this.$nextTick(() => {
                    const input = this.$refs.interventionSearchInput;
                    if (input) input.focus();
                });
                // Charger les interventions si pas encore chargées
                if (this.availableInterventions.length === 0) {
                    this.loadInterventions();
                }
            }
        },
        
        onInterventionSearch(searchTerm) {
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadInterventions(searchTerm);
                }, 300);
            }
        },
        
        selectIntervention(intervention) {
            this.selectedIntervention = intervention;
            this.form.interventionId = intervention.id;
            this.showInterventionSearch = false;
            
            // Charger les devis pour cette intervention
            this.loadQuotes(intervention.id, '');
            
            // Réinitialiser le devis sélectionné
            this.selectedQuote = null;
            this.form.quoteId = null;
        },
        
        clearIntervention() {
            this.selectedIntervention = null;
            this.form.interventionId = null;
            this.showInterventionSearch = false;
            
            // Réinitialiser les devis et le devis sélectionné
            this.availableQuotes = [];
            this.selectedQuote = null;
            this.form.quoteId = null;
            
            // Vider les lignes d'accord
            this.form.lines = [];
        },
        
        toggleQuoteSearch() {
            this.showQuoteSearch = !this.showQuoteSearch;
            if (this.showQuoteSearch) {
                this.$nextTick(() => {
                    const input = this.$refs.quoteSearchInput;
                    if (input) input.focus();
                });
                // Charger les devis si pas encore chargés
                if (this.availableQuotes.length === 0 && this.form.interventionId) {
                    this.loadQuotes(this.form.interventionId, '');
                }
            }
        },
        
        onQuoteSearch(searchTerm) {
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    if (this.form.interventionId) {
                        this.loadQuotes(this.form.interventionId, searchTerm);
                    }
                }, 300);
            }
        },
        
        async selectQuote(quote) {
            this.selectedQuote = quote;
            this.form.quoteId = quote.id;
            this.showQuoteSearch = false;
            
            // Charger les lignes du devis sélectionné
            await this.loadQuoteLines(quote.id);
        },
        
        clearQuote() {
            this.selectedQuote = null;
            this.form.quoteId = null;
            this.showQuoteSearch = false;
            
            // Vider les lignes d'accord
            this.form.lines = [];
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
            if (!this.$refs.collaborateurSearchContainer?.contains(event.target)) {
                this.showCollaborateurSearch = false;
            }
        },
        
        toggleSupplySearch() {
            this.showSupplySearch = !this.showSupplySearch;
            if (this.showSupplySearch) {
                this.$nextTick(() => {
                    const input = this.$refs.supplySearchInput;
                    if (input) input.focus();
                });
                // Charger les fournitures si pas encore chargées
                if (this.availableSupplies.length === 0) {
                    this.loadSupplies();
                }
            }
        },
        
        onSupplySearch(searchTerm) {
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadSupplies(searchTerm);
                }, 300);
            }
        },
        
        selectSupply(supply) {
            this.selectedSupply = supply;
            this.newLine.supply = supply;
            this.showSupplySearch = false;
            
            // Remplir automatiquement le prix unitaire
            if (supply) {
                this.newLine.unitPrice = parseFloat(supply.unitPrice || 0);
                this.updateLineTotal();
            }
        },
        
        clearSupply() {
            this.selectedSupply = null;
            this.newLine.supply = null;
            this.showSupplySearch = false;
        },
        
        toggleCollaborateurSearch() {
            this.showCollaborateurSearch = !this.showCollaborateurSearch;
            if (this.showCollaborateurSearch) {
                this.$nextTick(() => {
                    const input = this.$refs.collaborateurSearchInput;
                    if (input) input.focus();
                });
                // Charger les collaborateurs si pas encore chargés
                if (this.availableCollaborateurs.length === 0) {
                    this.loadCollaborateurs();
                }
            }
        },
        
        selectCollaborateur(collaborateur) {
            this.form.authorizedBy = collaborateur.id;
            this.showCollaborateurSearch = false;
        },
        
        clearCollaborateur() {
            this.form.authorizedBy = null;
            this.showCollaborateurSearch = false;
        },
        
        clearLinesFromQuote() {
            this.form.lines = [];
            this.showNotification('Lignes vidées', 'info');
        },
        
        getDifferenceAmount() {
            if (!this.selectedQuote) return '0.00';
            const quoteAmount = parseFloat(this.selectedQuote.totalAmount || 0);
            const agreementAmount = parseFloat(this.getTotalAmount());
            const difference = agreementAmount - quoteAmount;
            return difference.toFixed(2);
        },
        
        getDifferenceClass() {
            if (!this.selectedQuote) return '';
            const quoteAmount = parseFloat(this.selectedQuote.totalAmount || 0);
            const agreementAmount = parseFloat(this.getTotalAmount());
            const difference = agreementAmount - quoteAmount;
            
            if (Math.abs(difference) < 0.01) return 'difference-equal';
            if (difference > 0) return 'difference-positive';
            return 'difference-negative';
        },
        
        async loadAttachments() {
            if (!this.isEditMode || !this.form.id) return;
            try {
                console.log('=== LOADING ATTACHMENTS ===');
                console.log('Entity type: intervention_work_authorization');
                console.log('Entity ID:', this.form.id);
                
                const response = await window.apiService.request(
                    `/intervention-work-authorizations/${this.form.id}/attachments`
                );
                
                if (response.success) {
                    this.attachments = response.data || [];
                } else {
                    this.attachments = [];
                }
                
                console.log('Attachments loaded:', this.attachments);
                console.log('Number of attachments:', this.attachments.length);
                console.log('=== END LOADING ATTACHMENTS ===');
            } catch (error) {
                console.error('Erreur lors du chargement des pièces jointes:', error);
                this.showNotification('Erreur lors du chargement des pièces jointes', 'error');
                this.attachments = [];
            }
        },
        
        async uploadFile(file) {
            if (!this.form.id) {
                this.showNotification('Veuillez d\'abord enregistrer l\'accord avant d\'ajouter des pièces jointes', 'error');
                return;
            }
            
            try {
                console.log('=== UPLOADING FILE ===');
                console.log('File:', file.name);
                console.log('Entity type: intervention_work_authorization');
                console.log('Entity ID:', this.form.id);
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('description', '');

                const response = await window.apiService.request(
                    `/intervention-work-authorizations/${this.form.id}/attachments`,
                    {
                        method: 'POST',
                        body: formData
                    }
                );
                
                console.log('Upload result:', response);
                console.log('=== END UPLOADING FILE ===');
                
                if (response.success) {
                    this.showNotification('Fichier uploadé avec succès', 'success');
                    await this.loadAttachments();
                } else {
                    this.showNotification(response.message || 'Erreur lors de l\'upload', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'upload:', error);
                this.showNotification('Erreur lors de l\'upload du fichier', 'error');
            }
        },
        
        downloadAttachment(attachment) {
            const downloadUrl = `/intervention-work-authorizations/${this.form.id}/attachments/${attachment.fileName}`;
            window.open(downloadUrl, '_blank');
        },
        
        async deleteAttachment(attachment) {
            const confirmed = await this.confirmAction(`Êtes-vous sûr de vouloir supprimer le fichier "${attachment.originalName || attachment.name}" ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(
                    `/intervention-work-authorizations/${this.form.id}/attachments/${attachment.id}`,
                    {
                        method: 'DELETE'
                    }
                );
                
                if (response.success) {
                this.showNotification('Fichier supprimé avec succès', 'success');
                await this.loadAttachments();
                } else {
                    this.showNotification(response.message || 'Erreur lors de la suppression', 'error');
                }
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
            for (const file of files) {
                await this.uploadFile(file);
            }
        },
        
        async handleFileSelect(event) {
            const files = Array.from(event.target.files);
            for (const file of files) {
                await this.uploadFile(file);
            }
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
        },
        
        openFileDialog() {
            // Afficher le message d'information
            this.showNotification('L\'upload de pièces jointes pour les accords travaux n\'est pas encore disponible', 'warning');
        },
        
        async confirmAction(message) {
            try {
                if (window.notificationService && typeof window.notificationService.confirm === 'function') {
                    const result = await window.notificationService.confirm(message);
                    return !!result;
                }
            } catch (e) {
                // ignore and fallback
            }
            return window.confirm(message);
        },
        
        editLine(index) {
            const line = this.form.lines[index];
            this.editingLineIndex = index;
            
            console.log('=== EDITING LINE ===');
            console.log('Original line:', line);
            console.log('Line supply:', line.supply);
            console.log('Line workType:', line.workType);
            console.log('Available workTypeOptions:', this.workTypeOptions);
            
            // Reconstruire l'objet supply avec displayText si nécessaire
            let supply = null;
            if (line.supply) {
                supply = { ...line.supply };
                if (!supply.displayText) {
                    const reference = supply.reference || `REF-${supply.id}`;
                    const name = supply.name || 'Fourniture';
                    supply.displayText = `${reference} - ${name}`;
                }
            }
            
            this.editingLine = {
                supply: supply,
                workType: line.workType || 'labor',
                lineNumber: line.lineNumber || index + 1,
                quantity: parseFloat(line.quantity) || 1,
                unitPrice: parseFloat(line.unitPrice) || 0,
                discountPercentage: parseFloat(line.discountPercentage) || 0,
                discountAmount: parseFloat(line.discountAmount) || 0,
                taxRate: parseFloat(line.taxRate) || 0,
                notes: line.notes || '',
                tempId: line.tempId
            };
            
            console.log('Editing line after setup:', this.editingLine);
            console.log('Editing line supply:', this.editingLine.supply);
            console.log('Editing line workType:', this.editingLine.workType);
            
            this.updateEditingLineTotal();
        },
        
        cancelEditLine() {
            this.editingLineIndex = null;
            this.resetEditingLine();
        },
        
        saveEditLine() {
            if (!this.isEditingLineValid) return;
            
            const line = {
                ...this.editingLine,
                totalPrice: this.editingLineTotal,
                supplyId: this.editingLine.supply ? this.editingLine.supply.id : null,
                displayName: this.getLineDisplayName(this.editingLine),
                workType: this.editingLine.workType // S'assurer que workType est inclus
            };
            
            console.log('Saving edited line:', line);
            console.log('WorkType being saved:', this.editingLine.workType);
            
            this.form.lines[this.editingLineIndex] = line;
            
            // Ne pas fermer l'interface d'édition, rester sur la page
            // this.editingLineIndex = null;
            // this.resetEditingLine();
            
            // Afficher un message de confirmation
            this.showNotification('Ligne modifiée avec succès', 'success');
        },
        
        resetEditingLine() {
            this.editingLine = {
                supply: null,
                workType: '',
                lineNumber: 1,
                quantity: 1,
                unitPrice: 0,
                discountPercentage: 0,
                discountAmount: 0,
                taxRate: 0,
                notes: '',
                tempId: null
            };
        },
        
        updateEditingLineTotal() {
            const quantity = parseFloat(this.editingLine.quantity) || 0;
            const unitPrice = parseFloat(this.editingLine.unitPrice) || 0;
            const discountPercentage = parseFloat(this.editingLine.discountPercentage) || 0;
            const taxRate = parseFloat(this.editingLine.taxRate) || 0;
            
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
            
            this.editingLineTotal = subtotal.toFixed(2);
        },
        
        selectEditingSupply(supply) {
            this.editingLine.supply = supply;
            // Ne pas forcer le workType à 'supply', laisser l'utilisateur choisir
            this.showEditingSupplySearch = false;
            this.updateEditingLineTotal();
        },
        
        clearEditingSupply() {
            this.editingLine.supply = null;
            this.showEditingSupplySearch = false;
        },
        
        toggleEditingSupplySearch() {
            this.showEditingSupplySearch = !this.showEditingSupplySearch;
            if (this.showEditingSupplySearch) {
                this.$nextTick(() => {
                    const input = this.$refs.editingSupplySearchInputField;
                    if (input) input.focus();
                });
            }
        },
        
        onEditingSupplySearch(query) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            this.searchTimeout = setTimeout(() => {
                this.filteredSupplies = this.availableSupplies.filter(supply => {
                    if (!supply || !supply.displayText) return false;
                    return supply.displayText.toLowerCase().includes(query.toLowerCase());
                });
            }, 300);
        }
    },
    
    template: `
        <div class="authorization-form-container">
            <!-- En-tête -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button type="button" class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1>{{ pageTitle }}</h1>
                            <p>Gérez les accords travaux pour les interventions véhicules</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <!-- Espace pour d'autres boutons si nécessaire -->
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
                                    <input 
                                        type="text" 
                                        ref="interventionSearchInput"
                                        :value="selectedIntervention ? selectedIntervention.displayText : ''"
                                        placeholder="Sélectionner une intervention..."
                                        @click="!isReadOnly && toggleInterventionSearch()"
                                        readonly
                                        class="intervention-search-input"
                                        :class="{ 'is-invalid': errors.interventionId, 'readonly': isReadOnly }"
                                        required
                                    >
                                    <button 
                                        type="button" 
                                        class="intervention-search-toggle"
                                        :class="{ 'active': showInterventionSearch }"
                                        @click="!isReadOnly && toggleInterventionSearch()"
                                        :disabled="isReadOnly"
                                    >
                                        <i class="fas fa-search"></i>
                                    </button>
                                    <button 
                                        v-if="form.interventionId && !isReadOnly" 
                                        type="button" 
                                        class="clear-btn" 
                                        @click.stop="clearIntervention"
                                        title="Effacer"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                    
                                    <div v-if="showInterventionSearch" class="intervention-search-dropdown">
                                        <div class="search-input-container">
                                            <input 
                                                type="text" 
                                                ref="interventionSearchInputField"
                                                placeholder="Rechercher une intervention..."
                                                @input="onInterventionSearch($event.target.value)"
                                                class="search-input"
                                            >
                                            <i class="fas fa-search"></i>
                                        </div>
                                        <div class="intervention-results">
                                            <div v-if="availableInterventions.length === 0" class="intervention-no-results">
                                                Aucune intervention trouvée
                                            </div>
                                            <div v-else>
                                                <div v-for="intervention in availableInterventions" 
                                                     :key="intervention.id"
                                                     class="intervention-result-item"
                                                     @click="selectIntervention(intervention)">
                                                    <div class="intervention-code">{{ intervention.interventionNumber || intervention.code || 'INT-' + intervention.id }}</div>
                                                    <div class="intervention-vehicle">
                                                        <strong>{{ intervention.vehicle?.brand?.name || 'N/A' }} {{ intervention.vehicle?.model?.name || 'N/A' }}</strong>
                                                        <span class="plate-number">({{ intervention.vehicle?.plateNumber || 'N/A' }})</span>
                                                    </div>
                                                    <div class="intervention-title">{{ intervention.title || 'N/A' }}</div>
                                                    <div v-if="intervention.description" class="intervention-description">{{ intervention.description }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="errors.interventionId" class="invalid-feedback">{{ errors.interventionId }}</div>
                                
                                <!-- Informations détaillées de l'intervention sélectionnée -->
                                <div v-if="selectedIntervention" class="selected-item-details">
                                    <div class="detail-section">
                                        <h4><i class="fas fa-info-circle"></i> Détails de l'intervention</h4>
                                        <div class="detail-grid">
                                            <div class="detail-item">
                                                <span class="detail-label">Code:</span>
                                                <span class="detail-value">{{ selectedIntervention.interventionNumber || selectedIntervention.code || 'INT-' + selectedIntervention.id }}</span>
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
                                            <div v-if="selectedIntervention.description" class="detail-item">
                                                <span class="detail-label">Description:</span>
                                                <span class="detail-value">{{ selectedIntervention.description }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Devis</label>
                                <div class="intervention-search-container" 
                                     ref="quoteSearchContainer"
                                     :class="{ 'active': showQuoteSearch }">
                                    <input 
                                        type="text" 
                                        ref="quoteSearchInput"
                                        :value="selectedQuote ? selectedQuote.displayText : ''"
                                        placeholder="Sélectionner un devis..."
                                        @click="toggleQuoteSearch"
                                        readonly
                                        class="intervention-search-input"
                                        :disabled="!form.interventionId"
                                    >
                                    <button 
                                        type="button" 
                                        class="intervention-search-toggle"
                                        :class="{ 'active': showQuoteSearch }"
                                        @click="toggleQuoteSearch"
                                        :disabled="!form.interventionId"
                                    >
                                        <i class="fas fa-search"></i>
                                    </button>
                                    <button 
                                        v-if="form.quoteId" 
                                        type="button" 
                                        class="clear-btn" 
                                        @click.stop="clearQuote"
                                        title="Effacer"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                    
                                    <div v-if="showQuoteSearch" class="intervention-search-dropdown">
                                        <div class="search-input-container">
                                            <input 
                                                type="text" 
                                                ref="quoteSearchInputField"
                                                placeholder="Rechercher un devis..."
                                                @input="onQuoteSearch($event.target.value)"
                                                class="search-input"
                                                :disabled="!form.interventionId"
                                            >
                                            <i class="fas fa-search"></i>
                                        </div>
                                        <div class="intervention-results">
                                            <div v-if="availableQuotes.length === 0" class="intervention-no-results">
                                                {{ form.interventionId ? "Aucun devis trouvé pour cette intervention" : "Sélectionnez d'abord une intervention" }}
                                            </div>
                                            <div v-else>
                                                <div v-for="quote in availableQuotes" 
                                                     :key="quote.id"
                                                     class="intervention-result-item"
                                                     @click="selectQuote(quote)">
                                                    <div class="intervention-code">{{ quote.quoteNumber || 'DEVIS-' + quote.id }}</div>
                                                    <div class="intervention-vehicle">
                                                        <template v-if="quote.vehicle">
                                                            <strong>{{ quote.vehicle.brand?.name || 'Marque inconnue' }} {{ quote.vehicle.model?.name || 'Modèle inconnu' }}</strong>
                                                            <span class="plate-number">({{ quote.vehicle.plateNumber || 'Plaque inconnue' }})</span>
                                                        </template>
                                                        <template v-else>
                                                            <span class="text-muted">Véhicule non spécifié</span>
                                                        </template>
                                                    </div>
                                                    <div class="intervention-title">
                                                        <span class="amount">{{ parseFloat(quote.totalAmount || 0).toFixed(2) }} {{ currency }}</span>
                                                        <span v-if="quote.quoteDate" class="quote-date">{{ formatDate(quote.quoteDate) }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Informations détaillées du devis sélectionné -->
                                <div v-if="selectedQuote" class="selected-item-details">
                                    <div class="detail-section">
                                        <h4><i class="fas fa-file-invoice"></i> Détails du devis</h4>
                                        <div class="detail-grid">
                                            <div class="detail-item">
                                                <span class="detail-label">Numéro:</span>
                                                <span class="detail-value">{{ selectedQuote.quoteNumber || 'DEVIS-' + selectedQuote.id }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">Montant total:</span>
                                                <span class="detail-value">{{ parseFloat(selectedQuote.totalAmount || 0).toFixed(2) }} {{ currency }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">Véhicule:</span>
                                                <span class="detail-value">
                                                    <template v-if="selectedQuote.vehicle">
                                                        {{ selectedQuote.vehicle.plateNumber || 'N/A' }} - 
                                                        {{ selectedQuote.vehicle.brand?.name || 'N/A' }} 
                                                        {{ selectedQuote.vehicle.model?.name || 'N/A' }}
                                                    </template>
                                                    <template v-else>
                                                        <span class="text-muted">Informations véhicule non disponibles</span>
                                                    </template>
                                                </span>
                                            </div>
                                            <div v-if="selectedQuote.quoteDate" class="detail-item">
                                                <span class="detail-label">Date du devis:</span>
                                                <span class="detail-value">{{ formatDate(selectedQuote.quoteDate) }}</span>
                                            </div>
                                            <div v-if="selectedQuote.validUntil" class="detail-item">
                                                <span class="detail-label">Valide jusqu'au:</span>
                                                <span class="detail-value">{{ formatDate(selectedQuote.validUntil) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Autorisé par *</label>
                                <div class="intervention-search-container" 
                                     ref="collaborateurSearchContainer"
                                     :class="{ 'active': showCollaborateurSearch }">
                                <input 
                                    type="text" 
                                        ref="collaborateurSearchInput"
                                        :value="selectedCollaborateur ? selectedCollaborateur.displayText : ''"
                                        placeholder="Sélectionner un collaborateur..."
                                        @click="toggleCollaborateurSearch"
                                        readonly
                                        class="intervention-search-input"
                                    :class="{ 'is-invalid': errors.authorizedBy }"
                                    required
                                >
                                    <button 
                                        type="button" 
                                        class="intervention-search-toggle"
                                        :class="{ 'active': showCollaborateurSearch }"
                                        @click="toggleCollaborateurSearch"
                                    >
                                        <i class="fas fa-search"></i>
                                    </button>
                                    <button 
                                        v-if="form.authorizedBy" 
                                        type="button" 
                                        class="clear-btn" 
                                        @click.stop="clearCollaborateur"
                                        title="Effacer"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                    
                                    <div v-if="showCollaborateurSearch" class="intervention-search-dropdown">
                                        <div class="search-input-container">
                                            <input 
                                                type="text" 
                                                ref="collaborateurSearchInputField"
                                                placeholder="Rechercher un collaborateur..."
                                                class="search-input"
                                            >
                                            <i class="fas fa-search"></i>
                                        </div>
                                        <div class="intervention-results">
                                            <div v-if="availableCollaborateurs.length === 0" class="intervention-no-results">
                                                Aucun collaborateur trouvé
                                            </div>
                                            <div v-else>
                                                <div v-for="collaborateur in availableCollaborateurs" 
                                                     :key="collaborateur.id"
                                                     class="intervention-result-item"
                                                     @click="selectCollaborateur(collaborateur)">
                                                    <div class="intervention-code">{{ collaborateur.firstName }} {{ collaborateur.lastName }}</div>
                                                    <div class="intervention-vehicle">
                                                        <strong>{{ collaborateur.position || 'Poste non défini' }}</strong>
                                                        <span class="plate-number">({{ collaborateur.department || 'Département non défini' }})</span>
                                                    </div>
                                                    <div v-if="collaborateur.email" class="intervention-title">{{ collaborateur.email }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="errors.authorizedBy" class="invalid-feedback">{{ errors.authorizedBy }}</div>
                                
                                <!-- Informations détaillées du collaborateur sélectionné -->
                                <div v-if="selectedCollaborateur" class="selected-item-details">
                                    <div class="detail-section">
                                        <h4><i class="fas fa-user-tie"></i> Détails du collaborateur</h4>
                                        <div class="detail-grid">
                                            <div class="detail-item">
                                                <span class="detail-label">Nom:</span>
                                                <span class="detail-value">{{ selectedCollaborateur.firstName }} {{ selectedCollaborateur.lastName }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">Poste:</span>
                                                <span class="detail-value">{{ selectedCollaborateur.position || 'Non spécifié' }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">Département:</span>
                                                <span class="detail-value">{{ selectedCollaborateur.department || 'Non spécifié' }}</span>
                                            </div>
                                            <div v-if="selectedCollaborateur.email" class="detail-item">
                                                <span class="detail-label">Email:</span>
                                                <span class="detail-value">{{ selectedCollaborateur.email }}</span>
                                            </div>
                                            <div v-if="selectedCollaborateur.specialization" class="detail-item">
                                                <span class="detail-label">Spécialisation:</span>
                                                <span class="detail-value">{{ selectedCollaborateur.specialization }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Date d'autorisation *</label>
                                <input 
                                    type="date" 
                                    v-model="form.authorizationDate" 
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.authorizationDate }"
                                    :readonly="isReadOnly"
                                    :disabled="isReadOnly"
                                    required
                                >
                                <div v-if="errors.authorizationDate" class="invalid-feedback">{{ errors.authorizationDate }}</div>
                            </div>
                        </div>


                            <div class="form-group">
                            <label>Instructions spéciales</label>
                                <textarea 
                                    v-model="form.specialInstructions" 
                                class="form-control"
                                rows="3"
                                    placeholder="Instructions particulières pour cet accord..."
                                    :readonly="isReadOnly"
                                    :disabled="isReadOnly"
                                ></textarea>
                        </div>
                    </div>

                    <!-- Section Lignes d'autorisation -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3><i class="fas fa-list"></i> Lignes d'accord</h3>
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
                                    <div class="intervention-search-container" 
                                         ref="supplySearchContainer"
                                         :class="{ 'active': showSupplySearch }">
                                        <input 
                                            type="text" 
                                            ref="supplySearchInput"
                                            :value="selectedSupply ? selectedSupply.displayText : ''"
                                            placeholder="Sélectionner une fourniture..."
                                            @click="toggleSupplySearch"
                                            readonly
                                            class="intervention-search-input"
                                        >
                                        <button 
                                            type="button" 
                                            class="intervention-search-toggle"
                                            :class="{ 'active': showSupplySearch }"
                                            @click="toggleSupplySearch"
                                        >
                                            <i class="fas fa-search"></i>
                                        </button>
                                        <button 
                                            v-if="newLine.supply" 
                                            type="button" 
                                            class="clear-btn" 
                                            @click.stop="clearSupply"
                                            title="Effacer"
                                        >
                                            <i class="fas fa-times"></i>
                                        </button>
                                        
                                        <div v-if="showSupplySearch" class="intervention-search-dropdown">
                                            <div class="search-input-container">
                                                <input 
                                                    type="text" 
                                                    ref="supplySearchInputField"
                                                    placeholder="Rechercher une fourniture..."
                                                    @input="onSupplySearch($event.target.value)"
                                                    class="search-input"
                                                >
                                                <i class="fas fa-search"></i>
                                            </div>
                                            <div class="intervention-results">
                                                <div v-if="availableSupplies.length === 0" class="intervention-no-results">
                                                    Aucune fourniture trouvée
                                                </div>
                                                <div v-else>
                                                    <div v-for="supply in availableSupplies" 
                                                         :key="supply.id"
                                                         class="intervention-result-item"
                                                         @click="selectSupply(supply)">
                                                        <div class="intervention-code">{{ supply.reference || 'REF-' + supply.id }}</div>
                                                        <div class="intervention-vehicle">
                                                            <strong>{{ supply.name }}</strong>
                                                            <span v-if="supply.category" class="supply-category">{{ supply.category }}</span>
                                                        </div>
                                                        <div class="intervention-title">
                                                            <span class="amount">{{ parseFloat(supply.unitPrice || 0).toFixed(2) }} {{ currency }}</span>
                                                            <span v-if="supply.stock !== undefined" class="stock">Stock: {{ supply.stock }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-row">
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
                                    <button type="button" class="btn btn-primary" @click="addLine" :disabled="isReadOnly">
                                        <i class="fas fa-plus"></i>
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Liste des lignes -->
                        <div v-if="form.lines.length > 0" class="lines-list">
                            <div v-if="selectedQuote" class="lines-source-info">
                                <div class="source-info-left">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Lignes chargées depuis le devis {{ selectedQuote.quoteNumber || 'DEVIS-' + selectedQuote.id }}</span>
                                </div>
                                <button type="button" class="btn btn-sm btn-outline" @click="clearLinesFromQuote" title="Vider les lignes">
                                    <i class="fas fa-trash"></i>
                                    Vider
                                </button>
                            </div>
                            <div v-for="(line, index) in form.lines" :key="line.tempId || line.id" class="line-item">
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
                                <div class="line-actions">
                                    <button type="button" class="btn btn-sm btn-outline" @click="editLine(index)" title="Modifier" :disabled="isReadOnly">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-danger" @click="removeLine(index)" title="Supprimer" :disabled="isReadOnly">
                                    <i class="fas fa-trash"></i>
                                </button>
                                </div>
                            </div>
                            
                            <div class="lines-total">
                                <strong>Total: {{ getTotalAmount() }} {{ currency }}</strong>
                            </div>
                        </div>
                        
                        <!-- Interface d'édition des lignes -->
                        <div v-if="editingLineIndex !== null" class="edit-line-form">
                            <div class="edit-line-header">
                                <h4><i class="fas fa-edit"></i> Modifier la ligne</h4>
                                <div class="edit-line-actions">
                                    <button type="button" class="btn btn-sm btn-success" @click="saveEditLine" :disabled="!isEditingLineValid">
                                        <i class="fas fa-save"></i>
                                        Enregistrer
                                    </button>
                                    <button type="button" class="btn btn-sm btn-secondary" @click="cancelEditLine">
                                        <i class="fas fa-times"></i>
                                        Annuler
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Fourniture *</label>
                                    <div class="intervention-search-container" 
                                         ref="editingSupplySearchContainer"
                                         :class="{ 'active': showEditingSupplySearch }">
                                        <input 
                                            type="text" 
                                            ref="editingSupplySearchInput"
                                            :value="editingLine.supply ? editingLine.supply.displayText : ''"
                                            placeholder="Sélectionner une fourniture..."
                                            @click="toggleEditingSupplySearch"
                                            readonly
                                            class="intervention-search-input"
                                            required
                                        >
                                        <button 
                                            type="button" 
                                            class="intervention-search-toggle"
                                            :class="{ 'active': showEditingSupplySearch }"
                                            @click="toggleEditingSupplySearch"
                                        >
                                            <i class="fas fa-search"></i>
                                        </button>
                                        <button 
                                            v-if="editingLine.supply" 
                                            type="button" 
                                            class="clear-btn" 
                                            @click.stop="clearEditingSupply"
                                            title="Effacer"
                                        >
                                            <i class="fas fa-times"></i>
                                        </button>
                                        
                                        <div v-if="showEditingSupplySearch" class="intervention-search-dropdown">
                                            <div class="search-input-container">
                                                <input 
                                                    type="text" 
                                                    ref="editingSupplySearchInputField"
                                                    placeholder="Rechercher une fourniture..."
                                                    @input="onEditingSupplySearch($event.target.value)"
                                                    class="search-input"
                                                >
                                                <i class="fas fa-search"></i>
                                            </div>
                                            <div class="intervention-results">
                                                <div v-if="availableSupplies.length === 0" class="intervention-no-results">
                                                    Aucune fourniture trouvée
                                                </div>
                                                <div v-else>
                                                    <div v-for="supply in availableSupplies" 
                                                         :key="supply.id"
                                                         class="intervention-result-item"
                                                         @click="selectEditingSupply(supply)">
                                                        <div class="intervention-code">{{ supply.reference || 'REF-' + supply.id }}</div>
                                                        <div class="intervention-vehicle">
                                                            <strong>{{ supply.name }}</strong>
                                                            <span v-if="supply.category" class="supply-category">{{ supply.category }}</span>
                                                        </div>
                                                        <div class="intervention-title">
                                                            <span class="amount">{{ parseFloat(supply.unitPrice || 0).toFixed(2) }} {{ currency }}</span>
                                                            <span v-if="supply.stock !== undefined" class="stock">Stock: {{ supply.stock }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>Type de travail</label>
                                    <select v-model="editingLine.workType" class="form-control">
                                        <option value="">Sélectionner un type</option>
                                        <option v-for="option in workTypeOptions" :key="option.value" :value="option.value">
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Quantité *</label>
                                    <input 
                                        type="number" 
                                        v-model.number="editingLine.quantity"
                                        @input="updateEditingLineTotal()"
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
                                        v-model.number="editingLine.unitPrice"
                                        @input="updateEditingLineTotal()"
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
                                        v-model.number="editingLine.discountPercentage"
                                        @input="updateEditingLineTotal()"
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
                                        v-model.number="editingLine.taxRate"
                                        @input="updateEditingLineTotal()"
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
                                        :value="editingLineTotal"
                                        readonly
                                        class="form-control"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label>Notes</label>
                                    <textarea 
                                        v-model="editingLine.notes"
                                        class="form-control"
                                        placeholder="Notes optionnelles..."
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div v-else class="no-lines">
                            <i class="fas fa-list"></i>
                            <p>Aucune ligne ajoutée</p>
                        </div>
                    </div>

                    <!-- Section Montants -->
                    <div class="form-section montants-section" v-if="form.lines.length > 0">
                        <div class="section-header">
                            <h3><i class="fas fa-euro-sign"></i> Montants</h3>
                        </div>
                        
                        <!-- Totaux calculés -->
                        <div class="totals-display">
                            <!-- Main d'œuvre -->
                            <div v-if="financialSummary.labor.lines.length > 0" class="total-item">
                                <span class="total-label">Coût main d'œuvre</span>
                                <span class="total-value">{{ financialSummary.labor.total.toFixed(2) }} {{ currency }}</span>
                            </div>
                            
                            <!-- Fournitures -->
                            <div v-if="financialSummary.supply.lines.length > 0" class="total-item">
                                <span class="total-label">Coût fournitures</span>
                                <span class="total-value">{{ financialSummary.supply.total.toFixed(2) }} {{ currency }}</span>
                            </div>
                            
                            <!-- Autres -->
                            <div v-if="financialSummary.other.lines.length > 0" class="total-item">
                                <span class="total-label">Coût autres</span>
                                <span class="total-value">{{ financialSummary.other.total.toFixed(2) }} {{ currency }}</span>
                                </div>
                            
                            <!-- Montant de devis -->
                            <div v-if="selectedQuote" class="total-item quote-total">
                                <span class="total-label">Montant de devis</span>
                                <span class="total-value">{{ parseFloat(selectedQuote.totalAmount || 0).toFixed(2) }} {{ currency }}</span>
                                </div>
                            
                            <!-- Total général -->
                            <div class="total-item total-final">
                                <span class="total-label">Total général</span>
                                <span class="total-value">{{ getTotalAmount() }} {{ currency }}</span>
                            </div>
                            
                            <!-- Différence avec le devis -->
                            <div v-if="selectedQuote" class="total-item difference" :class="getDifferenceClass()">
                                <span class="total-label">Différence</span>
                                <span class="total-value">{{ getDifferenceAmount() }} {{ currency }}</span>
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
                            <button type="submit" class="btn btn-primary" :disabled="!isFormValid || saving || isReadOnly">
                                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                <i v-else class="fas fa-save"></i>
                                {{ submitButtonText }}
                            </button>
                            <button v-if="isEditMode && isValidationEnabled" 
                                    type="button" 
                                    class="btn btn-success" 
                                    @click="validateAuthorization"
                                    :disabled="validating || !isFormValid">
                                <i v-if="validating" class="fas fa-spinner fa-spin"></i>
                                <i v-else class="fas fa-check-circle"></i>
                                Valider l'accord
                            </button>
                            <button v-if="isEditMode && !isValidationEnabled" 
                                    type="button" 
                                    class="btn btn-warning" 
                                    @click="cancelValidation"
                                    :disabled="cancelling">
                                <i v-if="cancelling" class="fas fa-spinner fa-spin"></i>
                                <i v-else class="fas fa-undo"></i>
                                Annuler la validation
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `
};

// Exporter le composant vers window
window.InterventionWorkAuthorizationForm = InterventionWorkAuthorizationForm;