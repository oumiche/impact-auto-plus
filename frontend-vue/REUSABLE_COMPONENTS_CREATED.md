# Composants Réutilisables Créés

Date : 11 octobre 2025  
Session : Préparation migration pages d'administration

---

## ✅ Composants Créés

### 1. **UserSelector.vue** 👤
**Chemin** : `src/components/common/UserSelector.vue`

**Description** : Sélecteur d'utilisateurs avec recherche server-side et preload.

**Props** :
- `modelValue` : Number | null - ID de l'utilisateur sélectionné
- `label` : String - Label du champ
- `placeholder` : String - Texte placeholder (défaut: "Rechercher un utilisateur...")
- `required` : Boolean - Champ obligatoire
- `statusFilter` : String - Filtre par statut (all, active, inactive)

**Fonctionnalités** :
- ✅ Recherche server-side avec debounce (300ms)
- ✅ Preload des 5 premiers utilisateurs au montage
- ✅ Affichage : Nom complet + email + username
- ✅ Badge de sélection avec détails
- ✅ Bouton clear pour effacer la sélection

**Events** :
- `update:modelValue` : Émis lors de la sélection
- `change` : Émis avec l'objet utilisateur complet

---

### 2. **TenantSelector.vue** 🏢
**Chemin** : `src/components/common/TenantSelector.vue`

**Description** : Sélecteur de tenants avec recherche server-side, logo et preload.

**Props** :
- `modelValue` : Number | null - ID du tenant sélectionné
- `label` : String - Label du champ
- `placeholder` : String - Texte placeholder (défaut: "Rechercher un tenant...")
- `required` : Boolean - Champ obligatoire
- `statusFilter` : String - Filtre par statut (all, active, inactive)

**Fonctionnalités** :
- ✅ Recherche server-side avec debounce (300ms)
- ✅ Preload des 5 premiers tenants au montage
- ✅ Affichage du logo du tenant (si disponible)
- ✅ Affichage : Nom + slug + badge inactif
- ✅ Badge de sélection avec logo et détails
- ✅ Bouton clear pour effacer la sélection

**Events** :
- `update:modelValue` : Émis lors de la sélection
- `change` : Émis avec l'objet tenant complet

---

### 3. **PermissionManager.vue** 🔐
**Chemin** : `src/components/common/PermissionManager.vue`

**Description** : Interface avancée de gestion des permissions par module avec checkboxes hiérarchiques.

**Props** :
- `modelValue` : Array - Liste des permissions sélectionnées
- `label` : String - Label du composant

**Fonctionnalités** :
- ✅ Groupement des permissions par modules
- ✅ Checkboxes hiérarchiques (module + permissions)
- ✅ État indeterminé pour sélection partielle de module
- ✅ Quick actions :
  - Tout sélectionner
  - Tout désélectionner
  - Lecture seule (toutes les permissions `:read`)
- ✅ Résumé des permissions sélectionnées avec badges cliquables
- ✅ Description pour chaque permission

**Modules inclus** :
1. **Dashboard** : read
2. **Vehicles** : read, create, update, delete
3. **Interventions** : read, create, update, delete
4. **Drivers** : read, create, update, delete
5. **Supplies** : read, create, update, delete
6. **Reports** : read, export
7. **Admin** : users, tenants, parameters, full

**Events** :
- `update:modelValue` : Émis lors du changement
- `change` : Émis avec le tableau de permissions

---

### 4. **FileUploader.vue** 📤
**Chemin** : `src/components/common/FileUploader.vue`

**Description** : Composant d'upload de fichiers avec drag & drop, prévisualisation et validation.

**Props** :
- `modelValue` : String - URL ou base64 du fichier
- `label` : String - Label du champ
- `accept` : String - Types acceptés (défaut: "image/*")
- `acceptLabel` : String - Label des types acceptés (défaut: "PNG, JPG, GIF")
- `maxSizeMB` : Number - Taille max en MB (défaut: 5)
- `required` : Boolean - Champ obligatoire

**Fonctionnalités** :
- ✅ Upload par clic
- ✅ Upload par drag & drop
- ✅ Prévisualisation de l'image
- ✅ Validation du type de fichier
- ✅ Validation de la taille (avec limite configurable)
- ✅ Affichage des infos du fichier (nom, taille)
- ✅ Boutons d'overlay sur preview :
  - Supprimer (rouge)
  - Changer (bleu)
- ✅ Messages d'erreur détaillés
- ✅ Conversion en base64

**Events** :
- `update:modelValue` : Émis avec le base64
- `change` : Émis avec le base64
- `file` : Émis avec l'objet File natif

**Méthodes exposées** :
- `removeFile()` : Supprimer le fichier
- `getFile()` : Récupérer l'objet File

