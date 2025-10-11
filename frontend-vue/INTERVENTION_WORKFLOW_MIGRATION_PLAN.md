# Plan de Migration - Section Suivi (Workflow Interventions)

**Date**: 11 octobre 2025  
**Objectif**: Migrer les 6 pages du workflow d'interventions vers Vue.js

---

## 📋 Vue d'ensemble

La section "Suivi" gère le **workflow complet des interventions** sur les véhicules, depuis le signalement jusqu'à la réception finale. C'est le cœur métier de l'application Impact Auto Plus.

### Complexité : ⭐⭐⭐⭐⭐ (Très élevée)
- Workflow séquentiel avec **11 statuts**
- Relations multiples (véhicules, conducteurs, garages, fournitures)
- Documents attachés (photos, PDF)
- Calculs de coûts
- Validation de transitions d'état
- Permissions granulaires par statut

---

## 🔄 Workflow des interventions

```
1. Signalé (reported)
   ↓
2. En prédiagnostique (in_prediagnostic) → Prédiagnostic créé
   ↓
3. Prédiagnostique terminé (prediagnostic_completed)
   ↓
4. En devis (in_quote) → Devis créé
   ↓
5. Devis reçu (quote_received)
   ↓
6. En accord (in_approval) → Autorisation de travail créée
   ↓
7. Accord donné (approved)
   ↓
8. En réparation (in_repair)
   ↓
9. Réparation terminée (repair_completed)
   ↓
10. En réception (in_reception) → Rapport de réception créé
    ↓
11. Véhicule reçu (vehicle_received) → Facture créée
    ↓
✅ TERMINÉ

[À tout moment] → ❌ Annulé (cancelled)
```

---

## 📄 Pages à migrer (6 pages + sous-pages)

### 1️⃣ **VehicleInterventions.vue** (Page principale)
**Priorité**: 🔴 Critique  
**Complexité**: ⭐⭐⭐⭐

#### Fonctionnalités
- ✅ Liste des interventions avec filtres par statut
- ✅ Recherche (véhicule, conducteur, type)
- ✅ Carte d'intervention avec informations clés
- ✅ Barre de progression du workflow (11 étapes)
- ✅ Actions contextuelles selon le statut
- ✅ Badge de statut coloré
- ✅ Quick actions (avancer, annuler)
- ✅ Timeline des changements de statut

#### Données affichées
- Code intervention (ex: INT-2024-001)
- Véhicule (marque, modèle, immatriculation)
- Conducteur
- Type d'intervention
- Garage assigné
- Statut actuel
- Date de création
- Coût estimé / Coût réel
- Progression (%)

#### Relations
- `vehicle_id` → Vehicle
- `driver_id` → Driver
- `intervention_type_id` → InterventionType
- `garage_id` → Garage
- `assigned_to` → User (technicien)

---

### 2️⃣ **InterventionPrediagnostics.vue**
**Priorité**: 🟠 Haute  
**Complexité**: ⭐⭐⭐

#### Fonctionnalités
- Liste des prédiagnostics
- Formulaire de création (modal ou page dédiée)
- Upload de photos (avant/après)
- Diagnostic détaillé
- Estimation des dommages
- Recommandations

#### Données clés
- `intervention_id` → VehicleIntervention
- `expert_id` → User
- Photos (avant, pendant, après)
- Description des dommages
- Pièces à remplacer
- Coût estimé
- Date du diagnostic
- Statut (draft, completed)

#### Backend
- Endpoint: `/api/intervention-prediagnostics`
- Upload d'images via FileUploadService
- Relations: Intervention, User, Attachments

---

### 3️⃣ **InterventionQuotes.vue**
**Priorité**: 🟠 Haute  
**Complexité**: ⭐⭐⭐⭐

#### Fonctionnalités
- Liste des devis
- Création de devis avec lignes multiples
- Calcul automatique des totaux
- Comparaison de devis (plusieurs garages)
- Sélection du devis gagnant
- Export PDF

