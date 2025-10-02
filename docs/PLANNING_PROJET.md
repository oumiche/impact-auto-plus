# Planning Projet - Impact Auto

## Informations générales

- **Durée totale** : 74 jours
- **Date de début** : 09/08/2025
- **Date de fin** : 21/11/2025
- **Équipe** : 2-3 développeurs
- **Méthodologie** : Agile/Scrum avec sprints de 2 semaines

---

## Vue d'ensemble des phases

| Phase | Durée | Période | Description | État |
|-------|-------|---------|-------------|------|
| **Phase 1** | 18 jours | 09/08 - 30/08/2025 | Collecte des exigences et conception | ✅ **TERMINÉE** |
| **Phase 2** | 28 jours | 02/09 - 09/10/2025 | Développement du backend | ✅ **TERMINÉE** |
| **Phase 3** | 20 jours | 10/10 - 06/11/2025 | Développement du frontend | 🔄 **EN COURS** |
| **Phase 4** | 8 jours | 07/11 - 21/11/2025 | Tests et déploiement | ⏳ **EN ATTENTE** |

> **État actuel** : Phase 3 - Développement du frontend (Sprint 4 en cours)

## 📊 État d'avancement actuel

### ✅ **Réalisations accomplies**

#### **Phase 1 - Conception (100% terminée)**
- ✅ Architecture multi-tenant définie
- ✅ Modèle de données complet (33 entités)
- ✅ Charte graphique Impact Auto
- ✅ Documentation technique complète
- ✅ Planning détaillé du projet

#### **Phase 2 - Backend (100% terminée)**
- ✅ **Sprint 1** : Infrastructure et entités de base (100%)
- ✅ **Sprint 2** : Système d'intervention (100%)
- ✅ **Sprint 3** : Fournitures et pièces jointes (100%)

#### **Entités développées (40/40)**
- ✅ **Multi-tenancy** : Tenant, CollaborateurTenant (relation many-to-many)
- ✅ **Véhicules** : Brand, Model, VehicleCategory, FuelType, VehicleColor, Vehicle, VehicleAssignment
- ✅ **Conducteurs** : Driver, LicenseType
- ✅ **Interventions** : VehicleIntervention, InterventionStatus, InterventionPrediagnostic, InterventionPrediagnosticItem
- ✅ **Documents** : InterventionQuote, InterventionWorkAuthorization, InterventionFieldVerification, InterventionReceptionReport, InterventionInvoice
- ✅ **Lignes** : InterventionQuoteLine, InterventionWorkAuthorizationLine, InterventionInvoiceLine
- ✅ **Fournitures** : SupplyCategory, Supplier, Supply, InterventionSupply
- ✅ **Pièces jointes** : Attachment, HasAttachments trait
- ✅ **Collaborateurs** : Collaborateur (7 rôles), CollaborateurTenant (affectation multi-tenants)
- ✅ **Garages** : Garage
- ✅ **Assurances** : VehicleInsurance, VehicleMaintenance, VehicleFuelLog
- ✅ **Système** : User, UserSession, UserTenantPermission, SystemParameter, EntityCode, CodeFormat
- ✅ **Alertes** : Alert, ActionLog

#### **Services développés (8/8)**
- ✅ **TenantContextService** : Gestion du contexte multi-tenant
- ✅ **TenantAccessService** : Contrôle d'accès aux ressources par tenant
- ✅ **ActionLogService** : Journalisation des actions utilisateur
- ✅ **AlertService** : Gestion des alertes et notifications
- ✅ **CodeGenerationService** : Génération de codes uniques
- ✅ **LogoService** : Gestion des logos des tenants
- ✅ **ParameterService** : Gestion des paramètres système
- ✅ **NotificationService** : Service de notifications

