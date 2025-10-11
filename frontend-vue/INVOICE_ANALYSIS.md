# Analyse - Système de Facturation d'Intervention

**Date**: 11 octobre 2025  
**Objectif**: Comprendre le système de facturation existant avant migration

---

## 📋 Structure Backend

### Entité InterventionInvoice

**Champs principaux**:
```php
- id (int)
- intervention (VehicleIntervention) - Relation obligatoire
- quote (InterventionQuote) - Relation optionnelle (référence)
- invoiceNumber (string) - Auto-généré (ex: FAC-2024-001)
- invoiceDate (datetime) - Date d'émission
- dueDate (datetime) - Date d'échéance
- receivedDate (datetime) - Date de réception (nullable)
- subtotal (decimal) - Sous-total HT
- taxAmount (decimal) - Montant TVA
- totalAmount (decimal) - Total TTC
- paymentStatus (string) - Statut de paiement
- paidAt (datetime) - Date de paiement (nullable)
- paymentMethod (string) - Mode de paiement (nullable)
- notes (text) - Notes (nullable)
- lines (Collection) - Lignes de facture
```

**Statuts de paiement**:
- `pending` - En attente
- `paid` - Payée
- `overdue` - En retard (calculé si dueDate < aujourd'hui)
- `draft` - Brouillon (probablement)
- `partial` - Paiement partiel (possiblement)

### Entité InterventionInvoiceLine

**Structure identique à QuoteLine**:
```php
- id (int)
- invoice (InterventionInvoice)
- supply (Supply) - Fourniture (nullable)
- lineNumber (int)
- description (text)
- workType (string) - 'supply' | 'labor' | 'other'
- quantity (decimal)
- unitPrice (decimal)
- discountPercentage (decimal, nullable)
- discountAmount (decimal, nullable)
- taxRate (decimal, nullable)
- lineTotal (decimal)
- notes (text, nullable)
```

**Calculs**:
```javascript
lineSubtotal = quantity × unitPrice
lineDiscount = lineSubtotal × (discountPercentage / 100)
lineHT = lineSubtotal - lineDiscount
lineTVA = lineHT × (taxRate / 100)
lineTotal = lineHT + lineTVA

// Facture totaux
subtotal = Σ lineSubtotal
taxAmount = Σ lineTVA
totalAmount = Σ lineTotal
```

---

## 🔌 API Endpoints disponibles

### CRUD Standard
- `GET /api/intervention-invoices` - Liste avec pagination
- `GET /api/intervention-invoices/{id}` - Détails
- `POST /api/intervention-invoices` - Créer
- `PUT /api/intervention-invoices/{id}` - Modifier
- `DELETE /api/intervention-invoices/{id}` - Supprimer

### Actions spéciales
- `POST /api/intervention-invoices/{id}/mark-paid` - Marquer comme payée
  - Body: `{ paymentMethod: string }`
  - Répond avec: `{ paymentStatus, paidAt }`

- `GET /api/intervention-invoices/{id}/pdf` - Générer PDF
  - Retourne: PDF en base64 ou URL

### Gestion des pièces jointes
- `POST /api/intervention-invoices/{id}/attachments` - Upload
- `GET /api/intervention-invoices/{id}/attachments` - Liste
- `DELETE /api/intervention-invoices/{id}/attachments/{fileId}` - Supprimer

---

## 📱 Interface utilisateur existante (HTML)

### Fonctionnalités observées

**Recherche et filtres**:
- Barre de recherche (n°, intervention, véhicule, marque, modèle)
- Panneau de filtres latéral avec:
  - Filtre par marque (recherche server-side)
  - Filtre par modèle (dépend de la marque)
  - Période personnalisée (date début/fin)
  - Statut (tous, payées, en retard)
  - Date prédéfinie (aujourd'hui, semaine, mois, année)

**Actions**:
- Créer nouvelle facture
- Marquer comme payée (single + batch)
- Modifier
- Supprimer
- Générer PDF

**Affichage**:
- Numéro de facture
- Intervention (n° et titre)
- Véhicule
- Dates (émission, échéance)
- Montant total
- Statut avec badge coloré

---

## 🎯 Fonctionnalités à implémenter

### Création de facture

**Option 1 - Depuis un devis** (Recommandé):
1. Sélectionner une intervention
2. Charger les devis validés de cette intervention
3. Sélectionner un devis → **Copier automatiquement** toutes les lignes
4. Ajuster si nécessaire
5. Définir dates (émission, échéance)
6. Enregistrer

**Option 2 - Manuelle**:
1. Sélectionner une intervention
2. Ajouter les lignes manuellement avec QuoteLineEditor
3. Définir dates
4. Enregistrer

### Gestion des paiements

**Single payment** (plus simple):
- Bouton "Marquer comme payée"
- Modal avec:
  - Date de paiement (auto: aujourd'hui)
  - Mode de paiement (select)
  - Montant (pré-rempli avec totalAmount)
  - Notes

**Multi payments** (plus complexe):
- Table des paiements avec historique
- Ajout de paiement partiel
- Calcul du solde restant
- Statuts: pending, partial, paid, overdue

### Export PDF

**Génération côté backend**:
- Bouton "Télécharger PDF"
- Appel API `/api/intervention-invoices/{id}/pdf`
- Download automatique du fichier

---

## 💡 Recommandations pour la migration

### Simplicité (MVP)
✅ **Utiliser QuoteLineEditor** (déjà créé)  
✅ **Copie depuis devis** (endpoint à vérifier: `POST /intervention-invoices/from-quote/{quoteId}`)  
✅ **Paiement simple** (mark-paid avec paymentMethod)  
✅ **Statuts basiques** (pending, paid, overdue)  

### Complexité (Future)
⏳ Historique de paiements multiples  
⏳ Paiements partiels avec solde  
⏳ Export PDF personnalisé  
⏳ Envoi par email  
⏳ Rappels automatiques pour retards  

---

## 🔄 Workflow d'utilisation

### Scénario typique

1. **Expert** réceptionne le véhicule → Statut: `in_reception`
2. **Intervention** passe à `vehicle_received`
3. **Comptable** crée une facture:
   - Sélectionne l'intervention
   - Sélectionne le devis validé → **Lignes copiées automatiquement**
   - Définit date d'échéance (+30 jours)
   - Enregistre → Statut: `pending`
4. **Client** paie
5. **Comptable** marque comme payée:
   - Bouton "Marquer comme payée"
   - Sélectionne mode de paiement (CB, virement, espèces, chèque)
   - Enregistre → Statut: `paid`, `paidAt` = aujourd'hui
6. **Comptable** génère PDF pour archives
7. **Workflow terminé** ✅

---

## 🆚 Différences Devis vs Facture

| Caractéristique | Devis | Facture |
|----------------|-------|---------|
| **Objectif** | Estimation | Document comptable |
| **Statut** | pending/validated | pending/paid/overdue |
| **Modification** | Possible | Interdite si payée |
| **Numérotation** | DEV-YYYY-XXX | FAC-YYYY-XXX |
| **Date clé** | validUntil | dueDate |
| **Action finale** | Validation | Paiement |
| **Pièces jointes** | Non | Oui (justificatifs) |
| **PDF** | Optionnel | Obligatoire |

---

## 📊 Données à afficher

### Sur la carte (liste)
- Numéro de facture (FAC-YYYY-XXX)
- Badge de statut (pending/paid/overdue)
- Intervention (n° + titre)
- Véhicule
- Date d'émission
- Date d'échéance
- **Montant total TTC** (grand, gras)
- **Solde restant** (si paiement partiel)
- Bouton "Marquer comme payée" (si pending)
- Actions (edit, delete, download PDF)

### Sur le formulaire
- **Section 1**: Intervention + Devis (copie auto)
- **Section 2**: Dates (émission, échéance)
- **Section 3**: Lignes (QuoteLineEditor)
- **Section 4**: Notes
- **Section 5**: Pièces jointes (optionnel)

### Modal de paiement
- Date de paiement
- Mode de paiement (select)
- Montant payé
- Notes

---

## 🎨 Design suggéré

### Badges de statut
```scss
.status-pending {
  background: #fef3c7;
  color: #92400e;
  icon: fa-clock
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
  icon: fa-check-circle
}

.status-overdue {
  background: #fee2e2;
  color: #991b1b;
  icon: fa-exclamation-triangle
}

.status-partial {
  background: #dbeafe;
  color: #1e40af;
  icon: fa-coins
}

.status-draft {
  background: #f3f4f6;
  color: #6b7280;
  icon: fa-file
}
```

### Sections colorées
- **Section paiement** (vert) - Si payée
- **Section retard** (rouge) - Si overdue
- **Section en attente** (jaune) - Si pending

---

## ✅ Ce qui est prêt côté backend

- ✅ Entités complètes (Invoice + InvoiceLine)
- ✅ CRUD complet
- ✅ Endpoint `mark-paid` fonctionnel
- ✅ Génération PDF implémentée
- ✅ Gestion des pièces jointes
- ✅ Relations configurées (Intervention, Quote, Supply)
- ✅ Calculs automatiques

---

## ⚠️ Points d'attention

### À vérifier
- [ ] Endpoint `POST /intervention-invoices/from-quote/{quoteId}` existe-t-il ?
- [ ] Format de retour de la génération PDF (base64 ou URL)
- [ ] Gestion des paiements multiples (table séparée ?)
- [ ] Validation : peut-on modifier une facture payée ?

### À implémenter côté frontend
- [ ] Bouton "Générer depuis devis"
- [ ] Modal de paiement
- [ ] Download PDF
- [ ] Upload de pièces jointes
- [ ] Calcul automatique de overdue (si dueDate < today && status !== 'paid')

---

## 📝 Prochaines actions

1. ✅ **Vérifier** l'endpoint `from-quote` dans le contrôleur
2. ✅ **Créer** InterventionInvoices.vue avec:
   - Liste avec filtres avancés
   - Création depuis devis OU manuelle
   - Modal de paiement
   - Bouton download PDF
3. ✅ **Ajouter** méthodes API manquantes:
   - `markInvoiceAsPaid(id, data)`
   - `downloadInvoicePdf(id)`
   - `uploadInvoiceAttachment(id, file)`

---

**Prochaine étape**: Vérifier l'endpoint `from-quote` et créer la page complète.

