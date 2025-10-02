<?php

namespace App\Entity;

use App\Repository\SystemParameterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SystemParameterRepository::class)]
#[ORM\Table(name: 'system_parameters')]
class SystemParameter
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['parameter:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[Groups(['parameter:read'])]
    private ?Tenant $tenant = null;

    #[ORM\Column(length: 50)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private ?string $category = null;

    #[ORM\Column(length: 100)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private ?string $parameterKey = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private ?string $value = null;

    #[ORM\Column(length: 20)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private ?string $dataType = 'string';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private bool $isEditable = true;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private bool $isPublic = false;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private ?array $validationRules = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['parameter:read', 'parameter:write'])]
    private ?string $defaultValue = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['parameter:read'])]
    private ?User $createdBy = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['parameter:read'])]
    private ?User $updatedBy = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['parameter:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['parameter:read'])]
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

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;
        return $this;
    }

    public function getKey(): ?string
    {
        return $this->parameterKey;
    }

    public function setKey(string $key): static
    {
        $this->parameterKey = $key;
        return $this;
    }

    public function getValue(): ?string
    {
        return $this->value;
    }

    public function setValue(string $value): static
    {
        $this->value = $value;
        return $this;
    }

    public function getDataType(): ?string
    {
        return $this->dataType;
    }

    public function setDataType(string $dataType): static
    {
        $this->dataType = $dataType;
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

    public function isEditable(): bool
    {
        return $this->isEditable;
    }

    public function setIsEditable(bool $isEditable): static
    {
        $this->isEditable = $isEditable;
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

    public function getValidationRules(): ?array
    {
        return $this->validationRules;
    }

    public function setValidationRules(?array $validationRules): static
    {
        $this->validationRules = $validationRules;
        return $this;
    }

    public function getDefaultValue(): ?string
    {
        return $this->defaultValue;
    }

    public function setDefaultValue(?string $defaultValue): static
    {
        $this->defaultValue = $defaultValue;
        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;
        return $this;
    }

    public function getUpdatedBy(): ?User
    {
        return $this->updatedBy;
    }

    public function setUpdatedBy(?User $updatedBy): static
    {
        $this->updatedBy = $updatedBy;
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

    public function getTypedValue()
    {
        switch ($this->dataType) {
            case 'integer':
                return (int) $this->value;
            case 'float':
                return (float) $this->value;
            case 'boolean':
                return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($this->value, true);
            default:
                return $this->value;
        }
    }

    public function setTypedValue($value): static
    {
        switch ($this->dataType) {
            case 'json':
                $this->value = json_encode($value);
                break;
            case 'boolean':
                $this->value = $value ? '1' : '0';
                break;
            default:
                $this->value = (string) $value;
        }
        return $this;
    }
}