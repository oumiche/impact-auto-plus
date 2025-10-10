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

    #[ORM\ManyToOne(targetEntity: Collaborateur::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Collaborateur $authorizedBy = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $authorizationNumber;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $authorizationDate = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $specialInstructions = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isValidated = false;

    #[ORM\OneToMany(mappedBy: 'authorization', targetEntity: InterventionWorkAuthorizationLine::class, cascade: ['persist', 'remove'])]
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

    public function getAuthorizedBy(): ?Collaborateur
    {
        return $this->authorizedBy;
    }

    public function setAuthorizedBy(?Collaborateur $authorizedBy): self
    {
        $this->authorizedBy = $authorizedBy;
        return $this;
    }

    /**
     * Retourne l'ID du collaborateur qui a autorisé (pour compatibilité)
     */
    public function getAuthorizedById(): ?int
    {
        return $this->authorizedBy ? $this->authorizedBy->getId() : null;
    }

    public function getAuthorizationNumber(): string
    {
        return $this->authorizationNumber;
    }

    public function setAuthorizationNumber(string $authorizationNumber): self
    {
        $this->authorizationNumber = $authorizationNumber;
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


    public function getSpecialInstructions(): ?string
    {
        return $this->specialInstructions;
    }

    public function setSpecialInstructions(?string $specialInstructions): self
    {
        $this->specialInstructions = $specialInstructions;
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

    public function isValidated(): bool
    {
        return $this->isValidated;
    }

    public function setIsValidated(bool $isValidated): self
    {
        $this->isValidated = $isValidated;
        return $this;
    }

    public function markAsValidated(): self
    {
        $this->isValidated = true;
        $this->authorizationDate = new \DateTime();
        return $this;
    }

    public function setValidatedAt(?\DateTimeInterface $validatedAt): self
    {
        $this->authorizationDate = $validatedAt;
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
