# Proposition de Système de Rapports pour la Gestion de Parc Auto

## Introduction

Ce document présente une proposition complète de système de rapports pour la gestion de parc automobile, basée sur les bonnes pratiques du domaine et adaptée aux besoins spécifiques d'Impact Auto Plus.

---

## 📋 État d'Avancement (Octobre 2025)

### ✅ Phase 1 - MVP : COMPLÉTÉE
**5 rapports opérationnels en production :**

| Rapport | Statut | API Endpoint | Interface |
|---------|--------|--------------|-----------|
| **Tableau de Bord** | ✅ Actif | `/api/reports/dashboard` | `reports.html` |
| **Coûts par Véhicule** | ✅ Actif | `/api/reports/costs/by-vehicle` | `reports.html` |
| **Échéancier Maintenance** | ✅ Actif | `/api/reports/maintenance/schedule` | `reports.html` |
| **KPIs Essentiels** | ✅ Actif | `/api/reports/kpis` | `reports.html` |
| **Analyse des Pannes** | ✅ Actif | `/api/reports/failures/analysis` | `reports.html` |

**Fonctionnalités disponibles :**
- ✅ Système de cache intelligent (désactivé pour Analyse des Pannes)
- ✅ Filtres par date et véhicule
- ✅ Interface responsive avec 8 sections d'analyse
- ✅ Actualisation temps réel
- ✅ Calculs corrigés (v1.1)
- ✅ MTBF (Mean Time Between Failures)
- ✅ Analyse multi-critères (type, marque, modèle, âge, km)

### ⏳ Prochaines Étapes : Phase 2
**Phase 2 - En cours :**
- ✅ **Analyse des pannes** - **IMPLÉMENTÉ** (Octobre 2025)
  - Top 10 pannes récurrentes
  - MTBF par véhicule (Top 20 problématiques)
  - Top 15 pièces les plus remplacées
  - Analyse par marque, modèle, âge et kilométrage

**À développer :**
- ⏳ Analyse des coûts détaillée
- ⏳ Performance réparations
- ⏳ Rapports par conducteur

---

## 📊 1. Rapports Opérationnels (Quotidien/Hebdomadaire)

### **Tableau de Bord des Interventions**

**Objectif** : Vue d'ensemble temps réel de l'activité

**Indicateurs clés** :
- **Interventions en cours** : nombre et statut par étape du workflow
  - Signalé
  - En prédiagnostic
  - En devis
  - En accord
  - En réparation
  - En réception
- **Délais moyens** : par étape (prédiagnostic, devis, réparation, etc.)
- **Interventions en retard** : dépassant la durée estimée
- **Taux de disponibilité des véhicules** : pourcentage de véhicules disponibles vs en intervention
- **Alertes** : interventions urgentes, expiration garanties, etc.

**Fréquence recommandée** : Temps réel / Quotidien

---

### **Rapport de Performance des Réparations**

**Objectif** : Mesurer l'efficacité du processus de réparation

**Métriques** :
- **Temps moyen de réparation** : par type d'intervention
- **Taux de réouverture** : interventions nécessitant un retour en atelier
- **Respect des délais** : % interventions terminées dans les délais
- **Satisfaction client** : moyenne des notes de réception (excellent, bon, moyen, mauvais)
- **Première intervention réussie** : % de problèmes résolus du premier coup

**Fréquence recommandée** : Hebdomadaire

---

## 📈 2. Rapports Financiers (Mensuel/Trimestriel)

### **Analyse des Coûts**

**Objectif** : Contrôler et optimiser les dépenses

**Analyses** :
- **Coûts totaux par véhicule** : historique et tendances
- **Coûts par type d'intervention** : 
  - Entretien préventif
  - Réparations correctives
  - Accidents
  - Révisions
- **Évolution des coûts** : comparaison période sur période
- **Top 10 véhicules les plus coûteux**
- **Répartition** : 
  - Main d'œuvre
  - Pièces détachées
  - Sous-traitance
  - Fournitures

