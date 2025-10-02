<?php

namespace App\Entity;

use App\Repository\VehicleInterventionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VehicleInterventionRepository::class)]
#[ORM\Table(name: 'vehicle_interventions')]
class VehicleIntervention
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tenant $tenant = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Vehicle $vehicle = null;

    #[ORM\ManyToOne(targetEntity: Driver::class)]
    private ?Driver $driver = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $interventionNumber;

    #[ORM\Column(type: 'string', length: 200)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: InterventionType::class)]
    private ?InterventionType $interventionType = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $priority = 'medium';

    #[ORM\Column(type: 'string', length: 50)]
    private string $currentStatus = 'reported';

    #[ORM\Column(type: 'integer')]
    private int $reportedBy;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $assignedTo = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $estimatedDurationDays = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $actualDurationDays = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $odometerReading = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $reportedDate = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $startedDate = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $completedDate = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $closedDate = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'intervention', targetEntity: InterventionSupply::class, cascade: ['persist'])]
    private Collection $supplies;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->reportedDate = new \DateTime();
        $this->supplies = new ArrayCollection();
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

    public function getVehicle(): ?Vehicle
    {
        return $this->vehicle;
    }

    public function setVehicle(?Vehicle $vehicle): self
    {
        $this->vehicle = $vehicle;
        return $this;
    }

    public function getDriver(): ?Driver
    {
        return $this->driver;
    }

    public function setDriver(?Driver $driver): self
    {
        $this->driver = $driver;
        return $this;
    }

    public function getInterventionNumber(): string
    {
        return $this->interventionNumber;
    }

    public function setInterventionNumber(string $interventionNumber): self
    {
        $this->interventionNumber = $interventionNumber;
        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }


    public function getPriority(): string
    {
        return $this->priority;
    }

    public function setPriority(string $priority): self
    {
        $validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!in_array($priority, $validPriorities)) {
            throw new \InvalidArgumentException("Invalid priority: {$priority}");
        }
        $this->priority = $priority;
        return $this;
    }

    public function getCurrentStatus(): string
    {
        return $this->currentStatus;
    }

    public function setCurrentStatus(string $currentStatus): self
    {
        $validStatuses = [
            'reported', 'in_prediagnostic', 'prediagnostic_completed', 
            'in_quote', 'quote_received', 'in_approval', 'approved', 
            'in_repair', 'repair_completed', 'in_reception', 
            'vehicle_received', 'cancelled'
        ];
        if (!in_array($currentStatus, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status: {$currentStatus}");
        }
        $this->currentStatus = $currentStatus;
        return $this;
    }

    public function getReportedBy(): int
    {
        return $this->reportedBy;
    }

    public function setReportedBy(int $reportedBy): self
    {
        $this->reportedBy = $reportedBy;
        return $this;
    }

    public function getAssignedTo(): ?int
    {
        return $this->assignedTo;
    }

    public function setAssignedTo(?int $assignedTo): self
    {
        $this->assignedTo = $assignedTo;
        return $this;
    }


    public function getEstimatedDurationDays(): ?int
    {
        return $this->estimatedDurationDays;
    }

    public function setEstimatedDurationDays(?int $estimatedDurationDays): self
    {
        if ($estimatedDurationDays !== null && $estimatedDurationDays < 0) {
            throw new \InvalidArgumentException("Estimated duration cannot be negative");
        }
        $this->estimatedDurationDays = $estimatedDurationDays;
        return $this;
    }

    public function getActualDurationDays(): ?int
    {
        return $this->actualDurationDays;
    }

    public function setActualDurationDays(?int $actualDurationDays): self
    {
        if ($actualDurationDays !== null && $actualDurationDays < 0) {
            throw new \InvalidArgumentException("Actual duration cannot be negative");
        }
        $this->actualDurationDays = $actualDurationDays;
        return $this;
    }

    public function getReportedDate(): ?\DateTimeInterface
    {
        return $this->reportedDate;
    }

    public function setReportedDate(?\DateTimeInterface $reportedDate): self
    {
        $this->reportedDate = $reportedDate;
        return $this;
    }

    public function getStartedDate(): ?\DateTimeInterface
    {
        return $this->startedDate;
    }

    public function setStartedDate(?\DateTimeInterface $startedDate): self
    {
        $this->startedDate = $startedDate;
        return $this;
    }

    public function getCompletedDate(): ?\DateTimeInterface
    {
        return $this->completedDate;
    }

    public function setCompletedDate(?\DateTimeInterface $completedDate): self
    {
        $this->completedDate = $completedDate;
        return $this;
    }

    public function getClosedDate(): ?\DateTimeInterface
    {
        return $this->closedDate;
    }

    public function setClosedDate(?\DateTimeInterface $closedDate): self
    {
        $this->closedDate = $closedDate;
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
    public function isActive(): bool
    {
        return $this->closedDate === null;
    }


    public function isClosed(): bool
    {
        return $this->closedDate !== null;
    }

    public function getDurationInDays(): ?int
    {
        if (!$this->startedDate) {
            return null;
        }
        
        $end = $this->completedDate ?: new \DateTime();
        $start = $this->startedDate;
        $diff = $start->diff($end);
        return $diff->days;
    }

    public function isOverdue(): bool
    {
        if (!$this->estimatedDurationDays || !$this->startedDate) {
            return false;
        }
        
        $expectedEnd = clone $this->startedDate;
        $expectedEnd = $expectedEnd instanceof \DateTime ? $expectedEnd->modify('+' . $this->estimatedDurationDays . ' days') : $expectedEnd;
        
        return $expectedEnd < new \DateTime() && !$this->isCompleted();
    }


    public function getPriorityLabel(): string
    {
        $priorities = [
            'low' => 'Faible',
            'medium' => 'Moyenne',
            'high' => 'Élevée',
            'urgent' => 'Urgente'
        ];
        return $priorities[$this->priority] ?? 'Inconnue';
    }


    public function start(): self
    {
        $this->startedDate = new \DateTime();
        $this->currentStatus = 'in_prediagnostic';
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function complete(): self
    {
        $this->completedDate = new \DateTime();
        $this->currentStatus = 'vehicle_received';
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function close(): self
    {
        $this->closedDate = new \DateTime();
        $this->currentStatus = 'cancelled';
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    /**
     * @return Collection<int, InterventionSupply>
     */
    public function getSupplies(): Collection
    {
        return $this->supplies;
    }

    public function addSupply(InterventionSupply $supply): static
    {
        if (!$this->supplies->contains($supply)) {
            $this->supplies->add($supply);
            $supply->setIntervention($this);
        }
        return $this;
    }

    public function removeSupply(InterventionSupply $supply): static
    {
        if ($this->supplies->removeElement($supply)) {
            if ($supply->getIntervention() === $this) {
                $supply->setIntervention(null);
            }
        }
        return $this;
    }

    public function getInterventionType(): ?InterventionType
    {
        return $this->interventionType;
    }

    public function setInterventionType(?InterventionType $interventionType): static
    {
        $this->interventionType = $interventionType;
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

    // Méthodes de workflow
    public function getValidStatuses(): array
    {
        return [
            'reported' => 'Signalé',
            'in_prediagnostic' => 'En prédiagnostic',
            'prediagnostic_completed' => 'Prédiagnostic terminé',
            'in_quote' => 'En devis',
            'quote_received' => 'Devis reçu',
            'in_approval' => 'En accord',
            'approved' => 'Accord donné',
            'in_repair' => 'En réparation',
            'repair_completed' => 'Réparation terminée',
            'in_reception' => 'En réception',
            'vehicle_received' => 'Véhicule reçu',
            'cancelled' => 'Annulé'
        ];
    }

    public function getStatusLabel(string $status = null): string
    {
        $status = $status ?? $this->currentStatus;
        $validStatuses = $this->getValidStatuses();
        return $validStatuses[$status] ?? $status;
    }

    public function getStatusTransitions(): array
    {
        return [
            'reported' => ['in_prediagnostic', 'cancelled'],
            'in_prediagnostic' => ['prediagnostic_completed', 'cancelled'],
            'prediagnostic_completed' => ['in_quote', 'cancelled'],
            'in_quote' => ['quote_received', 'cancelled'],
            'quote_received' => ['in_approval', 'cancelled'],
            'in_approval' => ['approved', 'cancelled'],
            'approved' => ['in_repair', 'cancelled'],
            'in_repair' => ['repair_completed', 'cancelled'],
            'repair_completed' => ['in_reception', 'cancelled'],
            'in_reception' => ['vehicle_received', 'cancelled'],
            'vehicle_received' => ['cancelled'],
            'cancelled' => []
        ];
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $transitions = $this->getStatusTransitions();
        return in_array($newStatus, $transitions[$this->currentStatus] ?? []);
    }

    public function transitionTo(string $newStatus): self
    {
        if (!$this->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException("Transition non autorisée de '{$this->currentStatus}' vers '{$newStatus}'");
        }

        $this->currentStatus = $newStatus;
        $this->updatedAt = new \DateTimeImmutable();

        // Mettre à jour les dates selon le statut
        switch ($newStatus) {
            case 'in_prediagnostic':
                $this->startedDate = new \DateTime();
                break;
            case 'vehicle_received':
                $this->completedDate = new \DateTime();
                break;
            case 'cancelled':
                $this->closedDate = new \DateTime();
                break;
        }

        return $this;
    }

    public function startPrediagnostic(): self
    {
        return $this->transitionTo('in_prediagnostic');
    }

    public function completePrediagnostic(): self
    {
        return $this->transitionTo('prediagnostic_completed');
    }

    public function startQuote(): self
    {
        return $this->transitionTo('in_quote');
    }

    public function receiveQuote(): self
    {
        return $this->transitionTo('quote_received');
    }

    public function startApproval(): self
    {
        return $this->transitionTo('in_approval');
    }

    public function approveQuote(): self
    {
        return $this->transitionTo('approved');
    }

    public function startRepair(): self
    {
        return $this->transitionTo('in_repair');
    }

    public function completeRepair(): self
    {
        return $this->transitionTo('repair_completed');
    }

    public function startReception(): self
    {
        return $this->transitionTo('in_reception');
    }

    public function receiveVehicle(): self
    {
        return $this->transitionTo('vehicle_received');
    }

    public function cancel(): self
    {
        return $this->transitionTo('cancelled');
    }

    public function isCompleted(): bool
    {
        return $this->currentStatus === 'vehicle_received';
    }

    public function isCancelled(): bool
    {
        return $this->currentStatus === 'cancelled';
    }

    public function isInProgress(): bool
    {
        $inProgressStatuses = [
            'in_prediagnostic',
            'prediagnostic_completed',
            'in_quote',
            'quote_received',
            'in_approval',
            'approved',
            'in_repair',
            'repair_completed',
            'in_reception'
        ];
        return in_array($this->currentStatus, $inProgressStatuses);
    }

    public function getWorkflowProgress(): float
    {
        $statusOrder = [
            'reported' => 0,
            'in_prediagnostic' => 10,
            'prediagnostic_completed' => 20,
            'in_quote' => 30,
            'quote_received' => 40,
            'in_approval' => 50,
            'approved' => 60,
            'in_repair' => 70,
            'repair_completed' => 80,
            'in_reception' => 90,
            'vehicle_received' => 100,
            'cancelled' => 0
        ];

        return $statusOrder[$this->currentStatus] ?? 0;
    }

    public function getWorkflowStage(): string
    {
        $stageMapping = [
            'reported' => 'signalement',
            'in_prediagnostic' => 'prédiagnostic',
            'prediagnostic_completed' => 'prédiagnostic',
            'in_quote' => 'devis',
            'quote_received' => 'devis',
            'in_approval' => 'approbation',
            'approved' => 'approbation',
            'in_repair' => 'réparation',
            'repair_completed' => 'réparation',
            'in_reception' => 'réception',
            'vehicle_received' => 'réception',
            'cancelled' => 'annulé'
        ];

        return $stageMapping[$this->currentStatus] ?? 'inconnu';
    }

    public function getDaysInCurrentStatus(): int
    {
        $lastStatusChange = $this->getUpdatedAt();
        if (!$lastStatusChange) {
            return 0;
        }

        $now = new \DateTime();
        $diff = $now->diff($lastStatusChange);
        return $diff->days;
    }

    public function getEstimatedCompletionDate(): ?\DateTimeInterface
    {
        if ($this->isCompleted() || $this->isCancelled()) {
            return null;
        }

        $daysInCurrentStatus = $this->getDaysInCurrentStatus();
        $estimatedDaysRemaining = $this->getEstimatedDaysRemaining();

        $estimatedCompletion = new \DateTime();
        $estimatedCompletion->add(new \DateInterval("P{$estimatedDaysRemaining}D"));

        return $estimatedCompletion;
    }

    private function getEstimatedDaysRemaining(): int
    {
        $statusEstimates = [
            'reported' => 1,
            'in_prediagnostic' => 2,
            'prediagnostic_completed' => 1,
            'in_quote' => 3,
            'quote_received' => 1,
            'in_approval' => 2,
            'approved' => 1,
            'in_repair' => $this->estimatedDurationDays ?? 5,
            'repair_completed' => 1,
            'in_reception' => 1
        ];

        $remainingForCurrentStatus = $statusEstimates[$this->currentStatus] ?? 1;
        $daysInCurrentStatus = $this->getDaysInCurrentStatus();

        return max(0, $remainingForCurrentStatus - $daysInCurrentStatus);
    }
}
