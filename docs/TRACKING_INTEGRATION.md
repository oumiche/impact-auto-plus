# Intégration avec l'API de Tracking des Véhicules

## Configuration

Ajoutez ces variables d'environnement à votre fichier `.env` :

```env
# Configuration pour l'API de tracking des véhicules
TRACKING_API_URL=https://api.tracking-provider.com/v1
TRACKING_API_KEY=your_tracking_api_key_here
```

## Fonctionnalités

### 1. Synchronisation du kilométrage
- **Endpoint** : `POST /api/vehicle-tracking/sync-mileage/{vehicleId}`
- **Description** : Synchronise le kilométrage d'un véhicule depuis le dispositif de tracking
- **Prérequis** : Le véhicule doit avoir un `trackingId` configuré

### 2. Informations du dispositif de tracking
- **Endpoint** : `GET /api/vehicle-tracking/vehicle-info/{vehicleId}`
- **Description** : Récupère les informations complètes du dispositif de tracking

## Utilisation

### Configuration d'un véhicule
1. Ajoutez un `trackingId` au véhicule (ID du dispositif de tracking)
2. Le système récupérera automatiquement le kilométrage depuis l'API

### Synchronisation manuelle
```javascript
// Synchroniser le kilométrage d'un véhicule
const response = await window.apiService.syncVehicleMileageFromTracking(vehicleId);

// Récupérer les informations de tracking
const trackingInfo = await window.apiService.getVehicleTrackingInfo(vehicleId);
```

## API de Tracking

L'API de tracking doit exposer ces endpoints :

### GET /vehicles/{trackingId}/mileage
```json
{
  "mileage": 150000
}
```

### GET /vehicles/{trackingId}
```json
{
  "id": "tracking_id",
  "mileage": 150000,
  "lastUpdate": "2025-01-01T12:00:00Z",
  "status": "active",
  "location": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

## Gestion des erreurs

Le service gère automatiquement :
- Timeout des requêtes (10 secondes par défaut)
- Retry automatique (3 tentatives par défaut)
- Logging des erreurs
- Fallback en cas d'indisponibilité de l'API