**Fréquence recommandée** : Mensuel

---

### **Analyse Budgétaire**

**Objectif** : Piloter le budget maintenance

**Éléments** :
- **Budget vs Réalisé** : écarts par catégorie
- **Prévisions** : projection sur les 3/6/12 mois à venir
- **Devis vs Factures** : taux de dépassement et écarts moyens
- **Factures impayées** : montant total et ancienneté
- **Saisonnalité** : identification des pics de dépenses

**Fréquence recommandée** : Mensuel / Trimestriel

---

## 🚗 3. Rapports par Véhicule

### **Fiche de Vie Véhicule**

**Objectif** : Historique complet d'un véhicule

**Contenu** :
- **Informations générales** : 
  - Immatriculation, marque, modèle, année
  - VIN, date mise en service
  - Catégorie, affectation
- **Historique complet** : toutes interventions chronologiques
- **Coût total de possession** (TCO) :
  - Coût d'achat
  - Coûts d'entretien cumulés
  - Consommation carburant
  - Assurance
  - TCO au km
- **Kilométrage** : évolution et projections
- **Taux d'immobilisation** : jours en atelier / jours total
- **Recommandations** : réforme, vente, maintien dans le parc

**Utilisation** : À la demande, décision de gestion

---

### **Maintenance Préventive**

**Objectif** : Anticiper et planifier les entretiens

**Informations** :
- **Échéancier** : entretiens à venir
  - Dans 30 jours
  - Dans 60 jours
  - Dans 90 jours
- **Retards** : maintenances en retard
- **Conformité** : respect du plan de maintenance constructeur
- **Coûts évités** : estimation des économies grâce à la maintenance préventive
- **Alertes kilométrage** : véhicules approchant des seuils d'entretien

**Fréquence recommandée** : Hebdomadaire

---

## 👥 4. Rapports par Conducteur

### **Utilisation et Comportement**

**Objectif** : Identifier les conducteurs à risque et optimiser les affectations

**Indicateurs** :
- **Taux d'incidents** : nombre interventions / km parcourus
- **Types de pannes récurrentes** : par conducteur
- **Coûts imputables** : dommages vs usure normale
- **Permis et conformité** : 
  - Validité du permis
  - Expirations à venir
  - Infractions éventuelles
- **Utilisation** : km parcourus, heures d'utilisation
- **Score de conduite** : si télématique disponible

**Fréquence recommandée** : Mensuel

---

## 🔧 5. Rapports Techniques

### **Analyse des Pannes** ✅ **IMPLÉMENTÉ**

**Objectif** : Identifier les problèmes récurrents et améliorer la fiabilité

**Analyses implémentées :**
- ✅ **Pannes récurrentes** : top 10 par type/marque/modèle
- ✅ **MTBF** (Mean Time Between Failures) : Top 20 véhicules les plus problématiques
- ✅ **Pièces les plus changées** : Top 15 avec fréquence et coûts
- ✅ **Taux de panne** : 
  - Par marque (Top 10)
  - Par modèle (Top 10)
  - Par âge du véhicule (5 tranches : 0-2, 3-5, 6-10, 11-15, 15+ ans)
  - Par kilométrage (5 tranches : 0-50k, 50-100k, 100-150k, 150-200k, 200k+)
- ✅ **Analyse de fiabilité** : identification des véhicules problématiques via MTBF

**Données sources** : `InterventionInvoiceLine` (factures finales)  
**Période par défaut** : 6 derniers mois  
**Fréquence recommandée** : Trimestriel  
**API Endpoint** : `/api/reports/failures/analysis`  
**Interface** : `reports.html` (onglet Pannes)

---

### **Performance Fournisseurs/Garages**

**Objectif** : Évaluer et sélectionner les meilleurs partenaires

