/**
 * Composant Vue spécialisé pour la recherche de factures
 * Basé sur EntitySearch avec configuration spécifique aux factures
 */

const InvoiceSearch = {
    name: 'InvoiceSearch',
    extends: window.EntitySearch,
    props: {
        placeholder: {
            type: String,
            default: 'Rechercher une facture...'
        }
    },
    computed: {
        // Configuration spécifique aux factures
        displayConfig() {
            return {
                primary: 'invoiceNumber',
                secondary: 'intervention.title',
                tertiary: 'totalAmount',
                primaryLabel: 'N° Facture',
                secondaryLabel: 'Intervention',
                tertiaryLabel: 'Montant'
            };
        },
        
        searchFields() {
            return ['invoiceNumber', 'intervention.title', 'intervention.vehicle.plateNumber', 'totalAmount', 'status'];
        },
        
        searchIcon() {
            return 'fas fa-file-invoice';
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
            const invoice = this.value;
            const intervention = invoice.intervention;
            const interventionInfo = intervention ? intervention.title || '' : '';
            return `${invoice.invoiceNumber || ''} - ${interventionInfo}`.trim().replace(/\s*-\s*$/, '');
        },
        
        formatCurrency(amount) {
            if (!amount) return '0 F CFA';
            const numAmount = parseFloat(amount);
            return isNaN(numAmount) ? '0 F CFA' : `${numAmount.toLocaleString('fr-FR')} F CFA`;
        }
    }
};

// Exposer le composant globalement
window.InvoiceSearch = InvoiceSearch;
