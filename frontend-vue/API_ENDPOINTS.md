# 📡 API Endpoints - Backend Symfony

## 🔐 Authentification

- `POST /api/login_check` - Connexion (retourne JWT token)

## 🏢 Tenants

- `GET /api/tenants` - Liste des tenants accessibles
- `GET /api/tenants/current` - Tenant actuel
- `POST /api/tenants/switch` - Changer de tenant
- `GET /api/tenants/admin` - Liste admin
- `POST /api/tenants/admin` - Créer
- `PUT /api/tenants/admin/{id}` - Modifier
- `DELETE /api/tenants/admin/{id}` - Supprimer

## 📚 Données de référence

**Base URL : `/api/reference`**

### Marques (Brands)
- `GET /api/reference/brands` - Liste
- `POST /api/reference/brands` - Créer
- `PUT /api/reference/brands/{id}` - Modifier
- `DELETE /api/reference/brands/{id}` - Supprimer
- `PATCH /api/reference/brands/{id}/status` - Toggle statut

### Modèles (Models)
- `GET /api/reference/models` - Liste
- `POST /api/reference/models` - Créer
- `PUT /api/reference/models/{id}` - Modifier
- `DELETE /api/reference/models/{id}` - Supprimer
- `PATCH /api/reference/models/{id}/status` - Toggle statut

### Catégories de véhicules
- `GET /api/reference/categories` - Liste
- `POST /api/reference/categories` - Créer
- `PUT /api/reference/categories/{id}` - Modifier
- `DELETE /api/reference/categories/{id}` - Supprimer

### Couleurs
- `GET /api/reference/colors` - Liste
- `POST /api/reference/colors` - Créer
- `PUT /api/reference/colors/{id}` - Modifier
- `DELETE /api/reference/colors/{id}` - Supprimer

### Types de carburant
- `GET /api/reference/fuel-types` - Liste
- `POST /api/reference/fuel-types` - Créer
- `PUT /api/reference/fuel-types/{id}` - Modifier
- `DELETE /api/reference/fuel-types/{id}` - Supprimer

### Types de permis
- `GET /api/reference/license-types` - Liste
- `POST /api/reference/license-types` - Créer
- `PUT /api/reference/license-types/{id}` - Modifier
- `DELETE /api/reference/license-types/{id}` - Supprimer

### Toutes les données de référence
- `GET /api/reference/all` - Toutes les données en une seule requête

## 🏢 Garages

- `GET /api/garages` - Liste
- `GET /api/garages/{id}` - Détail
- `POST /api/garages` - Créer
- `PUT /api/garages/{id}` - Modifier
- `DELETE /api/garages/{id}` - Supprimer

## 🚗 Véhicules

- `GET /api/vehicles` - Liste
- `GET /api/vehicles/{id}` - Détail
- `POST /api/vehicles` - Créer
- `PUT /api/vehicles/{id}` - Modifier
- `DELETE /api/vehicles/{id}` - Supprimer

## 📦 Fournitures

- `GET /api/supplies` - Liste
- `GET /api/supplies/{id}` - Détail
- `POST /api/supplies` - Créer
- `PUT /api/supplies/{id}` - Modifier
- `DELETE /api/supplies/{id}` - Supprimer

### Catégories de fournitures
- `GET /api/supply-categories` - Liste
- `POST /api/supply-categories` - Créer
- `PUT /api/supply-categories/{id}` - Modifier
- `DELETE /api/supply-categories/{id}` - Supprimer

### Prix des fournitures
- `GET /api/supply-prices` - Liste
- `GET /api/supply-prices/{id}` - Détail
- `POST /api/supply-prices` - Créer
- `PUT /api/supply-prices/{id}` - Modifier
- `DELETE /api/supply-prices/{id}` - Supprimer
- `GET /api/supply-prices/suggestion` - Suggestions de prix
- `GET /api/supply-prices/evolution` - Évolution des prix
- `GET /api/supply-prices/compare-suppliers` - Comparer fournisseurs
- `GET /api/supply-prices/anomalies` - Détecter anomalies
- `GET /api/supply-prices/statistics` - Statistiques
- `GET /api/supply-prices/top-supplies` - Top fournitures

## 👥 Utilisateurs

- `GET /api/users` - Liste
- `GET /api/users/{id}` - Détail
- `POST /api/users` - Créer
- `PUT /api/users/{id}` - Modifier
- `DELETE /api/users/{id}` - Supprimer