**Critères d'évaluation** :
- **Délais moyens** : par garage/sous-traitant
- **Qualité** : 
  - Taux de reprise (retour en atelier)
  - Taux de réclamation
  - Satisfaction des réceptions
- **Respect des devis** : écarts entre devis et facture
- **Prix** : comparaison tarifaire par type de prestation
- **Disponibilité** : délai de prise en charge
- **Évaluation globale** : notation et classement

**Fréquence recommandée** : Trimestriel

---

## 📅 6. Rapports de Gestion Stratégique

### **KPIs (Indicateurs Clés de Performance)**

**Tableau de bord direction** :
- **Disponibilité moyenne du parc** : cible > 95%
- **Coût moyen au kilomètre** : benchmark et évolution
- **Âge moyen du parc** : stratégie de renouvellement
- **Taux d'utilisation** : km/jour par véhicule
- **Ratio préventif/correctif** : cible 70/30
- **Taux de sinistralité**
- **ROI des investissements** : nouveaux véhicules vs anciens

**Fréquence recommandée** : Mensuel

---

### **Analyse de Flotte**

**Objectif** : Optimiser la composition du parc

**Analyses** :
- **Composition actuelle** : 
  - Par catégorie (VL, VUL, PL)
  - Par marque et modèle
  - Par âge et kilométrage
  - Par type de carburant
- **Rotation recommandée** : véhicules à renouveler
- **Conformité** : 
  - Contrôles techniques à jour
  - Assurances valides
  - Équipements obligatoires
- **Impact écologique** : 
  - Émissions CO2 moyennes
  - Consommation moyenne
  - Véhicules électriques/hybrides %

**Fréquence recommandée** : Trimestriel / Annuel

---

## 📋 7. Rapports Réglementaires et Conformité

### **Conformité Légale**

**Objectif** : Assurer la conformité réglementaire

**Vérifications** :
- **Contrôles techniques** : 
  - À jour
  - À faire dans 30/60/90 jours
  - Dépassés (non conformité)
- **Assurances** : 
  - Valides
  - Expirations prochaines
  - Sinistres déclarés
- **Permis conducteurs** : 
  - Validité
  - Catégories autorisées
  - Expirations
- **Traçabilité** : 
  - Historique complet pour audit
  - Justificatifs disponibles
  - Archivage conforme

**Fréquence recommandée** : Mensuel

---

## 🎯 Recommandations d'Implémentation

### **Phase 1 - MVP (2-3 semaines)** ✅ **TERMINÉE**
**Priorité : Opérationnel immédiat**

1. ✅ **Tableau de bord interventions en cours** - **IMPLÉMENTÉ**
   - Liste interventions par statut
   - Compteurs simples
   - Alertes urgentes
   - Disponibilité du parc
   - Tendances et comparaisons
   - *API: `/api/reports/dashboard`*
   - *Frontend: `reports.html` (onglet Dashboard)*

2. ✅ **Coûts par véhicule** - **IMPLÉMENTÉ**
   - Total des interventions par véhicule
   - Graphique évolution mensuelle
   - Répartition main d'œuvre/pièces/autres
   - Historique et tendances
   - *API: `/api/reports/costs/by-vehicle`*
   - *Frontend: `reports.html` (onglet Coûts)*

3. ✅ **Échéancier maintenance** - **IMPLÉMENTÉ**
   - Liste des entretiens à venir
   - Alertes retards
   - Planification sur 90 jours
   - *API: `/api/reports/maintenance/schedule`*
   - *Frontend: `reports.html` (onglet Maintenance)*

4. ✅ **KPIs de base** - **IMPLÉMENTÉ**
   - Disponibilité parc
   - Coût moyen au km
   - Nombre interventions en cours
   - Délai moyen de réparation
   - Satisfaction moyenne
   - *API: `/api/reports/kpis`*
   - *Frontend: `reports.html` (onglet KPIs)*

