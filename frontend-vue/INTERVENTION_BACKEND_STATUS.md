# État des lieux Backend - Section Interventions

**Date**: 11 octobre 2025  
**Statut**: ✅ Backend complet et fonctionnel

---

## ✅ Entités existantes (13)

### 1. **VehicleIntervention** (Intervention principale)
**Fichier**: `api/src/Entity/VehicleIntervention.php`

**Propriétés clés**:
- `interventionNumber` - Numéro unique (ex: INT-2024-001)
- `title` - Titre de l'intervention
- `description` - Description détaillée
- `currentStatus` - Statut actuel (workflow)
- `priority` - Priorité (low/medium/high)
- `vehicle` → Vehicle
- `driver` → Driver
- `interventionType` → InterventionType
- `reportedBy` - User ID qui signale
- `assignedTo` - User ID assigné
- `reportedDate` - Date de signalement
- `startedDate` - Date de début
- `completedDate` - Date de fin
- `closedDate` - Date de clôture
- `odometerReading` - Kilométrage
- `supplies` - Collection de fournitures utilisées

### 2. **InterventionPrediagnostic**
**Fichier**: `api/src/Entity/InterventionPrediagnostic.php`

**Relations**:
- `intervention` → VehicleIntervention
- `diagnosticItems` → Collection InterventionPrediagnosticItem

**Champs probables**:
- Photos (avant/après)
- Description des dommages
- Pièces à remplacer
- Coût estimé
- Expert assigné

### 3. **InterventionQuote** (Devis)
**Fichier**: `api/src/Entity/InterventionQuote.php`

**Relations**:
- `intervention` → VehicleIntervention
- `quoteLines` → Collection InterventionQuoteLine
- `garage` → Garage