### Permissions utilisateur-tenant
- `GET /api/user-tenant-permissions` - Liste
- `POST /api/user-tenant-permissions` - Créer
- `PUT /api/user-tenant-permissions/{id}` - Modifier
- `DELETE /api/user-tenant-permissions/{id}` - Supprimer

## 👔 Collaborateurs

- `GET /api/collaborateurs` - Liste
- `POST /api/collaborateurs` - Créer
- `PUT /api/collaborateurs/{id}` - Modifier
- `DELETE /api/collaborateurs/{id}` - Supprimer

## 👤 Conducteurs (Drivers)

- `GET /api/drivers` - Liste
- `GET /api/drivers/{id}` - Détail
- `POST /api/drivers` - Créer
- `PUT /api/drivers/{id}` - Modifier
- `DELETE /api/drivers/{id}` - Supprimer

## 🚗 Gestion des véhicules

### Assignations
- `GET /api/vehicle-assignments` - Liste
- `POST /api/vehicle-assignments` - Créer
- `PUT /api/vehicle-assignments/{id}` - Modifier
- `DELETE /api/vehicle-assignments/{id}` - Supprimer

### Assurances
- `GET /api/vehicle-insurances` - Liste
- `POST /api/vehicle-insurances` - Créer
- `PUT /api/vehicle-insurances/{id}` - Modifier
- `DELETE /api/vehicle-insurances/{id}` - Supprimer

### Suivi de carburant
- `GET /api/vehicle-fuel-logs` - Liste
- `POST /api/vehicle-fuel-logs` - Créer
- `PUT /api/vehicle-fuel-logs/{id}` - Modifier
- `DELETE /api/vehicle-fuel-logs/{id}` - Supprimer
- `GET /api/vehicle-fuel-logs/vehicles` - Liste véhicules
- `GET /api/vehicle-fuel-logs/drivers` - Liste conducteurs
- `GET /api/vehicle-fuel-logs/fuel-types` - Types carburant
- `POST /api/vehicle-fuel-logs/sync-vehicle-mileage/{vehicleId}` - Sync kilométrage

### Entretiens
- `GET /api/vehicle-maintenances` - Liste
- `POST /api/vehicle-maintenances` - Créer
- `PUT /api/vehicle-maintenances/{id}` - Modifier
- `DELETE /api/vehicle-maintenances/{id}` - Supprimer

## 🔧 Interventions

### Interventions véhicules
- `GET /api/vehicle-interventions` - Liste
- `GET /api/vehicle-interventions/{id}` - Détail
- `POST /api/vehicle-interventions` - Créer
- `PUT /api/vehicle-interventions/{id}` - Modifier
- `DELETE /api/vehicle-interventions/{id}` - Supprimer

### Workflow d'intervention
- `GET /api/vehicle-interventions/{id}/workflow/status` - Statut workflow
- `POST /api/vehicle-interventions/{id}/workflow/transition` - Transition
- `POST /api/vehicle-interventions/{id}/workflow/prediagnostic/start` - Démarrer prédiagnostic
- `POST /api/vehicle-interventions/{id}/workflow/prediagnostic/complete` - Compléter prédiagnostic
- `POST /api/vehicle-interventions/{id}/workflow/quote/start` - Démarrer devis
- `POST /api/vehicle-interventions/{id}/workflow/approve` - Approuver
- `POST /api/vehicle-interventions/{id}/workflow/cancel` - Annuler

### Types d'intervention
- `GET /api/intervention-types` - Liste
- `POST /api/intervention-types` - Créer
- `PUT /api/intervention-types/{id}` - Modifier
- `DELETE /api/intervention-types/{id}` - Supprimer

### Prédiagnostics
- `GET /api/intervention-prediagnostics` - Liste
- `GET /api/intervention-prediagnostics/{id}` - Détail
- `POST /api/intervention-prediagnostics` - Créer
- `PUT /api/intervention-prediagnostics/{id}` - Modifier
- `DELETE /api/intervention-prediagnostics/{id}` - Supprimer
- `POST /api/intervention-prediagnostics/{id}/complete` - Compléter
- `POST /api/intervention-prediagnostics/{id}/attachments` - Ajouter pièce jointe
- `GET /api/intervention-prediagnostics/{id}/attachments` - Liste pièces jointes
- `DELETE /api/intervention-prediagnostics/{id}/attachments/{fileId}` - Supprimer pièce jointe
- `GET /api/intervention-prediagnostics/{id}/attachments/{fileName}` - Télécharger

