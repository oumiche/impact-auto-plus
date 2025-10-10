# 🗄️ Structures des entités Backend

## 📋 Entités principales

### Brand (Marque)
```typescript
{
  id: number
  name: string                    // *required
  code: string | null             // 10 chars max
  description: string | null
  logoUrl: string | null
  website: string | null
  country: string | null
  isActive: boolean               // default: true
  createdAt: string
  updatedAt: string | null
}
```

### Model (Modèle)
```typescript
{
  id: number
  name: string                    // *required
  brand: Brand                    // *required (relation)
  code: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}
```

### Vehicle (Véhicule)
```typescript
{
  id: number
  tenant: Tenant                  // *required
  plateNumber: string             // *required (20 chars)
  brand: Brand                    // *required (relation)
  model: Model                    // *required (relation)
  color: VehicleColor             // *required (relation)
  category: VehicleCategory | null
  fuelType: FuelType | null
  year: number | null
  vin: string | null              // 17 chars
  mileage: number                 // default: 0
  trackingId: string | null
  engineSize: number | null       // float
  powerHp: number | null
  status: string                  // 'active' | 'maintenance' | 'inactive'
  lastMaintenance: string | null  // date
  nextService: string | null      // date
  purchaseDate: string | null     // date
  purchasePrice: string | null    // decimal
  insuranceExpiry: string | null  // date
  technicalInspectionExpiry: string | null // date
  createdAt: string
}
```

### VehicleColor
```typescript
{
  id: number
  name: string                    // *required
  code: string | null
  hexCode: string | null          // Couleur hex (#FFFFFF)
  isActive: boolean
  createdAt: string
}
```

### VehicleCategory
```typescript
{
  id: number
  name: string                    // *required
  code: string | null
  description: string | null
  isActive: boolean
  createdAt: string
}
```

### FuelType
```typescript
{
  id: number
  name: string                    // *required
  code: string | null
  description: string | null
  isActive: boolean
  createdAt: string
}
```

### LicenseType (Type de permis)
```typescript
{
  id: number
  name: string                    // *required
  code: string | null
  description: string | null
  isActive: boolean
  createdAt: string
}
```

### Driver (Conducteur)
```typescript
{
  id: number
  tenant: Tenant                  // *required
  firstName: string               // *required
  lastName: string                // *required
  email: string | null
  phone: string | null
  birthDate: string | null        // date
  licenseNumber: string           // *required
  licenseType: LicenseType | null
  licenseIssueDate: string | null // date
  licenseExpiryDate: string | null // date
  isActive: boolean
  createdAt: string
}
```

### VehicleAssignment (Assignation)
```typescript
{
  id: number
  tenant: Tenant                  // *required
  vehicle: Vehicle                // *required (relation)
  driver: Driver                  // *required (relation)
  startDate: string               // *required (date)
  endDate: string | null          // date
  purpose: string | null
  isActive: boolean
  createdAt: string
}
```

### VehicleInsurance (Assurance)
```typescript
{
  id: number
  tenant: Tenant                  // *required
  vehicle: Vehicle                // *required (relation)
  insuranceCompany: string        // *required
  policyNumber: string            // *required
  startDate: string               // *required (date)
  endDate: string                 // *required (date)
  premiumAmount: number | null    // decimal
  coverage: string | null
  deductible: number | null       // decimal
  createdAt: string
}
```

### VehicleFuelLog (Plein de carburant)
```typescript
{
  id: number
  tenant: Tenant                  // *required
  vehicle: Vehicle                // *required (relation)
  driver: Driver | null
  date: string                    // *required (date)
  quantity: number                // *required (decimal)
  pricePerLiter: number           // *required (decimal)
  totalCost: number | null        // decimal (auto-calculé)
  mileage: number | null
  fuelType: FuelType | null
  location: string | null
  notes: string | null
  createdAt: string
}
```

