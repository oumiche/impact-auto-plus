<?php

namespace App\Service;

use App\Entity\Report;
use App\Entity\Tenant;
use App\Repository\ReportRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class ReportCacheService
{
    private ReportRepository $reportRepository;
    private EntityManagerInterface $entityManager;
    private LoggerInterface $logger;

    // Durées de cache par défaut (en secondes)
    private const CACHE_DURATIONS = [
        'dashboard' => 300,        // 5 minutes
        'kpis' => 600,            // 10 minutes
        'costs_by_vehicle' => 3600,    // 1 heure
        'maintenance_schedule' => 1800, // 30 minutes
        'vehicle_usage' => 3600,       // 1 heure
        'driver_performance' => 3600,  // 1 heure
        'financial_summary' => 7200,   // 2 heures
        'intervention_analysis' => 3600, // 1 heure
        'preventive_maintenance' => 1800, // 30 minutes
        'cost_analysis' => 3600,       // 1 heure
    ];

    public function __construct(
        ReportRepository $reportRepository,
        EntityManagerInterface $entityManager,
        LoggerInterface $logger
    ) {
        $this->reportRepository = $reportRepository;
        $this->entityManager = $entityManager;
        $this->logger = $logger;
    }

    /**
     * Récupère un rapport avec gestion intelligente du cache
     */
    public function getOrGenerateReport(
        string $type,
        Tenant $tenant,
        callable $generator,
        array $parameters = [],
        ?int $userId = null,
        bool $forceRefresh = false
    ): array {
        // Si forceRefresh, on regénère directement
        if ($forceRefresh) {
            $this->logger->info("Force refresh demandé pour le rapport {$type}");
            return $this->generateAndCache($type, $tenant, $generator, $parameters, $userId);
        }

        // Chercher un rapport en cache valide avec les mêmes paramètres
        $cachedReport = $this->findValidCachedReport($type, $tenant, $parameters);

        if ($cachedReport) {
            $this->logger->info("Rapport {$type} récupéré du cache", [
                'reportId' => $cachedReport->getId(),
                'cachedUntil' => $cachedReport->getCachedUntil()?->format('Y-m-d H:i:s')
            ]);

            return [
                'data' => $cachedReport->getCachedData(),
                'cached' => true,
                'cachedAt' => $cachedReport->getGeneratedAt()->format('Y-m-d H:i:s'),
                'cachedUntil' => $cachedReport->getCachedUntil()->format('Y-m-d H:i:s'),
                'reportId' => $cachedReport->getId()
            ];
        }

        // Pas de cache valide, générer le rapport
        return $this->generateAndCache($type, $tenant, $generator, $parameters, $userId);
    }

    /**
     * Génère et met en cache un rapport
     */
    public function generateAndCache(
        string $type,
        Tenant $tenant,
        callable $generator,
        array $parameters = [],
        ?int $userId = null
    ): array {
        $startTime = microtime(true);

        // Générer le rapport
        $data = $generator();

        $executionTime = microtime(true) - $startTime;
        $this->logger->info("Rapport {$type} généré", [
            'executionTime' => round($executionTime, 2) . 's'
        ]);

        // Créer l'entité Report
        $report = new Report();
        $report->setTenant($tenant);
        $report->setType($type);
        $report->setName($this->getReportName($type));
        $report->setParameters($parameters);
        $report->setGeneratedBy($userId ?? 0);
        
        // Définir la durée de cache appropriée
        $cacheDuration = $this->getCacheDuration($type);
        $report->setCacheDuration($cacheDuration);
        
        // Mettre à jour le cache
        $report->updateCache($data);

        // Sauvegarder
        $this->entityManager->persist($report);
        $this->entityManager->flush();

        $this->logger->info("Rapport {$type} mis en cache", [
            'reportId' => $report->getId(),
            'cacheDuration' => $cacheDuration,
            'cachedUntil' => $report->getCachedUntil()?->format('Y-m-d H:i:s')
        ]);

        return [
            'data' => $data,
            'cached' => false,
            'generatedAt' => $report->getGeneratedAt()->format('Y-m-d H:i:s'),
            'cachedUntil' => $report->getCachedUntil()->format('Y-m-d H:i:s'),
            'reportId' => $report->getId(),
            'executionTime' => round($executionTime, 2)
        ];
    }

    /**
     * Trouve un rapport en cache valide
     */
    public function findValidCachedReport(
        string $type,
        Tenant $tenant,
        array $parameters = []
    ): ?Report {
        return $this->reportRepository->findWithValidCache($type, $tenant, $parameters);
    }

    /**
     * Invalide le cache d'un rapport spécifique
     */
    public function invalidateReport(int $reportId, Tenant $tenant): bool
    {
        $report = $this->reportRepository->find($reportId);

        if (!$report || $report->getTenant()->getId() !== $tenant->getId()) {
            $this->logger->warning("Tentative d'invalidation d'un rapport inexistant ou non autorisé", [
                'reportId' => $reportId
            ]);
            return false;
        }

        $report->invalidateCache();
        $this->entityManager->flush();

        $this->logger->info("Cache du rapport invalidé", [
            'reportId' => $reportId,
            'type' => $report->getType()
        ]);

        return true;
    }

    /**
     * Invalide tous les caches d'un type pour un tenant
     */
    public function invalidateByType(string $type, Tenant $tenant): int
    {
        $count = $this->reportRepository->invalidateCacheByType($type, $tenant);

        $this->logger->info("Caches invalidés par type", [
            'type' => $type,
            'count' => $count
        ]);

        return $count;
    }

    /**
     * Invalide tous les caches d'un tenant
     */
    public function invalidateAllForTenant(Tenant $tenant): int
    {
        $reports = $this->reportRepository->findByTenant($tenant);
        $count = 0;

        foreach ($reports as $report) {
            if ($report->isCacheValid()) {
                $report->invalidateCache();
                $count++;
            }
        }

        $this->entityManager->flush();

        $this->logger->info("Tous les caches invalidés pour le tenant", [
            'tenantId' => $tenant->getId(),
            'count' => $count
        ]);

        return $count;
    }

    /**
     * Nettoie les caches expirés
     */
    public function cleanupExpiredCache(Tenant $tenant): int
    {
        $count = $this->reportRepository->deleteExpiredCache($tenant);

        $this->logger->info("Caches expirés nettoyés", [
            'tenantId' => $tenant->getId(),
            'count' => $count
        ]);

        return $count;
    }

    /**
     * Nettoie les vieux rapports (plus de X jours)
     */
    public function cleanupOldReports(Tenant $tenant, int $daysToKeep = 30): int
    {
        $cutoffDate = (new \DateTime())->modify("-{$daysToKeep} days");

        $qb = $this->entityManager->createQueryBuilder();
        $count = $qb->delete(Report::class, 'r')
            ->where('r.tenant = :tenant')
            ->andWhere('r.generatedAt < :cutoffDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('cutoffDate', $cutoffDate)
            ->getQuery()
            ->execute();

        $this->logger->info("Vieux rapports nettoyés", [
            'tenantId' => $tenant->getId(),
            'daysToKeep' => $daysToKeep,
            'count' => $count
        ]);

        return $count;
    }

    /**
     * Préchauffe le cache pour les rapports importants
     */
    public function warmupCache(
        Tenant $tenant,
        array $reportTypes,
        callable $generatorFactory,
        ?int $userId = null
    ): array {
        $results = [];

        foreach ($reportTypes as $type) {
            try {
                $generator = $generatorFactory($type);
                
                if (!is_callable($generator)) {
                    $this->logger->error("Generator invalide pour le type {$type}");
                    continue;
                }

                $result = $this->generateAndCache($type, $tenant, $generator, [], $userId);
                $results[$type] = [
                    'success' => true,
                    'reportId' => $result['reportId'],
                    'executionTime' => $result['executionTime']
                ];

                $this->logger->info("Cache préchauffé pour {$type}");
            } catch (\Exception $e) {
                $this->logger->error("Erreur lors du préchauffage du cache pour {$type}", [
                    'error' => $e->getMessage()
                ]);
                $results[$type] = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Obtient les statistiques du cache
     */
    public function getCacheStatistics(Tenant $tenant): array
    {
        $reports = $this->reportRepository->findByTenant($tenant);
        
        $stats = [
            'total' => count($reports),
            'valid' => 0,
            'expired' => 0,
            'byType' => [],
            'averageCacheDuration' => 0,
            'oldestReport' => null,
            'newestReport' => null
        ];

        $totalCacheDuration = 0;
        $oldestDate = null;
        $newestDate = null;

        foreach ($reports as $report) {
            $type = $report->getType();
            
            if (!isset($stats['byType'][$type])) {
                $stats['byType'][$type] = [
                    'count' => 0,
                    'valid' => 0,
                    'expired' => 0
                ];
            }

            $stats['byType'][$type]['count']++;
            
            if ($report->isCacheValid()) {
                $stats['valid']++;
                $stats['byType'][$type]['valid']++;
            } else {
                $stats['expired']++;
                $stats['byType'][$type]['expired']++;
            }

            $totalCacheDuration += $report->getCacheDuration();

            $generatedAt = $report->getGeneratedAt();
            if (!$oldestDate || $generatedAt < $oldestDate) {
                $oldestDate = $generatedAt;
                $stats['oldestReport'] = [
                    'id' => $report->getId(),
                    'type' => $report->getType(),
                    'generatedAt' => $generatedAt->format('Y-m-d H:i:s')
                ];
            }

            if (!$newestDate || $generatedAt > $newestDate) {
                $newestDate = $generatedAt;
                $stats['newestReport'] = [
                    'id' => $report->getId(),
                    'type' => $report->getType(),
                    'generatedAt' => $generatedAt->format('Y-m-d H:i:s')
                ];
            }
        }

        if (count($reports) > 0) {
            $stats['averageCacheDuration'] = round($totalCacheDuration / count($reports));
        }

        return $stats;
    }

    /**
     * Vérifie si un rapport doit être régénéré
     */
    public function shouldRegenerate(Report $report): bool
    {
        // Cache expiré
        if (!$report->isCacheValid()) {
            return true;
        }

        // Rapport trop ancien (plus de 24h même si le cache est valide)
        $daysSinceGeneration = $report->getGeneratedAt()->diff(new \DateTime())->days;
        if ($daysSinceGeneration > 1) {
            return true;
        }

        return false;
    }

    /**
     * Obtient la durée de cache appropriée pour un type de rapport
     */
    private function getCacheDuration(string $type): int
    {
        return self::CACHE_DURATIONS[$type] ?? 3600; // 1 heure par défaut
    }

    /**
     * Obtient le nom du rapport selon son type
     */
    private function getReportName(string $type): string
    {
        $names = Report::getAvailableTypes();
        return $names[$type] ?? ucfirst(str_replace('_', ' ', $type));
    }

    /**
     * Compare deux tableaux de paramètres
     */
    private function parametersMatch(array $params1, array $params2): bool
    {
        // Tri pour comparaison
        ksort($params1);
        ksort($params2);

        return json_encode($params1) === json_encode($params2);
    }

    /**
     * Optimise le cache en supprimant les doublons
     */
    public function optimizeCache(Tenant $tenant): array
    {
        $reports = $this->reportRepository->findByTenant($tenant);
        
        $grouped = [];
        foreach ($reports as $report) {
            $key = $report->getType() . '_' . json_encode($report->getParameters() ?? []);
            if (!isset($grouped[$key])) {
                $grouped[$key] = [];
            }
            $grouped[$key][] = $report;
        }

        $deleted = 0;
        $kept = 0;

        foreach ($grouped as $group) {
            if (count($group) <= 1) {
                $kept++;
                continue;
            }

            // Trier par date de génération (plus récent en premier)
            usort($group, function ($a, $b) {
                return $b->getGeneratedAt() <=> $a->getGeneratedAt();
            });

            // Garder le plus récent, supprimer les autres
            for ($i = 1; $i < count($group); $i++) {
                $this->entityManager->remove($group[$i]);
                $deleted++;
            }
            $kept++;
        }

        $this->entityManager->flush();

        $this->logger->info("Cache optimisé", [
            'tenantId' => $tenant->getId(),
            'deleted' => $deleted,
            'kept' => $kept
        ]);

        return [
            'deleted' => $deleted,
            'kept' => $kept,
            'groups' => count($grouped)
        ];
    }

    /**
     * Planifie la régénération automatique des rapports importants
     */
    public function scheduleRegeneration(Tenant $tenant, array $priorityTypes = []): array
    {
        $scheduled = [];

        // Types prioritaires par défaut
        if (empty($priorityTypes)) {
            $priorityTypes = ['dashboard', 'kpis'];
        }

        foreach ($priorityTypes as $type) {
            $reports = $this->reportRepository->findByType($type, $tenant, 1);
            
            if (empty($reports)) {
                $scheduled[$type] = [
                    'status' => 'no_existing_report',
                    'shouldGenerate' => true
                ];
                continue;
            }

            $report = $reports[0];
            
            if ($this->shouldRegenerate($report)) {
                $scheduled[$type] = [
                    'status' => 'should_regenerate',
                    'lastGenerated' => $report->getGeneratedAt()->format('Y-m-d H:i:s'),
                    'cacheValid' => $report->isCacheValid()
                ];
            } else {
                $scheduled[$type] = [
                    'status' => 'cache_valid',
                    'cachedUntil' => $report->getCachedUntil()?->format('Y-m-d H:i:s')
                ];
            }
        }

        return $scheduled;
    }

    /**
     * Exporte les métadonnées d'un rapport
     */
    public function exportReportMetadata(int $reportId, Tenant $tenant): ?array
    {
        $report = $this->reportRepository->find($reportId);

        if (!$report || $report->getTenant()->getId() !== $tenant->getId()) {
            return null;
        }

        return [
            'id' => $report->getId(),
            'type' => $report->getType(),
            'name' => $report->getName(),
            'description' => $report->getDescription(),
            'parameters' => $report->getParameters(),
            'generatedAt' => $report->getGeneratedAt()->format('Y-m-d H:i:s'),
            'generatedBy' => $report->getGeneratedBy(),
            'cacheDuration' => $report->getCacheDuration(),
            'cachedUntil' => $report->getCachedUntil()?->format('Y-m-d H:i:s'),
            'isCacheValid' => $report->isCacheValid(),
            'isPublic' => $report->isPublic(),
            'dataSize' => strlen(json_encode($report->getCachedData() ?? [])),
            'createdAt' => $report->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $report->getUpdatedAt()->format('Y-m-d H:i:s')
        ];
    }
}

