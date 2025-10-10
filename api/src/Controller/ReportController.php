<?php

namespace App\Controller;

use App\Entity\Report;
use App\Entity\Tenant;
use App\Repository\ReportRepository;
use App\Service\ReportService;
use App\Service\ReportCacheService;
use App\Service\TenantService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/reports')]
#[IsGranted('ROLE_USER')]
class ReportController extends AbstractTenantController
{
    private ReportRepository $reportRepository;
    private EntityManagerInterface $entityManager;
    private ReportService $reportService;
    private ReportCacheService $cacheService;

    public function __construct(
        ReportRepository $reportRepository,
        EntityManagerInterface $entityManager,
        ReportService $reportService,
        ReportCacheService $cacheService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->reportRepository = $reportRepository;
        $this->entityManager = $entityManager;
        $this->reportService = $reportService;
        $this->cacheService = $cacheService;
    }

    /**
     * Liste tous les rapports disponibles (avec pagination)
     */
    #[Route('', name: 'api_reports_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
            $type = $request->query->get('type');
            $search = $request->query->get('search');

            $reports = $this->reportRepository->findWithPagination(
                $tenant,
                $type,
                $search,
                $page,
                $limit
            );

            $total = $this->reportRepository->countWithFilters($tenant, $type, $search);

            $data = array_map(function (Report $report) {
                return $this->serializeReport($report, false);
            }, $reports);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => ceil($total / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement des rapports: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient les types de rapports disponibles
     */
    #[Route('/types', name: 'api_reports_types', methods: ['GET'])]
    public function types(): JsonResponse
    {
        try {
            $types = Report::getAvailableTypes();
            
            $data = [];
            foreach ($types as $key => $label) {
                $data[] = [
                    'value' => $key,
                    'label' => $label
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement des types: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques des rapports générés
     */
    #[Route('/stats', name: 'api_reports_stats', methods: ['GET'])]
    public function stats(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            
            $countsByType = $this->reportRepository->countByType($tenant);
            $recentReports = $this->reportRepository->findByTenant($tenant, 10);

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'countsByType' => $countsByType,
                    'totalReports' => array_sum($countsByType),
                    'recentReports' => array_map(function (Report $report) {
                        return $this->serializeReport($report, false);
                    }, $recentReports)
                ]
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée un nouveau rapport
     */
    #[Route('', name: 'api_reports_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $user = $this->getUser();
            $data = json_decode($request->getContent(), true);

            if (!isset($data['type']) || !isset($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Type et nom obligatoires'
                ], 400);
            }

            $report = new Report();
            $report->setTenant($tenant);
            $report->setType($data['type']);
            $report->setName($data['name']);
            $report->setDescription($data['description'] ?? null);
            $report->setParameters($data['parameters'] ?? []);
            $report->setGeneratedBy($user ? $user->getUserIdentifier() : null);
            $report->setIsPublic($data['isPublic'] ?? false);
            $report->setCacheDuration($data['cacheDuration'] ?? 3600);

            $this->entityManager->persist($report);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport créé avec succès',
                'data' => $this->serializeReport($report, true)
            ], 201);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la création du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient un rapport spécifique
     */
    #[Route('/{id}', name: 'api_reports_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $report = $this->reportRepository->find($id);

            if (!$report || $report->getTenant()->getId() !== $tenant->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Rapport non trouvé'
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => $this->serializeReport($report, true)
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime un rapport
     */
    #[Route('/{id}', name: 'api_reports_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $report = $this->reportRepository->find($id);

            if (!$report || $report->getTenant()->getId() !== $tenant->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Rapport non trouvé'
                ], 404);
            }

            $this->entityManager->remove($report);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la suppression du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Invalide le cache d'un rapport
     */
    #[Route('/{id}/invalidate-cache', name: 'api_reports_invalidate_cache', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function invalidateCache(int $id, Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $report = $this->reportRepository->find($id);

            if (!$report || $report->getTenant()->getId() !== $tenant->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Rapport non trouvé'
                ], 404);
            }

            $report->invalidateCache();
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Cache invalidé avec succès'
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de l\'invalidation du cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Invalide tous les caches d'un type
     */
    #[Route('/invalidate-cache/{type}', name: 'api_reports_invalidate_cache_type', methods: ['POST'])]
    public function invalidateCacheByType(string $type, Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $count = $this->reportRepository->invalidateCacheByType($type, $tenant);

            return new JsonResponse([
                'success' => true,
                'message' => "Cache invalidé pour {$count} rapport(s)"
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de l\'invalidation du cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Nettoie les caches expirés
     */
    #[Route('/cleanup-cache', name: 'api_reports_cleanup_cache', methods: ['POST'])]
    public function cleanupCache(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $count = $this->cacheService->cleanupExpiredCache($tenant);

            return new JsonResponse([
                'success' => true,
                'message' => "{$count} cache(s) expiré(s) supprimé(s)"
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du nettoyage du cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient les statistiques du cache
     */
    #[Route('/cache/stats', name: 'api_reports_cache_stats', methods: ['GET'])]
    public function cacheStats(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $stats = $this->cacheService->getCacheStatistics($tenant);

            return new JsonResponse([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Optimise le cache (supprime les doublons)
     */
    #[Route('/cache/optimize', name: 'api_reports_cache_optimize', methods: ['POST'])]
    public function optimizeCache(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $result = $this->cacheService->optimizeCache($tenant);

            return new JsonResponse([
                'success' => true,
                'message' => "Cache optimisé: {$result['deleted']} doublons supprimés",
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de l\'optimisation du cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Nettoie les vieux rapports
     */
    #[Route('/cleanup-old', name: 'api_reports_cleanup_old', methods: ['POST'])]
    public function cleanupOld(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $daysToKeep = (int) $request->query->get('days', 30);
            $count = $this->cacheService->cleanupOldReports($tenant, $daysToKeep);

            return new JsonResponse([
                'success' => true,
                'message' => "{$count} ancien(s) rapport(s) supprimé(s)"
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du nettoyage des vieux rapports: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Préchauffe le cache
     */
    #[Route('/cache/warmup', name: 'api_reports_cache_warmup', methods: ['POST'])]
    public function warmupCache(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $user = $this->getUser();
            $types = $request->query->get('types', 'dashboard,kpis');
            $reportTypes = explode(',', $types);

            $generatorFactory = function ($type) use ($tenant) {
                return match ($type) {
                    'dashboard' => fn() => $this->reportService->generateDashboard($tenant),
                    'kpis' => fn() => $this->reportService->generateKPIs($tenant),
                    'maintenance_schedule' => fn() => $this->reportService->generateMaintenanceSchedule($tenant),
                    default => null
                };
            };

            $results = $this->cacheService->warmupCache(
                $tenant,
                $reportTypes,
                $generatorFactory,
                null // User ID non disponible via l'interface
            );

            return new JsonResponse([
                'success' => true,
                'message' => 'Préchauffage du cache terminé',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du préchauffage du cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère le tableau de bord des interventions
     */
    #[Route('/dashboard', name: 'api_reports_dashboard', methods: ['GET'])]
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $forceRefresh = $request->query->get('refresh', 'false') === 'true';
            $user = $this->getUser();

            // Utiliser le service de cache
            $result = $this->cacheService->getOrGenerateReport(
                'dashboard',
                $tenant,
                fn() => $this->reportService->generateDashboard($tenant),
                [],
                null, // User ID non disponible
                $forceRefresh
            );

            return new JsonResponse([
                'success' => true,
                ...$result
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la génération du tableau de bord: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère le rapport des coûts par véhicule
     */
    #[Route('/costs/by-vehicle', name: 'api_reports_costs_by_vehicle', methods: ['GET'])]
    public function costsByVehicle(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $vehicleId = $request->query->get('vehicleId') ? (int) $request->query->get('vehicleId') : null;
            $startDate = $request->query->get('startDate') ? new \DateTime($request->query->get('startDate')) : null;
            $endDate = $request->query->get('endDate') ? new \DateTime($request->query->get('endDate')) : null;

            // Générer le rapport
            $data = $this->reportService->generateCostsByVehicle($tenant, $vehicleId, $startDate, $endDate);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la génération du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère l'échéancier de maintenance préventive
     */
    #[Route('/maintenance/schedule', name: 'api_reports_maintenance_schedule', methods: ['GET'])]
    public function maintenanceSchedule(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $days = (int) $request->query->get('days', 90);

            // Générer le rapport
            $data = $this->reportService->generateMaintenanceSchedule($tenant, $days);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la génération de l\'échéancier: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère les KPIs essentiels
     */
    #[Route('/kpis', name: 'api_reports_kpis', methods: ['GET'])]
    public function kpis(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $startDate = $request->query->get('startDate') ? new \DateTime($request->query->get('startDate')) : null;
            $endDate = $request->query->get('endDate') ? new \DateTime($request->query->get('endDate')) : null;

            // Générer le rapport
            $data = $this->reportService->generateKPIs($tenant, $startDate, $endDate);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la génération des KPIs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère le rapport d'analyse des pannes
     */
    #[Route('/failures/analysis', name: 'api_reports_failures_analysis', methods: ['GET'])]
    public function failuresAnalysis(Request $request): JsonResponse
    {
        try {
            $tenant = $this->checkAuthAndGetTenant($request);
            $startDate = $request->query->get('startDate') ? new \DateTime($request->query->get('startDate')) : null;
            $endDate = $request->query->get('endDate') ? new \DateTime($request->query->get('endDate')) : null;

            // Générer le rapport SANS cache (pour éviter le problème JSON_CONTAINS)
            $data = $this->reportService->generateFailureAnalysis($tenant, $startDate, $endDate);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la génération de l\'analyse des pannes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sérialise un rapport pour la réponse JSON
     */
    private function serializeReport(Report $report, bool $includeCache = false): array
    {
        $data = [
            'id' => $report->getId(),
            'type' => $report->getType(),
            'typeLabel' => $report->getTypeLabel(),
            'name' => $report->getName(),
            'description' => $report->getDescription(),
            'parameters' => $report->getParameters(),
            'generatedAt' => $report->getGeneratedAt()?->format('Y-m-d H:i:s'),
            'generatedBy' => $report->getGeneratedBy(),
            'cacheDuration' => $report->getCacheDuration(),
            'isPublic' => $report->isPublic(),
            'cachedUntil' => $report->getCachedUntil()?->format('Y-m-d H:i:s'),
            'isCacheValid' => $report->isCacheValid(),
            'createdAt' => $report->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updatedAt' => $report->getUpdatedAt()?->format('Y-m-d H:i:s')
        ];

        if ($includeCache && $report->getCachedData()) {
            $data['cachedData'] = $report->getCachedData();
        }

        return $data;
    }

}

