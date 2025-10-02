# Workflow des Interventions

## Vue d'ensemble

Le workflow d'une intervention suit un processus séquentiel avec 10 étapes principales, de la signalisation initiale jusqu'à la réception du véhicule.

## Étapes du workflow

### 1. **Signalé** (`reported`)
- **Description** : L'intervention est signalée/rapportée
- **Action** : Création initiale de l'intervention
- **Responsable** : Client/Assuré ou Agent

### 2. **En prédiagnostique** (`in_prediagnostic`)
- **Description** : L'intervention est en cours de prédiagnostic
- **Action** : Création d'un prédiagnostic
- **Responsable** : Expert/Technicien

### 3. **Prédiagnostique terminé** (`prediagnostic_completed`)
- **Description** : Le prédiagnostic est terminé
- **Action** : Validation du prédiagnostic
- **Responsable** : Expert

### 4. **En devis** (`in_quote`)
- **Description** : L'intervention est en cours de devis
- **Action** : Demande de devis aux réparateurs
- **Responsable** : Équipe commerciale

### 5. **Devis reçu** (`quote_received`)
- **Description** : Le(s) devis ont été reçus
- **Action** : Réception et analyse des devis
- **Responsable** : Équipe commerciale

### 6. **En accord** (`in_approval`)
- **Description** : L'intervention est en attente d'accord
- **Action** : Validation par l'assureur/client
- **Responsable** : Assureur/Client

### 7. **Accord donné** (`approved`)
- **Description** : L'accord a été donné
- **Action** : Autorisation de réparation
- **Responsable** : Assureur/Client

### 8. **En réparation** (`in_repair`)
- **Description** : Le véhicule est en cours de réparation
- **Action** : Réparation par le garage
- **Responsable** : Garage/Réparateur

### 9. **Réparation terminée** (`repair_completed`)
- **Description** : La réparation est terminée
- **Action** : Finalisation des travaux
- **Responsable** : Garage

### 10. **En réception** (`in_reception`)
- **Description** : Le véhicule est en attente de réception
- **Action** : Contrôle qualité
- **Responsable** : Expert/Contrôleur

### 11. **Véhicule reçu** (`vehicle_received`)
- **Description** : Le véhicule a été réceptionné
- **Action** : Remise au client
- **Responsable** : Client

## États possibles

### États terminaux
- ✅ **Véhicule reçu** : Processus terminé avec succès
- ❌ **Annulé** (`cancelled`) : Intervention annulée à n'importe quelle étape

### États de blocage
- ⚠️ **En attente** (`pending`) : En attente d'action externe
- 🔄 **En cours** (`in_progress`) : Traitement en cours

## Transitions autorisées

```
Signalé → En prédiagnostique
En prédiagnostique → Prédiagnostique terminé
Prédiagnostique terminé → En devis
En devis → Devis reçu
Devis reçu → En accord
En accord → Accord donné
Accord donné → En réparation
En réparation → Réparation terminée
Réparation terminée → En réception
En réception → Véhicule reçu

// Transitions de sortie (à tout moment)
[N'importe quel état] → Annulé
```

## Implémentation technique

### Base de données
```sql
-- Table des statuts d'intervention
CREATE TABLE intervention_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    label_fr VARCHAR(100) NOT NULL,
    label_en VARCHAR(100),
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_terminal BOOLEAN DEFAULT FALSE
);

-- Données initiales
INSERT INTO intervention_statuses (code, label_fr, order_index) VALUES
('reported', 'Signalé', 1),
('in_prediagnostic', 'En prédiagnostique', 2),
('prediagnostic_completed', 'Prédiagnostique terminé', 3),
('in_quote', 'En devis', 4),
('quote_received', 'Devis reçu', 5),
('in_approval', 'En accord', 6),
('approved', 'Accord donné', 7),
('in_repair', 'En réparation', 8),
('repair_completed', 'Réparation terminée', 9),
('in_reception', 'En réception', 10),
('vehicle_received', 'Véhicule reçu', 11),
('cancelled', 'Annulé', 99);
```

### Frontend
- **Indicateur de progression** : Barre de progression avec étapes
- **Statuts visuels** : Couleurs et icônes pour chaque étape
- **Actions contextuelles** : Boutons d'action selon le statut actuel
- **Historique** : Log des changements de statut avec dates et responsables

### Backend
- **Validation des transitions** : Vérification que les transitions sont autorisées
- **Audit trail** : Enregistrement de tous les changements de statut
- **Notifications** : Alertes lors des changements de statut
- **Permissions** : Contrôle d'accès selon le statut et le rôle

## Exemples d'utilisation

### Workflow typique
1. **Client** signale un sinistre → Statut : `Signalé`
2. **Expert** fait le prédiagnostic → Statut : `En prédiagnostique`
3. **Expert** valide le prédiagnostic → Statut : `Prédiagnostique terminé`
4. **Commercial** demande des devis → Statut : `En devis`
5. **Garages** envoient leurs devis → Statut : `Devis reçu`
6. **Assureur** valide le devis → Statut : `En accord`
7. **Assureur** donne son accord → Statut : `Accord donné`
8. **Garage** répare le véhicule → Statut : `En réparation`
9. **Garage** termine la réparation → Statut : `Réparation terminée`
10. **Expert** contrôle la réparation → Statut : `En réception`
11. **Client** récupère le véhicule → Statut : `Véhicule reçu`

### Workflow avec blocage
1. **Client** signale un sinistre → Statut : `Signalé`
2. **Expert** fait le prédiagnostic → Statut : `En prédiagnostique`
3. **Expert** valide le prédiagnostic → Statut : `Prédiagnostique terminé`
4. **Commercial** demande des devis → Statut : `En devis`
5. **Garages** tardent à répondre → Statut : `En devis` (bloqué)
6. **Commercial** relance les garages → Statut : `En devis`
7. **Garages** envoient leurs devis → Statut : `Devis reçu`
8. ... (suite du workflow)

## Métriques et reporting

### KPIs par étape
- **Temps moyen** par étape
- **Taux de blocage** par étape
- **Responsables** les plus/moins performants
- **Garages** les plus/moins rapides

### Alertes
- **Délais dépassés** : Intervention bloquée trop longtemps
- **Responsables inactifs** : Aucune action depuis X jours
- **Garages en retard** : Devis non reçus dans les délais
