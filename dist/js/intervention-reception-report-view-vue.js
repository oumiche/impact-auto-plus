window.InterventionReceptionReportViewApp = {
    data() {
        return {
            loading: false,
            report: null,
            reportId: null
        }
    },
    
    mounted() {
        this.loadReport();
    },
    
    methods: {
        // Data loading
        async loadReport() {
            try {
                this.loading = true;
                
                // Get report ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                this.reportId = urlParams.get('id');
                
                if (!this.reportId) {
                    window.notificationService.show('ID de rapport manquant', 'error');
                    this.goBack();
                    return;
                }
                
                const response = await window.apiService.request(`/intervention-reception-reports/${this.reportId}`);
                
                if (response.success) {
                    this.report = response.data;
                } else {
                    window.notificationService.show(response.message || 'Erreur lors du chargement du rapport', 'error');
                    this.goBack();
                }
            } catch (error) {
                console.error('Error loading report:', error);
                window.notificationService.show('Erreur lors du chargement du rapport', 'error');
                this.goBack();
            } finally {
                this.loading = false;
            }
        },
        
        // Actions
        async markAsComplete() {
            if (!this.report) return;
            
            const confirmed = confirm('Marquer cette intervention comme terminée ?');
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${this.reportId}/complete`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    window.notificationService.show('Intervention marquée comme terminée', 'success');
                    await this.loadReport(); // Reload to get updated data
                } else {
                    window.notificationService.show(response.message || 'Erreur lors du marquage', 'error');
                }
            } catch (error) {
                console.error('Error marking as complete:', error);
                window.notificationService.show('Erreur lors du marquage', 'error');
            }
        },
        
        async deleteReport() {
            if (!this.report) return;
            
            const confirmed = confirm(`Supprimer le rapport de réception pour l'intervention ${this.report.intervention.interventionNumber} ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${this.reportId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    window.notificationService.show('Rapport supprimé avec succès', 'success');
                    setTimeout(() => {
                        window.location.href = 'intervention-reception-reports.html';
                    }, 1500);
                } else {
                    window.notificationService.show(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting report:', error);
                window.notificationService.show('Erreur lors de la suppression', 'error');
            }
        },
        
        // Navigation
        goBack() {
            window.location.href = 'intervention-reception-reports.html';
        },
        
        editReport() {
            window.location.href = `intervention-reception-report-edit.html?id=${this.reportId}`;
        },
        
        // Utility methods
        formatDateTime(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleString('fr-FR');
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        },
        
        getSatisfactionClass(satisfaction) {
            const classes = {
                'excellent': 'satisfaction-excellent',
                'good': 'satisfaction-good',
                'fair': 'satisfaction-fair',
                'poor': 'satisfaction-poor'
            };
            return classes[satisfaction] || 'satisfaction-unknown';
        },
        
        getOverallRatingClass(rating) {
            if (rating === 'Excellent') {
                return 'rating-excellent';
            } else if (rating === 'Satisfaisant') {
                return 'rating-satisfactory';
            } else {
                return 'rating-unsatisfactory';
            }
        }
    }
};
