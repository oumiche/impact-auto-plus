# Registre des Prix - Spécifications Techniques

## 📋 Vue d'Ensemble

Le **Registre des Prix** est un système d'historisation et d'analyse des prix pratiqués pour les pièces et services d'intervention, contextualisé par modèle de véhicule et période.

**Objectifs :**
- 💰 Optimiser les coûts et négocier avec les fournisseurs
- 📊 Prévoir les budgets avec précision
- ⚠️ Détecter automatiquement les anomalies de prix
- 📈 Analyser les tendances et l'inflation
- 🎯 Aider à la création de devis réalistes

---

## 🗂️ Structure de Données

### **Entité : `SupplyPriceHistory`**

#### **Propriétés**

```php
Identification :
- id (int)                              → PK auto-increment

Pièce/Service :
- supply (Supply, nullable)             → Référence pièce (si existe)
- description (text)                    → Description de la pièce/service
- workType (string)                     → 'labor' / 'supply' / 'other'
- category (string, nullable)           → Catégorie pour regroupements

Prix :
- unitPrice (decimal 10,2)              → Prix unitaire
- quantity (decimal 10,2)               → Quantité
- totalPrice (decimal 10,2)             → Prix total (calculé)
- currency (string, 10)                 → 'F CFA' / 'EUR'

Contexte Véhicule (OBLIGATOIRE) :
- vehicle (Vehicle, nullable)           → Véhicule concerné (si connu)
- vehicleBrand (Brand)                  → Marque (obligatoire)
- vehicleModel (Model)                  → Modèle (obligatoire)
- vehicleYear (int)                     → Année du véhicule

Contexte Temporel (OBLIGATOIRE) :
- recordedAt (datetime)                 → Date d'enregistrement
- recordedYear (int)                    → Année (pour stats)
- recordedMonth (int)                   → Mois (pour tendances)
- validFrom (date, nullable)            → Début validité prix
- validUntil (date, nullable)           → Fin validité prix

Source et Traçabilité :
- sourceType (string)                   → 'auto' / 'manual' / 'import' / 'catalog'
- workAuthorization (BA, nullable)      → Si source auto
- intervention (Intervention, nullable) → Lien intervention
- garage (string, nullable)             → Nom garage/fournisseur
- supplier (string, nullable)           → Nom fournisseur

Métadonnées :
- createdBy (User)                      → Qui a créé
- createdAt (datetime_immutable)        → Date création
- updatedBy (User, nullable)            → Qui a modifié
- updatedAt (datetime, nullable)        → Date modification
- notes (text, nullable)                → Remarques libres

Analyse Automatique :
- isAnomaly (boolean)                   → Prix anormal détecté
- deviationPercent (decimal 5,2)        → Écart % vs moyenne
- priceRank (string, nullable)          → 'low' / 'average' / 'high'
```

#### **Index**
```sql
- idx_supply_model_date (supply_id, vehicle_model_id, recorded_at)
- idx_recorded_date (recorded_at)
- idx_brand_model (vehicle_brand_id, vehicle_model_id)
- idx_source_type (source_type)
- idx_anomaly (is_anomaly)
```

#### **⚠️ Important : Registre GLOBAL**
Le registre des prix est **partagé entre tous les tenants**.
- ✅ Plus de données → moyennes plus fiables
- ✅ Meilleur benchmark inter-entreprises
- ✅ Prix de marché réels
- ⚠️ Pas de confidentialité des tarifs entre entreprises

---

## 🔄 Modes d'Alimentation

### **1. Automatique (Validation BA)**

**Déclencheur :** `InterventionWorkAuthorization` passe à `status = 'approved'`

**Event Listener :** `WorkAuthorizationApprovedListener`

**Actions :**
1. Récupérer toutes les lignes du BA
2. Pour chaque ligne :
   - Créer `SupplyPriceHistory`
   - Récupérer véhicule de l'intervention
   - Extraire marque, modèle, année
   - Calculer écart par rapport à moyenne
   - Détecter anomalie si écart > 20%
3. Si anomalie détectée → Créer notification

