# Plan de Migration - Pages d'Administration

📋 **Vue d'ensemble** : 6 pages d'administration à migrer vers Vue.js 3

---

## 📊 Vue d'ensemble des pages

### 1. **CodeFormats.vue** (Priorité: 🔴 Haute - Simple)
**Entité Backend**: `CodeFormat`  
**Endpoint API**: `/api/code-formats`  
**Complexité**: ⭐⭐ (Facile - Form avec plusieurs booléens)

**Champs**:
- `entityType` (select/dropdown) - Type d'entité
- `formatPattern` (text) - Pattern du format
- `prefix` (text, nullable) - Préfixe
- `suffix` (text, nullable) - Suffixe
- `includeYear` (checkbox) - Inclure l'année
- `includeMonth` (checkbox) - Inclure le mois
- `includeDay` (checkbox) - Inclure le jour
- `sequenceLength` (number) - Longueur séquence (4)
- `sequenceStart` (number) - Début séquence (1)
- `currentSequence` (number, readonly) - Séquence actuelle
- `separator` (text) - Séparateur (-)
- `isActive` (checkbox) - Statut actif
- `description` (textarea, nullable) - Description

**Spécificités**:
- Prévisualisation du format de code généré
- Exemple dynamique basé sur les paramètres
- Warning si modification de format actif
- Liste des types d'entités (intervention, vehicle, quote, etc.)

**Colonnes liste**:
- Type entité
- Format pattern
- Exemple généré
- Séquence actuelle
- Statut actif/inactif

---

### 2. **SystemParameters.vue** (Priorité: 🔴 Haute - Critique)
**Entité Backend**: `SystemParameter`  
**Endpoint API**: `/api/parameters`  
**Complexité**: ⭐⭐⭐ (Moyen - Champs dynamiques selon dataType)

**Champs**:
- `category` (text) - Catégorie
- `parameterKey` (text) - Clé du paramètre
- `value` (dynamic) - Valeur (type dépend de dataType)
- `dataType` (select) - Type de données (string, integer, float, boolean, json)
- `description` (textarea, nullable) - Description
- `isEditable` (checkbox) - Modifiable
- `isPublic` (checkbox) - Publique
- `validationRules` (JSON, nullable) - Règles de validation
- `defaultValue` (text, nullable) - Valeur par défaut

**Spécificités**:
- Champ `value` dynamique selon `dataType`:
  - `string`: input text
  - `integer`: input number
  - `float`: input number step="0.01"
  - `boolean`: checkbox
  - `json`: textarea avec validation JSON
- Protection des paramètres système (isEditable = false)
- Groupement par catégorie dans la liste
- Filtres par catégorie

**Colonnes liste**:
- Catégorie
- Clé
- Valeur (formatée selon type)
- Type
- Modifiable/Système
- Public/Privé

---

### 3. **Tenants.vue** (Priorité: 🟠 Moyenne - Multi-tenant)
**Entité Backend**: `Tenant`  
**Endpoint API**: `/api/tenants`  
**Complexité**: ⭐⭐⭐ (Moyen - Upload logo)

**Champs**:
- `name` (text, required) - Nom du tenant
- `slug` (text, unique, auto-généré) - Slug (URL-friendly)
- `description` (textarea, nullable) - Description
- `logoPath` (file upload, nullable) - Chemin logo
- `logoUrl` (text, nullable) - URL du logo
- `logoAltText` (text, nullable) - Texte alternatif logo
- `isActive` (checkbox) - Statut actif

**Spécificités**:
- Auto-génération du slug depuis le nom
- Validation unicité du slug
- Upload de logo (image)
- Prévisualisation du logo
- Gestion des chemins de fichiers
- Warning si désactivation d'un tenant actif
- Afficher nombre d'utilisateurs par tenant

**Colonnes liste**:
- Logo (thumbnail)
- Nom
- Slug
- Nombre d'utilisateurs
- Statut actif/inactif
- Date création

