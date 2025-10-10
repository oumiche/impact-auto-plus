/**
 * Composant Vue spécialisé pour la recherche de devis
 * Basé sur EntitySearch avec configuration spécifique aux devis
 */

const QuoteSearch = {
    name: 'QuoteSearch',
    extends: window.EntitySearch,
    props: {
        placeholder: {
            type: String,
            default: 'Rechercher un devis...'
        }
    },
    computed: {
        // Configuration spécifique aux devis
        displayConfig() {
            return {
                primary: 'quoteNumber',
                secondary: 'intervention.title',
                tertiary: 'totalAmount',
                primaryLabel: 'N° Devis',
                secondaryLabel: 'Intervention',
                tertiaryLabel: 'Montant'
            };
        },
        
        searchFields() {
            return ['quoteNumber', 'intervention.title', 'intervention.vehicle.plateNumber', 'totalAmount'];
        },
        
        searchIcon() {
            return 'fas fa-file-invoice-dollar';
        }
    },
    methods: {
        formatFieldValue(value, fieldPath) {
            if (fieldPath === 'totalAmount') {
                return this.formatCurrency ? this.formatCurrency(value) : value;
            }
            return value || '';
        },
        
        displayValue() {
            if (!this.value) return '';
            const quote = this.value;
            const intervention = quote.intervention;
            const interventionInfo = intervention ? intervention.title || '' : '';
            return `${quote.quoteNumber || ''} - ${interventionInfo}`.trim().replace(/\s*-\s*$/, '');
        },
        
        formatCurrency(amount) {
            if (!amount) return '0 F CFA';
            const numAmount = parseFloat(amount);
            return isNaN(numAmount) ? '0 F CFA' : `${numAmount.toLocaleString('fr-FR')} F CFA`;
        }
    }
};

// Exposer le composant globalement
window.QuoteSearch = QuoteSearch;
