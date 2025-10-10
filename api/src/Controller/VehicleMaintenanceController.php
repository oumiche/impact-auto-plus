<?php

namespace App\Controller;

use App\Entity\VehicleMaintenance;
use App\Entity\Vehicle;
use App\Repository\VehicleMaintenanceRepository;
use App\Repository\VehicleRepository;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Service\VehicleMileageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/vehicle-maintenances')]
class VehicleMaintenanceController extends AbstractTenantController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private VehicleMaintenanceRepository $vehicleMaintenanceRepository,
        private VehicleRepository $vehicleRepository,
        TenantService $tenantService,
        private CodeGenerationService $codeGenerationService,
        private VehicleMileageService $vehicleMileageService
    ) {
        parent::__construct($tenantService);
    }

    #[Route('', name: 'api_vehicle_maintenances_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = trim($request->query->get('search', ''));
            $vehicleId = $request->query->get('vehicle_id', '');
            $status = $request->query->get('status', '');
            $type = $request->query->get('type', '');

            $queryBuilder = $this->vehicleMaintenanceRepository->createQueryBuilder('m')
                ->leftJoin('m.vehicle', 'v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'mo')
                ->where('m.tenant = :tenant')
                ->setParameter('tenant', $currentTenant)
                ->orderBy('m.scheduledDate', 'DESC');

            // Filtres
            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'm.title LIKE :search OR 
                     m.description LIKE :search OR 
                     v.plateNumber LIKE :search OR
                     b.name LIKE :search OR
                     mo.name LIKE :search OR
                     m.serviceProvider LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }

            if (!empty($vehicleId)) {
                $queryBuilder->andWhere('m.vehicle = :vehicleId')
                    ->setParameter('vehicleId', $vehicleId);
            }

            if (!empty($status)) {
                $queryBuilder->andWhere('m.status = :status')
                    ->setParameter('status', $status);
            }

            if (!empty($type)) {
                $queryBuilder->andWhere('m.type = :type')
                    ->setParameter('type', $type);
            }

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(m.id)')->getQuery()->getSingleScalarResult();

            $maintenances = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $maintenanceData = [];
            foreach ($maintenances as $maintenance) {
                // Récupérer le code existant
                $entityCode = $this->codeGenerationService->getExistingCode('maintenance', $maintenance->getId(), $currentTenant);
                
                $maintenanceData[] = [
                    'id' => $maintenance->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'vehicle' => [
                        'id' => $maintenance->getVehicle()->getId(),
                        'plateNumber' => $maintenance->getVehicle()->getPlateNumber(),
                        'brand' => $maintenance->getVehicle()->getBrand() ? $maintenance->getVehicle()->getBrand()->getName() : null,
                        'model' => $maintenance->getVehicle()->getModel() ? $maintenance->getVehicle()->getModel()->getName() : null,
                    ],
                    'type' => $maintenance->getType(),
                    'typeLabel' => $this->getTypeLabel($maintenance->getType()),
                    'title' => $maintenance->getTitle(),
                    'description' => $maintenance->getDescription(),
                    'scheduledDate' => $maintenance->getScheduledDate() ? $maintenance->getScheduledDate()->format('Y-m-d') : null,
                    'completedDate' => $maintenance->getCompletedDate() ? $maintenance->getCompletedDate()->format('Y-m-d') : null,
                    'cost' => $maintenance->getCost(),
                    'status' => $maintenance->getStatus(),
                    'statusLabel' => $this->getStatusLabel($maintenance->getStatus()),
                    'odometerReading' => $maintenance->getOdometerReading(),
                    'nextMaintenanceOdometer' => $maintenance->getNextMaintenanceOdometer(),
                    'nextMaintenanceDate' => $maintenance->getNextMaintenanceDate() ? $maintenance->getNextMaintenanceDate()->format('Y-m-d') : null,
                    'serviceProvider' => $maintenance->getServiceProvider(),
                    'serviceLocation' => $maintenance->getServiceLocation(),
                    'notes' => $maintenance->getNotes(),
                    'partsUsed' => $maintenance->getPartsUsed(),
                    'workPerformed' => $maintenance->getWorkPerformed(),
                    'isWarrantyCovered' => $maintenance->isWarrantyCovered(),
                    'isRecurring' => $maintenance->isRecurring(),
                    'recurringIntervalDays' => $maintenance->getRecurringIntervalDays(),
                    'recurringIntervalKm' => $maintenance->getRecurringIntervalKm(),
                    'isActive' => $maintenance->isActive(),
                    'isOverdue' => $this->isOverdue($maintenance),
                    'isDueSoon' => $this->isDueSoon($maintenance),
                    'createdAt' => $maintenance->getCreatedAt() ? $maintenance->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $maintenance->getUpdatedAt() ? $maintenance->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                ];
            }

            $totalPages = ceil($total / $limit);

            return new JsonResponse([
                'success' => true,
                'data' => $maintenanceData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => $totalPages,
                    'hasPrev' => $page > 1,
                    'hasNext' => $page < $totalPages,
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des maintenances: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('', name: 'api_vehicle_maintenances_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Données JSON invalides'
                ], 400);
            }

            // Validation et conversion des données avec vérifications de type explicites
            $vehicleId = isset($data['vehicleId']) && is_numeric($data['vehicleId']) ? (int) $data['vehicleId'] : null;
            $type = isset($data['type']) && is_string($data['type']) ? trim($data['type']) : null;
            $title = isset($data['title']) && is_string($data['title']) ? trim($data['title']) : null;
            $description = isset($data['description']) && is_string($data['description']) ? trim($data['description']) : null;
            $scheduledDate = isset($data['scheduledDate']) && is_string($data['scheduledDate']) ? trim($data['scheduledDate']) : null;
            $completedDate = isset($data['completedDate']) && is_string($data['completedDate']) ? trim($data['completedDate']) : null;
            $cost = isset($data['cost']) && is_numeric($data['cost']) ? (float) $data['cost'] : null;
            $status = isset($data['status']) && is_string($data['status']) ? trim($data['status']) : 'scheduled';
            $odometerReading = isset($data['odometerReading']) && is_numeric($data['odometerReading']) ? (int) $data['odometerReading'] : null;
            $nextMaintenanceOdometer = isset($data['nextMaintenanceOdometer']) && is_numeric($data['nextMaintenanceOdometer']) ? (int) $data['nextMaintenanceOdometer'] : null;
            $nextMaintenanceDate = isset($data['nextMaintenanceDate']) && is_string($data['nextMaintenanceDate']) ? trim($data['nextMaintenanceDate']) : null;
            $serviceProvider = isset($data['serviceProvider']) && is_string($data['serviceProvider']) ? trim($data['serviceProvider']) : null;
            $serviceLocation = isset($data['serviceLocation']) && is_string($data['serviceLocation']) ? trim($data['serviceLocation']) : null;
            $notes = isset($data['notes']) && is_string($data['notes']) ? trim($data['notes']) : null;
            $partsUsed = isset($data['partsUsed']) && is_string($data['partsUsed']) ? trim($data['partsUsed']) : null;
            $workPerformed = isset($data['workPerformed']) && is_string($data['workPerformed']) ? trim($data['workPerformed']) : null;
            $isWarrantyCovered = isset($data['isWarrantyCovered']) && (is_bool($data['isWarrantyCovered']) || is_numeric($data['isWarrantyCovered'])) ? (bool) $data['isWarrantyCovered'] : false;
            $isRecurring = isset($data['isRecurring']) && (is_bool($data['isRecurring']) || is_numeric($data['isRecurring'])) ? (bool) $data['isRecurring'] : false;
            $recurringIntervalDays = isset($data['recurringIntervalDays']) && is_numeric($data['recurringIntervalDays']) ? (int) $data['recurringIntervalDays'] : null;
            $recurringIntervalKm = isset($data['recurringIntervalKm']) && is_numeric($data['recurringIntervalKm']) ? (int) $data['recurringIntervalKm'] : null;
            $isActive = isset($data['isActive']) && (is_bool($data['isActive']) || is_numeric($data['isActive'])) ? (bool) $data['isActive'] : true;

            // Validation des champs requis
            if (!$vehicleId || !$type || !$title || !$scheduledDate) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Véhicule, type, titre et date programmée sont requis'
                ], 400);
            }

            // Vérifier que le véhicule appartient au tenant
            $vehicle = $this->vehicleRepository->findOneBy(['id' => $vehicleId, 'tenant' => $currentTenant]);
            if (!$vehicle) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Véhicule non trouvé'
                ], 404);
            }

            // Créer la maintenance
            $maintenance = new VehicleMaintenance();
            $maintenance->setTenant($currentTenant);
            $maintenance->setVehicle($vehicle);
            $maintenance->setType($type);
            $maintenance->setTitle($title);
            $maintenance->setDescription($description);
            
            try {
                $maintenance->setScheduledDate(new \DateTime($scheduledDate));
            } catch (\Exception $e) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Date programmée invalide'
                ], 400);
            }

            if ($completedDate) {
                try {
                    $maintenance->setCompletedDate(new \DateTime($completedDate));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'error' => 'Date de réalisation invalide'
                    ], 400);
                }
            }

            $maintenance->setCost($cost);
            $maintenance->setStatus($status);
            $maintenance->setOdometerReading($odometerReading);
            $maintenance->setNextMaintenanceOdometer($nextMaintenanceOdometer);
            
            if ($nextMaintenanceDate) {
                try {
                    $maintenance->setNextMaintenanceDate(new \DateTime($nextMaintenanceDate));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'error' => 'Date de prochaine maintenance invalide'
                    ], 400);
                }
            }

            $maintenance->setServiceProvider($serviceProvider);
            $maintenance->setServiceLocation($serviceLocation);
            $maintenance->setNotes($notes);
            $maintenance->setPartsUsed($partsUsed);
            $maintenance->setWorkPerformed($workPerformed);
            $maintenance->setIsWarrantyCovered($isWarrantyCovered);
            $maintenance->setIsRecurring($isRecurring);
            $maintenance->setRecurringIntervalDays($recurringIntervalDays);
            $maintenance->setRecurringIntervalKm($recurringIntervalKm);
            $maintenance->setIsActive($isActive);

            // Synchroniser le kilométrage du véhicule si un kilométrage est fourni
            if ($odometerReading) {
                $vehicle->setMileage($odometerReading);
            }

            $this->entityManager->persist($maintenance);
            $this->entityManager->flush();

            // Générer automatiquement un code pour l'entretien
            try {
                $entityCode = $this->codeGenerationService->generateCode(
                    'maintenance',
                    $maintenance->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $maintenanceCode = $entityCode->getCode();
            } catch (\Exception $e) {
                // Si la génération échoue, on continue sans code
                $maintenanceCode = null;
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Entretien créé avec succès',
                'data' => [
                    'id' => $maintenance->getId(),
                    'code' => $maintenanceCode,
                    'title' => $maintenance->getTitle(),
                    'type' => $maintenance->getType(),
                    'status' => $maintenance->getStatus(),
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la création de la maintenance: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'api_vehicle_maintenances_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $maintenance = $this->vehicleMaintenanceRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$maintenance) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Maintenance non trouvée'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Données JSON invalides'
                ], 400);
            }

            // Mise à jour des champs avec vérifications de type explicites
            if (isset($data['vehicleId']) && is_numeric($data['vehicleId'])) {
                $vehicleId = (int) $data['vehicleId'];
                $vehicle = $this->vehicleRepository->findOneBy(['id' => $vehicleId, 'tenant' => $currentTenant]);
                if (!$vehicle) {
                    return new JsonResponse([
                        'success' => false,
                        'error' => 'Véhicule non trouvé'
                    ], 404);
                }
                $maintenance->setVehicle($vehicle);
            }

            if (isset($data['type']) && is_string($data['type'])) {
                $maintenance->setType(trim($data['type']));
            }

            if (isset($data['title']) && is_string($data['title'])) {
                $maintenance->setTitle(trim($data['title']));
            }

            if (isset($data['description']) && is_string($data['description'])) {
                $maintenance->setDescription(trim($data['description']));
            }

            if (isset($data['scheduledDate']) && is_string($data['scheduledDate'])) {
                try {
                    $maintenance->setScheduledDate(new \DateTime(trim($data['scheduledDate'])));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'error' => 'Date programmée invalide'
                    ], 400);
                }
            }

            if (isset($data['completedDate']) && is_string($data['completedDate'])) {
                $completedDate = trim($data['completedDate']);
                if ($completedDate) {
                    try {
                        $maintenance->setCompletedDate(new \DateTime($completedDate));
                    } catch (\Exception $e) {
                        return new JsonResponse([
                            'success' => false,
                            'error' => 'Date de réalisation invalide'
                        ], 400);
                    }
                } else {
                    $maintenance->setCompletedDate(null);
                }
            }

            if (isset($data['cost']) && is_numeric($data['cost'])) {
                $maintenance->setCost((float) $data['cost']);
            }

            if (isset($data['status']) && is_string($data['status'])) {
                $maintenance->setStatus(trim($data['status']));
            }

            if (isset($data['odometerReading']) && is_numeric($data['odometerReading'])) {
                $maintenance->setOdometerReading((int) $data['odometerReading']);
            }

            if (isset($data['nextMaintenanceOdometer']) && is_numeric($data['nextMaintenanceOdometer'])) {
                $maintenance->setNextMaintenanceOdometer((int) $data['nextMaintenanceOdometer']);
            }

            if (isset($data['nextMaintenanceDate']) && is_string($data['nextMaintenanceDate'])) {
                $nextMaintenanceDate = trim($data['nextMaintenanceDate']);
                if ($nextMaintenanceDate) {
                    try {
                        $maintenance->setNextMaintenanceDate(new \DateTime($nextMaintenanceDate));
                    } catch (\Exception $e) {
                        return new JsonResponse([
                            'success' => false,
                            'error' => 'Date de prochaine maintenance invalide'
                        ], 400);
                    }
                } else {
                    $maintenance->setNextMaintenanceDate(null);
                }
            }

            if (isset($data['serviceProvider']) && is_string($data['serviceProvider'])) {
                $maintenance->setServiceProvider(trim($data['serviceProvider']));
            }

            if (isset($data['serviceLocation']) && is_string($data['serviceLocation'])) {
                $maintenance->setServiceLocation(trim($data['serviceLocation']));
            }

            if (isset($data['notes']) && is_string($data['notes'])) {
                $maintenance->setNotes(trim($data['notes']));
            }

            if (isset($data['partsUsed']) && is_string($data['partsUsed'])) {
                $maintenance->setPartsUsed(trim($data['partsUsed']));
            }

            if (isset($data['workPerformed']) && is_string($data['workPerformed'])) {
                $maintenance->setWorkPerformed(trim($data['workPerformed']));
            }

            if (isset($data['isWarrantyCovered']) && (is_bool($data['isWarrantyCovered']) || is_numeric($data['isWarrantyCovered']))) {
                $maintenance->setIsWarrantyCovered((bool) $data['isWarrantyCovered']);
            }

            if (isset($data['isRecurring']) && (is_bool($data['isRecurring']) || is_numeric($data['isRecurring']))) {
                $maintenance->setIsRecurring((bool) $data['isRecurring']);
            }

            if (isset($data['recurringIntervalDays']) && is_numeric($data['recurringIntervalDays'])) {
                $maintenance->setRecurringIntervalDays((int) $data['recurringIntervalDays']);
            }

            if (isset($data['recurringIntervalKm']) && is_numeric($data['recurringIntervalKm'])) {
                $maintenance->setRecurringIntervalKm((int) $data['recurringIntervalKm']);
            }

            if (isset($data['isActive']) && (is_bool($data['isActive']) || is_numeric($data['isActive']))) {
                $maintenance->setIsActive((bool) $data['isActive']);
            }

            // Synchroniser le kilométrage du véhicule si un kilométrage est fourni
            if (isset($data['odometerReading']) && is_numeric($data['odometerReading'])) {
                $odometerReading = (int) $data['odometerReading'];
                $maintenance->setOdometerReading($odometerReading);
                $maintenance->getVehicle()->setMileage($odometerReading);
            }

            $maintenance->setUpdatedAt(new \DateTime());

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Entretien mis à jour avec succès',
                'data' => [
                    'id' => $maintenance->getId(),
                    'title' => $maintenance->getTitle(),
                    'type' => $maintenance->getType(),
                    'status' => $maintenance->getStatus(),
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la mise à jour de la maintenance: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'api_vehicle_maintenances_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $maintenance = $this->vehicleMaintenanceRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$maintenance) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Maintenance non trouvée'
                ], 404);
            }

            $this->entityManager->remove($maintenance);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Entretien supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la suppression de la maintenance: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/vehicles', name: 'api_vehicle_maintenances_vehicles', methods: ['GET'])]
    public function getAvailableVehicles(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $search = trim($request->query->get('search', ''));

            $queryBuilder = $this->vehicleRepository->createQueryBuilder('v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->where('v.tenant = :tenant')
                ->andWhere('v.status = :status')
                ->setParameter('tenant', $currentTenant)
                ->setParameter('status', 'active')
                ->orderBy('v.plateNumber', 'ASC');

            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'v.plateNumber LIKE :search OR 
                     b.name LIKE :search OR 
                     m.name LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }

            $vehicles = $queryBuilder->getQuery()->getResult();

            $vehicleData = [];
            foreach ($vehicles as $vehicle) {
                $vehicleData[] = [
                    'id' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand() ? $vehicle->getBrand()->getName() : null,
                    'model' => $vehicle->getModel() ? $vehicle->getModel()->getName() : null,
                    'year' => $vehicle->getYear(),
                    'fullName' => $vehicle->getPlateNumber() . ' - ' . 
                                ($vehicle->getBrand() ? $vehicle->getBrand()->getName() : '') . ' ' . 
                                ($vehicle->getModel() ? $vehicle->getModel()->getName() : '') . 
                                ($vehicle->getYear() ? ' (' . $vehicle->getYear() . ')' : ''),
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $vehicleData
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des véhicules: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getTypeLabel(string $type): string
    {
        return match($type) {
            'preventive' => 'Préventive',
            'corrective' => 'Corrective',
            'inspection' => 'Inspection',
            'repair' => 'Réparation',
            default => $type
        };
    }

    private function getStatusLabel(string $status): string
    {
        return match($status) {
            'scheduled' => 'Programmée',
            'in_progress' => 'En cours',
            'completed' => 'Terminée',
            'cancelled' => 'Annulée',
            default => $status
        };
    }

    private function isOverdue(VehicleMaintenance $maintenance): bool
    {
        if ($maintenance->getStatus() === 'completed' || $maintenance->getStatus() === 'cancelled') {
            return false;
        }

        $today = new \DateTime();
        return $maintenance->getScheduledDate() < $today;
    }

    #[Route('/sync-vehicle-mileage/{vehicleId}', name: 'sync_vehicle_mileage_from_maintenance', methods: ['POST'])]
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

            // Trouver la dernière maintenance avec un kilométrage
            $lastMaintenance = $this->vehicleMaintenanceRepository->createQueryBuilder('m')
                ->where('m.vehicle = :vehicle')
                ->andWhere('m.odometerReading IS NOT NULL')
                ->setParameter('vehicle', $vehicle)
                ->orderBy('m.completedDate', 'DESC')
                ->addOrderBy('m.scheduledDate', 'DESC')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();

            if ($lastMaintenance && $lastMaintenance->getOdometerReading()) {
                $vehicle->setMileage($lastMaintenance->getOdometerReading());
                $this->entityManager->flush();

                return new JsonResponse([
                    'success' => true,
                    'message' => 'Kilométrage du véhicule synchronisé avec succès',
                    'data' => [
                        'vehicleId' => $vehicle->getId(),
                        'plateNumber' => $vehicle->getPlateNumber(),
                        'currentMileage' => $vehicle->getMileage(),
                        'lastMaintenanceDate' => $lastMaintenance->getCompletedDate() ? 
                            $lastMaintenance->getCompletedDate()->format('Y-m-d') : 
                            $lastMaintenance->getScheduledDate()->format('Y-m-d')
                    ],
                    'code' => 200
                ]);
            } else {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Aucun entretien avec kilométrage trouvé pour ce véhicule',
                    'code' => 404
                ], 404);
            }

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation du kilométrage: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    private function isDueSoon(VehicleMaintenance $maintenance): bool
    {
        if ($maintenance->getStatus() === 'completed' || $maintenance->getStatus() === 'cancelled') {
            return false;
        }

        $today = new \DateTime();
        $scheduledDate = $maintenance->getScheduledDate();
        $dueDate = (new \DateTime())->setTimestamp($scheduledDate->getTimestamp())->modify('+7 days');

        return $scheduledDate <= $dueDate && $scheduledDate >= $today;
    }
}