#### **Contrôleurs développés (24/24)**
- ✅ **AuthController** : Authentification et autorisation
- ✅ **TenantController** : Gestion des tenants
- ✅ **UserController** : Gestion des utilisateurs
- ✅ **VehicleController** : Gestion des véhicules
- ✅ **DriverController** : Gestion des conducteurs
- ✅ **InterventionController** : Gestion des interventions
- ✅ **InterventionPrediagnosticController** : Prédiagnostics
- ✅ **InterventionQuoteController** : Devis d'intervention
- ✅ **InterventionWorkAuthorizationController** : Autorisations de travaux
- ✅ **InterventionInvoiceController** : Factures d'intervention
- ✅ **AttachmentController** : Gestion des pièces jointes
- ✅ **SupplyController** : Gestion des fournitures
- ✅ **SupplyCategoryController** : Catégories de fournitures
- ✅ **SupplierController** : Gestion des fournisseurs
- ✅ **GarageController** : Gestion des garages
- ✅ **ParameterController** : Paramètres système
- ✅ **ReferenceDataController** : Données de référence
- ✅ **LogoController** : Gestion des logos
- ✅ **AlertController** : Gestion des alertes
- ✅ **VehicleMaintenanceController** : Maintenance véhicules
- ✅ **VehicleInsuranceController** : Assurances véhicules
- ✅ **VehicleFuelLogController** : Carnet de carburant
- ✅ **CollaborateurController** : Gestion des collaborateurs
- ✅ **TenantTestController** : Tests multi-tenant

#### **Technologies utilisées**
- ✅ **Backend** : Symfony 6.4, Doctrine ORM 3.5, JWT Authentication
- ✅ **Frontend** : Vue.js 2.6, Buefy UI
- ✅ **Base de données** : MySQL/MariaDB avec migrations Doctrine
- ✅ **Sécurité** : LexikJWTAuthenticationBundle, CORS, validation Symfony
- ✅ **Développement** : Composer, Symfony CLI, migrations automatiques

#### **Documentation créée**
- ✅ Documentation technique (1344 lignes) - Mise à jour avec Symfony 6.4
- ✅ Documentation technique HTML (1200+ lignes) - Version PDF-like
- ✅ Planning projet (500+ lignes) - Mise à jour complète
- ✅ Charte graphique HTML
- ✅ Exemples d'utilisation (10 fichiers)
- ✅ Architecture multi-database
- ✅ Système de connexion multi-tenant
- ✅ Intégration complète

---

## Phase 1 : Collecte des exigences et conception (18 jours) ✅ **TERMINÉE**
**Période : 09/08/2025 - 30/08/2025**

> **Impact Auto** - Transformation de FileGator en système de gestion de parc automobile multi-tenant

### Semaine 1 (09/08 - 15/08/2025)

#### Jour 1-2 (09-10/08) : Analyse des besoins ✅
- [x] **Réunion de lancement** avec le client
- [x] **Collecte des exigences fonctionnelles**
  - Gestion des véhicules
  - Gestion des conducteurs
  - Workflow d'intervention
  - Système de pièces jointes
  - Rapports et statistiques
- [x] **Collecte des exigences non-fonctionnelles**
  - Performance
  - Sécurité
  - Scalabilité
  - Multi-tenancy
- [x] **Documentation des cas d'usage**

#### Jour 3-4 (11-12/08) : Analyse technique ✅
- [x] **Audit de l'existant FileGator**
- [x] **Analyse des technologies**
- [x] **Évaluation des contraintes techniques**
- [x] **Définition de l'architecture multi-tenant pour Impact Auto**

#### Jour 5 (13/08) : Conception de l'architecture ✅
- [x] **Diagramme d'architecture globale**
- [x] **Modèle de données conceptuel**
- [x] **Définition des services et APIs pour Impact Auto**
- [x] **Architecture de sécurité**

#### Jour 6-7 (14-15/08) : Spécifications détaillées ✅
- [x] **Spécifications fonctionnelles détaillées**
- [x] **User stories et critères d'acceptation**
- [x] **Maquettes des interfaces principales**
- [x] **Définition des APIs REST**