**Code simplifié :**
```php
foreach ($ba->getLines() as $line) {
    $price = new SupplyPriceHistory();
    $price->setSupply($line->getSupply());
    $price->setDescription($line->getDescription());
    $price->setWorkType($line->getWorkType());
    $price->setUnitPrice($line->getUnitPrice());
    $price->setQuantity($line->getQuantity());
    
    $vehicle = $ba->getIntervention()->getVehicle();
    $price->setVehicleBrand($vehicle->getBrand());
    $price->setVehicleModel($vehicle->getModel());
    $price->setVehicleYear($vehicle->getYear());
    
    $price->setSourceType('auto');
    $price->setWorkAuthorization($ba);
    $price->setCreatedBy($currentUser);
    
    // Calcul anomalie (utilise données globales)
    $this->detectAnomaly($price);
}
```

### **2. Manuel (Saisie Gestionnaire)**

**Interface :** Formulaire dédié dans l'admin

**Champs obligatoires :**
- Pièce/Service (ou description)
- Marque + Modèle
- Année véhicule
- Prix unitaire
- Date d'enregistrement

**Champs optionnels :**
- Quantité (défaut: 1)
- Fournisseur
- Période de validité (du/au)
- Notes

**Validation :**
- Prix > 0
- Année véhicule cohérente (1990-2030)
- Date enregistrement <= aujourd'hui
- Si supply sélectionné, vérifier existence

### **3. Import CSV**

**Format attendu :**
```csv
piece,marque,modele,annee,prix,date,fournisseur,notes
"Filtre à huile","Toyota","Corolla",2015,12000,2025-01-15,"Garage A",""
"Plaquettes frein","Peugeot","208",2018,45000,2025-02-20,"Garage B","Prix négocié"
```

**Validation lors import :**
- Vérifier format CSV
- Valider chaque ligne
- Rapport d'import : X réussis / Y échecs
- Option : continuer sur erreur ou tout annuler

### **4. Prix Catalogue (Référence)**

**Usage :** Enregistrer prix constructeur/catalogue

**Particularité :**
- `sourceType = 'catalog'`
- `validFrom` et `validUntil` pour période de validité
- Ne déclenche pas d'alerte anomalie
- Sert de référence pour comparaisons

---

## 🧮 Calculs et Algorithmes

### **1. Prix Moyen Contextualisé**

**Paramètres :**
- Supply (ou description)
- Modèle de véhicule
- Période (défaut: 6 mois)

**Algorithme :**
```php
function getAveragePrice($supply, $model, $months = 6) {
    $startDate = (new DateTime())->modify("-{$months} months");
    
    $prices = repository->findBy([
        'supply' => $supply,
        'vehicleModel' => $model,
        'recordedAt >=' => $startDate
    ]);
    
    // Exclure les anomalies validées comme exceptions
    $prices = array_filter($prices, fn($p) => !$p->isException());
    
    // Moyenne simple
    $sum = array_sum(array_map(fn($p) => $p->getUnitPrice(), $prices));
    return count($prices) > 0 ? $sum / count($prices) : null;
}
```

**Option avancée : Moyenne pondérée**
```php
// Prix récents = poids plus fort
Prix < 1 mois  : poids 3
Prix 1-3 mois  : poids 2
Prix 3-6 mois  : poids 1
Prix > 6 mois  : exclus
```

### **2. Détection d'Anomalie**

**Algorithme :**
```php
function detectAnomaly($newPrice) {
    $avgPrice = getAveragePrice(
        $newPrice->getSupply(),
        $newPrice->getVehicleModel(),
        6 // 6 mois
    );
    
    if (!$avgPrice) {
        return false; // Pas assez de données historiques
    }
    
    $deviation = (($newPrice->getUnitPrice() - $avgPrice) / $avgPrice) * 100;
    $newPrice->setDeviationPercent($deviation);
    
    // Seuils
    if (abs($deviation) > 30) {
        $newPrice->setIsAnomaly(true);
        $newPrice->setPriceRank($deviation > 0 ? 'very_high' : 'very_low');
        return true;
    } elseif (abs($deviation) > 20) {
        $newPrice->setIsAnomaly(true);
        $newPrice->setPriceRank($deviation > 0 ? 'high' : 'low');
        return true;
    } elseif (abs($deviation) > 10) {
        $newPrice->setPriceRank($deviation > 0 ? 'above_average' : 'below_average');
    } else {
        $newPrice->setPriceRank('average');
    }
    
    return false;
}
```

