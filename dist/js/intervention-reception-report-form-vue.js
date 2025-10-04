window.InterventionReceptionReportFormApp = {
    data() {
        return {
            // Form mode
            mode: 'create', // 'create' or 'edit'
            
            // Loading states
            loading: false,
            submitting: false,
            loadingInterventions: false,
            
            // Report data
            report: {
                id: null,
                interventionId: null,
                intervention: null,
                receivedBy: null,
                receptionDate: '',
                vehicleCondition: '',
                workCompleted: '',
                remainingIssues: '',
                customerSatisfaction: 'good',
                isVehicleReady: true
            },
            
            // Form validation
            errors: {},
            
            // Search functionality
            searchInterventionQuery: '',
            availableInterventions: [],
            filteredInterventions: [],
            showInterventionSearch: false,
            searchTimeout: null
        }
    },
    
    computed: {
        isFormValid() {
            return this.report.interventionId && 
                   this.report.receivedBy && 
                   this.report.receptionDate && 
                   this.report.vehicleCondition && 
                   this.report.workCompleted && 
                   this.report.customerSatisfaction;
        },
        
        filteredInterventions() {
            if (!this.searchInterventionQuery) {
                return this.availableInterventions.slice(0, 10);
            }
            
            const query = this.searchInterventionQuery.toLowerCase();
            return this.availableInterventions.filter(intervention => 
                intervention.interventionNumber.toLowerCase().includes(query) ||
                intervention.title.toLowerCase().includes(query) ||
                intervention.vehicle.plateNumber.toLowerCase().includes(query) ||
                intervention.vehicle.brand.toLowerCase().includes(query) ||
                intervention.vehicle.model.toLowerCase().includes(query)
            ).slice(0, 10);
        }
    },
    
    mounted() {
        this.initializeForm();
        this.setupEventListeners();
    },
    
    methods: {
        // Initialization
        async initializeForm() {
            this.loading = true;
            
            try {
                // Get mode from props or URL
                const urlParams = new URLSearchParams(window.location.search);
                this.mode = this.$options.propsData?.mode || (urlParams.has('id') ? 'edit' : 'create');
                
                if (this.mode === 'edit') {
                    const reportId = urlParams.get('id');
                    if (reportId) {
                        await this.loadReport(parseInt(reportId));
                    }
                } else {
                    // Set default values for new report
                    this.report.receptionDate = new Date().toISOString().slice(0, 16);
                    this.report.customerSatisfaction = 'good';
                    this.report.isVehicleReady = true;
                }
                
                // Load interventions for search
                await this.loadInterventions();
                
            } catch (error) {
                console.error('Error initializing form:', error);
                window.notificationService.show('Erreur lors de l\'initialisation du formulaire', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // Data loading
        async loadReport(id) {
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${id}`);
                
                if (response.success) {
                    const data = response.data;
                    this.report = {
                        id: data.id,
                        interventionId: data.intervention.id,
                        intervention: data.intervention,
                        receivedBy: data.receivedBy,
                        receptionDate: data.receptionDate.replace(' ', 'T').slice(0, 16),
                        vehicleCondition: data.vehicleCondition || '',
                        workCompleted: data.workCompleted || '',
                        remainingIssues: data.remainingIssues || '',
                        customerSatisfaction: data.customerSatisfaction,
                        isVehicleReady: data.isVehicleReady
                    };
                } else {
                    window.notificationService.show(response.message || 'Erreur lors du chargement du rapport', 'error');
                    this.goBack();
                }
            } catch (error) {
                console.error('Error loading report:', error);
                window.notificationService.show('Erreur lors du chargement du rapport', 'error');
                this.goBack();
            }
        },
        
        async loadInterventions() {
            try {
                this.loadingInterventions = true;
                const response = await window.apiService.request('/vehicle-interventions?limit=100');
                
                if (response.success) {
                    this.availableInterventions = response.data || [];
                } else {
                    console.error('Error loading interventions:', response.message);
                }
            } catch (error) {
                console.error('Error loading interventions:', error);
            } finally {
                this.loadingInterventions = false;
            }
        },
        
        // Search functionality
        searchInterventions() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.showInterventionSearch = true;
            }, 300);
        },
        
        selectIntervention(intervention) {
            this.selectedIntervention = intervention;
            this.report.interventionId = intervention.id;
            this.report.intervention = intervention;
            this.searchInterventionQuery = intervention.interventionNumber;
            this.showInterventionSearch = false;
            this.clearErrors('interventionId');
        },
        
        clearIntervention() {
            this.selectedIntervention = null;
            this.report.interventionId = null;
            this.report.intervention = null;
            this.searchInterventionQuery = '';
            this.showInterventionSearch = false;
        },
        
        // Form submission
        async submitForm() {
            if (!this.isFormValid) {
                window.notificationService.show('Veuillez remplir tous les champs obligatoires', 'warning');
                return;
            }
            
            this.submitting = true;
            this.clearErrors();
            
            try {
                const data = {
                    interventionId: this.report.interventionId,
                    receivedBy: this.report.receivedBy,
                    receptionDate: this.report.receptionDate,
                    vehicleCondition: this.report.vehicleCondition,
                    workCompleted: this.report.workCompleted,
                    remainingIssues: this.report.remainingIssues || null,
                    customerSatisfaction: this.report.customerSatisfaction,
                    isVehicleReady: this.report.isVehicleReady
                };
                
                let response;
                if (this.mode === 'create') {
                    response = await window.apiService.request('/intervention-reception-reports', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                } else {
                    response = await window.apiService.request(`/intervention-reception-reports/${this.report.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                }
                
                if (response.success) {
                    const message = this.mode === 'create' ? 
                        'Rapport de réception créé avec succès' : 
                        'Rapport de réception mis à jour avec succès';
                    
                    window.notificationService.show(message, 'success');
                    
                    // Dispatch event for other pages
                    window.dispatchEvent(new CustomEvent(this.mode === 'create' ? 'receptionReportCreated' : 'receptionReportUpdated'));
                    
                    // Redirect to reports list
                    setTimeout(() => {
                        window.location.href = 'intervention-reception-reports.html';
                    }, 1500);
                } else {
                    if (response.errors) {
                        this.errors = response.errors;
                    }
                    window.notificationService.show(response.message || 'Erreur lors de la sauvegarde', 'error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                window.notificationService.show('Erreur lors de la sauvegarde', 'error');
            } finally {
                this.submitting = false;
            }
        },
        
        // Navigation
        goBack() {
            window.location.href = 'intervention-reception-reports.html';
        },
        
        // Error handling
        clearErrors(field = null) {
            if (field) {
                delete this.errors[field];
            } else {
                this.errors = {};
            }
        },
        
        // Event listeners
        setupEventListeners() {
            // Click outside to close search dropdown
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.intervention-search-container')) {
                    this.showInterventionSearch = false;
                }
            });
        }
    }
};
