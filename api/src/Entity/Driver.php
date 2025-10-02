<?php

namespace App\Entity;

use App\Repository\DriverRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DriverRepository::class)]
#[ORM\Table(name: 'drivers')]
class Driver
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tenant $tenant = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $firstName;

    #[ORM\Column(type: 'string', length: 50)]
    private string $lastName;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $licenseNumber;

    #[ORM\ManyToOne(targetEntity: LicenseType::class)]
    private ?LicenseType $licenseType = null;

    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $licenseExpiryDate = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateOfBirth = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $emergencyContactName = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $emergencyContactPhone = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = 'active';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'driver', targetEntity: VehicleFuelLog::class, cascade: ['persist'])]
    private Collection $fuelLogs;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
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

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): self
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): self
    {
        $this->lastName = $lastName;
        return $this;
    }

    public function getFullName(): string
    {
        return $this->getFirstName() . ' ' . $this->getLastName();
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): self
    {
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email format: {$email}");
        }
        $this->email = $email;
        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): self
    {
        $this->phone = $phone;
        return $this;
    }

    public function getLicenseNumber(): string
    {
        return $this->licenseNumber;
    }

    public function setLicenseNumber(string $licenseNumber): self
    {
        $this->licenseNumber = $licenseNumber;
        return $this;
    }

    public function getLicenseType(): ?LicenseType
    {
        return $this->licenseType;
    }

    public function setLicenseType(?LicenseType $licenseType): self
    {
        $this->licenseType = $licenseType;
        return $this;
    }

    public function getLicenseExpiryDate(): ?\DateTimeInterface
    {
        return $this->licenseExpiryDate;
    }

    public function setLicenseExpiryDate(?\DateTimeInterface $licenseExpiryDate): self
    {
        $this->licenseExpiryDate = $licenseExpiryDate;
        return $this;
    }

    public function getDateOfBirth(): ?\DateTimeInterface
    {
        return $this->dateOfBirth;
    }

    public function setDateOfBirth(?\DateTimeInterface $dateOfBirth): self
    {
        $this->dateOfBirth = $dateOfBirth;
        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): self
    {
        $this->address = $address;
        return $this;
    }

    public function getEmergencyContactName(): ?string
    {
        return $this->emergencyContactName;
    }

    public function setEmergencyContactName(?string $emergencyContactName): self
    {
        $this->emergencyContactName = $emergencyContactName;
        return $this;
    }

    public function getEmergencyContactPhone(): ?string
    {
        return $this->emergencyContactPhone;
    }

    public function setEmergencyContactPhone(?string $emergencyContactPhone): self
    {
        $this->emergencyContactPhone = $emergencyContactPhone;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $validStatuses = ['active', 'inactive', 'suspended', 'terminated'];
        if (!in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }
        $this->status = $status;
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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    // Méthodes utilitaires
    public function isLicenseExpired(): bool
    {
        if (!$this->licenseExpiryDate) {
            return false;
        }
        return $this->licenseExpiryDate < new \DateTime();
    }

    public function getDaysUntilLicenseExpiry(): int
    {
        if (!$this->licenseExpiryDate) {
            return 0;
        }
        $now = new \DateTime();
        $expiry = $this->licenseExpiryDate;
        $diff = $now->diff($expiry);
        return $expiry > $now ? $diff->days : -$diff->days;
    }

    public function getAge(): ?int
    {
        if (!$this->dateOfBirth) {
            return null;
        }
        $now = new \DateTime();
        return $now->diff($this->dateOfBirth)->y;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isLicenseExpiringSoon(int $daysThreshold = 30): bool
    {
        $daysUntilExpiry = $this->getDaysUntilLicenseExpiry();
        return $daysUntilExpiry <= $daysThreshold && $daysUntilExpiry >= 0;
    }

    public function isLicenseValid(): bool
    {
        return !$this->isLicenseExpired() && $this->isActive();
    }

    public function getStatusLabel(): string
    {
        $statuses = [
            'active' => 'Actif',
            'inactive' => 'Inactif',
            'suspended' => 'Suspendu',
            'terminated' => 'Terminé'
        ];
        return $statuses[$this->status] ?? 'Inconnu';
    }

    public function canDriveVehicleCategory(string $category): bool
    {
        if (!$this->licenseType) {
            return false;
        }
        
        return $this->isActive() && !$this->isLicenseExpired();
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
            $fuelLog->setDriver($this);
        }
        return $this;
    }

    public function removeFuelLog(VehicleFuelLog $fuelLog): static
    {
        if ($this->fuelLogs->removeElement($fuelLog)) {
            if ($fuelLog->getDriver() === $this) {
                $fuelLog->setDriver(null);
            }
        }
        return $this;
    }
}
