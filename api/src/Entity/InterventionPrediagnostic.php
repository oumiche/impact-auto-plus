<?php

namespace App\Entity;

use App\Repository\InterventionPrediagnosticRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InterventionPrediagnosticRepository::class)]
#[ORM\Table(name: 'intervention_prediagnostics')]
class InterventionPrediagnostic
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: VehicleIntervention::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?VehicleIntervention $intervention = null;


    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $prediagnosticDate = null;



    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $vehiclePlate = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $vehicleModel = null;

    #[ORM\ManyToOne(targetEntity: Collaborateur::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Collaborateur $expert = null;


    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $signatureExpert = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $signatureRepairer = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $signatureInsured = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'prediagnostic', targetEntity: InterventionPrediagnosticItem::class, cascade: ['persist'])]
    private Collection $items;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->prediagnosticDate = new \DateTime();
        $this->items = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getIntervention(): ?VehicleIntervention
    {
        return $this->intervention;
    }

    public function setIntervention(?VehicleIntervention $intervention): self
    {
        $this->intervention = $intervention;
        return $this;
    }


    public function getPrediagnosticDate(): ?\DateTimeInterface
    {
        return $this->prediagnosticDate;
    }

    public function setPrediagnosticDate(?\DateTimeInterface $prediagnosticDate): self
    {
        $this->prediagnosticDate = $prediagnosticDate;
        return $this;
    }

    public function getVehiclePlate(): ?string
    {
        return $this->vehiclePlate;
    }

    public function setVehiclePlate(?string $vehiclePlate): self
    {
        $this->vehiclePlate = $vehiclePlate;
        return $this;
    }

    public function getVehicleModel(): ?string
    {
        return $this->vehicleModel;
    }

    public function setVehicleModel(?string $vehicleModel): self
    {
        $this->vehicleModel = $vehicleModel;
        return $this;
    }

    public function getExpert(): ?Collaborateur
    {
        return $this->expert;
    }

    public function setExpert(?Collaborateur $expert): self
    {
        $this->expert = $expert;
        return $this;
    }


    public function getSignatureExpert(): ?string
    {
        return $this->signatureExpert;
    }

    public function setSignatureExpert(?string $signatureExpert): self
    {
        $this->signatureExpert = $signatureExpert;
        return $this;
    }

    public function getSignatureRepairer(): ?string
    {
        return $this->signatureRepairer;
    }

    public function setSignatureRepairer(?string $signatureRepairer): self
    {
        $this->signatureRepairer = $signatureRepairer;
        return $this;
    }

    public function getSignatureInsured(): ?string
    {
        return $this->signatureInsured;
    }

    public function setSignatureInsured(?string $signatureInsured): self
    {
        $this->signatureInsured = $signatureInsured;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }
    /**
     * @return Collection<int, InterventionPrediagnosticItem>
     */
    public function getItems(): Collection
    {
        return $this->items;
    }

    public function addItem(InterventionPrediagnosticItem $item): static
    {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setPrediagnostic($this);
        }
        return $this;
    }

    public function removeItem(InterventionPrediagnosticItem $item): static
    {
        if ($this->items->removeElement($item)) {
            if ($item->getPrediagnostic() === $this) {
                $item->setPrediagnostic(null);
            }
        }
        return $this;
    }

}
