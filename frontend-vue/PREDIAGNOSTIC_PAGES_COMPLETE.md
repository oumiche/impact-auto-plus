# ✅ Module Prédiagnostics - Pages Create/Edit avec Pièces Jointes

**Date**: 11 octobre 2025  
**Durée**: ~1 heure  
**Statut**: ✅ **COMPLET**

---

## 📦 Fichiers créés/modifiés

### Nouvelles pages (2)
1. **InterventionPrediagnosticCreate.vue** - Page de création
2. **InterventionPrediagnosticEdit.vue** - Page d'édition avec pièces jointes

### Pages modifiées (1)
3. **InterventionPrediagnostics.vue** - Liste (modal retiré)

### API
4. **api.service.js** - 3 nouvelles méthodes pour attachments

### Routes
5. **router/index.js** - 2 nouvelles routes

---

## 🎯 Structure finale du module

```
Prédiagnostics/
├── InterventionPrediagnostics.vue (Liste)
│   ├── Tableau responsive
│   ├── Recherche + filtres latéraux
│   ├── Bouton "Nouveau" → Navigate /create
│   ├── Bouton "Modifier" → Navigate /:id/edit
│   └── Bouton "Supprimer" → Confirmation
│
├── InterventionPrediagnosticCreate.vue
│   ├── Formulaire complet
│   ├── Sélection intervention
│   ├── Date + expert
│   ├── Liste d'opérations (add/remove)
│   ├── Boutons : Annuler, Enregistrer
│   └── Navigation : Retour à liste après création
│
└── InterventionPrediagnosticEdit.vue
    ├── Chargement données existantes
    ├── Formulaire pré-rempli
    ├── **Section Pièces Jointes** :
    │   ├── Galerie des PJ existantes
    │   ├── Preview images (modal plein écran)
    │   ├── Boutons download/delete par PJ
    │   └── Upload de nouvelles PJ
    ├── Boutons : Annuler, Enregistrer
    └── Navigation : Retour à liste après modification
```

---

## 🔌 API Attachments

### Méthodes ajoutées à api.service.js

```javascript
// Upload
async uploadPrediagnosticAttachment(prediagnosticId, file, description = '') {
  const formData = new FormData()
  formData.append('file', file)
  if (description) formData.append('description', description)
  
  const response = await apiClient.post(
    `/intervention-prediagnostics/${prediagnosticId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}

// Liste
async getPrediagnosticAttachments(prediagnosticId) {
  const response = await apiClient.get(`/intervention-prediagnostics/${prediagnosticId}/attachments`)
  return response.data
}

// Suppression
async deletePrediagnosticAttachment(prediagnosticId, attachmentId) {
  const response = await apiClient.delete(`/intervention-prediagnostics/${prediagnosticId}/attachments/${attachmentId}`)
  return response.data
}
```

**Endpoints backend** :
- `POST /api/intervention-prediagnostics/{id}/attachments`
- `GET /api/intervention-prediagnostics/{id}/attachments`
- `DELETE /api/intervention-prediagnostics/{id}/attachments/{fileId}`

---

## 🗺️ Routes ajoutées

```javascript
{
  path: '/intervention-prediagnostics',
  name: 'InterventionPrediagnostics',
  component: () => import('@/views/InterventionPrediagnostics.vue'),
  meta: { requiresAuth: true, requiresTenant: true }
},
{
  path: '/intervention-prediagnostics/create',
  name: 'InterventionPrediagnosticCreate',
  component: () => import('@/views/InterventionPrediagnosticCreate.vue'),
  meta: { requiresAuth: true, requiresTenant: true }
},
{
  path: '/intervention-prediagnostics/:id/edit',
  name: 'InterventionPrediagnosticEdit',
  component: () => import('@/views/InterventionPrediagnosticEdit.vue'),
  meta: { requiresAuth: true, requiresTenant: true }
}
```

---

## 🎨 Page InterventionPrediagnosticCreate.vue

### Sections du formulaire
1. **Intervention** - InterventionSelector (filtré sur 'reported', 'in_prediagnostic')
2. **Informations générales** - Date, Expert
3. **Opérations** - Liste dynamique avec add/remove
4. **Actions** - Annuler, Enregistrer

### Workflow de création
```
1. Remplir formulaire (intervention, date, expert)
2. Ajouter opérations (ex: "Changer pare-choc")
3. Cocher types (échange, peinture)
4. Cliquer "Enregistrer"
5. → API POST /intervention-prediagnostics
6. → Retour automatique à la liste
```

**Pas de pièces jointes** en mode création (uploadées en mode édition après).

---

## 🎨 Page InterventionPrediagnosticEdit.vue

### Sections
1. **Intervention** - InterventionSelector (pré-rempli)
2. **Informations générales** - Date, Expert (pré-remplis)
3. **Opérations** - Liste (pré-remplie avec items existants)
4. **Pièces jointes** :
   - Galerie des PJ existantes
   - Upload de nouvelles PJ
5. **Actions** - Annuler, Enregistrer

### Galerie de pièces jointes

**Affichage** :
- Grille responsive (280px par carte)
- Preview images (200px height)
- Icônes pour autres fichiers (PDF, Word, etc.)
- Hover overlay avec bouton "Voir"
- Métadonnées : nom, taille, date

**Actions** :
- 👁️ Voir (modal plein écran pour images)
- 📥 Télécharger
- 🗑️ Supprimer (avec confirmation)

**Upload nouvelles PJ** :
- DocumentUploader
- Jusqu'à 10 fichiers
- 10MB max par fichier
- Images + PDF

### Workflow de modification
```
1. Page charge le prédiagnostic (API GET /{id})
2. Page charge les attachments (API GET /{id}/attachments)
3. Affiche galerie des PJ
4. Utilisateur modifie formulaire
5. Utilisateur peut :
   - Supprimer PJ existantes (API DELETE)
   - Ajouter nouvelles PJ (upload après save)
