<?php

namespace App\Trait;

use App\Entity\User;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

trait AuditableTrait
{
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['auditable:read'])]
    private ?User $createdBy = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['auditable:read'])]
    private ?User $updatedBy = null;

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

    /**
     * Retourne le nom de l'utilisateur qui a créé l'entité
     */
    public function getCreatedByName(): ?string
    {
        return $this->createdBy?->getUsername();
    }

    /**
     * Retourne le nom de l'utilisateur qui a modifié l'entité
     */
    public function getUpdatedByName(): ?string
    {
        return $this->updatedBy?->getUsername();
    }

    /**
     * Retourne l'ID de l'utilisateur qui a créé l'entité
     */
    public function getCreatedById(): ?int
    {
        return $this->createdBy?->getId();
    }

    /**
     * Retourne l'ID de l'utilisateur qui a modifié l'entité
     */
    public function getUpdatedById(): ?int
    {
        return $this->updatedBy?->getId();
    }

    /**
     * Vérifie si l'entité a été créée par un utilisateur spécifique
     */
    public function isCreatedBy(User $user): bool
    {
        return $this->createdBy && $this->createdBy->getId() === $user->getId();
    }

    /**
     * Vérifie si l'entité a été modifiée par un utilisateur spécifique
     */
    public function isUpdatedBy(User $user): bool
    {
        return $this->updatedBy && $this->updatedBy->getId() === $user->getId();
    }

    /**
     * Vérifie si l'entité a été créée par l'utilisateur donné
     */
    public function isCreatedByUserId(int $userId): bool
    {
        return $this->getCreatedById() === $userId;
    }

    /**
     * Vérifie si l'entité a été modifiée par l'utilisateur donné
     */
    public function isUpdatedByUserId(int $userId): bool
    {
        return $this->getUpdatedById() === $userId;
    }

    /**
     * Retourne les informations d'audit
     */
    public function getAuditInfo(): array
    {
        return [
            'created_by' => [
                'id' => $this->getCreatedById(),
                'username' => $this->getCreatedByName()
            ],
            'updated_by' => [
                'id' => $this->getUpdatedById(),
                'username' => $this->getUpdatedByName()
            ]
        ];
    }

    /**
     * Met à jour l'audit avec l'utilisateur actuel
     */
    public function updateAudit(User $user): static
    {
        $this->setUpdatedBy($user);
        return $this;
    }

    /**
     * Initialise l'audit avec l'utilisateur actuel
     */
    public function initializeAudit(User $user): static
    {
        $this->setCreatedBy($user);
        $this->setUpdatedBy($user);
        return $this;
    }
}