**Infrastructure mise en place :**
- ✅ Système de cache intelligent (5min à 2h selon le rapport)
- ✅ API REST complète avec filtres (dates, véhicules)
- ✅ Interface utilisateur responsive avec Vue.js
- ✅ Export des données (prévu)
- ✅ Actualisation en temps réel

---

### **Phase 2 - Extension (1 mois)** - EN COURS
**Priorité : Analyse et optimisation**

5. ⏳ **Analyse des coûts détaillée**
   - Par type, par période
   - Comparaisons

6. ⏳ **Performance réparations**
   - Délais moyens
   - Satisfaction

7. ✅ **Analyse des pannes** - **IMPLÉMENTÉ**
   - Pannes récurrentes (Top 10 par type)
   - Par marque/modèle (Top 10 chacun)
   - MTBF - Véhicules problématiques (Top 20)
   - Top 15 pièces les plus remplacées
   - Analyse par âge du véhicule (5 tranches)
   - Analyse par kilométrage (5 tranches)
   - Statistiques globales avec période personnalisable
   - *API: `/api/reports/failures/analysis`*
   - *Frontend: `reports.html` (onglet Pannes)*
   - *Source données: `InterventionInvoiceLine` (factures finales)*

8. ⏳ **Rapports par conducteur**
   - Taux d'incidents
   - Coûts

---

### **Phase 3 - Avancé (2-3 mois)**
**Priorité : Décisionnel et stratégique**

9. ⏳ **Performance fournisseurs**
10. ⏳ **Analyse budgétaire avancée**
11. ⏳ **Prévisions et tendances**
12. ⏳ **Rapports personnalisables**
13. ⏳ **Exports automatisés**

---

## 🛠️ Spécifications Techniques

### **Structure des Rapports**

Chaque rapport devrait avoir :
- **Entité** : `Report` avec types (dashboard, cost_analysis, etc.)
- **Paramètres** : période, filtres, véhicules, etc.
- **Données calculées** : métriques, agrégations
- **Cache** : pour les rapports lourds
- **Historique** : sauvegarde des rapports générés

### **API Endpoints**

```
GET /api/reports/dashboard
GET /api/reports/interventions/status
GET /api/reports/costs/by-vehicle
GET /api/reports/costs/by-type
GET /api/reports/maintenance/schedule
GET /api/reports/kpis
GET /api/reports/fleet-analysis
GET /api/reports/{type}/export?format=pdf|excel|csv
```

### **Interface Utilisateur**

- **Page principale** : `/reports.html` avec menu des rapports
- **Filtres communs** : période, véhicules, catégories
- **Visualisations** : Chart.js ou ApexCharts
- **Export** : boutons PDF/Excel/CSV
- **Personnalisation** : sauvegarder les configurations de rapports

---

## 📊 Visualisations Recommandées

### **Graphiques à Implémenter**

1. **Line Chart** : Évolution des coûts dans le temps
2. **Bar Chart** : Coûts par catégorie/véhicule/type
3. **Pie Chart** : Répartition main d'œuvre vs pièces
4. **Stacked Bar** : Interventions par statut et période
5. **Heatmap** : Pannes par mois et véhicule
6. **Gauge** : KPIs avec objectifs (disponibilité, délais)

---

## 💾 Données à Collecter

### **Nouvelles propriétés potentielles**

Si pas déjà présentes, ajouter :
- `VehicleIntervention.actualCost` : coût réel final
- `VehicleIntervention.preventive` : boolean (préventif vs correctif)
- `Vehicle.totalMaintenanceCost` : calculé automatiquement
- `Vehicle.averageCostPerKm` : calculé automatiquement
- `InterventionReceptionReport.qualityScore` : note qualité
- `Garage` entité : pour tracking fournisseurs

---

## 🎨 Maquettes d'Interface

### **Page Principale Rapports**

