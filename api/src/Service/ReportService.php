<?php

namespace App\Service;

use App\Entity\Tenant;
use App\Entity\Vehicle;
use App\Repository\VehicleInterventionRepository;
use App\Repository\VehicleRepository;
use App\Repository\InterventionInvoiceRepository;
use App\Repository\InterventionReceptionReportRepository;
use Doctrine\ORM\EntityManagerInterface;

class ReportService
{
    private VehicleInterventionRepository $interventionRepository;
    private VehicleRepository $vehicleRepository;
    private InterventionInvoiceRepository $invoiceRepository;
    private InterventionReceptionReportRepository $receptionReportRepository;
    private EntityManagerInterface $entityManager;
    private ParameterService $parameterService;

    public function __construct(
        VehicleInterventionRepository $interventionRepository,
        VehicleRepository $vehicleRepository,
        InterventionInvoiceRepository $invoiceRepository,
        InterventionReceptionReportRepository $receptionReportRepository,
        EntityManagerInterface $entityManager,
        ParameterService $parameterService
    ) {
        $this->interventionRepository = $interventionRepository;
        $this->vehicleRepository = $vehicleRepository;
        $this->invoiceRepository = $invoiceRepository;
        $this->receptionReportRepository = $receptionReportRepository;
        $this->entityManager = $entityManager;
        $this->parameterService = $parameterService;
    }

