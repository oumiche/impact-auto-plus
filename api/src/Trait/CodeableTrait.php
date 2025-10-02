<?php

namespace App\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

trait CodeableTrait
{
    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['codeable:read', 'codeable:write'])]
    private ?string $code = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['codeable:read', 'codeable:write'])]
    private ?string $reference = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['codeable:read', 'codeable:write'])]
    private ?string $externalReference = null;

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(?string $code): static
    {
        $this->code = $code;
        return $this;
    }

    public function getReference(): ?string
    {
        return $this->reference;
    }

    public function setReference(?string $reference): static
    {
        $this->reference = $reference;
        return $this;
    }

    public function getExternalReference(): ?string
    {
        return $this->externalReference;
    }

    public function setExternalReference(?string $externalReference): static
    {
        $this->externalReference = $externalReference;
        return $this;
    }

    /**
     * Retourne le code principal (code, reference ou externalReference)
     */
    public function getPrimaryCode(): ?string
    {
        return $this->code ?? $this->reference ?? $this->externalReference;
    }

    /**
     * Retourne tous les codes disponibles
     */
    public function getAllCodes(): array
    {
        $codes = [];
        
        if ($this->code) {
            $codes['code'] = $this->code;
        }
        
        if ($this->reference) {
            $codes['reference'] = $this->reference;
        }
        
        if ($this->externalReference) {
            $codes['external_reference'] = $this->externalReference;
        }
        
        return $codes;
    }

    /**
     * Retourne si l'entité a un code
     */
    public function hasCode(): bool
    {
        return $this->getPrimaryCode() !== null;
    }

    /**
     * Retourne le code formaté pour l'affichage
     */
    public function getFormattedCode(): string
    {
        $primaryCode = $this->getPrimaryCode();
        
        if (!$primaryCode) {
            return 'Sans code';
        }
        
        $formatted = $primaryCode;
        
        // Ajouter d'autres codes s'ils existent
        $otherCodes = [];
        if ($this->code && $this->code !== $primaryCode) {
            $otherCodes[] = "Code: {$this->code}";
        }
        if ($this->reference && $this->reference !== $primaryCode) {
            $otherCodes[] = "Réf: {$this->reference}";
        }
        if ($this->externalReference && $this->externalReference !== $primaryCode) {
            $otherCodes[] = "Ext: {$this->externalReference}";
        }
        
        if (!empty($otherCodes)) {
            $formatted .= ' (' . implode(', ', $otherCodes) . ')';
        }
        
        return $formatted;
    }

    /**
     * Recherche dans tous les codes
     */
    public function searchInCodes(string $searchTerm): bool
    {
        $searchLower = strtolower($searchTerm);
        
        return (str_contains(strtolower($this->code ?? ''), $searchLower)) ||
               (str_contains(strtolower($this->reference ?? ''), $searchLower)) ||
               (str_contains(strtolower($this->externalReference ?? ''), $searchLower));
    }
}
