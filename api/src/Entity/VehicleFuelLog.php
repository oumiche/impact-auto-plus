<?php

namespace App\Entity;

use App\Repository\VehicleFuelLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: VehicleFuelLogRepository::class)]
#[ORM\Table(name: 'vehicle_fuel_logs')]
class VehicleFuelLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['fuel:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['fuel:read'])]
    private ?Tenant $tenant = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class, inversedBy: 'fuelLogs')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['fuel:read'])]
    private ?Vehicle $vehicle = null;

    #[ORM\ManyToOne(targetEntity: Driver::class, inversedBy: 'fuelLogs')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['fuel:read'])]
    private ?Driver $driver = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?\DateTimeInterface $refuelDate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 8, scale: 2)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $quantity = null; // Litres

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $unitPrice = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $totalCost = null;


    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?int $odometerReading = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?int $previousOdometerReading = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?int $kilometersDriven = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 8, scale: 2, nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $fuelEfficiency = null; // L/100km

    #[ORM\ManyToOne(targetEntity: FuelType::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?FuelType $fuelType = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $stationName = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $stationLocation = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $receiptNumber = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private bool $isFullTank = true;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['fuel:read', 'fuel:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['fuel:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['fuel:read'])]
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

    public function getDriver(): ?Driver
    {
        return $this->driver;
    }

    public function setDriver(?Driver $driver): static
    {
        $this->driver = $driver;
        return $this;
    }

    public function getRefuelDate(): ?\DateTimeInterface
    {
        return $this->refuelDate;
    }

    public function setRefuelDate(\DateTimeInterface $refuelDate): static
    {
        $this->refuelDate = $refuelDate;
        return $this;
    }

    public function getQuantity(): ?string
    {
        return $this->quantity;
    }

    public function setQuantity(string $quantity): static
    {
        $this->quantity = $quantity;
        return $this;
    }

    public function getUnitPrice(): ?string
    {
        return $this->unitPrice;
    }

    public function setUnitPrice(string $unitPrice): static
    {
        $this->unitPrice = $unitPrice;
        return $this;
    }

    public function getTotalCost(): ?string
    {
        return $this->totalCost;
    }

    public function setTotalCost(string $totalCost): static
    {
        $this->totalCost = $totalCost;
        return $this;
    }


    public function getOdometerReading(): ?int
    {
        return $this->odometerReading;
    }

    public function setOdometerReading(int $odometerReading): static
    {
        $this->odometerReading = $odometerReading;
        return $this;
    }

    public function getPreviousOdometerReading(): ?int
    {
        return $this->previousOdometerReading;
    }

    public function setPreviousOdometerReading(?int $previousOdometerReading): static
    {
        $this->previousOdometerReading = $previousOdometerReading;
        return $this;
    }

    public function getKilometersDriven(): ?int
    {
        return $this->kilometersDriven;
    }

    public function setKilometersDriven(?int $kilometersDriven): static
    {
        $this->kilometersDriven = $kilometersDriven;
        return $this;
    }

    public function getFuelEfficiency(): ?string
    {
        return $this->fuelEfficiency;
    }

    public function setFuelEfficiency(?string $fuelEfficiency): static
    {
        $this->fuelEfficiency = $fuelEfficiency;
        return $this;
    }

    public function getFuelType(): ?FuelType
    {
        return $this->fuelType;
    }

    public function setFuelType(?FuelType $fuelType): static
    {
        $this->fuelType = $fuelType;
        return $this;
    }

    public function getStationName(): ?string
    {
        return $this->stationName;
    }

    public function setStationName(?string $stationName): static
    {
        $this->stationName = $stationName;
        return $this;
    }

    public function getStationLocation(): ?string
    {
        return $this->stationLocation;
    }

    public function setStationLocation(?string $stationLocation): static
    {
        $this->stationLocation = $stationLocation;
        return $this;
    }

    public function getReceiptNumber(): ?string
    {
        return $this->receiptNumber;
    }

    public function setReceiptNumber(?string $receiptNumber): static
    {
        $this->receiptNumber = $receiptNumber;
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

    public function isFullTank(): bool
    {
        return $this->isFullTank;
    }

    public function setIsFullTank(bool $isFullTank): static
    {
        $this->isFullTank = $isFullTank;
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

    public function calculateFuelEfficiency(): ?float
    {
        if ($this->kilometersDriven && $this->quantity && $this->kilometersDriven > 0) {
            return (float) $this->quantity / ($this->kilometersDriven / 100);
        }
        return null;
    }

    public function calculateKilometersDriven(): ?int
    {
        if ($this->odometerReading && $this->previousOdometerReading) {
            return $this->odometerReading - $this->previousOdometerReading;
        }
        return null;
    }
}
