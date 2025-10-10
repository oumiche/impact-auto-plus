# 🧪 Test des notifications

## Comment tester

### Dans la console du navigateur (F12)

```javascript
// Importer le store
import { useNotificationStore } from '@/stores/notification'
const notif = useNotificationStore()

// Tester les notifications
notif.success('Test succès !')
notif.error('Test erreur !')
notif.warning('Test avertissement !')
notif.info('Test info !')
```

### Ou directement dans une page

Ajouter temporairement dans le Dashboard :

```vue
<template>
  <DefaultLayout>
    <!-- Boutons de test -->
    <div style="margin-bottom: 2rem; display: flex; gap: 1rem;">
      <button @click="testSuccess" class="btn-primary">Test Success</button>
      <button @click="testError" class="btn-danger">Test Error</button>
      <button @click="testWarning" class="btn-warning">Test Warning</button>
      <button @click="testInfo" class="btn-secondary">Test Info</button>
    </div>
    
    <!-- Reste du contenu -->
  </DefaultLayout>
</template>

<script setup>
import { useNotification } from '@/composables/useNotification'

const { success, error, warning, info } = useNotification()

const testSuccess = () => success('Ceci est un succès !')
const testError = () => error('Ceci est une erreur !')
const testWarning = () => warning('Ceci est un avertissement !')
const testInfo = () => info('Ceci est une information !')
</script>
```

---

## ✅ Vérifications

1. **NotificationContainer est dans App.vue** ✅
2. **Store notification.js créé** ✅
3. **Composable useNotification.js créé** ✅
4. **Z-index élevé (99999)** ✅
5. **Position top: 80px** (sous le header) ✅

---

## 🔍 Debug

Si les notifications ne s'affichent toujours pas :

1. Ouvrir la console (F12)
2. Vérifier qu'il n'y a pas d'erreurs
3. Vérifier que Pinia est bien chargé
4. Tester manuellement :

```javascript
// Dans la console
const { useNotificationStore } = await import('/src/stores/notification.js')
const store = useNotificationStore()
store.success('Test !')
```

---

## 📝 Pages avec notifications intégrées

- ✅ Garages.vue
- ✅ Vehicles.vue
- ✅ Supplies.vue
- ✅ Users.vue
- ✅ Marques.vue

**Les notifications devraient maintenant fonctionner !** 🎉

