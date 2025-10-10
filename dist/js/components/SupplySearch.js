/**
 * Composant Vue spécialisé pour la recherche de fournitures
 * Basé sur EntitySearch avec configuration spécifique aux fournitures
 */

const SupplySearch = {
    name: 'SupplySearch',
    extends: window.EntitySearch,
    props: {
        placeholder: {
            type: String,
            default: 'Rechercher une fourniture...'
        }
    },
    computed: {
        // Configuration spécifique aux fournitures
        displayConfig() {
            return {
                primary: 'name',
                secondary: 'reference',
                tertiary: 'price',
                primaryLabel: 'Nom',
                secondaryLabel: 'Référence',
                tertiaryLabel: 'Prix'
            };
        },
        
        searchFields() {
            return ['name', 'reference', 'description', 'category'];
        },
        
        searchIcon() {
            return 'fas fa-box';
        }
    },
    methods: {
        formatFieldValue(value, fieldPath) {
            if (fieldPath === 'price') {
                return this.formatCurrency ? this.formatCurrency(value) : value;
            }
            return value || '';
        },
        
        displayValue() {
            if (!this.value) return '';
            const supply = this.value;
            return `${supply.name || ''} - ${supply.reference || ''}`.trim().replace(/\s*-\s*$/, '');
        },
        
        formatCurrency(amount) {
            if (!amount) return '0 F CFA';
            const numAmount = parseFloat(amount);
            return isNaN(numAmount) ? '0 F CFA' : `${numAmount.toLocaleString('fr-FR')} F CFA`;
        }
    }
};

// Exposer le composant globalement
window.SupplySearch = SupplySearch;
