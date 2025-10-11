# API Endpoints - Pages d'Administration

📋 **Documentation complète des endpoints backend pour les pages d'administration**

---

## 🔧 Configuration Backend

Tous les contrôleurs héritent de `AbstractTenantController` et gèrent automatiquement :
- ✅ Authentification JWT
- ✅ Vérification du tenant actif
- ✅ Filtrage des données par tenant
- ✅ Validation des permissions

---

## 📡 Endpoints par Module

### 1. **Code Formats** (`/api/code-formats`)

**Base URL** : `https://127.0.0.1:8000/api/code-formats`

| Méthode | Endpoint | Description | Params/Body |
|---------|----------|-------------|-------------|
| `GET` | `/admin` | Liste des formats | `?page=1&limit=12&search=...&status=active` |
| `GET` | `/admin/{id}` | Détails d'un format | - |
| `POST` | `/admin` | Créer un format | Body JSON |
| `PUT` | `/admin/{id}` | Modifier un format | Body JSON |
| `DELETE` | `/admin/{id}` | Supprimer un format | - |
| `GET` | `/entity-types` | Types d'entités disponibles | - |
| `POST` | `/preview` | Prévisualiser un code | Body JSON |
| `POST` | `/admin/{id}/reset-sequence` | Réinitialiser la séquence | - |

**Paramètres de recherche** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Items par page (défaut: 10, max: 100)
- `search` : Recherche sur entityType, formatPattern, description
- `status` : `active` | `inactive` | (vide pour tous)
- `entity_type` : Filtrer par type d'entité

**Body de création/modification** :
```json
{
  "entityType": "intervention",
  "formatPattern": "{PREFIX}{SEPARATOR}{YEAR}{MONTH}{SEPARATOR}{SEQUENCE}",
  "prefix": "INT",
  "suffix": null,
  "separator": "-",
  "includeYear": true,
  "includeMonth": true,
  "includeDay": false,
  "sequenceLength": 4,
  "sequenceStart": 1,
  "isActive": true,
  "description": "Format pour les interventions"
}
```

---

### 2. **System Parameters** (`/api/parameters`)

**Base URL** : `https://127.0.0.1:8000/api/parameters`

| Méthode | Endpoint | Description | Params/Body |
|---------|----------|-------------|-------------|
| `GET` | `` | Liste des paramètres | `?page=1&limit=50&search=...&category=...` |
| `GET` | `/{id}` | Détails d'un paramètre | - |
| `POST` | `` | Créer un paramètre | Body JSON |
| `PUT` | `/{id}` | Modifier un paramètre | Body JSON |
| `DELETE` | `/{id}` | Supprimer un paramètre | - |
| `GET` | `/categories` | Catégories disponibles | - |
| `GET` | `/currency` | Devise système | - |

**Paramètres de recherche** :
- `page` : Numéro de page
- `limit` : Items par page
- `search` : Recherche sur parameterKey, category, description
- `category` : Filtrer par catégorie
- `dataType` : Filtrer par type de données
- `isEditable` : `true` | `false` (paramètres modifiables ou système)

**Body de création/modification** :
```json
{
  "category": "currency",
  "parameterKey": "default_currency",
  "value": "XOF",
  "dataType": "string",
  "description": "Devise par défaut du système",
  "isEditable": true,
  "isPublic": true,
  "defaultValue": "XOF"
}
```

**Types de données supportés** :
- `string` : Texte simple
- `integer` : Nombre entier
- `float` : Nombre décimal
- `boolean` : Vrai/Faux (stocké comme "1"/"0")
- `json` : Objet JSON (stocké comme string)

---

### 3. **Tenants** (`/api/tenants`)

**Base URL** : `https://127.0.0.1:8000/api/tenants`

| Méthode | Endpoint | Description | Params/Body |
|---------|----------|-------------|-------------|
| `GET` | `/admin` | Liste des tenants | `?page=1&limit=12&search=...&isActive=true` |
| `GET` | `/admin/{id}` | Détails d'un tenant | - |
| `POST` | `/admin` | Créer un tenant | Body JSON |
| `PUT` | `/admin/{id}` | Modifier un tenant | Body JSON |
| `DELETE` | `/admin/{id}` | Supprimer un tenant | - |
| `PATCH` | `/admin/{id}/status` | Toggle statut actif | - |
| `GET` | `/admin/search` | Recherche tenants | `?q=...` |
| `POST` | `/admin/{id}/logo` | Upload logo | FormData |
| `POST` | `/switch` | Changer de tenant actif | Body JSON |

