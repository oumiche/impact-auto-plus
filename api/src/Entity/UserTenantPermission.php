<?php

namespace App\Entity;

use App\Repository\UserTenantPermissionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: UserTenantPermissionRepository::class)]
#[ORM\Table(name: 'user_tenant_permissions')]
class UserTenantPermission
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user_tenant_permission:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['user_tenant_permission:read'])]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['user_tenant_permission:read'])]
    private ?Tenant $tenant = null;

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['user_tenant_permission:read', 'user_tenant_permission:write'])]
    private ?array $permissions = [];

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['user_tenant_permission:read', 'user_tenant_permission:write'])]
    private bool $isPrimary = false;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['user_tenant_permission:read'])]
    private ?\DateTimeInterface $assignedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['user_tenant_permission:read'])]
    private ?User $assignedBy = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['user_tenant_permission:read', 'user_tenant_permission:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['user_tenant_permission:read', 'user_tenant_permission:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['user_tenant_permission:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['user_tenant_permission:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->assignedAt = new \DateTime();
        $this->permissions = [];
        $this->isActive = true;
        $this->isPrimary = false;
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

    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function setTenant(?Tenant $tenant): static
    {
        $this->tenant = $tenant;
        return $this;
    }

    public function getPermissions(): ?array
    {
        return $this->permissions;
    }

    public function setPermissions(?array $permissions): static
    {
        $this->permissions = $permissions ?: [];
        return $this;
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions ?: []);
    }

    public function addPermission(string $permission): static
    {
        if (!$this->permissions) {
            $this->permissions = [];
        }
        if (!in_array($permission, $this->permissions)) {
            $this->permissions[] = $permission;
        }
        return $this;
    }

    public function removePermission(string $permission): static
    {
        if ($this->permissions) {
            $this->permissions = array_values(array_filter($this->permissions, function($p) use ($permission) {
                return $p !== $permission;
            }));
        }
        return $this;
    }

    public function isPrimary(): bool
    {
        return $this->isPrimary;
    }

    public function setIsPrimary(bool $isPrimary): static
    {
        $this->isPrimary = $isPrimary;
        return $this;
    }

    public function getAssignedAt(): ?\DateTimeInterface
    {
        return $this->assignedAt;
    }

    public function setAssignedAt(\DateTimeInterface $assignedAt): static
    {
        $this->assignedAt = $assignedAt;
        return $this;
    }

    public function getAssignedBy(): ?User
    {
        return $this->assignedBy;
    }

    public function setAssignedBy(?User $assignedBy): static
    {
        $this->assignedBy = $assignedBy;
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
