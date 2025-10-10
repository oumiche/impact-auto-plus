/**
 * Composant Vue.js pour le formulaire de facture d'intervention
 */
const InterventionInvoiceForm = {
    name: 'InterventionInvoiceForm',
    
    props: {
        mode: {
            type: String,
            default: 'create',
            validator: value => ['create', 'edit', 'view'].includes(value)
        },
        invoiceId: {
            type: [String, Number],
            default: null
        }
    },
    
    components: {
        AttachmentGallery: window.AttachmentGallery,
        InterventionSearch: {
            name: 'InterventionSearch',
            props: {
                value: { type: Object, default: null },
                placeholder: { type: String, default: 'Rechercher une intervention...' },
                items: { type: Array, default: () => [] },
                loading: { type: Boolean, default: false }
            },
            emits: ['input', 'search', 'clear'],
            data() {
                return {
                    isOpen: false,
                    searchQuery: ''
                }
            },
            computed: {
                displayValue() {
                    if (!this.value) return '';
                    
                    const parts = [];
                    if (this.value.code) parts.push(this.value.code);
                    if (this.value.title) parts.push(this.value.title);
                    if (this.value.vehicle) {
                        const vehicleInfo = [];
                        if (this.value.vehicle.plateNumber) vehicleInfo.push(this.value.vehicle.plateNumber);
                        if (this.value.vehicle.brand?.name) vehicleInfo.push(this.value.vehicle.brand.name);
                        if (this.value.vehicle.model?.name) vehicleInfo.push(this.value.vehicle.model.name);
                        if (vehicleInfo.length > 0) {
                            parts.push(`(${vehicleInfo.join(' - ')})`);
                        }
                    }
                    
                    return parts.join(' - ');
                }
            },
            methods: {
                toggleSearch() {
                    if (this.disabled) return;
                    this.isOpen = !this.isOpen;
                },
                onSearch(event) {
                    if (this.disabled) return;
                    this.searchQuery = event.target.value;
                    this.$emit('search', this.searchQuery);
                },
                selectItem(item) {
                    if (this.disabled) return;
                    this.$emit('input', item);
                    this.isOpen = false;
                },
                clearSelection() {
                    if (this.disabled) return;
                    this.$emit('input', null);
                    this.$emit('clear');
                }
            },
            template: `
                <div class="intervention-search-container" :class="{ 'active': isOpen, 'disabled': disabled }">
                    <input 
                        type="text" 
                        :value="displayValue"
                        :placeholder="placeholder"
                        @click="toggleSearch"
                        readonly
                        :disabled="disabled"
                        class="intervention-search-input"
                        :class="{ 'disabled': disabled }"
                    >
                    <button 
                        type="button" 
                        @click="toggleSearch"
                        class="intervention-search-toggle"
                        :disabled="disabled"
                    >
                        <i class="fas fa-search"></i>
                    </button>
                    <button 
                        v-if="value && !disabled" 
                        type="button" 
                        class="clear-btn" 
                        @click.stop="clearSelection"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div v-if="isOpen" class="intervention-search-dropdown">
                        <div class="search-input-container">
                            <input 
                                type="text" 
                                placeholder="Tapez pour rechercher..."
                                @input="onSearch"
                                class="search-input"
                                v-model="searchQuery"
                            >
                        </div>
                        <div class="intervention-results">
                            <div v-if="loading" class="loading-message">
                                <i class="fas fa-spinner fa-spin"></i> Chargement...
                            </div>
                            <div v-else-if="items.length === 0" class="no-results">
                                Aucun résultat trouvé
                            </div>
                            <div 
                                v-else
                                v-for="item in items" 
                                :key="item.id"
                                @click="selectItem(item)"
                                class="intervention-result-item"
                            >
                                <div class="intervention-code">{{ item.code || 'INT-' + item.id }}</div>
                                <div class="intervention-title">{{ item.title || item.name }}</div>
                                <div v-if="item.vehicle" class="intervention-vehicle">
                                    {{ item.vehicle.brand?.name || 'N/A' }} {{ item.vehicle.model?.name || 'N/A' }} 
                                    ({{ item.vehicle.plateNumber || 'N/A' }})
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },
        QuoteSearch: {
            name: 'QuoteSearch',
            props: {
                value: { type: Object, default: null },
                placeholder: { type: String, default: 'Rechercher un devis...' },
                items: { type: Array, default: () => [] },
                loading: { type: Boolean, default: false },
                disabled: { type: Boolean, default: false }
            },
            emits: ['input', 'search', 'clear'],
            data() {
                return {
                    isOpen: false,
                    searchQuery: ''
                }
            },
            computed: {
                displayValue() {
                    if (!this.value) return '';
                    
                    const parts = [];
                    if (this.value.quoteNumber) parts.push(this.value.quoteNumber);
                    if (this.value.quoteDate) {
                        const date = new Date(this.value.quoteDate);
                        parts.push(`(${date.toLocaleDateString('fr-FR')})`);
                    }
                    if (this.value.totalAmount) {
                        parts.push(`Montant: ${this.formatCurrency(this.value.totalAmount)}`);
                    }
                    
                    return parts.join(' - ');
                }
            },
            methods: {
                toggleSearch() {
                    this.isOpen = !this.isOpen;
                },
                onSearch(event) {
                    this.searchQuery = event.target.value;
                    this.$emit('search', this.searchQuery);
                },
                selectItem(item) {
                    this.$emit('input', item);
                    this.isOpen = false;
                },
                clearSelection() {
                    this.$emit('input', null);
                    this.$emit('clear');
                },
                formatDate(dateString) {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    return date.toLocaleDateString('fr-FR');
                },
                formatCurrency(amount) {
                    if (!amount) return '';
                    
                    // Déterminer le code de devise ISO basé sur la devise configurée
                    let currencyCode = 'XOF'; // Code ISO par défaut pour F CFA
                    
                    if (this.$parent.currency && this.$parent.currency.toLowerCase().includes('euro')) {
                        currencyCode = 'EUR';
                    } else if (this.$parent.currency && this.$parent.currency.toLowerCase().includes('dollar')) {
                        currencyCode = 'USD';
                    } else if (this.$parent.currency && this.$parent.currency.toLowerCase().includes('franc')) {
                        currencyCode = 'XOF'; // F CFA
                    }
                    
                    return new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: currencyCode
                    }).format(parseFloat(amount));
                }
            },
            template: `
                <div class="intervention-search-container" :class="{ 'active': isOpen }">
                    <input 
                        type="text" 
                        :value="displayValue"
                        :placeholder="placeholder"
                        @click="toggleSearch"
                        readonly
                        class="intervention-search-input"
                    >
                    <button 
                        type="button" 
                        @click="toggleSearch"
                        class="intervention-search-toggle"
                    >
                        <i class="fas fa-building"></i>
                    </button>
                    <button 
                        v-if="value" 
                        type="button" 
                        class="clear-btn" 
                        @click.stop="clearSelection"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div v-if="isOpen" class="intervention-search-dropdown">
                        <div class="search-input-container">
                            <input 
                                type="text" 
                                placeholder="Tapez pour rechercher..."
                                @input="onSearch"
                                class="search-input"
                                v-model="searchQuery"
                            >
                        </div>
                        <div class="intervention-results">
                            <div v-if="loading" class="loading-message">
                                <i class="fas fa-spinner fa-spin"></i> Chargement...
                            </div>
                            <div v-else-if="items.length === 0" class="no-results">
                                Aucun devis trouvé
                            </div>
                            <div 
                                v-else
                                v-for="item in items" 
                                :key="item.id"
                                @click="selectItem(item)"
                                class="intervention-result-item"
                            >
                                <div class="intervention-code">{{ item.quoteNumber || 'DEVIS-' + item.id }}</div>
                                <div class="intervention-title">{{ formatDate(item.quoteDate) }}</div>
                                <div class="intervention-vehicle">
                                    <span class="quote-amount">{{ formatCurrency(item.totalAmount) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        }
    },
    
    data() {
        return {
            form: {
                id: null,
                interventionId: null,
                quoteId: null,
                invoiceDate: this.getCurrentDate(),
                dueDate: this.getDefaultDueDate(),
                receivedDate: '',
                notes: '',
                lines: []
            },
            availableInterventions: [],
            availableGarages: [],
            selectedIntervention: null,
            selectedGarage: null,
            availableQuotes: [],
            quoteSearchTerm: '',
            selectedQuote: null,
            searchTimeout: null,
            saving: false,
            loading: false,
            attachments: [],
            isDragOver: false,
            uploadingFiles: false,
            currency: 'F CFA', // Devise par défaut
            newLine: {
                supplyId: null,
                workType: '',
                quantity: 1,
                unitPrice: 0,
                discountType: 'percentage',
                discountValue: 0,
                taxRate: 0
            },
            availableSupplies: [],
            selectedSupply: null,
            showSupplySearch: false,
            supplySearchTimeout: null,
            showOCR: false,
            ocrResult: null
        }
    },
    
    computed: {
        isEditMode() {
            return this.mode === 'edit';
        },
        
        isViewMode() {
            return this.mode === 'view';
        },
        
        isCreateMode() {
            return this.mode === 'create';
        },
        
        selectedInterventionTitle() {
            return this.selectedIntervention ? this.selectedIntervention.title : '';
        },
        
        
        pageTitle() {
            switch (this.mode) {
                case 'create':
                    return 'Créer une Facture';
                case 'edit':
                    return 'Modifier la Facture';
                case 'view':
                    return 'Voir la Facture';
                default:
                    return 'Facture d\'Intervention';
            }
        },
        
        isFormValid() {
            return this.form.interventionId && 
                   this.form.invoiceDate && 
                   this.form.dueDate &&
                   this.form.lines.length > 0;
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
            
            // Total HT
            const totalHT = laborCost + partsCost + otherCost;
            
            // Calculer la TVA (somme de toutes les lignes avec TVA)
            const taxAmount = this.form.lines.reduce((sum, line) => {
                let lineHT = parseFloat(line.quantity) * parseFloat(line.unitPrice);
                
                // Appliquer les remises
                if (line.discountType === 'percentage' && line.discountValue > 0) {
                    lineHT = lineHT * (1 - line.discountValue / 100);
                } else if (line.discountType === 'amount' && line.discountValue > 0) {
                    lineHT = lineHT - line.discountValue;
                }
                
                const taxRate = parseFloat(line.taxRate) || 0;
                return sum + (lineHT * taxRate / 100);
            }, 0);
            
            // Total TTC
            const totalTTC = totalHT + taxAmount;
            
            return {
                laborCost,
                partsCost,
                otherCost,
                totalHT,
                taxAmount,
                totalTTC
            };
        }
    },
    
    async mounted() {
        await this.waitForApiService();
        await this.loadInitialData();
        
        if (this.isEditMode && this.invoiceId) {
            await this.loadInvoice();
        }
        
        console.log('Mode:', this.mode);
        console.log('Invoice ID:', this.invoiceId);
        console.log('Is Edit Mode:', this.isEditMode);
        
        // Gestionnaire pour fermer les dropdowns en cliquant en dehors
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.intervention-search-container')) {
                // Les composants InterventionSearch et GarageSearch gèrent eux-mêmes leur fermeture
            }
        });
    },
    
    methods: {
        getVehicleInfo(vehicle) {
            if (!vehicle) return '';
            const parts = [];
            if (vehicle.plateNumber) parts.push(vehicle.plateNumber);
            if (vehicle.brand?.name) parts.push(vehicle.brand.name);
            if (vehicle.model?.name) parts.push(vehicle.model.name);
            return parts.join(' - ');
        },
        
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
            
            console.log('ApiService disponible pour intervention-invoice-form');
        },
        
        // Méthodes de notification utilisant le système centralisé
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
        },
        
        async loadInitialData() {
            try {
                this.loading = true;
                
                // Charger la devise depuis les paramètres
                await this.loadCurrency();
                
                // Charger les interventions et garages initialement
                await this.loadInterventions();
                await this.loadGarages();
                // Les devis seront chargés automatiquement quand une intervention sera sélectionnée
                
                // Charger les fournitures disponibles
                const suppliesResponse = await window.apiService.request('/supplies?limit=100');
                if (suppliesResponse.success) {
                    this.availableSupplies = suppliesResponse.data;
                }
                
                // Définir les dates par défaut si en mode création
                if (this.isCreateMode) {
                    this.form.invoiceDate = this.getCurrentDate();
                    this.form.dueDate = this.getDefaultDueDate();
                }
                
            } catch (error) {
                console.error('Erreur lors du chargement des données initiales:', error);
                this.showNotification('Erreur lors du chargement des données initiales', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadInvoice() {
            if (!this.invoiceId) return;
            
            console.log('Début du chargement de la facture...');
            try {
                this.loading = true;
                const response = await window.apiService.request(`/intervention-invoices/${this.invoiceId}`);
                if (response.success) {
                    const invoice = response.data;
                    this.form = {
                        id: invoice.id,
                        interventionId: invoice.interventionId,
                        quoteId: invoice.quoteId || null,
                        invoiceDate: invoice.invoiceDate ? this.formatDateForInput(new Date(invoice.invoiceDate)) : '',
                        dueDate: invoice.dueDate ? this.formatDateForInput(new Date(invoice.dueDate)) : '',
                        receivedDate: invoice.receivedDate ? this.formatDateForInput(new Date(invoice.receivedDate)) : '',
                        notes: invoice.notes || '',
                        lines: invoice.lines ? invoice.lines.map(line => ({
                            id: line.id,
                            supplyId: line.supplyId,
                            workType: line.workType || (line.supply ? 'supply' : 'other'),
                            lineNumber: line.lineNumber,
                            description: line.description || '',
                            quantity: line.quantity || 1,
                            unitPrice: line.unitPrice || 0,
                            discountType: line.discountPercentage ? 'percentage' : (line.discountAmount ? 'amount' : 'none'),
                            discountValue: line.discountPercentage || line.discountAmount || 0,
                            taxRate: line.taxRate || 0,
                            lineTotal: line.lineTotal || 0,
                            notes: line.notes || '',
                            supply: line.supply || null
                        })) : []
                    };
                    
                    // Charger l'intervention sélectionnée
                    if (invoice.interventionId) {
                        await this.loadInterventionDetails(invoice.interventionId);
                    }
                    
                    // Forcer le recalcul des totaux après chargement des lignes
                    this.$nextTick(() => {
                        this.calculateTotal();
                    });
                    
                    // Charger les détails du devis si nécessaire
                    if (invoice.quote) {
                        this.selectedQuote = invoice.quote;
                    }
                    
                    // Charger les pièces jointes
                    await this.loadAttachments();
                } else {
                    this.showNotification('Erreur lors du chargement de la facture', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la facture:', error);
                this.showNotification('Erreur lors du chargement de la facture', 'error');
            } finally {
                this.loading = false;
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
                this.attachments = await window.fileUploadService.getFiles('intervention_invoice', this.form.id);
            } catch (error) {
                console.error('Erreur lors du chargement des pièces jointes:', error);
            }
        },
        
        async saveInvoice() {
            if (!this.isFormValid) {
                if (!this.form.interventionId) {
                    this.showNotification('Veuillez sélectionner une intervention', 'warning');
                } else if (!this.form.invoiceDate) {
                    this.showNotification('Veuillez saisir la date de facture', 'warning');
                } else if (!this.form.dueDate) {
                    this.showNotification('Veuillez saisir la date d\'échéance', 'warning');
                } else if (this.form.lines.length === 0) {
                    this.showNotification('Veuillez ajouter au moins une ligne de facture', 'warning');
                } else {
                    this.showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
                }
                return;
            }
            
            try {
                this.saving = true;
                
                // Préparer les données à envoyer
                const invoiceData = {
                    interventionId: parseInt(this.form.interventionId),
                    quoteId: this.form.quoteId ? parseInt(this.form.quoteId) : null,
                    invoiceDate: this.form.invoiceDate,
                    dueDate: this.form.dueDate,
                    receivedDate: this.form.receivedDate || null,
                    totalAmount: this.calculatedTotals.totalTTC,
                    laborCost: this.calculatedTotals.laborCost,
                    partsCost: this.calculatedTotals.partsCost,
                    taxAmount: this.calculatedTotals.taxAmount,
                    notes: this.form.notes || null,
                    lines: this.form.lines
                };
                
                // Nettoyer les données (supprimer les propriétés null/undefined)
                Object.keys(invoiceData).forEach(key => {
                    if (invoiceData[key] === null || invoiceData[key] === undefined || invoiceData[key] === '') {
                        delete invoiceData[key];
                    }
                });
                
                let response;
                if (this.isEditMode) {
                    response = await window.apiService.request(`/intervention-invoices/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(invoiceData)
                    });
                } else {
                    response = await window.apiService.request('/intervention-invoices', {
                        method: 'POST',
                        body: JSON.stringify(invoiceData)
                    });
                }
                
                if (response.success) {
                    const message = this.isEditMode ? 'Facture mise à jour avec succès' : 'Facture créée avec succès';
                    this.showNotification(message, 'success');
                    
                    // Mettre à jour l'ID du formulaire si c'est une création
                    if (this.isCreateMode && response.data?.id) {
                        this.form.id = response.data.id;
                        // Charger les pièces jointes maintenant que l'ID existe
                        await this.loadAttachments();
                    }
                    
                    // Rediriger vers la liste après 2 secondes
                    setTimeout(() => {
                        window.location.href = '/intervention-invoices.html';
                    }, 2000);
                } else {
                    this.showNotification('Erreur lors de la sauvegarde: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde de la facture', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        goBack() {
            window.location.href = '/intervention-invoices.html';
        },
        
        formatDateForInput(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        },
        
        getCurrentDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        },
        
        getDefaultDueDate() {
            const today = new Date();
            // Ajouter 30 jours par défaut pour la date d'échéance
            today.setDate(today.getDate() + 30);
            return today.toISOString().split('T')[0];
        },
        
        formatAmount(amount) {
            if (!amount) return `0,00 ${this.currency}`;
            return new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount) + ` ${this.currency}`;
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        // Méthodes pour la gestion des lignes de facture
        addLine() {
            console.log('=== DEBUG addLine ===');
            console.log('selectedSupply:', this.selectedSupply);
            console.log('newLine:', this.newLine);
            console.log('Validation:', {
                hasSupply: !!this.selectedSupply,
                hasWorkType: !!this.newLine.workType,
                hasQuantity: !!this.newLine.quantity,
                hasUnitPrice: this.newLine.unitPrice !== '' && this.newLine.unitPrice !== null && this.newLine.unitPrice !== undefined
            });
            
            if (!this.selectedSupply || !this.newLine.workType || !this.newLine.quantity || this.newLine.unitPrice === '' || this.newLine.unitPrice === null || this.newLine.unitPrice === undefined) {
                if (!this.selectedSupply) {
                    this.showNotification('Veuillez sélectionner une désignation', 'warning');
                } else if (!this.newLine.workType) {
                    this.showNotification('Veuillez sélectionner un type de travail', 'warning');
                } else if (!this.newLine.quantity) {
                    this.showNotification('Veuillez saisir une quantité', 'warning');
                } else if (this.newLine.unitPrice === '' || this.newLine.unitPrice === null || this.newLine.unitPrice === undefined) {
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
            
            // Appliquer la remise selon le type
            if (this.newLine.discountType === 'percentage' && discountValue > 0) {
                lineTotal = lineTotal * (1 - discountValue / 100);
            } else if (this.newLine.discountType === 'amount' && discountValue > 0) {
                lineTotal = lineTotal - discountValue;
            }
            
            // Appliquer la TVA
            if (taxRate > 0) {
                lineTotal = lineTotal * (1 + taxRate / 100);
            }
            
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
            console.log('Ligne ajoutée:', line);
            console.log('Total des lignes:', this.form.lines.length);
            this.showNotification('Ligne ajoutée avec succès', 'success');
            this.resetNewLine();
            this.calculateTotal();
        },
        
        removeLine(index) {
            this.form.lines.splice(index, 1);
            this.showNotification('Ligne supprimée', 'info');
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
        },
        
        calculateTotal() {
            // Les totaux sont maintenant calculés automatiquement via calculatedTotals
            // Cette méthode est conservée pour compatibilité mais ne fait plus rien
        },
        
        // Méthodes pour la recherche de fournitures
        toggleSupplySearch() {
            this.showSupplySearch = !this.showSupplySearch;
            if (this.showSupplySearch) {
                this.loadSupplies();
            }
        },
        
        onSupplySearch(event) {
            const searchTerm = event.target.value;
            clearTimeout(this.supplySearchTimeout);
            this.supplySearchTimeout = setTimeout(() => {
                this.loadSupplies(searchTerm);
            }, 300);
        },
        
        selectSupply(supply) {
            this.selectedSupply = supply;
            this.newLine.supplyId = supply.id;
            this.newLine.unitPrice = supply.unitPrice;
            this.showSupplySearch = false;
            // Vider le champ de recherche
            if (this.$refs.supplySearchInput) {
                this.$refs.supplySearchInput.value = '';
            }
        },
        
        clearSupply() {
            this.selectedSupply = null;
            this.newLine.supplyId = null;
            this.newLine.unitPrice = 0;
            this.showSupplySearch = false;
            // Vider le champ de recherche
            if (this.$refs.supplySearchInput) {
                this.$refs.supplySearchInput.value = '';
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
                }
            } catch (error) {
                console.error('Erreur lors du chargement des fournitures:', error);
                this.availableSupplies = [];
            }
        },
        
        getWorkTypeLabel(workType) {
            switch (workType) {
                case 'labor':
                    return 'Main d\'œuvre';
                case 'supply':
                    return 'Fourniture';
                case 'other':
                    return 'Autre';
                default:
                    return workType;
            }
        },
        
        // Méthodes pour la gestion des pièces jointes
        async uploadFiles(files) {
            if (!this.form.id) {
                this.showNotification('Veuillez d\'abord sauvegarder la facture avant d\'ajouter des pièces jointes', 'warning');
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
                    'intervention_invoice', 
                    this.form.id
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
                    'intervention_invoice', 
                    this.form.id, 
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
                    'intervention_invoice', 
                    this.form.id, 
                    attachment.id
                );
            } catch (error) {
                console.error('Erreur lors du téléchargement:', error);
                this.showNotification('Erreur lors du téléchargement du fichier', 'error');
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
                        displayText: `${intervention.code || 'INT-' + intervention.id} - ${intervention.vehicle?.brand || ''} ${intervention.vehicle?.model || ''} (${intervention.vehicle?.plateNumber || 'N/A'}) - ${intervention.title}`
                    }));
                } else {
                    this.availableInterventions = [];
                    console.error('Erreur dans la réponse API:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
                this.$notifyError('Erreur lors du chargement des interventions');
            } finally {
                this.loading = false;
            }
        },
        
        async loadGarages(search = '') {
            try {
                const params = new URLSearchParams();
                params.append('limit', '20');
                if (search) {
                    params.append('search', search);
                }
                
                const response = await window.apiService.request(`/garages?${params.toString()}`);
                if (response.success && response.data) {
                    const garages = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    this.availableGarages = garages;
            } else {
                    this.availableGarages = [];
                    console.error('Erreur dans la réponse API:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des garages:', error);
                this.$notifyError('Erreur lors du chargement des garages');
            }
        },
        
        // Méthodes pour la recherche d'interventions
        onInterventionSearch(searchTerm) {
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadInterventions(searchTerm);
                }, 300);
            }
        },
        
        selectIntervention(intervention) {
            if (intervention) {
                this.form.interventionId = intervention.id;
                this.selectedIntervention = intervention;
                // Charger les devis pour cette intervention
                this.loadQuotes();
                // Réinitialiser la sélection de devis
                this.selectedQuote = null;
                this.form.quoteId = null;
            } else {
                this.form.interventionId = null;
                this.selectedIntervention = null;
                // Vider la liste des devis
                this.availableQuotes = [];
                this.selectedQuote = null;
                this.form.quoteId = null;
            }
        },
        
        clearIntervention() {
            this.selectIntervention(null);
        },
        
        async loadQuotes(search = '') {
            try {
                // Si aucune intervention n'est sélectionnée, ne pas charger les devis
                if (!this.form.interventionId) {
                    this.availableQuotes = [];
                    return;
                }

                const params = new URLSearchParams();
                params.append('limit', '20');
                params.append('interventionId', this.form.interventionId);
                if (search) {
                    params.append('search', search);
                }
                
                const response = await window.apiService.request(`/intervention-quotes?${params.toString()}`);
                if (response.success && response.data) {
                    const quotes = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    this.availableQuotes = quotes;
                } else {
                    this.availableQuotes = [];
                    console.error('Erreur dans la réponse API:', response);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des devis:', error);
                this.$notifyError('Erreur lors du chargement des devis');
            }
        },
        
        // Méthodes pour la recherche de garages
        onGarageSearch(searchTerm) {
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadGarages(searchTerm);
                }, 300);
            }
        },
        
        // Méthodes pour la recherche de devis
        onQuoteSearch(searchTerm) {
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadQuotes(searchTerm);
                }, 300);
            }
        },
        
        selectQuote(quote) {
            if (quote) {
                this.form.quoteId = quote.id;
                this.selectedQuote = quote;
            } else {
                this.form.quoteId = null;
                this.selectedQuote = null;
            }
        },
        
        clearQuote() {
            this.selectQuote(null);
        },
        
        async loadCurrency() {
            try {
                const response = await window.apiService.request('/parameters/currency');
                if (response.success && response.data) {
                    // Extraire la valeur de la devise depuis la réponse
                    if (typeof response.data === 'object' && response.data.value) {
                        this.currency = response.data.value;
                    } else if (typeof response.data === 'string') {
                        this.currency = response.data;
                    }
                }
            } catch (error) {
                console.warn('Impossible de charger la devise depuis les paramètres, utilisation de la devise par défaut:', error);
                // Garder la valeur par défaut (F CFA)
            }
        },
        
        // Méthodes de formatage
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        formatCurrency(amount) {
            if (!amount) return '';
            
            // Déterminer le code de devise ISO basé sur la devise configurée
            let currencyCode = 'XOF'; // Code ISO par défaut pour F CFA
            
            if (this.currency && this.currency.toLowerCase().includes('euro')) {
                currencyCode = 'EUR';
            } else if (this.currency && this.currency.toLowerCase().includes('dollar')) {
                currencyCode = 'USD';
            } else if (this.currency && this.currency.toLowerCase().includes('franc')) {
                currencyCode = 'XOF'; // F CFA
            }
            
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: currencyCode
            }).format(parseFloat(amount));
        },
        
        // Méthodes pour la gestion des fichiers
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

        openFileDialog() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },

        async loadInterventionDetails(interventionId) {
            try {
                const response = await window.apiService.request(`/vehicle-interventions/${interventionId}`);
                if (response.success && response.data) {
                    const interventionData = response.data;
                    this.selectedIntervention = {
                        id: interventionData.id,
                        code: interventionData.interventionNumber,
                        title: interventionData.title,
                        vehicle: {
                            brand: interventionData.vehicle?.brand || '',
                            model: interventionData.vehicle?.model || '',
                            plateNumber: interventionData.vehicle?.plateNumber || ''
                        },
                        status: interventionData.currentStatus,
                        description: interventionData.description,
                        displayText: `${interventionData.interventionNumber} - ${interventionData.title}`
                    };
                    
                    // Charger les devis pour cette intervention
                    await this.loadQuotes();
                }
            } catch (error) {
                console.error('Erreur lors du chargement des détails de l\'intervention:', error);
                this.showNotification('Erreur lors du chargement de l\'intervention', 'error');
            }
        },

        getStatusLabel(status) {
            const statusLabels = {
                'reported': 'Signalé',
                'in_prediagnostic': 'En prédiagnostic',
                'prediagnostic_completed': 'Prédiagnostic terminé',
                'in_quote': 'En devis',
                'quote_received': 'Devis reçu',
                'in_approval': 'En accord',
                'approved': 'Accord donné',
                'in_repair': 'En réparation',
                'repair_completed': 'Réparation terminée',
                'in_reception': 'En réception',
                'vehicle_received': 'Véhicule reçu',
                'invoiced': 'Facturé',
                'cancelled': 'Annulé'
            };
            return statusLabels[status] || status;
        }
    },
    
    template: `
        <div class="invoice-form-container">
            <!-- En-tête de page -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-secondary" @click="goBack">
                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        <div class="header-text">
                            <h1><i class="fas fa-file-invoice-dollar"></i> {{ pageTitle }}</h1>
                            <p>Gérer les factures d'intervention</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contenu du formulaire -->
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement...
            </div>
            
            <form v-else @submit.prevent="saveInvoice" class="invoice-form">
                <!-- Section Informations générales -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-info-circle"></i> Informations générales</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="intervention-search">Intervention *</label>
                            <InterventionSearch
                                :value="selectedIntervention"
                                @input="selectIntervention"
                                :items="availableInterventions"
                                :loading="loading"
                                placeholder="Rechercher une intervention..."
                                :required="true"
                                @search="onInterventionSearch"
                                @clear="clearIntervention"
                            />
                            
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
                            <label for="quote-search">Devis</label>
                            <QuoteSearch
                                :value="selectedQuote"
                                @input="selectQuote"
                                :items="availableQuotes"
                                :loading="loading"
                                :placeholder="form.interventionId ? 'Rechercher un devis...' : 'Sélectionnez d\\'abord une intervention'"
                                :disabled="!form.interventionId"
                                @search="onQuoteSearch"
                                @clear="clearQuote"
                            />
                            
                            <!-- Informations détaillées du devis sélectionné -->
                            <div v-if="selectedQuote" class="selected-item-details">
                                <div class="detail-section">
                                    <h4><i class="fas fa-file-invoice"></i> Détails du devis</h4>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <span class="detail-label">Numéro:</span>
                                            <span class="detail-value">{{ selectedQuote.quoteNumber }}</span>
                                        </div>
                                        <div v-if="selectedQuote.quoteDate" class="detail-item">
                                            <span class="detail-label">Date:</span>
                                            <span class="detail-value">{{ formatDate(selectedQuote.quoteDate) }}</span>
                                        </div>
                                        <div v-if="selectedQuote.totalAmount" class="detail-item">
                                            <span class="detail-label">Montant:</span>
                                            <span class="detail-value">{{ formatCurrency(selectedQuote.totalAmount) }}</span>
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
                </div>

                <!-- Section Dates -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-calendar-alt"></i> Dates</h3>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="invoiceDate">Date de facture *</label>
                            <input 
                                type="date" 
                                id="invoiceDate"
                                v-model="form.invoiceDate"
                                :disabled="false"
                                required
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="dueDate">Date d'échéance *</label>
                            <input 
                                type="date" 
                                id="dueDate"
                                v-model="form.dueDate"
                                :disabled="false"
                                required
                                class="form-control"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="receivedDate">Date de réception</label>
                            <input 
                                type="date" 
                                id="receivedDate"
                                v-model="form.receivedDate"
                                :disabled="false"
                                class="form-control"
                            >
                        </div>
                    </div>
                </div>

                <!-- Section Montants -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-euro-sign"></i> Montants</h3>
                    </div>
                    
                </div>

                <!-- Section Lignes de facture -->
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-list"></i> Lignes de facture</h3>
                    </div>
                    
                    <!-- Ajouter une nouvelle ligne -->
                    <div class="new-line-form" v-if="true">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type de travail *</label>
                                <select 
                                    v-model="newLine.workType"
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
                                <div class="intervention-search-container" :class="{ 'active': showSupplySearch }">
                                    <input 
                                        type="text" 
                                        :value="selectedSupply ? selectedSupply.displayText : ''"
                                        placeholder="Rechercher une fourniture..."
                                        @click="toggleSupplySearch"
                                        @input="onSupplySearch"
                                        readonly
                                        class="intervention-search-input"
                                    >
                                    <button 
                                        type="button" 
                                        @click="toggleSupplySearch"
                                        class="intervention-search-toggle"
                                    >
                                        <i class="fas fa-search"></i>
                                    </button>
                                    <button 
                                        v-if="selectedSupply" 
                                        type="button" 
                                        class="clear-btn" 
                                        @click="clearSupply"
                                        title="Effacer la sélection"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                    
                                    <!-- Dropdown des fournitures -->
                                    <div 
                                        v-if="showSupplySearch" 
                                        class="intervention-search-dropdown"
                                    >
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
                                            <div 
                                                v-for="supply in availableSupplies" 
                                                :key="supply.id"
                                                @click="selectSupply(supply)"
                                                class="intervention-result-item"
                                            >
                                                <div class="intervention-code">{{ supply.reference }}</div>
                                                <div class="intervention-title">{{ supply.name }}</div>
                                                <div class="intervention-vehicle">{{ supply.brand || 'N/A' }} - {{ formatAmount(supply.unitPrice) }}</div>
                                            </div>
                                            <div v-if="availableSupplies.length === 0" class="no-results">
                                                Aucune fourniture trouvée
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
                                    class="form-control"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label>Remise</label>
                                <div class="discount-row">
                                    <select v-model="newLine.discountType" class="form-control discount-type">
                                        <option value="none">Aucune</option>
                                        <option value="percentage">%</option>
                                        <option value="amount">Montant</option>
                                    </select>
                                    <input 
                                        v-if="newLine.discountType !== 'none'"
                                        type="number" 
                                        v-model="newLine.discountValue"
                                        step="0.01"
                                        min="0"
                                        class="form-control discount-value"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>TVA %</label>
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
                                <button type="button" @click="addLine" class="btn btn-primary">
                                    <i class="fas fa-plus"></i>
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Liste des lignes -->
                    <div class="lines-list" v-if="form.lines.length > 0">
                        <div class="line-item" v-for="(line, index) in form.lines" :key="line.id">
                            <div class="line-content">
                                <div class="line-work-type">{{ getWorkTypeLabel(line.workType) }}</div>
                                <div class="line-supply">{{ line.supply?.name || 'Fourniture' }}</div>
                                <div class="line-reference">{{ line.supply?.reference || '' }}</div>
                                <div class="line-details">
                                    <span class="line-quantity">{{ line.quantity }} ×</span>
                                    <span class="line-unit-price">{{ formatAmount(line.unitPrice) }}</span>
                                    <span class="line-total">{{ formatAmount(line.lineTotal) }}</span>
                                </div>
                            </div>
                            <div class="line-actions" v-if="true">
                                <button 
                                    type="button" 
                                    @click="removeLine(index)" 
                                    class="btn btn-sm btn-danger"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="no-lines">
                        <p>Aucune ligne de facture ajoutée</p>
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
                            placeholder="Notes additionnelles sur la facture..."
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
                        :entity-type="'intervention_invoice'"
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
                        
                        <!-- Bouton Sauvegarder -->
                        <button 
                            type="submit" 
                            class="btn btn-primary" 
                            :disabled="!isFormValid || saving"
                        >
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ saving ? 'Sauvegarde...' : (isEditMode ? 'Modifier' : 'Créer') }}
                        </button>
                        
                        <!-- Indicateur si la facture est payée -->
                        <div v-if="form.status === 'paid'" class="paid-indicator">
                            <i class="fas fa-check-circle"></i>
                            <span>Facture payée</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `
};

// Exposer le composant globalement
window.InterventionInvoiceForm = InterventionInvoiceForm;