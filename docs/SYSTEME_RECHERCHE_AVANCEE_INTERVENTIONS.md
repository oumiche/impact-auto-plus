# Système de Recherche Avancée pour les Interventions Véhicules

## Vue d'ensemble

Le système de recherche avancée permet aux utilisateurs de rechercher et sélectionner des véhicules et conducteurs avec des fonctionnalités d'autocomplétion côté serveur, des informations détaillées et des fenêtres contextuelles.

## Architecture

### Frontend (Vue.js)
- **Composant** : `VehicleInterventionCrud`
- **Fichier** : `dist/js/vehicle-interventions-vue.js`
- **Styles** : `dist/css/vehicle-interventions.css`

### Backend (Symfony)
- **Contrôleur** : `VehicleInterventionController`
- **Services** : `CodeGenerationService`
- **APIs** : `getVehicles()`, `getDrivers()`

## Fonctionnalités

### 1. Recherche Côté Serveur

#### Véhicules
- **Déclenchement** : Après 2 caractères saisis
- **Debounce** : 300ms après la dernière frappe
- **Limite** : 20 résultats maximum
- **Critères** : Plaque, marque, modèle, VIN

#### Conducteurs
- **Déclenchement** : Après 2 caractères saisis
- **Debounce** : 300ms après la dernière frappe
- **Limite** : 20 résultats maximum
- **Critères** : Nom complet, téléphone, email

### 2. Chargement Initial

#### Comportement au Focus
- **Véhicules** : Charge automatiquement les 5 premiers véhicules actifs
- **Conducteurs** : Charge automatiquement les 5 premiers conducteurs actifs
- **Condition** : Seulement si aucun résultat n'est déjà affiché ET aucun terme de recherche saisi

#### Méthodes
```javascript
async onVehicleFocus() {
    this.showVehicleDropdown = true;
    if (this.vehicleSearchResults.length === 0 && !this.vehicleSearchTerm) {
        await this.loadInitialVehicles();
    }
}

async onDriverFocus() {
    this.showDriverDropdown = true;
    if (this.driverSearchResults.length === 0 && !this.driverSearchTerm) {
        await this.loadInitialDrivers();
    }
}
```

### 3. Affichage des Résultats

#### Véhicules
```html
<div class="vehicle-info-dropdown">
    <div class="vehicle-main">{{ vehicle.plateNumber }} - {{ vehicle.brand.name }} {{ vehicle.model.name }}</div>
    <div class="vehicle-details-dropdown">
        <span v-if="vehicle.year">{{ vehicle.year }}</span>
        <span v-if="vehicle.color">{{ vehicle.color.name }}</span>
        <span v-if="vehicle.fuelType">{{ vehicle.fuelType.name }}</span>
        <span v-if="vehicle.category">{{ vehicle.category.name }}</span>
    </div>
</div>
```

#### Conducteurs
```html
<div class="driver-info">
    <div class="driver-name">{{ driver.fullName }}</div>
    <div class="driver-details">
        <span v-if="driver.phone">{{ driver.phone }}</span>
        <span v-if="driver.email">{{ driver.email }}</span>
        <span v-if="driver.licenseNumber">Permis: {{ driver.licenseNumber }}</span>
    </div>
</div>
```

### 4. Fenêtres Contextuelles

#### Véhicules - Détails Complets
- Plaque d'immatriculation
- VIN (si disponible)
- Marque et modèle
- Année
- Couleur
- Catégorie
- Type de carburant
- Cylindrée (si disponible)
- Kilométrage (si disponible)
- Statut avec badge coloré

#### Conducteurs - Détails Complets
- Nom complet
- Téléphone
- Email
- Numéro de permis
- Date d'expiration du permis
- Adresse
- Contact d'urgence
- Téléphone d'urgence
- Statut (Actif/Inactif)

### 5. Gestion des Sélections

#### Interface Sélectionnée
```html
<div class="selected-item">
    <span>{{ selectedVehicle.plateNumber }} - {{ selectedVehicle.brand.name }} {{ selectedVehicle.model.name }}</span>
    <div class="selected-item-actions">
        <button type="button" @click="showVehicleDetails(selectedVehicle)" class="details-btn" title="Voir les détails">
            <i class="fas fa-info-circle"></i>
        </button>
        <button type="button" @click="clearVehicle" class="clear-btn" title="Supprimer la sélection">
            <i class="fas fa-times"></i>
        </button>
    </div>
</div>
```

#### Actions Disponibles
- **Consulter les détails** : Bouton bleu avec icône info
- **Supprimer la sélection** : Bouton gris avec icône X
- **Masquage du champ** : Le champ de recherche se masque quand un élément est sélectionné

## Structure des Données

### Véhicule (API Response)
```json
{
    "id": 1,
    "plateNumber": "AA 123 01",
    "brand": {
        "id": 1,
        "name": "Toyota"
    },
    "model": {
        "id": 4,
        "name": "RAV4"
    },
    "year": 2020,
    "color": {
        "id": 2,
        "name": "Blanc",
        "hexCode": "#FFFFFF"
    },
    "category": {
        "id": 1,
        "name": "SUV"
    },
    "fuelType": {
        "id": 1,
        "name": "Essence"
    },
    "vin": "1HGBH41JXMN109186",
    "engineSize": "2.0L",
    "mileage": 45000,
    "status": "active"
}
```

### Conducteur (API Response)
```json
{
    "id": 1,
    "fullName": "Jean Dupont",
    "phone": "+33 6 12 34 56 78",
    "email": "jean.dupont@email.com",
    "licenseNumber": "123456789",
    "licenseExpiryDate": "2025-12-31",
    "address": "123 Rue de la Paix, 75001 Paris",
    "emergencyContact": "Marie Dupont",
    "emergencyPhone": "+33 6 87 65 43 21",
    "isActive": true
}
```

