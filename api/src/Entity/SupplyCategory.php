<?php

namespace App\Entity;

use App\Repository\SupplyCategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SupplyCategoryRepository::class)]
#[ORM\Table(name: 'supply_categories')]
class SupplyCategory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id')]
    private ?self $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class, cascade: ['remove'])]
    private Collection $children;

    #[ORM\OneToMany(mappedBy: 'category', targetEntity: Supply::class)]
    private Collection $supplies;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $icon = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->children = new ArrayCollection();
        $this->supplies = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): self
    {
        $this->parent = $parent;
        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getChildren(): Collection
    {
        return $this->children;
    }

    public function addChild(self $child): self
    {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }
        return $this;
    }

    public function removeChild(self $child): self
    {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, Supply>
     */
    public function getSupplies(): Collection
    {
        return $this->supplies;
    }

    public function addSupply(Supply $supply): self
    {
        if (!$this->supplies->contains($supply)) {
            $this->supplies->add($supply);
            $supply->setCategory($this);
        }
        return $this;
    }

    public function removeSupply(Supply $supply): self
    {
        if ($this->supplies->removeElement($supply)) {
            if ($supply->getCategory() === $this) {
                $supply->setCategory(null);
            }
        }
        return $this;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function setIcon(?string $icon): self
    {
        $this->icon = $icon;
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
    public function isRootCategory(): bool
    {
        return $this->parent === null;
    }

    public function hasParent(): bool
    {
        return $this->parent !== null;
    }

    public function getLevel(): int
    {
        $level = 0;
        $current = $this->parent;
        while ($current !== null) {
            $level++;
            $current = $current->getParent();
        }
        return $level;
    }

    public function getPath(): string
    {
        $path = [$this->name];
        $current = $this->parent;
        while ($current !== null) {
            array_unshift($path, $current->getName());
            $current = $current->getParent();
        }
        return implode(' > ', $path);
    }

    public function getAllChildren(): array
    {
        $allChildren = [];
        foreach ($this->children as $child) {
            $allChildren[] = $child;
            $allChildren = array_merge($allChildren, $child->getAllChildren());
        }
        return $allChildren;
    }

    public function getSuppliesCount(): int
    {
        return $this->supplies->count();
    }

    public function getTotalSuppliesCount(): int
    {
        $count = $this->getSuppliesCount();
        foreach ($this->getAllChildren() as $child) {
            $count += $child->getSuppliesCount();
        }
        return $count;
    }

    public function isLeaf(): bool
    {
        return $this->children->isEmpty();
    }

    public function hasSupplies(): bool
    {
        return $this->getSuppliesCount() > 0;
    }

    public function getFullName(): string
    {
        return $this->getPath();
    }
}
