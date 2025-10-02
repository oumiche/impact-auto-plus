<?php

namespace App\Entity;

use App\Repository\InterventionTypeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: InterventionTypeRepository::class)]
#[ORM\Table(name: 'intervention_types')]
#[ORM\HasLifecycleCallbacks]
class InterventionType
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['intervention_type:read', 'intervention_type:write'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(['intervention_type:read', 'intervention_type:write'])]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['intervention_type:read', 'intervention_type:write'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['intervention_type:read', 'intervention_type:write'])]
    private ?bool $isActive = true;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['intervention_type:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['intervention_type:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'interventionType', targetEntity: VehicleIntervention::class)]
    private Collection $vehicleInterventions;

    public function __construct()
    {
        $this->vehicleInterventions = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function isActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
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

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTime();
    }

    public function __toString(): string
    {
        return $this->name ?? '';
    }

    /**
     * @return Collection<int, VehicleIntervention>
     */
    public function getVehicleInterventions(): Collection
    {
        return $this->vehicleInterventions;
    }

    public function addVehicleIntervention(VehicleIntervention $vehicleIntervention): static
    {
        if (!$this->vehicleInterventions->contains($vehicleIntervention)) {
            $this->vehicleInterventions->add($vehicleIntervention);
            $vehicleIntervention->setInterventionType($this);
        }

        return $this;
    }

    public function removeVehicleIntervention(VehicleIntervention $vehicleIntervention): static
    {
        if ($this->vehicleInterventions->removeElement($vehicleIntervention)) {
            // set the owning side to null (unless already changed)
            if ($vehicleIntervention->getInterventionType() === $this) {
                $vehicleIntervention->setInterventionType(null);
            }
        }

        return $this;
    }
}