## Styles CSS

### Composants de Recherche
```css
.searchable-select {
    position: relative;
    width: 100%;
}

.dropdown-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### Éléments Sélectionnés
```css
.selected-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 4px;
    margin-top: -1px;
    font-size: 14px;
    position: relative;
    z-index: 1;
}

.selected-item-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}
```

### Boutons d'Action
```css
.details-btn {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.clear-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    transition: all 0.2s ease;
}
```

## Méthodes JavaScript

### Recherche
```javascript
async searchVehicles() {
    clearTimeout(this.vehicleSearchTimeout);
    this.vehicleSearchTimeout = setTimeout(async () => {
        if (this.vehicleSearchTerm.length < 2) {
            this.vehicleSearchResults = [];
            return;
        }
        
        try {
            const response = await window.apiService.getVehicles(
                null, 
                this.vehicleSearchTerm, 
                'active', 
                1, 
                20
            );
            if (response.success) {
                this.vehicleSearchResults = response.data;
            }
        } catch (error) {
            console.error('Erreur lors de la recherche de véhicules:', error);
            this.vehicleSearchResults = [];
        }
    }, 300);
}
```

### Sélection
```javascript
selectVehicle(vehicle) {
    this.selectedVehicle = vehicle;
    this.form.vehicleId = vehicle.id;
    this.vehicleSearchTerm = '';
    this.showVehicleDropdown = false;
    this.vehicleSearchResults = [];
}
```

### Détails
```javascript
showVehicleDetails(vehicle) {
    this.selectedVehicleForDetails = vehicle;
    this.showVehicleDetailsModal = true;
}
```

## États du Composant

### Propriétés de Données
```javascript
data() {
    return {
        // Recherche véhicules
        vehicleSearchTerm: '',
        vehicleSearchResults: [],
        showVehicleDropdown: false,
        selectedVehicle: null,
        vehicleSearchTimeout: null,
        
        // Recherche conducteurs
        driverSearchTerm: '',
        driverSearchResults: [],
        showDriverDropdown: false,
        selectedDriver: null,
        driverSearchTimeout: null,
        
        // Modals de détails
        showVehicleDetailsModal: false,
        selectedVehicleForDetails: null,
        showDriverDetailsModal: false,
        selectedDriverForDetails: null,
        
        // Formulaires
        form: {
            vehicleId: '',
            driverId: '',
            // ... autres champs
        }
    };
}
```

## Gestion des Erreurs

### Try-Catch Blocks
```javascript
try {
    const response = await window.apiService.getVehicles(/* params */);
    if (response.success) {
        this.vehicleSearchResults = response.data;
    }
} catch (error) {
    console.error('Erreur lors de la recherche de véhicules:', error);
    this.vehicleSearchResults = [];
}
```

### Fallbacks
- **Pas de résultats** : Tableau vide affiché
- **Erreur API** : Log dans la console, résultats vides
- **Timeout** : Annulation des requêtes précédentes

## Performance

### Optimisations
- **Debouncing** : 300ms pour éviter les appels API excessifs
- **Limite de résultats** : 20 éléments maximum par recherche
- **Chargement initial** : 5 éléments seulement au focus
- **Nettoyage** : Suppression des timeouts et résultats lors des changements

### Mémoire
- **Nettoyage automatique** : Résultats vidés après sélection
- **Timeouts** : Annulation des requêtes en cours
- **Modals** : Fermeture et nettoyage des données

## Accessibilité

### Navigation Clavier
- **Tab** : Navigation entre les champs
- **Enter** : Sélection d'un élément dans la liste
- **Escape** : Fermeture des dropdowns

### ARIA Labels
- **Tooltips** : Titres descriptifs sur les boutons
- **Roles** : Boutons et listes correctement identifiés

### Contraste
- **Couleurs** : Respect des standards WCAG
- **Focus** : Bordures visibles pour la navigation clavier

## Tests Recommandés

### Tests Unitaires
- Méthodes de recherche
- Gestion des sélections
- Nettoyage des données

### Tests d'Intégration
- Appels API
- Gestion des erreurs
- Performance avec de gros volumes

### Tests Utilisateur
- Facilité de recherche
- Compréhension des détails
- Navigation intuitive

## Maintenance

### Points d'Attention
- **APIs** : Vérifier la compatibilité des formats de données
- **Performance** : Surveiller les temps de réponse
- **Erreurs** : Monitoring des erreurs JavaScript

### Évolutions Possibles
- **Cache** : Mise en cache des résultats fréquents
- **Favoris** : Sauvegarde des sélections fréquentes
- **Historique** : Mémorisation des dernières recherches
- **Filtres** : Filtres avancés par catégorie, statut, etc.

## Dépannage

### Problèmes Courants

#### Recherche ne fonctionne pas
- Vérifier la connexion API
- Contrôler les paramètres de recherche
- Vérifier les logs JavaScript

#### Affichage incorrect des données
- Vérifier la structure des données API
- Contrôler les propriétés `.name` vs objets
- Vérifier les conditions `v-if`

#### Performance lente
- Réduire la limite de résultats
- Augmenter le debounce
- Optimiser les requêtes API

### Logs de Debug
```javascript
console.log('Recherche véhicules:', this.vehicleSearchTerm);
console.log('Résultats:', this.vehicleSearchResults);
console.log('Véhicule sélectionné:', this.selectedVehicle);
```
