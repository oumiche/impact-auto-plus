<?php

namespace App\Entity;

use App\Repository\SupplierRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SupplierRepository::class)]
#[ORM\Table(name: 'suppliers')]
class Supplier
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tenant $tenant = null;

    #[ORM\Column(type: 'string', length: 200)]
    private string $name;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $contactPerson = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $city = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $postalCode = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $country = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $website = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isActive = true;

    #[ORM\Column(type: 'decimal', precision: 3, scale: 2)]
    private string $rating = '0.00';

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $paymentTerms = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $deliveryTimeDays = null;

    #[ORM\OneToMany(targetEntity: Supply::class, mappedBy: 'supplier')]
    private Collection $supplies;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getContactPerson(): ?string
    {
        return $this->contactPerson;
    }

    public function setContactPerson(?string $contactPerson): self
    {
        $this->contactPerson = $contactPerson;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): self
    {
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email format: {$email}");
        }
        $this->email = $email;
        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): self
    {
        $this->phone = $phone;
        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): self
    {
        $this->address = $address;
        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): self
    {
        $this->city = $city;
        return $this;
    }

    public function getPostalCode(): ?string
    {
        return $this->postalCode;
    }

    public function setPostalCode(?string $postalCode): self
    {
        $this->postalCode = $postalCode;
        return $this;
    }

    public function getCountry(): ?string
    {
        return $this->country;
    }

    public function setCountry(?string $country): self
    {
        $this->country = $country;
        return $this;
    }

    public function getWebsite(): ?string
    {
        return $this->website;
    }

    public function setWebsite(?string $website): self
    {
        if ($website && !filter_var($website, FILTER_VALIDATE_URL)) {
            throw new \InvalidArgumentException("Invalid website URL: {$website}");
        }
        $this->website = $website;
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

    public function getRating(): string
    {
        return $this->rating;
    }

    public function setRating(string $rating): self
    {
        $ratingFloat = (float) $rating;
        if ($ratingFloat < 0 || $ratingFloat > 5) {
            throw new \InvalidArgumentException("Rating must be between 0 and 5");
        }
        $this->rating = $rating;
        return $this;
    }

    public function getPaymentTerms(): ?string
    {
        return $this->paymentTerms;
    }

    public function setPaymentTerms(?string $paymentTerms): self
    {
        $this->paymentTerms = $paymentTerms;
        return $this;
    }

    public function getDeliveryTimeDays(): ?int
    {
        return $this->deliveryTimeDays;
    }

    public function setDeliveryTimeDays(?int $deliveryTimeDays): self
    {
        if ($deliveryTimeDays !== null && $deliveryTimeDays < 0) {
            throw new \InvalidArgumentException("Delivery time cannot be negative");
        }
        $this->deliveryTimeDays = $deliveryTimeDays;
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
    public function getFullAddress(): string
    {
        $parts = array_filter([
            $this->address,
            $this->postalCode,
            $this->city,
            $this->country
        ]);
        return implode(', ', $parts);
    }

    public function getRatingFloat(): float
    {
        return (float) $this->rating;
    }

    public function isReliable(): bool
    {
        return $this->getRatingFloat() >= 4.0;
    }

    public function getSuppliesCount(): int
    {
        return $this->supplies->count();
    }

    public function hasSupplies(): bool
    {
        return $this->getSuppliesCount() > 0;
    }

    public function getRatingStars(): int
    {
        return (int) round($this->getRatingFloat());
    }

    public function getRatingLabel(): string
    {
        $rating = $this->getRatingFloat();
        if ($rating >= 4.5) return 'Excellent';
        if ($rating >= 4.0) return 'Très bon';
        if ($rating >= 3.0) return 'Bon';
        if ($rating >= 2.0) return 'Moyen';
        if ($rating >= 1.0) return 'Mauvais';
        return 'Très mauvais';
    }

    public function getContactInfo(): array
    {
        return [
            'name' => $this->name,
            'contactPerson' => $this->contactPerson,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website
        ];
    }

    public function getAddressInfo(): array
    {
        return [
            'address' => $this->address,
            'city' => $this->city,
            'postalCode' => $this->postalCode,
            'country' => $this->country,
            'fullAddress' => $this->getFullAddress()
        ];
    }
}
