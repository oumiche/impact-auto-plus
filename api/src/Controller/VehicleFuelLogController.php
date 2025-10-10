<?php

namespace App\Controller;

use App\Entity\VehicleFuelLog;
use App\Entity\Vehicle;
use App\Entity\Driver;
use App\Entity\FuelType;
use App\Repository\VehicleFuelLogRepository;
use App\Repository\VehicleRepository;
use App\Repository\DriverRepository;
use App\Repository\FuelTypeRepository;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Service\VehicleMileageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/vehicle-fuel-logs', name: 'api_vehicle_fuel_log_')]
class VehicleFuelLogController extends AbstractTenantController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private VehicleFuelLogRepository $vehicleFuelLogRepository,
        private VehicleRepository $vehicleRepository,
        private DriverRepository $driverRepository,
        private FuelTypeRepository $fuelTypeRepository,
        TenantService $tenantService,
        private CodeGenerationService $codeGenerationService,
        private VehicleMileageService $vehicleMileageService
    ) {
        parent::__construct($tenantService);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = $request->query->get('search', '');
            $vehicleId = $request->query->get('vehicle_id', '');
            $driverId = $request->query->get('driver_id', '');
            
            $offset = ($page - 1) * $limit;
            
            $queryBuilder = $this->vehicleFuelLogRepository->createQueryBuilder('vfl')
                ->leftJoin('vfl.vehicle', 'v')
                ->leftJoin('vfl.driver', 'd')
                ->leftJoin('vfl.fuelType', 'ft')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->where('vfl.tenant = :tenant')
                ->setParameter('tenant', $currentTenant);
            
            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'v.plateNumber LIKE :search OR 
                     b.name LIKE :search OR 
                     m.name LIKE :search OR
                     d.firstName LIKE :search OR
                     d.lastName LIKE :search OR
                     vfl.stationName LIKE :search OR
                     vfl.receiptNumber LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }
            
            if (!empty($vehicleId)) {
                $queryBuilder->andWhere('vfl.vehicle = :vehicleId')
                    ->setParameter('vehicleId', $vehicleId);
            }
            
            if (!empty($driverId)) {
                $queryBuilder->andWhere('vfl.driver = :driverId')
                    ->setParameter('driverId', $driverId);
            }
            
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(vfl.id)')
                ->getQuery()
                ->getSingleScalarResult();
            
            $fuelLogs = $queryBuilder
                ->orderBy('vfl.refuelDate', 'DESC')
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();
            
            $fuelLogData = [];
            foreach ($fuelLogs as $fuelLog) {
                // Récupérer le code existant
                $entityCode = $this->codeGenerationService->getExistingCode('fuel_log', $fuelLog->getId(), $currentTenant);
                
                $fuelLogData[] = [
                    'id' => $fuelLog->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'vehicle' => [
                        'id' => $fuelLog->getVehicle()->getId(),
                        'plateNumber' => $fuelLog->getVehicle()->getPlateNumber(),
                        'brand' => $fuelLog->getVehicle()->getBrand() ? $fuelLog->getVehicle()->getBrand()->getName() : null,
                        'model' => $fuelLog->getVehicle()->getModel() ? $fuelLog->getVehicle()->getModel()->getName() : null,
                        'year' => $fuelLog->getVehicle()->getYear()
                    ],
                    'driver' => $fuelLog->getDriver() ? [
                        'id' => $fuelLog->getDriver()->getId(),
                        'firstName' => $fuelLog->getDriver()->getFirstName(),
                        'lastName' => $fuelLog->getDriver()->getLastName(),
                        'fullName' => $fuelLog->getDriver()->getFirstName() . ' ' . $fuelLog->getDriver()->getLastName()
                    ] : null,
                    'fuelType' => $fuelLog->getFuelType() ? [
                        'id' => $fuelLog->getFuelType()->getId(),
                        'name' => $fuelLog->getFuelType()->getName(),
                        'icon' => $fuelLog->getFuelType()->getIcon(),
                        'isEcoFriendly' => $fuelLog->getFuelType()->isEcoFriendly()
                    ] : null,
                    'refuelDate' => $fuelLog->getRefuelDate() ? $fuelLog->getRefuelDate()->format('Y-m-d') : null,
                    'quantity' => $fuelLog->getQuantity(),
                    'unitPrice' => $fuelLog->getUnitPrice(),
                    'totalCost' => $fuelLog->getTotalCost(),
                    'odometerReading' => $fuelLog->getOdometerReading(),
                    'previousOdometerReading' => $fuelLog->getPreviousOdometerReading(),
                    'kilometersDriven' => $fuelLog->getKilometersDriven(),
                    'fuelEfficiency' => $fuelLog->getFuelEfficiency(),
                    'stationName' => $fuelLog->getStationName(),
                    'stationLocation' => $fuelLog->getStationLocation(),
                    'receiptNumber' => $fuelLog->getReceiptNumber(),
                    'notes' => $fuelLog->getNotes(),
                    'isFullTank' => $fuelLog->isFullTank(),
                    'isActive' => $fuelLog->isActive(),
                    'createdAt' => $fuelLog->getCreatedAt() ? $fuelLog->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $fuelLog->getUpdatedAt() ? $fuelLog->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ];
            }
            
            return new JsonResponse([
                'success' => true,
                'data' => $fuelLogData,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => ceil($total / $limit),
                    'totalItems' => $total,
                    'itemsPerPage' => $limit
                ],
                'code' => 200
            ]);
            
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement du suivi de carburant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation et typage explicite des champs requis
            // Validation robuste des données avec vérification explicite des types
            $vehicleId = null;
            if (isset($data['vehicleId'])) {
                $vehicleIdValue = $data['vehicleId'];
                if (is_numeric($vehicleIdValue) && $vehicleIdValue > 0) {
                    $vehicleId = (int) $vehicleIdValue;
                }
            }
            
            $refuelDate = null;
            if (isset($data['refuelDate'])) {
                $refuelDateValue = $data['refuelDate'];
                if (is_string($refuelDateValue)) {
                    $refuelDate = trim($refuelDateValue);
                }
            }
            
            $quantity = null;
            if (isset($data['quantity'])) {
                $quantityValue = $data['quantity'];
                if (is_numeric($quantityValue) && $quantityValue > 0) {
                    $quantity = (float) $quantityValue;
                }
            }
            
            $unitPrice = null;
            if (isset($data['unitPrice'])) {
                $unitPriceValue = $data['unitPrice'];
                if (is_numeric($unitPriceValue) && $unitPriceValue >= 0) {
                    $unitPrice = (float) $unitPriceValue;
                }
            }
            
            $totalCost = null;
            if (isset($data['totalCost'])) {
                $totalCostValue = $data['totalCost'];
                if (is_numeric($totalCostValue) && $totalCostValue >= 0) {
                    $totalCost = (float) $totalCostValue;
                }
            }
            
            $odometerReading = null;
            if (isset($data['odometerReading'])) {
                $odometerValue = $data['odometerReading'];
                if (is_numeric($odometerValue) && $odometerValue >= 0) {
                    $odometerReading = (int) $odometerValue;
                }
            }

            if (!$vehicleId || !$refuelDate || !$quantity || !$unitPrice || !$totalCost || !$odometerReading) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule, date de ravitaillement, quantité, prix unitaire, coût total et kilométrage sont requis',
                    'code' => 400
                ], 400);
            }

            // Vérifier que le véhicule existe et appartient au tenant
            $vehicle = $this->vehicleRepository->findOneBy(['id' => $vehicleId, 'tenant' => $currentTenant]);
            if (!$vehicle) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule non trouvé',
                    'code' => 404
                ], 404);
            }

            // Créer le nouveau suivi de carburant
            $fuelLog = new VehicleFuelLog();
            $fuelLog->setTenant($currentTenant);
            $fuelLog->setVehicle($vehicle);
            $fuelLog->setRefuelDate(new \DateTime($refuelDate));
            $fuelLog->setQuantity($quantity);
            $fuelLog->setUnitPrice($unitPrice);
            $fuelLog->setTotalCost($totalCost);
            $fuelLog->setOdometerReading($odometerReading);

            // Champs optionnels avec validation explicite et robuste
            if (isset($data['driverId'])) {
                $driverIdValue = $data['driverId'];
                if (is_numeric($driverIdValue) && $driverIdValue > 0) {
                    $driver = $this->driverRepository->findOneBy(['id' => (int) $driverIdValue, 'tenant' => $currentTenant]);
                    if ($driver) {
                        $fuelLog->setDriver($driver);
                    }
                }
            }
            
            if (isset($data['fuelTypeId'])) {
                $fuelTypeIdValue = $data['fuelTypeId'];
                if (is_numeric($fuelTypeIdValue) && $fuelTypeIdValue > 0) {
                    $fuelType = $this->fuelTypeRepository->find((int) $fuelTypeIdValue);
                    if ($fuelType) {
                        $fuelLog->setFuelType($fuelType);
                    }
                }
            }
            
            if (isset($data['previousOdometerReading'])) {
                $previousOdometerValue = $data['previousOdometerReading'];
                if (is_numeric($previousOdometerValue) && $previousOdometerValue >= 0) {
                    $fuelLog->setPreviousOdometerReading((int) $previousOdometerValue);
                }
            }
            
            if (isset($data['kilometersDriven'])) {
                $kilometersValue = $data['kilometersDriven'];
                if (is_numeric($kilometersValue) && $kilometersValue >= 0) {
                    $fuelLog->setKilometersDriven((int) $kilometersValue);
                }
            }
            
            if (isset($data['fuelEfficiency'])) {
                $efficiencyValue = $data['fuelEfficiency'];
                if (is_numeric($efficiencyValue) && $efficiencyValue >= 0) {
                    $fuelLog->setFuelEfficiency((float) $efficiencyValue);
                }
            }
            
            if (isset($data['stationName'])) {
                $stationNameValue = $data['stationName'];
                if (is_string($stationNameValue)) {
                    $stationName = trim($stationNameValue);
                    if (!empty($stationName)) {
                        $fuelLog->setStationName($stationName);
                    }
                }
            }
            
            if (isset($data['stationLocation'])) {
                $stationLocationValue = $data['stationLocation'];
                if (is_string($stationLocationValue)) {
                    $stationLocation = trim($stationLocationValue);
                    if (!empty($stationLocation)) {
                        $fuelLog->setStationLocation($stationLocation);
                    }
                }
            }
            
            if (isset($data['receiptNumber'])) {
                $receiptNumberValue = $data['receiptNumber'];
                if (is_string($receiptNumberValue)) {
                    $receiptNumber = trim($receiptNumberValue);
                    if (!empty($receiptNumber)) {
                        $fuelLog->setReceiptNumber($receiptNumber);
                    }
                }
            }
            
            if (isset($data['notes'])) {
                $notesValue = $data['notes'];
                if (is_string($notesValue)) {
                    $notes = trim($notesValue);
                    if (!empty($notes)) {
                        $fuelLog->setNotes($notes);
                    }
                }
            }
            
            if (isset($data['isFullTank'])) {
                $isFullTankValue = $data['isFullTank'];
                if (is_bool($isFullTankValue) || is_numeric($isFullTankValue)) {
                    $fuelLog->setIsFullTank((bool) $isFullTankValue);
                }
            }
            
            if (isset($data['isActive'])) {
                $isActiveValue = $data['isActive'];
                if (is_bool($isActiveValue) || is_numeric($isActiveValue)) {
                    $fuelLog->setIsActive((bool) $isActiveValue);
                }
            }

            // Utiliser le service de synchronisation pour valider et mettre à jour le kilométrage
            $mileageErrors = $this->vehicleMileageService->processFuelLogMileage($fuelLog, false);
            
            if (!empty($mileageErrors)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le kilométrage saisi n\'est pas cohérent',
                    'errors' => $mileageErrors,
                    'code' => 400
                ], 400);
            }

            $this->entityManager->persist($fuelLog);
            $this->entityManager->flush();

            // Générer automatiquement un code pour le suivi de carburant
            try {
                $entityCode = $this->codeGenerationService->generateCode(
                    'fuel_log',
                    $fuelLog->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $fuelLogCode = $entityCode->getCode();
            } catch (\Exception $e) {
                // Si la génération échoue, on continue sans code
                $fuelLogCode = null;
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Suivi de carburant créé avec succès',
                'data' => [
                    'id' => $fuelLog->getId(),
                    'code' => $fuelLogCode,
                    'vehicle' => [
                        'id' => $fuelLog->getVehicle()->getId(),
                        'plateNumber' => $fuelLog->getVehicle()->getPlateNumber()
                    ],
                    'refuelDate' => $fuelLog->getRefuelDate()->format('Y-m-d'),
                    'quantity' => $fuelLog->getQuantity(),
                    'totalCost' => $fuelLog->getTotalCost()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du suivi de carburant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $fuelLog = $this->vehicleFuelLogRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$fuelLog) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Suivi de carburant non trouvé',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour les champs avec validation explicite et robuste
            if (isset($data['refuelDate'])) {
                $refuelDateValue = $data['refuelDate'];
                if (is_string($refuelDateValue)) {
                    $refuelDate = trim($refuelDateValue);
                    if (!empty($refuelDate)) {
                        try {
                            $fuelLog->setRefuelDate(new \DateTime($refuelDate));
                        } catch (\Exception $e) {
                            // Ignorer les dates invalides
                        }
                    }
                }
            }
            
            if (isset($data['quantity'])) {
                $quantityValue = $data['quantity'];
                if (is_numeric($quantityValue) && $quantityValue > 0) {
                    $fuelLog->setQuantity((float) $quantityValue);
                }
            }
            
            if (isset($data['unitPrice'])) {
                $unitPriceValue = $data['unitPrice'];
                if (is_numeric($unitPriceValue) && $unitPriceValue >= 0) {
                    $fuelLog->setUnitPrice((float) $unitPriceValue);
                }
            }
            
            if (isset($data['totalCost'])) {
                $totalCostValue = $data['totalCost'];
                if (is_numeric($totalCostValue) && $totalCostValue >= 0) {
                    $fuelLog->setTotalCost((float) $totalCostValue);
                }
            }
            
            if (isset($data['odometerReading'])) {
                $odometerValue = $data['odometerReading'];
                if (is_numeric($odometerValue) && $odometerValue >= 0) {
                    $fuelLog->setOdometerReading((int) $odometerValue);
                }
            }
            
            if (isset($data['driverId'])) {
                $driverIdValue = $data['driverId'];
                if (is_numeric($driverIdValue) && $driverIdValue > 0) {
                    $driver = $this->driverRepository->findOneBy(['id' => (int) $driverIdValue, 'tenant' => $currentTenant]);
                    $fuelLog->setDriver($driver);
                } else {
                    $fuelLog->setDriver(null);
                }
            }
            
            if (isset($data['fuelTypeId'])) {
                $fuelTypeIdValue = $data['fuelTypeId'];
                if (is_numeric($fuelTypeIdValue) && $fuelTypeIdValue > 0) {
                    $fuelType = $this->fuelTypeRepository->find((int) $fuelTypeIdValue);
                    $fuelLog->setFuelType($fuelType);
                } else {
                    $fuelLog->setFuelType(null);
                }
            }
            
            if (isset($data['previousOdometerReading'])) {
                $previousOdometerValue = $data['previousOdometerReading'];
                if (is_numeric($previousOdometerValue) && $previousOdometerValue >= 0) {
                    $fuelLog->setPreviousOdometerReading((int) $previousOdometerValue);
                } else {
                    $fuelLog->setPreviousOdometerReading(null);
                }
            }
            
            if (isset($data['kilometersDriven'])) {
                $kilometersValue = $data['kilometersDriven'];
                if (is_numeric($kilometersValue) && $kilometersValue >= 0) {
                    $fuelLog->setKilometersDriven((int) $kilometersValue);
                } else {
                    $fuelLog->setKilometersDriven(null);
                }
            }
            
            if (isset($data['fuelEfficiency'])) {
                $efficiencyValue = $data['fuelEfficiency'];
                if (is_numeric($efficiencyValue) && $efficiencyValue >= 0) {
                    $fuelLog->setFuelEfficiency((float) $efficiencyValue);
                } else {
                    $fuelLog->setFuelEfficiency(null);
                }
            }
            
            if (isset($data['stationName'])) {
                $stationNameValue = $data['stationName'];
                if (is_string($stationNameValue)) {
                    $stationName = trim($stationNameValue);
                    $fuelLog->setStationName(empty($stationName) ? null : $stationName);
                } else {
                    $fuelLog->setStationName(null);
                }
            }
            
            if (isset($data['stationLocation'])) {
                $stationLocationValue = $data['stationLocation'];
                if (is_string($stationLocationValue)) {
                    $stationLocation = trim($stationLocationValue);
                    $fuelLog->setStationLocation(empty($stationLocation) ? null : $stationLocation);
                } else {
                    $fuelLog->setStationLocation(null);
                }
            }
            
            if (isset($data['receiptNumber'])) {
                $receiptNumberValue = $data['receiptNumber'];
                if (is_string($receiptNumberValue)) {
                    $receiptNumber = trim($receiptNumberValue);
                    $fuelLog->setReceiptNumber(empty($receiptNumber) ? null : $receiptNumber);
                } else {
                    $fuelLog->setReceiptNumber(null);
                }
            }
            
            if (isset($data['notes'])) {
                $notesValue = $data['notes'];
                if (is_string($notesValue)) {
                    $notes = trim($notesValue);
                    $fuelLog->setNotes(empty($notes) ? null : $notes);
                } else {
                    $fuelLog->setNotes(null);
                }
            }
            
            if (isset($data['isFullTank'])) {
                $isFullTankValue = $data['isFullTank'];
                if (is_bool($isFullTankValue) || is_numeric($isFullTankValue)) {
                    $fuelLog->setIsFullTank((bool) $isFullTankValue);
                }
            }
            
            if (isset($data['isActive'])) {
                $isActiveValue = $data['isActive'];
                if (is_bool($isActiveValue) || is_numeric($isActiveValue)) {
                    $fuelLog->setIsActive((bool) $isActiveValue);
                }
            }

            // Utiliser le service de synchronisation pour valider et mettre à jour le kilométrage
            $mileageErrors = $this->vehicleMileageService->processFuelLogMileage($fuelLog, true);
            
            if (!empty($mileageErrors)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le kilométrage saisi n\'est pas cohérent',
                    'errors' => $mileageErrors,
                    'code' => 400
                ], 400);
            }

            $fuelLog->setUpdatedAt(new \DateTime());

            return new JsonResponse([
                'success' => true,
                'message' => 'Suivi de carburant mis à jour avec succès',
                'data' => [
                    'id' => $fuelLog->getId(),
                    'refuelDate' => $fuelLog->getRefuelDate()->format('Y-m-d'),
                    'quantity' => $fuelLog->getQuantity(),
                    'totalCost' => $fuelLog->getTotalCost()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du suivi de carburant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $fuelLog = $this->vehicleFuelLogRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$fuelLog) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Suivi de carburant non trouvé',
                    'code' => 404
                ], 404);
            }

            $this->entityManager->remove($fuelLog);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Carnet de carburant supprimé avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du carnet de carburant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/vehicles', name: 'get_vehicles', methods: ['GET'])]
    public function getAvailableVehicles(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $search = $request->query->get('search', '');

            $queryBuilder = $this->vehicleRepository->createQueryBuilder('v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->where('v.tenant = :tenant')
                ->andWhere('v.status = :status')
                ->setParameter('tenant', $currentTenant)
                ->setParameter('status', 'active');

            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'v.plateNumber LIKE :search OR 
                     b.name LIKE :search OR 
                     m.name LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }

            $vehicles = $queryBuilder
                ->orderBy('v.plateNumber', 'ASC')
                ->getQuery()
                ->getResult();

            $vehicleData = [];
            foreach ($vehicles as $vehicle) {
                $vehicleData[] = [
                    'id' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand() ? $vehicle->getBrand()->getName() : null,
                    'model' => $vehicle->getModel() ? $vehicle->getModel()->getName() : null,
                    'year' => $vehicle->getYear()
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $vehicleData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des véhicules: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/drivers', name: 'get_drivers', methods: ['GET'])]
    public function getAvailableDrivers(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $search = $request->query->get('search', '');

            $queryBuilder = $this->driverRepository->createQueryBuilder('d')
                ->where('d.tenant = :tenant')
                ->andWhere('d.status = :status')
                ->setParameter('tenant', $currentTenant)
                ->setParameter('status', 'active');

            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'd.firstName LIKE :search OR 
                     d.lastName LIKE :search OR
                     d.licenseNumber LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }

            $drivers = $queryBuilder
                ->orderBy('d.firstName', 'ASC')
                ->addOrderBy('d.lastName', 'ASC')
                ->getQuery()
                ->getResult();

            $driverData = [];
            foreach ($drivers as $driver) {
                $driverData[] = [
                    'id' => $driver->getId(),
                    'firstName' => $driver->getFirstName(),
                    'lastName' => $driver->getLastName(),
                    'fullName' => $driver->getFirstName() . ' ' . $driver->getLastName(),
                    'licenseNumber' => $driver->getLicenseNumber()
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $driverData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des conducteurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/fuel-types', name: 'get_fuel_types', methods: ['GET'])]
    public function getFuelTypes(): JsonResponse
    {
        try {
            $fuelTypes = $this->fuelTypeRepository->findAll();

            $fuelTypeData = [];
            foreach ($fuelTypes as $fuelType) {
                $fuelTypeData[] = [
                    'id' => $fuelType->getId(),
                    'name' => $fuelType->getName(),
                    'description' => $fuelType->getDescription(),
                    'icon' => $fuelType->getIcon(),
                    'isEcoFriendly' => $fuelType->isEcoFriendly()
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $fuelTypeData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des types de carburant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/sync-vehicle-mileage/{vehicleId}', name: 'sync_vehicle_mileage', methods: ['POST'])]
    public function syncVehicleMileage(Request $request, int $vehicleId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            // Vérifier que le véhicule existe et appartient au tenant
            $vehicle = $this->vehicleRepository->findOneBy(['id' => $vehicleId, 'tenant' => $currentTenant]);
            if (!$vehicle) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule non trouvé',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour le kilométrage du véhicule
            $this->vehicleMileageService->updateVehicleMileageFromFuelLog($vehicle);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Kilométrage du véhicule synchronisé avec succès',
                'data' => [
                    'vehicleId' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'currentMileage' => $vehicle->getMileage()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation du kilométrage: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
