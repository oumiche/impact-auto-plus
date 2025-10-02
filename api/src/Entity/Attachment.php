<?php

namespace App\Entity;

use App\Repository\AttachmentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: AttachmentRepository::class)]
#[ORM\Table(name: 'attachments')]
class Attachment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['attachment:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['attachment:read'])]
    private ?Tenant $tenant = null;

    #[ORM\Column(length: 50)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $entityType = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?int $entityId = null;

    #[ORM\Column(length: 255)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $fileName = null;

    #[ORM\Column(length: 255)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $originalName = null;

    #[ORM\Column(length: 500)]
    #[Groups(['attachment:read'])]
    private ?string $filePath = null;

    #[ORM\Column(type: Types::BIGINT)]
    #[Groups(['attachment:read'])]
    private ?string $fileSize = null;

    #[ORM\Column(length: 100)]
    #[Groups(['attachment:read'])]
    private ?string $mimeType = null;

    #[ORM\Column(length: 10)]
    #[Groups(['attachment:read'])]
    private ?string $fileExtension = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['attachment:read'])]
    private ?User $uploadedBy = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['attachment:read'])]
    private ?\DateTimeInterface $uploadedAt = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private bool $isPublic = false;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['attachment:read'])]
    private ?int $downloadCount = 0;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['attachment:read'])]
    private ?\DateTimeInterface $lastDownloadedAt = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private ?array $metadata = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['attachment:read', 'attachment:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['attachment:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['attachment:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->uploadedAt = new \DateTime();
        $this->downloadCount = 0;
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

    public function getFileName(): ?string
    {
        return $this->fileName;
    }

    public function setFileName(string $fileName): static
    {
        $this->fileName = $fileName;
        return $this;
    }

    public function getOriginalName(): ?string
    {
        return $this->originalName;
    }

    public function setOriginalName(string $originalName): static
    {
        $this->originalName = $originalName;
        return $this;
    }

    public function getFilePath(): ?string
    {
        return $this->filePath;
    }

    public function setFilePath(string $filePath): static
    {
        $this->filePath = $filePath;
        return $this;
    }

    public function getFileSize(): ?string
    {
        return $this->fileSize;
    }

    public function setFileSize(string $fileSize): static
    {
        $this->fileSize = $fileSize;
        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(string $mimeType): static
    {
        $this->mimeType = $mimeType;
        return $this;
    }

    public function getFileExtension(): ?string
    {
        return $this->fileExtension;
    }

    public function setFileExtension(string $fileExtension): static
    {
        $this->fileExtension = $fileExtension;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getUploadedBy(): ?User
    {
        return $this->uploadedBy;
    }

    public function setUploadedBy(?User $uploadedBy): static
    {
        $this->uploadedBy = $uploadedBy;
        return $this;
    }

    public function getUploadedAt(): ?\DateTimeInterface
    {
        return $this->uploadedAt;
    }

    public function setUploadedAt(\DateTimeInterface $uploadedAt): static
    {
        $this->uploadedAt = $uploadedAt;
        return $this;
    }

    public function isPublic(): bool
    {
        return $this->isPublic;
    }

    public function setIsPublic(bool $isPublic): static
    {
        $this->isPublic = $isPublic;
        return $this;
    }

    public function getDownloadCount(): ?int
    {
        return $this->downloadCount;
    }

    public function setDownloadCount(int $downloadCount): static
    {
        $this->downloadCount = $downloadCount;
        return $this;
    }

    public function getLastDownloadedAt(): ?\DateTimeInterface
    {
        return $this->lastDownloadedAt;
    }

    public function setLastDownloadedAt(?\DateTimeInterface $lastDownloadedAt): static
    {
        $this->lastDownloadedAt = $lastDownloadedAt;
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

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
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

    public function incrementDownloadCount(): static
    {
        $this->downloadCount++;
        $this->lastDownloadedAt = new \DateTime();
        return $this;
    }

    public function getFormattedFileSize(): string
    {
        $bytes = (int) $this->fileSize;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