### **3. Évolution Temporelle**

**Calcul de tendance :**
```php
function getPriceTrend($supply, $model, $months = 12) {
    $prices = getPricesByMonth($supply, $model, $months);
    
    // Régression linéaire simple
    // y = ax + b
    // où y = prix, x = mois
    
    $slope = calculateSlope($prices);
    
    if ($slope > 0.05) {
        return ['trend' => 'increasing', 'rate' => $slope];
    } elseif ($slope < -0.05) {
        return ['trend' => 'decreasing', 'rate' => $slope];
    }
    return ['trend' => 'stable', 'rate' => $slope];
}
```

---

## 🎨 Interface Utilisateur

### **Pages à Créer**

#### **1. `/supply-prices.html` - Liste/Recherche**
```
┌─────────────────────────────────────────────┐
│ 💰 Registre des Prix                       │
├─────────────────────────────────────────────┤
│ [Recherche] [Filtres] [+ Ajouter] [Import] │
├─────────────────────────────────────────────┤
│                                             │
│ 🔍 Recherche :                              │
│ [Nom pièce___] [Marque▾] [Modèle▾] [2025▾] │
│                                             │
│ 📊 Résultats : 145 prix enregistrés        │
│                                             │
│ [Tableau avec colonnes:]                    │
│ - Pièce                                     │
│ - Modèle Véhicule                          │
│ - Prix                                      │
│ - Date                                      │
│ - Fournisseur                              │
│ - Statut (Normal/Alerte)                   │
│ - Actions (Voir/Modifier/Supprimer)       │
└─────────────────────────────────────────────┘
```

#### **2. Formulaire Ajout/Modification Manuel**
- Champs du formulaire complet
- Validation en temps réel
- Suggestion auto-complétion
- Calcul automatique du total
- Affichage prix moyen existant

#### **3. Page Détail Prix**
- Informations complètes
- Graphique évolution (si historique)
- Comparaison avec moyenne
- Liste des autres prix pour même pièce+modèle

#### **4. Page Analyse des Prix**
- Dashboard avec KPIs prix
- Graphiques évolution
- Top 10 augmentations
- Alertes anomalies

---

## 📡 API Endpoints

### **CRUD Standard**
```
POST   /api/supply-prices
{
    "supplyId": 123,
    "description": "Filtre à huile",
    "workType": "supply",
    "unitPrice": 12000,
    "quantity": 1,
    "vehicleBrandId": 5,
    "vehicleModelId": 42,
    "vehicleYear": 2015,
    "recordedAt": "2025-10-08",
    "sourceType": "manual",
    "garage": "Garage Central",
    "notes": "Prix catalogue"
}

GET    /api/supply-prices?page=1&limit=20&search=filtre
GET    /api/supply-prices/{id}
PUT    /api/supply-prices/{id}
DELETE /api/supply-prices/{id}
```

### **Recherche et Analyse**
```
GET /api/supply-prices/search?
    supply=123&
    brand=5&
    model=42&
    year=2015&
    startDate=2024-01-01&
    endDate=2025-12-31

GET /api/supply-prices/average?
    supply=123&
    model=42&
    months=6

GET /api/supply-prices/evolution?
    supply=123&
    model=42&
    months=12

GET /api/supply-prices/compare-suppliers?
    supply=123&
    model=42

GET /api/supply-prices/anomalies?
    severity=high&
    startDate=2025-01-01

GET /api/supply-prices/statistics?
    model=42&
    period=2025-01
```

### **Import/Export**
```
POST /api/supply-prices/import
     (multipart/form-data avec fichier CSV)

GET  /api/supply-prices/export?
     format=csv&
     filters[model]=42&
     filters[year]=2025
```

---

## ⚙️ Logique Métier

### **Alimentation Automatique**

**Event :** `WorkAuthorizationApprovedEvent`

