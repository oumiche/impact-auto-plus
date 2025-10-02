const { createApp } = Vue;

createApp({
    data() {
        return {
            authorizations: [],
            availableInterventions: [],
            availableQuotes: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            interventionFilter: '',
            urgentFilter: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            authorizationToDelete: null,
            currency: 'FCFA',
            form: {
                id: null,
                interventionId: '',
                quoteId: '',
                authorizedBy: null,
                authorizationDate: '',
                maxAmount: null,
                specialInstructions: '',
                isUrgent: false
            }
        };
    },
    
    mounted() {
        this.loadAuthorizations();
        this.loadInterventions();
        this.loadQuotes();
        this.loadCurrency();
        this.initializeAuth();
    },
    
    methods: {
        async initializeAuth() {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    window.location.href = '/login.html';
                    return;
                }
                
                const userData = await window.apiService.getCurrentUser();
                if (userData.success) {
                    document.getElementById('user-name').textContent = userData.data.fullName || userData.data.email;
                }
            } catch (error) {
                console.error('Erreur d\'authentification:', error);
                window.location.href = '/login.html';
            }
        },
        
        async loadAuthorizations() {
            this.loading = true;
            try {
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    search: this.searchTerm
                });
                
                if (this.interventionFilter) {
                    params.append('interventionId', this.interventionFilter);
                }
                
                if (this.urgentFilter) {
                    params.append('urgent', this.urgentFilter);
                }
                
                const response = await window.apiService.request(`/intervention-work-authorizations?${params.toString()}`);
                
                if (response.success) {
                    this.authorizations = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des autorisations', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                this.showNotification('Erreur lors du chargement des autorisations', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadInterventions() {
            try {
                const response = await window.apiService.getVehicleInterventions();
                if (response.success) {
                    this.availableInterventions = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des interventions:', error);
            }
        },
        
        async loadQuotes() {
            try {
                const response = await window.apiService.request('/intervention-quotes');
                if (response.success) {
                    this.availableQuotes = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des devis:', error);
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
            }
        },
        
        searchAuthorizations() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadAuthorizations();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadAuthorizations();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editAuthorization(authorization) {
            this.isEditing = true;
            this.form = {
                id: authorization.id,
                interventionId: authorization.intervention.id,
                quoteId: authorization.quote ? authorization.quote.id : '',
                authorizedBy: authorization.authorizedBy || null,
                authorizationDate: authorization.authorizationDate ? 
                    authorization.authorizationDate.replace(' ', 'T').substring(0, 16) : '',
                maxAmount: authorization.maxAmount || null,
                specialInstructions: authorization.specialInstructions || '',
                isUrgent: authorization.isUrgent || false
            };
            this.showModal = true;
        },
        
        async saveAuthorization() {
            if (!this.form.interventionId || !this.form.authorizedBy) {
                this.showNotification('L\'intervention et l\'ID de l\'autoriseur sont requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                const authorizationData = {
                    interventionId: this.form.interventionId,
                    quoteId: this.form.quoteId || null,
                    authorizedBy: this.form.authorizedBy,
                    authorizationDate: this.form.authorizationDate || null,
                    maxAmount: this.form.maxAmount || null,
                    specialInstructions: this.form.specialInstructions || null,
                    isUrgent: this.form.isUrgent
                };
                
                let response;
                if (this.isEditing) {
                    response = await window.apiService.request(`/intervention-work-authorizations/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(authorizationData)
                    });
                } else {
                    response = await window.apiService.request('/intervention-work-authorizations', {
                        method: 'POST',
                        body: JSON.stringify(authorizationData)
                    });
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadAuthorizations();
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
        
        deleteAuthorization(authorization) {
            this.authorizationToDelete = authorization;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.authorizationToDelete) return;
            
            this.deleting = true;
            try {
                const response = await window.apiService.request(`/intervention-work-authorizations/${this.authorizationToDelete.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadAuthorizations();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            } finally {
                this.deleting = false;
            }
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.authorizationToDelete = null;
        },
        
        resetForm() {
            this.form = {
                id: null,
                interventionId: '',
                quoteId: '',
                authorizedBy: null,
                authorizationDate: '',
                maxAmount: null,
                specialInstructions: '',
                isUrgent: false
            };
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        formatNumber(number) {
            if (!number) return '0';
            return new Intl.NumberFormat('fr-FR').format(number);
        },
        
        showNotification(message, type = 'info') {
            if (window.notificationService) {
                window.notificationService.show(message, type);
            } else {
                alert(message);
            }
        }
    }
}).mount('#app');

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('auth_token');
    window.location.href = '/login.html';
}
