/**
 * Configuration centralisée pour toutes les entités de recherche
 * Utilisée par EntitySearch et ses composants spécialisés
 */

window.EntityConfigs = {
    // Configuration pour les véhicules
    vehicle: {
        displayConfig: {
            primary: 'plateNumber',
            secondary: 'brand',
            tertiary: 'model',
            primaryLabel: 'Plaque',
            secondaryLabel: 'Marque',
            tertiaryLabel: 'Modèle'
        },
        searchFields: ['plateNumber', 'brand', 'model', 'chassisNumber'],
        searchIcon: 'fas fa-car',
        placeholder: 'Rechercher un véhicule...',
        getDisplayValue: (vehicle) => {
            if (!vehicle) return '';
            return `${vehicle.plateNumber || ''} - ${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
        },
        formatFieldValue: (value, fieldPath) => {
            if (fieldPath === 'plateNumber') {
                return value ? value.toUpperCase() : '';
            }
            return value || '';
        }
    },

    // Configuration pour les interventions
    intervention: {
        displayConfig: {
            primary: 'code',
            secondary: 'title',
            tertiary: 'vehicle.plateNumber',
            primaryLabel: 'Code',
            secondaryLabel: 'Titre',
            tertiaryLabel: 'Véhicule'
        },
        searchFields: ['code', 'title', 'vehicle.plateNumber', 'vehicle.brand', 'vehicle.model'],
        searchIcon: 'fas fa-wrench',
        placeholder: 'Rechercher une intervention...',
        getDisplayValue: (intervention) => {
            if (!intervention) return '';
            const code = intervention.code || `INT-${intervention.id}`;
            const vehicle = intervention.vehicle;
            const vehicleInfo = vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.plateNumber || ''})` : '';
            return `${code} - ${intervention.title || ''} - ${vehicleInfo}`.trim().replace(/\s*-\s*$/, '');
        },
        formatFieldValue: (value, fieldPath) => {
            if (fieldPath === 'vehicle.plateNumber') {
                return value ? value.toUpperCase() : '';
            }
            return value || '';
        }
    },

    // Configuration pour les garages
    garage: {
        displayConfig: {
            primary: 'name',
            secondary: 'address',
            tertiary: 'phone',
            primaryLabel: 'Nom',
            secondaryLabel: 'Adresse',
            tertiaryLabel: 'Téléphone'
        },
        searchFields: ['name', 'address', 'phone', 'email'],
        searchIcon: 'fas fa-building',
        placeholder: 'Rechercher un garage...',
        getDisplayValue: (garage) => {
            if (!garage) return '';
            return garage.name || '';
        },
        formatFieldValue: (value, fieldPath) => {
            return value || '';
        }
    },

    // Configuration pour les devis
    quote: {
        displayConfig: {
            primary: 'quoteNumber',
            secondary: 'intervention.title',
            tertiary: 'totalAmount',
            primaryLabel: 'N° Devis',
            secondaryLabel: 'Intervention',
            tertiaryLabel: 'Montant'
        },
        searchFields: ['quoteNumber', 'intervention.title', 'intervention.vehicle.plateNumber', 'totalAmount'],
        searchIcon: 'fas fa-file-invoice-dollar',
        placeholder: 'Rechercher un devis...',
        getDisplayValue: (quote) => {
            if (!quote) return '';
            const intervention = quote.intervention;
            const interventionInfo = intervention ? intervention.title || '' : '';
            return `${quote.quoteNumber || ''} - ${interventionInfo}`.trim().replace(/\s*-\s*$/, '');
        },
        formatFieldValue: (value, fieldPath) => {
            if (fieldPath === 'totalAmount') {
                if (!value) return '0 F CFA';
                const numAmount = parseFloat(value);
                return isNaN(numAmount) ? '0 F CFA' : `${numAmount.toLocaleString('fr-FR')} F CFA`;
            }
            return value || '';
        }
    },

    // Configuration pour les factures
    invoice: {
        displayConfig: {
            primary: 'invoiceNumber',
            secondary: 'intervention.title',
            tertiary: 'totalAmount',
            primaryLabel: 'N° Facture',
            secondaryLabel: 'Intervention',
            tertiaryLabel: 'Montant'
        },
        searchFields: ['invoiceNumber', 'intervention.title', 'intervention.vehicle.plateNumber', 'totalAmount', 'status'],
        searchIcon: 'fas fa-file-invoice',
        placeholder: 'Rechercher une facture...',
        getDisplayValue: (invoice) => {
            if (!invoice) return '';
            const intervention = invoice.intervention;
            const interventionInfo = intervention ? intervention.title || '' : '';
            return `${invoice.invoiceNumber || ''} - ${interventionInfo}`.trim().replace(/\s*-\s*$/, '');
        },
        formatFieldValue: (value, fieldPath) => {
            if (fieldPath === 'totalAmount') {
                if (!value) return '0 F CFA';
                const numAmount = parseFloat(value);
                return isNaN(numAmount) ? '0 F CFA' : `${numAmount.toLocaleString('fr-FR')} F CFA`;
            }
            return value || '';
        }
    },

    // Configuration pour les clients
    customer: {
        displayConfig: {
            primary: 'name',
            secondary: 'email',
            tertiary: 'phone',
            primaryLabel: 'Nom',
            secondaryLabel: 'Email',
            tertiaryLabel: 'Téléphone'
        },
        searchFields: ['name', 'email', 'phone', 'company'],
        searchIcon: 'fas fa-user',
        placeholder: 'Rechercher un client...',
        getDisplayValue: (customer) => {
            if (!customer) return '';
            return customer.name || customer.company || '';
        },
        formatFieldValue: (value, fieldPath) => {
            return value || '';
        }
    },

    // Configuration pour les fournitures
    supply: {
        displayConfig: {
            primary: 'name',
            secondary: 'reference',
            tertiary: 'price',
            primaryLabel: 'Nom',
            secondaryLabel: 'Référence',
            tertiaryLabel: 'Prix'
        },
        searchFields: ['name', 'reference', 'description', 'category'],
        searchIcon: 'fas fa-box',
        placeholder: 'Rechercher une fourniture...',
        getDisplayValue: (supply) => {
            if (!supply) return '';
            return `${supply.name || ''} - ${supply.reference || ''}`.trim().replace(/\s*-\s*$/, '');
        },
        formatFieldValue: (value, fieldPath) => {
            if (fieldPath === 'price') {
                if (!value) return '0 F CFA';
                const numAmount = parseFloat(value);
                return isNaN(numAmount) ? '0 F CFA' : `${numAmount.toLocaleString('fr-FR')} F CFA`;
            }
            return value || '';
        }
    },

    // Configuration pour les techniciens/collaborateurs
    collaborator: {
        displayConfig: {
            primary: 'name',
            secondary: 'specialty',
            tertiary: 'phone',
            primaryLabel: 'Nom',
            secondaryLabel: 'Spécialité',
            tertiaryLabel: 'Téléphone'
        },
        searchFields: ['name', 'specialty', 'phone', 'email'],
        searchIcon: 'fas fa-user-tie',
        placeholder: 'Rechercher un collaborateur...',
        getDisplayValue: (collaborator) => {
            if (!collaborator) return '';
            return collaborator.name || '';
        },
        formatFieldValue: (value, fieldPath) => {
            return value || '';
        }
    }
};

// Fonction utilitaire pour créer un composant de recherche basé sur une configuration
window.createEntitySearchComponent = function(entityType, customProps = {}) {
    const config = window.EntityConfigs[entityType];
    if (!config) {
        throw new Error(`Configuration non trouvée pour l'entité: ${entityType}`);
    }

    return {
        name: `${entityType}SearchComponent`,
        extends: window.EntitySearch,
        props: {
            placeholder: {
                type: String,
                default: config.placeholder
            },
            ...customProps
        },
        computed: {
            displayConfig() {
                return config.displayConfig;
            },
            searchFields() {
                return config.searchFields;
            },
            searchIcon() {
                return config.searchIcon;
            }
        },
        methods: {
            formatFieldValue(value, fieldPath) {
                return config.formatFieldValue(value, fieldPath);
            },
            displayValue() {
                return config.getDisplayValue(this.value);
            }
        }
    };
};
