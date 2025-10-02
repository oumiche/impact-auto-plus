<?php

namespace App\Entity;

use App\Repository\CollaborateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CollaborateurRepository::class)]
#[ORM\Table(name: 'collaborateurs')]
class Collaborateur
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['collaborateur:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['collaborateur:read'])]
    private ?User $user = null;

    #[ORM\Column(length: 50)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $firstName = null;

    #[ORM\Column(length: 50)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $lastName = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $email = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $phone = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $employeeNumber = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $department = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $position = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $specialization = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $licenseNumber = null;

    #[ORM\ManyToOne(targetEntity: LicenseType::class)]
    #[Groups(['collaborateur:read'])]
    private ?LicenseType $licenseType = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?\DateTimeInterface $licenseExpiryDate = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $certificationLevel = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?int $experienceYears = null;

    #[ORM\ManyToOne(targetEntity: Supplier::class)]
    #[Groups(['collaborateur:read'])]
    private ?Supplier $preferredSupplier = null;

    #[ORM\ManyToOne(targetEntity: Garage::class)]
    #[Groups(['collaborateur:read'])]
    private ?Garage $preferredGarage = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['collaborateur:read', 'collaborateur:write'])]
    private ?string $notes = null;

    #[ORM\OneToMany(mappedBy: 'collaborateur', targetEntity: CollaborateurTenant::class, cascade: ['persist'])]
    private Collection $collaborateurTenants;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['collaborateur:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['collaborateur:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->collaborateurTenants = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;
        return $this;
    }

    public function getEmployeeNumber(): ?string
    {
        return $this->employeeNumber;
    }

    public function setEmployeeNumber(?string $employeeNumber): static
    {
        $this->employeeNumber = $employeeNumber;
        return $this;
    }

    public function getDepartment(): ?string
    {
        return $this->department;
    }

    public function setDepartment(?string $department): static
    {
        $this->department = $department;
        return $this;
    }

    public function getPosition(): ?string
    {
        return $this->position;
    }

    public function setPosition(?string $position): static
    {
        $this->position = $position;
        return $this;
    }

    public function getSpecialization(): ?string
    {
        return $this->specialization;
    }

    public function setSpecialization(?string $specialization): static
    {
        $this->specialization = $specialization;
        return $this;
    }

    public function getLicenseNumber(): ?string
    {
        return $this->licenseNumber;
    }

    public function setLicenseNumber(?string $licenseNumber): static
    {
        $this->licenseNumber = $licenseNumber;
        return $this;
    }

    public function getLicenseType(): ?LicenseType
    {
        return $this->licenseType;
    }

    public function setLicenseType(?LicenseType $licenseType): static
    {
        $this->licenseType = $licenseType;
        return $this;
    }

    public function getLicenseExpiryDate(): ?\DateTimeInterface
    {
        return $this->licenseExpiryDate;
    }

    public function setLicenseExpiryDate(?\DateTimeInterface $licenseExpiryDate): static
    {
        $this->licenseExpiryDate = $licenseExpiryDate;
        return $this;
    }

    public function getCertificationLevel(): ?string
    {
        return $this->certificationLevel;
    }

    public function setCertificationLevel(?string $certificationLevel): static
    {
        $this->certificationLevel = $certificationLevel;
        return $this;
    }

    public function getExperienceYears(): ?int
    {
        return $this->experienceYears;
    }

    public function setExperienceYears(?int $experienceYears): static
    {
        $this->experienceYears = $experienceYears;
        return $this;
    }

    public function getPreferredSupplier(): ?Supplier
    {
        return $this->preferredSupplier;
    }

    public function setPreferredSupplier(?Supplier $preferredSupplier): static
    {
        $this->preferredSupplier = $preferredSupplier;
        return $this;
    }

    public function getPreferredGarage(): ?Garage
    {
        return $this->preferredGarage;
    }

    public function setPreferredGarage(?Garage $preferredGarage): static
    {
        $this->preferredGarage = $preferredGarage;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
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

    /**
     * @return Collection<int, CollaborateurTenant>
     */
    public function getCollaborateurTenants(): Collection
    {
        return $this->collaborateurTenants;
    }

    public function addCollaborateurTenant(CollaborateurTenant $collaborateurTenant): static
    {
        if (!$this->collaborateurTenants->contains($collaborateurTenant)) {
            $this->collaborateurTenants->add($collaborateurTenant);
            $collaborateurTenant->setCollaborateur($this);
        }
        return $this;
    }

    public function removeCollaborateurTenant(CollaborateurTenant $collaborateurTenant): static
    {
        if ($this->collaborateurTenants->removeElement($collaborateurTenant)) {
            if ($collaborateurTenant->getCollaborateur() === $this) {
                $collaborateurTenant->setCollaborateur(null);
            }
        }
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

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getFullName(): string
    {
        return $this->firstName . ' ' . $this->lastName;
    }

    public function isLicenseExpired(): bool
    {
        if (!$this->licenseExpiryDate) {
            return false;
        }
        return $this->licenseExpiryDate < new \DateTime();
    }

    public function getDaysUntilLicenseExpiry(): ?int
    {
        if (!$this->licenseExpiryDate) {
            return null;
        }
        $now = new \DateTime();
        $diff = $now->diff($this->licenseExpiryDate);
        return $this->licenseExpiryDate > $now ? $diff->days : -$diff->days;
    }
}
