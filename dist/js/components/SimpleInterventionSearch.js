/**
 * Composant de test simplifié pour InterventionSearch
 * Compatible Vue 3
 */
const SimpleInterventionSearch = {
    name: 'SimpleInterventionSearch',
    props: {
        value: {
            type: Object,
            default: null
        },
        placeholder: {
            type: String,
            default: 'Rechercher une intervention...'
        },
        items: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['input', 'search', 'clear'],
    data() {
        return {
            isOpen: false,
            searchQuery: ''
        }
    },
    computed: {
        displayValue() {
            return this.value ? (this.value.title || this.value.name || '') : '';
        }
    },
    methods: {
        toggleSearch() {
            this.isOpen = !this.isOpen;
        },
        onSearch(event) {
            this.searchQuery = event.target.value;
            this.$emit('search', this.searchQuery);
        },
        selectItem(item) {
            this.$emit('input', item);
            this.isOpen = false;
        },
        clearSelection() {
            this.$emit('input', null);
            this.$emit('clear');
        }
    },
    template: `
        <div class="intervention-search-container" :class="{ 'active': isOpen }">
            <input 
                type="text" 
                :value="displayValue"
                :placeholder="placeholder"
                @click="toggleSearch"
                readonly
                class="intervention-search-input"
            >
            <button 
                type="button" 
                @click="toggleSearch"
                class="intervention-search-toggle"
            >
                <i class="fas fa-search"></i>
            </button>
            <button 
                v-if="value" 
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
                        v-model="searchQuery"
                    >
                </div>
                <div class="intervention-results">
                    <div v-if="loading" class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i> Chargement...
                    </div>
                    <div v-else-if="items.length === 0" class="no-results">
                        Aucun résultat trouvé
                    </div>
                    <div 
                        v-else
                        v-for="item in items" 
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
window.SimpleInterventionSearch = SimpleInterventionSearch;