6. Cliquer "Enregistrer"
7. → API PUT /intervention-prediagnostics/{id}
8. → Upload des nouvelles PJ (API POST /{id}/attachments)
9. → Retour à la liste
```

---

## 🎨 Design des pièces jointes

### Carte de PJ

```
┌────────────────────────┐
│                        │
│   [IMAGE PREVIEW]      │ ← 200px height
│   (hover → overlay)    │
│                        │
├────────────────────────┤
│ 📄 photo-avant.jpg     │ ← Nom
│ 2.5 MB • 11/10 14:30  │ ← Méta
├────────────────────────┤
│ [👁️ Voir] [🗑️ Suppr.]  │ ← Actions
└────────────────────────┘
```

### Galerie responsive
```
Desktop (>1024px):   4 colonnes
Tablet (768-1024px): 3 colonnes
Mobile (<768px):     2 colonnes
```

---

## 🔧 Fonctionnalités techniques

### Gestion des URLs
```javascript
const getAttachmentUrl = (attachment) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://127.0.0.1:8000/api'
  const backendUrl = apiUrl.replace('/api', '')
  return `${backendUrl}/uploads/intervention_prediagnostic/${id}/${attachment.fileName}`
}
```

**Structure** : `/uploads/{entityType}/{entityId}/{fileName}`

### Upload progressif
```javascript
for (const doc of newAttachments.value) {
  if (doc.file) {
    await apiService.uploadPrediagnosticAttachment(id, doc.file)
  }
}
```

**Avantage** : Upload fichier par fichier (meilleure gestion des erreurs)

### Preview modal
```vue
<div class="image-preview-modal" @click="closePreview">
  <div class="preview-content" @click.stop>
    <button class="btn-close-preview">×</button>
    <img :src="previewImage.url" />
    <div class="preview-info">
      <strong>{{ previewImage.name }}</strong>
      <span>{{ previewImage.size }}</span>
    </div>
  </div>
</div>
```

---

## 📊 Statistiques

### Code
- **InterventionPrediagnosticCreate.vue** : ~260 lignes
- **InterventionPrediagnosticEdit.vue** : ~560 lignes (avec galerie PJ)
- **InterventionPrediagnostics.vue** : -150 lignes (modal retiré)
- **Total** : +670 lignes

### Fonctionnalités
- ✅ Page création dédiée
- ✅ Page édition dédiée
- ✅ Gestion complète des PJ :
  - Affichage galerie
  - Preview images
  - Download
  - Suppression
  - Upload nouvelles
- ✅ Navigation fluide
- ✅ Breadcrumb "← Retour"

---

## ✅ Validation

### Tests à effectuer
- [ ] Créer un prédiagnostic
- [ ] Modifier un prédiagnostic
- [ ] Voir la galerie de PJ
- [ ] Uploader une image
- [ ] Uploader un PDF
- [ ] Preview une image
- [ ] Télécharger une PJ
- [ ] Supprimer une PJ
- [ ] Retour à la liste (Annuler)
- [ ] Retour à la liste (Enregistrer)

---

## 🎯 Prochaines étapes

### Duplication pour les 4 autres modules

**Même pattern à appliquer** :
1. InterventionQuotes (create + edit)
2. InterventionWorkAuthorizations (create + edit)
3. InterventionReceptionReports (create + edit)
4. InterventionInvoices (create + edit)

**Estimation par module** : ~30 min (duplication + ajustements)  
**Total** : ~2 heures

---

## 💡 Pattern validé !

Le module Prédiagnostics est maintenant **complet** avec :
- ✅ Page liste (tableau + filtres)
- ✅ Page create (formulaire)
- ✅ Page edit (formulaire + galerie PJ)
- ✅ Gestion des pièces jointes
- ✅ Navigation fluide
- ✅ 0 erreur de linting

**Prêt pour duplication aux 4 autres modules !** 🚀

