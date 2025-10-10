<?php

namespace App\Controller;

use App\Entity\Vehicle;
use App\Entity\VehicleIntervention;
use App\Entity\Driver;
use App\Entity\VehicleMaintenance;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

#[Route('/api/dashboard', name: 'dashboard_')]
class DashboardController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    /**
     * Récupère les statistiques du dashboard
     */
    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function getStats(Request $request): JsonResponse
    {
        try {
            // TODO: Ajouter la vérification du tenant si nécessaire
            // $currentTenant = $this->checkAuthAndGetTenant($request);

            // Compter les véhicules
            $vehiclesCount = $this->entityManager->getRepository(Vehicle::class)->count([]);

            // Compter les interventions
            $interventionsCount = $this->entityManager->getRepository(VehicleIntervention::class)->count([]);

            // Compter les conducteurs
            $driversCount = $this->entityManager->getRepository(Driver::class)->count([]);

            // Compter les maintenances
            $maintenanceCount = $this->entityManager->getRepository(VehicleMaintenance::class)->count([]);

            // Compter les interventions en cours
            $interventionsInProgress = $this->entityManager->getRepository(VehicleIntervention::class)
                ->count(['currentStatus' => 'in_repair']);

            // Compter les interventions terminées ce mois
            $thisMonth = new \DateTime('first day of this month');
            $interventionsCompletedThisMonth = $this->entityManager->getRepository(VehicleIntervention::class)
                ->createQueryBuilder('vi')
                ->select('COUNT(vi.id)')
                ->where('vi.currentStatus = :status')
                ->andWhere('vi.updatedAt >= :thisMonth')
                ->setParameter('status', 'vehicle_received')
                ->setParameter('thisMonth', $thisMonth)
                ->getQuery()
                ->getSingleScalarResult();

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'vehicles' => $vehiclesCount,
                    'interventions' => $interventionsCount,
                    'drivers' => $driversCount,
                    'maintenance' => $maintenanceCount,
                    'interventionsInProgress' => $interventionsInProgress,
                    'interventionsCompletedThisMonth' => $interventionsCompletedThisMonth
                ]
            ], 200);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère l'activité récente
     */
    #[Route('/recent-activity', name: 'recent_activity', methods: ['GET'])]
    public function getRecentActivity(Request $request): JsonResponse
    {
        try {
            // TODO: Ajouter la vérification du tenant si nécessaire

            // Récupérer les dernières interventions
            $recentInterventions = $this->entityManager->getRepository(VehicleIntervention::class)
                ->createQueryBuilder('vi')
                ->orderBy('vi.updatedAt', 'DESC')
                ->setMaxResults(5)
                ->getQuery()
                ->getResult();

            $activities = [];
            foreach ($recentInterventions as $intervention) {
                $activities[] = [
                    'id' => $intervention->getId(),
                    'type' => $this->getActivityType($intervention->getCurrentStatus()),
                    'icon' => $this->getActivityIcon($intervention->getCurrentStatus()),
                    'title' => $this->getActivityTitle($intervention->getCurrentStatus()),
                    'description' => 'Intervention #' . $intervention->getId() . ' - ' . 
                                   ($intervention->getVehicle() ? $intervention->getVehicle()->getPlateNumber() : 'Véhicule inconnu'),
                    'time' => $this->formatTimeAgo($intervention->getUpdatedAt())
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $activities
            ], 200);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement de l\'activité récente: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getActivityType(string $status): string
    {
        return match($status) {
            'vehicle_received' => 'success',
            'in_repair' => 'warning',
            'cancelled' => 'error',
            default => 'info'
        };
    }

    private function getActivityIcon(string $status): string
    {
        return match($status) {
            'vehicle_received' => 'fas fa-check-circle',
            'in_repair' => 'fas fa-wrench',
            'cancelled' => 'fas fa-times-circle',
            default => 'fas fa-info-circle'
        };
    }

    private function getActivityTitle(string $status): string
    {
        return match($status) {
            'vehicle_received' => 'Intervention terminée',
            'in_repair' => 'Intervention en cours',
            'cancelled' => 'Intervention annulée',
            default => 'Intervention mise à jour'
        };
    }

    private function formatTimeAgo(\DateTimeInterface $date): string
    {
        $now = new \DateTime();
        $diff = $now->diff($date);

        if ($diff->days > 0) {
            return "Il y a {$diff->days} jour" . ($diff->days > 1 ? 's' : '');
        } elseif ($diff->h > 0) {
            return "Il y a {$diff->h} heure" . ($diff->h > 1 ? 's' : '');
        } elseif ($diff->i > 0) {
            return "Il y a {$diff->i} minute" . ($diff->i > 1 ? 's' : '');
        } else {
            return 'À l\'instant';
        }
    }
}
