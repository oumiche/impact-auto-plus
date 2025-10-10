/**
 * Composant Vue spécialisé pour la recherche de véhicules
 * Basé sur EntitySearch avec configuration spécifique aux véhicules
 */

const VehicleSearch = {
    name: 'VehicleSearch',
    props: {
        value: {
            type: Object,
            default: null
        },
        placeholder: {
            type: String,
            default: 'Rechercher un véhicule...'
        },
        clearable: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isOpen: false,
            searchQuery: '',
            searchTimeout: null,
            vehicles: [],
            loading: false
        };
    },
    computed: {
        displayValue() {
            if (!this.value) return '';
            const vehicle = this.value;
            return `${vehicle.plateNumber || ''} - ${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
        },
        
        filteredVehicles() {
            if (!this.searchQuery) return this.vehicles;
            
            const query = this.searchQuery.toLowerCase();
            return this.vehicles.filter(vehicle => {
                return (
                    (vehicle.plateNumber && vehicle.plateNumber.toLowerCase().includes(query)) ||
                    (vehicle.brand && vehicle.brand.toLowerCase().includes(query)) ||
                    (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
                    (vehicle.chassisNumber && vehicle.chassisNumber.toLowerCase().includes(query))
                );
            });
        }
    },
    methods: {
        async loadVehicles(search = '') {
            this.loading = true;
            try {
                const response = await window.apiService.getVehicles(1, 50, search);
                if (response.success && response.data) {
                    this.vehicles = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement des véhicules:', error);
                this.vehicles = [];
            } finally {
                this.loading = false;
            }
        },
        
        toggleSearch() {
            this.isOpen = !this.isOpen;
            if (this.isOpen && this.vehicles.length === 0) {
                this.loadVehicles();
            }
            if (this.isOpen) {
                this.$nextTick(() => {
                    const input = this.$refs.searchInput;
                    if (input) input.focus();
                });
            }
        },
        
        onSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                if (this.searchQuery.length >= 2) {
                    this.loadVehicles(this.searchQuery);
                } else if (this.searchQuery.length === 0) {
                    this.loadVehicles();
                }
            }, 300);
        },
        
        selectVehicle(vehicle) {
            this.$emit('update:modelValue', vehicle);
            this.$emit('input', vehicle);
            this.isOpen = false;
            this.searchQuery = '';
        },
        
        clearSelection() {
            this.$emit('update:modelValue', null);
            this.$emit('input', null);
        },
        
        closeSearch() {
            this.isOpen = false;
        }
    },
    
    mounted() {
        document.addEventListener('click', (event) => {
            if (this.$el && !this.$el.contains(event.target)) {
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
                readonly
                class="intervention-search-input"
            >
            <button 
                type="button" 
                @click="toggleSearch"
                class="intervention-search-toggle"
                :class="{ 'active': isOpen }"
            >
                <i class="fas fa-car"></i>
            </button>
            <button 
                v-if="clearable && value" 
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
                        v-model="searchQuery"
                        @input="onSearch"
                        class="search-input"
                        ref="searchInput"
                    >
                </div>
                
                <div v-if="loading" class="search-results loading">
                    <i class="fas fa-spinner fa-spin"></i> Chargement...
                </div>
                
                <div v-else-if="filteredVehicles.length === 0" class="search-results empty">
                    <i class="fas fa-info-circle"></i>
                    Aucun véhicule trouvé
                </div>
                
                <div v-else class="search-results">
                    <div 
                        v-for="vehicle in filteredVehicles" 
                        :key="vehicle.id"
                        @click="selectVehicle(vehicle)"
                        class="search-result-item"
                    >
                        <div class="result-main">
                            <strong>{{ vehicle.plateNumber }}</strong>
                        </div>
                        <div class="result-meta">
                            {{ vehicle.brand }} {{ vehicle.model }}
                            <span v-if="vehicle.year" class="meta-secondary">{{ vehicle.year }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Exposer le composant globalement
window.VehicleSearch = VehicleSearch;
