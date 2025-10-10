/**
 * Composant Vue réutilisable pour la recherche d'interventions
 * Utilisé dans les devis, factures et prédiagnostics
 */

const InterventionSearch = {
    name: 'InterventionSearch',
    props: {
        value: {
            type: Object,
            default: null
        },
        placeholder: {
            type: String,
            default: 'Rechercher une intervention...'
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
            return this.value ? this.value.displayText || this.value.title || this.value.name : '';
        },
        filteredItems() {
            if (!this.searchQuery) return this.items;
            return this.items.filter(item => 
                (item.title && item.title.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (item.name && item.name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (item.code && item.code.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (item.vehicle && item.vehicle.plateNumber && item.vehicle.plateNumber.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
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
    
    beforeUnmount() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    },
    
    template: `
        <div class="intervention-search-container" :class="{ 'active': isOpen }">
            <input 
                type="text" 
                :value="displayValue"
                :placeholder="placeholder"
                @click="toggleSearch"
                @input="onSearch"
                :readonly="true"
                :required="required"
                :disabled="disabled"
                class="intervention-search-input"
            >
            <button 
                type="button" 
                @click="toggleSearch"
                :disabled="disabled"
                class="intervention-search-toggle"
                :class="{ 'active': isOpen }"
            >
                <i class="fas fa-search"></i>
            </button>
            <button 
                v-if="showClear && value" 
                type="button" 
                class="clear-btn" 
                @click.stop="clearSelection"
            >
                <i class="fas fa-times"></i>
            </button>
            
            <div v-if="isOpen" class="intervention-search-dropdown">
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
                        class="intervention-result-item"
                    >
                        <div class="intervention-code">{{ item.code || 'INT-' + item.id }}</div>
                        <div class="intervention-title">{{ item.title || item.name }}</div>
                        <div v-if="item.vehicle" class="intervention-vehicle">
                            {{ item.vehicle.brand?.name }} {{ item.vehicle.model?.name }} 
                            ({{ item.vehicle.plateNumber }})
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Exposer le composant globalement
window.InterventionSearch = InterventionSearch;
