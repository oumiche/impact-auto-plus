# Documentation Technique - Impact Auto

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Modèle de données](#modèle-de-données)
4. [Entités principales](#entités-principales)
5. [Système de pièces jointes](#système-de-pièces-jointes)
6. [Workflow d'intervention](#workflow-dintervention)
7. [API et services](#api-et-services)
8. [Sécurité et authentification](#sécurité-et-authentification)
9. [Base de données](#base-de-données)
10. [Installation et configuration](#installation-et-configuration)
11. [Exemples d'utilisation](#exemples-dutilisation)

---

## Vue d'ensemble

### Description du projet

**Impact Auto** transforme FileGator en une application complète de gestion de parc automobile multi-tenant. Il permet aux gestionnaires de parc de suivre leurs véhicules, conducteurs, interventions techniques et maintenance de manière centralisée et sécurisée.

### Fonctionnalités principales

- **Gestion multi-tenant** : Isolation complète des données par client
- **Gestion de parc automobile** : Véhicules, conducteurs, affectations
- **Workflow d'intervention** : Suivi complet des réparations et maintenance
- **Système de pièces jointes** : Documents, photos, rapports
- **Gestion des fournitures** : Pièces détachées, stock, fournisseurs
- **Rapports et statistiques** : Tableaux de bord et analyses

### Technologies utilisées

**Impact Auto** utilise les technologies suivantes :
- **Backend** : PHP 8.1+, Symfony 6.4, Doctrine ORM 3.5
- **Frontend** : Vue.js 2.6, Buefy UI
- **Base de données** : MySQL/MariaDB avec Doctrine DBAL
- **Architecture** : Symfony MVC, Multi-tenant, REST API
- **Authentification** : JWT (LexikJWTAuthenticationBundle)
- **Sérialisation** : Symfony Serializer avec groupes
- **CORS** : NelmioCorsBundle

---

## Architecture du système

### Structure des dossiers

```
filegator/
├── api/                       # Backend Symfony
│   ├── src/
│   │   ├── Entity/            # Entités Doctrine ORM
│   │   ├── Controller/        # Contrôleurs API REST
│   │   ├── Service/           # Services métier
│   │   ├── Repository/        # Repositories Doctrine
│   │   ├── Security/          # Sécurité et authentification
│   │   ├── Middleware/        # Middlewares personnalisés
│   │   ├── Trait/             # Traits réutilisables
│   │   └── Command/           # Commandes console
│   ├── config/                # Configuration Symfony
│   ├── migrations/            # Migrations Doctrine
│   ├── public/                # Point d'entrée web
│   └── composer.json          # Dépendances PHP
├── dist/                      # Frontend compilé
├── src/                       # Sources frontend Vue.js
└── index.php                  # Point d'entrée principal
```

### Architecture multi-tenant

Le système utilise une approche **shared database, shared schema** avec isolation par `tenant_id` :

- Chaque entité contient un `tenant_id`
- Isolation des données au niveau application
- Configuration par tenant possible
- Sécurité renforcée par middleware

---

## Modèle de données

### Relations multi-tenants

#### **Collaborateur ↔ Tenant (Many-to-Many)**
Un collaborateur peut être affecté à plusieurs tenants avec des rôles et permissions différents :

```php
// Entité CollaborateurTenant
class CollaborateurTenant
{
    protected $collaborateur_id;
    protected $tenant_id;
    protected $role;              // Rôle spécifique dans ce tenant
    protected $permissions;       // Permissions JSON spécifiques
    protected $is_primary;        // Tenant principal
    protected $assigned_at;       // Date d'affectation
    protected $is_active;         // Affectation active
}
```

**Avantages :**
- **Flexibilité** : Un expert peut travailler pour plusieurs clients
- **Spécialisation** : Rôles différents selon le tenant
- **Optimisation** : Partage d'expertise entre clients
- **Sécurité** : Permissions granulaires par tenant

### Entités principales

#### 1. Tenant (Client)
```php
#[ORM\Entity]
#[ORM\Table(name: 'tenants')]
class Tenant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;           // Nom de l'entreprise

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $slug;           // Identifiant unique

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $logoPath = null;

    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    private ?string $logoUrl = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isActive = true;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;
}
```

#### 2. Vehicle (Véhicule)
```php
#[ORM\Entity(repositoryClass: VehicleRepository::class)]
#[ORM\Table(name: 'vehicles')]
class Vehicle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tenant $tenant = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $plateNumber;   // Numéro d'immatriculation

    #[ORM\ManyToOne(targetEntity: Brand::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Brand $brand = null;

    #[ORM\ManyToOne(targetEntity: Model::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Model $model = null;

    #[ORM\ManyToOne(targetEntity: VehicleColor::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?VehicleColor $color = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $year = null;     // Année de fabrication

    #[ORM\Column(type: 'string', length: 17, nullable: true)]
    private ?string $vin = null;   // Numéro de série

    #[ORM\Column(type: 'integer')]
    private int $mileage = 0;      // Kilométrage

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = 'active';  // Statut du véhicule

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $lastMaintenance = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $nextService = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $purchaseDate = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $purchasePrice = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $insuranceExpiry = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $technicalInspectionExpiry = null;

    #[ORM\OneToMany(mappedBy: 'vehicle', targetEntity: VehicleMaintenance::class, cascade: ['persist'])]
    private Collection $maintenances;

    #[ORM\OneToMany(mappedBy: 'vehicle', targetEntity: VehicleInsurance::class, cascade: ['persist'])]
    private Collection $insurances;

    #[ORM\OneToMany(mappedBy: 'vehicle', targetEntity: VehicleFuelLog::class, cascade: ['persist'])]
    private Collection $fuelLogs;
}
```

#### 3. Driver (Conducteur)
```php
class Driver
{
    protected $id;
    protected $tenant_id;
    protected $first_name;
    protected $last_name;
    protected $email;
    protected $phone;
    protected $license_number;     // Numéro de permis
    protected $license_type_id;    // Relation vers LicenseType
    protected $license_expiry_date;
    protected $date_of_birth;
    protected $address;
    protected $emergency_contact_name;
    protected $emergency_contact_phone;
    protected $status;             // active, inactive, suspended, terminated
}
```

#### 4. VehicleIntervention (Intervention véhicule)
```php
class VehicleIntervention
{
    protected $id;
    protected $tenant_id;
    protected $vehicle_id;         // Véhicule concerné
    protected $driver_id;          // Conducteur (optionnel)
    protected $garage_id;          // Garage (optionnel)
    protected $intervention_number;
    protected $title;
    protected $description;
    protected $problem_type;       // breakdown, maintenance, accident, inspection
    protected $priority;           // low, medium, high, urgent
    protected $current_status_id;  // Statut actuel
    protected $reported_by;        // Qui a signalé
    protected $assigned_to;        // À qui c'est assigné
    protected $estimated_cost;
    protected $final_cost;
    protected $estimated_duration_days;
    protected $actual_duration_days;
    protected $reported_date;
    protected $started_date;
    protected $completed_date;
    protected $closed_date;
}
```

### Entités de référence

#### Brand (Marque)
```php
class Brand
{
    protected $id;
    protected $name;           // Peugeot, Renault, etc.
    protected $logo_url;       // URL du logo
    protected $country;        // Pays d'origine
    protected $created_at;
}
```

#### Model (Modèle)
```php
class Model
{
    protected $id;
    protected $brand_id;       // Relation vers Brand
    protected $category_id;    // Relation vers VehicleCategory
    protected $fuel_type_id;   // Relation vers FuelType
    protected $name;           // 308, Clio, etc.
    protected $engine_size;    // 1.6L
    protected $power_hp;       // Puissance en CV
    protected $created_at;
}
```

#### LicenseType (Type de permis)
```php
class LicenseType
{
    protected $id;
    protected $tenant_id;
    protected $code;               // B, C, D, etc.
    protected $name;               // Permis B, Permis C, etc.
    protected $description;
    protected $category;           // standard, professional, specialized, international
    protected $min_age;           // Âge minimum
    protected $max_age;           // Âge maximum
    protected $validity_years;    // Durée de validité
    protected $is_required_for_vehicles;
    protected $vehicle_categories; // JSON des catégories autorisées
}
```

#### 4. VehicleMaintenance (Maintenance véhicule)
```php
#[ORM\Entity]
#[ORM\Table(name: 'vehicle_maintenances')]
class VehicleMaintenance
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class, inversedBy: 'maintenances')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Vehicle $vehicle = null;

    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $maintenanceDate = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $type;           // Type de maintenance

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $cost = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $mileageAtMaintenance = null;

    #[ORM\ManyToOne(targetEntity: Garage::class)]
    private ?Garage $garage = null;
}
```

#### 5. VehicleInsurance (Assurance véhicule)
```php
#[ORM\Entity]
#[ORM\Table(name: 'vehicle_insurances')]
class VehicleInsurance
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class, inversedBy: 'insurances')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Vehicle $vehicle = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $insuranceCompany;

    #[ORM\Column(type: 'string', length: 100)]
    private string $policyNumber;

    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $premium = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $coverage = null;
}
```

#### 6. VehicleFuelLog (Carnet de carburant)
```php
#[ORM\Entity]
#[ORM\Table(name: 'vehicle_fuel_logs')]
class VehicleFuelLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class, inversedBy: 'fuelLogs')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Vehicle $vehicle = null;

    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $fuelDate = null;

    #[ORM\Column(type: 'decimal', precision: 8, scale: 2)]
    private string $quantity;       // Quantité en litres

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $pricePerLiter;  // Prix au litre

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $totalCost;      // Coût total

    #[ORM\Column(type: 'integer')]
    private int $mileage;           // Kilométrage au moment du plein

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $station = null; // Station-service
}
```

---

## Système de pièces jointes

### Entité Attachment

```php
#[ORM\Entity(repositoryClass: AttachmentRepository::class)]
#[ORM\Table(name: 'attachments')]
class Attachment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['attachment:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['attachment:read'])]
    private ?Tenant $tenant = null;

    #[ORM\Column(length: 50)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $entityType = null;        // intervention, prediagnostic, vehicle, driver

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?int $entityId = null;             // ID de l'entité parente

    #[ORM\Column(length: 255)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $fileName = null;          // Nom du fichier stocké

    #[ORM\Column(length: 255)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $originalName = null;      // Nom original

    #[ORM\Column(length: 500)]
    #[Groups(['attachment:read'])]
    private ?string $filePath = null;          // Chemin complet

    #[ORM\Column(type: Types::BIGINT)]
    #[Groups(['attachment:read'])]
    private ?string $fileSize = null;          // Taille en octets

    #[ORM\Column(length: 100)]
    #[Groups(['attachment:read'])]
    private ?string $mimeType = null;          // Type MIME

    #[ORM\Column(length: 10)]
    #[Groups(['attachment:read'])]
    private ?string $fileExtension = null;     // Extension

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $description = null;       // Description

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['attachment:read'])]
    private ?User $uploadedBy = null;          // Utilisateur qui a uploadé

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['attachment:read'])]
    private ?\DateTimeInterface $uploadedAt = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private bool $isPublic = false;            // Fichier public/privé

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['attachment:read'])]
    private ?int $downloadCount = 0;           // Nombre de téléchargements

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['attachment:read'])]
    private ?\DateTimeInterface $lastDownloadedAt = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?array $metadata = null;           // Métadonnées JSON

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private bool $isActive = true;
}
```

### Trait HasAttachments

Trait réutilisable pour toutes les entités supportant les pièces jointes :

```php
trait HasAttachments
{
    public function canHaveAttachments(): bool
    public function getAttachmentsEntityType(): string
    public function getAttachmentsEntityId(): int
    public function createAttachment(array $fileData, int $uploadedBy, string $description = null): Attachment
    public function validateAttachment(array $fileData): array
    public function getAttachmentConfig(): array
}
```

### Configuration par entité

Chaque entité peut personnaliser sa configuration :

```php
// VehicleIntervention
public function getAttachmentCategories(): array
{
    return [
        'photos' => 'Photos de l\'intervention',
        'documents' => 'Documents officiels',
        'reports' => 'Rapports techniques',
        'invoices' => 'Factures et devis',
        'other' => 'Autres fichiers'
    ];
}

public function getMaxAttachmentSize(): int
{
    return 10 * 1024 * 1024; // 10 MB
}
```

---

## Workflow d'intervention

### Étapes du workflow

1. **Déclaration** : Signalement du problème
2. **Prédiagnostic** : Évaluation technique initiale
3. **Devis** : Proposition de prix par le garage
4. **Autorisation de travaux** : Validation du devis
5. **Vérification terrain** : Contrôle sur site
6. **Rapport de réception** : Livraison du véhicule
7. **Facturation** : Facture finale

### Entités du workflow

#### InterventionPrediagnostic
```php
class InterventionPrediagnostic
{
    protected $id;
    protected $intervention_id;
    protected $garage_id;
    protected $collaborateur_id;   // Expert qui a fait le prédiagnostic
    protected $technician_name;
    protected $prediagnostic_date;
    protected $problem_description;
    protected $proposed_solution;
    protected $estimated_cost;
    protected $estimated_duration_days;
    protected $is_urgent;
    protected $vehicle_plate;
    protected $vehicle_model;
    protected $expert_name;
    protected $quote_required;
    protected $signature_expert;
    protected $signature_repairer;
    protected $signature_insured;
}
```

#### InterventionQuote
```php
class InterventionQuote
{
    protected $id;
    protected $intervention_id;
    protected $garage_id;
    protected $quote_number;
    protected $quote_date;
    protected $valid_until;
    protected $total_amount;
    protected $tax_rate;
    protected $discount_amount;
    protected $final_amount;
    protected $status;             // draft, sent, approved, rejected
    protected $notes;
}
```

#### InterventionWorkAuthorization
```php
class InterventionWorkAuthorization
{
    protected $id;
    protected $intervention_id;
    protected $quote_id;
    protected $authorization_number;
    protected $authorization_date;
    protected $max_amount;
    protected $authorized_by;
    protected $valid_until;
    protected $status;             // pending, approved, rejected, expired
    protected $notes;
}
```

### Gestion des fournitures

#### Supply (Fourniture)
```php
class Supply
{
    protected $id;
    protected $tenant_id;
    protected $category_id;        // Relation vers SupplyCategory
    protected $supplier_id;        // Relation vers Supplier
    protected $name;
    protected $description;
    protected $part_number;
    protected $oem_number;
    protected $unit_price;
    protected $stock_quantity;
    protected $min_stock_level;
    protected $max_stock_level;
    protected $is_active;
    protected $compatible_models;  // JSON des modèles compatibles
}
```

#### InterventionSupply
```php
class InterventionSupply
{
    protected $id;
    protected $intervention_id;
    protected $supply_id;
    protected $model_id;           // Modèle de véhicule
    protected $quantity_used;
    protected $unit_price;
    protected $total_cost;
    protected $year;               // Année de fabrication/achat
    protected $used_by;
    protected $used_at;
    protected $notes;
}
```

---

## API et services

### Contrôleurs principaux

#### AttachmentController
Gestion des fichiers et pièces jointes :
- `POST /api/attachments/upload` - Upload de fichier
- `GET /api/attachments/{id}/download` - Téléchargement
- `GET /api/attachments/{id}/preview` - Prévisualisation
- `DELETE /api/attachments/{id}` - Suppression
- `GET /api/attachments` - Liste des pièces jointes

#### AuthController
Authentification et autorisation :
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/user` - Informations utilisateur
- `PUT /api/auth/password` - Changement de mot de passe

#### VehicleController
Gestion des véhicules :
- `GET /api/vehicles` - Liste des véhicules
- `POST /api/vehicles` - Création d'un véhicule
- `GET /api/vehicles/{id}` - Détails d'un véhicule
- `PUT /api/vehicles/{id}` - Modification d'un véhicule
- `DELETE /api/vehicles/{id}` - Suppression d'un véhicule

#### DriverController
Gestion des conducteurs :
- `GET /api/drivers` - Liste des conducteurs
- `POST /api/drivers` - Création d'un conducteur
- `GET /api/drivers/{id}` - Détails d'un conducteur
- `PUT /api/drivers/{id}` - Modification d'un conducteur
- `DELETE /api/drivers/{id}` - Suppression d'un conducteur

#### InterventionController
Gestion des interventions :
- `GET /api/interventions` - Liste des interventions
- `POST /api/interventions` - Création d'une intervention
- `GET /api/interventions/{id}` - Détails d'une intervention
- `PUT /api/interventions/{id}` - Modification d'une intervention
- `DELETE /api/interventions/{id}` - Suppression d'une intervention

#### TenantController
Gestion des tenants :
- `GET /api/tenants` - Liste des tenants
- `POST /api/tenants` - Création d'un tenant
- `GET /api/tenants/{id}` - Détails d'un tenant
- `PUT /api/tenants/{id}` - Modification d'un tenant
- `DELETE /api/tenants/{id}` - Suppression d'un tenant

#### ParameterController
Gestion des paramètres système :
- `GET /api/parameters` - Liste des paramètres
- `POST /api/parameters` - Création d'un paramètre
- `PUT /api/parameters/{id}` - Modification d'un paramètre
- `DELETE /api/parameters/{id}` - Suppression d'un paramètre

### Services métier

#### TenantContextService
Gestion du contexte multi-tenant :
```php
class TenantContextService
{
    public function getCurrentTenant(): ?Tenant
    public function setCurrentTenant(Tenant $tenant): void
    public function hasAccessToTenant(User $user, Tenant $tenant): bool
    public function getTenantFromRequest(Request $request): ?Tenant
}
```

#### TenantAccessService
Contrôle d'accès aux ressources par tenant :
```php
class TenantAccessService
{
    public function canAccessResource(User $user, string $resourceType, int $resourceId): bool
    public function filterByTenant(QueryBuilder $qb, Tenant $tenant): QueryBuilder
    public function validateTenantAccess(array $data, Tenant $tenant): array
}
```

#### ActionLogService
Journalisation des actions utilisateur :
```php
class ActionLogService
{
    public function logAction(User $user, string $action, array $context = []): void
    public function getActionLogs(Tenant $tenant, array $filters = []): array
    public function getActionLogsForUser(User $user, array $filters = []): array
}
```

#### AlertService
Gestion des alertes et notifications :
```php
class AlertService
{
    public function createAlert(Tenant $tenant, string $type, string $message, array $context = []): Alert
    public function getActiveAlerts(Tenant $tenant): array
    public function markAlertAsRead(int $alertId, User $user): void
    public function getAlertsForUser(User $user): array
}
```

#### CodeGenerationService
Génération de codes uniques :
```php
class CodeGenerationService
{
    public function generateInterventionNumber(Tenant $tenant): string
    public function generateQuoteNumber(Tenant $tenant): string
    public function generateAuthorizationNumber(Tenant $tenant): string
    public function generateInvoiceNumber(Tenant $tenant): string
}
```

#### LogoService
Gestion des logos des tenants :
```php
class LogoService
{
    public function uploadLogo(Tenant $tenant, UploadedFile $file): string
    public function getLogoUrl(Tenant $tenant): ?string
    public function deleteLogo(Tenant $tenant): bool
    public function resizeLogo(string $logoPath, int $width, int $height): string
}
```

#### ParameterService
Gestion des paramètres système :
```php
class ParameterService
{
    public function getParameter(string $key, Tenant $tenant = null): ?string
    public function setParameter(string $key, string $value, Tenant $tenant = null): void
    public function getParametersByCategory(string $category, Tenant $tenant = null): array
    public function deleteParameter(string $key, Tenant $tenant = null): bool
}
```

---

## Sécurité et authentification

### Système multi-tenant

#### Isolation des données
- Chaque requête vérifie le `tenant_id`
- Middleware d'authentification par tenant
- Configuration séparée par client

#### Rôles et permissions

##### Collaborateur
```php
class Collaborateur
{
    protected $position;           // administrateur, gestionnaire, secretaire_technique, 
                                  // expert, reparateur, verificateur_terrain, conducteur
    
    // Méthodes de permissions
    public function canManageUsers(): bool
    public function canManageSystem(): bool
    public function canCreateInterventions(): bool
    public function canApproveWork(): bool
    public function canPerformRepairs(): bool
    public function canAccessReports(): bool
    public function canDriveVehicles(): bool
    public function canAccessVehicleInfo(): bool
    public function canReportIncidents(): bool
}
```

### Contrôle d'accès aux pièces jointes

- **Fichiers privés** : Accès restreint aux utilisateurs autorisés
- **Fichiers publics** : Accès libre
- **Validation stricte** : Type MIME, taille, extension
- **Stockage sécurisé** : Fichiers hors web root

---

## Base de données

### Schémas principaux

#### Table des tenants
```sql
CREATE TABLE tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSON,
    storage_quota BIGINT DEFAULT 1073741824, -- 1GB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table des véhicules
```sql
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    brand_id INT NOT NULL,
    model_id INT NOT NULL,
    color_id INT NOT NULL,
    year INT NOT NULL,
    vin VARCHAR(17),
    mileage INT DEFAULT 0,
    status ENUM('active', 'maintenance', 'out_of_service', 'sold') DEFAULT 'active',
    last_maintenance DATE,
    next_service DATE,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    insurance_expiry DATE,
    technical_inspection_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (model_id) REFERENCES models(id),
    FOREIGN KEY (color_id) REFERENCES vehicle_colors(id)
);
```

#### Table des pièces jointes
```sql
CREATE TABLE attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    description TEXT,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    last_downloaded_at TIMESTAMP NULL,
    metadata JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

### Index et performances

#### Index principaux
```sql
-- Index pour les requêtes multi-tenant
CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX idx_drivers_tenant_id ON drivers(tenant_id);
CREATE INDEX idx_interventions_tenant_id ON vehicle_interventions(tenant_id);

-- Index pour les pièces jointes
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_tenant_id ON attachments(tenant_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

-- Index pour les performances
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX idx_drivers_license_number ON drivers(license_number);
CREATE INDEX idx_interventions_status ON vehicle_interventions(current_status_id);
```

### Vues de reporting

#### Vue des interventions actives
```sql
CREATE VIEW v_active_interventions AS
SELECT 
    vi.*,
    v.plate_number,
    d.first_name as driver_first_name,
    d.last_name as driver_last_name,
    g.name as garage_name,
    is.name as status_name
FROM vehicle_interventions vi
LEFT JOIN vehicles v ON vi.vehicle_id = v.id
LEFT JOIN drivers d ON vi.driver_id = d.id
LEFT JOIN garages g ON vi.garage_id = g.id
LEFT JOIN intervention_statuses is ON vi.current_status_id = is.id
WHERE vi.closed_date IS NULL;
```

#### Vue des pièces jointes par entité
```sql
CREATE VIEW v_attachments_by_entity AS
SELECT 
    a.entity_type,
    a.entity_id,
    COUNT(*) as total_attachments,
    SUM(a.file_size) as total_size,
    COUNT(CASE WHEN a.is_public = TRUE THEN 1 END) as public_attachments
FROM attachments a
GROUP BY a.entity_type, a.entity_id;
```

---

## Installation et configuration

### Prérequis pour Impact Auto

- PHP 8.1 ou supérieur
- MySQL 5.7 ou MariaDB 10.3+
- Composer 2.0+
- Node.js 14+ et npm
- Symfony CLI (optionnel)
- Serveur web (Apache/Nginx)

### Installation

#### 1. Cloner le projet FileGator
```bash
git clone <repository-url>
cd filegator
```

#### 2. Installer les dépendances PHP
```bash
cd api
composer install
```

#### 3. Installer les dépendances frontend
```bash
cd ..
npm install
```

#### 4. Compiler le frontend
```bash
npm run build
```

#### 5. Configuration Symfony
```bash
cd api
cp .env.example .env
# Éditer .env avec vos paramètres de base de données
```

#### 6. Base de données
```bash
# Créer la base de données
php bin/console doctrine:database:create

# Exécuter les migrations
php bin/console doctrine:migrations:migrate
```

#### 7. Données de base (optionnel)
```bash
# Charger les données de test
php bin/console doctrine:fixtures:load
```

#### 8. Générer les clés JWT
```bash
# Générer les clés pour l'authentification JWT
php bin/console lexik:jwt:generate-keypair
```

#### 9. Démarrer le serveur Symfony
```bash
# Avec Symfony CLI
symfony serve

# Ou avec le serveur PHP intégré
php -S localhost:8000 -t public
```

#### 10. Démarrer le serveur frontend
```bash
# Dans un autre terminal
cd dist
python -m http.server 8080
# Ou utiliser un serveur web configuré
```

### Configuration

#### .env (Configuration Symfony)
```bash
# Configuration de l'application
APP_ENV=prod
APP_SECRET=your-secret-key-here

# Configuration de la base de données
DATABASE_URL="mysql://user:password@localhost:3306/filegator?serverVersion=8.0&charset=utf8mb4"

# Configuration JWT
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=your-jwt-passphrase

# Configuration des uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
UPLOAD_PATH="%kernel.project_dir%/var/uploads"

# Configuration CORS
CORS_ALLOW_ORIGIN="http://localhost:8080"
CORS_ALLOW_HEADERS="Content-Type,Authorization,X-Requested-With"
CORS_ALLOW_METHODS="GET,POST,PUT,DELETE,OPTIONS"
```

#### services.yaml (Configuration des services)
```yaml
parameters:
    app.upload.max_size: '%env(int:UPLOAD_MAX_SIZE)%'
    app.upload.allowed_types: '%env(csv:UPLOAD_ALLOWED_TYPES)%'
    app.upload.path: '%env(UPLOAD_PATH)%'

services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude:
            - '../src/DependencyInjection/'
            - '../src/Entity/'
            - '../src/Kernel.php'

    # Configuration des services personnalisés
    App\Service\TenantContextService:
        arguments:
            $requestStack: '@request_stack'

    App\Service\LogoService:
        arguments:
            $projectDir: '%kernel.project_dir%'
            $uploadPath: '%app.upload.path%'
```

---

## Exemples d'utilisation

### Créer une intervention

```php
use App\Entity\VehicleIntervention;
use App\Entity\InterventionPrediagnostic;
use Doctrine\ORM\EntityManagerInterface;

class InterventionController extends AbstractController
{
    public function createIntervention(
        Request $request,
        EntityManagerInterface $entityManager,
        TenantContextService $tenantContextService
    ): JsonResponse {
        $tenant = $tenantContextService->getCurrentTenant();
        
        // Créer l'intervention
        $intervention = new VehicleIntervention();
        $intervention->setTenant($tenant);
        $intervention->setVehicleId($request->request->get('vehicle_id'));
        $intervention->setInterventionNumber('INT-2024-001');
        $intervention->setTitle('Problème moteur');
        $intervention->setDescription('Moteur qui tousse, perte de puissance');
        $intervention->setProblemType('breakdown');
        $intervention->setPriority('high');
        $intervention->setReportedBy($this->getUser());
        $intervention->setReportedDate(new \DateTime());

        $entityManager->persist($intervention);
        $entityManager->flush();

        // Créer le prédiagnostic
        $prediagnostic = new InterventionPrediagnostic();
        $prediagnostic->setIntervention($intervention);
        $prediagnostic->setGarageId($request->request->get('garage_id'));
        $prediagnostic->setCollaborateurId($request->request->get('collaborateur_id'));
        $prediagnostic->setPrediagnosticDate(new \DateTime());
        $prediagnostic->setProblemDescription('Bougie d\'allumage défectueuse');
        $prediagnostic->setProposedSolution('Remplacement des bougies');
        $prediagnostic->setEstimatedCost(150.00);
        $prediagnostic->setEstimatedDurationDays(1);
        $prediagnostic->setIsUrgent(false);
        $prediagnostic->setQuoteRequired(true);

        $entityManager->persist($prediagnostic);
        $entityManager->flush();

        return $this->json(['id' => $intervention->getId()], 201);
    }
}
```

### Gérer les pièces jointes

```php
use App\Entity\Attachment;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AttachmentController extends AbstractController
{
    public function uploadAttachment(
        Request $request,
        EntityManagerInterface $entityManager,
        TenantContextService $tenantContextService
    ): JsonResponse {
        $tenant = $tenantContextService->getCurrentTenant();
        $uploadedFile = $request->files->get('file');
        
        if (!$uploadedFile instanceof UploadedFile) {
            return $this->json(['error' => 'No file uploaded'], 400);
        }

        // Valider le fichier
        $allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!in_array($uploadedFile->getMimeType(), $allowedTypes)) {
            return $this->json(['error' => 'File type not allowed'], 400);
        }

        // Créer une pièce jointe
        $attachment = new Attachment();
        $attachment->setTenant($tenant);
        $attachment->setEntityType($request->request->get('entity_type'));
        $attachment->setEntityId($request->request->get('entity_id'));
        $attachment->setFileName($uploadedFile->getClientOriginalName());
        $attachment->setOriginalName($uploadedFile->getClientOriginalName());
        $attachment->setFilePath($this->getParameter('app.upload.path') . '/' . $uploadedFile->getClientOriginalName());
        $attachment->setFileSize($uploadedFile->getSize());
        $attachment->setMimeType($uploadedFile->getMimeType());
        $attachment->setFileExtension($uploadedFile->guessExtension());
        $attachment->setDescription($request->request->get('description'));
        $attachment->setUploadedBy($this->getUser());
        $attachment->setUploadedAt(new \DateTime());
        $attachment->setIsPublic(false);
        $attachment->setIsActive(true);

        // Déplacer le fichier
        $uploadedFile->move($this->getParameter('app.upload.path'), $uploadedFile->getClientOriginalName());

        $entityManager->persist($attachment);
        $entityManager->flush();

        return $this->json(['id' => $attachment->getId()], 201);
    }
}
```

### Gérer les fournitures

```php
use App\Entity\Supply;
use App\Entity\InterventionSupply;

class SupplyController extends AbstractController
{
    public function createSupply(
        Request $request,
        EntityManagerInterface $entityManager,
        TenantContextService $tenantContextService
    ): JsonResponse {
        $tenant = $tenantContextService->getCurrentTenant();
        
        // Créer une fourniture
        $supply = new Supply();
        $supply->setTenant($tenant);
        $supply->setCategoryId($request->request->get('category_id'));
        $supply->setSupplierId($request->request->get('supplier_id'));
        $supply->setName($request->request->get('name'));
        $supply->setPartNumber($request->request->get('part_number'));
        $supply->setUnitPrice($request->request->get('unit_price'));
        $supply->setStockQuantity($request->request->get('stock_quantity', 0));
        $supply->setMinStockLevel($request->request->get('min_stock_level', 0));
        $supply->setIsActive(true);

        $entityManager->persist($supply);
        $entityManager->flush();

        return $this->json(['id' => $supply->getId()], 201);
    }

    public function useSupplyInIntervention(
        Request $request,
        EntityManagerInterface $entityManager,
        TenantContextService $tenantContextService
    ): JsonResponse {
        $tenant = $tenantContextService->getCurrentTenant();
        
        // Utiliser la fourniture dans une intervention
        $interventionSupply = new InterventionSupply();
        $interventionSupply->setInterventionId($request->request->get('intervention_id'));
        $interventionSupply->setSupplyId($request->request->get('supply_id'));
        $interventionSupply->setModelId($request->request->get('model_id'));
        $interventionSupply->setQuantityUsed($request->request->get('quantity_used'));
        $interventionSupply->setUnitPrice($request->request->get('unit_price'));
        $interventionSupply->setYear($request->request->get('year', date('Y')));
        $interventionSupply->setUsedBy($this->getUser());
        $interventionSupply->setUsedAt(new \DateTime());
        
        // Calculer le coût total
        $totalCost = $interventionSupply->getQuantityUsed() * $interventionSupply->getUnitPrice();
        $interventionSupply->setTotalCost($totalCost);

        $entityManager->persist($interventionSupply);
        $entityManager->flush();

        return $this->json(['id' => $interventionSupply->getId()], 201);
    }
}
```

### Générer un rapport de prédiagnostic

```php
use App\Service\PrediagnosticReportGenerator;

class InterventionPrediagnosticController extends AbstractController
{
    public function generateReport(
        int $id,
        PrediagnosticReportGenerator $generator,
        EntityManagerInterface $entityManager
    ): Response {
        $prediagnostic = $entityManager->getRepository(InterventionPrediagnostic::class)->find($id);
        
        if (!$prediagnostic) {
            throw $this->createNotFoundException('Prédiagnostic non trouvé');
        }

        $items = $entityManager->getRepository(InterventionPrediagnosticItem::class)
            ->findBy(['prediagnostic' => $prediagnostic]);

        $html = $generator->generateReport($prediagnostic, $items);
        
        return new Response($html, 200, [
            'Content-Type' => 'text/html',
            'Content-Disposition' => 'attachment; filename="rapport_prediagnostic_' . $id . '.html"'
        ]);
    }
}
```

---

## Conclusion

Cette documentation technique présente l'architecture complète du système de gestion de parc automobile multi-tenant basé sur FileGator et Symfony 6.4. Le système offre :

- **Flexibilité** : Architecture modulaire Symfony avec Doctrine ORM
- **Sécurité** : Isolation multi-tenant, authentification JWT et contrôle d'accès granulaire
- **Performance** : Index optimisés, requêtes Doctrine efficaces et cache Symfony
- **Maintenabilité** : Code structuré avec services Symfony, traits réutilisables et migrations Doctrine
- **Évolutivité** : Support des pièces jointes, métadonnées extensibles et API REST complète
- **Modernité** : Utilisation des dernières versions de Symfony, Doctrine ORM et des bonnes pratiques PHP 8.1+

### Technologies clés utilisées

- **Backend** : Symfony 6.4, Doctrine ORM 3.5, JWT Authentication
- **Frontend** : Vue.js 2.6, Buefy UI
- **Base de données** : MySQL/MariaDB avec migrations Doctrine
- **Sécurité** : LexikJWTAuthenticationBundle, CORS, validation Symfony
- **Développement** : Composer, Symfony CLI, migrations automatiques

Le système est prêt pour la production et peut être étendu selon les besoins spécifiques de chaque client grâce à l'architecture modulaire de Symfony et aux fonctionnalités multi-tenant intégrées.