**Paramètres de recherche** :
- `page` : Numéro de page
- `limit` : Items par page
- `search` : Recherche sur name, slug
- `isActive` : `true` | `false`

**Body de création/modification** :
```json
{
  "name": "Garage Central",
  "slug": "garage-central",
  "description": "Garage principal à Dakar",
  "logoUrl": "data:image/png;base64,...",
  "logoAltText": "Logo Garage Central",
  "isActive": true
}
```

**Upload de logo** :
```javascript
FormData:
  logo: File (image)
```

---

### 4. **User Tenant Permissions** (`/api/user-tenant-permissions`)

**Base URL** : `https://127.0.0.1:8000/api/user-tenant-permissions`

| Méthode | Endpoint | Description | Params/Body |
|---------|----------|-------------|-------------|
| `GET` | `/admin` | Liste des permissions | `?page=1&limit=12&search=...&isActive=true` |
| `GET` | `/admin/{id}` | Détails d'une permission | - |
| `POST` | `/admin` | Créer une permission | Body JSON |
| `PUT` | `/admin/{id}` | Modifier une permission | Body JSON |
| `DELETE` | `/admin/{id}` | Supprimer une permission | - |

**Paramètres de recherche** :
- `page` : Numéro de page
- `limit` : Items par page
- `search` : Recherche sur user, tenant
- `isActive` : `true` | `false`
- `isPrimary` : `true` | `false`

**Body de création/modification** :
```json
{
  "userId": 5,
  "tenantId": 2,
  "permissions": [
    "dashboard:read",
    "vehicles:read",
    "vehicles:create",
    "vehicles:update",
    "interventions:read"
  ],
  "isPrimary": true,
  "isActive": true,
  "notes": "Accès principal au garage central"
}
```

**Permissions disponibles** :
- `dashboard:read`
- `vehicles:read`, `vehicles:create`, `vehicles:update`, `vehicles:delete`
- `interventions:read`, `interventions:create`, `interventions:update`, `interventions:delete`
- `drivers:read`, `drivers:create`, `drivers:update`, `drivers:delete`
- `supplies:read`, `supplies:create`, `supplies:update`, `supplies:delete`
- `reports:read`, `reports:export`
- `admin:users`, `admin:tenants`, `admin:parameters`, `admin:full`

---

### 5. **Supply Prices** (`/api/supply-prices`)

**Base URL** : `https://127.0.0.1:8000/api/supply-prices`

| Méthode | Endpoint | Description | Params/Body |
|---------|----------|-------------|-------------|
| `GET` | `` | Liste des prix | `?page=1&limit=12&search=...&workType=...` |
| `GET` | `/{id}` | Détails d'un prix | - |
| `POST` | `` | Créer un prix | Body JSON |
| `PUT` | `/{id}` | Modifier un prix | Body JSON |
| `DELETE` | `/{id}` | Supprimer un prix | - |
| `GET` | `/analytics` | Analytics des prix | `?brandId=...&modelId=...&year=...` |

**Paramètres de recherche** :
- `page` : Numéro de page
- `limit` : Items par page
- `search` : Recherche sur description, garage, supplier
- `workType` : `labor` | `parts` | `other`
- `sourceType` : `manual` | `auto` | `import` | `catalog`
- `isAnomaly` : `true` | `false`
- `year` : Année d'enregistrement

**Body de création/modification** :
```json
{
  "description": "Changement plaquettes de frein avant",
  "workType": "parts",
  "category": "Freinage",
  "unitPrice": 25000.00,
  "quantity": 2.00,
  "vehicleId": 12,
  "vehicleBrandId": 5,
  "vehicleModelId": 18,
  "vehicleYear": 2020,
  "recordedAt": "2025-10-11T14:30:00",
  "validFrom": "2025-10-01",
  "validUntil": "2025-12-31",
  "sourceType": "manual",
  "garage": "Garage Central",
  "supplier": "Auto Pièces Plus",
  "notes": "Prix négocié"
}
```

**Réponse avec analytics** :
```json
{
  "id": 123,
  "description": "...",
  "unitPrice": "25000.00",
  "quantity": "2.00",
  "totalPrice": "50000.00",
  "currency": "F CFA",
  "isAnomaly": false,
  "deviationPercent": "5.2",
  "priceRank": "average",
  "recordedYear": 2025,
  "recordedMonth": 10,
  ...
}
```

---

