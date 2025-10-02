<?php

namespace App\Entity;

use App\Repository\InterventionFieldVerificationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InterventionFieldVerificationRepository::class)]
#[ORM\Table(name: 'intervention_field_verifications')]
class InterventionFieldVerification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: VehicleIntervention::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?VehicleIntervention $intervention = null;

    #[ORM\Column(type: 'integer')]
    private int $verifiedBy;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $verificationDate = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $verificationType = 'before_work';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $findings = null;

    #[ORM\Column(type: 'integer')]
    private int $photosTaken = 0;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $isSatisfactory = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $recommendations = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->verificationDate = new \DateTime();
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

    public function getVerifiedBy(): int
    {
        return $this->verifiedBy;
    }

    public function setVerifiedBy(int $verifiedBy): self
    {
        $this->verifiedBy = $verifiedBy;
        return $this;
    }

    public function getVerificationDate(): ?\DateTimeInterface
    {
        return $this->verificationDate;
    }

    public function setVerificationDate(?\DateTimeInterface $verificationDate): self
    {
        $this->verificationDate = $verificationDate;
        return $this;
    }

    public function getVerificationType(): string
    {
        return $this->verificationType;
    }

    public function setVerificationType(string $verificationType): self
    {
        $validTypes = ['before_work', 'during_work', 'after_work'];
        if (!in_array($verificationType, $validTypes)) {
            throw new \InvalidArgumentException("Invalid verification type: {$verificationType}");
        }
        $this->verificationType = $verificationType;
        return $this;
    }

    public function getFindings(): ?string
    {
        return $this->findings;
    }

    public function setFindings(?string $findings): self
    {
        $this->findings = $findings;
        return $this;
    }

    public function getPhotosTaken(): int
    {
        return $this->photosTaken;
    }

    public function setPhotosTaken(int $photosTaken): self
    {
        if ($photosTaken < 0) {
            throw new \InvalidArgumentException("Photos taken cannot be negative");
        }
        $this->photosTaken = $photosTaken;
        return $this;
    }

    public function isSatisfactory(): ?bool
    {
        return $this->isSatisfactory;
    }

    public function setIsSatisfactory(?bool $isSatisfactory): self
    {
        $this->isSatisfactory = $isSatisfactory;
        return $this;
    }

    public function getRecommendations(): ?string
    {
        return $this->recommendations;
    }

    public function setRecommendations(?string $recommendations): self
    {
        $this->recommendations = $recommendations;
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
    public function isBeforeWork(): bool
    {
        return $this->verificationType === 'before_work';
    }

    public function isDuringWork(): bool
    {
        return $this->verificationType === 'during_work';
    }

    public function isAfterWork(): bool
    {
        return $this->verificationType === 'after_work';
    }

    public function getVerificationTypeLabel(): string
    {
        $types = [
            'before_work' => 'Avant travaux',
            'during_work' => 'Pendant travaux',
            'after_work' => 'Après travaux'
        ];
        return $types[$this->verificationType] ?? 'Inconnu';
    }

    public function isComplete(): bool
    {
        return !empty($this->findings) && 
               $this->isSatisfactory !== null && 
               !empty($this->recommendations);
    }

    public function hasPhotos(): bool
    {
        return $this->photosTaken > 0;
    }

    public function isPositive(): bool
    {
        return $this->isSatisfactory === true;
    }

    public function isNegative(): bool
    {
        return $this->isSatisfactory === false;
    }

    public function isPending(): bool
    {
        return $this->isSatisfactory === null;
    }

    public function getSatisfactionLabel(): string
    {
        if ($this->isSatisfactory === null) {
            return 'En attente';
        }
        return $this->isSatisfactory ? 'Satisfaisant' : 'Non satisfaisant';
    }

    public function addPhoto(): self
    {
        $this->photosTaken++;
        return $this;
    }

    public function removePhoto(): self
    {
        if ($this->photosTaken > 0) {
            $this->photosTaken--;
        }
        return $this;
    }
}
