<?php

namespace App\Entity;

use App\Repository\VehicleAssignmentRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VehicleAssignmentRepository::class)]
#[ORM\Table(name: 'vehicle_assignments')]
class VehicleAssignment
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
    #[ORM\JoinColumn(nullable: false)]
    private ?Driver $driver = null;

    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $assignedDate = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $unassignedDate = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = 'active';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->assignedDate = new \DateTime();
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

    public function getAssignedDate(): ?\DateTimeInterface
    {
        return $this->assignedDate;
    }

    public function setAssignedDate(?\DateTimeInterface $assignedDate): self
    {
        $this->assignedDate = $assignedDate;
        return $this;
    }

    public function getUnassignedDate(): ?\DateTimeInterface
    {
        return $this->unassignedDate;
    }

    public function setUnassignedDate(?\DateTimeInterface $unassignedDate): self
    {
        $this->unassignedDate = $unassignedDate;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $validStatuses = ['active', 'inactive', 'terminated'];
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
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isInactive(): bool
    {
        return $this->status === 'inactive';
    }

    public function isTerminated(): bool
    {
        return $this->status === 'terminated';
    }

    public function getAssignmentDuration(): ?int
    {
        if (!$this->assignedDate) {
            return null;
        }
        
        $endDate = $this->unassignedDate ?? new \DateTime();
        $diff = $this->assignedDate->diff($endDate);
        return $diff->days;
    }

    public function terminate(?\DateTimeInterface $unassignedDate = null): self
    {
        $this->status = 'terminated';
        $this->unassignedDate = $unassignedDate ?? new \DateTime();
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function activate(): self
    {
        $this->status = 'active';
        $this->unassignedDate = null;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function deactivate(): self
    {
        $this->status = 'inactive';
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getStatusLabel(): string
    {
        $statuses = [
            'active' => 'Actif',
            'inactive' => 'Inactif',
            'terminated' => 'Terminé'
        ];
        return $statuses[$this->status] ?? 'Inconnu';
    }
}
