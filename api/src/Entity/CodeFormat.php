<?php

namespace App\Entity;

use App\Repository\CodeFormatRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CodeFormatRepository::class)]
#[ORM\Table(name: 'code_formats')]
class CodeFormat
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['code_format:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[Groups(['code_format:read'])]
    private ?Tenant $tenant = null;

    #[ORM\Column(length: 50)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?string $entityType = null;

    #[ORM\Column(length: 200)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?string $formatPattern = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?string $prefix = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?string $suffix = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private bool $includeYear = true;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private bool $includeMonth = true;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private bool $includeDay = false;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?int $sequenceLength = 4;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?int $sequenceStart = 1;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?int $currentSequence = 0;

    #[ORM\Column(name: 'code_separator', length: 5)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?string $separator = '-';

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['code_format:read', 'code_format:write'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['code_format:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['code_format:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->includeYear = true;
        $this->includeMonth = true;
        $this->includeDay = false;
        $this->sequenceLength = 4;
        $this->sequenceStart = 1;
        $this->currentSequence = 0;
        $this->separator = '-';
        $this->isActive = true;
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

    public function getFormatPattern(): ?string
    {
        return $this->formatPattern;
    }

    public function setFormatPattern(string $formatPattern): static
    {
        $this->formatPattern = $formatPattern;
        return $this;
    }

    public function getPrefix(): ?string
    {
        return $this->prefix;
    }

    public function setPrefix(?string $prefix): static
    {
        $this->prefix = $prefix;
        return $this;
    }

    public function getSuffix(): ?string
    {
        return $this->suffix;
    }

    public function setSuffix(?string $suffix): static
    {
        $this->suffix = $suffix;
        return $this;
    }

    public function isIncludeYear(): bool
    {
        return $this->includeYear;
    }

    public function setIncludeYear(bool $includeYear): static
    {
        $this->includeYear = $includeYear;
        return $this;
    }

    public function isIncludeMonth(): bool
    {
        return $this->includeMonth;
    }

    public function setIncludeMonth(bool $includeMonth): static
    {
        $this->includeMonth = $includeMonth;
        return $this;
    }

    public function isIncludeDay(): bool
    {
        return $this->includeDay;
    }

    public function setIncludeDay(bool $includeDay): static
    {
        $this->includeDay = $includeDay;
        return $this;
    }

    public function getSequenceLength(): ?int
    {
        return $this->sequenceLength;
    }

    public function setSequenceLength(int $sequenceLength): static
    {
        $this->sequenceLength = $sequenceLength;
        return $this;
    }

    public function getSequenceStart(): ?int
    {
        return $this->sequenceStart;
    }

    public function setSequenceStart(int $sequenceStart): static
    {
        $this->sequenceStart = $sequenceStart;
        return $this;
    }

    public function getCurrentSequence(): ?int
    {
        return $this->currentSequence;
    }

    public function setCurrentSequence(int $currentSequence): static
    {
        $this->currentSequence = $currentSequence;
        return $this;
    }

    public function getSeparator(): ?string
    {
        return $this->separator;
    }

    public function setSeparator(string $separator): static
    {
        $this->separator = $separator;
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
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

    public function generateNextCode(): string
    {
        $this->currentSequence++;
        $this->updatedAt = new \DateTime();
        
        // Parser le formatPattern et remplacer les variables
        $code = $this->formatPattern;
        
        // Remplacer les variables dans le pattern
        $sequence = str_pad($this->currentSequence, $this->sequenceLength, '0', STR_PAD_LEFT);
        
        $replacements = [
            '{YEAR}' => date('Y'),
            '{MONTH}' => date('m'),
            '{DAY}' => date('d'),
            '{SEQUENCE}' => $sequence,
        ];
        
        foreach ($replacements as $variable => $value) {
            $code = str_replace($variable, $value, $code);
        }
        
        return $code;
    }
}