**Listener :** `WorkAuthorizationApprovedListener`

**Workflow :**
1. Détection changement statut BA → 'approved'
2. Vérification : BA a des lignes ?
3. Pour chaque ligne (InterventionWorkAuthorizationLine) :
   - Créer SupplyPriceHistory
   - Remplir contexte véhicule
   - Calculer écart vs moyenne
   - Détecter anomalie
4. Si anomalies → Créer notifications
5. Enregistrement en base

**Code concept :**
```php
class WorkAuthorizationApprovedListener
{
    public function onWorkAuthorizationApproved(WorkAuthorizationApprovedEvent $event)
    {
        $ba = $event->getWorkAuthorization();
        $intervention = $ba->getIntervention();
        $vehicle = $intervention->getVehicle();
        
        foreach ($ba->getLines() as $line) {
            $priceHistory = new SupplyPriceHistory();
            
            // Données pièce
            $priceHistory->setSupply($line->getSupply());
            $priceHistory->setDescription($line->getDescription());
            $priceHistory->setWorkType($line->getWorkType());
            
            // Prix
            $priceHistory->setUnitPrice($line->getUnitPrice());
            $priceHistory->setQuantity($line->getQuantity());
            $priceHistory->setTotalPrice($line->getLineTotal());
            
            // Contexte véhicule
            $priceHistory->setVehicle($vehicle);
            $priceHistory->setVehicleBrand($vehicle->getBrand());
            $priceHistory->setVehicleModel($vehicle->getModel());
            $priceHistory->setVehicleYear($vehicle->getYear());
            
            // Contexte temporel
            $now = new DateTime();
            $priceHistory->setRecordedAt($now);
            $priceHistory->setRecordedYear((int)$now->format('Y'));
            $priceHistory->setRecordedMonth((int)$now->format('m'));
            
            // Source
            $priceHistory->setSourceType('auto');
            $priceHistory->setWorkAuthorization($ba);
            $priceHistory->setIntervention($intervention);
            $priceHistory->setCreatedBy($currentUser);
            
            // Détection anomalie
            $this->priceAnalysisService->detectAnomaly($priceHistory);
            
            $this->entityManager->persist($priceHistory);
        }
        
        $this->entityManager->flush();
    }
}
```

### **Saisie Manuelle**

**Workflow :**
1. Gestionnaire remplit formulaire
2. Validation côté client (JS)
3. Envoi API POST
4. Validation côté serveur
5. Calcul automatique :
   - totalPrice = unitPrice * quantity
   - recordedYear, recordedMonth
   - deviationPercent (vs moyenne)
6. Enregistrement en base
7. Retour confirmation

---

## 🎯 Fonctionnalités Clés

### **1. Suggestion de Prix (lors création devis)**

**API :** `GET /api/supply-prices/suggestion`

**Paramètres :**
- `supply` ou `description`
- `vehicleModel`
- `vehicleYear` (optionnel)

**Réponse :**
```json
{
    "success": true,
    "data": {
        "averagePrice": 45000,
        "minPrice": 40000,
        "maxPrice": 52000,
        "medianPrice": 46000,
        "sampleSize": 15,
        "lastPrice": {
            "price": 46000,
            "date": "2025-09-15",
            "garage": "Garage A"
        },
        "suggestedRange": {
            "min": 43000,
            "max": 48000
        },
        "trend": "stable",
        "confidence": "high"
    }
}
```

**Intégration :**
- Affichage dans formulaire devis
- Tooltip avec détails
- Warning si prix saisi hors fourchette

### **2. Détection Anomalie Temps Réel**

**Lors validation BA :**
```
BA #2025-045 validé

Ligne 3 : Batterie (Toyota Corolla 2015)
Prix : 95,000 F CFA
Prix moyen : 65,000 F CFA

⚠️ ALERTE : Écart de +46%
→ Notification envoyée au gestionnaire
→ Option : Valider / Rejeter / Demander justification
```

**Notification :**
- Email au gestionnaire
- Alerte dans l'application
- Badge sur le BA concerné

### **3. Rapports d'Analyse**

