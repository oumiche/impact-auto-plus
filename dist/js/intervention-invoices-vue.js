window.InterventionInvoicesApp = {
    data() {
        return {
            // Data
            invoices: [],
            loading: false,
            
            // Pagination
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
            
            // Filters
            searchQuery: '',
            selectedStatus: '',
            sortBy: 'invoiceDate',
            sortOrder: 'DESC',
            
            // Selection
            selectedInvoices: [],
            selectAll: false,
            
            // Search debounce
            searchTimeout: null
        }
    },
    
    computed: {
        hasActiveFilters() {
            return this.searchQuery || this.selectedStatus;
        }
    },
    
    mounted() {
        this.loadInvoices();
        this.setupEventListeners();
    },
    
    methods: {
        // Data loading
        async loadInvoices() {
            try {
                this.loading = true;
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    search: this.searchQuery,
                    status: this.selectedStatus,
                    sortBy: this.sortBy,
                    sortOrder: this.sortOrder
                });
                
                const response = await window.apiService.request(`/intervention-invoices?${params}`);
                
                if (response.success) {
                    this.invoices = response.data;
                    this.totalPages = response.pagination.totalPages;
                    this.totalItems = response.pagination.totalItems;
                    this.currentPage = response.pagination.currentPage;
                } else {
                    window.notificationService.show('Erreur lors du chargement des factures', 'error');
                }
            } catch (error) {
                console.error('Error loading invoices:', error);
                window.notificationService.show('Erreur lors du chargement des factures', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // Filtering and search
        debounceSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadInvoices();
            }, 500);
        },
        
        applyFilters() {
            this.currentPage = 1;
            this.loadInvoices();
        },
        
        clearFilters() {
            this.searchQuery = '';
            this.selectedStatus = '';
            this.sortBy = 'invoiceDate';
            this.sortOrder = 'DESC';
            this.currentPage = 1;
            this.loadInvoices();
        },
        
        // Pagination
        changePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadInvoices();
            }
        },
        
        // Selection
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedInvoices = this.invoices.map(invoice => invoice.id);
            } else {
                this.selectedInvoices = [];
            }
        },
        
        clearSelection() {
            this.selectedInvoices = [];
            this.selectAll = false;
        },
        
        // Navigation
        createInvoice() {
            window.location.href = 'intervention-invoice-create.html';
        },
        
        viewInvoice(id) {
            window.location.href = `intervention-invoice-view.html?id=${id}`;
        },
        
        editInvoice(id) {
            window.location.href = `intervention-invoice-edit.html?id=${id}`;
        },
        
        // Invoice actions
        async markAsPaid(id) {
            try {
                const paymentMethod = prompt('Méthode de paiement (optionnel):');
                const data = paymentMethod ? { paymentMethod } : {};
                
                const response = await window.apiService.request(`/intervention-invoices/${id}/mark-paid`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                if (response.success) {
                    window.notificationService.show('Facture marquée comme payée', 'success');
                    this.loadInvoices();
                } else {
                    window.notificationService.show(response.message || 'Erreur lors du marquage', 'error');
                }
            } catch (error) {
                console.error('Error marking invoice as paid:', error);
                window.notificationService.show('Erreur lors du marquage', 'error');
            }
        },
        
        async markSelectedAsPaid() {
            if (this.selectedInvoices.length === 0) {
                window.notificationService.show('Aucune facture sélectionnée', 'warning');
                return;
            }
            
            const confirmed = confirm(`Marquer ${this.selectedInvoices.length} facture(s) comme payée(s) ?`);
            if (!confirmed) return;
            
            try {
                const paymentMethod = prompt('Méthode de paiement (optionnel):');
                const data = paymentMethod ? { paymentMethod } : {};
                
                let successCount = 0;
                let errorCount = 0;
                
                for (const invoiceId of this.selectedInvoices) {
                    try {
                        const response = await window.apiService.request(`/intervention-invoices/${invoiceId}/mark-paid`, {
                            method: 'POST',
                            body: JSON.stringify(data)
                        });
                        
                        if (response.success) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    } catch (error) {
                        errorCount++;
                    }
                }
                
                if (successCount > 0) {
                    window.notificationService.show(`${successCount} facture(s) marquée(s) comme payée(s)`, 'success');
                }
                if (errorCount > 0) {
                    window.notificationService.show(`${errorCount} facture(s) n'ont pas pu être mises à jour`, 'error');
                }
                
                this.clearSelection();
                this.loadInvoices();
            } catch (error) {
                console.error('Error marking selected invoices as paid:', error);
                window.notificationService.show('Erreur lors du marquage en lot', 'error');
            }
        },
        
        async deleteInvoice(id) {
            const invoice = this.invoices.find(i => i.id === id);
            if (!invoice) return;
            
            const confirmed = confirm(`Supprimer la facture ${invoice.invoiceNumber} ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-invoices/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    window.notificationService.show('Facture supprimée avec succès', 'success');
                    this.loadInvoices();
                } else {
                    window.notificationService.show(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting invoice:', error);
                window.notificationService.show('Erreur lors de la suppression', 'error');
            }
        },
        
        async generatePdf(id) {
            try {
                const response = await window.apiService.request(`/intervention-invoices/${id}/pdf`);
                
                if (response.success) {
                    // TODO: Implémenter le téléchargement du PDF
                    window.notificationService.show('Génération de PDF à implémenter', 'info');
                } else {
                    window.notificationService.show(response.message || 'Erreur lors de la génération du PDF', 'error');
                }
            } catch (error) {
                console.error('Error generating PDF:', error);
                window.notificationService.show('Erreur lors de la génération du PDF', 'error');
            }
        },
        
        async exportSelectedInvoices() {
            if (this.selectedInvoices.length === 0) {
                window.notificationService.show('Aucune facture sélectionnée', 'warning');
                return;
            }
            
            try {
                // TODO: Implémenter l'export
                window.notificationService.show('Export à implémenter', 'info');
            } catch (error) {
                console.error('Error exporting invoices:', error);
                window.notificationService.show('Erreur lors de l\'export', 'error');
            }
        },
        
        // Utility methods
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        formatCurrency(amount) {
            if (!amount) return '0,00 €';
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount);
        },
        
        getPaymentStatusClass(status) {
            const statusClasses = {
                'pending': 'status-pending',
                'paid': 'status-paid',
                'overdue': 'status-overdue'
            };
            return statusClasses[status] || 'status-unknown';
        },
        
        getPaymentStatusLabel(status) {
            const statusLabels = {
                'pending': 'En attente',
                'paid': 'Payé',
                'overdue': 'En retard'
            };
            return statusLabels[status] || status;
        },
        
        isOverdue(dueDate) {
            if (!dueDate) return false;
            const due = new Date(dueDate);
            const today = new Date();
            return due < today;
        },
        
        // Event listeners
        setupEventListeners() {
            // Listen for invoice updates from other pages
            window.addEventListener('invoiceUpdated', () => {
                this.loadInvoices();
            });
            
            // Listen for invoice creation from other pages
            window.addEventListener('invoiceCreated', () => {
                this.loadInvoices();
            });
        }
    },
    
    watch: {
        selectedInvoices(newValue) {
            this.selectAll = newValue.length === this.invoices.length && this.invoices.length > 0;
        }
    }
};