### Devis
- `GET /api/intervention-quotes` - Liste
- `GET /api/intervention-quotes/{id}` - Détail
- `POST /api/intervention-quotes` - Créer
- `PUT /api/intervention-quotes/{id}` - Modifier
- `DELETE /api/intervention-quotes/{id}` - Supprimer

### Autorisations de travaux
- `GET /api/intervention-work-authorizations` - Liste
- `GET /api/intervention-work-authorizations/{id}` - Détail
- `POST /api/intervention-work-authorizations` - Créer
- `PUT /api/intervention-work-authorizations/{id}` - Modifier
- `DELETE /api/intervention-work-authorizations/{id}` - Supprimer

### Factures
- `GET /api/intervention-invoices` - Liste
- `GET /api/intervention-invoices/{id}` - Détail
- `POST /api/intervention-invoices` - Créer
- `PUT /api/intervention-invoices/{id}` - Modifier
- `DELETE /api/intervention-invoices/{id}` - Supprimer

### Rapports de réception
- `GET /api/intervention-reception-reports` - Liste
- `GET /api/intervention-reception-reports/{id}` - Détail
- `POST /api/intervention-reception-reports` - Créer
- `PUT /api/intervention-reception-reports/{id}` - Modifier
- `DELETE /api/intervention-reception-reports/{id}` - Supprimer

## 📊 Rapports

- `GET /api/reports` - Liste
- `GET /api/reports/types` - Types de rapports
- `GET /api/reports/stats` - Statistiques
- `POST /api/reports` - Créer
- `GET /api/reports/{id}` - Détail
- `DELETE /api/reports/{id}` - Supprimer
- `POST /api/reports/{id}/invalidate-cache` - Invalider cache
- `POST /api/reports/invalidate-cache/{type}` - Invalider cache par type

## ⚙️ Administration

### Paramètres système
- `GET /api/parameters` - Liste
- `POST /api/parameters` - Créer
- `PUT /api/parameters/{id}` - Modifier
- `DELETE /api/parameters/{id}` - Supprimer

### Formats de code
- `GET /api/code-formats` - Liste
- `POST /api/code-formats` - Créer
- `PUT /api/code-formats/{id}` - Modifier
- `DELETE /api/code-formats/{id}` - Supprimer

## 📊 Dashboard

- `GET /api/dashboard/stats` - Statistiques

---

## 📝 Notes importantes

### Structure des réponses

La plupart des endpoints retournent :

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Paramètres de pagination

- `page` - Numéro de page (défaut: 1)
- `limit` - Nombre d'items par page (défaut: 10, max: 100)
- `search` - Recherche textuelle
- `status` - Filtrer par statut (all, active, inactive)

### Headers requis

- `Authorization: Bearer {token}` - Token JWT (sauf login_check)
- `Content-Type: application/json`
- `Accept: application/json`

### Codes de statut

- `200` - Succès
- `201` - Créé
- `400` - Mauvaise requête
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Non trouvé
- `500` - Erreur serveur

---

## 🔧 Endpoints à corriger dans le frontend

### Actuellement incorrect
- ❌ `/marques` → ✅ `/reference/brands`
- ❌ `/modeles` → ✅ `/reference/models`
- ❌ `/vehicle-categories` → ✅ `/reference/categories`
- ❌ `/vehicle-colors` → ✅ `/reference/colors`
- ❌ `/fuel-types` → ✅ `/reference/fuel-types`
- ❌ `/licence-types` → ✅ `/reference/license-types`

### Déjà corrects
- ✅ `/api/tenants`
- ✅ `/api/garages`
- ✅ `/api/vehicles`
- ✅ `/api/supplies`
- ✅ `/api/users`
- ✅ `/api/drivers`
- ✅ `/api/vehicle-assignments`
- ✅ `/api/vehicle-insurances`
- ✅ `/api/vehicle-fuel-logs`
- ✅ `/api/vehicle-maintenances`

---

## 🎯 Prochaines corrections

Les endpoints suivants doivent être vérifiés/corrigés :
- Supply categories
- Intervention types
- Collaborateurs
- Code formats
- Parameters
- User tenant permissions

---

**Document créé pour référence des endpoints backend réels** ✅

