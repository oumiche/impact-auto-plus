<?php

namespace App\Entity;

use App\Repository\AlertRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: AlertRepository::class)]
#[ORM\Table(name: 'alerts')]
class Alert
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['alert:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['alert:read'])]
    private ?Tenant $tenant = null;

    #[ORM\Column(length: 50)]
    #[Groups(['alert:read', 'alert:write'])]
    private ?string $type = null;

    #[ORM\Column(length: 20)]
    #[Groups(['alert:read', 'alert:write'])]
    private ?string $severity = null;

    #[ORM\Column(length: 200)]
    #[Groups(['alert:read', 'alert:write'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['alert:read', 'alert:write'])]
    private ?string $message = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['alert:read', 'alert:write'])]
    private ?string $entityType = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['alert:read', 'alert:write'])]
    private ?int $entityId = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['alert:read', 'alert:write'])]
    private bool $isRead = false;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['alert:read', 'alert:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['alert:read'])]
    private ?\DateTimeInterface $readAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['alert:read'])]
    private ?User $readBy = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['alert:read'])]
    private ?\DateTimeInterface $dismissedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['alert:read'])]
    private ?User $dismissedBy = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['alert:read', 'alert:write'])]
    private ?array $metadata = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['alert:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['alert:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
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

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getSeverity(): ?string
    {
        return $this->severity;
    }

    public function setSeverity(string $severity): static
    {
        $this->severity = $severity;
        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): static
    {
        $this->message = $message;
        return $this;
    }

    public function getEntityType(): ?string
    {
        return $this->entityType;
    }

    public function setEntityType(?string $entityType): static
    {
        $this->entityType = $entityType;
        return $this;
    }

    public function getEntityId(): ?int
    {
        return $this->entityId;
    }

    public function setEntityId(?int $entityId): static
    {
        $this->entityId = $entityId;
        return $this;
    }

    public function isRead(): bool
    {
        return $this->isRead;
    }

    public function setIsRead(bool $isRead): static
    {
        $this->isRead = $isRead;
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

    public function getReadAt(): ?\DateTimeInterface
    {
        return $this->readAt;
    }

    public function setReadAt(?\DateTimeInterface $readAt): static
    {
        $this->readAt = $readAt;
        return $this;
    }

    public function getReadBy(): ?User
    {
        return $this->readBy;
    }

    public function setReadBy(?User $readBy): static
    {
        $this->readBy = $readBy;
        return $this;
    }

    public function getDismissedAt(): ?\DateTimeInterface
    {
        return $this->dismissedAt;
    }

    public function setDismissedAt(?\DateTimeInterface $dismissedAt): static
    {
        $this->dismissedAt = $dismissedAt;
        return $this;
    }

    public function getDismissedBy(): ?User
    {
        return $this->dismissedBy;
    }

    public function setDismissedBy(?User $dismissedBy): static
    {
        $this->dismissedBy = $dismissedBy;
        return $this;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }

    public function setMetadata(?array $metadata): static
    {
        $this->metadata = $metadata;
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

    public function markAsRead(User $user): static
    {
        $this->isRead = true;
        $this->readAt = new \DateTime();
        $this->readBy = $user;
        return $this;
    }

    public function dismiss(User $user): static
    {
        $this->isActive = false;
        $this->dismissedAt = new \DateTime();
        $this->dismissedBy = $user;
        return $this;
    }
}
