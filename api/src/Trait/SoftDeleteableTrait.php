<?php

namespace App\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

trait SoftDeleteableTrait
{
    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['soft_deleteable:read'])]
    private bool $isDeleted = false;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['soft_deleteable:read'])]
    private ?\DateTimeInterface $deletedAt = null;

    public function isDeleted(): bool
    {
        return $this->isDeleted;
    }

    public function setIsDeleted(bool $isDeleted): static
    {
        $this->isDeleted = $isDeleted;
        if ($isDeleted && $this->deletedAt === null) {
            $this->deletedAt = new \DateTime();
        } elseif (!$isDeleted) {
            $this->deletedAt = null;
        }
        return $this;
    }

    public function getDeletedAt(): ?\DateTimeInterface
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeInterface $deletedAt): static
    {
        $this->deletedAt = $deletedAt;
        $this->isDeleted = $deletedAt !== null;
        return $this;
    }

    /**
     * Marque l'entité comme supprimée (soft delete)
     */
    public function softDelete(): static
    {
        $this->setIsDeleted(true);
        return $this;
    }

    /**
     * Restaure l'entité (annule le soft delete)
     */
    public function restore(): static
    {
        $this->setIsDeleted(false);
        return $this;
    }

    /**
     * Retourne si l'entité est active (non supprimée)
     */
    public function isActive(): bool
    {
        return !$this->isDeleted;
    }

    /**
     * Retourne depuis combien de temps l'entité est supprimée
     */
    public function getDeletedAgeInDays(): ?int
    {
        if (!$this->deletedAt) {
            return null;
        }
        
        $now = new \DateTime();
        $diff = $now->diff($this->deletedAt);
        return $diff->days;
    }

    /**
     * Retourne l'âge de suppression en format lisible
     */
    public function getDeletedAgeFormatted(): ?string
    {
        $days = $this->getDeletedAgeInDays();
        
        if ($days === null) {
            return null;
        }
        
        if ($days === 0) {
            return 'Aujourd\'hui';
        } elseif ($days === 1) {
            return 'Hier';
        } elseif ($days < 7) {
            return "Il y a {$days} jours";
        } elseif ($days < 30) {
            $weeks = floor($days / 7);
            return $weeks === 1 ? 'Il y a 1 semaine' : "Il y a {$weeks} semaines";
        } elseif ($days < 365) {
            $months = floor($days / 30);
            return $months === 1 ? 'Il y a 1 mois' : "Il y a {$months} mois";
        } else {
            $years = floor($days / 365);
            return $years === 1 ? 'Il y a 1 an' : "Il y a {$years} ans";
        }
    }

    /**
     * Vérifie si l'entité peut être définitivement supprimée
     * (par exemple, après 30 jours de soft delete)
     */
    public function canBePermanentlyDeleted(int $daysThreshold = 30): bool
    {
        $days = $this->getDeletedAgeInDays();
        return $days !== null && $days >= $daysThreshold;
    }
}
