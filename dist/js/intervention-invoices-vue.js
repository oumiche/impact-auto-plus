const { createApp } = Vue;

createApp({
    data() {
        return {
            invoices: [],
            availableInterventions: [],
            availableQuotes: [],
            loading: false,
            saving: false,
            deleting: false,
            markingPaid: false,
            searchTerm: '',
            interventionFilter: '',
            statusFilter: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            showPaymentModal: false,
            isEditing: false,
            invoiceToDelete: null,
            invoiceToPay: null,
            paymentMethod: '',
            currency: 'FCFA',
            form: {
                id: null,
                interventionId: '',
                quoteId: '',
                invoiceNumber: '',
                invoiceDate: '',
                dueDate: '',
                subtotal: null,
                taxAmount: null,
                totalAmount: null,
                paymentStatus: 'pending',
                paymentMethod: '',
                notes: ''
            }
        };
    },
    
    mounted() {
        this.loadInvoices();
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
        
        async loadInvoices() {
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
                
                if (this.statusFilter) {
                    params.append('status', this.statusFilter);
                }
                
                const response = await window.apiService.request(`/intervention-invoices?${params.toString()}`);
                
                if (response.success) {
                    this.invoices = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des factures', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                this.showNotification('Erreur lors du chargement des factures', 'error');
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
        
        searchInvoices() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadInvoices();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadInvoices();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editInvoice(invoice) {
            this.isEditing = true;
            this.form = {
                id: invoice.id,
                interventionId: invoice.intervention.id,
                quoteId: invoice.quote ? invoice.quote.id : '',
                invoiceNumber: invoice.invoiceNumber || '',
                invoiceDate: invoice.invoiceDate ? 
                    invoice.invoiceDate.replace(' ', 'T').substring(0, 16) : '',
                dueDate: invoice.dueDate ? 
                    invoice.dueDate.replace(' ', 'T').substring(0, 16) : '',
                subtotal: invoice.subtotal || null,
                taxAmount: invoice.taxAmount || null,
                totalAmount: invoice.totalAmount || null,
                paymentStatus: invoice.paymentStatus || 'pending',
                paymentMethod: invoice.paymentMethod || '',
                notes: invoice.notes || ''
            };
            this.showModal = true;
        },
        
        async saveInvoice() {
            if (!this.form.interventionId || !this.form.invoiceNumber.trim() || !this.form.totalAmount) {
                this.showNotification('L\'intervention, le numéro de facture et le montant total sont requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                const invoiceData = {
                    interventionId: this.form.interventionId,
                    quoteId: this.form.quoteId || null,
                    invoiceNumber: this.form.invoiceNumber.trim(),
                    invoiceDate: this.form.invoiceDate || null,
                    dueDate: this.form.dueDate || null,
                    subtotal: this.form.subtotal || this.form.totalAmount,
                    taxAmount: this.form.taxAmount || '0.00',
                    totalAmount: this.form.totalAmount,
                    paymentStatus: this.form.paymentStatus,
                    paymentMethod: this.form.paymentMethod || null,
                    notes: this.form.notes || null
                };
                
                let response;
                if (this.isEditing) {
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
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadInvoices();
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
        
        markAsPaid(invoice) {
            this.invoiceToPay = invoice;
            this.paymentMethod = invoice.paymentMethod || '';
            this.showPaymentModal = true;
        },
        
        async confirmPayment() {
            if (!this.invoiceToPay) return;
            
            this.markingPaid = true;
            try {
                const response = await window.apiService.request(`/intervention-invoices/${this.invoiceToPay.id}/mark-paid`, {
                    method: 'POST',
                    body: JSON.stringify({
                        paymentMethod: this.paymentMethod || null
                    })
                });
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closePaymentModal();
                    this.loadInvoices();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du marquage comme payée:', error);
                this.showNotification('Erreur lors du marquage comme payée', 'error');
            } finally {
                this.markingPaid = false;
            }
        },
        
        deleteInvoice(invoice) {
            this.invoiceToDelete = invoice;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.invoiceToDelete) return;
            
            this.deleting = true;
            try {
                const response = await window.apiService.request(`/intervention-invoices/${this.invoiceToDelete.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadInvoices();
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
            this.invoiceToDelete = null;
        },
        
        closePaymentModal() {
            this.showPaymentModal = false;
            this.invoiceToPay = null;
            this.paymentMethod = '';
        },
        
        resetForm() {
            this.form = {
                id: null,
                interventionId: '',
                quoteId: '',
                invoiceNumber: '',
                invoiceDate: '',
                dueDate: '',
                subtotal: null,
                taxAmount: null,
                totalAmount: null,
                paymentStatus: 'pending',
                paymentMethod: '',
                notes: ''
            };
        },
        
        getPaymentStatusClass(status) {
            switch (status) {
                case 'paid':
                    return 'paid-badge';
                case 'pending':
                    return 'pending-badge';
                case 'overdue':
                    return 'overdue-badge';
                default:
                    return 'pending-badge';
            }
        },
        
        getPaymentStatusIcon(status) {
            switch (status) {
                case 'paid':
                    return 'fas fa-check-circle';
                case 'pending':
                    return 'fas fa-clock';
                case 'overdue':
                    return 'fas fa-exclamation-triangle';
                default:
                    return 'fas fa-clock';
            }
        },
        
        getPaymentStatusLabel(status) {
            switch (status) {
                case 'paid':
                    return 'Payée';
                case 'pending':
                    return 'En attente';
                case 'overdue':
                    return 'En retard';
                default:
                    return 'En attente';
            }
        },
        
        getDueDateClass(dueDate, paymentStatus) {
            if (paymentStatus === 'paid') return '';
            
            const due = new Date(dueDate);
            const now = new Date();
            const diffTime = due - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) return 'overdue';
            if (diffDays <= 3) return 'due-soon';
            return '';
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
