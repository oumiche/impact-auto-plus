<?php

namespace App\Entity;

use App\Repository\InterventionWorkAuthorizationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InterventionWorkAuthorizationRepository::class)]
#[ORM\Table(name: 'intervention_work_authorizations')]
class InterventionWorkAuthorization
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: VehicleIntervention::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?VehicleIntervention $intervention = null;

    #[ORM\ManyToOne(targetEntity: InterventionQuote::class)]
    private ?InterventionQuote $quote = null;

    #[ORM\Column(type: 'integer')]
    private int $authorizedBy;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $authorizationDate = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $maxAmount = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $specialInstructions = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isUrgent = false;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'authorization', targetEntity: InterventionWorkAuthorizationLine::class, cascade: ['persist'])]
    private Collection $lines;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->authorizationDate = new \DateTime();
        $this->lines = new ArrayCollection();
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

    public function getQuote(): ?InterventionQuote
    {
        return $this->quote;
    }

    public function setQuote(?InterventionQuote $quote): self
    {
        $this->quote = $quote;
        return $this;
    }

    public function getAuthorizedBy(): int
    {
        return $this->authorizedBy;
    }

    public function setAuthorizedBy(int $authorizedBy): self
    {
        $this->authorizedBy = $authorizedBy;
        return $this;
    }

    public function getAuthorizationDate(): ?\DateTimeInterface
    {
        return $this->authorizationDate;
    }

    public function setAuthorizationDate(?\DateTimeInterface $authorizationDate): self
    {
        $this->authorizationDate = $authorizationDate;
        return $this;
    }

    public function getMaxAmount(): ?string
    {
        return $this->maxAmount;
    }

    public function setMaxAmount(?string $maxAmount): self
    {
        if ($maxAmount !== null && $maxAmount < 0) {
            throw new \InvalidArgumentException("Max amount cannot be negative");
        }
        $this->maxAmount = $maxAmount;
        return $this;
    }

    public function getSpecialInstructions(): ?string
    {
        return $this->specialInstructions;
    }

    public function setSpecialInstructions(?string $specialInstructions): self
    {
        $this->specialInstructions = $specialInstructions;
        return $this;
    }

    public function isUrgent(): bool
    {
        return $this->isUrgent;
    }

    public function setIsUrgent(bool $isUrgent): self
    {
        $this->isUrgent = $isUrgent;
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
    public function isWithinBudget(float $actualCost): bool
    {
        if (!$this->maxAmount) {
            return true; // Pas de limite définie
        }
        return $actualCost <= (float) $this->maxAmount;
    }

    public function getRemainingBudget(float $actualCost): ?float
    {
        if (!$this->maxAmount) {
            return null;
        }
        return max(0, (float) $this->maxAmount - $actualCost);
    }

    public function getMaxAmountFloat(): ?float
    {
        return $this->maxAmount ? (float) $this->maxAmount : null;
    }

    public function isValidated(): bool
    {
        return $this->authorizationDate !== null;
    }

    public function markAsValidated(): self
    {
        $this->authorizationDate = new \DateTime();
        return $this;
    }

    public function isExpired(int $validityDays = 30): bool
    {
        if (!$this->authorizationDate) {
            return false;
        }
        
        $expiryDate = clone $this->authorizationDate;
        $expiryDate = $expiryDate instanceof \DateTime ? $expiryDate->modify('+' . $validityDays . ' days') : $expiryDate;
        
        return $expiryDate < new \DateTime();
    }

    public function getDaysUntilExpiry(int $validityDays = 30): int
    {
        if (!$this->authorizationDate) {
            return 0;
        }
        
        $expiryDate = clone $this->authorizationDate;
        $expiryDate = $expiryDate instanceof \DateTime ? $expiryDate->modify('+' . $validityDays . ' days') : $expiryDate;
        
        $now = new \DateTime();
        $diff = $now->diff($expiryDate);
        return $expiryDate > $now ? $diff->days : -$diff->days;
    }

    public function canExceedBudget(): bool
    {
        return $this->maxAmount === null;
    }

    public function getBudgetUtilization(float $actualCost): ?float
    {
        if (!$this->maxAmount) {
            return null;
        }
        
        $maxAmount = (float) $this->maxAmount;
        if ($maxAmount == 0) {
            return null;
        }
        
        return min(100, ($actualCost / $maxAmount) * 100);
    }

    /**
     * @return Collection<int, InterventionWorkAuthorizationLine>
     */
    public function getLines(): Collection
    {
        return $this->lines;
    }

    public function addLine(InterventionWorkAuthorizationLine $line): static
    {
        if (!$this->lines->contains($line)) {
            $this->lines->add($line);
            $line->setAuthorization($this);
        }
        return $this;
    }

    public function removeLine(InterventionWorkAuthorizationLine $line): static
    {
        if ($this->lines->removeElement($line)) {
            if ($line->getAuthorization() === $this) {
                $line->setAuthorization(null);
            }
        }
        return $this;
    }
}
