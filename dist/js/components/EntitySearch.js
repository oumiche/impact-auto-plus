/**
 * Composant Vue générique pour la recherche d'entités
 * Utilisable pour véhicules, interventions, devis, factures, etc.
 */

const EntitySearch = {
    name: 'EntitySearch',
    props: {
        value: {
            type: Object,
            default: null
        },
        placeholder: {
            type: String,
            default: 'Rechercher...'
        },
        required: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        },
        items: {
            type: Array,
            default: () => []
        },
        showClear: {
            type: Boolean,
            default: true
        },
        // Configuration pour l'affichage des résultats
        displayConfig: {
            type: Object,
            default: () => ({
                primary: 'name',      // Champ principal (ex: name, title, code)
                secondary: 'description', // Champ secondaire (ex: description, address)
                tertiary: null,       // Champ tertiaire (ex: plateNumber, status)
                primaryLabel: '',     // Label pour le champ principal
                secondaryLabel: '',   // Label pour le champ secondaire
                tertiaryLabel: ''     // Label pour le champ tertiaire
            })
        },
        // Champs de recherche
        searchFields: {
            type: Array,
            default: () => ['name', 'title', 'code', 'description']
        },
        // Icône pour le bouton de recherche
        searchIcon: {
            type: String,
            default: 'fas fa-search'
        },
        // Classes CSS personnalisées
        customClasses: {
            type: Object,
            default: () => ({
                container: '',
                input: '',
                toggle: '',
                dropdown: '',
                resultItem: '',
                primary: '',
                secondary: '',
                tertiary: ''
            })
        }
    },
    data() {
        return {
            isOpen: false,
            searchQuery: '',
            searchTimeout: null
        }
    },
    computed: {
        displayValue() {
            if (!this.value) return '';
            
            const config = this.displayConfig;
            const primaryField = config.primary;
            
            // Gérer les champs imbriqués (ex: vehicle.plateNumber)
            if (primaryField.includes('.')) {
                const parts = primaryField.split('.');
                let value = this.value;
                for (const part of parts) {
                    value = value?.[part];
                }
                return value || '';
            }
            
            return this.value[primaryField] || '';
        },
        
        filteredItems() {
            if (!this.searchQuery) return this.items;
            
            const query = this.searchQuery.toLowerCase();
            return this.items.filter(item => {
                return this.searchFields.some(field => {
                    let fieldValue = item;
                    
                    // Gérer les champs imbriqués
                    if (field.includes('.')) {
                        const parts = field.split('.');
                        for (const part of parts) {
                            fieldValue = fieldValue?.[part];
                        }
                    } else {
                        fieldValue = item[field];
                    }
                    
                    return fieldValue && fieldValue.toString().toLowerCase().includes(query);
                });
            });
        },
        
        containerClasses() {
            return [
                'intervention-search-container',
                this.customClasses.container,
                { 'active': this.isOpen }
            ];
        },
        
        inputClasses() {
            return [
                'intervention-search-input',
                this.customClasses.input
            ];
        },
        
        toggleClasses() {
            return [
                'intervention-search-toggle',
                this.customClasses.toggle,
                { 'active': this.isOpen }
            ];
        },
        
        dropdownClasses() {
            return [
                'intervention-search-dropdown',
                this.customClasses.dropdown
            ];
        }
    },
    methods: {
        toggleSearch() {
            if (this.disabled) return;
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.$nextTick(() => {
                    const input = this.$refs.searchInput;
                    if (input) input.focus();
                });
            }
        },
        
        onSearch(event) {
            this.searchQuery = event.target.value;
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.$emit('search', this.searchQuery);
            }, 300);
        },
        
        selectItem(item) {
            this.$emit('input', item);
            this.isOpen = false;
            this.searchQuery = '';
        },
        
        clearSelection() {
            this.$emit('input', null);
            this.$emit('clear');
        },
        
        closeSearch() {
            this.isOpen = false;
        },
        
        getFieldValue(item, fieldPath) {
            if (!fieldPath) return '';
            
            if (fieldPath.includes('.')) {
                const parts = fieldPath.split('.');
                let value = item;
                for (const part of parts) {
                    value = value?.[part];
                }
                return value || '';
            }
            
            return item[fieldPath] || '';
        },
        
        formatFieldValue(value, fieldPath) {
            if (!value) return '';
            
            // Formatage spécial pour certains champs
            if (fieldPath.includes('plateNumber')) {
                return value.toUpperCase();
            }
            
            if (fieldPath.includes('amount') || fieldPath.includes('price')) {
                return this.formatAmount ? this.formatAmount(value) : value;
            }
            
            if (fieldPath.includes('date')) {
                return this.formatDate ? this.formatDate(value) : value;
            }
            
            return value;
        }
    },
    
    mounted() {
        // Fermer le dropdown en cliquant en dehors
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.intervention-search-container')) {
                this.closeSearch();
            }
        });
    },
    
    beforeDestroy() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    },
    
    template: `
        <div :class="containerClasses">
            <input 
                type="text" 
                :value="displayValue"
                :placeholder="placeholder"
                @click="toggleSearch"
                @input="onSearch"
                :readonly="true"
                :required="required"
                :disabled="disabled"
                :class="inputClasses"
            >
            <button 
                type="button" 
                @click="toggleSearch"
                :disabled="disabled"
                :class="toggleClasses"
            >
                <i :class="searchIcon"></i>
            </button>
            <button 
                v-if="showClear && value" 
                type="button" 
                class="clear-btn" 
                @click.stop="clearSelection"
            >
                <i class="fas fa-times"></i>
            </button>
            
            <div v-if="isOpen" :class="dropdownClasses">
                <div class="search-input-container">
                    <input 
                        type="text" 
                        placeholder="Tapez pour rechercher..."
                        @input="onSearch"
                        class="search-input"
                        ref="searchInput"
                        v-model="searchQuery"
                    >
                </div>
                <div class="intervention-results">
                    <div v-if="loading" class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i> Chargement...
                    </div>
                    <div v-else-if="filteredItems.length === 0" class="no-results">
                        Aucun résultat trouvé
                    </div>
                    <div 
                        v-else
                        v-for="item in filteredItems" 
                        :key="item.id"
                        @click="selectItem(item)"
                        :class="['intervention-result-item', customClasses.resultItem]"
                    >
                        <div v-if="displayConfig.primary" :class="['intervention-code', customClasses.primary]">
                            {{ formatFieldValue(getFieldValue(item, displayConfig.primary), displayConfig.primary) }}
                        </div>
                        <div v-if="displayConfig.secondary" :class="['intervention-title', customClasses.secondary]">
                            {{ formatFieldValue(getFieldValue(item, displayConfig.secondary), displayConfig.secondary) }}
                        </div>
                        <div v-if="displayConfig.tertiary" :class="['intervention-vehicle', customClasses.tertiary]">
                            {{ formatFieldValue(getFieldValue(item, displayConfig.tertiary), displayConfig.tertiary) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Exposer le composant globalement
window.EntitySearch = EntitySearch;
