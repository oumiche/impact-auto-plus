<?php

namespace App\Controller;

use App\Entity\VehicleAssignment;
use App\Entity\Vehicle;
use App\Entity\Driver;
use App\Entity\Tenant;
use App\Service\TenantService;
use App\Repository\VehicleAssignmentRepository;
use App\Repository\VehicleRepository;
use App\Repository\DriverRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

#[Route('/api/vehicle-assignments')]
class VehicleAssignmentController extends AbstractTenantController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private VehicleAssignmentRepository $vehicleAssignmentRepository,
        private VehicleRepository $vehicleRepository,
        private DriverRepository $driverRepository,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
    }

    #[Route('', name: 'vehicle_assignments_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');

            $offset = ($page - 1) * $limit;

            $criteria = ['tenant' => $currentTenant];
            if ($status !== 'all') {
                $criteria['status'] = $status;
            }

            $assignments = $this->vehicleAssignmentRepository->findBy($criteria, ['assignedDate' => 'DESC'], $limit, $offset);
            $total = $this->vehicleAssignmentRepository->count($criteria);

            $assignmentData = [];
            foreach ($assignments as $assignment) {
                $assignmentData[] = [
                    'id' => $assignment->getId(),
                    'vehicle' => $assignment->getVehicle() ? [
                        'id' => $assignment->getVehicle()->getId(),
                        'plateNumber' => $assignment->getVehicle()->getPlateNumber(),
                        'brand' => $assignment->getVehicle()->getBrand() ? $assignment->getVehicle()->getBrand()->getName() : null,
                        'model' => $assignment->getVehicle()->getModel() ? $assignment->getVehicle()->getModel()->getName() : null,
                        'year' => $assignment->getVehicle()->getYear()
                    ] : null,
                    'driver' => $assignment->getDriver() ? [
                        'id' => $assignment->getDriver()->getId(),
                        'firstName' => $assignment->getDriver()->getFirstName(),
                        'lastName' => $assignment->getDriver()->getLastName(),
                        'email' => $assignment->getDriver()->getEmail()
                    ] : null,
                    'assignedDate' => $assignment->getAssignedDate() ? $assignment->getAssignedDate()->format('Y-m-d') : null,
                    'unassignedDate' => $assignment->getUnassignedDate() ? $assignment->getUnassignedDate()->format('Y-m-d') : null,
                    'status' => $assignment->getStatus(),
                    'statusLabel' => $assignment->getStatusLabel(),
                    'notes' => $assignment->getNotes(),
                    'assignmentDuration' => $assignment->getAssignmentDuration(),
                    'createdAt' => $assignment->getCreatedAt() ? $assignment->getCreatedAt()->format('Y-m-d H:i:s') : null
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $assignmentData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit),
                    'hasNext' => $page < ceil($total / $limit),
                    'hasPrev' => $page > 1
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des assignations: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'vehicle_assignment_create', methods: ['POST'])]
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

            // Validation et typage des champs requis
            $vehicleId = isset($data['vehicleId']) && is_numeric($data['vehicleId']) ? (int) $data['vehicleId'] : null;
            $driverId = isset($data['driverId']) && is_numeric($data['driverId']) ? (int) $data['driverId'] : null;
            $assignedDate = isset($data['assignedDate']) && is_string($data['assignedDate']) ? $data['assignedDate'] : null;
            $status = isset($data['status']) && is_string($data['status']) ? $data['status'] : 'active';
            $notes = isset($data['notes']) && is_string($data['notes']) ? $data['notes'] : null;
            $unassignedDate = isset($data['unassignedDate']) && is_string($data['unassignedDate']) ? $data['unassignedDate'] : null;

            if (!$vehicleId || !$driverId || !$assignedDate) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule, conducteur et date d\'assignation sont requis',
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

            // Vérifier que le conducteur existe et appartient au tenant
            $driver = $this->driverRepository->findOneBy(['id' => $driverId, 'tenant' => $currentTenant]);
            if (!$driver) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Conducteur non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier qu'il n'y a pas déjà une assignation active pour ce véhicule
            $existingAssignment = $this->vehicleAssignmentRepository->findOneBy([
                'vehicle' => $vehicle,
                'status' => 'active'
            ]);
            if ($existingAssignment) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Ce véhicule est déjà assigné à un conducteur',
                    'code' => 409
                ], 409);
            }

            // Créer la nouvelle assignation
            $assignment = new VehicleAssignment();
            $assignment->setTenant($currentTenant);
            $assignment->setVehicle($vehicle);
            $assignment->setDriver($driver);
            $assignment->setAssignedDate(new \DateTime($assignedDate));
            $assignment->setStatus($status);
            $assignment->setNotes($notes);

            if (!empty($unassignedDate)) {
                $assignment->setUnassignedDate(new \DateTime($unassignedDate));
            }

            $this->entityManager->persist($assignment);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Assignation créée avec succès',
                'data' => [
                    'id' => $assignment->getId(),
                    'vehicle' => [
                        'id' => $assignment->getVehicle()->getId(),
                        'plateNumber' => $assignment->getVehicle()->getPlateNumber(),
                        'brand' => $assignment->getVehicle()->getBrand() ? $assignment->getVehicle()->getBrand()->getName() : null,
                        'model' => $assignment->getVehicle()->getModel() ? $assignment->getVehicle()->getModel()->getName() : null
                    ],
                    'driver' => [
                        'id' => $assignment->getDriver()->getId(),
                        'firstName' => $assignment->getDriver()->getFirstName(),
                        'lastName' => $assignment->getDriver()->getLastName()
                    ],
                    'assignedDate' => $assignment->getAssignedDate()->format('Y-m-d'),
                    'unassignedDate' => $assignment->getUnassignedDate() ? $assignment->getUnassignedDate()->format('Y-m-d') : null,
                    'status' => $assignment->getStatus(),
                    'statusLabel' => $assignment->getStatusLabel()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'assignation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'vehicle_assignment_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $assignment = $this->vehicleAssignmentRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$assignment) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Assignation non trouvée',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour les champs
            if (isset($data['assignedDate'])) {
                $assignment->setAssignedDate(new \DateTime($data['assignedDate']));
            }

            if (isset($data['unassignedDate'])) {
                $assignment->setUnassignedDate($data['unassignedDate'] ? new \DateTime($data['unassignedDate']) : null);
            }

            if (isset($data['status'])) {
                $assignment->setStatus($data['status']);
            }

            if (isset($data['notes'])) {
                $assignment->setNotes($data['notes']);
            }

            $assignment->setUpdatedAt(new \DateTimeImmutable());
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Assignation mise à jour avec succès',
                'data' => [
                    'id' => $assignment->getId(),
                    'vehicle' => [
                        'id' => $assignment->getVehicle()->getId(),
                        'plateNumber' => $assignment->getVehicle()->getPlateNumber(),
                        'brand' => $assignment->getVehicle()->getBrand() ? $assignment->getVehicle()->getBrand()->getName() : null,
                        'model' => $assignment->getVehicle()->getModel() ? $assignment->getVehicle()->getModel()->getName() : null
                    ],
                    'driver' => [
                        'id' => $assignment->getDriver()->getId(),
                        'firstName' => $assignment->getDriver()->getFirstName(),
                        'lastName' => $assignment->getDriver()->getLastName()
                    ],
                    'assignedDate' => $assignment->getAssignedDate()->format('Y-m-d'),
                    'unassignedDate' => $assignment->getUnassignedDate() ? $assignment->getUnassignedDate()->format('Y-m-d') : null,
                    'status' => $assignment->getStatus(),
                    'statusLabel' => $assignment->getStatusLabel(),
                    'notes' => $assignment->getNotes()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'assignation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'vehicle_assignment_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $assignment = $this->vehicleAssignmentRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$assignment) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Assignation non trouvée',
                    'code' => 404
                ], 404);
            }

            $this->entityManager->remove($assignment);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Assignation supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'assignation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/vehicles', name: 'vehicle_assignment_vehicles', methods: ['GET'])]
    public function getAvailableVehicles(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $vehicles = $this->vehicleRepository->findBy(['tenant' => $currentTenant], ['plateNumber' => 'ASC']);

            $vehicleData = [];
            foreach ($vehicles as $vehicle) {
                $vehicleData[] = [
                    'id' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand() ? $vehicle->getBrand()->getName() : null,
                    'model' => $vehicle->getModel() ? $vehicle->getModel()->getName() : null,
                    'year' => $vehicle->getYear(),
                    'isAssigned' => false
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
                'message' => 'Erreur lors de la récupération des véhicules: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/drivers', name: 'vehicle_assignment_drivers', methods: ['GET'])]
    public function getAvailableDrivers(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $drivers = $this->driverRepository->findBy(['tenant' => $currentTenant], ['lastName' => 'ASC']);

            $driverData = [];
            foreach ($drivers as $driver) {
                $driverData[] = [
                    'id' => $driver->getId(),
                    'firstName' => $driver->getFirstName(),
                    'lastName' => $driver->getLastName(),
                    'email' => $driver->getEmail(),
                    'licenseType' => $driver->getLicenseType() ? [
                        'id' => $driver->getLicenseType()->getId(),
                        'code' => $driver->getLicenseType()->getCode(),
                        'name' => $driver->getLicenseType()->getName()
                    ] : null,
                    'isAssigned' => false
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
                'message' => 'Erreur lors de la récupération des conducteurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

}
