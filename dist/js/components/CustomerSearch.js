/**
 * Composant Vue spécialisé pour la recherche de clients
 * Basé sur EntitySearch avec configuration spécifique aux clients
 */

const CustomerSearch = {
    name: 'CustomerSearch',
    extends: window.EntitySearch,
    props: {
        placeholder: {
            type: String,
            default: 'Rechercher un client...'
        }
    },
    computed: {
        // Configuration spécifique aux clients
        displayConfig() {
            return {
                primary: 'name',
                secondary: 'email',
                tertiary: 'phone',
                primaryLabel: 'Nom',
                secondaryLabel: 'Email',
                tertiaryLabel: 'Téléphone'
            };
        },
        
        searchFields() {
            return ['name', 'email', 'phone', 'company'];
        },
        
        searchIcon() {
            return 'fas fa-user';
        }
    },
    methods: {
        formatFieldValue(value, fieldPath) {
            if (fieldPath === 'phone') {
                // Formatage du téléphone si nécessaire
                return value || '';
            }
            return value || '';
        },
        
        displayValue() {
            if (!this.value) return '';
            const customer = this.value;
            return customer.name || customer.company || '';
        }
    }
};

// Exposer le composant globalement
window.CustomerSearch = CustomerSearch;
