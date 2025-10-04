window.InterventionReceptionReportsApp = {
    data() {
        return {
            // Data
            reports: [],
            statistics: {
                totalReports: 0,
                satisfactionRate: 0,
                vehiclesReady: 0,
                followUpRequired: 0
            },
            loading: false,
            
            // Pagination
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
            
            // Filters
            searchQuery: '',
            selectedSatisfaction: '',
            sortBy: 'receptionDate',
            sortOrder: 'DESC',
            
            // Selection
            selectedReports: [],
            selectAll: false,
            
            // Search debounce
            searchTimeout: null
        }
    },
    
    computed: {
        hasActiveFilters() {
            return this.searchQuery || this.selectedSatisfaction;
        }
    },
    
    mounted() {
        this.loadReports();
        this.loadStatistics();
        this.setupEventListeners();
    },
    
    methods: {
        // Data loading
        async loadReports() {
            try {
                this.loading = true;
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    search: this.searchQuery,
                    satisfaction: this.selectedSatisfaction,
                    sortBy: this.sortBy,
                    sortOrder: this.sortOrder
                });
                
                const response = await window.apiService.request(`/intervention-reception-reports?${params}`);
                
                if (response.success) {
                    this.reports = response.data;
                    this.totalPages = response.pagination.totalPages;
                    this.totalItems = response.pagination.totalItems;
                    this.currentPage = response.pagination.currentPage;
                } else {
                    window.notificationService.show('Erreur lors du chargement des rapports', 'error');
                }
            } catch (error) {
                console.error('Error loading reports:', error);
                window.notificationService.show('Erreur lors du chargement des rapports', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async loadStatistics() {
            try {
                const response = await window.apiService.request('/intervention-reception-reports/statistics');
                
                if (response.success) {
                    this.statistics = response.data;
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        },
        
        // Filtering and search
        debounceSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadReports();
            }, 500);
        },
        
        applyFilters() {
            this.currentPage = 1;
            this.loadReports();
        },
        
        clearFilters() {
            this.searchQuery = '';
            this.selectedSatisfaction = '';
            this.sortBy = 'receptionDate';
            this.sortOrder = 'DESC';
            this.currentPage = 1;
            this.loadReports();
        },
        
        // Pagination
        changePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadReports();
            }
        },
        
        // Selection
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedReports = this.reports.map(report => report.id);
            } else {
                this.selectedReports = [];
            }
        },
        
        clearSelection() {
            this.selectedReports = [];
            this.selectAll = false;
        },
        
        // Navigation
        createReport() {
            window.location.href = 'intervention-reception-report-create.html';
        },
        
        viewReport(id) {
            window.location.href = `intervention-reception-report-view.html?id=${id}`;
        },
        
        editReport(id) {
            window.location.href = `intervention-reception-report-edit.html?id=${id}`;
        },
        
        // Report actions
        async markAsComplete(id) {
            const confirmed = confirm('Marquer cette intervention comme terminée ?');
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${id}/complete`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    window.notificationService.show('Intervention marquée comme terminée', 'success');
                    this.loadReports();
                    this.loadStatistics();
                } else {
                    window.notificationService.show(response.message || 'Erreur lors du marquage', 'error');
                }
            } catch (error) {
                console.error('Error marking as complete:', error);
                window.notificationService.show('Erreur lors du marquage', 'error');
            }
        },
        
        async markSelectedAsComplete() {
            if (this.selectedReports.length === 0) {
                window.notificationService.show('Aucun rapport sélectionné', 'warning');
                return;
            }
            
            const confirmed = confirm(`Marquer ${this.selectedReports.length} intervention(s) comme terminée(s) ?`);
            if (!confirmed) return;
            
            try {
                let successCount = 0;
                let errorCount = 0;
                
                for (const reportId of this.selectedReports) {
                    try {
                        const response = await window.apiService.request(`/intervention-reception-reports/${reportId}/complete`, {
                            method: 'POST'
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
                    window.notificationService.show(`${successCount} intervention(s) marquée(s) comme terminée(s)`, 'success');
                }
                if (errorCount > 0) {
                    window.notificationService.show(`${errorCount} intervention(s) n'ont pas pu être mises à jour`, 'error');
                }
                
                this.clearSelection();
                this.loadReports();
                this.loadStatistics();
            } catch (error) {
                console.error('Error marking selected as complete:', error);
                window.notificationService.show('Erreur lors du marquage en lot', 'error');
            }
        },
        
        async deleteReport(id) {
            const report = this.reports.find(r => r.id === id);
            if (!report) return;
            
            const confirmed = confirm(`Supprimer le rapport de réception pour l'intervention ${report.intervention.interventionNumber} ?`);
            if (!confirmed) return;
            
            try {
                const response = await window.apiService.request(`/intervention-reception-reports/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    window.notificationService.show('Rapport supprimé avec succès', 'success');
                    this.loadReports();
                    this.loadStatistics();
                } else {
                    window.notificationService.show(response.message || 'Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting report:', error);
                window.notificationService.show('Erreur lors de la suppression', 'error');
            }
        },
        
        async exportSelectedReports() {
            if (this.selectedReports.length === 0) {
                window.notificationService.show('Aucun rapport sélectionné', 'warning');
                return;
            }
            
            try {
                // TODO: Implémenter l'export
                window.notificationService.show('Export à implémenter', 'info');
            } catch (error) {
                console.error('Error exporting reports:', error);
                window.notificationService.show('Erreur lors de l\'export', 'error');
            }
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
        
        truncateText(text, maxLength) {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
        
        // Event listeners
        setupEventListeners() {
            // Listen for report updates from other pages
            window.addEventListener('receptionReportUpdated', () => {
                this.loadReports();
                this.loadStatistics();
            });
            
            // Listen for report creation from other pages
            window.addEventListener('receptionReportCreated', () => {
                this.loadReports();
                this.loadStatistics();
            });
        }
    },
    
    watch: {
        selectedReports(newValue) {
            this.selectAll = newValue.length === this.reports.length && this.reports.length > 0;
        }
    }
};