```
┌─────────────────────────────────────────────────┐
│  📊 Rapports & Analyses                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Opérationnels] [Financiers] [Techniques]     │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ 🔧 Dashboard │  │ 💰 Coûts     │            │
│  │ Interventions│  │ Détaillés    │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ 📅 Planning  │  │ 📈 KPIs      │            │
│  │ Maintenance  │  │ Performance  │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### **Tableau de Bord Interventions**

```
┌─────────────────────────────────────────────────┐
│  Interventions en Cours                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Signalé: 5] [En diagnostic: 3] [En devis: 2] │
│  [En réparation: 8] [En réception: 1]          │
│                                                 │
│  Délais Moyens:                                 │
│  ━━━━━━━━━ Prédiagnostic: 2j                   │
│  ━━━━━━━━━━━━━━━ Devis: 3j                     │
│  ━━━━━━━━━━━━━━━━━━━ Réparation: 5j            │
│                                                 │
│  ⚠️ Interventions en Retard: 2                  │
│                                                 │
│  Disponibilité Parc: ████████░░ 87%             │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Bonnes Pratiques du Secteur

### **Standards de l'Industrie**

1. **Ratio Préventif/Correctif** : Viser 70% préventif / 30% correctif
2. **Disponibilité minimale** : > 95% du parc disponible
3. **Taux de première intervention réussie** : > 85%
4. **Délai moyen de réparation** : < 3 jours ouvrés
5. **Coût au kilomètre** : selon catégorie véhicule

### **Indicateurs de Décision**

**Quand réformer un véhicule ?**
- Coût annuel > 50% valeur résiduelle
- Immobilisation > 30 jours/an
- Plus de 150 000 km (VL) ou 250 000 km (VUL)
- Âge > 7 ans avec pannes fréquentes
- Coût réparation > 60% valeur vénale

**Optimisation du Parc**
- Standardisation des marques/modèles (pièces communes)
- Rotation régulière (3-5 ans VL, 5-7 ans VUL)
- Mutualisation entre services
- Dimensionnement au juste besoin

---

## 📧 Automatisation et Alertes

### **Rapports Automatiques**

**Envois programmés** :
- **Quotidien 8h** : Tableau de bord + Alertes urgentes
- **Lundi 9h** : Synthèse hebdomadaire
- **1er du mois** : Rapports mensuels financiers
- **Fin trimestre** : Analyses stratégiques

### **Alertes Temps Réel**

**Notifications push/email** :
- Intervention urgente signalée
- Dépassement délai prévu
- Contrôle technique dans 30 jours
- Assurance expirante
- Permis conducteur expirant
- Budget mensuel dépassé

---

## 💡 Fonctionnalités Avancées (Future)

### **Intelligence Artificielle**

- **Prédiction des pannes** : basé sur historique
- **Optimisation des stocks** : pièces à commander
- **Recommandations** : meilleur moment pour réformer
- **Détection d'anomalies** : coûts inhabituels

### **Intégrations Externes**

- **Télématique** : données en temps réel des véhicules
- **Fournisseurs** : API pour devis automatiques
- **Comptabilité** : export vers logiciel compta
- **Carte grise** : vérification automatique validité

---

## 📱 Interface Mobile

### **Rapports Mobiles Essentiels**

Pour les gestionnaires de flotte en déplacement :
- Dashboard simplifié
- Interventions en cours
- Alertes critiques
- Approbation devis
- Signature réception

---

## 🎓 Formation et Documentation

### **Guides Utilisateurs**

- Comment lire un rapport
- Interpréter les KPIs
- Prendre des décisions basées sur les données
- Configurer les alertes personnalisées

### **Documentation Technique**

- Structure des données
- Calcul des métriques
- API des rapports
- Personnalisation

---

## 📌 Résumé Exécutif

### **Bénéfices Attendus**

✅ **Réduction des coûts** : 15-20% via maintenance préventive
✅ **Amélioration disponibilité** : + 10% via meilleure planification
✅ **Optimisation du parc** : identification véhicules à réformer
✅ **Conformité assurée** : alertes automatiques
✅ **Décisions éclairées** : données objectives
✅ **Gain de temps** : automatisation des suivis