#### Données clés
- `intervention_id` → VehicleIntervention
- `garage_id` → Garage
- Lignes de devis (pièces + main d'œuvre)
- Prix unitaire, quantité, total
- TVA, remises
- Total HT, TVA, TTC
- Validité du devis
- Statut (draft, sent, accepted, rejected)

#### Composants nécessaires
- `QuoteLineEditor` - Édition des lignes
- `QuoteComparator` - Comparaison de devis
- `PdfExporter` - Export PDF

---

### 4️⃣ **InterventionWorkAuthorizations.vue**
**Priorité**: 🟡 Moyenne  
**Complexité**: ⭐⭐⭐

#### Fonctionnalités
- Liste des autorisations de travail
- Création d'autorisation
- Signature électronique
- Validation par l'assureur
- Conditions et clauses

#### Données clés
- `intervention_id` → VehicleIntervention
- `quote_id` → InterventionQuote
- `authorized_by` → User (assureur)
- Montant autorisé
- Date d'autorisation
- Conditions spéciales
- Signature (base64 ou fichier)
- Statut (pending, approved, rejected)

---

### 5️⃣ **InterventionReceptionReports.vue**
**Priorité**: 🟡 Moyenne  
**Complexité**: ⭐⭐⭐

#### Fonctionnalités
- Liste des rapports de réception
- Contrôle qualité
- Upload de photos (véhicule réparé)
- Checklist de vérification
- Notes de réception
- Validation finale

#### Données clés
- `intervention_id` → VehicleIntervention
- `inspector_id` → User (contrôleur)
- Photos du véhicule réparé
- Checklist (items vérifiés)
- Défauts constatés
- Conformité (oui/non)
- Date de réception
- Signature du client

---

### 6️⃣ **InterventionInvoices.vue**
**Priorité**: 🟠 Haute  
**Complexité**: ⭐⭐⭐⭐⭐

#### Fonctionnalités
- Liste des factures
- Génération de facture depuis devis
- Lignes de facturation
- Calculs TVA/TTC
- Export PDF
- Paiements (partiel/total)
- Suivi des règlements

#### Données clés
- `intervention_id` → VehicleIntervention
- `quote_id` → InterventionQuote (référence)
- Numéro de facture (auto-généré)
- Lignes de facture
- Total HT, TVA, TTC
- Date d'émission
- Date d'échéance
- Paiements reçus
- Solde restant
- Statut (draft, sent, paid, overdue, cancelled)

#### Composants nécessaires
- `InvoiceGenerator` - Génération depuis devis
- `InvoicePdfTemplate` - Template PDF
- `PaymentTracker` - Suivi des paiements

---

## 🏗️ Architecture proposée

### Composants réutilisables à créer

#### 1. **WorkflowProgressBar.vue**
Barre de progression visuelle du workflow
```vue
<WorkflowProgressBar 
  :current-status="intervention.status"
  :show-labels="true"
  @step-click="showStepDetails"
/>
```

#### 2. **StatusTimeline.vue**
Timeline des changements de statut
```vue
<StatusTimeline 
  :intervention-id="intervention.id"
  :history="intervention.statusHistory"
/>
```

#### 3. **InterventionCard.vue**
Carte réutilisable pour afficher une intervention
```vue
<InterventionCard 
  :intervention="intervention"
  :show-actions="true"
  @edit="handleEdit"
  @view-details="handleViewDetails"
/>
```

#### 4. **QuoteLineEditor.vue**
Éditeur de lignes de devis/facture
```vue
<QuoteLineEditor 
  v-model="quote.lines"
  :readonly="false"
  :show-totals="true"
/>
```

#### 5. **DocumentUploader.vue**
Upload de documents multiples avec preview
```vue
<DocumentUploader 
  v-model="documents"
  :accept="['image/*', 'application/pdf']"
  :max-files="10"
  :max-size-mb="10"
/>
```

#### 6. **SignaturePad.vue**
Pad de signature électronique
```vue
<SignaturePad 
  v-model="signature"
  :width="400"
  :height="200"
/>
```

---

## 📊 Ordre de migration recommandé

### Phase 1 : Composants de base (3-4h)
1. ✅ Créer `WorkflowProgressBar.vue`
2. ✅ Créer `StatusTimeline.vue`
3. ✅ Créer `InterventionCard.vue`
4. ✅ Créer `DocumentUploader.vue`

### Phase 2 : Page principale (4-5h)
5. ✅ Créer `VehicleInterventions.vue`
   - Liste avec filtres par statut
   - Recherche multi-critères
   - Carte d'intervention avec workflow
   - Actions contextuelles
   - Création d'intervention

### Phase 3 : Documents du workflow (8-10h)
6. ✅ Créer `InterventionPrediagnostics.vue`
7. ✅ Créer `InterventionQuotes.vue` + `QuoteLineEditor.vue`
8. ✅ Créer `InterventionWorkAuthorizations.vue` + `SignaturePad.vue`
9. ✅ Créer `InterventionReceptionReports.vue`
10. ✅ Créer `InterventionInvoices.vue` + `PaymentTracker.vue`

### Phase 4 : Intégration et tests (3-4h)
11. ✅ Tester le workflow complet
12. ✅ Ajouter les validations de transitions
13. ✅ Implémenter les notifications
14. ✅ Tester les permissions

**Estimation totale**: 18-23 heures de développement

---

## 🎨 Design patterns à utiliser

### Statuts avec couleurs
```scss
.status-reported { background: #e0e7ff; color: #3730a3; }
.status-in-prediagnostic { background: #fef3c7; color: #92400e; }
.status-prediagnostic-completed { background: #d1fae5; color: #065f46; }
.status-in-quote { background: #dbeafe; color: #1e40af; }
.status-quote-received { background: #bfdbfe; color: #1e3a8a; }
.status-in-approval { background: #fde68a; color: #78350f; }
.status-approved { background: #86efac; color: #166534; }
.status-in-repair { background: #fbbf24; color: #92400e; }
.status-repair-completed { background: #6ee7b7; color: #047857; }
.status-in-reception { background: #93c5fd; color: #1e3a8a; }
.status-vehicle-received { background: #34d399; color: #064e3b; }
.status-cancelled { background: #fecaca; color: #991b1b; }
```

### Actions contextuelles par statut
```javascript
const getAvailableActions = (status) => {
  switch(status) {
    case 'reported':
      return ['start_prediagnostic', 'cancel']
    case 'in_prediagnostic':
      return ['complete_prediagnostic', 'cancel']
    case 'prediagnostic_completed':
      return ['request_quotes', 'cancel']
    // ... etc
  }
}
```

---

## 🔧 API Endpoints nécessaires

### VehicleInterventions
- `GET /api/vehicle-interventions` - Liste avec pagination
- `GET /api/vehicle-interventions/{id}` - Détails
- `POST /api/vehicle-interventions` - Créer
- `PUT /api/vehicle-interventions/{id}` - Modifier
- `DELETE /api/vehicle-interventions/{id}` - Supprimer
- `PATCH /api/vehicle-interventions/{id}/status` - Changer statut
- `GET /api/vehicle-interventions/{id}/timeline` - Historique

### InterventionPrediagnostics
- `GET /api/intervention-prediagnostics` - Liste
- `GET /api/intervention-prediagnostics/intervention/{id}` - Par intervention
- `POST /api/intervention-prediagnostics` - Créer
- `PUT /api/intervention-prediagnostics/{id}` - Modifier
- `POST /api/intervention-prediagnostics/{id}/photos` - Upload photos

### InterventionQuotes
- `GET /api/intervention-quotes` - Liste
- `GET /api/intervention-quotes/intervention/{id}` - Par intervention
- `POST /api/intervention-quotes` - Créer
- `PUT /api/intervention-quotes/{id}` - Modifier
- `PATCH /api/intervention-quotes/{id}/select` - Sélectionner gagnant
- `GET /api/intervention-quotes/{id}/pdf` - Export PDF

### InterventionWorkAuthorizations
- `GET /api/intervention-work-authorizations` - Liste
- `POST /api/intervention-work-authorizations` - Créer
- `PUT /api/intervention-work-authorizations/{id}` - Modifier
- `PATCH /api/intervention-work-authorizations/{id}/approve` - Approuver

### InterventionReceptionReports
- `GET /api/intervention-reception-reports` - Liste
- `POST /api/intervention-reception-reports` - Créer
- `PUT /api/intervention-reception-reports/{id}` - Modifier
- `PATCH /api/intervention-reception-reports/{id}/validate` - Valider

### InterventionInvoices
- `GET /api/intervention-invoices` - Liste
- `POST /api/intervention-invoices` - Créer
- `POST /api/intervention-invoices/from-quote/{quoteId}` - Générer depuis devis
- `PUT /api/intervention-invoices/{id}` - Modifier
- `POST /api/intervention-invoices/{id}/payments` - Enregistrer paiement
- `GET /api/intervention-invoices/{id}/pdf` - Export PDF

---

## 🎯 Stratégie de migration

### Option A : Migration progressive (Recommandée)
**Avantages** : Moins risqué, testable par étapes  
**Inconvénient** : Plus long

1. Créer d'abord les composants réutilisables
2. Migrer VehicleInterventions (page principale) en mode lecture seule
3. Ajouter la création d'interventions
4. Migrer chaque document du workflow un par un
5. Intégrer les transitions de statut
6. Tester le workflow complet

**Durée estimée**: 20-25 heures

### Option B : Migration en bloc
**Avantages** : Plus rapide, cohérent  
**Inconvénient** : Risqué, debug complexe

1. Créer tous les composants en parallèle
2. Créer toutes les pages d'un coup
3. Intégrer le workflow
4. Debug global

**Durée estimée**: 15-20 heures (mais plus de debug)

---

## 📦 Composants réutilisables détaillés

### WorkflowProgressBar.vue
```vue
<template>
  <div class="workflow-progress">
    <div v-for="(step, index) in steps" :key="step.code" class="workflow-step">
      <div 
        class="step-indicator"
        :class="{
          'completed': isCompleted(step.order),
          'current': isCurrent(step.code),
          'future': isFuture(step.order)
        }"
      >
        <i :class="`fas ${step.icon}`"></i>
      </div>
      <div class="step-label">{{ step.label }}</div>
      <div v-if="index < steps.length - 1" class="step-connector"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentStatus: String,
  steps: Array
})

const steps = [
  { code: 'reported', label: 'Signalé', icon: 'fa-flag', order: 1 },
  { code: 'in_prediagnostic', label: 'Prédiagnostic', icon: 'fa-clipboard-check', order: 2 },
  { code: 'in_quote', label: 'Devis', icon: 'fa-file-invoice-dollar', order: 4 },
  { code: 'approved', label: 'Approuvé', icon: 'fa-check-circle', order: 7 },
  { code: 'in_repair', label: 'Réparation', icon: 'fa-tools', order: 8 },
  { code: 'vehicle_received', label: 'Reçu', icon: 'fa-check-double', order: 11 }
]
</script>
```

### StatusTimeline.vue
```vue
<template>
  <div class="status-timeline">
    <div v-for="change in history" :key="change.id" class="timeline-item">
      <div class="timeline-icon" :class="`status-${change.status}`">
        <i :class="`fas ${getStatusIcon(change.status)}`"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-status">{{ getStatusLabel(change.status) }}</div>
        <div class="timeline-meta">
          <span>{{ change.changedBy.firstName }} {{ change.changedBy.lastName }}</span>
          <span>{{ formatDate(change.changedAt) }}</span>
        </div>
        <div v-if="change.comment" class="timeline-comment">{{ change.comment }}</div>
      </div>
    </div>
  </div>
</template>
```

---

## 🚀 Plan d'action immédiat

### Recommandation
Commencer par **Option A - Migration progressive** :

#### Semaine 1 : Fondations
1. **Jour 1-2** : Créer les 4 composants réutilisables
2. **Jour 3-4** : Créer VehicleInterventions.vue (lecture seule)
3. **Jour 5** : Ajouter création/modification d'interventions

#### Semaine 2 : Documents
4. **Jour 1-2** : InterventionPrediagnostics.vue
5. **Jour 3-4** : InterventionQuotes.vue + QuoteLineEditor
6. **Jour 5** : Tests et corrections

#### Semaine 3 : Finalisation
7. **Jour 1-2** : InterventionWorkAuthorizations.vue
8. **Jour 3** : InterventionReceptionReports.vue
9. **Jour 4** : InterventionInvoices.vue
10. **Jour 5** : Tests workflow complet

---

## ⚠️ Défis techniques

### 1. Gestion de l'état
- Utiliser un store Pinia `useInterventionStore` pour gérer le workflow
- Cache des interventions en cours
- Synchronisation des statuts en temps réel

### 2. Validation des transitions
- Middleware de validation côté backend
- UI disabled pour actions non autorisées
- Messages d'erreur explicites

### 3. Upload de fichiers
- Gestion des photos multiples
- Preview et suppression
- Compression avant upload
- Progress bar

### 4. Génération de PDF
- Templates côté backend (Twig ou autre)
- Ou génération côté frontend (jsPDF)
- Prévisualisation avant download

### 5. Calculs financiers
- Précision décimale (éviter erreurs de virgule flottante)
- Gestion des devises
- Calculs TVA corrects
- Arrondis appropriés

---

## 📝 Checklist avant de commencer

- [ ] Vérifier que toutes les entités backend existent
- [ ] Vérifier les endpoints API
- [ ] Créer les migrations de base de données si nécessaire
- [ ] Définir les permissions par rôle
- [ ] Préparer les fixtures de test
- [ ] Documenter les règles métier

---

## 🎯 Prochaine étape suggérée

**Commencer par examiner le backend** pour voir ce qui existe déjà :
1. Entités (VehicleIntervention, InterventionPrediagnostic, etc.)
2. Contrôleurs et routes API
3. Permissions et validations
4. Services métier (workflow, calculs, génération PDF)

Voulez-vous que j'examine le backend pour faire un état des lieux ?