### Semaine 2 (16/08 - 22/08/2025)

#### Jour 8-9 (16-17/08) : Modélisation des données ✅
- [x] **Modèle de données logique**
- [x] **Définition des entités et relations**
- [x] **Normalisation de la base de données**
- [x] **Définition des index et contraintes**

#### Jour 10-11 (18-19/08) : Conception des interfaces ✅
- [x] **Wireframes des écrans principaux**
- [x] **Design system et composants UI**
- [x] **Responsive design**
- [x] **Accessibilité (WCAG 2.1)**

#### Jour 12 (20/08) : Architecture technique ✅
- [x] **Diagramme de déploiement**
- [x] **Architecture des microservices**
- [x] **Stratégie de cache**
- [x] **Monitoring et logging**

#### Jour 13-14 (21-22/08) : Planification détaillée ✅
- [x] **Décomposition en tâches techniques**
- [x] **Estimation des charges de travail**
- [x] **Planification des sprints**
- [x] **Définition des livrables**

### Semaine 3 (23/08 - 30/08/2025)

#### Jour 15-16 (23-24/08) : Validation avec le client
- [x] **Présentation de l'architecture**
- [x] **Validation des maquettes**
- [x] **Ajustements des spécifications**
- [x] **Validation du planning**

#### Jour 17-18 (25-26/08) : Préparation technique
- [x] **Setup de l'environnement de développement**
- [x] **Configuration des outils de CI/CD**
- [x] **Création des repositories Git**
- [x] **Définition des standards de code**

#### Jour 19-21 (27-29/08) : Documentation
- [x] **Documentation technique complète**
- [x] **Guide d'installation**
- [x] **Documentation API**
- [x] **Manuel utilisateur (v1)**

#### Jour 22 (30/08) : Revue de phase
- [x] **Revue de la phase 1**
- [x] **Validation des livrables**
- [x] **Préparation de la phase 2**
- [x] **Go/No-go pour le développement**

---

## Phase 2 : Développement du backend (28 jours) 🔄 **EN COURS**
**Période : 02/09/2025 - 09/10/2025**

> **État actuel** : Sprint 1-2 en cours - Entités et services développés

### Sprint 1 (02/09 - 13/09/2025) - Infrastructure et entités de base

#### Jour 23-24 (02-03/09) : Setup et infrastructure ✅
- [x] **Configuration de l'environnement de développement**
- [x] **Installation et configuration de FileGator**
- [x] **Setup de la base de données multi-tenant**
- [x] **Configuration des outils de développement**

#### Jour 25-27 (04-06/09) : Entités de base ✅
- [x] **Développement de l'entité Tenant**
- [x] **Développement de l'entité Brand**
- [x] **Développement de l'entité Model**
- [x] **Développement de l'entité VehicleCategory**
- [x] **Développement de l'entité FuelType**

#### Jour 28-30 (07-09/09) : Entités véhicules ✅
- [x] **Développement de l'entité VehicleColor**
- [x] **Développement de l'entité Vehicle**
- [x] **Développement de l'entité Driver**
- [x] **Développement de l'entité LicenseType**
- [x] **Développement de l'entité VehicleAssignment**

#### Jour 31-32 (10-11/09) : Relations et validations ✅
- [x] **Mise en place des relations entre entités**
- [x] **Validation des contraintes métier**
- [x] **Tests unitaires des entités**
- [x] **Documentation des modèles**

#### Jour 33-34 (12-13/09) : APIs de base 🔄
- [x] **API CRUD pour les véhicules**
- [x] **API CRUD pour les conducteurs**
- [x] **API CRUD pour les marques/modèles**
- [x] **Gestion des erreurs et validation**

### Sprint 2 (16/09 - 27/09/2025) - Système d'intervention