---

### 4. **UserTenantPermissions.vue** (Priorité: 🔴 Haute - Sécurité)
**Entité Backend**: `UserTenantPermission`  
**Endpoint API**: `/api/user-tenant-permissions`  
**Complexité**: ⭐⭐⭐⭐ (Complexe - Gestion permissions multi-niveau)

**Champs**:
- `userId` (server-side selector, required) - Utilisateur
- `tenantId` (server-side selector, required) - Tenant
- `permissions` (checkboxes/multiselect, JSON array) - Permissions
- `isPrimary` (checkbox) - Tenant principal
- `isActive` (checkbox) - Statut actif
- `notes` (textarea, nullable) - Notes

**Spécificités**:
- Sélecteurs server-side pour User et Tenant
- Interface de gestion des permissions (checkboxes groupées)
- Permissions par module:
  - Dashboard (read)
  - Vehicles (read, create, update, delete)
  - Interventions (read, create, update, delete)
  - Reports (read, export)
  - Admin (full)
- Validation : un seul tenant principal par utilisateur
- Afficher permissions actuelles de l'utilisateur
- Quick actions : Activer/Désactiver, Définir comme principal

**Colonnes liste**:
- Utilisateur (nom + email)
- Tenant
- Permissions (badges)
- Principal (badge)
- Statut actif/inactif
- Date affectation

---

### 5. **SupplyPrices.vue** (Priorité: 🟡 Moyenne - Analytics)
**Entité Backend**: `SupplyPriceHistory`  
**Endpoint API**: `/api/supply-prices`  
**Complexité**: ⭐⭐⭐⭐⭐ (Très complexe - Analytics + Relations multiples)

**Champs**:
- `supplyId` (server-side selector, nullable) - Pièce/Service
- `description` (text, required) - Description
- `workType` (select, required) - Type (labor, parts, other)
- `category` (text, nullable) - Catégorie
- `unitPrice` (number, required) - Prix unitaire
- `quantity` (number, default: 1.00) - Quantité
- `totalPrice` (number, readonly, calculated) - Prix total (auto)
- `currency` (text, default: 'XOF') - Devise
- `vehicleId` (server-side selector, nullable) - Véhicule
- `vehicleBrandId` (server-side selector, nullable) - Marque
- `vehicleModelId` (server-side selector, nullable) - Modèle
- `vehicleYear` (number, required) - Année véhicule
- `recordedAt` (datetime, required) - Date d'enregistrement
- `validFrom` (date, nullable) - Valide depuis
- `validUntil` (date, nullable) - Valide jusqu'au
- `sourceType` (select, required) - Source (auto, manual, import, catalog)
- `garage` (text, nullable) - Garage
- `supplier` (text, nullable) - Fournisseur
- `notes` (textarea, nullable) - Notes
- `isAnomaly` (readonly, boolean) - Anomalie détectée
- `deviationPercent` (readonly, decimal) - Écart en %
- `priceRank` (readonly, select) - Rang de prix

**Spécificités**:
- Calcul automatique du `totalPrice` (unitPrice × quantity)
- Extraction automatique year/month depuis `recordedAt`
- Détection d'anomalies de prix (backend)
- Graphiques d'évolution des prix
- Statistiques par marque/modèle
- Filtres avancés:
  - Par marque/modèle
  - Par période
  - Par source
  - Par anomalie
- Badges visuels pour anomalies:
  - 🔴 Critique (>50%)
  - 🟠 Élevé (30-50%)
  - 🟡 Moyen (20-30%)
  - 🟢 Normal
- Export données pour analytics

**Colonnes liste**:
- Description
- Véhicule (marque/modèle/année)
- Prix unitaire
- Quantité
- Prix total
- Date enregistrement
- Source
- Anomalie (badge coloré)
- Rang de prix

---

