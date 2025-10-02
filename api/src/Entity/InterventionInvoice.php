<?php

namespace App\Entity;

use App\Repository\InterventionInvoiceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InterventionInvoiceRepository::class)]
#[ORM\Table(name: 'intervention_invoices')]
class InterventionInvoice
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

    #[ORM\Column(type: 'string', length: 50)]
    private string $invoiceNumber;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $invoiceDate = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $dueDate = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $subtotal;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $taxAmount;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $totalAmount;

    #[ORM\Column(type: 'string', length: 20)]
    private string $paymentStatus = 'pending';

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $paidAt = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $paymentMethod = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'invoice', targetEntity: InterventionInvoiceLine::class, cascade: ['persist'])]
    private Collection $lines;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->invoiceDate = new \DateTime();
        $this->subtotal = '0.00';
        $this->taxAmount = '0.00';
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

    public function getQuote(): ?InterventionQuote
    {
        return $this->quote;
    }

    public function setQuote(?InterventionQuote $quote): self
    {
        $this->quote = $quote;
        return $this;
    }

    public function getInvoiceNumber(): string
    {
        return $this->invoiceNumber;
    }

    public function setInvoiceNumber(string $invoiceNumber): self
    {
        $this->invoiceNumber = $invoiceNumber;
        return $this;
    }

    public function getInvoiceDate(): ?\DateTimeInterface
    {
        return $this->invoiceDate;
    }

    public function setInvoiceDate(?\DateTimeInterface $invoiceDate): self
    {
        $this->invoiceDate = $invoiceDate;
        return $this;
    }

    public function getDueDate(): ?\DateTimeInterface
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeInterface $dueDate): self
    {
        $this->dueDate = $dueDate;
        return $this;
    }

    public function getSubtotal(): string
    {
        return $this->subtotal;
    }

    public function setSubtotal(string $subtotal): self
    {
        if ($subtotal < 0) {
            throw new \InvalidArgumentException("Subtotal cannot be negative");
        }
        $this->subtotal = $subtotal;
        return $this;
    }

    public function getTaxAmount(): string
    {
        return $this->taxAmount;
    }

    public function setTaxAmount(string $taxAmount): self
    {
        if ($taxAmount < 0) {
            throw new \InvalidArgumentException("Tax amount cannot be negative");
        }
        $this->taxAmount = $taxAmount;
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

    public function getPaymentStatus(): string
    {
        return $this->paymentStatus;
    }

    public function setPaymentStatus(string $paymentStatus): self
    {
        $validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
        if (!in_array($paymentStatus, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid payment status: {$paymentStatus}");
        }
        $this->paymentStatus = $paymentStatus;
        return $this;
    }

    public function getPaidAt(): ?\DateTimeInterface
    {
        return $this->paidAt;
    }

    public function setPaidAt(?\DateTimeInterface $paidAt): self
    {
        $this->paidAt = $paidAt;
        return $this;
    }

    public function getPaymentMethod(): ?string
    {
        return $this->paymentMethod;
    }

    public function setPaymentMethod(?string $paymentMethod): self
    {
        $this->paymentMethod = $paymentMethod;
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
    public function isPaid(): bool
    {
        return $this->paymentStatus === 'paid';
    }

    public function isOverdue(): bool
    {
        if (!$this->dueDate || $this->isPaid()) {
            return false;
        }
        return $this->dueDate < new \DateTime();
    }

    public function getDaysUntilDue(): int
    {
        if (!$this->dueDate) {
            return 0;
        }
        $now = new \DateTime();
        $due = $this->dueDate;
        $diff = $now->diff($due);
        return $due > $now ? $diff->days : -$diff->days;
    }

    public function getDaysOverdue(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        $now = new \DateTime();
        $due = $this->dueDate;
        $diff = $now->diff($due);
        return $diff->days;
    }

    public function markAsPaid(?string $paymentMethod = null): self
    {
        $this->paymentStatus = 'paid';
        $this->paidAt = new \DateTime();
        if ($paymentMethod) {
            $this->paymentMethod = $paymentMethod;
        }
        return $this;
    }

    public function calculateTotalFromSubtotal(): self
    {
        $subtotal = (float) $this->subtotal;
        $tax = (float) $this->taxAmount;
        $total = $subtotal + $tax;
        $this->setTotalAmount((string) $total);
        return $this;
    }

    public function getSubtotalFloat(): float
    {
        return (float) $this->subtotal;
    }

    public function getTaxAmountFloat(): float
    {
        return (float) $this->taxAmount;
    }

    public function getTotalAmountFloat(): float
    {
        return (float) $this->totalAmount;
    }

    public function getPaymentStatusLabel(): string
    {
        $statuses = [
            'pending' => 'En attente',
            'paid' => 'Payée',
            'overdue' => 'En retard',
            'cancelled' => 'Annulée'
        ];
        return $statuses[$this->paymentStatus] ?? 'Inconnu';
    }

    public function isPending(): bool
    {
        return $this->paymentStatus === 'pending';
    }

    public function isCancelled(): bool
    {
        return $this->paymentStatus === 'cancelled';
    }

    public function needsPayment(): bool
    {
        return $this->isPending() || $this->isOverdue();
    }

    public function getPaymentMethodLabel(): ?string
    {
        if (!$this->paymentMethod) {
            return null;
        }
        
        $methods = [
            'cash' => 'Espèces',
            'check' => 'Chèque',
            'bank_transfer' => 'Virement bancaire',
            'credit_card' => 'Carte de crédit',
            'debit_card' => 'Carte de débit',
            'online' => 'Paiement en ligne'
        ];
        
        return $methods[$this->paymentMethod] ?? $this->paymentMethod;
    }

    /**
     * @return Collection<int, InterventionInvoiceLine>
     */
    public function getLines(): Collection
    {
        return $this->lines;
    }

    public function addLine(InterventionInvoiceLine $line): static
    {
        if (!$this->lines->contains($line)) {
            $this->lines->add($line);
            $line->setInvoice($this);
        }
        return $this;
    }

    public function removeLine(InterventionInvoiceLine $line): static
    {
        if ($this->lines->removeElement($line)) {
            if ($line->getInvoice() === $this) {
                $line->setInvoice(null);
            }
        }
        return $this;
    }
}