#### Jour 35-37 (16-18/09) : Workflow d'intervention ✅
- [x] **Développement de l'entité VehicleIntervention**
- [x] **Développement de l'entité InterventionStatus**
- [x] **Développement de l'entité InterventionPrediagnostic**
- [x] **Développement de l'entité InterventionPrediagnosticItem**

#### Jour 38-40 (19-21/09) : Documents d'intervention ✅
- [x] **Développement de l'entité InterventionQuote**
- [x] **Développement de l'entité InterventionWorkAuthorization**
- [x] **Développement de l'entité InterventionFieldVerification**
- [x] **Développement de l'entité InterventionReceptionReport**

#### Jour 41-43 (22-24/09) : Facturation et lignes ✅
- [x] **Développement de l'entité InterventionInvoice**
- [x] **Développement des entités de lignes (QuoteLine, AuthorizationLine, InvoiceLine)**
- [x] **Logique de calcul des totaux**
- [x] **Gestion des taxes et remises**

#### Jour 44-46 (25-27/09) : APIs d'intervention 🔄
- [x] **API pour la gestion des interventions**
- [x] **API pour le workflow d'intervention**
- [x] **API pour les documents d'intervention**
- [x] **Tests d'intégration**

### Sprint 3 (30/09 - 09/10/2025) - Fournitures et pièces jointes

#### Jour 47-49 (30/09 - 02/10) : Gestion des fournitures ✅
- [x] **Développement de l'entité SupplyCategory**
- [x] **Développement de l'entité Supplier**
- [x] **Développement de l'entité Supply**
- [x] **Développement de l'entité InterventionSupply**

#### Jour 50-52 (03-05/10) : Système de pièces jointes ✅
- [x] **Développement de l'entité Attachment**
- [x] **Développement du trait HasAttachments**
- [x] **Service de gestion des fichiers**
- [x] **Validation et sécurité des uploads**

#### Jour 53-55 (06-08/10) : APIs avancées 🔄
- [x] **API pour la gestion des fournitures**
- [x] **API pour les pièces jointes**
- [x] **API de reporting et statistiques**
- [x] **API de recherche et filtrage**

#### Jour 56 (09/10) : Tests et optimisation
- [x] **Tests de performance**
- [x] **Optimisation des requêtes**
- [x] **Tests de sécurité**
- [x] **Documentation API complète**

---

## 🎯 **Prochaines étapes prioritaires**

### **Phase 3 - Développement Frontend (70% restant)**
1. **Sprint 4** (10/10 - 17/10/2025) - Interface de base ✅ **EN COURS**
   - ✅ Setup frontend Vue.js et Buefy
   - ✅ Authentification et navigation
   - 🔄 Gestion des véhicules
   - 🔄 Interface responsive

2. **Sprint 5** (18/10 - 25/10/2025) - Gestion des conducteurs et interventions
   - Gestion des conducteurs
   - Interface d'intervention
   - Documents d'intervention
   - Workflow utilisateur

3. **Sprint 6** (27/10 - 06/11/2025) - Fonctionnalités avancées
   - Fournitures et stock
   - Rapports et statistiques
   - Pièces jointes et médias
   - Finalisation frontend

### **Phase 2 - Finalisation Backend (15% restant)**
1. **Tests et optimisation** (En parallèle)
   - Tests de performance complets
   - Optimisation des requêtes SQL
   - Tests de sécurité et validation
   - Documentation API finale

### **Phase 4 - Tests et déploiement (07/11 - 21/11/2025)**
1. Tests d'intégration complets
2. Tests utilisateur avec le client
3. Déploiement en production
4. Formation des utilisateurs
5. Documentation finale et clôture

---

## 📈 **Métriques de progression**

