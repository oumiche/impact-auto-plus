<?php

namespace App\Controller;

use App\Entity\VehicleIntervention;
use App\Repository\VehicleInterventionRepository;
use App\Repository\VehicleRepository;
use App\Repository\DriverRepository;
use App\Repository\InterventionTypeRepository;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/vehicle-interventions')]
class VehicleInterventionController extends AbstractTenantController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private VehicleInterventionRepository $interventionRepository,
        private VehicleRepository $vehicleRepository,
        private DriverRepository $driverRepository,
        private InterventionTypeRepository $interventionTypeRepository,
        TenantService $tenantService,
        private CodeGenerationService $codeGenerationService
    ) {
        parent::__construct($tenantService);
    }

    #[Route('', name: 'api_vehicle_interventions_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = trim($request->query->get('search', ''));
            $status = $request->query->get('status', '');
            $priority = $request->query->get('priority', '');
            $vehicleId = $request->query->get('vehicle_id', '');
            $brandId = $request->query->get('brand', '');
            $modelId = $request->query->get('model', '');
            $startDate = $request->query->get('startDate', '');
            $endDate = $request->query->get('endDate', '');

            $queryBuilder = $this->interventionRepository->createQueryBuilder('i')
                ->leftJoin('i.vehicle', 'v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->leftJoin('i.driver', 'd')
                ->leftJoin('i.interventionType', 'it')
                ->addSelect('v', 'b', 'm', 'd', 'it')
                ->where('i.tenant = :tenant')
                ->setParameter('tenant', $currentTenant)
                ->orderBy('i.reportedDate', 'DESC');

            // Filtres
            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'i.title LIKE :search OR 
                     i.description LIKE :search OR 
                     i.interventionNumber LIKE :search OR
                     v.plateNumber LIKE :search OR
                     b.name LIKE :search OR
                     m.name LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }

            if (!empty($status)) {
                $queryBuilder->andWhere('i.currentStatus = :status')
                    ->setParameter('status', $status);
            }

            if (!empty($priority)) {
                $queryBuilder->andWhere('i.priority = :priority')
                    ->setParameter('priority', $priority);
            }

            if (!empty($vehicleId)) {
                $queryBuilder->andWhere('i.vehicle = :vehicleId')
                    ->setParameter('vehicleId', $vehicleId);
            }

            if (!empty($brandId)) {
                $queryBuilder->andWhere('v.brand = :brandId')
                    ->setParameter('brandId', $brandId);
            }

            if (!empty($modelId)) {
                $queryBuilder->andWhere('v.model = :modelId')
                    ->setParameter('modelId', $modelId);
            }

            if (!empty($startDate)) {
                $queryBuilder->andWhere('i.reportedDate >= :startDate')
                    ->setParameter('startDate', new \DateTime($startDate));
            }

            if (!empty($endDate)) {
                $queryBuilder->andWhere('i.reportedDate <= :endDate')
                    ->setParameter('endDate', new \DateTime($endDate . ' 23:59:59'));
            }

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(i.id)')->getQuery()->getSingleScalarResult();

            $interventions = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $interventionData = [];
            foreach ($interventions as $intervention) {
                // Récupérer le code existant
                $entityCode = $this->codeGenerationService->getExistingCode('intervention', $intervention->getId(), $currentTenant);
                
                $vehicle = $intervention->getVehicle();
                $driver = $intervention->getDriver();
                
                $interventionData[] = [
                    'id' => $intervention->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'interventionNumber' => $intervention->getInterventionNumber(),
                    'title' => $intervention->getTitle(),
                    'description' => $intervention->getDescription(),
                    'vehicle' => [
                        'id' => $vehicle->getId(),
                        'plateNumber' => $vehicle->getPlateNumber(),
                        'vin' => $vehicle->getVin(),
                        'brand' => [
                            'id' => $vehicle->getBrand() ? $vehicle->getBrand()->getId() : null,
                            'name' => $vehicle->getBrand() ? $vehicle->getBrand()->getName() : null,
                        ],
                        'model' => [
                            'id' => $vehicle->getModel() ? $vehicle->getModel()->getId() : null,
                            'name' => $vehicle->getModel() ? $vehicle->getModel()->getName() : null,
                        ],
                        'year' => $vehicle->getYear(),
                        'color' => $vehicle->getColor() ? [
                            'id' => $vehicle->getColor()->getId(),
                            'name' => $vehicle->getColor()->getName(),
                        ] : null,
                        'fuelType' => $vehicle->getFuelType() ? [
                            'id' => $vehicle->getFuelType()->getId(),
                            'name' => $vehicle->getFuelType()->getName(),
                        ] : null,
                        'category' => $vehicle->getCategory() ? [
                            'id' => $vehicle->getCategory()->getId(),
                            'name' => $vehicle->getCategory()->getName(),
                        ] : null,
                        'mileage' => $vehicle->getMileage(),
                        'status' => $vehicle->getStatus(),
                    ],
                    'driver' => $driver ? [
                        'id' => $driver->getId(),
                        'fullName' => $driver->getFullName(),
                        'phone' => $driver->getPhone(),
                        'email' => $driver->getEmail(),
                        'licenseNumber' => $driver->getLicenseNumber(),
                        'licenseExpiryDate' => $driver->getLicenseExpiryDate() ? $driver->getLicenseExpiryDate()->format('Y-m-d') : null,
                        'status' => $driver->getStatus(),
                    ] : null,
                    'interventionType' => $intervention->getInterventionType() ? [
                        'id' => $intervention->getInterventionType()->getId(),
                        'name' => $intervention->getInterventionType()->getName(),
                    ] : null,
                    'priority' => $intervention->getPriority(),
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel(),
                    'estimatedDurationDays' => $intervention->getEstimatedDurationDays(),
                    'actualDurationDays' => $intervention->getActualDurationDays(),
                    'odometerReading' => method_exists($intervention, 'getOdometerReading') ? $intervention->getOdometerReading() : null,
                    'notes' => $intervention->getNotes(),
                    'reportedDate' => $intervention->getReportedDate() ? $intervention->getReportedDate()->format('Y-m-d H:i:s') : null,
                    'startedDate' => $intervention->getStartedDate() ? $intervention->getStartedDate()->format('Y-m-d H:i:s') : null,
                    'completedDate' => $intervention->getCompletedDate() ? $intervention->getCompletedDate()->format('Y-m-d H:i:s') : null,
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $interventionData,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => ceil($total / $limit),
                    'totalItems' => $total,
                    'itemsPerPage' => $limit
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des interventions: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('', name: 'api_vehicle_interventions_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['vehicleId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le véhicule est requis'
                ], 400);
            }

            if (empty($data['title'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le titre est requis'
                ], 400);
            }

            if (empty($data['vehicleId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le véhicule est requis'
                ], 400);
            }

            $intervention = new VehicleIntervention();
            $intervention->setTenant($currentTenant);
            
            $title = isset($data['title']) ? (string) $data['title'] : '';
            $intervention->setTitle($title);
            
            $description = isset($data['description']) ? (string) $data['description'] : null;
            $intervention->setDescription($description);
            
            $priority = isset($data['priority']) ? (string) $data['priority'] : 'medium';
            $intervention->setPriority($priority);
            
            $currentStatus = isset($data['currentStatus']) ? (string) $data['currentStatus'] : 'reported';
            $intervention->setCurrentStatus($currentStatus);
            if (isset($data['estimatedDurationDays']) && is_numeric($data['estimatedDurationDays']) && $data['estimatedDurationDays'] !== '') {
                $intervention->setEstimatedDurationDays((int) $data['estimatedDurationDays']);
            }
            if (isset($data['odometerReading']) && is_numeric($data['odometerReading']) && $data['odometerReading'] !== '' && method_exists($intervention, 'setOdometerReading')) {
                $intervention->setOdometerReading((int) $data['odometerReading']);
            }
            if (isset($data['notes'])) {
                $intervention->setNotes($data['notes']);
            }
            
            /** @var \App\Entity\User $user */
            $user = $this->getUser();
            if ($user && $user->getId()) {
                $intervention->setReportedBy($user->getId());
            }

            // Numéro d'intervention temporaire (sera remplacé par le code généré)
            $intervention->setInterventionNumber('TEMP-' . uniqid());

            // Relations
            $vehicleId = isset($data['vehicleId']) ? (int) $data['vehicleId'] : null;
            $vehicle = $this->vehicleRepository->find($vehicleId);
            if (!$vehicle || $vehicle->getTenant()->getId() !== $currentTenant->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule non trouvé ou non accessible'
                ], 404);
            }
            $intervention->setVehicle($vehicle);

            if (isset($data['driverId']) && !empty($data['driverId'])) {
                $driverId = (int) $data['driverId'];
                $driver = $this->driverRepository->find($driverId);
                if ($driver && $driver->getTenant()->getId() === $currentTenant->getId()) {
                    $intervention->setDriver($driver);
                }
            }

            if (isset($data['interventionTypeId']) && !empty($data['interventionTypeId'])) {
                $interventionTypeId = (int) $data['interventionTypeId'];
                $interventionType = $this->interventionTypeRepository->find($interventionTypeId);
                if ($interventionType) {
                    $intervention->setInterventionType($interventionType);
                }
            }

            if (isset($data['assignedTo']) && !empty($data['assignedTo'])) {
                $intervention->setAssignedTo((int) $data['assignedTo']);
            }

            // Dates
            if (isset($data['reportedDate']) && !empty($data['reportedDate'])) {
                $intervention->setReportedDate(new \DateTime($data['reportedDate']));
            }

            $this->entityManager->persist($intervention);
            $this->entityManager->flush();

            // Générer automatiquement un code pour l'intervention
            try {
                error_log('Début génération code intervention pour ID: ' . $intervention->getId());
                $entityCode = $this->codeGenerationService->generateInterventionCode(
                    $intervention->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $interventionCode = $entityCode->getCode();
                error_log('Code généré: ' . $interventionCode);
                
                // Mettre à jour le interventionNumber avec le code généré
                $intervention->setInterventionNumber($interventionCode);
                $this->entityManager->flush();
                error_log('Intervention mise à jour avec le code');
            } catch (\Exception $e) {
                error_log('Erreur génération code intervention: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                $interventionCode = $intervention->getInterventionNumber();
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Intervention créée avec succès',
                'data' => [
                    'id' => $intervention->getId(),
                    'code' => $interventionCode,
                    'interventionNumber' => $intervention->getInterventionNumber(),
                    'title' => $intervention->getTitle(),
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'priority' => $intervention->getPriority(),
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'api_vehicle_interventions_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant()->getId() !== $currentTenant->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            if (isset($data['title'])) $intervention->setTitle($data['title']);
            if (isset($data['description'])) $intervention->setDescription($data['description']);
            if (isset($data['priority'])) $intervention->setPriority($data['priority']);
            if (isset($data['currentStatus'])) $intervention->setCurrentStatus($data['currentStatus']);
            if (isset($data['estimatedDurationDays']) && is_numeric($data['estimatedDurationDays']) && $data['estimatedDurationDays'] !== '') {
                $intervention->setEstimatedDurationDays((int) $data['estimatedDurationDays']);
            }
            if (isset($data['actualDurationDays']) && is_numeric($data['actualDurationDays']) && $data['actualDurationDays'] !== '') {
                $intervention->setActualDurationDays((int) $data['actualDurationDays']);
            }
            if (isset($data['odometerReading']) && is_numeric($data['odometerReading']) && $data['odometerReading'] !== '' && method_exists($intervention, 'setOdometerReading')) {
                $intervention->setOdometerReading((int) $data['odometerReading']);
            }
            if (isset($data['notes'])) $intervention->setNotes($data['notes']);
            if (isset($data['assignedTo']) && is_numeric($data['assignedTo']) && $data['assignedTo'] !== '') {
                $intervention->setAssignedTo((int) $data['assignedTo']);
            }

            // Relations
            if (isset($data['vehicleId'])) {
                $vehicle = $this->vehicleRepository->find($data['vehicleId']);
                if ($vehicle && $vehicle->getTenant()->getId() === $currentTenant->getId()) {
                    $intervention->setVehicle($vehicle);
                }
            }

            if (isset($data['driverId'])) {
                if ($data['driverId']) {
                    $driver = $this->driverRepository->find($data['driverId']);
                    if ($driver && $driver->getTenant()->getId() === $currentTenant->getId()) {
                        $intervention->setDriver($driver);
                    }
                } else {
                    $intervention->setDriver(null);
                }
            }

            if (isset($data['interventionTypeId'])) {
                if ($data['interventionTypeId']) {
                    $interventionType = $this->interventionTypeRepository->find($data['interventionTypeId']);
                    if ($interventionType) {
                        $intervention->setInterventionType($interventionType);
                    }
                } else {
                    $intervention->setInterventionType(null);
                }
            }

            // Dates
            if (isset($data['startedDate'])) {
                $intervention->setStartedDate($data['startedDate'] ? new \DateTime($data['startedDate']) : null);
            }
            
            if (isset($data['completedDate'])) {
                $intervention->setCompletedDate($data['completedDate'] ? new \DateTime($data['completedDate']) : null);
            }
            
            if (isset($data['closedDate'])) {
                $intervention->setClosedDate($data['closedDate'] ? new \DateTime($data['closedDate']) : null);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Intervention mise à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'api_vehicle_interventions_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant()->getId() !== $currentTenant->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée'
                ], 404);
            }

            $this->entityManager->remove($intervention);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Intervention supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'api_vehicle_interventions_show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant()->getId() !== $currentTenant->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée'
                ], 404);
            }

            // Récupérer le code existant
            $entityCode = $this->codeGenerationService->getExistingCode('intervention', $intervention->getId(), $currentTenant);

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $intervention->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'interventionNumber' => $intervention->getInterventionNumber(),
                    'title' => $intervention->getTitle(),
                    'description' => $intervention->getDescription(),
                    'vehicle' => [
                        'id' => $intervention->getVehicle()->getId(),
                        'plateNumber' => $intervention->getVehicle()->getPlateNumber(),
                    ],
                    'driver' => $intervention->getDriver() ? [
                        'id' => $intervention->getDriver()->getId(),
                        'fullName' => $intervention->getDriver()->getFullName(),
                    ] : null,
                    'interventionType' => $intervention->getInterventionType() ? [
                        'id' => $intervention->getInterventionType()->getId(),
                        'name' => $intervention->getInterventionType()->getName(),
                    ] : null,
                    'priority' => $intervention->getPriority(),
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'reportedBy' => $intervention->getReportedBy(),
                    'assignedTo' => $intervention->getAssignedTo(),
                    'estimatedDurationDays' => $intervention->getEstimatedDurationDays(),
                    'actualDurationDays' => $intervention->getActualDurationDays(),
                    'odometerReading' => method_exists($intervention, 'getOdometerReading') ? $intervention->getOdometerReading() : null,
                    'reportedDate' => $intervention->getReportedDate() ? $intervention->getReportedDate()->format('Y-m-d H:i:s') : null,
                    'startedDate' => $intervention->getStartedDate() ? $intervention->getStartedDate()->format('Y-m-d H:i:s') : null,
                    'completedDate' => $intervention->getCompletedDate() ? $intervention->getCompletedDate()->format('Y-m-d H:i:s') : null,
                    'closedDate' => $intervention->getClosedDate() ? $intervention->getClosedDate()->format('Y-m-d H:i:s') : null,
                    'notes' => $intervention->getNotes(),
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}/workflow/status', name: 'api_vehicle_intervention_get_status', methods: ['GET'])]
    public function getWorkflowStatus(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $data = [
                'currentStatus' => $intervention->getCurrentStatus(),
                'statusLabel' => $intervention->getStatusLabel(),
                'workflowProgress' => $intervention->getWorkflowProgress(),
                'workflowStage' => $intervention->getWorkflowStage(),
                'isCompleted' => $intervention->isCompleted(),
                'isCancelled' => $intervention->isCancelled(),
                'isInProgress' => $intervention->isInProgress(),
                'daysInCurrentStatus' => $intervention->getDaysInCurrentStatus(),
                'estimatedCompletionDate' => $intervention->getEstimatedCompletionDate()?->format('Y-m-d H:i:s'),
                'validTransitions' => $intervention->getStatusTransitions()[$intervention->getCurrentStatus()] ?? [],
                'allStatuses' => $intervention->getValidStatuses()
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du statut: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/workflow/transition', name: 'api_vehicle_intervention_transition', methods: ['POST'])]
    public function transitionWorkflow(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (!$data || !isset($data['newStatus'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Statut de destination requis',
                    'code' => 400
                ], 400);
            }

            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $newStatus = $data['newStatus'];
            
            // Vérifier si la transition est autorisée
            if (!$intervention->canTransitionTo($newStatus)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => "Transition non autorisée de '{$intervention->getCurrentStatus()}' vers '{$newStatus}'",
                    'code' => 400
                ], 400);
            }

            // Effectuer la transition
            $intervention->transitionTo($newStatus);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Statut mis à jour avec succès',
                'data' => [
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel(),
                    'workflowProgress' => $intervention->getWorkflowProgress(),
                    'workflowStage' => $intervention->getWorkflowStage()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la transition: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/workflow/prediagnostic/start', name: 'api_vehicle_intervention_start_prediagnostic', methods: ['POST'])]
    public function startPrediagnostic(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $intervention->startPrediagnostic();
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Prédiagnostic démarré avec succès',
                'data' => [
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du démarrage du prédiagnostic: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/workflow/prediagnostic/complete', name: 'api_vehicle_intervention_complete_prediagnostic', methods: ['POST'])]
    public function completePrediagnostic(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $intervention->completePrediagnostic();
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Prédiagnostic terminé avec succès',
                'data' => [
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la finalisation du prédiagnostic: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/workflow/quote/start', name: 'api_vehicle_intervention_start_quote', methods: ['POST'])]
    public function startQuote(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $intervention->startQuote();
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis démarré avec succès',
                'data' => [
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du démarrage du devis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/workflow/approve', name: 'api_vehicle_intervention_approve', methods: ['POST'])]
    public function approveQuote(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $intervention->approveQuote();
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis approuvé avec succès',
                'data' => [
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/workflow/cancel', name: 'api_vehicle_intervention_cancel', methods: ['POST'])]
    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $intervention = $this->interventionRepository->find($id);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $intervention->cancel();
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Intervention annulée avec succès',
                'data' => [
                    'currentStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

}

