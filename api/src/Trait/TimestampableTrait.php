<?php

namespace App\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

trait TimestampableTrait
{
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['timestampable:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['timestampable:read'])]
    private ?\DateTimeInterface $updatedAt = null;

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

    /**
     * Met à jour automatiquement les timestamps
     */
    public function updateTimestamps(): static
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTime();
        }
        $this->updatedAt = new \DateTime();
        return $this;
    }

    /**
     * Retourne l'âge de l'entité en jours
     */
    public function getAgeInDays(): int
    {
        if (!$this->createdAt) {
            return 0;
        }
        
        $now = new \DateTime();
        $diff = $now->diff($this->createdAt);
        return $diff->days;
    }

    /**
     * Retourne l'âge de l'entité en format lisible
     */
    public function getAgeFormatted(): string
    {
        $days = $this->getAgeInDays();
        
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
     * Retourne si l'entité a été modifiée récemment
     */
    public function isRecentlyUpdated(int $hours = 24): bool
    {
        if (!$this->updatedAt) {
            return false;
        }
        
        $threshold = new \DateTime();
        $threshold->modify("-{$hours} hours");
        
        return $this->updatedAt > $threshold;
    }

    /**
     * Retourne si l'entité est nouvelle
     */
    public function isNew(int $hours = 24): bool
    {
        if (!$this->createdAt) {
            return false;
        }
        
        $threshold = new \DateTime();
        $threshold->modify("-{$hours} hours");
        
        return $this->createdAt > $threshold;
    }
}