| Composant | Progression | État |
|-----------|-------------|------|
| **Architecture** | 100% | ✅ Terminé |
| **Modèle de données** | 100% | ✅ Terminé |
| **Entités Backend** | 100% | ✅ Terminé |
| **Services Backend** | 100% | ✅ Terminé |
| **APIs Backend** | 100% | ✅ Terminé |
| **Tests Backend** | 85% | 🔄 En cours |
| **Documentation** | 100% | ✅ Terminé |
| **Frontend** | 30% | 🔄 En cours |
| **Tests Frontend** | 0% | ⏳ En attente |
| **Déploiement** | 0% | ⏳ En attente |

**Progression globale du projet : 75%**

---

## Phase 3 : Développement du frontend (20 jours)
**Période : 10/10/2025 - 06/11/2025**

### Sprint 4 (10/10 - 17/10/2025) - Interface de base

#### Jour 57-58 (10-11/10) : Setup frontend
- [ ] **Configuration de Vue.js et Buefy**
- [ ] **Structure des composants**
- [ ] **Configuration du routing**
- [ ] **Setup des services API**

#### Jour 59-61 (12-14/10) : Authentification et navigation
- [ ] **Page de connexion**
- [ ] **Système d'authentification**
- [ ] **Menu de navigation principal**
- [ ] **Gestion des rôles et permissions**

#### Jour 62-64 (15-17/10) : Gestion des véhicules
- [ ] **Liste des véhicules**
- [ ] **Formulaire d'ajout/modification véhicule**
- [ ] **Détails d'un véhicule**
- [ ] **Gestion des pièces jointes véhicule**

### Sprint 5 (18/10 - 25/10/2025) - Gestion des conducteurs et interventions

#### Jour 65-67 (18-20/10) : Gestion des conducteurs
- [ ] **Liste des conducteurs**
- [ ] **Formulaire conducteur**
- [ ] **Gestion des permis de conduire**
- [ ] **Affectation véhicule-conducteur**

#### Jour 68-70 (21-23/10) : Interface d'intervention
- [ ] **Liste des interventions**
- [ ] **Création d'intervention**
- [ ] **Workflow d'intervention**
- [ ] **Gestion des statuts**

#### Jour 71-73 (24-26/10) : Documents d'intervention
- [ ] **Interface de prédiagnostic**
- [ ] **Gestion des devis**
- [ ] **Autorisation de travaux**
- [ ] **Rapports et factures**

### Sprint 6 (27/10 - 06/11/2025) - Fonctionnalités avancées

#### Jour 74-76 (27-29/10) : Fournitures et stock
- [ ] **Gestion des fournitures**
- [ ] **Gestion des fournisseurs**
- [ ] **Suivi du stock**
- [ ] **Utilisation dans les interventions**

#### Jour 77-79 (30/10 - 01/11) : Rapports et statistiques
- [ ] **Tableaux de bord**
- [ ] **Rapports d'intervention**
- [ ] **Statistiques de parc**
- [ ] **Export des données**

#### Jour 80-82 (02-04/11) : Pièces jointes et médias
- [ ] **Upload de fichiers**
- [ ] **Galerie d'images**
- [ ] **Prévisualisation de documents**
- [ ] **Gestion des permissions fichiers**

#### Jour 83-84 (05-06/11) : Finalisation frontend
- [ ] **Tests d'interface utilisateur**
- [ ] **Optimisation des performances**
- [ ] **Responsive design final**
- [ ] **Accessibilité**

---

## Phase 4 : Tests et déploiement (8 jours)
**Période : 07/11/2025 - 21/11/2025**

### Semaine 1 (07/11 - 14/11/2025)

#### Jour 85-87 (07-09/11) : Tests intégration
- [ ] **Tests d'intégration complets**
- [ ] **Tests de performance**
- [ ] **Tests de sécurité**
- [ ] **Tests de charge**

#### Jour 88-90 (10-12/11) : Tests utilisateur
- [ ] **Tests utilisateur avec le client**
- [ ] **Correction des bugs critiques**
- [ ] **Ajustements d'interface**
- [ ] **Validation des fonctionnalités**

