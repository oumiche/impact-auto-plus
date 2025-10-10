# 📋 Template CRUD avec Notifications

## Code à ajouter dans chaque page CRUD

### 1. Import du composable

```javascript
import { useNotification } from '@/composables/useNotification'

// Dans le script setup
const { success, error, warning, info } = useNotification()
```

### 2. Utilisation dans handleSubmit

```javascript
const handleSubmit = async () => {
  try {
    submitting.value = true

    if (isEditing.value) {
      await store.updateItem(form.value.id, form.value)
      success('Élément modifié avec succès')
    } else {
      await store.createItem(form.value)
      success('Élément créé avec succès')
    }

    showModal.value = false
  } catch (err) {
    console.error('Error saving:', err)
    error('Erreur lors de l\'enregistrement')
  } finally {
    submitting.value = false
  }
}
```

### 3. Utilisation dans handleDelete

```javascript
const handleDelete = async () => {
  try {
    submitting.value = true
    await store.deleteItem(itemToDelete.value.id)
    success('Élément supprimé avec succès')
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (err) {
    console.error('Error deleting:', err)
    error('Erreur lors de la suppression')
  } finally {
    submitting.value = false
  }
}
```

### 4. Utilisation dans loadItems (optionnel)

```javascript
const loadItems = async () => {
  try {
    loading.value = true
    const response = await apiService.getItems()
    items.value = response.data || []
  } catch (err) {
    console.error('Error loading:', err)
    error('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}
```

---

## 🎨 Types de notifications

- **success** - Vert avec ✓ (création, modification, suppression réussie)
- **error** - Rouge avec ✕ (erreurs)
- **warning** - Orange avec ⚠ (avertissements)
- **info** - Bleu avec ℹ (informations)

---

## 📝 Messages recommandés

### Création
- ✅ "Garage créé avec succès"
- ✅ "Véhicule créé avec succès"
- ✅ "Utilisateur créé avec succès"

### Modification
- ✅ "Garage modifié avec succès"
- ✅ "Véhicule modifié avec succès"

### Suppression
- ✅ "Garage supprimé avec succès"
- ✅ "Véhicule supprimé avec succès"

### Erreurs
- ❌ "Erreur lors de l'enregistrement"
- ❌ "Erreur lors de la suppression"
- ❌ "Erreur lors du chargement des données"

### Avertissements
- ⚠️ "Le stock est faible"
- ⚠️ "L'assurance expire bientôt"

### Informations
- ℹ️ "Données synchronisées"
- ℹ️ "Export en cours..."

---

## ✅ Pages déjà mises à jour

- ✅ Garages.vue - Notifications intégrées

## ⏳ Pages à mettre à jour

- [ ] Vehicles.vue
- [ ] Supplies.vue
- [ ] Users.vue
- [ ] Marques.vue
- [ ] Modeles.vue
- [ ] VehicleCategories.vue
- [ ] VehicleColors.vue
- [ ] FuelTypes.vue
- [ ] LicenceTypes.vue
- [ ] SupplyCategories.vue
- [ ] InterventionTypes.vue
- [ ] Collaborateurs.vue
- [ ] Drivers.vue
- [ ] VehicleAssignments.vue
- [ ] VehicleInsurances.vue
- [ ] VehicleFuelLogs.vue
- [ ] VehicleMaintenances.vue

---

**Template prêt à être utilisé dans toutes les pages !** ✅