### **Retour sur Investissement**

**Investissement estimé** : 
- Développement : 4-6 semaines
- Infrastructure : minimale (utilise l'existant)

**ROI attendu** : 
- Économies annuelles : 10-15% du budget maintenance
- Amortissement : < 12 mois
- Bénéfices récurrents année après année

---

## 📞 Support et Évolution

### **Maintenance**

- Mises à jour régulières des rapports
- Ajout de nouveaux indicateurs selon besoins
- Optimisation des performances
- Support utilisateurs

### **Évolution Continue**

- Recueil feedback utilisateurs
- Ajustement des seuils et alertes
- Nouveaux rapports selon besoins métier
- Améliorations UX/UI

---

## 📝 Historique des Modifications

### Version 1.2 - Octobre 2025
**Nouveau rapport : Analyse des Pannes**

**Implémentation complète :**
1. ✅ **Backend** (`ReportService.php`) :
   - Méthode `generateFailureAnalysis()` (lignes 934-1233)
   - Utilise `InterventionInvoiceLine` pour données facturées finales
   - Période par défaut : 6 derniers mois
   - Calcul MTBF (Mean Time Between Failures)
   - Analyse multi-critères (type, marque, modèle, âge, km)

2. ✅ **API** (`ReportController.php`) :
   - Endpoint : `/api/reports/failures/analysis`
   - Cache désactivé pour éviter erreur JSON_CONTAINS
   - Filtres : startDate, endDate

3. ✅ **Frontend** (`reports-vue.js`) :
   - Nouvel onglet "Pannes" avec icône d'alerte
   - 8 sections d'analyse détaillée :
     * Résumé (total pannes, coût total, coût moyen)
     * Top 10 pannes récurrentes
     * MTBF - Top 20 véhicules problématiques
     * Top 15 pièces les plus remplacées
     * Pannes par marque
     * Pannes par modèle
     * Pannes par âge (5 tranches)
     * Pannes par kilométrage (5 tranches)
   - Filtres de date personnalisables
   - Interface responsive avec tableaux détaillés

**Résolution de bugs :**
- ✅ Identifié et contourné le bug `JSON_CONTAINS` dans `ReportRepository::findWithValidCache()`
- ✅ Cache désactivé temporairement pour ce rapport

**Impact :**
- Identification rapide des véhicules problématiques
- Aide à la décision pour réforme/remplacement
- Optimisation de la gestion des stocks de pièces
- Analyse de fiabilité par marque/modèle
- Planification maintenance préventive ciblée

---

### Version 1.1 - Octobre 2025
**Correction majeure : Calcul des coûts par type de travail**

**Problème identifié :**
- Les coûts de type "other" (autres) étaient incorrectement comptabilisés comme des pièces
- Le rapport de flotte avait des valeurs hardcodées (0) pour les coûts main d'œuvre et pièces

**Corrections appliquées :**
1. ✅ `ReportService.php` (lignes 163-170) : 
   - Ajout de la vérification explicite pour le type "supply/parts/piece"
   - Les types "other" ne sont plus comptés dans les pièces
   - Séparation claire : labor vs supply vs other

2. ✅ `ReportService.php` (lignes 676-715) :
   - Calcul dynamique des coûts totaux de main d'œuvre et pièces pour la flotte
   - Calcul correct du coût moyen par intervention
   - Agrégation des données depuis tous les véhicules

**Impact :**
- Amélioration de la précision des rapports financiers
- Répartition correcte des coûts par catégorie
- Tableaux de bord plus fiables pour la prise de décision

---

**Document préparé pour** : Impact Auto Plus  
**Version** : 1.2  
**Date** : Octobre 2025  
**Statut** : En Production (Phase 1 complétée + 1 rapport Phase 2)