    /**
     * Génère le tableau de bord des interventions
     */
    public function generateDashboard(Tenant $tenant): array
    {
        // Compteurs par statut
        $counters = $this->getInterventionCounters($tenant);
        
        // Interventions en cours (tous les statuts sauf les terminés)
        $completedStatuses = ['completed', 'closed', 'invoiced', 'cancelled'];
        $interventionsInProgress = $this->interventionRepository->createQueryBuilder('i')
            ->leftJoin('i.vehicle', 'v')
            ->leftJoin('v.brand', 'b')
            ->leftJoin('v.model', 'm')
            ->leftJoin('i.driver', 'd')
            ->leftJoin('i.interventionType', 'it')
            ->addSelect('v', 'b', 'm', 'd', 'it')
            ->where('i.tenant = :tenant')
            ->andWhere('i.currentStatus NOT IN (:completedStatuses)')
            ->setParameter('tenant', $tenant)
            ->setParameter('completedStatuses', $completedStatuses)
            ->orderBy('i.reportedDate', 'DESC')
            ->setMaxResults(20)
            ->getQuery()
            ->getResult();

        // Alertes
        $alerts = $this->generateAlerts($tenant);

        // Taux de disponibilité du parc
        $availability = $this->calculateFleetAvailability($tenant);

        // Interventions par priorité
        $byPriority = $this->getInterventionsByPriority($tenant);

        // Tendances (comparaison avec le mois précédent)
        $trends = $this->calculateTrends($tenant);

        return [
            'counters' => $counters,
            'interventionsInProgress' => array_map([$this, 'serializeIntervention'], $interventionsInProgress),
            'alerts' => $alerts,
            'fleetAvailability' => $availability,
            'byPriority' => $byPriority,
            'trends' => $trends,
            'generatedAt' => (new \DateTime())->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Génère le rapport des coûts par véhicule
     */
    public function generateCostsByVehicle(
        Tenant $tenant,
        ?int $vehicleId = null,
        ?\DateTime $startDate = null,
        ?\DateTime $endDate = null
    ): array {
        // Dates par défaut : 12 derniers mois
        if (!$startDate) {
            $startDate = (new \DateTime())->modify('-12 months');
        }
        if (!$endDate) {
            $endDate = new \DateTime();
        }

        // Si pas de véhicule spécifié, retourner pour tous les véhicules
        if (!$vehicleId) {
            return $this->generateAllVehiclesCosts($tenant, $startDate, $endDate);
        }

        $vehicle = $this->vehicleRepository->find($vehicleId);
        if (!$vehicle || $vehicle->getTenant()->getId() !== $tenant->getId()) {
            throw new \Exception('Véhicule non trouvé');
        }

        // Récupérer toutes les interventions du véhicule sur la période
        $interventions = $this->interventionRepository->createQueryBuilder('i')
            ->where('i.tenant = :tenant')
            ->andWhere('i.vehicle = :vehicle')
            ->andWhere('i.reportedDate BETWEEN :startDate AND :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('vehicle', $vehicle)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->getQuery()
            ->getResult();

        // Récupérer les factures associées avec leurs lignes
        $invoices = $this->invoiceRepository->createQueryBuilder('inv')
            ->leftJoin('inv.intervention', 'i')
            ->leftJoin('inv.lines', 'lines')
            ->addSelect('lines')
            ->where('i.tenant = :tenant')
            ->andWhere('i.vehicle = :vehicle')
            ->andWhere('inv.invoiceDate BETWEEN :startDate AND :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('vehicle', $vehicle)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->getQuery()
            ->getResult();

        // Calcul des coûts
        $totalCosts = 0;
        $laborCosts = 0;
        $partsCosts = 0;
        $costsByMonth = [];
        $costsByType = [];

        foreach ($invoices as $invoice) {
            $totalAmount = (float) $invoice->getTotalAmount();
            $totalCosts += $totalAmount;
            
            // Calculer les coûts de main d'œuvre et pièces à partir des lignes
            $invoiceLaborCost = 0;
            $invoicePartsCost = 0;
            $hasLines = false;
            
            foreach ($invoice->getLines() as $line) {
                $hasLines = true;
                $lineTotal = (float) $line->getLineTotal();
                $workType = $line->getWorkType();
                
                // Si workType indique main d'œuvre
                if ($workType === 'labor' || $workType === 'main_oeuvre' || $workType === 'service') {
                    $invoiceLaborCost += $lineTotal;
                } elseif ($workType === 'supply' || $workType === 'parts' || $workType === 'piece') {
                    // Pièces uniquement
                    $invoicePartsCost += $lineTotal;
                }
                // Les types 'other' ne sont comptés ni dans labor ni dans parts
            }
            
            // Si pas de lignes, utiliser le subtotal comme pièces par défaut
            if (!$hasLines) {
                $invoicePartsCost = (float) $invoice->getSubtotal();
            }
            
            $laborCosts += $invoiceLaborCost;
            $partsCosts += $invoicePartsCost;

            // Regrouper par mois
            $month = $invoice->getInvoiceDate()->format('Y-m');
            if (!isset($costsByMonth[$month])) {
                $costsByMonth[$month] = 0;
            }
            $costsByMonth[$month] += $totalAmount;

            // Regrouper par type d'intervention
            $intervention = $invoice->getIntervention();
            if ($intervention && $intervention->getInterventionType()) {
                $typeName = $intervention->getInterventionType()->getName();
                if (!isset($costsByType[$typeName])) {
                    $costsByType[$typeName] = 0;
                }
                $costsByType[$typeName] += $totalAmount;
            }
        }

        // Coût moyen par intervention
        $averageCostPerIntervention = count($invoices) > 0 
            ? $totalCosts / count($invoices) 
            : 0;

        // Évolution mensuelle
        ksort($costsByMonth);
        $monthlyEvolution = [];
        foreach ($costsByMonth as $month => $cost) {
            $monthlyEvolution[] = [
                'month' => $month,
                'cost' => round($cost, 2)
            ];
        }

        // Répartition par type (top 10)
        arsort($costsByType);
        $costsByType = array_slice($costsByType, 0, 10, true);
        $costsByTypeArray = [];
        foreach ($costsByType as $type => $cost) {
            $costsByTypeArray[] = [
                'type' => $type,
                'cost' => round($cost, 2),
                'percentage' => $totalCosts > 0 ? round(($cost / $totalCosts) * 100, 1) : 0
            ];
        }

        return [
            'vehicle' => [
                'id' => $vehicle->getId(),
                'plateNumber' => $vehicle->getPlateNumber(),
                'brand' => $vehicle->getBrand()?->getName(),
                'model' => $vehicle->getModel()?->getName(),
                'year' => $vehicle->getYear()
            ],
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d')
            ],
            'summary' => [
                'totalCosts' => round($totalCosts, 2),
                'laborCosts' => round($laborCosts, 2),
                'partsCosts' => round($partsCosts, 2),
                'interventionsCount' => count($interventions),
                'invoicesCount' => count($invoices),
                'averageCostPerIntervention' => round($averageCostPerIntervention, 2),
                'currency' => $this->getCurrency($tenant)
            ],
            'monthlyEvolution' => $monthlyEvolution,
            'costsByType' => $costsByTypeArray,
            'generatedAt' => (new \DateTime())->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Génère l'échéancier de maintenance préventive
     */
    public function generateMaintenanceSchedule(Tenant $tenant, int $days = 90): array
    {
        $today = new \DateTime();
        $futureDate = (new \DateTime())->modify("+{$days} days");

        // Récupérer tous les véhicules actifs
        $vehicles = $this->vehicleRepository->createQueryBuilder('v')
            ->where('v.tenant = :tenant')
            ->andWhere('v.status = :status')
            ->setParameter('tenant', $tenant)
            ->setParameter('status', 'active')
            ->getQuery()
            ->getResult();

        $upcomingMaintenances = [];
        $overdueMaintenances = [];

        foreach ($vehicles as $vehicle) {
            // Dernière intervention
            $lastIntervention = $this->interventionRepository->createQueryBuilder('i')
                ->where('i.tenant = :tenant')
                ->andWhere('i.vehicle = :vehicle')
                ->andWhere('i.currentStatus IN (:completedStatuses)')
                ->setParameter('tenant', $tenant)
                ->setParameter('vehicle', $vehicle)
                ->setParameter('completedStatuses', ['completed', 'closed', 'invoiced'])
                ->orderBy('i.completedDate', 'DESC')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();

            // Calculer la prochaine maintenance basée sur :
            // 1. Date (tous les 6 mois par défaut)
            // 2. Kilométrage (tous les 15000 km par défaut)

            $maintenanceInfo = [
                'vehicle' => [
                    'id' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand()?->getName(),
                    'model' => $vehicle->getModel()?->getName(),
                    'mileage' => $vehicle->getMileage()
                ],
                'lastMaintenance' => $lastIntervention ? [
                    'date' => $lastIntervention->getCompletedDate()?->format('Y-m-d'),
                    'mileage' => $lastIntervention->getOdometerReading()
                ] : null
            ];

            // Maintenance basée sur la date (6 mois)
            if ($lastIntervention && $lastIntervention->getCompletedDate()) {
                $nextMaintenanceDate = (clone $lastIntervention->getCompletedDate())
                    ->modify('+6 months');
                
                $maintenanceInfo['nextMaintenanceDate'] = $nextMaintenanceDate->format('Y-m-d');
                $maintenanceInfo['daysUntilMaintenance'] = $today->diff($nextMaintenanceDate)->days;
                $maintenanceInfo['isOverdue'] = $nextMaintenanceDate < $today;

                // Priorité basée sur l'urgence
                if ($nextMaintenanceDate < $today) {
                    $maintenanceInfo['priority'] = 'urgent';
                    $overdueMaintenances[] = $maintenanceInfo;
                } elseif ($nextMaintenanceDate <= $futureDate) {
                    if ($maintenanceInfo['daysUntilMaintenance'] <= 30) {
                        $maintenanceInfo['priority'] = 'high';
                    } elseif ($maintenanceInfo['daysUntilMaintenance'] <= 60) {
                        $maintenanceInfo['priority'] = 'medium';
                    } else {
                        $maintenanceInfo['priority'] = 'normal';
                    }
                    $upcomingMaintenances[] = $maintenanceInfo;
                }
            } elseif (!$lastIntervention) {
                // Pas de maintenance enregistrée
                $maintenanceInfo['priority'] = 'urgent';
                $maintenanceInfo['reason'] = 'Aucune maintenance enregistrée';
                $overdueMaintenances[] = $maintenanceInfo;
            }
        }

        // Trier par priorité et date
        usort($upcomingMaintenances, function ($a, $b) {
            return $a['daysUntilMaintenance'] <=> $b['daysUntilMaintenance'];
        });

        return [
            'period' => [
                'days' => $days,
                'from' => $today->format('Y-m-d'),
                'to' => $futureDate->format('Y-m-d')
            ],
            'summary' => [
                'totalVehicles' => count($vehicles),
                'upcomingCount' => count($upcomingMaintenances),
                'overdueCount' => count($overdueMaintenances)
            ],
            'upcomingMaintenances' => $upcomingMaintenances,
            'overdueMaintenances' => $overdueMaintenances,
            'generatedAt' => (new \DateTime())->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Génère les KPIs essentiels
     */
    public function generateKPIs(
        Tenant $tenant,
        ?\DateTime $startDate = null,
        ?\DateTime $endDate = null
    ): array {
        // Période par défaut : 30 derniers jours
        if (!$startDate) {
            $startDate = (new \DateTime())->modify('-30 days');
        }
        if (!$endDate) {
            $endDate = new \DateTime();
        }

        // Période précédente pour comparaison
        $daysDiff = $startDate->diff($endDate)->days;
        $previousStartDate = (clone $startDate)->modify("-{$daysDiff} days");
        $previousEndDate = clone $startDate;

        // 1. Disponibilité du parc
        $fleetAvailability = $this->calculateFleetAvailability($tenant);
        $previousFleetAvailability = $this->calculateFleetAvailability($tenant, $previousStartDate, $previousEndDate);

        // 2. Coût moyen au km
        $costPerKm = $this->calculateCostPerKm($tenant, $startDate, $endDate);
        $previousCostPerKm = $this->calculateCostPerKm($tenant, $previousStartDate, $previousEndDate);

        // 3. Interventions en cours
        $interventionsInProgress = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.currentStatus NOT IN (:completedStatuses)')
            ->setParameter('tenant', $tenant)
            ->setParameter('completedStatuses', ['completed', 'closed', 'invoiced', 'cancelled'])
            ->getQuery()
            ->getSingleScalarResult();

        // 4. Délai moyen de réparation
        $averageRepairDelay = $this->calculateAverageRepairDelay($tenant, $startDate, $endDate);
        $previousAverageRepairDelay = $this->calculateAverageRepairDelay($tenant, $previousStartDate, $previousEndDate);

        // 5. Satisfaction moyenne
        $averageSatisfaction = $this->calculateAverageSatisfaction($tenant, $startDate, $endDate);
        $previousAverageSatisfaction = $this->calculateAverageSatisfaction($tenant, $previousStartDate, $previousEndDate);

        // 6. Nombre total d'interventions
        $totalInterventions = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.reportedDate BETWEEN :startDate AND :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->getQuery()
            ->getSingleScalarResult();

        $previousTotalInterventions = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.reportedDate BETWEEN :startDate AND :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $previousStartDate)
            ->setParameter('endDate', $previousEndDate)
            ->getQuery()
            ->getSingleScalarResult();

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d')
            ],
            'kpis' => [
                'fleetAvailability' => [
                    'value' => round($fleetAvailability, 2),
                    'unit' => '%',
                    'trend' => $this->calculateTrend($fleetAvailability, $previousFleetAvailability),
                    'previousValue' => round($previousFleetAvailability, 2)
                ],
                'costPerKm' => [
                    'value' => round($costPerKm, 2),
                    'unit' => $this->getCurrency($tenant),
                    'trend' => $this->calculateTrend($costPerKm, $previousCostPerKm, true), // inversé : moins = mieux
                    'previousValue' => round($previousCostPerKm, 2)
                ],
                'interventionsInProgress' => [
                    'value' => (int) $interventionsInProgress,
                    'unit' => '',
                    'trend' => 'neutral'
                ],
                'averageRepairDelay' => [
                    'value' => round($averageRepairDelay, 1),
                    'unit' => 'jours',
                    'trend' => $this->calculateTrend($averageRepairDelay, $previousAverageRepairDelay, true),
                    'previousValue' => round($previousAverageRepairDelay, 1)
                ],
                'averageSatisfaction' => [
                    'value' => round($averageSatisfaction, 1),
                    'unit' => '/5',
                    'trend' => $this->calculateTrend($averageSatisfaction, $previousAverageSatisfaction),
                    'previousValue' => round($previousAverageSatisfaction, 1)
                ],
                'totalInterventions' => [
                    'value' => (int) $totalInterventions,
                    'unit' => '',
                    'trend' => $this->calculateTrend($totalInterventions, $previousTotalInterventions),
                    'previousValue' => (int) $previousTotalInterventions
                ]
            ],
            'generatedAt' => (new \DateTime())->format('Y-m-d H:i:s')
        ];
    }

    // ========== MÉTHODES PRIVÉES UTILITAIRES ==========

    /**
     * Calcule les compteurs d'interventions par statut
     */
    private function getInterventionCounters(Tenant $tenant): array
    {
        $statuses = ['reported', 'prediagnosed', 'quoted', 'authorized', 'in_progress', 
                     'vehicle_received', 'completed', 'closed', 'invoiced', 'cancelled'];
        
        $counters = [];
        foreach ($statuses as $status) {
            $count = $this->interventionRepository->createQueryBuilder('i')
                ->select('COUNT(i.id)')
                ->where('i.tenant = :tenant')
                ->andWhere('i.currentStatus = :status')
                ->setParameter('tenant', $tenant)
                ->setParameter('status', $status)
                ->getQuery()
                ->getSingleScalarResult();
            
            $counters[$status] = (int) $count;
        }

        $counters['total'] = array_sum($counters);

        return $counters;
    }

    /**
     * Génère les alertes importantes
     */
    private function generateAlerts(Tenant $tenant): array
    {
        $alerts = [];

        // Interventions urgentes non traitées
        $urgentCount = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.priority = :priority')
            ->andWhere('i.currentStatus NOT IN (:completedStatuses)')
            ->setParameter('tenant', $tenant)
            ->setParameter('priority', 'high')
            ->setParameter('completedStatuses', ['completed', 'closed', 'invoiced', 'cancelled'])
            ->getQuery()
            ->getSingleScalarResult();

        if ($urgentCount > 0) {
            $alerts[] = [
                'type' => 'urgent',
                'message' => "{$urgentCount} intervention(s) urgente(s) en attente",
                'count' => (int) $urgentCount,
                'severity' => 'high'
            ];
        }

        // Interventions en retard (plus de 7 jours sans progression)
        $overdueCount = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.currentStatus NOT IN (:completedStatuses)')
            ->andWhere('i.reportedDate < :sevenDaysAgo')
            ->setParameter('tenant', $tenant)
            ->setParameter('completedStatuses', ['completed', 'closed', 'invoiced', 'cancelled'])
            ->setParameter('sevenDaysAgo', (new \DateTime())->modify('-7 days'))
            ->getQuery()
            ->getSingleScalarResult();

        if ($overdueCount > 0) {
            $alerts[] = [
                'type' => 'overdue',
                'message' => "{$overdueCount} intervention(s) en retard",
                'count' => (int) $overdueCount,
                'severity' => 'medium'
            ];
        }

        return $alerts;
    }

    /**
     * Calcule le taux de disponibilité du parc
     */
    private function calculateFleetAvailability(
        Tenant $tenant,
        ?\DateTime $startDate = null,
        ?\DateTime $endDate = null
    ): float {
        // Nombre total de véhicules actifs
        $totalVehicles = $this->vehicleRepository->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.tenant = :tenant')
            ->andWhere('v.status = :status')
            ->setParameter('tenant', $tenant)
            ->setParameter('status', 'active')
            ->getQuery()
            ->getSingleScalarResult();

        if ($totalVehicles == 0) {
            return 100;
        }

        // Véhicules en intervention (non disponibles)
        $qb = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(DISTINCT i.vehicle)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.currentStatus NOT IN (:completedStatuses)')
            ->setParameter('tenant', $tenant)
            ->setParameter('completedStatuses', ['completed', 'closed', 'invoiced', 'cancelled']);

        if ($startDate && $endDate) {
            $qb->andWhere('i.reportedDate BETWEEN :startDate AND :endDate')
               ->setParameter('startDate', $startDate)
               ->setParameter('endDate', $endDate);
        }

        $unavailableVehicles = $qb->getQuery()->getSingleScalarResult();

        $availableVehicles = $totalVehicles - $unavailableVehicles;
        return ($availableVehicles / $totalVehicles) * 100;
    }

    /**
     * Calcule les interventions par priorité
     */
    private function getInterventionsByPriority(Tenant $tenant): array
    {
        $priorities = ['low', 'medium', 'high'];
        $result = [];

        foreach ($priorities as $priority) {
            $count = $this->interventionRepository->createQueryBuilder('i')
                ->select('COUNT(i.id)')
                ->where('i.tenant = :tenant')
                ->andWhere('i.priority = :priority')
                ->andWhere('i.currentStatus NOT IN (:completedStatuses)')
                ->setParameter('tenant', $tenant)
                ->setParameter('priority', $priority)
                ->setParameter('completedStatuses', ['completed', 'closed', 'invoiced', 'cancelled'])
                ->getQuery()
                ->getSingleScalarResult();

            $result[$priority] = (int) $count;
        }

        return $result;
    }

    /**
     * Calcule les tendances (comparaison mois actuel vs mois précédent)
     */
    private function calculateTrends(Tenant $tenant): array
    {
        $now = new \DateTime();
        $currentMonthStart = (clone $now)->modify('first day of this month')->setTime(0, 0, 0);
        $previousMonthStart = (clone $currentMonthStart)->modify('-1 month');
        $previousMonthEnd = (clone $currentMonthStart)->modify('-1 second');

        // Interventions ce mois
        $currentMonthCount = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.reportedDate >= :start')
            ->setParameter('tenant', $tenant)
            ->setParameter('start', $currentMonthStart)
            ->getQuery()
            ->getSingleScalarResult();

        // Interventions mois précédent
        $previousMonthCount = $this->interventionRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.tenant = :tenant')
            ->andWhere('i.reportedDate BETWEEN :start AND :end')
            ->setParameter('tenant', $tenant)
            ->setParameter('start', $previousMonthStart)
            ->setParameter('end', $previousMonthEnd)
            ->getQuery()
            ->getSingleScalarResult();

        $trend = $this->calculateTrend($currentMonthCount, $previousMonthCount);

        return [
            'interventions' => [
                'current' => (int) $currentMonthCount,
                'previous' => (int) $previousMonthCount,
                'trend' => $trend
            ]
        ];
    }

    /**
     * Génère le rapport pour tous les véhicules
     */
    private function generateAllVehiclesCosts(
        Tenant $tenant,
        \DateTime $startDate,
        \DateTime $endDate
    ): array {
        $vehicles = $this->vehicleRepository->createQueryBuilder('v')
            ->where('v.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getResult();

        $vehiclesCosts = [];
        $totalCosts = 0;
        $totalLaborCosts = 0;
        $totalPartsCosts = 0;
        $totalInterventions = 0;

        foreach ($vehicles as $vehicle) {
            $vehicleCosts = $this->generateCostsByVehicle($tenant, $vehicle->getId(), $startDate, $endDate);
            $vehiclesCosts[] = [
                'vehicle' => $vehicleCosts['vehicle'],
                'totalCosts' => $vehicleCosts['summary']['totalCosts']
            ];
            $totalCosts += $vehicleCosts['summary']['totalCosts'];
            $totalLaborCosts += $vehicleCosts['summary']['laborCosts'];
            $totalPartsCosts += $vehicleCosts['summary']['partsCosts'];
            $totalInterventions += $vehicleCosts['summary']['interventionsCount'];
        }

        // Trier par coût décroissant
        usort($vehiclesCosts, function ($a, $b) {
            return $b['totalCosts'] <=> $a['totalCosts'];
        });

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d')
            ],
            'summary' => [
                'totalVehicles' => count($vehicles),
                'totalCosts' => round($totalCosts, 2),
                'averageCostPerVehicle' => count($vehicles) > 0 ? round($totalCosts / count($vehicles), 2) : 0,
                'laborCosts' => round($totalLaborCosts, 2),
                'partsCosts' => round($totalPartsCosts, 2),
                'averageCostPerIntervention' => $totalInterventions > 0 ? round($totalCosts / $totalInterventions, 2) : 0,
                'currency' => $this->getCurrency($tenant)
            ],
            'vehiclesCosts' => $vehiclesCosts,
            'generatedAt' => (new \DateTime())->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Calcule le coût moyen au kilomètre
     */
    private function calculateCostPerKm(
        Tenant $tenant,
        \DateTime $startDate,
        \DateTime $endDate
    ): float {
        // Total des coûts
        $totalCosts = $this->invoiceRepository->createQueryBuilder('inv')
            ->select('SUM(inv.totalAmount)')
            ->leftJoin('inv.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('inv.invoiceDate BETWEEN :startDate AND :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->getQuery()
            ->getSingleScalarResult() ?? 0;

        // Total des kilomètres parcourus (estimation basée sur les odomètres)
        $vehicles = $this->vehicleRepository->findBy(['tenant' => $tenant]);
        $totalKm = 0;

        foreach ($vehicles as $vehicle) {
            // Différence de kilométrage sur la période
            $firstReading = $this->interventionRepository->createQueryBuilder('i')
                ->select('i.odometerReading')
                ->where('i.tenant = :tenant')
                ->andWhere('i.vehicle = :vehicle')
                ->andWhere('i.reportedDate >= :startDate')
                ->andWhere('i.odometerReading IS NOT NULL')
                ->setParameter('tenant', $tenant)
                ->setParameter('vehicle', $vehicle)
                ->setParameter('startDate', $startDate)
                ->orderBy('i.reportedDate', 'ASC')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();

            $lastReading = $this->interventionRepository->createQueryBuilder('i')
                ->select('i.odometerReading')
                ->where('i.tenant = :tenant')
                ->andWhere('i.vehicle = :vehicle')
                ->andWhere('i.reportedDate <= :endDate')
                ->andWhere('i.odometerReading IS NOT NULL')
                ->setParameter('tenant', $tenant)
                ->setParameter('vehicle', $vehicle)
                ->setParameter('endDate', $endDate)
                ->orderBy('i.reportedDate', 'DESC')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();

            if ($firstReading && $lastReading) {
                $kmDiff = $lastReading['odometerReading'] - $firstReading['odometerReading'];
                if ($kmDiff > 0) {
                    $totalKm += $kmDiff;
                }
            }
        }

        return $totalKm > 0 ? $totalCosts / $totalKm : 0;
    }

    /**
     * Calcule le délai moyen de réparation
     */
    private function calculateAverageRepairDelay(
        Tenant $tenant,
        \DateTime $startDate,
        \DateTime $endDate
    ): float {
        $interventions = $this->interventionRepository->createQueryBuilder('i')
            ->where('i.tenant = :tenant')
            ->andWhere('i.completedDate BETWEEN :startDate AND :endDate')
            ->andWhere('i.completedDate IS NOT NULL')
            ->andWhere('i.reportedDate IS NOT NULL')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->getQuery()
            ->getResult();

        if (count($interventions) === 0) {
            return 0;
        }

        $totalDays = 0;
        foreach ($interventions as $intervention) {
            $diff = $intervention->getReportedDate()->diff($intervention->getCompletedDate());
            $totalDays += $diff->days;
        }

        return $totalDays / count($interventions);
    }

    /**
     * Calcule la satisfaction moyenne
     */
    private function calculateAverageSatisfaction(
        Tenant $tenant,
        \DateTime $startDate,
        \DateTime $endDate
    ): float {
        // Récupérer tous les rapports de réception dans la période
        $reports = $this->receptionReportRepository->createQueryBuilder('rr')
            ->leftJoin('rr.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('rr.receptionDate BETWEEN :startDate AND :endDate')
            ->andWhere('rr.customerSatisfaction IS NOT NULL')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->getQuery()
            ->getResult();

        if (empty($reports)) {
            return 0;
        }

        // Calculer la moyenne des scores de satisfaction
        $totalScore = 0;
        foreach ($reports as $report) {
            $totalScore += $report->getSatisfactionScore();
        }

        return $totalScore / count($reports);
    }

    /**
     * Récupère la devise configurée pour le tenant
     */
    private function getCurrency(Tenant $tenant): string
    {
        try {
            // Essayer de récupérer la devise avec la clé app.currency (format standard)
            $currency = $this->parameterService->getTenant('app.currency', $tenant, null);
            
            // Si pas trouvé, essayer avec la clé currency
            if (empty($currency)) {
                $currency = $this->parameterService->getTenant('currency', $tenant, null);
            }
            
            // Si toujours pas trouvé, essayer en global
            if (empty($currency)) {
                $currency = $this->parameterService->getGlobal('app.currency', null);
            }
            
            // Si toujours rien, utiliser la valeur par défaut
            if (empty($currency)) {
                $currency = 'F CFA';
            }
            
            return $currency;
        } catch (\Exception $e) {
            // En cas d'erreur, retourner une valeur par défaut
            return 'F CFA';
        }
    }

    /**
     * Calcule la tendance entre deux valeurs
     */
    private function calculateTrend(float $current, float $previous, bool $inverse = false): string
    {
        if ($previous == 0) {
            return 'neutral';
        }

        $percentChange = (($current - $previous) / $previous) * 100;

        // Si inversé (ex: coût, délai), moins = mieux
        if ($inverse) {
            if ($percentChange < -5) {
                return 'up'; // Amélioration
            } elseif ($percentChange > 5) {
                return 'down'; // Dégradation
            }
        } else {
            if ($percentChange > 5) {
                return 'up'; // Amélioration
            } elseif ($percentChange < -5) {
                return 'down'; // Dégradation
            }
        }

        return 'neutral';
    }

    /**
     * Sérialise une intervention pour le JSON
     */
    private function serializeIntervention($intervention): array
    {
        return [
            'id' => $intervention->getId(),
            'interventionNumber' => $intervention->getInterventionNumber(),
            'title' => $intervention->getTitle(),
            'currentStatus' => $intervention->getCurrentStatus(),
            'statusLabel' => $intervention->getStatusLabel(),
            'priority' => $intervention->getPriority(),
            'vehicle' => [
                'id' => $intervention->getVehicle()->getId(),
                'plateNumber' => $intervention->getVehicle()->getPlateNumber(),
                'brand' => $intervention->getVehicle()->getBrand()?->getName(),
                'model' => $intervention->getVehicle()->getModel()?->getName()
            ],
            'reportedDate' => $intervention->getReportedDate()?->format('Y-m-d H:i:s'),
            'interventionType' => $intervention->getInterventionType()?->getName()
        ];
    }

    /**
     * Génère le rapport d'analyse des pannes
     */
    public function generateFailureAnalysis(
        Tenant $tenant,
        ?\DateTime $startDate = null,
        ?\DateTime $endDate = null
    ): array {
        // Période par défaut : 6 derniers mois
        if (!$startDate) {
            $startDate = (new \DateTime())->modify('-6 months');
        }
        if (!$endDate) {
            $endDate = new \DateTime();
        }

        // Récupérer toutes les factures (interventions facturées) de la période
        // Maintenant que le cache est désactivé, on peut utiliser les factures sans problème
        $invoices = $this->invoiceRepository->findByDateRange($tenant, $startDate, $endDate);
        
        // Filtrer les interventions annulées
        $invoices = array_filter($invoices, function($invoice) {
            $intervention = $invoice->getIntervention();
            return $intervention && $intervention->getCurrentStatus() !== 'cancelled';
        });

        // 1. Pannes récurrentes (par type d'intervention)
        $failuresByType = [];
        $failuresByBrand = [];
        $failuresByModel = [];
        $mostChangedParts = [];
        $failuresByAge = [];
        $failuresByKm = [];
        $interventionsProcessed = [];

        foreach ($invoices as $invoice) {
            $intervention = $invoice->getIntervention();
            
            // Éviter de compter plusieurs fois la même intervention si plusieurs factures
            $interventionId = $intervention->getId();
            if (isset($interventionsProcessed[$interventionId])) {
                continue;
            }
            $interventionsProcessed[$interventionId] = true;

            $type = $intervention->getInterventionType()?->getName() ?? 'Non spécifié';
            $brand = $intervention->getVehicle()->getBrand()?->getName() ?? 'Inconnu';
            $model = $intervention->getVehicle()->getModel()?->getName() ?? 'Inconnu';
            $brandModel = $brand . ' ' . $model;

            // Compteur par type
            if (!isset($failuresByType[$type])) {
                $failuresByType[$type] = ['count' => 0, 'totalCost' => 0];
            }
            $failuresByType[$type]['count']++;

            // Compteur par marque
            if (!isset($failuresByBrand[$brand])) {
                $failuresByBrand[$brand] = ['count' => 0, 'totalCost' => 0];
            }
            $failuresByBrand[$brand]['count']++;

            // Compteur par modèle
            if (!isset($failuresByModel[$brandModel])) {
                $failuresByModel[$brandModel] = ['count' => 0, 'totalCost' => 0, 'brand' => $brand, 'model' => $model];
            }
            $failuresByModel[$brandModel]['count']++;

            // Analyse par âge du véhicule
            $vehicleYear = $intervention->getVehicle()->getYear();
            if ($vehicleYear) {
                $age = (int) date('Y') - $vehicleYear;
                $ageRange = $this->getAgeRange($age);
                if (!isset($failuresByAge[$ageRange])) {
                    $failuresByAge[$ageRange] = ['count' => 0, 'totalCost' => 0];
                }
                $failuresByAge[$ageRange]['count']++;
            }

            // Analyse par kilométrage
            $km = $intervention->getOdometerReading();
            if ($km) {
                $kmRange = $this->getKmRange($km);
                if (!isset($failuresByKm[$kmRange])) {
                    $failuresByKm[$kmRange] = ['count' => 0, 'totalCost' => 0];
                }
                $failuresByKm[$kmRange]['count']++;
            }

            // Analyser les lignes de facture (pièces et main d'œuvre)
            foreach ($invoice->getLines() as $line) {
                $lineCost = (float) $line->getLineTotal();
                $workType = $line->getWorkType();
                
                // Uniquement les pièces (supply) pour l'analyse des pièces changées
                if ($workType === 'supply' || $workType === 'parts' || $workType === 'piece') {
                    $partName = $line->getSupply()?->getName() ?? $line->getDescription() ?? 'Inconnu';
                    
                    if (!isset($mostChangedParts[$partName])) {
                        $mostChangedParts[$partName] = [
                            'count' => 0,
                            'totalCost' => 0,
                            'quantity' => 0
                        ];
                    }
                    $mostChangedParts[$partName]['count']++;
                    $mostChangedParts[$partName]['totalCost'] += $lineCost;
                    $mostChangedParts[$partName]['quantity'] += (float) $line->getQuantity();
                }

                // Ajouter tous les coûts (labor + supply + other) aux totaux
                $failuresByType[$type]['totalCost'] += $lineCost;
                $failuresByBrand[$brand]['totalCost'] += $lineCost;
                $failuresByModel[$brandModel]['totalCost'] += $lineCost;
                
                if ($vehicleYear) {
                    $failuresByAge[$ageRange]['totalCost'] += $lineCost;
                }
                if ($km) {
                    $failuresByKm[$kmRange]['totalCost'] += $lineCost;
                }
            }
        }

        // Trier et formater les résultats
        arsort($failuresByType);
        arsort($failuresByBrand);
        arsort($failuresByModel);
        arsort($mostChangedParts);
        ksort($failuresByAge);
        ksort($failuresByKm);

        // Top 10 pannes récurrentes
        $top10FailureTypes = array_slice($failuresByType, 0, 10, true);
        $failureTypesArray = [];
        foreach ($top10FailureTypes as $type => $data) {
            $failureTypesArray[] = [
                'type' => $type,
                'count' => $data['count'],
                'totalCost' => round($data['totalCost'], 2),
                'averageCost' => $data['count'] > 0 ? round($data['totalCost'] / $data['count'], 2) : 0
            ];
        }

        // Top 10 par marque
        $top10Brands = array_slice($failuresByBrand, 0, 10, true);
        $brandFailuresArray = [];
        foreach ($top10Brands as $brand => $data) {
            $brandFailuresArray[] = [
                'brand' => $brand,
                'count' => $data['count'],
                'totalCost' => round($data['totalCost'], 2),
                'averageCost' => $data['count'] > 0 ? round($data['totalCost'] / $data['count'], 2) : 0
            ];
        }

        // Top 10 par modèle
        $top10Models = array_slice($failuresByModel, 0, 10, true);
        $modelFailuresArray = [];
        foreach ($top10Models as $model => $data) {
            $modelFailuresArray[] = [
                'model' => $model,
                'brand' => $data['brand'],
                'count' => $data['count'],
                'totalCost' => round($data['totalCost'], 2),
                'averageCost' => $data['count'] > 0 ? round($data['totalCost'] / $data['count'], 2) : 0
            ];
        }

        // Top 15 pièces les plus changées
        $top15Parts = array_slice($mostChangedParts, 0, 15, true);
        $partsArray = [];
        foreach ($top15Parts as $part => $data) {
            $partsArray[] = [
                'name' => $part,
                'count' => $data['count'],
                'quantity' => round($data['quantity'], 2),
                'totalCost' => round($data['totalCost'], 2),
                'averageCost' => $data['count'] > 0 ? round($data['totalCost'] / $data['count'], 2) : 0
            ];
        }

        // Pannes par âge
        $ageFailuresArray = [];
        foreach ($failuresByAge as $range => $data) {
            $ageFailuresArray[] = [
                'ageRange' => $range,
                'count' => $data['count'],
                'totalCost' => round($data['totalCost'], 2)
            ];
        }

        // Pannes par kilométrage
        $kmFailuresArray = [];
        foreach ($failuresByKm as $range => $data) {
            $kmFailuresArray[] = [
                'kmRange' => $range,
                'count' => $data['count'],
                'totalCost' => round($data['totalCost'], 2)
            ];
        }

        // Calcul du MTBF (Mean Time Between Failures) par véhicule
        $vehicles = $this->vehicleRepository->createQueryBuilder('v')
            ->where('v.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getResult();

        $mtbfData = [];
        foreach ($vehicles as $vehicle) {
            $vehicleInterventions = $this->interventionRepository->createQueryBuilder('i')
                ->where('i.vehicle = :vehicle')
                ->andWhere('i.reportedDate BETWEEN :startDate AND :endDate')
                ->andWhere('i.currentStatus NOT IN (:excludedStatuses)')
                ->setParameter('vehicle', $vehicle)
                ->setParameter('startDate', $startDate)
                ->setParameter('endDate', $endDate)
                ->setParameter('excludedStatuses', ['cancelled'])
                ->orderBy('i.reportedDate', 'ASC')
                ->getQuery()
                ->getResult();

            if (count($vehicleInterventions) >= 2) {
                $totalDaysBetweenFailures = 0;
                for ($i = 1; $i < count($vehicleInterventions); $i++) {
                    $diff = $vehicleInterventions[$i]->getReportedDate()->diff($vehicleInterventions[$i - 1]->getReportedDate());
                    $totalDaysBetweenFailures += $diff->days;
                }
                $mtbf = $totalDaysBetweenFailures / (count($vehicleInterventions) - 1);
                
                $mtbfData[] = [
                    'vehicle' => [
                        'id' => $vehicle->getId(),
                        'plateNumber' => $vehicle->getPlateNumber(),
                        'brand' => $vehicle->getBrand()?->getName(),
                        'model' => $vehicle->getModel()?->getName()
                    ],
                    'mtbf' => round($mtbf, 1),
                    'failureCount' => count($vehicleInterventions)
                ];
            }
        }

        // Trier MTBF par durée (les plus bas = plus problématiques)
        usort($mtbfData, function($a, $b) {
            return $a['mtbf'] <=> $b['mtbf'];
        });
        $mtbfData = array_slice($mtbfData, 0, 20); // Top 20 véhicules les plus problématiques

        // Statistiques globales
        $totalFailures = count($interventionsProcessed);
        $totalCost = array_sum(array_column($failuresByType, 'totalCost'));
        $averageCostPerFailure = $totalFailures > 0 ? $totalCost / $totalFailures : 0;

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d')
            ],
            'summary' => [
                'totalFailures' => $totalFailures,
                'totalCost' => round($totalCost, 2),
                'averageCostPerFailure' => round($averageCostPerFailure, 2),
                'currency' => $this->getCurrency($tenant)
            ],
            'failuresByType' => $failureTypesArray,
            'failuresByBrand' => $brandFailuresArray,
            'failuresByModel' => $modelFailuresArray,
            'mostChangedParts' => $partsArray,
            'failuresByAge' => $ageFailuresArray,
            'failuresByKm' => $kmFailuresArray,
            'mtbf' => $mtbfData,
            'generatedAt' => (new \DateTime())->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Détermine la tranche d'âge d'un véhicule
     */
    private function getAgeRange(int $age): string
    {
        if ($age <= 2) return '0-2 ans';
        if ($age <= 5) return '3-5 ans';
        if ($age <= 10) return '6-10 ans';
        if ($age <= 15) return '11-15 ans';
        return '15+ ans';
    }

    /**
     * Détermine la tranche de kilométrage
     */
    private function getKmRange(int $km): string
    {
        if ($km < 50000) return '0-50k km';
        if ($km < 100000) return '50-100k km';
        if ($km < 150000) return '100-150k km';
        if ($km < 200000) return '150-200k km';
        return '200k+ km';
    }
}