#### **A. Rapport "Évolution des Prix"**
- Graphique ligne par pièce
- Filtrable par modèle, période
- Taux d'inflation calculé
- Comparaison multi-pièces

#### **B. Rapport "Comparaison Fournisseurs"**
- Tableau comparatif prix moyens
- Par pièce et par modèle
- Nombre d'interventions
- Note qualité (si disponible)

#### **C. Rapport "Prix Anormaux"**
- Liste des anomalies détectées
- Filtre par période, sévérité
- Statut : En attente / Validé / Rejeté
- Actions rapides

#### **D. Rapport "Inflation"**
- Taux d'augmentation général
- Par catégorie (pièces, MO, autres)
- Par fournisseur
- Impact budgétaire estimé

---

## 🔔 Système d'Alertes

### **Types d'Alertes**

1. **Anomalie de Prix** (Priorité: Haute)
   ```
   Titre : "Prix suspect détecté"
   Message : "Batterie Toyota Corolla : 95,000 F (+46% vs moyenne)"
   Actions : [Valider] [Rejeter] [Voir détails]
   ```

2. **Augmentation Rapide** (Priorité: Moyenne)
   ```
   Titre : "Inflation détectée"
   Message : "Plaquettes frein : +18% en 3 mois"
   Actions : [Voir évolution] [OK]
   ```

3. **Manque de Données** (Priorité: Info)
   ```
   Titre : "Première utilisation"
   Message : "Aucun historique pour cette pièce + modèle"
   Actions : [OK]
   ```

4. **Prix Exceptionnel** (Priorité: Basse)
   ```
   Titre : "Prix très compétitif"
   Message : "Vidange : 25,000 F (-35% vs moyenne)"
   Actions : [Noter fournisseur] [OK]
   ```

### **Configuration Seuils**

**Table `parameters` (paramètres globaux) :**
```
anomaly_threshold_critical : 50    (%)
anomaly_threshold_high     : 30    (%)
anomaly_threshold_medium   : 20    (%)
anomaly_threshold_low      : 10    (%)
price_history_months       : 6     (mois à considérer)
price_minimum_samples      : 3     (nb minimum pour moyenne)
inflation_alert_threshold  : 15    (%)
```

**Note :** Ces paramètres sont globaux (pas par tenant) car le registre est partagé.

---

## 📊 Rapports Intégrés

### **Ajout au Dashboard Principal**

**KPI Prix :**
```
┌─────────────────────────────────────┐
│ 💰 Prix & Inflation                │
├─────────────────────────────────────┤
│ Prix moyen MO     : 15,000 F/h     │
│ Inflation mois    : +2.5%          │
│ Anomalies         : 3 ⚠️           │
│ Économies mois    : 245,000 F ✓    │
└─────────────────────────────────────┘
```

### **Rapport Analyse Coûts (enrichi)**

**Ajout section :**
- "Évolution des prix unitaires"
- "Comparaison avec catalogue"
- "Inflation constatée"

---

## 🔐 Permissions

### **Rôles et Accès**

| Action | Admin | Gestionnaire | Technicien | Viewer |
|--------|-------|--------------|------------|--------|
| Consulter historique | ✅ | ✅ | ✅ | ✅ |
| Voir moyennes/stats | ✅ | ✅ | ✅ | ✅ |
| Ajouter manuel | ✅ | ✅ | ❌ | ❌ |
| Modifier | ✅ | ⚠️ (ses propres) | ❌ | ❌ |
| Supprimer | ✅ | ❌ | ❌ | ❌ |
| Valider anomalie | ✅ | ✅ | ❌ | ❌ |
| Import CSV | ✅ | ✅ | ❌ | ❌ |
| Export | ✅ | ✅ | ✅ | ❌ |

---

## 💡 Fonctionnalités Avancées

### **1. Suggestions Intelligentes**

**Lors création devis :**
```javascript
Utilisateur saisit : "Filtre à huile"
Système détecte : véhicule = Peugeot 208 2018

→ Affiche automatiquement :
  Prix suggéré : 9,500 F CFA
  (Basé sur 12 interventions similaires)
  
→ Warning si prix > 11,500 F (+20%)
```

