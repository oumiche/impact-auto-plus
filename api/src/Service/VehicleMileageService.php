<?php

namespace App\Service;

use App\Entity\Vehicle;
use App\Entity\VehicleFuelLog;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\VehicleFuelLogRepository;

class VehicleMileageService
{
    private EntityManagerInterface $entityManager;
    private VehicleFuelLogRepository $fuelLogRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        VehicleFuelLogRepository $fuelLogRepository
    ) {
        $this->entityManager = $entityManager;
        $this->fuelLogRepository = $fuelLogRepository;
    }

    /**
     * Met à jour le kilométrage du véhicule basé sur le dernier carnet de carburant
     */
    public function updateVehicleMileageFromFuelLog(Vehicle $vehicle): void
    {
        // Récupérer le dernier carnet de carburant pour ce véhicule
        $lastFuelLog = $this->fuelLogRepository->findOneBy(
            ['vehicle' => $vehicle],
            ['refuelDate' => 'DESC', 'id' => 'DESC']
        );

        if ($lastFuelLog && $lastFuelLog->getOdometerReading()) {
            $vehicle->setMileage($lastFuelLog->getOdometerReading());
        }
    }

    /**
     * Valide la cohérence des données de kilométrage
     */
    public function validateMileageConsistency(VehicleFuelLog $fuelLog): array
    {
        $errors = [];
        $vehicle = $fuelLog->getVehicle();
        
        if (!$vehicle) {
            return ['Véhicule non trouvé'];
        }

        $currentMileage = $vehicle->getMileage();
        $newOdometerReading = $fuelLog->getOdometerReading();
        $previousOdometerReading = $fuelLog->getPreviousOdometerReading();

        // Validation 1: Le nouveau kilométrage doit être supérieur ou égal au kilométrage actuel du véhicule
        if ($newOdometerReading && $currentMileage > $newOdometerReading) {
            $errors[] = "Le kilométrage saisi ({$newOdometerReading} km) est inférieur au kilométrage actuel du véhicule ({$currentMileage} km)";
        }

        // Validation 2: Si on a un kilométrage précédent, il doit être cohérent
        if ($previousOdometerReading && $newOdometerReading) {
            if ($previousOdometerReading >= $newOdometerReading) {
                $errors[] = "Le kilométrage précédent ({$previousOdometerReading} km) doit être inférieur au kilométrage actuel ({$newOdometerReading} km)";
            }
        }

        // Validation 3: Vérifier la cohérence avec les autres carnets de carburant
        $existingFuelLogs = $this->fuelLogRepository->findBy(
            ['vehicle' => $vehicle],
            ['refuelDate' => 'DESC']
        );

        foreach ($existingFuelLogs as $existingLog) {
            if ($existingLog->getId() === $fuelLog->getId()) {
                continue; // Ignorer le carnet en cours de modification
            }

            $existingOdometer = $existingLog->getOdometerReading();
            if (!$existingOdometer) {
                continue;
            }

            // Si c'est un nouveau carnet (pas d'ID), il doit être postérieur aux existants
            if (!$fuelLog->getId()) {
                if ($existingLog->getRefuelDate() >= $fuelLog->getRefuelDate()) {
                    if ($newOdometerReading <= $existingOdometer) {
                        $errors[] = "Le kilométrage ({$newOdometerReading} km) doit être supérieur au kilométrage du carnet du " . 
                                  $existingLog->getRefuelDate()->format('d/m/Y') . " ({$existingOdometer} km)";
                    }
                }
            } else {
                // Si c'est une modification, vérifier la cohérence temporelle
                if ($existingLog->getRefuelDate() < $fuelLog->getRefuelDate()) {
                    if ($newOdometerReading <= $existingOdometer) {
                        $errors[] = "Le kilométrage ({$newOdometerReading} km) doit être supérieur au kilométrage du carnet du " . 
                                  $existingLog->getRefuelDate()->format('d/m/Y') . " ({$existingOdometer} km)";
                    }
                } elseif ($existingLog->getRefuelDate() > $fuelLog->getRefuelDate()) {
                    if ($newOdometerReading >= $existingOdometer) {
                        $errors[] = "Le kilométrage ({$newOdometerReading} km) doit être inférieur au kilométrage du carnet du " . 
                                  $existingLog->getRefuelDate()->format('d/m/Y') . " ({$existingOdometer} km)";
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * Calcule automatiquement les kilomètres parcourus et l'efficacité énergétique
     */
    public function calculateDerivedValues(VehicleFuelLog $fuelLog): void
    {
        $odometerReading = $fuelLog->getOdometerReading();
        $previousOdometerReading = $fuelLog->getPreviousOdometerReading();
        $quantity = $fuelLog->getQuantity();

        // Calculer les kilomètres parcourus si on a les deux valeurs
        if ($odometerReading && $previousOdometerReading) {
            $kilometersDriven = $odometerReading - $previousOdometerReading;
            $fuelLog->setKilometersDriven($kilometersDriven);

            // Calculer l'efficacité énergétique si on a la quantité
            if ($quantity && $quantity > 0) {
                $fuelEfficiency = $kilometersDriven / (float) $quantity;
                $fuelLog->setFuelEfficiency(round($fuelEfficiency, 2));
            }
        } else {
            // Si on n'a pas le kilométrage précédent, essayer de le récupérer automatiquement
            $this->autoCalculatePreviousOdometer($fuelLog);
        }
    }

    /**
     * Calcule automatiquement le kilométrage précédent basé sur le dernier carnet
     */
    private function autoCalculatePreviousOdometer(VehicleFuelLog $fuelLog): void
    {
        $vehicle = $fuelLog->getVehicle();
        if (!$vehicle) {
            return;
        }

        // Trouver le dernier carnet de carburant avant la date de ce carnet
        $previousFuelLog = $this->fuelLogRepository->createQueryBuilder('fl')
            ->where('fl.vehicle = :vehicle')
            ->andWhere('fl.refuelDate < :refuelDate')
            ->andWhere('fl.id != :currentId')
            ->setParameter('vehicle', $vehicle)
            ->setParameter('refuelDate', $fuelLog->getRefuelDate())
            ->setParameter('currentId', $fuelLog->getId() ?? 0)
            ->orderBy('fl.refuelDate', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if ($previousFuelLog && $previousFuelLog->getOdometerReading()) {
            $fuelLog->setPreviousOdometerReading($previousFuelLog->getOdometerReading());
            
            // Recalculer les valeurs dérivées
            $this->calculateDerivedValues($fuelLog);
        }
    }

    /**
     * Met à jour le kilométrage du véhicule et valide la cohérence
     */
    public function processFuelLogMileage(VehicleFuelLog $fuelLog, bool $isUpdate = false): array
    {
        $errors = [];

        // Valider la cohérence des données
        $validationErrors = $this->validateMileageConsistency($fuelLog);
        if (!empty($validationErrors)) {
            $errors = array_merge($errors, $validationErrors);
        }

        // Si pas d'erreurs, procéder aux calculs et mises à jour
        if (empty($errors)) {
            // Calculer les valeurs dérivées
            $this->calculateDerivedValues($fuelLog);

            // Mettre à jour le kilométrage du véhicule
            $this->updateVehicleMileageFromFuelLog($fuelLog->getVehicle());

            // Sauvegarder les changements
            $this->entityManager->flush();
        }

        return $errors;
    }
}
