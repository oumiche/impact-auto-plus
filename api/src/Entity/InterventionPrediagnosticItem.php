<?php

namespace App\Entity;

use App\Repository\InterventionPrediagnosticItemRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: InterventionPrediagnosticItemRepository::class)]
#[ORM\Table(name: 'intervention_prediagnostic_items')]
class InterventionPrediagnosticItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['prediagnostic_item:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: InterventionPrediagnostic::class, inversedBy: 'items')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['prediagnostic_item:read'])]
    private ?InterventionPrediagnostic $prediagnostic = null;

    #[ORM\Column(length: 200)]
    #[Groups(['prediagnostic_item:read', 'prediagnostic_item:write'])]
    private ?string $operationLabel = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['prediagnostic_item:read', 'prediagnostic_item:write'])]
    private bool $isExchange = false;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['prediagnostic_item:read', 'prediagnostic_item:write'])]
    private bool $isControl = false;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['prediagnostic_item:read', 'prediagnostic_item:write'])]
    private bool $isRepair = false;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['prediagnostic_item:read', 'prediagnostic_item:write'])]
    private bool $isPainting = false;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['prediagnostic_item:read', 'prediagnostic_item:write'])]
    private ?int $orderIndex = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPrediagnostic(): ?InterventionPrediagnostic
    {
        return $this->prediagnostic;
    }

    public function setPrediagnostic(?InterventionPrediagnostic $prediagnostic): static
    {
        $this->prediagnostic = $prediagnostic;
        return $this;
    }

    public function getOperationLabel(): ?string
    {
        return $this->operationLabel;
    }

    public function setOperationLabel(string $operationLabel): static
    {
        $this->operationLabel = $operationLabel;
        return $this;
    }

    public function isExchange(): bool
    {
        return $this->isExchange;
    }

    public function setIsExchange(bool $isExchange): static
    {
        $this->isExchange = $isExchange;
        return $this;
    }

    public function isControl(): bool
    {
        return $this->isControl;
    }

    public function setIsControl(bool $isControl): static
    {
        $this->isControl = $isControl;
        return $this;
    }

    public function isRepair(): bool
    {
        return $this->isRepair;
    }

    public function setIsRepair(bool $isRepair): static
    {
        $this->isRepair = $isRepair;
        return $this;
    }

    public function isPainting(): bool
    {
        return $this->isPainting;
    }

    public function setIsPainting(bool $isPainting): static
    {
        $this->isPainting = $isPainting;
        return $this;
    }

    public function getOrderIndex(): ?int
    {
        return $this->orderIndex;
    }

    public function setOrderIndex(int $orderIndex): static
    {
        $this->orderIndex = $orderIndex;
        return $this;
    }

    public function getOperationTypes(): array
    {
        $types = [];
        if ($this->isExchange) $types[] = 'exchange';
        if ($this->isControl) $types[] = 'control';
        if ($this->isRepair) $types[] = 'repair';
        if ($this->isPainting) $types[] = 'painting';
        return $types;
    }
}