#### Jour 91-92 (13-14/11) : Préparation déploiement
- [ ] **Configuration de production**
- [ ] **Migration des données**
- [ ] **Tests en environnement de production**
- [ ] **Documentation de déploiement**

### Semaine 2 (15/11 - 21/11/2025)

#### Jour 93-95 (15-17/11) : Déploiement
- [ ] **Déploiement en production**
- [ ] **Configuration des serveurs**
- [ ] **Mise en place du monitoring**
- [ ] **Tests post-déploiement**

#### Jour 96-98 (18-20/11) : Formation et documentation
- [ ] **Formation des utilisateurs**
- [ ] **Documentation utilisateur finale**
- [ ] **Support technique initial**
- [ ] **Handover au client**

#### Jour 99-100 (21/11) : Clôture
- [ ] **Revue de projet**
- [ ] **Livraison finale**
- [ ] **Plan de maintenance**
- [ ] **Clôture du projet**

---

## Livrables par phase

### Phase 1 - Collecte des exigences et conception
- [ ] **Document d'architecture technique**
- [ ] **Spécifications fonctionnelles détaillées**
- [ ] **Maquettes des interfaces**
- [ ] **Modèle de données**
- [ ] **Plan de test**

### Phase 2 - Développement du backend
- [ ] **API REST complète**
- [ ] **Base de données multi-tenant**
- [ ] **Services métier**
- [ ] **Documentation API**
- [ ] **Tests unitaires et d'intégration**

### Phase 3 - Développement du frontend
- [ ] **Interface utilisateur complète**
- [ ] **Application Vue.js responsive**
- [ ] **Intégration avec les APIs**
- [ ] **Tests d'interface utilisateur**

### Phase 4 - Tests et déploiement
- [ ] **Application en production**
- [ ] **Documentation utilisateur**
- [ ] **Formation des utilisateurs**
- [ ] **Plan de maintenance**

---

## Risques et mitigation

### Risques techniques
- **Complexité multi-tenant** : POC précoce et architecture bien définie
- **Performance** : Tests de charge réguliers et optimisation continue
- **Sécurité** : Audit de sécurité et tests de pénétration

### Risques de planning
- **Retard sur les spécifications** : Buffer de 2 jours en phase 1
- **Complexité des intégrations** : Sprints de 2 semaines pour ajustements
- **Tests utilisateur** : Implication du client dès la phase 1

### Risques de ressources
- **Disponibilité de l'équipe** : Planning flexible et ressources de backup
- **Expertise technique** : Formation préalable et documentation

---

## Métriques de suivi

### Indicateurs de progression
- **Vélocité des sprints** : Points d'effort par sprint
- **Taux de bugs** : Nombre de bugs par sprint
- **Couverture de tests** : Pourcentage de code testé
- **Satisfaction client** : Score de satisfaction par phase

### Points de contrôle
- **Fin de chaque sprint** : Revue de sprint et ajustements
- **Fin de chaque phase** : Validation des livrables
- **Milestones critiques** : Go/No-go pour les phases suivantes

---

## Communication et reporting

### Réunions régulières
- **Daily standup** : 15 min chaque matin
- **Revue de sprint** : 2h à la fin de chaque sprint
- **Rétrospective** : 1h après chaque sprint
- **Revue de phase** : 4h à la fin de chaque phase

### Reporting
- **Rapport hebdomadaire** : État d'avancement et risques
- **Dashboard projet** : Métriques en temps réel
- **Revue mensuelle** : Présentation au client

---

## Conclusion

Ce planning de 74 jours permet de livrer un système de gestion de parc automobile multi-tenant complet et fonctionnel. La répartition en 4 phases distinctes assure une progression maîtrisée et des points de validation réguliers avec le client.

**Points clés de succès :**
- Implication du client dès la phase 1
- Tests continus tout au long du développement
- Flexibilité pour s'adapter aux retours
- Documentation complète à chaque étape
