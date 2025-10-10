<?php

namespace App\Entity;

use App\Repository\InterventionQuoteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InterventionQuoteRepository::class)]
#[ORM\Table(name: 'intervention_quotes')]
class InterventionQuote
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: VehicleIntervention::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?VehicleIntervention $intervention = null;

    #[ORM\ManyToOne(targetEntity: Garage::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Garage $garage = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $quoteNumber;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $quoteDate = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $validUntil = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $receivedDate = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $totalAmount;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $laborCost = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $partsCost = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $taxAmount = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isValidated = false;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $validatedBy = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $validatedAt = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'quote', targetEntity: InterventionQuoteLine::class, cascade: ['persist'])]
    private Collection $lines;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->quoteDate = new \DateTime();
        $this->totalAmount = '0.00';
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

    public function getGarage(): ?Garage
    {
        return $this->garage;
    }

    public function setGarage(?Garage $garage): self
    {
        $this->garage = $garage;
        return $this;
    }

    public function getQuoteNumber(): string
    {
        return $this->quoteNumber;
    }

    public function setQuoteNumber(string $quoteNumber): self
    {
        $this->quoteNumber = $quoteNumber;
        return $this;
    }

    public function getQuoteDate(): ?\DateTimeInterface
    {
        return $this->quoteDate;
    }

    public function setQuoteDate(?\DateTimeInterface $quoteDate): self
    {
        $this->quoteDate = $quoteDate;
        return $this;
    }

    public function getValidUntil(): ?\DateTimeInterface
    {
        return $this->validUntil;
    }

    public function setValidUntil(?\DateTimeInterface $validUntil): self
    {
        $this->validUntil = $validUntil;
        return $this;
    }

    public function getReceivedDate(): ?\DateTimeInterface
    {
        return $this->receivedDate;
    }

    public function setReceivedDate(?\DateTimeInterface $receivedDate): self
    {
        $this->receivedDate = $receivedDate;
        return $this;
    }

    public function getTotalAmount(): string
    {
        return $this->totalAmount;
    }

    public function setTotalAmount(string $totalAmount): self
    {
        if ($totalAmount < 0) {
            throw new \InvalidArgumentException("Total amount cannot be negative");
        }
        $this->totalAmount = $totalAmount;
        return $this;
    }

    public function getLaborCost(): ?string
    {
        return $this->laborCost;
    }

    public function setLaborCost(?string $laborCost): self
    {
        if ($laborCost !== null && $laborCost < 0) {
            throw new \InvalidArgumentException("Labor cost cannot be negative");
        }
        $this->laborCost = $laborCost;
        return $this;
    }

    public function getPartsCost(): ?string
    {
        return $this->partsCost;
    }

    public function setPartsCost(?string $partsCost): self
    {
        if ($partsCost !== null && $partsCost < 0) {
            throw new \InvalidArgumentException("Parts cost cannot be negative");
        }
        $this->partsCost = $partsCost;
        return $this;
    }

    public function getTaxAmount(): ?string
    {
        return $this->taxAmount;
    }

    public function setTaxAmount(?string $taxAmount): self
    {
        if ($taxAmount !== null && $taxAmount < 0) {
            throw new \InvalidArgumentException("Tax amount cannot be negative");
        }
        $this->taxAmount = $taxAmount;
        return $this;
    }


    public function isValidated(): bool
    {
        return $this->isValidated;
    }

    public function setIsValidated(bool $isValidated): self
    {
        $this->isValidated = $isValidated;
        return $this;
    }

    public function getValidatedBy(): ?int
    {
        return $this->validatedBy;
    }

    public function setValidatedBy(?int $validatedBy): self
    {
        $this->validatedBy = $validatedBy;
        return $this;
    }

    public function getValidatedAt(): ?\DateTimeInterface
    {
        return $this->validatedAt;
    }

    public function setValidatedAt(?\DateTimeInterface $validatedAt): self
    {
        $this->validatedAt = $validatedAt;
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

    // Méthodes utilitaires

    public function validate(int $validatedBy): self
    {
        $this->isValidated = true;
        $this->validatedBy = $validatedBy;
        $this->validatedAt = new \DateTime();
        return $this;
    }

    public function getTotalAmountFloat(): float
    {
        return (float) $this->totalAmount;
    }

    public function getLaborCostFloat(): ?float
    {
        return $this->laborCost ? (float) $this->laborCost : null;
    }

    public function getPartsCostFloat(): ?float
    {
        return $this->partsCost ? (float) $this->partsCost : null;
    }

    public function getTaxAmountFloat(): ?float
    {
        return $this->taxAmount ? (float) $this->taxAmount : null;
    }

    public function calculateTotalFromComponents(): self
    {
        $labor = $this->getLaborCostFloat() ?? 0;
        $parts = $this->getPartsCostFloat() ?? 0;
        $tax = $this->getTaxAmountFloat() ?? 0;
        
        $total = $labor + $parts + $tax;
        $this->setTotalAmount((string) $total);
        
        return $this;
    }

    public function isWithinBudget(float $maxBudget): bool
    {
        return $this->getTotalAmountFloat() <= $maxBudget;
    }

    public function getRemainingBudget(float $maxBudget): float
    {
        return max(0, $maxBudget - $this->getTotalAmountFloat());
    }

    /**
     * @return Collection<int, InterventionQuoteLine>
     */
    public function getLines(): Collection
    {
        return $this->lines;
    }

    public function addLine(InterventionQuoteLine $line): static
    {
        if (!$this->lines->contains($line)) {
            $this->lines->add($line);
            $line->setQuote($this);
        }
        return $this;
    }

    public function removeLine(InterventionQuoteLine $line): static
    {
        if ($this->lines->removeElement($line)) {
            if ($line->getQuote() === $this) {
                $line->setQuote(null);
            }
        }
        return $this;
    }

    /**
     * Vérifie si le devis est expiré
     */
    public function isExpired(): bool
    {
        if (!$this->validUntil) {
            return false; // Pas de date d'expiration = jamais expiré
        }
        
        return $this->validUntil < new \DateTime();
    }

    /**
     * Calcule le nombre de jours jusqu'à l'expiration
     */
    public function getDaysUntilExpiry(): ?int
    {
        if (!$this->validUntil) {
            return null; // Pas de date d'expiration
        }
        
        $now = new \DateTime();
        $diff = $now->diff($this->validUntil);
        
        // Si la date est dans le passé, retourner un nombre négatif
        if ($this->validUntil < $now) {
            return -$diff->days;
        }
        
        return $diff->days;
    }

    /**
     * Recalcule le totalAmount à partir des lignes du devis
     */
    public function recalculateTotalAmount(): void
    {
        $totalAmount = 0.0;
        $laborCost = 0.0;
        $partsCost = 0.0;
        $taxAmount = 0.0;

        foreach ($this->lines as $line) {
            $lineTotal = (float) $line->getLineTotal();
            $totalAmount += $lineTotal;

            // Calculer les coûts par type
            if ($line->getWorkType() === 'labor') {
                $laborCost += $lineTotal;
            } elseif ($line->getWorkType() === 'supply' && $line->getSupply()) {
                $partsCost += $lineTotal;
            }

            // Calculer les taxes
            if ($line->getTaxRate()) {
                $subtotal = (float) $line->getQuantity() * (float) $line->getEffectiveUnitPrice();
                
                // Appliquer la remise
                if ($line->getDiscountPercentage()) {
                    $discount = $subtotal * ((float) $line->getDiscountPercentage() / 100);
                    $subtotal -= $discount;
                } elseif ($line->getDiscountAmount()) {
                    $subtotal -= (float) $line->getDiscountAmount();
                }
                
                $tax = $subtotal * ((float) $line->getTaxRate() / 100);
                $taxAmount += $tax;
            }
        }

        // Mettre à jour les montants
        $this->totalAmount = (string) round($totalAmount, 2);
        $this->laborCost = $laborCost > 0 ? (string) round($laborCost, 2) : null;
        $this->partsCost = $partsCost > 0 ? (string) round($partsCost, 2) : null;
        $this->taxAmount = $taxAmount > 0 ? (string) round($taxAmount, 2) : null;
    }
}
