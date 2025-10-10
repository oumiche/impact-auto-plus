<?php

namespace App\Entity;

use App\Repository\SupplyPriceHistoryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SupplyPriceHistoryRepository::class)]
#[ORM\Table(name: 'supply_price_history')]
#[ORM\Index(name: 'idx_supply_model_date', columns: ['supply_id', 'vehicle_model_id', 'recorded_at'])]
#[ORM\Index(name: 'idx_recorded_date', columns: ['recorded_at'])]
#[ORM\Index(name: 'idx_brand_model', columns: ['vehicle_brand_id', 'vehicle_model_id'])]
#[ORM\Index(name: 'idx_source_type', columns: ['source_type'])]
#[ORM\Index(name: 'idx_anomaly', columns: ['is_anomaly'])]
#[ORM\HasLifecycleCallbacks]
class SupplyPriceHistory
{
    // Source types
    public const SOURCE_AUTO = 'auto';
    public const SOURCE_MANUAL = 'manual';
    public const SOURCE_IMPORT = 'import';
    public const SOURCE_CATALOG = 'catalog';

    // Price ranks
    public const RANK_VERY_LOW = 'very_low';
    public const RANK_LOW = 'low';
    public const RANK_BELOW_AVERAGE = 'below_average';
    public const RANK_AVERAGE = 'average';
    public const RANK_ABOVE_AVERAGE = 'above_average';
    public const RANK_HIGH = 'high';
    public const RANK_VERY_HIGH = 'very_high';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['price_history:read'])]
    private ?int $id = null;

    // Pièce/Service
    #[ORM\ManyToOne(targetEntity: Supply::class)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?Supply $supply = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::STRING, length: 20)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $workType = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $category = null;

    // Prix
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $unitPrice = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $quantity = '1.00';

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['price_history:read'])]
    private ?string $totalPrice = null;

    #[ORM\Column(type: Types::STRING, length: 10)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private string $currency = 'F CFA';

    // Contexte Véhicule (obligatoire)
    #[ORM\ManyToOne(targetEntity: Vehicle::class)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?Vehicle $vehicle = null;

    #[ORM\ManyToOne(targetEntity: Brand::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?Brand $vehicleBrand = null;

    #[ORM\ManyToOne(targetEntity: Model::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?Model $vehicleModel = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?int $vehicleYear = null;

    // Contexte Temporel (obligatoire)
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?\DateTimeInterface $recordedAt = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['price_history:read'])]
    private ?int $recordedYear = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['price_history:read'])]
    private ?int $recordedMonth = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?\DateTimeInterface $validFrom = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?\DateTimeInterface $validUntil = null;

    // Source et Traçabilité
    #[ORM\Column(type: Types::STRING, length: 20)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private string $sourceType = self::SOURCE_MANUAL;

    #[ORM\ManyToOne(targetEntity: InterventionWorkAuthorization::class)]
    #[Groups(['price_history:read'])]
    private ?InterventionWorkAuthorization $workAuthorization = null;

    #[ORM\ManyToOne(targetEntity: VehicleIntervention::class)]
    #[Groups(['price_history:read'])]
    private ?VehicleIntervention $intervention = null;

    #[ORM\Column(type: Types::STRING, length: 200, nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $garage = null;

    #[ORM\Column(type: Types::STRING, length: 200, nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $supplier = null;

    // Métadonnées
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['price_history:read'])]
    private ?User $createdBy = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['price_history:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['price_history:read'])]
    private ?User $updatedBy = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['price_history:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['price_history:read', 'price_history:write'])]
    private ?string $notes = null;

    // Analyse Automatique
    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['price_history:read'])]
    private bool $isAnomaly = false;

    #[ORM\Column(type: Types::DECIMAL, precision: 5, scale: 2, nullable: true)]
    #[Groups(['price_history:read'])]
    private ?string $deviationPercent = null;

    #[ORM\Column(type: Types::STRING, length: 20, nullable: true)]
    #[Groups(['price_history:read'])]
    private ?string $priceRank = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->recordedAt = new \DateTime();
        $this->recordedYear = (int) $this->recordedAt->format('Y');
        $this->recordedMonth = (int) $this->recordedAt->format('m');
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function updateDates(): void
    {
        if ($this->recordedAt) {
            $this->recordedYear = (int) $this->recordedAt->format('Y');
            $this->recordedMonth = (int) $this->recordedAt->format('m');
        }
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function calculateTotalPrice(): void
    {
        if ($this->unitPrice && $this->quantity) {
            $total = (float) $this->unitPrice * (float) $this->quantity;
            $this->totalPrice = (string) round($total, 2);
        }
    }

    // Getters and Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSupply(): ?Supply
    {
        return $this->supply;
    }

    public function setSupply(?Supply $supply): self
    {
        $this->supply = $supply;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getWorkType(): ?string
    {
        return $this->workType;
    }

    public function setWorkType(string $workType): self
    {
        $validTypes = [VehicleIntervention::WORKTYPE_LABOR, VehicleIntervention::WORKTYPE_PARTS, VehicleIntervention::WORKTYPE_OTHER];
        if (!in_array($workType, $validTypes)) {
            throw new \InvalidArgumentException("Invalid work type: {$workType}");
        }
        $this->workType = $workType;
        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(?string $category): self
    {
        $this->category = $category;
        return $this;
    }

    public function getUnitPrice(): ?string
    {
        return $this->unitPrice;
    }

    public function setUnitPrice(string $unitPrice): self
    {
        if ((float) $unitPrice <= 0) {
            throw new \InvalidArgumentException("Unit price must be greater than 0");
        }
        $this->unitPrice = $unitPrice;
        return $this;
    }

    public function getQuantity(): ?string
    {
        return $this->quantity;
    }

    public function setQuantity(string $quantity): self
    {
        if ((float) $quantity <= 0) {
            throw new \InvalidArgumentException("Quantity must be greater than 0");
        }
        $this->quantity = $quantity;
        return $this;
    }

    public function getTotalPrice(): ?string
    {
        return $this->totalPrice;
    }

    public function setTotalPrice(string $totalPrice): self
    {
        $this->totalPrice = $totalPrice;
        return $this;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): self
    {
        $this->currency = $currency;
        return $this;
    }

    public function getVehicle(): ?Vehicle
    {
        return $this->vehicle;
    }

    public function setVehicle(?Vehicle $vehicle): self
    {
        $this->vehicle = $vehicle;
        return $this;
    }

    public function getVehicleBrand(): ?Brand
    {
        return $this->vehicleBrand;
    }

    public function setVehicleBrand(?Brand $vehicleBrand): self
    {
        $this->vehicleBrand = $vehicleBrand;
        return $this;
    }

    public function getVehicleModel(): ?Model
    {
        return $this->vehicleModel;
    }

    public function setVehicleModel(?Model $vehicleModel): self
    {
        $this->vehicleModel = $vehicleModel;
        return $this;
    }

    public function getVehicleYear(): ?int
    {
        return $this->vehicleYear;
    }

    public function setVehicleYear(?int $vehicleYear): self
    {
        if ($vehicleYear !== null) {
            $currentYear = (int) date('Y');
            if ($vehicleYear < 1990 || $vehicleYear > $currentYear + 1) {
                throw new \InvalidArgumentException("Invalid vehicle year: {$vehicleYear}");
            }
        }
        $this->vehicleYear = $vehicleYear;
        return $this;
    }

    public function getRecordedAt(): ?\DateTimeInterface
    {
        return $this->recordedAt;
    }

    public function setRecordedAt(\DateTimeInterface $recordedAt): self
    {
        $this->recordedAt = $recordedAt;
        $this->recordedYear = (int) $recordedAt->format('Y');
        $this->recordedMonth = (int) $recordedAt->format('m');
        return $this;
    }

    public function getRecordedYear(): ?int
    {
        return $this->recordedYear;
    }

    public function getRecordedMonth(): ?int
    {
        return $this->recordedMonth;
    }

    public function getValidFrom(): ?\DateTimeInterface
    {
        return $this->validFrom;
    }

    public function setValidFrom(?\DateTimeInterface $validFrom): self
    {
        $this->validFrom = $validFrom;
        return $this;
    }

    public function getValidUntil(): ?\DateTimeInterface
    {
        return $this->validUntil;
    }

    public function setValidUntil(?\DateTimeInterface $validUntil): self
    {
        $this->validUntil = $validUntil;
        return $this;
    }

    public function getSourceType(): string
    {
        return $this->sourceType;
    }

    public function setSourceType(string $sourceType): self
    {
        $validTypes = [self::SOURCE_AUTO, self::SOURCE_MANUAL, self::SOURCE_IMPORT, self::SOURCE_CATALOG];
        if (!in_array($sourceType, $validTypes)) {
            throw new \InvalidArgumentException("Invalid source type: {$sourceType}");
        }
        $this->sourceType = $sourceType;
        return $this;
    }

    public function getWorkAuthorization(): ?InterventionWorkAuthorization
    {
        return $this->workAuthorization;
    }

    public function setWorkAuthorization(?InterventionWorkAuthorization $workAuthorization): self
    {
        $this->workAuthorization = $workAuthorization;
        return $this;
    }

    public function getIntervention(): ?VehicleIntervention
    {
        return $this->intervention;
    }

    public function setIntervention(?VehicleIntervention $intervention): self
    {
        $this->intervention = $intervention;
        return $this;
    }

    public function getGarage(): ?string
    {
        return $this->garage;
    }

    public function setGarage(?string $garage): self
    {
        $this->garage = $garage;
        return $this;
    }

    public function getSupplier(): ?string
    {
        return $this->supplier;
    }

    public function setSupplier(?string $supplier): self
    {
        $this->supplier = $supplier;
        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): self
    {
        $this->createdBy = $createdBy;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedBy(): ?User
    {
        return $this->updatedBy;
    }

    public function setUpdatedBy(?User $updatedBy): self
    {
        $this->updatedBy = $updatedBy;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): self
    {
        $this->notes = $notes;
        return $this;
    }

    public function isAnomaly(): bool
    {
        return $this->isAnomaly;
    }

    public function setIsAnomaly(bool $isAnomaly): self
    {
        $this->isAnomaly = $isAnomaly;
        return $this;
    }

    public function getDeviationPercent(): ?string
    {
        return $this->deviationPercent;
    }

    public function setDeviationPercent(?string $deviationPercent): self
    {
        $this->deviationPercent = $deviationPercent;
        return $this;
    }

    public function getPriceRank(): ?string
    {
        return $this->priceRank;
    }

    public function setPriceRank(?string $priceRank): self
    {
        $validRanks = [
            self::RANK_VERY_LOW,
            self::RANK_LOW,
            self::RANK_BELOW_AVERAGE,
            self::RANK_AVERAGE,
            self::RANK_ABOVE_AVERAGE,
            self::RANK_HIGH,
            self::RANK_VERY_HIGH
        ];
        if ($priceRank !== null && !in_array($priceRank, $validRanks)) {
            throw new \InvalidArgumentException("Invalid price rank: {$priceRank}");
        }
        $this->priceRank = $priceRank;
        return $this;
    }

    // Méthodes utilitaires

    public function isValid(): bool
    {
        if (!$this->validFrom && !$this->validUntil) {
            return true; // Pas de période de validité = toujours valide
        }

        $now = new \DateTime();
        
        if ($this->validFrom && $now < $this->validFrom) {
            return false; // Pas encore valide
        }
        
        if ($this->validUntil && $now > $this->validUntil) {
            return false; // Expiré
        }
        
        return true;
    }

    public function getVehicleInfo(): string
    {
        $brand = $this->vehicleBrand?->getName() ?? 'Inconnu';
        $model = $this->vehicleModel?->getName() ?? 'Inconnu';
        $year = $this->vehicleYear ?? '';
        return trim("{$brand} {$model} {$year}");
    }

    public function getAnomalyLabel(): string
    {
        if (!$this->isAnomaly) {
            return 'Normal';
        }

        $deviation = (float) $this->deviationPercent;
        
        if (abs($deviation) > 50) {
            return 'Critique';
        } elseif (abs($deviation) > 30) {
            return 'Élevé';
        } elseif (abs($deviation) > 20) {
            return 'Moyen';
        }
        
        return 'Faible';
    }

    public function getSourceTypeLabel(): string
    {
        return match($this->sourceType) {
            self::SOURCE_AUTO => 'Automatique',
            self::SOURCE_MANUAL => 'Manuel',
            self::SOURCE_IMPORT => 'Import',
            self::SOURCE_CATALOG => 'Catalogue',
            default => 'Inconnu'
        };
    }

    public function getPriceRankLabel(): string
    {
        return match($this->priceRank) {
            self::RANK_VERY_LOW => 'Très bas',
            self::RANK_LOW => 'Bas',
            self::RANK_BELOW_AVERAGE => 'En dessous moyenne',
            self::RANK_AVERAGE => 'Moyen',
            self::RANK_ABOVE_AVERAGE => 'Au dessus moyenne',
            self::RANK_HIGH => 'Élevé',
            self::RANK_VERY_HIGH => 'Très élevé',
            default => 'Non évalué'
        };
    }
}