### **2. Comparaison en Temps Réel**

**Interface BA/Devis :**
```
Ligne : Plaquettes frein - 55,000 F

[ℹ️ Historique prix]
├─ Prix moyen : 48,000 F (-13%)
├─ Dernier prix : 50,000 F (il y a 1 mois)
├─ Meilleur prix : 42,000 F (Garage B)
└─ Pire prix : 58,000 F (Garage C)
```

### **3. Notifications Proactives**

**Email mensuel automatique :**
```
📧 Rapport mensuel - Évolution des Prix

Bonjour,

Voici les évolutions notables ce mois :

📈 Augmentations importantes :
- Pneus : +12% vs mois dernier
- Batteries : +8%

📉 Diminutions :
- Filtres : -5%

⚠️ 5 anomalies détectées ce mois
→ Voir détails dans l'application

💰 Économies réalisées : 185,000 F CFA
(vs prix catalogue constructeur)
```

### **4. Prix par Zone Géographique**

**Extension future :**
```
Ajouter :
- region (string) → "Dakar", "Thiès", etc.
- cityArea (string) → Quartier/zone

→ Permet de comparer prix selon localisation
→ "Garage centre-ville vs périphérie"
```

---

## 🎓 Cas d'Usage Complets

### **Scénario 1 : Validation BA avec Alerte**

```
1. Technicien crée BA pour Toyota Corolla 2015
2. Ajoute : "Changement batterie - 95,000 F"
3. Chef atelier valide le BA
   ↓
4. Event Listener déclenché
   ↓
5. Système consulte historique :
   - 8 batteries Toyota Corolla 2015 dans les 6 mois
   - Prix moyen : 65,000 F
   - Écart : +46%
   ↓
6. Création SupplyPriceHistory avec isAnomaly = true
   ↓
7. Notification envoyée au gestionnaire :
   "⚠️ Prix suspect : Batterie Toyota Corolla (+46%)"
   ↓
8. Gestionnaire vérifie :
   - Option 1 : Valider ("Prix justifié car urgence")
   - Option 2 : Rejeter BA et renégocier
   - Option 3 : Contacter fournisseur
```

### **Scénario 2 : Création Devis Assistée**

```
1. Technicien crée devis pour Peugeot 208 2020
2. Ajoute ligne : "Vidange complète"
3. Système affiche automatiquement :
   
   ┌─────────────────────────────────┐
   │ 💡 Suggestion de prix          │
   ├─────────────────────────────────┤
   │ Prix moyen : 32,000 F CFA      │
   │ (Basé sur 15 vidanges similaires)│
   │                                 │
   │ Détails :                       │
   │ - Min : 28,000 F (Garage A)    │
   │ - Max : 38,000 F (Garage D)    │
   │ - Médiane : 32,500 F           │
   │                                 │
   │ Fourchette conseillée :        │
   │ 30,000 - 35,000 F CFA          │
   └─────────────────────────────────┘
   
4. Technicien saisit : 45,000 F
   ↓
5. Warning apparaît :
   "⚠️ Prix supérieur de +41% à la moyenne"
   ↓
6. Technicien justifie ou ajuste
```

### **Scénario 3 : Négociation Fournisseur**

```
1. Gestionnaire consulte "Comparaison Fournisseurs"
2. Pièce : Plaquettes de frein (Peugeot 208)
3. Résultats :
   
   | Fournisseur | Prix Moy. | Nb Achats | Qualité |
   |-------------|-----------|-----------|---------|
   | Garage A    | 42,000 F  | 18        | ⭐⭐⭐⭐⭐ |
   | Garage B    | 45,000 F  | 12        | ⭐⭐⭐⭐  |
   | Garage C    | 58,000 F  | 5         | ⭐⭐⭐⭐⭐ |
   
4. Constat : Garage C facture +38% vs Garage A
5. Gestionnaire contacte Garage C avec chiffres
6. Négociation : Garage C accepte 48,000 F
7. Enregistrement manuel :
   - Prix négocié : 48,000 F
   - Validité : 1 an
   - Notes : "Prix négocié - accord cadre"
```

