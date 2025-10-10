# Corrections des Endpoints API

## ✅ Problème résolu

Les endpoints pour les opérations CRUD (Create, Update, Delete) nécessitent le préfixe `/admin` pour certaines ressources.

## 📝 Endpoints corrigés

### Garages
- ❌ **Avant** : `GET /api/garages`
- ✅ **Après** : `GET /api/garages/admin`

- ❌ **Avant** : `POST /api/garages`
- ✅ **Après** : `POST /api/garages/admin`

- ❌ **Avant** : `PUT /api/garages/{id}`
- ✅ **Après** : `PUT /api/garages/admin/{id}`

- ❌ **Avant** : `DELETE /api/garages/{id}`
- ✅ **Après** : `DELETE /api/garages/admin/{id}`

### Vehicles
- ❌ **Avant** : `GET /api/vehicles`
- ✅ **Après** : `GET /api/vehicles/admin`

- ❌ **Avant** : `POST /api/vehicles`
- ✅ **Après** : `POST /api/vehicles/admin`

- ❌ **Avant** : `PUT /api/vehicles/{id}`
- ✅ **Après** : `PUT /api/vehicles/admin/{id}`

- ❌ **Avant** : `DELETE /api/vehicles/{id}`
- ✅ **Après** : `DELETE /api/vehicles/admin/{id}`

### Supplies
- ❌ **Avant** : `GET /api/supplies`
- ✅ **Après** : `GET /api/supplies/admin`

- ❌ **Avant** : `POST /api/supplies`
- ✅ **Après** : `POST /api/supplies/admin`

- ❌ **Avant** : `PUT /api/supplies/{id}`
- ✅ **Après** : `PUT /api/supplies/admin/{id}`

- ❌ **Avant** : `DELETE /api/supplies/{id}`
- ✅ **Après** : `DELETE /api/supplies/admin/{id}`

## ✅ Endpoints déjà corrects

### Users
- ✅ `POST /api/users` (pas de `/admin`)
- ✅ `PUT /api/users/{id}`
- ✅ `DELETE /api/users/{id}`

### Reference Data (Marques, Modeles, etc.)
- ✅ `POST /api/reference/brands` (pas de `/admin`)
- ✅ `PUT /api/reference/brands/{id}`
- ✅ `DELETE /api/reference/brands/{id}`
- ✅ Idem pour tous les autres endpoints de référence

## 📋 Résumé

| Ressource | Lecture (GET) | Création (POST) | Modification (PUT) | Suppression (DELETE) |
|-----------|---------------|-----------------|-------------------|---------------------|
| Garages | `/garages/admin` | `/garages/admin` | `/garages/admin/{id}` | `/garages/admin/{id}` |
| Vehicles | `/vehicles/admin` | `/vehicles/admin` | `/vehicles/admin/{id}` | `/vehicles/admin/{id}` |
| Supplies | `/supplies/admin` | `/supplies/admin` | `/supplies/admin/{id}` | `/supplies/admin/{id}` |
| Users | `/users` | `/users` | `/users/{id}` | `/users/{id}` |
| Marques | `/reference/brands` | `/reference/brands` | `/reference/brands/{id}` | `/reference/brands/{id}` |
| Modèles | `/reference/models` | `/reference/models` | `/reference/models/{id}` | `/reference/models/{id}` |
| VehicleCategories | `/vehicle-categories/admin` | `/vehicle-categories/admin` | `/vehicle-categories/admin/{id}` | `/vehicle-categories/admin/{id}` |
| VehicleColors | `/vehicle-colors/admin` | `/vehicle-colors/admin` | `/vehicle-colors/admin/{id}` | `/vehicle-colors/admin/{id}` |
| FuelTypes | `/reference/fuel-types` | `/reference/fuel-types` | `/reference/fuel-types/{id}` | `/reference/fuel-types/{id}` |
| LicenceTypes | `/reference/license-types` | `/reference/license-types` | `/reference/license-types/{id}` | `/reference/license-types/{id}` |
| SupplyCategories | `/supply-categories/admin` | `/supply-categories/admin` | `/supply-categories/admin/{id}` | `/supply-categories/admin/{id}` |
| InterventionTypes | `/intervention-types/admin` | `/intervention-types/admin` | `/intervention-types/admin/{id}` | `/intervention-types/admin/{id}` |

## 🔍 Pourquoi cette différence ?

Les ressources **Garages**, **Vehicles** et **Supplies** utilisent le pattern `/admin` pour les opérations d'écriture car elles sont liées à un **tenant** (organisation) et nécessitent des vérifications de permissions spécifiques.

Les ressources **Users** et **Reference Data** n'utilisent pas ce pattern car :
- **Users** : Gestion globale des utilisateurs
- **Reference Data** : Données de référence partagées entre tous les tenants

