<?php

namespace App\Entity;

use App\Repository\VehicleRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

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
    private string $plateNumber;

    #[ORM\ManyToOne(targetEntity: Brand::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Brand $brand = null;

    #[ORM\ManyToOne(targetEntity: Model::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Model $model = null;

    #[ORM\ManyToOne(targetEntity: VehicleColor::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?VehicleColor $color = null;

    #[ORM\ManyToOne(targetEntity: VehicleCategory::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?VehicleCategory $category = null;

    #[ORM\ManyToOne(targetEntity: FuelType::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?FuelType $fuelType = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $year = null;

    #[ORM\Column(type: 'string', length: 17, nullable: true)]
    private ?string $vin = null;

    #[ORM\Column(type: 'integer')]
    private int $mileage = 0;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $trackingId = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $engineSize = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $powerHp = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = 'active';

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

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'vehicle', targetEntity: VehicleMaintenance::class, cascade: ['persist'])]
    private Collection $maintenances;

    #[ORM\OneToMany(mappedBy: 'vehicle', targetEntity: VehicleInsurance::class, cascade: ['persist'])]
    private Collection $insurances;

    #[ORM\OneToMany(mappedBy: 'vehicle', targetEntity: VehicleFuelLog::class, cascade: ['persist'])]
    private Collection $fuelLogs;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->maintenances = new ArrayCollection();
        $this->insurances = new ArrayCollection();
        $this->fuelLogs = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function setTenant(?Tenant $tenant): self
    {
        $this->tenant = $tenant;
        return $this;
    }

    public function getPlateNumber(): string
    {
        return $this->plateNumber;
    }

    public function setPlateNumber(string $plateNumber): self
    {
        $this->plateNumber = $plateNumber;
        return $this;
    }

    public function getBrand(): ?Brand
    {
        return $this->brand;
    }

    public function setBrand(?Brand $brand): self
    {
        $this->brand = $brand;
        return $this;
    }

    public function getModel(): ?Model
    {
        return $this->model;
    }

    public function setModel(?Model $model): self
    {
        $this->model = $model;
        return $this;
    }

    public function getColor(): ?VehicleColor
    {
        return $this->color;
    }

    public function setColor(?VehicleColor $color): self
    {
        $this->color = $color;
        return $this;
    }

    public function getCategory(): ?VehicleCategory
    {
        return $this->category;
    }

    public function setCategory(?VehicleCategory $category): self
    {
        $this->category = $category;
        return $this;
    }

    public function getFuelType(): ?FuelType
    {
        return $this->fuelType;
    }

    public function setFuelType(?FuelType $fuelType): self
    {
        $this->fuelType = $fuelType;
        return $this;
    }

    public function getYear(): ?int
    {
        return $this->year;
    }

    public function setYear(?int $year): self
    {
        $this->year = $year;
        return $this;
    }

    public function getVin(): ?string
    {
        return $this->vin;
    }

    public function setVin(?string $vin): self
    {
        $this->vin = $vin;
        return $this;
    }

    public function getMileage(): int
    {
        return $this->mileage;
    }

    public function setMileage(int $mileage): self
    {
        $this->mileage = $mileage;
        return $this;
    }

    public function getTrackingId(): ?string
    {
        return $this->trackingId;
    }

    public function setTrackingId(?string $trackingId): self
    {
        $this->trackingId = $trackingId;
        return $this;
    }

    public function getEngineSize(): ?float
    {
        return $this->engineSize;
    }

    public function setEngineSize(?float $engineSize): self
    {
        $this->engineSize = $engineSize;
        return $this;
    }

    public function getPowerHp(): ?int
    {
        return $this->powerHp;
    }

    public function setPowerHp(?int $powerHp): self
    {
        $this->powerHp = $powerHp;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $validStatuses = ['active', 'maintenance', 'out_of_service', 'sold'];
        if (!in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }
        $this->status = $status;
        return $this;
    }

    public function getLastMaintenance(): ?\DateTimeInterface
    {
        return $this->lastMaintenance;
    }

    public function setLastMaintenance(?\DateTimeInterface $lastMaintenance): self
    {
        $this->lastMaintenance = $lastMaintenance;
        return $this;
    }

    public function getNextService(): ?\DateTimeInterface
    {
        return $this->nextService;
    }

    public function setNextService(?\DateTimeInterface $nextService): self
    {
        $this->nextService = $nextService;
        return $this;
    }

    public function getPurchaseDate(): ?\DateTimeInterface
    {
        return $this->purchaseDate;
    }

    public function setPurchaseDate(?\DateTimeInterface $purchaseDate): self
    {
        $this->purchaseDate = $purchaseDate;
        return $this;
    }

    public function getPurchasePrice(): ?string
    {
        return $this->purchasePrice;
    }

    public function setPurchasePrice(?string $purchasePrice): self
    {
        $this->purchasePrice = $purchasePrice;
        return $this;
    }

    public function getInsuranceExpiry(): ?\DateTimeInterface
    {
        return $this->insuranceExpiry;
    }

    public function setInsuranceExpiry(?\DateTimeInterface $insuranceExpiry): self
    {
        $this->insuranceExpiry = $insuranceExpiry;
        return $this;
    }

    public function getTechnicalInspectionExpiry(): ?\DateTimeInterface
    {
        return $this->technicalInspectionExpiry;
    }

    public function setTechnicalInspectionExpiry(?\DateTimeInterface $technicalInspectionExpiry): self
    {
        $this->technicalInspectionExpiry = $technicalInspectionExpiry;
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

    // Méthodes utilitaires
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isInMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    public function isOutOfService(): bool
    {
        return $this->status === 'out_of_service';
    }

    public function isSold(): bool
    {
        return $this->status === 'sold';
    }

    public function isInsuranceExpired(): bool
    {
        if (!$this->insuranceExpiry) {
            return false;
        }
        return $this->insuranceExpiry < new \DateTime();
    }

    public function isTechnicalInspectionExpired(): bool
    {
        if (!$this->technicalInspectionExpiry) {
            return false;
        }
        return $this->technicalInspectionExpiry < new \DateTime();
    }

    public function getDaysUntilInsuranceExpiry(): ?int
    {
        if (!$this->insuranceExpiry) {
            return null;
        }
        $now = new \DateTime();
        $diff = $now->diff($this->insuranceExpiry);
        return $this->insuranceExpiry > $now ? $diff->days : -$diff->days;
    }

    public function getDaysUntilTechnicalInspectionExpiry(): ?int
    {
        if (!$this->technicalInspectionExpiry) {
            return null;
        }
        $now = new \DateTime();
        $diff = $now->diff($this->technicalInspectionExpiry);
        return $this->technicalInspectionExpiry > $now ? $diff->days : -$diff->days;
    }

    public function getFullName(): string
    {
        $brandName = $this->brand ? $this->brand->getName() : 'Inconnu';
        $modelName = $this->model ? $this->model->getName() : 'Inconnu';
        return $brandName . ' ' . $modelName;
    }

    public function getStatusLabel(): string
    {
        $statuses = [
            'active' => 'Actif',
            'maintenance' => 'En maintenance',
            'out_of_service' => 'Hors service',
            'sold' => 'Vendu'
        ];
        return $statuses[$this->status] ?? 'Inconnu';
    }

    /**
     * @return Collection<int, VehicleMaintenance>
     */
    public function getMaintenances(): Collection
    {
        return $this->maintenances;
    }

    public function addMaintenance(VehicleMaintenance $maintenance): static
    {
        if (!$this->maintenances->contains($maintenance)) {
            $this->maintenances->add($maintenance);
            $maintenance->setVehicle($this);
        }
        return $this;
    }

    public function removeMaintenance(VehicleMaintenance $maintenance): static
    {
        if ($this->maintenances->removeElement($maintenance)) {
            if ($maintenance->getVehicle() === $this) {
                $maintenance->setVehicle(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, VehicleInsurance>
     */
    public function getInsurances(): Collection
    {
        return $this->insurances;
    }

    public function addInsurance(VehicleInsurance $insurance): static
    {
        if (!$this->insurances->contains($insurance)) {
            $this->insurances->add($insurance);
            $insurance->setVehicle($this);
        }
        return $this;
    }

    public function removeInsurance(VehicleInsurance $insurance): static
    {
        if ($this->insurances->removeElement($insurance)) {
            if ($insurance->getVehicle() === $this) {
                $insurance->setVehicle(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, VehicleFuelLog>
     */
    public function getFuelLogs(): Collection
    {
        return $this->fuelLogs;
    }

    public function addFuelLog(VehicleFuelLog $fuelLog): static
    {
        if (!$this->fuelLogs->contains($fuelLog)) {
            $this->fuelLogs->add($fuelLog);
            $fuelLog->setVehicle($this);
        }
        return $this;
    }

    public function removeFuelLog(VehicleFuelLog $fuelLog): static
    {
        if ($this->fuelLogs->removeElement($fuelLog)) {
            if ($fuelLog->getVehicle() === $this) {
                $fuelLog->setVehicle(null);
            }
        }
        return $this;
    }
}