### **Scénario 4 : Budget Prévisionnel**

```
1. Gestionnaire prépare budget 2026
2. Consulte "Évolution des Prix"
3. Constate :
   - Inflation générale : +8%
   - Pièces moteur : +12%
   - Main d'œuvre : +5%
4. Ajuste budget avec tendances réelles
5. Budget plus précis et réaliste
```

---

## ⚠️ Règles de Gestion

### **Validation des Données**

**Lors de l'enregistrement :**
1. Prix > 0 (obligatoire)
2. Quantité > 0 (obligatoire)
3. Année véhicule entre 1990 et année courante + 1
4. Date enregistrement <= aujourd'hui
5. Si validFrom/validUntil → validFrom < validUntil
6. Marque + Modèle obligatoires
7. Si supply renseigné → vérifier existence

### **Calcul de Moyenne**

**Règles :**
- Minimum 3 échantillons pour moyenne fiable
- Exclure anomalies marquées comme "exceptions"
- Période par défaut : 6 mois
- Si < 3 échantillons → afficher "Données insuffisantes"

### **Anomalies**

**Niveaux de sévérité :**
- **Critique** : écart > 50% (requiert validation)
- **Élevé** : écart > 30% (alerte forte)
- **Moyen** : écart > 20% (alerte)
- **Faible** : écart > 10% (info)

**Actions possibles :**
- `pending` : En attente validation
- `validated` : Validé comme OK (justifié)
- `rejected` : Rejeté (erreur/fraude)
- `exception` : Exception (cas particulier)

---

## 📈 KPIs du Registre

### **Dashboard "Registre des Prix"**

**Métriques :**
- **Total enregistrements** : 2,458 prix
- **Prix ce mois** : 145 nouveaux
- **Inflation moyenne** : +6.5%
- **Anomalies détectées** : 8 en attente
- **Économies estimées** : 1,250,000 F (vs catalogue)
- **Fournisseur le plus compétitif** : Garage A (score 92/100)

---

## 🚀 Plan d'Implémentation

### **Étapes**

1. ✅ **Entité SupplyPriceHistory** (avec migrations)
2. ✅ **Repository** avec méthodes de recherche
3. ✅ **Service PriceAnalysisService** (calculs)
4. ✅ **Event Listener** (alimentation auto)
5. ✅ **Controller API** (CRUD + recherches)
6. ✅ **Interface Frontend** (liste, formulaire, recherche)
7. ✅ **Intégration Devis** (suggestions)
8. ✅ **Système Alertes** (notifications)
9. ✅ **Rapports** (évolution, comparaison)
10. ✅ **Tests** et ajustements

**Estimation :** 2-3 semaines

---

## 📝 Notes Importantes

### **Données Dénormalisées**

**Pourquoi dénormaliser brand, model, year ?**
- ✅ Performance : pas de join pour les stats
- ✅ Historique préservé : si modèle supprimé, on garde l'info
- ✅ Simplicité : requêtes plus rapides

**Risque :** Incohérence si modèle change
**Solution :** Update en cascade + audit

### **Gestion de la Monnaie**

**Multi-devises :**
- Enregistrer devise à chaque prix
- Conversion automatique pour comparaisons
- Taux de change du jour (API externe)

---

**Document préparé pour** : Impact Auto Plus  
**Module** : Registre des Prix  
**Version** : 1.0  
**Date** : Octobre 2025  
**Statut** : Spécifications - Prêt pour implémentation


INSERT INTO parameters (parameter_key, parameter_value, category, description, tenant_id) VALUES
('price_history_months', '6', 'price_registry', 'Nombre de mois pour calcul moyenne', NULL),
('price_minimum_samples', '3', 'price_registry', 'Nombre minimum échantillons', NULL),
('anomaly_threshold_critical', '50', 'price_registry', 'Seuil critique (%)', NULL),
('anomaly_threshold_high', '30', 'price_registry', 'Seuil élevé (%)', NULL),
('anomaly_threshold_medium', '20', 'price_registry', 'Seuil moyen (%)', NULL),
('anomaly_threshold_low', '10', 'price_registry', 'Seuil faible (%)', NULL);