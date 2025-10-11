# Restructuration - Pages dédiées pour la section Suivi

**Date**: 11 octobre 2025  
**Objectif**: Créer des pages create/edit dédiées pour les 5 modules (hors VehicleInterventions)

---

## 📋 Pages à créer (10 nouvelles pages)

### InterventionPrediagnostics
1. **InterventionPrediagnosticCreate.vue** - Créer un prédiagnostic
2. **InterventionPrediagnosticEdit.vue** - Modifier un prédiagnostic
   - ✅ Gestion des pièces jointes

### InterventionQuotes
3. **InterventionQuoteCreate.vue** - Créer un devis
4. **InterventionQuoteEdit.vue** - Modifier un devis
   - ✅ Gestion des pièces jointes

### InterventionWorkAuthorizations
5. **InterventionWorkAuthorizationCreate.vue** - Créer une autorisation
6. **InterventionWorkAuthorizationEdit.vue** - Modifier une autorisation
   - ✅ Gestion des pièces jointes

### InterventionReceptionReports
7. **InterventionReceptionReportCreate.vue** - Créer un rapport
8. **InterventionReceptionReportEdit.vue** - Modifier un rapport
   - ✅ Gestion des pièces jointes

### InterventionInvoices
9. **InterventionInvoiceCreate.vue** - Créer une facture
10. **InterventionInvoiceEdit.vue** - Modifier une facture
    - ✅ Gestion des pièces jointes

---

## 🗂️ Routes à ajouter

```javascript
// Prédiagnostics
{ path: '/intervention-prediagnostics', name: 'InterventionPrediagnostics' },
{ path: '/intervention-prediagnostics/create', name: 'InterventionPrediagnosticCreate' },
{ path: '/intervention-prediagnostics/:id/edit', name: 'InterventionPrediagnosticEdit' },

// Devis
{ path: '/intervention-quotes', name: 'InterventionQuotes' },
{ path: '/intervention-quotes/create', name: 'InterventionQuoteCreate' },
{ path: '/intervention-quotes/:id/edit', name: 'InterventionQuoteEdit' },

// Autorisations
{ path: '/intervention-work-authorizations', name: 'InterventionWorkAuthorizations' },
{ path: '/intervention-work-authorizations/create', name: 'InterventionWorkAuthorizationCreate' },
{ path: '/intervention-work-authorizations/:id/edit', name: 'InterventionWorkAuthorizationEdit' },

// Réceptions
{ path: '/intervention-reception-reports', name: 'InterventionReceptionReports' },
{ path: '/intervention-reception-reports/create', name: 'InterventionReceptionReportCreate' },
{ path: '/intervention-reception-reports/:id/edit', name: 'InterventionReceptionReportEdit' },

// Factures
{ path: '/intervention-invoices', name: 'InterventionInvoices' },
{ path: '/intervention-invoices/create', name: 'InterventionInvoiceCreate' },
{ path: '/intervention-invoices/:id/edit', name: 'InterventionInvoiceEdit' },
```

---

## 📊 Restructuration des pages existantes

### Pages liste (garder, simplifier)
- ✅ Retirer les modals de création/édition
- ✅ Bouton "Nouveau" → Navigate vers /create
- ✅ Bouton "Modifier" → Navigate vers /:id/edit
- ✅ Garder recherche, filtres, pagination, suppression

### Pages create (nouvelles)
- ✅ Formulaire complet
- ✅ DocumentUploader pour pièces jointes
- ✅ Boutons : "Annuler" (retour), "Enregistrer"
- ✅ Navigation automatique après enregistrement

### Pages edit (nouvelles)
- ✅ Chargement des données existantes
- ✅ Formulaire pré-rempli
- ✅ Liste des pièces jointes existantes
- ✅ Upload de nouvelles pièces jointes
- ✅ Suppression de pièces jointes
- ✅ Boutons : "Annuler" (retour), "Enregistrer"

---

## 🎯 Pattern de page create/edit

### Structure
```vue
<template>
  <DefaultLayout>
    <template #header>
      <div class="breadcrumb">
        <router-link :to="{ name: 'ListePage' }">← Liste</router-link>
        <span>{{ isEdit ? 'Modifier' : 'Créer' }}</span>
      </div>
      <h1>{{ isEdit ? 'Modifier' : 'Nouveau' }} XXX</h1>
    </template>

    <div class="form-container">
      <form @submit.prevent="handleSubmit">
        <!-- Sections du formulaire -->
        
        <!-- Section pièces jointes -->
        <div class="form-section">
          <h4><i class="fas fa-paperclip"></i> Pièces jointes</h4>
          
          <!-- Liste des PJ existantes (edit mode) -->
          <div v-if="isEdit && existingAttachments.length > 0" class="existing-attachments">
            <div v-for="attachment in existingAttachments" :key="attachment.id" class="attachment-item">
              <i :class="getFileIcon(attachment.type)"></i>
              <span>{{ attachment.name }}</span>
              <button @click="deleteAttachment(attachment.id)" type="button">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <!-- Upload de nouvelles PJ -->
          <DocumentUploader
            v-model="form.newAttachments"
            label="Ajouter des pièces jointes"
          />
        </div>

        <!-- Boutons -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-secondary">
            <i class="fas fa-times"></i>
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </DefaultLayout>
</template>
```

---

## 📂 Gestion des pièces jointes

### API endpoints disponibles
```javascript
// Upload
POST /api/intervention-XXX/{id}/attachments
FormData: { file: File }

// Liste
GET /api/intervention-XXX/{id}/attachments
Response: [{ id, name, type, url, size, createdAt }]

// Suppression
DELETE /api/intervention-XXX/{id}/attachments/{fileId}
```

### Workflow
1. **Création** : Sauvegarder l'entité, puis upload PJ
2. **Édition** : Charger PJ existantes + permettre ajout/suppression
3. **Affichage** : Liste avec icônes + bouton supprimer

---

## 🎯 Prochaines actions

### Option A : Je crée les 10 pages maintenant
**Estimation** : 4-6 heures  
**Avantage** : Workflow complet terminé  

### Option B : Je crée 1 module complet (2 pages) en exemple
**Estimation** : 30-45 minutes  
**Avantage** : Vous validez le pattern avant que je fasse tout  

### Option C : Je crée un template réutilisable
**Estimation** : 1 heure  
**Avantage** : Pattern standardisé, puis duplication rapide

---

Quelle option préférez-vous ? Je recommande **Option B** (créer 1 module complet comme exemple).

