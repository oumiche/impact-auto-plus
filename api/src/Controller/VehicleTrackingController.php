<?php

namespace App\Controller;

use App\Service\VehicleTrackingService;
use App\Repository\VehicleRepository;
use App\Service\TenantService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/vehicle-tracking')]
class VehicleTrackingController extends AbstractTenantController
{
    public function __construct(
        private VehicleTrackingService $trackingService,
        private VehicleRepository $vehicleRepository,
        private EntityManagerInterface $entityManager,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
    }

    #[Route('/sync-mileage/{vehicleId}', name: 'sync_vehicle_mileage_from_tracking', methods: ['POST'])]
    public function syncMileageFromTracking(Request $request, int $vehicleId): JsonResponse
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

            // Vérifier que le véhicule a un trackingId
            if (!$vehicle->getTrackingId()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Aucun dispositif de tracking configuré pour ce véhicule',
                    'code' => 400
                ], 400);
            }

            // Récupérer le kilométrage depuis l'API de tracking
            $trackingMileage = $this->trackingService->getVehicleMileage($vehicle->getTrackingId());
            
            if ($trackingMileage === null) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de récupérer le kilométrage depuis le dispositif de tracking',
                    'code' => 500
                ], 500);
            }

            // Mettre à jour le kilométrage du véhicule
            $vehicle->setMileage($trackingMileage);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Kilométrage synchronisé avec succès',
                'data' => [
                    'vehicleId' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'trackingId' => $vehicle->getTrackingId(),
                    'previousMileage' => $vehicle->getMileage(),
                    'newMileage' => $trackingMileage
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/vehicle-info/{vehicleId}', name: 'get_vehicle_tracking_info', methods: ['GET'])]
    public function getVehicleTrackingInfo(Request $request, int $vehicleId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $vehicle = $this->vehicleRepository->findOneBy(['id' => $vehicleId, 'tenant' => $currentTenant]);
            if (!$vehicle) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule non trouvé',
                    'code' => 404
                ], 404);
            }

            if (!$vehicle->getTrackingId()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Aucun dispositif de tracking configuré',
                    'code' => 400
                ], 400);
            }

            // Récupérer les informations complètes depuis l'API de tracking
            $trackingInfo = $this->trackingService->getVehicleInfo($vehicle->getTrackingId());
            
            if (!$trackingInfo) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de récupérer les informations du dispositif de tracking',
                    'code' => 500
                ], 500);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'vehicleId' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'trackingId' => $vehicle->getTrackingId(),
                    'trackingInfo' => $trackingInfo
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des informations: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
