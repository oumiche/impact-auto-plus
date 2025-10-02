<?php

namespace App\Entity;

use App\Repository\EntityCodeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EntityCodeRepository::class)]
#[ORM\Table(name: 'entity_codes')]
class EntityCode
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['entity_code:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['entity_code:read'])]
    private ?Tenant $tenant = null;

    #[ORM\Column(length: 50)]
    #[Groups(['entity_code:read', 'entity_code:write'])]
    private ?string $entityType = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['entity_code:read', 'entity_code:write'])]
    private ?int $entityId = null;

    #[ORM\Column(length: 100, unique: true)]
    #[Groups(['entity_code:read'])]
    private ?string $code = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['entity_code:read', 'entity_code:write'])]
    private ?string $externalReference = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['entity_code:read'])]
    private ?\DateTimeInterface $generatedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['entity_code:read'])]
    private ?User $generatedBy = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['entity_code:read', 'entity_code:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['entity_code:read', 'entity_code:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['entity_code:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['entity_code:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->generatedAt = new \DateTime();
        $this->isActive = true;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function setTenant(?Tenant $tenant): static
    {
        $this->tenant = $tenant;
        return $this;
    }

    public function getEntityType(): ?string
    {
        return $this->entityType;
    }

    public function setEntityType(string $entityType): static
    {
        $this->entityType = $entityType;
        return $this;
    }

    public function getEntityId(): ?int
    {
        return $this->entityId;
    }

    public function setEntityId(int $entityId): static
    {
        $this->entityId = $entityId;
        return $this;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = $code;
        return $this;
    }

    public function getExternalReference(): ?string
    {
        return $this->externalReference;
    }

    public function setExternalReference(?string $externalReference): static
    {
        $this->externalReference = $externalReference;
        return $this;
    }

    public function getGeneratedAt(): ?\DateTimeInterface
    {
        return $this->generatedAt;
    }

    public function setGeneratedAt(\DateTimeInterface $generatedAt): static
    {
        $this->generatedAt = $generatedAt;
        return $this;
    }

    public function getGeneratedBy(): ?User
    {
        return $this->generatedBy;
    }

    public function setGeneratedBy(?User $generatedBy): static
    {
        $this->generatedBy = $generatedBy;
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
}