### VehicleMaintenance (Entretien)
```typescript
{
  id: number
  tenant: Tenant                  // *required
  vehicle: Vehicle                // *required (relation)
  garage: Garage | null
  type: string                    // *required
  scheduledDate: string           // *required (date)
  completedDate: string | null    // date
  mileage: number | null
  cost: number | null             // decimal
  status: string                  // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  description: string | null
  notes: string | null
  createdAt: string
}
```

### Supply (Fourniture)
```typescript
{
  id: number
  tenant: Tenant                  // *required
  name: string                    // *required
  reference: string | null
  category: SupplyCategory | null
  quantity: number                // default: 0
  minQuantity: number | null      // Seuil d'alerte
  unit: string | null             // 'unités', 'litres', 'kg', etc.
  price: number | null            // decimal
  supplier: string | null
  description: string | null
  isActive: boolean
  createdAt: string
}
```

### SupplyCategory
```typescript
{
  id: number
  tenant: Tenant                  // *required
  name: string                    // *required
  code: string | null
  description: string | null
  isActive: boolean
  createdAt: string
}
```

### InterventionType
```typescript
{
  id: number
  tenant: Tenant                  // *required
  name: string                    // *required
  code: string | null
  description: string | null
  estimatedDuration: number | null // heures (decimal)
  isActive: boolean
  createdAt: string
}
```

### Collaborateur
```typescript
{
  id: number
  tenant: Tenant                  // *required
  firstName: string               // *required
  lastName: string                // *required
  email: string | null
  phone: string | null
  position: string | null         // Poste
  isActive: boolean
  createdAt: string
}
```

### Garage
```typescript
{
  id: number
  tenant: Tenant                  // *required
  name: string                    // *required
  address: string | null
  city: string | null
  postalCode: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  createdAt: string
}
```

---

## 🔄 Relations importantes

### Vehicle
- Appartient à un **Tenant**
- A une **Brand** (marque)
- A un **Model** (modèle)
- A une **VehicleColor** (couleur)
- A une **VehicleCategory** (catégorie) - optionnel
- A un **FuelType** (type de carburant) - optionnel
- A plusieurs **VehicleMaintenance** (entretiens)
- A plusieurs **VehicleInsurance** (assurances)
- A plusieurs **VehicleFuelLog** (pleins)

### Model
- Appartient à une **Brand**

### VehicleAssignment
- Relie un **Vehicle** à un **Driver**

### VehicleFuelLog
- Appartient à un **Vehicle**
- Peut avoir un **Driver**
- Peut avoir un **FuelType**

---

## ⚠️ Points importants

1. **Tenant** - Toutes les entités appartiennent à un tenant (multi-tenancy)
2. **Relations** - Beaucoup d'entités ont des relations (Brand, Model, etc.)
3. **isActive** - La plupart des entités ont un champ isActive
4. **Timestamps** - createdAt (et parfois updatedAt) sur toutes les entités
5. **Codes** - Beaucoup d'entités ont un champ `code` optionnel

---

## 🔧 Corrections nécessaires dans le frontend

### Champs à ajouter dans les formulaires

#### **Marques (Brand)**
- ✅ name, code (déjà présents)
- ➕ description, logoUrl, website, country, isActive

#### **Modèles (Model)**
- ✅ name, code (déjà présents)
- ➕ brand_id (relation), description, isActive

#### **Véhicules (Vehicle)**
- ✅ plateNumber, vin, year, mileage, purchaseDate, status (déjà présents)
- ➕ brand_id, model_id, color_id (relations au lieu de strings)
- ➕ category_id, fuelType_id, trackingId, engineSize, powerHp
- ➕ purchasePrice, insuranceExpiry, technicalInspectionExpiry

---

## 📝 Recommandations

1. **Utiliser les vraies relations** - Sélecteurs pour Brand, Model, Color, etc.
2. **Ajouter tous les champs** des entités backend
3. **Gérer isActive** - Toggle pour activer/désactiver
4. **Pagination** - Implémenter la pagination (page, limit)
5. **Recherche** - Ajouter la recherche textuelle
6. **Filtres** - Filtrer par statut (active/inactive)

---

**Document créé pour référence des structures backend réelles** ✅

