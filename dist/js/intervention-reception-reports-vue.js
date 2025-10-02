const { createApp } = Vue;

createApp({
    data() {
        return {
            reports: [],
            availableInterventions: [],
            loading: false,
            saving: false,
            deleting: false,
            searchTerm: '',
            interventionFilter: '',
            satisfactionFilter: '',
            readyFilter: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            reportToDelete: null,
            form: {
                id: null,
                interventionId: '',
                receivedBy: null,
                receptionDate: '',
                vehicleCondition: '',
                workCompleted: '',
                remainingIssues: '',
                customerSatisfaction: 'good',
                isVehicleReady: true
            }
        };
    },
    
    mounted() {
        this.loadReports();
        this.loadInterventions();
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
        
        async loadReports() {
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
                
                if (this.satisfactionFilter) {
                    params.append('satisfaction', this.satisfactionFilter);
                }
                
                if (this.readyFilter) {
                    params.append('ready', this.readyFilter);
                }
                
                const response = await window.apiService.request(`/intervention-reception-reports?${params.toString()}`);
                
                if (response.success) {
                    this.reports = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des rapports', 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                this.showNotification('Erreur lors du chargement des rapports', 'error');
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
        
        searchReports() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadReports();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadReports();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
        },
        
        editReport(report) {
            this.isEditing = true;
            this.form = {
                id: report.id,
                interventionId: report.intervention.id,
                receivedBy: report.receivedBy || null,
                receptionDate: report.receptionDate ? 
                    report.receptionDate.replace(' ', 'T').substring(0, 16) : '',
                vehicleCondition: report.vehicleCondition || '',
                workCompleted: report.workCompleted || '',
                remainingIssues: report.remainingIssues || '',
                customerSatisfaction: report.customerSatisfaction || 'good',
                isVehicleReady: report.isVehicleReady || true
            };
            this.showModal = true;
        },
        
        async saveReport() {
            if (!this.form.interventionId || !this.form.receivedBy) {
                this.showNotification('L\'intervention et l\'ID du réceptionnaire sont requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                const reportData = {
                    interventionId: this.form.interventionId,
                    receivedBy: this.form.receivedBy,
                    receptionDate: this.form.receptionDate || null,
                    vehicleCondition: this.form.vehicleCondition || null,
                    workCompleted: this.form.workCompleted || null,
                    remainingIssues: this.form.remainingIssues || null,
                    customerSatisfaction: this.form.customerSatisfaction,
                    isVehicleReady: this.form.isVehicleReady
                };
                
                let response;
                if (this.isEditing) {
                    response = await window.apiService.request(`/intervention-reception-reports/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(reportData)
                    });
                } else {
                    response = await window.apiService.request('/intervention-reception-reports', {
                        method: 'POST',
                        body: JSON.stringify(reportData)
                    });
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadReports();
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
        
        deleteReport(report) {
            this.reportToDelete = report;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.reportToDelete) return;
            
            this.deleting = true;
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${this.reportToDelete.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadReports();
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
            this.reportToDelete = null;
        },
        
        resetForm() {
            this.form = {
                id: null,
                interventionId: '',
                receivedBy: null,
                receptionDate: '',
                vehicleCondition: '',
                workCompleted: '',
                remainingIssues: '',
                customerSatisfaction: 'good',
                isVehicleReady: true
            };
        },
        
        getSatisfactionClass(satisfaction) {
            switch (satisfaction) {
                case 'excellent':
                    return 'satisfaction-excellent';
                case 'good':
                    return 'satisfaction-good';
                case 'average':
                    return 'satisfaction-average';
                case 'poor':
                    return 'satisfaction-poor';
                default:
                    return 'satisfaction-good';
            }
        },
        
        getSatisfactionIcon(satisfaction) {
            switch (satisfaction) {
                case 'excellent':
                    return 'fas fa-star';
                case 'good':
                    return 'fas fa-thumbs-up';
                case 'average':
                    return 'fas fa-minus';
                case 'poor':
                    return 'fas fa-thumbs-down';
                default:
                    return 'fas fa-thumbs-up';
            }
        },
        
        getSatisfactionLabel(satisfaction) {
            switch (satisfaction) {
                case 'excellent':
                    return 'Excellent';
                case 'good':
                    return 'Bon';
                case 'average':
                    return 'Moyen';
                case 'poor':
                    return 'Mauvais';
                default:
                    return 'Bon';
            }
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
        
        truncateText(text, maxLength) {
            if (!text) return '-';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
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
