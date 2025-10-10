<?php

namespace App\Entity;

use App\Repository\InterventionReceptionReportRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InterventionReceptionReportRepository::class)]
#[ORM\Table(name: 'intervention_reception_reports')]
class InterventionReceptionReport
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: VehicleIntervention::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?VehicleIntervention $intervention = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $receptionNumber;

    #[ORM\Column(type: 'integer')]
    private int $receivedBy;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $receptionDate = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $vehicleCondition = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $workCompleted = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $remainingIssues = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $customerSatisfaction = 'good';

    #[ORM\Column(type: 'boolean')]
    private bool $isVehicleReady = true;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->receptionDate = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getReceptionNumber(): string
    {
        return $this->receptionNumber;
    }

    public function setReceptionNumber(string $receptionNumber): self
    {
        $this->receptionNumber = $receptionNumber;
        return $this;
    }

    public function getReceivedBy(): int
    {
        return $this->receivedBy;
    }

    public function setReceivedBy(int $receivedBy): self
    {
        $this->receivedBy = $receivedBy;
        return $this;
    }

    public function getReceptionDate(): ?\DateTimeInterface
    {
        return $this->receptionDate;
    }

    public function setReceptionDate(?\DateTimeInterface $receptionDate): self
    {
        $this->receptionDate = $receptionDate;
        return $this;
    }

    public function getVehicleCondition(): ?string
    {
        return $this->vehicleCondition;
    }

    public function setVehicleCondition(?string $vehicleCondition): self
    {
        $this->vehicleCondition = $vehicleCondition;
        return $this;
    }

    public function getWorkCompleted(): ?string
    {
        return $this->workCompleted;
    }

    public function setWorkCompleted(?string $workCompleted): self
    {
        $this->workCompleted = $workCompleted;
        return $this;
    }

    public function getRemainingIssues(): ?string
    {
        return $this->remainingIssues;
    }

    public function setRemainingIssues(?string $remainingIssues): self
    {
        $this->remainingIssues = $remainingIssues;
        return $this;
    }

    public function getCustomerSatisfaction(): string
    {
        return $this->customerSatisfaction;
    }

    public function setCustomerSatisfaction(string $customerSatisfaction): self
    {
        $validRatings = ['excellent', 'good', 'fair', 'poor'];
        if (!in_array($customerSatisfaction, $validRatings)) {
            throw new \InvalidArgumentException("Invalid customer satisfaction rating: {$customerSatisfaction}");
        }
        $this->customerSatisfaction = $customerSatisfaction;
        return $this;
    }

    public function isVehicleReady(): bool
    {
        return $this->isVehicleReady;
    }

    public function setIsVehicleReady(bool $isVehicleReady): self
    {
        $this->isVehicleReady = $isVehicleReady;
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
    public function getSatisfactionScore(): int
    {
        $scores = [
            'excellent' => 5,
            'good' => 4,
            'fair' => 3,
            'poor' => 2
        ];
        return $scores[$this->customerSatisfaction] ?? 3;
    }

    public function hasRemainingIssues(): bool
    {
        return !empty($this->remainingIssues);
    }

    public function isSatisfactory(): bool
    {
        return $this->getSatisfactionScore() >= 4 && $this->isVehicleReady;
    }

    public function getSatisfactionLabel(): string
    {
        $labels = [
            'excellent' => 'Excellent',
            'good' => 'Bon',
            'fair' => 'Moyen',
            'poor' => 'Mauvais'
        ];
        return $labels[$this->customerSatisfaction] ?? 'Inconnu';
    }

    public function isComplete(): bool
    {
        return !empty($this->vehicleCondition) && 
               !empty($this->workCompleted) && 
               !empty($this->customerSatisfaction);
    }

    public function isExcellent(): bool
    {
        return $this->customerSatisfaction === 'excellent';
    }

    public function isGood(): bool
    {
        return $this->customerSatisfaction === 'good';
    }

    public function isFair(): bool
    {
        return $this->customerSatisfaction === 'fair';
    }

    public function isPoor(): bool
    {
        return $this->customerSatisfaction === 'poor';
    }

    public function getOverallRating(): string
    {
        if ($this->isSatisfactory()) {
            return $this->isExcellent() ? 'Excellent' : 'Satisfaisant';
        }
        return 'Non satisfaisant';
    }

    public function requiresFollowUp(): bool
    {
        return $this->hasRemainingIssues() || !$this->isVehicleReady() || $this->isPoor();
    }
}
