# Issue - SupplyPrices 500 Error

## 🚨 Problème

**Erreur** : `POST https://127.0.0.1:8000/api/supply-prices 500 (Internal Server Error)`

**Message Backend** :
```
Erreur lors de la création du prix: Warning: Narrowing occurred during 
type inference of ZEND_FETCH_DIM_W. Please file a bug report on 
https://github.com/php/php-src/issues
```

---

## 🔍 Analyse

### Localisation de l'Erreur

**Fichier** : `api/src/Controller/SupplyPriceController.php`  
**Ligne** : 203

```php
// Détection d'anomalie
$this->priceAnalysisService->detectAnomaly($price);
```

### Cause Probable

Le service `PriceAnalysisService->detectAnomaly()` essaie d'accéder à des données qui ne sont pas encore complètement initialisées dans l'entité `SupplyPriceHistory`.

L'erreur **"Narrowing occurred during type inference"** est un warning PHP 8.1+ qui se produit quand :
- Un tableau est accédé avec une clé qui pourrait ne pas exister
- Une propriété est accédée sur un objet qui pourrait être null
- Un typage PHP strict est violé

---

## 💡 Solutions Possibles

### Solution 1 : Commentaire Temporaire (Quick Fix)

**Fichier** : `api/src/Controller/SupplyPriceController.php` (ligne 202-203)

```php
// Détection d'anomalie
// TODO: Fix PriceAnalysisService->detectAnomaly() type inference issue
// $this->priceAnalysisService->detectAnomaly($price);
```

**Avantages** :
- ✅ Fix immédiat
- ✅ Permet de continuer les tests
- ✅ Les prix sont créés sans détection d'anomalie

**Inconvénients** :
- ❌ Pas de détection d'anomalie temporairement
- ❌ Ne résout pas le problème de fond

---

### Solution 2 : Vérifier les Champs Requis

**Fichier** : `api/src/Service/PriceAnalysisService.php`

Ajouter des vérifications avant d'accéder aux propriétés :

```php
public function detectAnomaly(SupplyPriceHistory $price): void
{
    // Vérifier que les données minimales sont présentes
    if (!$price->getVehicleYear() || !$price->getUnitPrice()) {
        // Ne pas analyser si données incomplètes
        return;
    }
    
    // Vérifier que supply existe avant d'accéder à ses propriétés
    if ($price->getSupply()) {
        $supplyId = $price->getSupply()->getId();
        // ... reste du code
    }
    
    // ... reste de la méthode
}
```

**Avantages** :
- ✅ Résout le problème de fond
- ✅ Détection d'anomalie fonctionne
- ✅ Gestion robuste des cas edge

---

### Solution 3 : Valider Toutes les Données Requises

**Fichier** : `api/src/Controller/SupplyPriceController.php` (ligne 145-200)

Ajouter des validations plus strictes :

```php
// Validation des champs obligatoires
if (empty($data['description']) || empty($data['unitPrice']) || empty($data['vehicleYear'])) {
    return new JsonResponse([
        'success' => false,
        'error' => 'Champs obligatoires manquants (description, unitPrice, vehicleYear)'
    ], 400);
}

// S'assurer que vehicleYear est bien défini avant detectAnomaly
if (!isset($data['vehicleYear']) || (int)$data['vehicleYear'] < 1990) {
    return new JsonResponse([
        'success' => false,
        'error' => 'L\'année du véhicule est obligatoire et doit être >= 1990'
    ], 400);
}
```

---

## 🔧 Solution Recommandée (Approche Progressive)

### Étape 1 : Fix Temporaire (Immédiat)

Commenter la détection d'anomalie pour permettre de tester :

```php
// api/src/Controller/SupplyPriceController.php ligne 202-203
// Détection d'anomalie
// $this->priceAnalysisService->detectAnomaly($price);
```

### Étape 2 : Debug du Service (Court terme)

Ajouter des logs dans `PriceAnalysisService->detectAnomaly()` :

```php
public function detectAnomaly(SupplyPriceHistory $price): void
{
    try {
        error_log('DetectAnomaly - VehicleYear: ' . ($price->getVehicleYear() ?? 'NULL'));
        error_log('DetectAnomaly - UnitPrice: ' . ($price->getUnitPrice() ?? 'NULL'));
        error_log('DetectAnomaly - Supply: ' . ($price->getSupply() ? $price->getSupply()->getId() : 'NULL'));
        
        // ... reste du code
    } catch (\Exception $e) {
        error_log('DetectAnomaly Error: ' . $e->getMessage());
        // Ne pas faire échouer toute la création si détection échoue
    }
}
```

### Étape 3 : Fix Définitif (Moyen terme)

Refactorer `PriceAnalysisService` avec des vérifications robustes.

---

## 📋 Données Envoyées par le Frontend

Le frontend envoie maintenant correctement :

```json
{
  "supplyId": 5,
  "description": "Plaquettes de frein",
  "workType": "supply",
  "category": "Freinage",
  "unitPrice": 25000,
  "quantity": 2,
  "vehicleBrandId": 3,
  "vehicleModelId": 12,
  "vehicleYear": 2025,
  "recordedAt": "2025-10-11T15:30:00",
  "validFrom": null,
  "validUntil": null,
  "sourceType": "manual",
  "garage": "Garage Central",
  "supplier": null,
  "notes": null
}
```

Tous les champs obligatoires sont présents.

---

## ✅ Action Immédiate Recommandée

**Pour continuer les tests rapidement** :

Commenter temporairement la ligne 203 dans `api/src/Controller/SupplyPriceController.php` :

```php
// Ligne 202-203
// Détection d'anomalie
// $this->priceAnalysisService->detectAnomaly($price);
```

Cela permettra de :
- ✅ Créer des prix sans erreur
- ✅ Tester le reste du CRUD
- ✅ Revenir sur la détection d'anomalie plus tard

---

## 🎯 Plan d'Action

1. **Court terme** : Commenter `detectAnomaly()` pour débloquer
2. **Moyen terme** : Ajouter logs pour debug
3. **Long terme** : Refactorer le service avec vérifications robustes

---

**Veux-tu que je commente la ligne dans le backend pour te débloquer ?** 🔧

