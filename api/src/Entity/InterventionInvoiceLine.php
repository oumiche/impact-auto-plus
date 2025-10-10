<?php

namespace App\Entity;

use App\Repository\InterventionInvoiceLineRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: InterventionInvoiceLineRepository::class)]
#[ORM\Table(name: 'intervention_invoice_lines')]
class InterventionInvoiceLine
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['invoice_line:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: InterventionInvoice::class, inversedBy: 'lines')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['invoice_line:read'])]
    private ?InterventionInvoice $invoice = null;

    #[ORM\ManyToOne(targetEntity: Supply::class)]
    #[Groups(['invoice_line:read'])]
    private ?Supply $supply = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?int $lineNumber = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $workType = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $quantity = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $unitPrice = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 5, scale: 2, nullable: true)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $discountPercentage = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $discountAmount = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 5, scale: 2, nullable: true)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $taxRate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['invoice_line:read'])]
    private ?string $lineTotal = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['invoice_line:read', 'invoice_line:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['invoice_line:read'])]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getInvoice(): ?InterventionInvoice
    {
        return $this->invoice;
    }

    public function setInvoice(?InterventionInvoice $invoice): static
    {
        $this->invoice = $invoice;
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

    public function getLineNumber(): ?int
    {
        return $this->lineNumber;
    }

    public function setLineNumber(int $lineNumber): static
    {
        $this->lineNumber = $lineNumber;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getWorkType(): ?string
    {
        return $this->workType;
    }

    public function setWorkType(?string $workType): static
    {
        $this->workType = $workType;
        return $this;
    }

    public function getQuantity(): ?string
    {
        return $this->quantity;
    }

    public function setQuantity(string $quantity): static
    {
        $this->quantity = $quantity;
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

    public function getDiscountPercentage(): ?string
    {
        return $this->discountPercentage;
    }

    public function setDiscountPercentage(?string $discountPercentage): static
    {
        $this->discountPercentage = $discountPercentage;
        return $this;
    }

    public function getDiscountAmount(): ?string
    {
        return $this->discountAmount;
    }

    public function setDiscountAmount(?string $discountAmount): static
    {
        $this->discountAmount = $discountAmount;
        return $this;
    }

    public function getTaxRate(): ?string
    {
        return $this->taxRate;
    }

    public function setTaxRate(?string $taxRate): static
    {
        $this->taxRate = $taxRate;
        return $this;
    }

    public function getLineTotal(): ?string
    {
        return $this->lineTotal;
    }

    public function setLineTotal(string $lineTotal): static
    {
        $this->lineTotal = $lineTotal;
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

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function calculateLineTotal(): string
    {
        $subtotal = (float) $this->quantity * (float) $this->unitPrice;
        
        // Appliquer la remise
        if ($this->discountPercentage) {
            $discount = $subtotal * ((float) $this->discountPercentage / 100);
            $subtotal -= $discount;
        } elseif ($this->discountAmount) {
            $subtotal -= (float) $this->discountAmount;
        }
        
        // Appliquer la taxe
        if ($this->taxRate) {
            $tax = $subtotal * ((float) $this->taxRate / 100);
            $subtotal += $tax;
        }
        
        return (string) round($subtotal, 2);
    }
}