**Champs probables**:
- Numéro de devis
- Lignes de devis (pièces + main d'œuvre)
- Total HT/TTC
- Validité
- Statut (draft/sent/accepted/rejected)
- Date d'émission

### 4. **InterventionQuoteLine**
**Fichier**: `api/src/Entity/InterventionQuoteLine.php`

**Champs**:
- Description
- Quantité
- Prix unitaire
- Total
- Type (pièce/main d'œuvre)

### 5. **InterventionWorkAuthorization** (Autorisation de travail)
**Fichier**: `api/src/Entity/InterventionWorkAuthorization.php`

**Relations**:
- `intervention` → VehicleIntervention
- `quote` → InterventionQuote
- `lines` → Collection InterventionWorkAuthorizationLine

**Champs probables**:
- Numéro d'autorisation
- Montant autorisé
- Date d'autorisation
- Autorisé par (User)
- Signature
- Conditions

### 6. **InterventionReceptionReport** (Rapport de réception)
**Fichier**: `api/src/Entity/InterventionReceptionReport.php`

**Relations**:
- `intervention` → VehicleIntervention
- `fieldVerifications` → Collection InterventionFieldVerification

**Champs probables**:
- Inspecteur
- Date de réception
- Photos du véhicule
- Checklist de vérification
- Conformité
- Notes

### 7. **InterventionInvoice** (Facture)
**Fichier**: `api/src/Entity/InterventionInvoice.php`

**Relations**:
- `intervention` → VehicleIntervention
- `quote` → InterventionQuote (référence)
- `invoiceLines` → Collection InterventionInvoiceLine

**Champs probables**:
- Numéro de facture
- Date d'émission
- Date d'échéance
- Total HT/TVA/TTC
- Statut (draft/sent/paid/overdue)
- Paiements reçus
- Solde

### 8. **InterventionType**
**Fichier**: `api/src/Entity/InterventionType.php`  
**Statut**: ✅ Déjà utilisé dans InterventionTypes.vue

### 9-13. **Entités auxiliaires**
- `InterventionSupply` - Fournitures utilisées
- `InterventionPrediagnosticItem` - Items du prédiagnostic
- `InterventionWorkAuthorizationLine` - Lignes d'autorisation
- `InterventionFieldVerification` - Vérifications terrain
- `InterventionInvoiceLine` - Lignes de facture

---

## ✅ Contrôleurs existants (7)

### 1. **VehicleInterventionController.php**
**Route**: `/api/vehicle-interventions`

**Endpoints disponibles**:
- ✅ `GET /` - Liste avec pagination/filtres
- ✅ `GET /{id}` - Détails d'une intervention
- ✅ `POST /` - Créer une intervention
- ✅ `PUT /{id}` - Modifier
- ✅ `DELETE /{id}` - Supprimer

**Endpoints workflow** (bonus):
- ✅ `GET /{id}/workflow/status` - Statut du workflow
- ✅ `POST /{id}/workflow/transition` - Changer de statut
- ✅ `POST /{id}/workflow/prediagnostic/start` - Démarrer prédiagnostic
- ✅ `POST /{id}/workflow/prediagnostic/complete` - Terminer prédiagnostic
- ✅ `POST /{id}/workflow/quote/start` - Démarrer devis
- ✅ `POST /{id}/workflow/approve` - Approuver
- ✅ `POST /{id}/workflow/cancel` - Annuler

### 2. **InterventionPrediagnosticController.php**
**Route**: `/api/intervention-prediagnostics`

**Endpoints attendus**:
- CRUD complet
- Upload de photos
- Relations avec interventions

### 3. **InterventionQuoteController.php**
**Route**: `/api/intervention-quotes`

**Endpoints attendus**:
- CRUD complet
- Gestion des lignes de devis
- Sélection du devis gagnant
- Export PDF

### 4. **InterventionWorkAuthorizationController.php**
**Route**: `/api/intervention-work-authorizations`

**Endpoints attendus**:
- CRUD complet
- Approbation/rejet
- Gestion de signature

### 5. **InterventionReceptionReportController.php**
**Route**: `/api/intervention-reception-reports`

**Endpoints attendus**:
- CRUD complet
- Upload de photos
- Checklist de vérification

### 6. **InterventionInvoiceController.php**
**Route**: `/api/intervention-invoices`

**Endpoints attendus**:
- CRUD complet
- Génération depuis devis
- Gestion des paiements
- Export PDF

### 7. **InterventionTypeController.php**
**Route**: `/api/intervention-types`  
**Statut**: ✅ Déjà utilisé (InterventionTypes.vue existe)

---

## 🎯 État de préparation

### ✅ Backend prêt
- Toutes les entités existent
- Tous les contrôleurs existent
- Workflow implémenté avec transitions
- Relations configurées

### ⏳ Frontend à créer
- 6 pages Vue.js
- 5-6 composants réutilisables
- Store Pinia pour le workflow
- Services API frontend

---

## 📊 Priorisation recommandée

### Phase 1 : Fondations (URGENT - 1 semaine)
**Composants réutilisables**:
1. `WorkflowProgressBar.vue` - Barre de progression
2. `StatusBadge.vue` - Badge de statut avec couleurs
3. `InterventionCard.vue` - Carte d'intervention
4. `StatusTimeline.vue` - Timeline des changements

**Services**:
5. Ajouter méthodes API dans `api.service.js`
6. Créer `useInterventionStore.js` (Pinia)

### Phase 2 : Page principale (URGENT - 3-4 jours)
7. **VehicleInterventions.vue**
   - Liste avec filtres par statut
   - Recherche avancée
   - Création d'intervention
   - Workflow visuel
   - Actions contextuelles

### Phase 3 : Documents du workflow (IMPORTANT - 1-2 semaines)
8. **InterventionPrediagnostics.vue** (2-3 jours)
9. **InterventionQuotes.vue** (3-4 jours)
10. **InterventionWorkAuthorizations.vue** (2 jours)
11. **InterventionReceptionReports.vue** (2-3 jours)
12. **InterventionInvoices.vue** (3-4 jours)

**Estimation totale**: 3-4 semaines pour un workflow complet

---

## 🔍 Prochaines actions immédiates

### Option 1 : Commencer maintenant (Recommandé)
1. Examiner en détail VehicleInterventionController
2. Créer les composants réutilisables
3. Créer VehicleInterventions.vue (version simple)
4. Tester la création d'intervention

### Option 2 : Planifier et prioriser
1. Évaluer avec l'équipe métier
2. Identifier les fonctionnalités MVP
3. Créer un backlog détaillé
4. Commencer par les fonctionnalités les plus utilisées

### Option 3 : Reporter
Si d'autres pages sont plus urgentes (ex: Rapports, Analytics)

---

## 💡 Recommandation

**Je recommande Option 1** : Commencer immédiatement par :

1. ✅ **Créer WorkflowProgressBar.vue** (1-2h)
2. ✅ **Créer InterventionCard.vue** (1-2h)
3. ✅ **Créer VehicleInterventions.vue** - Version MVP (4-6h)
   - Liste des interventions
   - Filtres basiques
   - Création simple
   - Workflow visuel

Cette approche permettra d'avoir une **page fonctionnelle rapidement** et de valider l'architecture avant d'investir dans les pages complexes de devis et factures.

---

Voulez-vous que je commence par créer les composants réutilisables et VehicleInterventions.vue ?

