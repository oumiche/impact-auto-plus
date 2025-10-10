# Changelog - Frontend Vue.js

## [2025-10-10] - Corrections API et Ajout de la Recherche

### ✅ Corrections majeures

#### Endpoints API corrigés
Les endpoints pour **Garages**, **Vehicles** et **Supplies** nécessitent le préfixe `/admin` :

**Avant** :
```javascript
GET /api/garages
POST /api/garages
PUT /api/garages/{id}
DELETE /api/garages/{id}
```

**Après** :
```javascript
GET /api/garages/admin
POST /api/garages/admin
PUT /api/garages/admin/{id}
DELETE /api/garages/admin/{id}
```

Idem pour `/vehicles` et `/supplies`.

**Raison** : Ces ressources sont liées à un tenant (organisation) et nécessitent des vérifications de permissions spécifiques via le pattern `/admin`.

#### Fichiers modifiés
- ✅ `frontend-vue/src/services/api.service.js` - Tous les endpoints corrigés

### 🔍 Nouvelle fonctionnalité : Barre de recherche

#### Composant créé
- ✅ `frontend-vue/src/components/common/SearchBar.vue`
  - Input avec icône 🔍
  - Bouton × pour effacer
  - Debounce de 300ms
  - Design moderne et responsive

#### Pages mises à jour avec recherche
1. **Garages** (`frontend-vue/src/views/Garages.vue`)
   - Recherche sur : nom, ville, adresse, email, téléphone

2. **Vehicles** (`frontend-vue/src/views/Vehicles.vue`)
   - Recherche sur : immatriculation, marque, modèle, VIN, couleur

3. **Supplies** (`frontend-vue/src/views/Supplies.vue`)
   - Recherche sur : nom, référence, catégorie, fournisseur

4. **Marques** (`frontend-vue/src/views/Marques.vue`)
   - Recherche sur : nom, code, pays, description

#### Fonctionnalités de la recherche
- ✅ Filtrage en temps réel (côté client)
- ✅ Debounce pour optimiser les performances
- ✅ Insensible à la casse (majuscules/minuscules)
- ✅ Recherche multi-champs
- ✅ Bouton pour effacer rapidement
- ✅ Placeholder adapté à chaque page

### 📚 Documentation créée
- ✅ `frontend-vue/API_ENDPOINTS_FIXES.md` - Documentation complète des corrections d'endpoints

### 🎯 Prochaines étapes
- [ ] Implémenter la recherche côté serveur (optionnel)
- [ ] Ajouter des filtres avancés (statut, date, etc.)
- [ ] Pagination pour les grandes listes
- [ ] Export des données (CSV, PDF)

---

## État du projet

### Pages complétées (avec CRUD + Recherche)
- ✅ Dashboard
- ✅ Garages
- ✅ Vehicles
- ✅ Supplies
- ✅ Users
- ✅ Marques (Brands)
- ✅ Modeles (Models)
- ✅ VehicleCategories
- ✅ VehicleColors
- ✅ FuelTypes
- ✅ LicenceTypes
- ✅ SupplyCategories
- ✅ InterventionTypes

### Pages en cours
- 🔄 Collaborateurs
- 🔄 Drivers
- 🔄 VehicleAssignments
- 🔄 VehicleInsurances
- 🔄 VehicleFuelLogs
- 🔄 VehicleMaintenances

### Fonctionnalités globales
- ✅ Authentification JWT
- ✅ Gestion multi-tenant
- ✅ Sidebar avec navigation
- ✅ Système de notifications toast
- ✅ Recherche en temps réel
- ✅ Design moderne et responsive
- ✅ Composants réutilisables (SearchBar, Modal, LoadingSpinner, etc.)

