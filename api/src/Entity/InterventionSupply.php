<?php

namespace App\Entity;

use App\Repository\InterventionSupplyRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: InterventionSupplyRepository::class)]
#[ORM\Table(name: 'intervention_supplies')]
class InterventionSupply
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['intervention_supply:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: VehicleIntervention::class, inversedBy: 'supplies')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['intervention_supply:read'])]
    private ?VehicleIntervention $intervention = null;

    #[ORM\ManyToOne(targetEntity: Supply::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['intervention_supply:read'])]
    private ?Supply $supply = null;

    #[ORM\ManyToOne(targetEntity: Model::class)]
    #[Groups(['intervention_supply:read'])]
    private ?Model $model = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['intervention_supply:read', 'intervention_supply:write'])]
    private ?string $quantityUsed = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['intervention_supply:read', 'intervention_supply:write'])]
    private ?string $unitPrice = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['intervention_supply:read'])]
    private ?string $totalCost = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['intervention_supply:read', 'intervention_supply:write'])]
    private ?int $year = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['intervention_supply:read'])]
    private ?User $usedBy = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['intervention_supply:read'])]
    private ?\DateTimeInterface $usedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['intervention_supply:read', 'intervention_supply:write'])]
    private ?string $notes = null;

    public function __construct()
    {
        $this->usedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getIntervention(): ?VehicleIntervention
    {
        return $this->intervention;
    }

    public function setIntervention(?VehicleIntervention $intervention): static
    {
        $this->intervention = $intervention;
        return $this;
    }

    public function getSupply(): ?Supply
    {
        return $this->supply;
    }

    public function setSupply(?Supply $supply): static
    {
        $this->supply = $supply;
        return $this;
    }

    public function getModel(): ?Model
    {
        return $this->model;
    }

    public function setModel(?Model $model): static
    {
        $this->model = $model;
        return $this;
    }

    public function getQuantityUsed(): ?string
    {
        return $this->quantityUsed;
    }

    public function setQuantityUsed(string $quantityUsed): static
    {
        $this->quantityUsed = $quantityUsed;
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

    public function getYear(): ?int
    {
        return $this->year;
    }

    public function setYear(?int $year): static
    {
        $this->year = $year;
        return $this;
    }

    public function getUsedBy(): ?User
    {
        return $this->usedBy;
    }

    public function setUsedBy(?User $usedBy): static
    {
        $this->usedBy = $usedBy;
        return $this;
    }

    public function getUsedAt(): ?\DateTimeInterface
    {
        return $this->usedAt;
    }

    public function setUsedAt(\DateTimeInterface $usedAt): static
    {
        $this->usedAt = $usedAt;
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

    public function calculateTotalCost(): string
    {
        $total = (float) $this->quantityUsed * (float) $this->unitPrice;
        return (string) round($total, 2);
    }
}
