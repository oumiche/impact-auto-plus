<?php

namespace App\Entity;

use App\Repository\ReportRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ReportRepository::class)]
#[ORM\Table(name: 'reports')]
#[ORM\HasLifecycleCallbacks]
class Report
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['report:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(['report:read', 'report:write'])]
    private ?string $type = null;

    #[ORM\Column(length: 255)]
    #[Groups(['report:read', 'report:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['report:read', 'report:write'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['report:read', 'report:write'])]
    private ?array $parameters = [];

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['report:read'])]
    private ?\DateTimeInterface $generatedAt = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['report:read'])]
    private ?int $generatedBy = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['report:read', 'report:write'])]
    private ?int $cacheDuration = 3600; // 1 heure par défaut

    #[ORM\Column]
    #[Groups(['report:read', 'report:write'])]
    private ?bool $isPublic = false;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['report:read'])]
    private ?\DateTimeInterface $cachedUntil = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['report:read'])]
    private ?array $cachedData = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tenant $tenant = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['report:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['report:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->parameters = [];
        $this->isPublic = false;
        $this->cacheDuration = 3600;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->generatedAt = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTime();
    }

    // Getters and Setters

    public function getId(): ?int
    {
        return $this->id;
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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
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

    public function getParameters(): ?array
    {
        return $this->parameters;
    }

    public function setParameters(?array $parameters): static
    {
        $this->parameters = $parameters;
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

    public function getGeneratedBy(): ?int
    {
        return $this->generatedBy;
    }

    public function setGeneratedBy(int $generatedBy): static
    {
        $this->generatedBy = $generatedBy;
        return $this;
    }

    public function getCacheDuration(): ?int
    {
        return $this->cacheDuration;
    }

    public function setCacheDuration(?int $cacheDuration): static
    {
        $this->cacheDuration = $cacheDuration;
        return $this;
    }

    public function isPublic(): ?bool
    {
        return $this->isPublic;
    }

    public function setIsPublic(bool $isPublic): static
    {
        $this->isPublic = $isPublic;
        return $this;
    }

    public function getCachedUntil(): ?\DateTimeInterface
    {
        return $this->cachedUntil;
    }

    public function setCachedUntil(?\DateTimeInterface $cachedUntil): static
    {
        $this->cachedUntil = $cachedUntil;
        return $this;
    }

    public function getCachedData(): ?array
    {
        return $this->cachedData;
    }

    public function setCachedData(?array $cachedData): static
    {
        $this->cachedData = $cachedData;
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

    public function setUpdatedAt(\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    /**
     * Vérifie si le cache est encore valide
     */
    public function isCacheValid(): bool
    {
        if (!$this->cachedUntil || !$this->cachedData) {
            return false;
        }

        return $this->cachedUntil > new \DateTime();
    }

    /**
     * Invalide le cache
     */
    public function invalidateCache(): void
    {
        $this->cachedUntil = null;
        $this->cachedData = null;
    }

    /**
     * Met à jour le cache
     */
    public function updateCache(array $data): void
    {
        $this->cachedData = $data;
        if ($this->cacheDuration) {
            $this->cachedUntil = (new \DateTime())->modify("+{$this->cacheDuration} seconds");
        }
    }

    /**
     * Types de rapports disponibles
     */
    public static function getAvailableTypes(): array
    {
        return [
            'dashboard' => 'Tableau de bord interventions',
            'costs_by_vehicle' => 'Coûts par véhicule',
            'maintenance_schedule' => 'Échéancier maintenance',
            'kpis' => 'Indicateurs de performance',
            'vehicle_usage' => 'Utilisation des véhicules',
            'driver_performance' => 'Performance conducteurs',
            'financial_summary' => 'Synthèse financière',
            'intervention_analysis' => 'Analyse des interventions',
            'preventive_maintenance' => 'Maintenance préventive',
            'cost_analysis' => 'Analyse des coûts',
        ];
    }

    /**
     * Obtient le label du type
     */
    public function getTypeLabel(): string
    {
        $types = self::getAvailableTypes();
        return $types[$this->type] ?? $this->type;
    }
}

