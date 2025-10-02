<?php

namespace App\Entity;

use App\Repository\VehicleMaintenanceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: VehicleMaintenanceRepository::class)]
#[ORM\Table(name: 'vehicle_maintenances')]
class VehicleMaintenance
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['maintenance:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['maintenance:read'])]
    private ?Tenant $tenant = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class, inversedBy: 'maintenances')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['maintenance:read'])]
    private ?Vehicle $vehicle = null;

    #[ORM\Column(length: 50)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $type = null; // 'preventive', 'corrective', 'inspection', 'repair'

    #[ORM\Column(length: 100)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?\DateTimeInterface $scheduledDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?\DateTimeInterface $completedDate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $cost = null;

    #[ORM\Column(length: 50)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $status = null; // 'scheduled', 'in_progress', 'completed', 'cancelled'

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?int $odometerReading = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?int $nextMaintenanceOdometer = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?\DateTimeInterface $nextMaintenanceDate = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $serviceProvider = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $serviceLocation = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $partsUsed = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?string $workPerformed = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private bool $isWarrantyCovered = false;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private bool $isRecurring = false;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?int $recurringIntervalDays = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private ?int $recurringIntervalKm = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['maintenance:read', 'maintenance:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['maintenance:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['maintenance:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function setTenant(?Tenant $tenant): static
    {
        $this->tenant = $tenant;
        return $this;
    }

    public function getVehicle(): ?Vehicle
    {
        return $this->vehicle;
    }

    public function setVehicle(?Vehicle $vehicle): static
    {
        $this->vehicle = $vehicle;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getScheduledDate(): ?\DateTimeInterface
    {
        return $this->scheduledDate;
    }

    public function setScheduledDate(\DateTimeInterface $scheduledDate): static
    {
        $this->scheduledDate = $scheduledDate;
        return $this;
    }

    public function getCompletedDate(): ?\DateTimeInterface
    {
        return $this->completedDate;
    }

    public function setCompletedDate(?\DateTimeInterface $completedDate): static
    {
        $this->completedDate = $completedDate;
        return $this;
    }

    public function getCost(): ?string
    {
        return $this->cost;
    }

    public function setCost(?string $cost): static
    {
        $this->cost = $cost;
        return $this;
    }


    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getOdometerReading(): ?int
    {
        return $this->odometerReading;
    }

    public function setOdometerReading(?int $odometerReading): static
    {
        $this->odometerReading = $odometerReading;
        return $this;
    }

    public function getNextMaintenanceOdometer(): ?int
    {
        return $this->nextMaintenanceOdometer;
    }

    public function setNextMaintenanceOdometer(?int $nextMaintenanceOdometer): static
    {
        $this->nextMaintenanceOdometer = $nextMaintenanceOdometer;
        return $this;
    }

    public function getNextMaintenanceDate(): ?\DateTimeInterface
    {
        return $this->nextMaintenanceDate;
    }

    public function setNextMaintenanceDate(?\DateTimeInterface $nextMaintenanceDate): static
    {
        $this->nextMaintenanceDate = $nextMaintenanceDate;
        return $this;
    }

    public function getServiceProvider(): ?string
    {
        return $this->serviceProvider;
    }

    public function setServiceProvider(?string $serviceProvider): static
    {
        $this->serviceProvider = $serviceProvider;
        return $this;
    }

    public function getServiceLocation(): ?string
    {
        return $this->serviceLocation;
    }

    public function setServiceLocation(?string $serviceLocation): static
    {
        $this->serviceLocation = $serviceLocation;
        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;
        return $this;
    }

    public function getPartsUsed(): ?string
    {
        return $this->partsUsed;
    }

    public function setPartsUsed(?string $partsUsed): static
    {
        $this->partsUsed = $partsUsed;
        return $this;
    }

    public function getWorkPerformed(): ?string
    {
        return $this->workPerformed;
    }

    public function setWorkPerformed(?string $workPerformed): static
    {
        $this->workPerformed = $workPerformed;
        return $this;
    }

    public function isWarrantyCovered(): bool
    {
        return $this->isWarrantyCovered;
    }

    public function setIsWarrantyCovered(bool $isWarrantyCovered): static
    {
        $this->isWarrantyCovered = $isWarrantyCovered;
        return $this;
    }

    public function isRecurring(): bool
    {
        return $this->isRecurring;
    }

    public function setIsRecurring(bool $isRecurring): static
    {
        $this->isRecurring = $isRecurring;
        return $this;
    }

    public function getRecurringIntervalDays(): ?int
    {
        return $this->recurringIntervalDays;
    }

    public function setRecurringIntervalDays(?int $recurringIntervalDays): static
    {
        $this->recurringIntervalDays = $recurringIntervalDays;
        return $this;
    }

    public function getRecurringIntervalKm(): ?int
    {
        return $this->recurringIntervalKm;
    }

    public function setRecurringIntervalKm(?int $recurringIntervalKm): static
    {
        $this->recurringIntervalKm = $recurringIntervalKm;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
}
