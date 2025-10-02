<?php

namespace App\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

trait StatusableTrait
{
    #[ORM\Column(length: 20)]
    #[Groups(['statusable:read', 'statusable:write'])]
    private ?string $status = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['statusable:read', 'statusable:write'])]
    private bool $isActive = true;

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(?string $status): static
    {
        $this->status = $status;
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

    /**
     * Retourne les statuts possibles
     */
    public static function getAvailableStatuses(): array
    {
        return [
            'draft' => 'Brouillon',
            'pending' => 'En attente',
            'active' => 'Actif',
            'inactive' => 'Inactif',
            'completed' => 'Terminé',
            'cancelled' => 'Annulé',
            'suspended' => 'Suspendu',
            'archived' => 'Archivé'
        ];
    }

    /**
     * Retourne le libellé du statut
     */
    public function getStatusLabel(): string
    {
        $statuses = static::getAvailableStatuses();
        return $statuses[$this->status] ?? $this->status ?? 'Inconnu';
    }

    /**
     * Vérifie si le statut est dans la liste donnée
     */
    public function hasStatus(array $statuses): bool
    {
        return in_array($this->status, $statuses);
    }

    /**
     * Vérifie si l'entité est en statut actif
     */
    public function isStatusActive(): bool
    {
        return $this->isActive && $this->status === 'active';
    }

    /**
     * Vérifie si l'entité est en statut terminé
     */
    public function isStatusCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Vérifie si l'entité est en statut annulé
     */
    public function isStatusCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Marque comme actif
     */
    public function activate(): static
    {
        $this->setStatus('active');
        $this->setIsActive(true);
        return $this;
    }

    /**
     * Marque comme inactif
     */
    public function deactivate(): static
    {
        $this->setStatus('inactive');
        $this->setIsActive(false);
        return $this;
    }

    /**
     * Marque comme terminé
     */
    public function complete(): static
    {
        $this->setStatus('completed');
        return $this;
    }

    /**
     * Marque comme annulé
     */
    public function cancel(): static
    {
        $this->setStatus('cancelled');
        return $this;
    }

    /**
     * Marque comme suspendu
     */
    public function suspend(): static
    {
        $this->setStatus('suspended');
        $this->setIsActive(false);
        return $this;
    }

    /**
     * Archive l'entité
     */
    public function archive(): static
    {
        $this->setStatus('archived');
        $this->setIsActive(false);
        return $this;
    }

    /**
     * Retourne la couleur associée au statut
     */
    public function getStatusColor(): string
    {
        $colors = [
            'draft' => '#6c757d',
            'pending' => '#ffc107',
            'active' => '#28a745',
            'inactive' => '#6c757d',
            'completed' => '#17a2b8',
            'cancelled' => '#dc3545',
            'suspended' => '#fd7e14',
            'archived' => '#6f42c1'
        ];

        return $colors[$this->status] ?? '#6c757d';
    }

    /**
     * Retourne l'icône associée au statut
     */
    public function getStatusIcon(): string
    {
        $icons = [
            'draft' => 'fa-edit',
            'pending' => 'fa-clock',
            'active' => 'fa-check-circle',
            'inactive' => 'fa-times-circle',
            'completed' => 'fa-check-double',
            'cancelled' => 'fa-ban',
            'suspended' => 'fa-pause-circle',
            'archived' => 'fa-archive'
        ];

        return $icons[$this->status] ?? 'fa-question-circle';
    }
}