---

### 5. **JsonEditor.vue** 📝
**Chemin** : `src/components/common/JsonEditor.vue`

**Description** : Éditeur JSON avec validation en temps réel, formatage et toolbar.

**Props** :
- `modelValue` : Object | Array | String | null - Données JSON
- `label` : String - Label du champ
- `placeholder` : String - Texte placeholder
- `rows` : Number - Nombre de lignes (défaut: 10)
- `required` : Boolean - Champ obligatoire
- `showPreview` : Boolean - Afficher l'aperçu formaté (défaut: true)

**Fonctionnalités** :
- ✅ Validation JSON en temps réel
- ✅ Coloration d'état (vert=valide, rouge=erreur, gris=vide)
- ✅ Toolbar avec actions :
  - **Formater** : Indenter le JSON (Ctrl+Shift+F)
  - **Minifier** : Compresser le JSON
  - **Effacer** : Supprimer le contenu
- ✅ Indicateur de statut (valide/invalide/vide)
- ✅ Messages d'erreur détaillés avec syntaxe
- ✅ Aperçu formaté du JSON valide
- ✅ Auto-format au blur si valide

**Events** :
- `update:modelValue` : Émis avec l'objet JSON parsé
- `change` : Émis avec l'objet JSON parsé
- `valid` : Émis quand le JSON est valide
- `invalid` : Émis quand le JSON est invalide (avec message d'erreur)

**Méthodes exposées** :
- `formatJson()` : Formater le JSON
- `minifyJson()` : Minifier le JSON
- `clearJson()` : Effacer le contenu
- `validate()` : Valider manuellement

---

### 6. **CodePreview.vue** 🔍
**Chemin** : `src/components/common/CodePreview.vue`

**Description** : Prévisualisation de codes générés avec support de variables et copie dans le presse-papier.

**Props** :
- `formatPattern` : String - Pattern avec variables ({YEAR}, {MONTH}, {SEQUENCE}, etc.)
- `prefix` : String - Préfixe du code
- `suffix` : String - Suffixe du code
- `separator` : String - Séparateur (défaut: "-")
- `includeYear` : Boolean - Inclure l'année (défaut: true)
- `includeMonth` : Boolean - Inclure le mois (défaut: true)
- `includeDay` : Boolean - Inclure le jour (défaut: false)
- `sequenceLength` : Number - Longueur de la séquence (défaut: 4)
- `sequenceStart` : Number - Début de séquence (défaut: 1)
- `currentSequence` : Number - Séquence actuelle (défaut: 0)
- `title` : String - Titre de la preview (défaut: "Aperçu du code généré")
- `description` : String - Description
- `showCopyButton` : Boolean - Afficher bouton copier (défaut: true)
- `exampleCount` : Number - Nombre d'exemples (défaut: 3)

**Variables supportées** :
- `{PREFIX}` : Préfixe
- `{SUFFIX}` : Suffixe
- `{SEPARATOR}` : Séparateur
- `{YEAR}` : Année (4 chiffres)
- `{MONTH}` : Mois (2 chiffres)
- `{DAY}` : Jour (2 chiffres)
- `{SEQUENCE}` ou `{SEQ}` : Numéro de séquence (padded)

**Fonctionnalités** :
- ✅ Génération dynamique de codes
- ✅ Affichage de plusieurs exemples (incrémentation)
- ✅ Mise à jour en temps réel
- ✅ Bouton copier dans le presse-papier
- ✅ Feedback visuel "Copié !"
- ✅ Design moderne avec effet néon vert
- ✅ Nettoyage des séparateurs multiples

**Events** :
- `copy` : Émis lors de la copie (avec le code)
- `update:preview` : Émis lors du changement de preview

---

## 📦 Méthodes API Ajoutées

**Fichier** : `src/services/api.service.js`

### Users
```javascript
getUser(id)                    // GET /api/users/admin/{id}
getUsers(params)               // GET /api/users/admin
createUser(data)               // POST /api/users/admin
updateUser(id, data)           // PUT /api/users/admin/{id}
deleteUser(id)                 // DELETE /api/users/admin/{id}
```

### Tenants
```javascript
getTenant(id)                  // GET /api/tenants/{id}
getTenants(params)             // GET /api/tenants
createTenant(data)             // POST /api/tenants
updateTenant(id, data)         // PUT /api/tenants/{id}
deleteTenant(id)               // DELETE /api/tenants/{id}
uploadTenantLogo(tenantId, file) // POST /api/tenants/{id}/logo
```

### User Tenant Permissions
```javascript
getUserTenantPermissions(params)         // GET /api/user-tenant-permissions
getUserTenantPermission(id)              // GET /api/user-tenant-permissions/{id}
createUserTenantPermission(data)         // POST /api/user-tenant-permissions
updateUserTenantPermission(id, data)     // PUT /api/user-tenant-permissions/{id}
deleteUserTenantPermission(id)           // DELETE /api/user-tenant-permissions/{id}
```

### Code Formats
```javascript
getCodeFormats(params)         // GET /api/code-formats
getCodeFormat(id)              // GET /api/code-formats/{id}
createCodeFormat(data)         // POST /api/code-formats
updateCodeFormat(id, data)     // PUT /api/code-formats/{id}
deleteCodeFormat(id)           // DELETE /api/code-formats/{id}
getCodeFormatEntityTypes()     // GET /api/code-formats/entity-types
```

### System Parameters
```javascript
getSystemParameters(params)    // GET /api/parameters
getSystemParameter(id)         // GET /api/parameters/{id}
createSystemParameter(data)    // POST /api/parameters
updateSystemParameter(id, data) // PUT /api/parameters/{id}
deleteSystemParameter(id)      // DELETE /api/parameters/{id}
getParameterCategories()       // GET /api/parameters/categories
```

### Supply Prices
```javascript
getSupplyPrices(params)        // GET /api/supply-prices
getSupplyPrice(id)             // GET /api/supply-prices/{id}
createSupplyPrice(data)        // POST /api/supply-prices
updateSupplyPrice(id, data)    // PUT /api/supply-prices/{id}
deleteSupplyPrice(id)          // DELETE /api/supply-prices/{id}
getSupplyPricesAnalytics(params) // GET /api/supply-prices/analytics
```

---

## 🎨 Standards de Style

Tous les composants suivent les standards existants :
- **SCSS scopé** avec variables cohérentes
- **Transitions** smooth (0.2s - 0.3s)
- **Couleurs** :
  - Primaire : `#3b82f6` (bleu)
  - Succès : `#10b981` (vert)
  - Erreur : `#ef4444` (rouge)
  - Warning : `#f59e0b` (orange)
  - Gris : `#6b7280`
- **Border radius** : 6px à 12px
- **Shadows** : `0 4px 12px rgba(0, 0, 0, 0.1)`

---

## 🧪 Utilisation

### Exemple UserSelector
```vue
<UserSelector
  v-model="form.userId"
  label="Utilisateur"
  :required="true"
  statusFilter="active"
  @change="handleUserChange"
/>
```

### Exemple TenantSelector
```vue
<TenantSelector
  v-model="form.tenantId"
  label="Tenant"
  :required="true"
  statusFilter="active"
  @change="handleTenantChange"
/>
```

### Exemple PermissionManager
```vue
<PermissionManager
  v-model="form.permissions"
  label="Permissions"
  @change="handlePermissionsChange"
/>
```

### Exemple FileUploader
```vue
<FileUploader
  v-model="form.logoUrl"
  label="Logo"
  accept="image/*"
  acceptLabel="PNG, JPG, GIF"
  :maxSizeMB="5"
  @file="handleFileUpload"
/>
```

### Exemple JsonEditor
```vue
<JsonEditor
  v-model="form.validationRules"
  label="Règles de validation"
  :rows="15"
  :showPreview="true"
  @valid="handleValidJson"
  @invalid="handleInvalidJson"
/>
```

### Exemple CodePreview
```vue
<CodePreview
  :formatPattern="form.formatPattern"
  :prefix="form.prefix"
  :suffix="form.suffix"
  :separator="form.separator"
  :includeYear="form.includeYear"
  :includeMonth="form.includeMonth"
  :includeDay="form.includeDay"
  :sequenceLength="form.sequenceLength"
  :currentSequence="form.currentSequence"
  :exampleCount="3"
  description="Exemples de codes qui seront générés"
  @copy="handleCodeCopy"
/>
```

---

## ✅ Prêt pour la Migration

Tous les composants réutilisables sont maintenant créés et prêts à être utilisés dans les pages d'administration :

1. ✅ **CodeFormats.vue** - Utilisera CodePreview
2. ✅ **SystemParameters.vue** - Utilisera JsonEditor
3. ✅ **Tenants.vue** - Utilisera TenantSelector + FileUploader
4. ✅ **UserTenantPermissions.vue** - Utilisera UserSelector + TenantSelector + PermissionManager
5. ✅ **SupplyPrices.vue** - Prêt avec toutes les API
6. ✅ **Users.vue** - Déjà migré (Collaborateurs.vue)

**Prochaine étape** : Commencer la migration des pages d'administration en suivant le plan défini dans `ADMIN_PAGES_MIGRATION_PLAN.md`.

---

**Total lignes de code** : ~2000 lignes  
**Temps de création** : ~2 heures  
**Statut** : ✅ Tous les composants testés et fonctionnels

