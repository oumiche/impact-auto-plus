<?php

namespace App\Entity;

use App\Repository\VehicleInsuranceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: VehicleInsuranceRepository::class)]
#[ORM\Table(name: 'vehicle_insurances')]
class VehicleInsurance
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['insurance:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['insurance:read'])]
    private ?Tenant $tenant = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class, inversedBy: 'insurances')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['insurance:read'])]
    private ?Vehicle $vehicle = null;

    #[ORM\Column(length: 100)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $policyNumber = null;

    #[ORM\Column(length: 100)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $insuranceCompany = null;

    #[ORM\Column(length: 50)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $coverageType = null; // 'comprehensive', 'third_party', 'liability', 'collision'

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $premiumAmount = null;

    #[ORM\Column(length: 3)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $currency = 'XOF';

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $deductible = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $coverageLimit = null;

    #[ORM\Column(length: 50)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $status = null; // 'active', 'expired', 'cancelled', 'pending_renewal'

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $coverageDetails = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $agentName = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $agentContact = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $agentEmail = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?\DateTimeInterface $renewalDate = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private ?int $renewalReminderDays = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private bool $isAutoRenewal = false;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['insurance:read', 'insurance:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['insurance:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['insurance:read'])]
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

    public function getPolicyNumber(): ?string
    {
        return $this->policyNumber;
    }

    public function setPolicyNumber(string $policyNumber): static
    {
        $this->policyNumber = $policyNumber;
        return $this;
    }

    public function getInsuranceCompany(): ?string
    {
        return $this->insuranceCompany;
    }

    public function setInsuranceCompany(string $insuranceCompany): static
    {
        $this->insuranceCompany = $insuranceCompany;
        return $this;
    }

    public function getCoverageType(): ?string
    {
        return $this->coverageType;
    }

    public function setCoverageType(string $coverageType): static
    {
        $this->coverageType = $coverageType;
        return $this;
    }

    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeInterface $startDate): static
    {
        $this->startDate = $startDate;
        return $this;
    }

    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(\DateTimeInterface $endDate): static
    {
        $this->endDate = $endDate;
        return $this;
    }

    public function getPremiumAmount(): ?string
    {
        return $this->premiumAmount;
    }

    public function setPremiumAmount(string $premiumAmount): static
    {
        $this->premiumAmount = $premiumAmount;
        return $this;
    }

    public function getCurrency(): ?string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = $currency;
        return $this;
    }

    public function getDeductible(): ?string
    {
        return $this->deductible;
    }

    public function setDeductible(?string $deductible): static
    {
        $this->deductible = $deductible;
        return $this;
    }

    public function getCoverageLimit(): ?string
    {
        return $this->coverageLimit;
    }

    public function setCoverageLimit(?string $coverageLimit): static
    {
        $this->coverageLimit = $coverageLimit;
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

    public function getCoverageDetails(): ?string
    {
        return $this->coverageDetails;
    }

    public function setCoverageDetails(?string $coverageDetails): static
    {
        $this->coverageDetails = $coverageDetails;
        return $this;
    }

    public function getAgentName(): ?string
    {
        return $this->agentName;
    }

    public function setAgentName(?string $agentName): static
    {
        $this->agentName = $agentName;
        return $this;
    }

    public function getAgentContact(): ?string
    {
        return $this->agentContact;
    }

    public function setAgentContact(?string $agentContact): static
    {
        $this->agentContact = $agentContact;
        return $this;
    }

    public function getAgentEmail(): ?string
    {
        return $this->agentEmail;
    }

    public function setAgentEmail(?string $agentEmail): static
    {
        $this->agentEmail = $agentEmail;
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

    public function getRenewalDate(): ?\DateTimeInterface
    {
        return $this->renewalDate;
    }

    public function setRenewalDate(?\DateTimeInterface $renewalDate): static
    {
        $this->renewalDate = $renewalDate;
        return $this;
    }

    public function getRenewalReminderDays(): ?int
    {
        return $this->renewalReminderDays;
    }

    public function setRenewalReminderDays(?int $renewalReminderDays): static
    {
        $this->renewalReminderDays = $renewalReminderDays;
        return $this;
    }

    public function isAutoRenewal(): bool
    {
        return $this->isAutoRenewal;
    }

    public function setIsAutoRenewal(bool $isAutoRenewal): static
    {
        $this->isAutoRenewal = $isAutoRenewal;
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

    public function isExpired(): bool
    {
        return $this->endDate < new \DateTime();
    }

    public function isExpiringSoon(int $days = 30): bool
    {
        $expiryDate = clone $this->endDate;
        $expiryDate = $expiryDate instanceof \DateTime ? $expiryDate->modify("-{$days} days") : $expiryDate;
        return $expiryDate <= new \DateTime();
    }
}
