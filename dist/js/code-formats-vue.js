const CodeFormatCrud = {
    template: `
        <div class="code-format-crud">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="section-title">Gestion des Formats de Code</h1>
                <p class="page-subtitle">Configurez les formats de génération automatique de codes pour vos entités</p>
            </div>

            <!-- Barre de recherche et filtres -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchTerm" 
                        @input="debouncedSearch"
                        placeholder="Rechercher un format..."
                    >
                </div>
                
                <div class="filter-group">
                    <select v-model="entityTypeFilter" @change="loadCodeFormats" class="filter-select">
                        <option value="">Tous les types</option>
                        <option v-for="type in entityTypes" :key="type.value" :value="type.value">
                            {{ type.label }}
                        </option>
                    </select>
                    
                    <select v-model="statusFilter" @change="loadCodeFormats" class="filter-select">
                        <option value="">Tous les statuts</option>
                        <option value="active">Actifs uniquement</option>
                        <option value="inactive">Inactifs uniquement</option>
                    </select>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" @click="openCreateModal">
                        <i class="fas fa-plus"></i>
                        Nouveau Format
                    </button>
                </div>
            </div>

            <!-- Liste des formats de code -->
            <div class="data-container">
                <div v-if="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement des formats de code...</p>
                </div>
                
                <div v-else-if="codeFormats.length === 0" class="no-data">
                    <i class="fas fa-barcode"></i>
                    <h3>Aucun format de code trouvé</h3>
                    <p>Commencez par créer votre premier format de code.</p>
                </div>
                
                <div v-else class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Type d'entité</th>
                                <th>Pattern de format</th>
                                <th>Exemple</th>
                                <th>Séquence actuelle</th>
                                <th>Tenant</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="format in codeFormats" :key="format.id">
                                <td>
                                    <div class="entity-type-badge">
                                        <i class="fas fa-tag"></i>
                                        {{ getEntityTypeLabel(format.entityType) }}
                                    </div>
                                </td>
                                <td>
                                    <code class="format-pattern">{{ format.formatPattern }}</code>
                                </td>
                                <td>
                                    <span class="code-example">{{ generateExample(format) }}</span>
                                </td>
                                <td>
                                    <span class="sequence-info">{{ format.currentSequence }} / {{ format.sequenceStart }}</span>
                                </td>
                                <td>
                                    <span v-if="format.tenant" class="tenant-badge">
                                        {{ format.tenant.name }}
                                    </span>
                                    <span v-else class="tenant-badge global">Global</span>
                                </td>
                                <td>
                                    <span :class="['status-badge', format.isActive ? 'status-active' : 'status-inactive']">
                                        {{ format.isActive ? 'Actif' : 'Inactif' }}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-outline" @click="editCodeFormat(format)" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" @click="resetSequence(format)" title="Réinitialiser la séquence">
                                            <i class="fas fa-redo"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteCodeFormat(format)" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination && pagination.totalPages > 1" class="pagination">
                <button 
                    class="btn btn-outline" 
                    :disabled="pagination.currentPage === 1"
                    @click="changePage(pagination.currentPage - 1)"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <span class="pagination-info">
                    Page {{ pagination.currentPage }} sur {{ pagination.totalPages }}
                </span>
                
                <button 
                    class="btn btn-outline" 
                    :disabled="pagination.currentPage === pagination.totalPages"
                    @click="changePage(pagination.currentPage + 1)"
                >
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Modal de création/édition -->
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content modal-xl" @click.stop>
                    <div class="modal-header">
                        <h3>{{ isEditing ? 'Modifier le format de code' : 'Nouveau format de code' }}</h3>
                        <button class="close-btn" @click="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveCodeFormat">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="entity-type">Type d'entité *</label>
                                    <select 
                                        id="entity-type"
                                        v-model="form.entityType"
                                        @change="updatePatternSuggestion"
                                        required
                                    >
                                        <option value="">Sélectionner un type</option>
                                        <option v-for="type in entityTypes" :key="type.value" :value="type.value">
                                            {{ type.label }}
                                        </option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="format-pattern">Pattern de format *</label>
                                    <input 
                                        type="text" 
                                        id="format-pattern"
                                        v-model="form.formatPattern"
                                        placeholder="Ex: VH-{YEAR}-{MONTH}-{SEQUENCE}"
                                        required
                                    >
                                    <small class="form-help">
                                        Variables disponibles: {YEAR}, {MONTH}, {DAY}, {SEQUENCE}
                                    </small>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="prefix">Préfixe</label>
                                    <input 
                                        type="text" 
                                        id="prefix"
                                        v-model="form.prefix"
                                        placeholder="Ex: VH"
                                        maxlength="10"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="suffix">Suffixe</label>
                                    <input 
                                        type="text" 
                                        id="suffix"
                                        v-model="form.suffix"
                                        placeholder="Ex: IA"
                                        maxlength="10"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="separator">Séparateur</label>
                                    <input 
                                        type="text" 
                                        id="separator"
                                        v-model="form.separator"
                                        placeholder="-"
                                        maxlength="5"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="form.includeYear">
                                        <span class="checkmark"></span>
                                        <span class="checkbox-text">Inclure l'année</span>
                                    </label>
                                </div>
                                
                                <div class="form-group checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="form.includeMonth">
                                        <span class="checkmark"></span>
                                        <span class="checkbox-text">Inclure le mois</span>
                                    </label>
                                </div>
                                
                                <div class="form-group checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="form.includeDay">
                                        <span class="checkmark"></span>
                                        <span class="checkbox-text">Inclure le jour</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="sequence-length">Longueur de la séquence *</label>
                                    <input 
                                        type="number" 
                                        id="sequence-length"
                                        v-model="form.sequenceLength"
                                        min="1"
                                        max="10"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="sequence-start">Séquence de départ *</label>
                                    <input 
                                        type="number" 
                                        id="sequence-start"
                                        v-model="form.sequenceStart"
                                        min="1"
                                        required
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="current-sequence">Séquence actuelle</label>
                                    <input 
                                        type="number" 
                                        id="current-sequence"
                                        v-model="form.currentSequence"
                                        min="0"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="description">Description</label>
                                <textarea 
                                    id="description"
                                    v-model="form.description"
                                    rows="3"
                                    placeholder="Description du format de code..."
                                ></textarea>
                            </div>
                            
                            <div class="form-group checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="form.isActive">
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">Format actif</span>
                                </label>
                            </div>
                            
                            <!-- Prévisualisation -->
                            <div v-if="previewCode" class="preview-box">
                                <h4><i class="fas fa-eye"></i> Prévisualisation</h4>
                                <div class="preview-code">{{ previewCode }}</div>
                                <button type="button" class="btn btn-sm btn-outline" @click="generatePreview">
                                    <i class="fas fa-sync"></i>
                                    Actualiser la prévisualisation
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-secondary" @click="generatePreview">
                            <i class="fas fa-eye"></i>
                            Prévisualiser
                        </button>
                        <button type="button" class="btn btn-primary" @click="saveCodeFormat" :disabled="saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            {{ isEditing ? 'Modifier' : 'Créer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de suppression -->
            <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
                <div class="modal-content modal-sm" @click.stop>
                    <div class="modal-header">
                        <h3>Confirmer la suppression</h3>
                        <button class="close-btn" @click="closeDeleteModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="delete-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p v-if="codeFormatToDelete">
                                Êtes-vous sûr de vouloir supprimer le format de code pour 
                                <strong>{{ getEntityTypeLabel(codeFormatToDelete.entityType) }}</strong> ?
                            </p>
                            <p v-else>Êtes-vous sûr de vouloir supprimer ce format de code ?</p>
                            <p class="text-muted">Cette action est irréversible.</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" @click="closeDeleteModal">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="!codeFormatToDelete">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            codeFormats: [],
            entityTypes: [],
            loading: false,
            saving: false,
            searchTerm: '',
            statusFilter: '',
            entityTypeFilter: '',
            currentPage: 1,
            itemsPerPage: 10,
            pagination: null,
            showModal: false,
            showDeleteModal: false,
            isEditing: false,
            codeFormatToDelete: null,
            searchTimeout: null,
            previewCode: '',
            form: {
                id: null,
                entityType: '',
                formatPattern: '',
                prefix: '',
                suffix: '',
                includeYear: true,
                includeMonth: true,
                includeDay: false,
                sequenceLength: 4,
                sequenceStart: 1,
                currentSequence: 0,
                separator: '-',
                isActive: true,
                description: '',
                tenantId: null
            }
        };
    },
    
    mounted() {
        this.loadEntityTypes();
        this.loadCodeFormats();
    },
    
    methods: {
        async loadEntityTypes() {
            try {
                const response = await window.apiService.request('/code-formats/entity-types');
                if (response.success) {
                    this.entityTypes = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types d\'entité:', error);
            }
        },
        
        async loadCodeFormats() {
            this.loading = true;
            try {
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    search: this.searchTerm,
                    status: this.statusFilter,
                    entity_type: this.entityTypeFilter
                });
                
                const response = await window.apiService.request(`/code-formats/admin?${params.toString()}`);
                
                if (response.success) {
                    this.codeFormats = response.data;
                    this.pagination = response.pagination;
                } else {
                    this.showNotification('Erreur lors du chargement des formats de code: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des formats de code:', error);
                this.showNotification('Erreur lors du chargement des formats de code', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadCodeFormats();
            }, 500);
        },
        
        changePage(page) {
            this.currentPage = page;
            this.loadCodeFormats();
        },
        
        openCreateModal() {
            this.isEditing = false;
            this.resetForm();
            this.showModal = true;
            this.previewCode = '';
        },
        
        editCodeFormat(codeFormat) {
            this.isEditing = true;
            this.form = {
                id: codeFormat.id,
                entityType: codeFormat.entityType,
                formatPattern: codeFormat.formatPattern,
                prefix: codeFormat.prefix || '',
                suffix: codeFormat.suffix || '',
                includeYear: codeFormat.includeYear,
                includeMonth: codeFormat.includeMonth,
                includeDay: codeFormat.includeDay,
                sequenceLength: codeFormat.sequenceLength,
                sequenceStart: codeFormat.sequenceStart,
                currentSequence: codeFormat.currentSequence,
                separator: codeFormat.separator,
                isActive: codeFormat.isActive,
                description: codeFormat.description || '',
                tenantId: codeFormat.tenant ? codeFormat.tenant.id : null
            };
            this.showModal = true;
            this.generatePreview();
        },
        
        async saveCodeFormat() {
            if (!this.form.entityType.trim()) {
                this.showNotification('Le type d\'entité est requis', 'error');
                return;
            }
            
            if (!this.form.formatPattern.trim()) {
                this.showNotification('Le pattern de format est requis', 'error');
                return;
            }
            
            this.saving = true;
            try {
                let response;
                if (this.isEditing) {
                    response = await window.apiService.request(`/code-formats/admin/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(this.form)
                    });
                } else {
                    response = await window.apiService.request('/code-formats/admin', {
                        method: 'POST',
                        body: JSON.stringify(this.form)
                    });
                }
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeModal();
                    this.loadCodeFormats();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            } finally {
                this.saving = false;
            }
        },
        
        deleteCodeFormat(codeFormat) {
            this.codeFormatToDelete = codeFormat;
            this.showDeleteModal = true;
        },
        
        async confirmDelete() {
            if (!this.codeFormatToDelete) return;
            
            try {
                const response = await window.apiService.request(`/code-formats/admin/${this.codeFormatToDelete.id}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.closeDeleteModal();
                    this.loadCodeFormats();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                this.showNotification('Erreur lors de la suppression', 'error');
            }
        },
        
        async resetSequence(codeFormat) {
            if (!confirm(`Êtes-vous sûr de vouloir réinitialiser la séquence pour ${this.getEntityTypeLabel(codeFormat.entityType)} ?`)) {
                return;
            }
            
            try {
                const response = await window.apiService.request(`/code-formats/admin/${codeFormat.id}/reset-sequence`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showNotification(response.message, 'success');
                    this.loadCodeFormats();
                } else {
                    this.showNotification('Erreur: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la réinitialisation:', error);
                this.showNotification('Erreur lors de la réinitialisation', 'error');
            }
        },
        
        async generatePreview() {
            try {
                const response = await window.apiService.request('/code-formats/preview', {
                    method: 'POST',
                    body: JSON.stringify(this.form)
                });
                
                if (response.success && response.data) {
                    this.previewCode = response.data.previewCode;
                }
            } catch (error) {
                console.error('Erreur lors de la prévisualisation:', error);
            }
        },
        
        updatePatternSuggestion() {
            const selectedType = this.entityTypes.find(t => t.value === this.form.entityType);
            if (selectedType && !this.form.formatPattern) {
                this.form.formatPattern = selectedType.defaultPattern;
            }
        },
        
        closeModal() {
            this.showModal = false;
            this.resetForm();
            this.previewCode = '';
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.codeFormatToDelete = null;
        },
        
        resetForm() {
            this.form = {
                id: null,
                entityType: '',
                formatPattern: '',
                prefix: '',
                suffix: '',
                includeYear: true,
                includeMonth: true,
                includeDay: false,
                sequenceLength: 4,
                sequenceStart: 1,
                currentSequence: 0,
                separator: '-',
                isActive: true,
                description: '',
                tenantId: null
            };
        },
        
        getEntityTypeLabel(value) {
            const type = this.entityTypes.find(t => t.value === value);
            return type ? type.label : value;
        },
        
        generateExample(format) {
            const parts = [];
            
            if (format.prefix) {
                parts.push(format.prefix);
            }
            
            if (format.includeYear) {
                parts.push(new Date().getFullYear());
            }
            
            if (format.includeMonth) {
                const month = String(new Date().getMonth() + 1).padStart(2, '0');
                parts.push(month);
            }
            
            if (format.includeDay) {
                const day = String(new Date().getDate()).padStart(2, '0');
                parts.push(day);
            }
            
            const sequence = String(format.currentSequence + 1).padStart(format.sequenceLength, '0');
            parts.push(sequence);
            
            if (format.suffix) {
                parts.push(format.suffix);
            }
            
            return parts.join(format.separator);
        },
        
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined') {
    window.CodeFormatCrud = CodeFormatCrud;
    console.log('CodeFormatCrud component registered globally');
}


