window.InterventionInvoiceViewApp = {
    data() {
        return {
            loading: false,
            invoice: null,
            invoiceId: null
        }
    },
    
    mounted() {
        this.loadInvoice();
    },
    
    methods: {
        // Data loading
        async loadInvoice() {
            try {
                this.loading = true;
                
                // Get invoice ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                this.invoiceId = urlParams.get('id');
                
                if (!this.invoiceId) {
                    window.notificationService.show('ID de facture manquant', 'error');
                    this.goBack();
                    return;
                }
                
                const response = await window.apiService.request(`/intervention-invoices/${this.invoiceId}`);
                
                if (response.success) {
                    this.invoice = response.data;
                } else {
                    window.notificationService.show(response.message || 'Erreur lors du chargement de la facture', 'error');
                    this.goBack();
                }
            } catch (error) {
                console.error('Error loading invoice:', error);
                window.notificationService.show('Erreur lors du chargement de la facture', 'error');
                this.goBack();
            } finally {
                this.loading = false;
            }
        },
        
        // Actions
        async markAsPaid() {
            if (!this.invoice) return;
            
            const paymentMethod = prompt('Méthode de paiement (optionnel):');
            const data = paymentMethod ? { paymentMethod } : {};
            
            try {
                const response = await window.apiService.request(`/intervention-invoices/${this.invoiceId}/mark-paid`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                if (response.success) {
                    window.notificationService.show('Facture marquée comme payée', 'success');
                    await this.loadInvoice(); // Reload to get updated data
                } else {
                    window.notificationService.show(response.message || 'Erreur lors du marquage', 'error');
                }
            } catch (error) {
                console.error('Error marking invoice as paid:', error);
                window.notificationService.show('Erreur lors du marquage', 'error');
            }
        },
        
        async generatePdf() {
            try {
                const response = await window.apiService.request(`/intervention-invoices/${this.invoiceId}/pdf`);
                
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
        
        async deleteInvoice() {
            if (!this.invoice) return;
            
            const confirmed = confirm(`Supprimer la facture ${this.invoice.invoiceNumber} ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-invoices/${this.invoiceId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    window.notificationService.show('Facture supprimée avec succès', 'success');
                    setTimeout(() => {
                        window.location.href = 'intervention-invoices.html';
                    }, 1500);
                } else {
                    window.notificationService.show(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting invoice:', error);
                window.notificationService.show('Erreur lors de la suppression', 'error');
            }
        },
        
        // Navigation
        goBack() {
            window.location.href = 'intervention-invoices.html';
        },
        
        editInvoice() {
            window.location.href = `intervention-invoice-edit.html?id=${this.invoiceId}`;
        },
        
        // Utility methods
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        formatDateTime(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleString('fr-FR');
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
        }
    }
};
