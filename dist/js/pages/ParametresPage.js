/**
 * Page Paramètres - Impact Auto
 * Code Vue.js spécifique à la gestion des paramètres
 */

class ParametresPage {
    constructor() {
        this.app = null;
        this.init();
    }

    init() {
        // Attendre que Vue.js soit chargé
        if (typeof Vue !== 'undefined') {
            this.createApp();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.createApp();
            });
        }
    }

    createApp() {
        const { createApp } = Vue;

        this.app = createApp({
            data() {
                return {
                    parameters: [],
                    loading: false,
                    saving: false,
                    deleting: false,
                    searchTerm: '',
                    activeFilter: 'all',
                    showModal: false,
                    showDeleteModal: false,
                    isEditing: false,
                    currentParameter: null,
                    parameterToDelete: null,
                    
                    filters: [
                        { value: 'all', label: 'Tous' },
                        { value: 'general', label: 'Généraux' },
                        { value: 'tenant', label: 'Tenant' },
                        { value: 'system', label: 'Système' },
                        { value: 'ui', label: 'Interface' },
                        { value: 'notification', label: 'Notification' }
                    ],
                    
                    form: {
                        key: '',
                        value: '',
                        type: 'string',
                        category: 'general',
                        description: '',
                        isEditable: true,
                        isPublic: false
                    }
                }
            },
            
            computed: {
                filteredParameters() {
                    let filtered = this.parameters;
                    
                    // Filtre par terme de recherche
                    if (this.searchTerm) {
                        const term = this.searchTerm.toLowerCase();
                        filtered = filtered.filter(param => 
                            param.key.toLowerCase().includes(term) ||
                            param.description.toLowerCase().includes(term)
                        );
                    }
                    
                    // Filtre par catégorie
                    if (this.activeFilter !== 'all') {
                        filtered = filtered.filter(param => param.category === this.activeFilter);
                    }
                    
                    return filtered;
                }
            },
            
            mounted() {
                this.loadParameters();
            },
            
            methods: {
                async loadParameters() {
                    this.loading = true;
                    try {
                        // Simulation de données
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        this.parameters = [
                            {
                                id: 1,
                                key: 'app.name',
                                value: 'Impact Auto',
                                type: 'string',
                                category: 'general',
                                description: 'Nom de l\'application',
                                isEditable: true,
                                isPublic: true,
                                createdAt: '2024-01-15',
                                updatedAt: '2024-01-15'
                            },
                            {
                                id: 2,
                                key: 'app.version',
                                value: '1.0.0',
                                type: 'string',
                                category: 'system',
                                description: 'Version de l\'application',
                                isEditable: false,
                                isPublic: true,
                                createdAt: '2024-01-15',
                                updatedAt: '2024-01-15'
                            },
                            {
                                id: 3,
                                key: 'tenant.max_vehicles',
                                value: '100',
                                type: 'number',
                                category: 'tenant',
                                description: 'Nombre maximum de véhicules par tenant',
                                isEditable: true,
                                isPublic: false,
                                createdAt: '2024-01-15',
                                updatedAt: '2024-01-15'
                            }
                        ];
                    } catch (error) {
                        console.error('Erreur lors du chargement des paramètres:', error);
                    } finally {
                        this.loading = false;
                    }
                },
                
                setActiveFilter(filter) {
                    this.activeFilter = filter;
                },
                
                openModal(parameter = null) {
                    this.currentParameter = parameter;
                    this.isEditing = !!parameter;
                    
                    if (parameter) {
                        this.form = { ...parameter };
                    } else {
                        this.form = {
                            key: '',
                            value: '',
                            type: 'string',
                            category: 'general',
                            description: '',
                            isEditable: true,
                            isPublic: false
                        };
                    }
                    
                    this.showModal = true;
                },
                
                closeModal() {
                    this.showModal = false;
                    this.currentParameter = null;
                    this.isEditing = false;
                    this.form = {
                        key: '',
                        value: '',
                        type: 'string',
                        category: 'general',
                        description: '',
                        isEditable: true,
                        isPublic: false
                    };
                },
                
                async saveParameter() {
                    this.saving = true;
                    try {
                        // Simulation de sauvegarde
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        if (this.isEditing) {
                            // Mise à jour
                            const index = this.parameters.findIndex(p => p.id === this.currentParameter.id);
                            if (index !== -1) {
                                this.parameters[index] = { ...this.form, id: this.currentParameter.id };
                            }
                        } else {
                            // Création
                            const newParam = {
                                ...this.form,
                                id: Date.now(),
                                createdAt: new Date().toISOString().split('T')[0],
                                updatedAt: new Date().toISOString().split('T')[0]
                            };
                            this.parameters.push(newParam);
                        }
                        
                        this.closeModal();
                    } catch (error) {
                        console.error('Erreur lors de la sauvegarde:', error);
                    } finally {
                        this.saving = false;
                    }
                },
                
                openDeleteModal(parameter) {
                    this.parameterToDelete = parameter;
                    this.showDeleteModal = true;
                },
                
                closeDeleteModal() {
                    this.showDeleteModal = false;
                    this.parameterToDelete = null;
                },
                
                async deleteParameter() {
                    this.deleting = true;
                    try {
                        // Simulation de suppression
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const index = this.parameters.findIndex(p => p.id === this.parameterToDelete.id);
                        if (index !== -1) {
                            this.parameters.splice(index, 1);
                        }
                        
                        this.closeDeleteModal();
                    } catch (error) {
                        console.error('Erreur lors de la suppression:', error);
                    } finally {
                        this.deleting = false;
                    }
                },
                
                getTypeLabel(type) {
                    const types = {
                        'string': 'Texte',
                        'number': 'Nombre',
                        'boolean': 'Booléen',
                        'json': 'JSON'
                    };
                    return types[type] || type;
                },
                
                getCategoryLabel(category) {
                    const categories = {
                        'general': 'Général',
                        'tenant': 'Tenant',
                        'system': 'Système',
                        'ui': 'Interface',
                        'notification': 'Notification'
                    };
                    return categories[category] || category;
                }
            }
        });

        // Monter l'application
        this.app.mount('#app');
    }
}

// Initialiser la page paramètres
document.addEventListener('DOMContentLoaded', () => {
    new ParametresPage();
});

// Export pour utilisation externe
window.ParametresPage = ParametresPage;