### 6. **Users** (`/api/users`)

**Base URL** : `https://127.0.0.1:8000/api/users`

| Méthode | Endpoint | Description | Params/Body |
|---------|----------|-------------|-------------|
| `GET` | `/admin` | Liste des utilisateurs | `?page=1&limit=12&search=...&isActive=true` |
| `GET` | `/admin/{id}` | Détails d'un utilisateur | - |
| `POST` | `/admin` | Créer un utilisateur | Body JSON |
| `PUT` | `/admin/{id}` | Modifier un utilisateur | Body JSON |
| `DELETE` | `/admin/{id}` | Supprimer un utilisateur | - |

**Paramètres de recherche** :
- `page` : Numéro de page
- `limit` : Items par page
- `search` : Recherche sur username, email, firstName, lastName
- `isActive` : `true` | `false`

**Body de création/modification** :
```json
{
  "username": "jdupont",
  "email": "jean.dupont@email.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+221 77 123 45 67",
  "roles": ["ROLE_USER", "ROLE_ADMIN"],
  "password": "SecurePassword123!",
  "isActive": true
}
```

---

## 🔒 Sécurité et Authentification

### Headers Requis

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
X-Tenant-ID: {TENANT_ID} (pour certains endpoints)
```

### Rôles Requis

| Page | Rôle Minimum |
|------|--------------|
| CodeFormats | `ROLE_ADMIN` |
| SystemParameters | `ROLE_USER` (lecture), `ROLE_ADMIN` (modification) |
| Tenants | `ROLE_ADMIN` |
| UserTenantPermissions | `ROLE_ADMIN` |
| SupplyPrices | `ROLE_USER` |
| Users | `ROLE_ADMIN` |

---

## 📊 Format de Réponse Standard

### Success Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 12
  },
  "message": "Operation successful" // optionnel
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "code": 400
}
```

---

## ✅ Résumé des Corrections

### Endpoints Corrigés dans api.service.js

**CodeFormats** :
- ❌ `/code-formats` → ✅ `/code-formats/admin`
- ❌ `/code-formats/{id}` → ✅ `/code-formats/admin/{id}`

**Tenants** :
- ❌ `/tenants` → ✅ `/tenants/admin`
- ❌ `/tenants/{id}` → ✅ `/tenants/admin/{id}`
- ❌ `/tenants/{id}/logo` → ✅ `/tenants/admin/{id}/logo`

**UserTenantPermissions** :
- ❌ `/user-tenant-permissions` → ✅ `/user-tenant-permissions/admin`
- ❌ `/user-tenant-permissions/{id}` → ✅ `/user-tenant-permissions/admin/{id}`

**Endpoints Corrects (pas de changement)** :
- ✅ `/parameters` (pas de /admin)
- ✅ `/supply-prices` (pas de /admin)
- ✅ `/users/admin` (déjà correct)

---

## 🎯 Points d'Attention

### Auto-création de Données

**CodeFormats** :
- Si aucun format n'existe pour un tenant, le backend crée automatiquement les 12 formats par défaut
- Liste des formats par défaut : vehicle, driver, intervention, quote, invoice, etc.

**Validation** :
- Tous les endpoints valident les données côté backend avec Symfony Validator
- Messages d'erreur détaillés retournés en cas de validation échouée

**Tenant Filtering** :
- Les endpoints filtrent automatiquement par tenant actif
- Impossible d'accéder aux données d'un autre tenant
- Seuls les super admins peuvent voir les données globales (tenant = null)

---

## 📝 Notes de Développement

### Formats de Date
- **recordedAt** : `Y-m-d H:i:s` (datetime)
- **validFrom/Until** : `Y-m-d` (date)
- **createdAt/updatedAt** : `Y-m-d H:i:s` (datetime)

### Conversion de Valeurs (SystemParameters)
```php
// Boolean backend
value: '1' = true
value: '0' = false

// JSON backend
value: '{"key":"value"}' (string)

// Frontend
boolean: true/false
json: object/array
```

### Calculs Automatiques (SupplyPrices)
Le backend calcule automatiquement :
- `totalPrice` = `unitPrice` × `quantity`
- `recordedYear` = extraction année de `recordedAt`
- `recordedMonth` = extraction mois de `recordedAt`
- `isAnomaly` = détection basée sur l'historique
- `deviationPercent` = écart par rapport à la moyenne
- `priceRank` = classement du prix

---

**Date de mise à jour** : 11 octobre 2025  
**Version** : 1.0

