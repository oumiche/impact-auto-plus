<?php

namespace App\Trait;

use App\Entity\Tenant;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

trait TenantableTrait
{
    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['tenantable:read'])]
    private ?Tenant $tenant = null;

    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function setTenant(?Tenant $tenant): static
    {
        $this->tenant = $tenant;
        return $this;
    }

    /**
     * Retourne l'ID du tenant
     */
    public function getTenantId(): ?int
    {
        return $this->tenant?->getId();
    }

    /**
     * Retourne le nom du tenant
     */
    public function getTenantName(): ?string
    {
        return $this->tenant?->getName();
    }

    /**
     * Vérifie si l'entité appartient au tenant donné
     */
    public function belongsToTenant(?Tenant $tenant): bool
    {
        if ($tenant === null || $this->tenant === null) {
            return false;
        }
        
        return $this->tenant->getId() === $tenant->getId();
    }

    /**
     * Vérifie si l'entité appartient au tenant par ID
     */
    public function belongsToTenantId(?int $tenantId): bool
    {
        return $this->getTenantId() === $tenantId;
    }
}
