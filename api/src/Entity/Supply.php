<?php

namespace App\Entity;

use App\Repository\SupplyRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SupplyRepository::class)]
#[ORM\Table(name: 'supplies')]
class Supply
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: SupplyCategory::class, inversedBy: 'supplies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?SupplyCategory $category = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $reference;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $oemReference = null;

    #[ORM\Column(type: 'string', length: 200)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $brand = null;

    #[ORM\Column(type: 'json')]
    private array $modelCompatibility = [];

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $unitPrice;

    #[ORM\Column(type: 'boolean')]
    private bool $isActive = true;

    #[ORM\Column(type: 'boolean')]
    private bool $isConsumable = false;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $warrantyMonths = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCategory(): ?SupplyCategory
    {
        return $this->category;
    }

    public function setCategory(?SupplyCategory $category): self
    {
        $this->category = $category;
        return $this;
    }

    public function getReference(): string
    {
        return $this->reference;
    }

    public function setReference(string $reference): self
    {
        $this->reference = $reference;
        return $this;
    }

    public function getOemReference(): ?string
    {
        return $this->oemReference;
    }

    public function setOemReference(?string $oemReference): self
    {
        $this->oemReference = $oemReference;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
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

    public function getBrand(): ?string
    {
        return $this->brand;
    }

    public function setBrand(?string $brand): self
    {
        $this->brand = $brand;
        return $this;
    }

    public function getModelCompatibility(): array
    {
        return $this->modelCompatibility;
    }

    public function setModelCompatibility(array $modelCompatibility): self
    {
        $this->modelCompatibility = $modelCompatibility;
        return $this;
    }

    public function addModelCompatibility(string $model): self
    {
        if (!in_array($model, $this->modelCompatibility)) {
            $this->modelCompatibility[] = $model;
        }
        return $this;
    }

    public function removeModelCompatibility(string $model): self
    {
        $key = array_search($model, $this->modelCompatibility);
        if ($key !== false) {
            unset($this->modelCompatibility[$key]);
            $this->modelCompatibility = array_values($this->modelCompatibility);
        }
        return $this;
    }

    public function getUnitPrice(): string
    {
        return $this->unitPrice;
    }

    public function setUnitPrice(string $unitPrice): self
    {
        if ((float) $unitPrice < 0) {
            throw new \InvalidArgumentException("Unit price cannot be negative");
        }
        $this->unitPrice = $unitPrice;
        return $this;
    }









    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function isConsumable(): bool
    {
        return $this->isConsumable;
    }

    public function setIsConsumable(bool $isConsumable): self
    {
        $this->isConsumable = $isConsumable;
        return $this;
    }

    public function getWarrantyMonths(): ?int
    {
        return $this->warrantyMonths;
    }

    public function setWarrantyMonths(?int $warrantyMonths): self
    {
        if ($warrantyMonths !== null && $warrantyMonths < 0) {
            throw new \InvalidArgumentException("Warranty months cannot be negative");
        }
        $this->warrantyMonths = $warrantyMonths;
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




    public function getUnitPriceFloat(): float
    {
        return (float) $this->unitPrice;
    }


    public function getFullName(): string
    {
        $parts = array_filter([
            $this->brand,
            $this->name,
            $this->reference
        ]);
        return implode(' - ', $parts);
    }






    public function isCompatibleWithModel(string $model): bool
    {
        return in_array($model, $this->modelCompatibility);
    }

    public function getCompatibilityString(): string
    {
        return implode(', ', $this->modelCompatibility);
    }
}