### 6. **Users.vue** (Priorité: 🔴 Haute - Sécurité)
**Entité Backend**: `User`  
**Endpoint API**: `/api/users`  
**Complexité**: ⭐⭐⭐⭐ (Complexe - Sécurité + Rôles)

**Champs** (déjà implémenté dans `Collaborateurs.vue`):
- `username` (text, unique, required)
- `email` (email, unique, required)
- `firstName` (text, required)
- `lastName` (text, required)
- `phone` (tel, nullable)
- `roles` (multiselect, JSON array) - Rôles
- `password` (password, required on create) - Mot de passe
- `isActive` (checkbox) - Statut actif

**Spécificités**:
- **IMPORTANT**: Page déjà migrée sous le nom `Collaborateurs.vue`
- Validation email unique
- Validation username unique
- Gestion des rôles (ROLE_USER, ROLE_ADMIN, ROLE_SUPER_ADMIN)
- Mot de passe requis à la création, optionnel à la modification
- Hash du mot de passe côté backend
- Protection du compte super admin
- Afficher tenants associés
- Quick actions : Activer/Désactiver, Réinitialiser mot de passe

**Action requise**:
- ✅ Déjà migré (`Collaborateurs.vue`)
- Renommer/Aliaser la route si nécessaire
- Vérifier que tous les champs sont bien présents

---

## 🔧 Composants Réutilisables Nécessaires

### ✅ **Déjà Disponibles**
1. `Modal.vue` - Modales réutilisables
2. `SearchBar.vue` - Barre de recherche
3. `Pagination.vue` - Pagination
4. `VehicleSelector.vue` - Sélecteur véhicule server-side
5. `DriverSelector.vue` - Sélecteur conducteur server-side
6. `SimpleSelector.vue` - Sélecteur simple générique

### 🆕 **Nouveaux Composants à Créer**

#### 1. **UserSelector.vue**
- Recherche server-side d'utilisateurs
- Affichage : nom complet + email
- Preload des 5 premiers
- Filtres : isActive

#### 2. **TenantSelector.vue**
- Recherche server-side de tenants
- Affichage : nom + logo
- Preload des 5 premiers
- Filtres : isActive

#### 3. **PermissionManager.vue**
- Interface de gestion des permissions
- Groupement par module
- Checkboxes hiérarchiques
- Validation des permissions

#### 4. **FileUploader.vue**
- Upload de fichiers (images)
- Prévisualisation
- Validation taille/type
- Gestion erreurs

#### 5. **JsonEditor.vue**
- Éditeur JSON avec validation
- Coloration syntaxique
- Validation en temps réel
- Format automatique

#### 6. **CodePreview.vue**
- Prévisualisation du code généré
- Mise à jour dynamique
- Exemples

---

## 📋 Ordre de Migration Recommandé

### Phase 1 : Pages Simples (Fondations)
1. **CodeFormats.vue** (2h)
   - Formulaire standard avec checkboxes
   - Prévisualisation du format
   - Validation des patterns

### Phase 2 : Configuration Système
2. **SystemParameters.vue** (3h)
   - Champs dynamiques selon dataType
   - Validation JSON
   - Groupement par catégorie
   - Protection paramètres système

### Phase 3 : Multi-tenant
3. **Tenants.vue** (4h)
   - Upload de logo (FileUploader)
   - Auto-génération slug
   - Validation unicité
   - Prévisualisation

### Phase 4 : Gestion Avancée
4. **UserTenantPermissions.vue** (5h)
   - UserSelector + TenantSelector
   - PermissionManager
   - Validation complexe
   - Quick actions

### Phase 5 : Analytics
5. **SupplyPrices.vue** (6h)
   - Interface complexe multi-relations
   - Calculs automatiques
   - Détection anomalies
   - Graphiques (Chart.js?)
   - Filtres avancés
   - Export données

### Phase 6 : Finalisation
6. **Users.vue** (1h)
   - ✅ Déjà fait (`Collaborateurs.vue`)
   - Vérification complète
   - Tests finaux

---

