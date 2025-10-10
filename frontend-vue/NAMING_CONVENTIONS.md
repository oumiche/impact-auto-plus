# Conventions de nommage - Frontend Vue.js

## ✅ Règle générale

Le backend Symfony utilise **camelCase** pour les propriétés JSON.
Le frontend Vue.js doit donc utiliser **camelCase** également pour être cohérent.

## 📋 Propriétés communes

### Backend → Frontend (camelCase)

| Propriété Backend | Propriété Frontend | Type | Description |
|-------------------|-------------------|------|-------------|
| `isActive` | `isActive` | boolean | Statut actif/inactif |
| `createdAt` | `createdAt` | string | Date de création |
| `updatedAt` | `updatedAt` | string | Date de mise à jour |
| `contactPerson` | `contactPerson` | string | Personne de contact |
| `plateNumber` | `plateNumber` | string | Numéro d'immatriculation |
| `firstName` | `firstName` | string | Prénom |
| `lastName` | `lastName` | string | Nom |
| `postalCode` | `postalCode` | string | Code postal |

### ❌ À éviter (snake_case)

Ne **PAS** utiliser :
- `is_active` ❌
- `created_at` ❌
- `updated_at` ❌
- `contact_person` ❌
- `plate_number` ❌
- `first_name` ❌
- `last_name` ❌
- `postal_code` ❌

## 🔧 Corrections appliquées

### Garages.vue
**Avant** :
```javascript
form.value = {
  is_active: true  // ❌ snake_case
}
```

**Après** :
```javascript
form.value = {
  isActive: true  // ✅ camelCase
}
```

**Affichage** :
```vue
<!-- ❌ Avant -->
<span>{{ garage.is_active ? 'Actif' : 'Inactif' }}</span>

<!-- ✅ Après -->
<span>{{ garage.isActive ? 'Actif' : 'Inactif' }}</span>
```

## 📚 Exemples par entité

### Garage
```javascript
{
  id: 1,
  name: "Garage Central",
  address: "123 rue de la Paix",
  city: "Paris",
  postalCode: "75001",  // ✅ camelCase
  phone: "0123456789",
  email: "contact@garage.com",
  contactPerson: "Jean Dupont",  // ✅ camelCase
  isActive: true,  // ✅ camelCase
  createdAt: "2025-10-10 12:00:00",  // ✅ camelCase
  updatedAt: "2025-10-10 14:00:00"   // ✅ camelCase
}
```

### Vehicle
```javascript
{
  id: 1,
  plateNumber: "AB-123-CD",  // ✅ camelCase
  vin: "1HGBH41JXMN109186",
  brand: { id: 1, name: "Renault" },
  model: { id: 1, name: "Clio" },
  color: { id: 1, name: "Bleu" },
  fuelType: { id: 1, name: "Essence" },  // ✅ camelCase
  purchaseDate: "2023-01-15",  // ✅ camelCase
  purchasePrice: 15000,  // ✅ camelCase
  createdAt: "2025-10-10 12:00:00",
  updatedAt: "2025-10-10 14:00:00"
}
```

### Brand (Marque)
```javascript
{
  id: 1,
  name: "Renault",
  code: "REN",
  country: "France",
  website: "https://www.renault.fr",
  logoUrl: "https://...",  // ✅ camelCase
  description: "Constructeur français",
  isActive: true,  // ✅ camelCase
  createdAt: "2025-10-10 12:00:00",
  updatedAt: "2025-10-10 14:00:00"
}
```

## 🎯 Checklist pour nouvelle page

Lors de la création d'une nouvelle page CRUD :

- [ ] Utiliser **camelCase** pour toutes les propriétés du formulaire
- [ ] Utiliser **camelCase** dans les `v-model`
- [ ] Utiliser **camelCase** dans l'affichage des données
- [ ] Vérifier que le backend renvoie bien **camelCase**
- [ ] Tester la création, modification et affichage

## 🔍 Vérification rapide

Pour vérifier qu'une page utilise bien camelCase :

```bash
# Rechercher les snake_case suspects
grep -n "is_active\|created_at\|updated_at" src/views/MaPage.vue
```

Si des résultats apparaissent, il faut les corriger en camelCase.

## 📖 Référence

Cette convention suit les standards :
- **Symfony** : camelCase pour les propriétés JSON
- **Vue.js** : camelCase pour les propriétés JavaScript
- **JavaScript** : camelCase pour les variables et propriétés

---

**Date de création** : 2025-10-10  
**Dernière mise à jour** : 2025-10-10