## 🎯 Temps Estimé Total

- **Développement** : ~21 heures
- **Tests** : ~4 heures
- **Documentation** : ~2 heures
- **Total** : ~27 heures

---

## 🚨 Points d'Attention

### Sécurité
- UserTenantPermissions : validation stricte des permissions
- SystemParameters : protection des paramètres système
- Users : hash des mots de passe, validation rôles

### Performance
- SupplyPrices : pagination server-side obligatoire (volume important)
- UserSelector/TenantSelector : recherche server-side avec debounce
- Graphiques : lazy loading si nécessaire

### UX
- CodeFormats : prévisualisation temps réel
- SystemParameters : interface intuitive selon dataType
- Tenants : upload drag & drop pour logos
- UserTenantPermissions : interface claire de gestion permissions

### Validation
- CodeFormats : pattern valide
- SystemParameters : validation selon dataType
- Tenants : slug unique
- UserTenantPermissions : un seul tenant principal

---

## 📝 Checklist de Migration par Page

Pour chaque page :
- [ ] Analyser entité backend
- [ ] Vérifier endpoints API
- [ ] Créer composants nécessaires
- [ ] Implémenter formulaire
- [ ] Implémenter liste avec pagination
- [ ] Ajouter recherche et filtres
- [ ] Implémenter validation
- [ ] Ajouter notifications
- [ ] Tests CRUD complet
- [ ] Tests responsiveness
- [ ] Documentation

---

## 🎨 Standards UI/UX

### Layout
- Grilles de cartes responsive (comme pages actuelles)
- Header avec actions principales
- Filtres en haut de page
- Pagination en bas

### Couleurs
- Actif : vert (#10b981)
- Inactif : gris (#6b7280)
- Anomalie critique : rouge (#ef4444)
- Anomalie moyenne : orange (#f59e0b)
- Normal : vert (#10b981)

### Composants
- Badges pour statuts
- Tooltips pour informations supplémentaires
- Loading states
- Error states
- Empty states

---

## 🔗 Dépendances API

### Endpoints à vérifier
```
GET    /api/code-formats
POST   /api/code-formats
PUT    /api/code-formats/{id}
DELETE /api/code-formats/{id}

GET    /api/parameters
POST   /api/parameters
PUT    /api/parameters/{id}
DELETE /api/parameters/{id}

GET    /api/tenants
POST   /api/tenants
PUT    /api/tenants/{id}
DELETE /api/tenants/{id}

GET    /api/user-tenant-permissions
POST   /api/user-tenant-permissions
PUT    /api/user-tenant-permissions/{id}
DELETE /api/user-tenant-permissions/{id}

GET    /api/supply-prices
POST   /api/supply-prices
PUT    /api/supply-prices/{id}
DELETE /api/supply-prices/{id}
GET    /api/supply-prices/analytics (pour graphiques)

GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Endpoints auxiliaires nécessaires
```
GET /api/users/search?q={query}
GET /api/tenants/search?q={query}
GET /api/code-formats/entity-types (liste types d'entités)
GET /api/parameters/categories (liste catégories)
POST /api/tenants/upload-logo (upload logo)
```

---

## ✅ Critères de Validation

Une page est considérée comme **complète** si :
1. ✅ CRUD complet fonctionnel (Create, Read, Update, Delete)
2. ✅ Recherche server-side opérationnelle
3. ✅ Pagination fonctionnelle
4. ✅ Filtres implémentés
5. ✅ Validation frontend et backend
6. ✅ Notifications success/error
7. ✅ Responsive (mobile, tablet, desktop)
8. ✅ Aucune erreur console
9. ✅ Documentation à jour
10. ✅ Tests manuels passés

---

**Prêt à commencer ?** 🚀

Proposition d'ordre de travail :
1. Créer les composants réutilisables manquants
2. Migrer les pages dans l'ordre recommandé
3. Tester chaque page individuellement
4. Tests d'intégration globaux
5. Documentation finale

