<?php

namespace App\Repository;

use App\Entity\InterventionReceptionReport;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionReceptionReport>
 */
class InterventionReceptionReportRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionReceptionReport::class);
    }

    /**
     * Trouve un rapport par ID et tenant
     */
    public function findByIdAndTenant(int $id, ?Tenant $tenant): ?InterventionReceptionReport
    {
        if (!$tenant) {
            return null;
        }

        return $this->createQueryBuilder('r')
            ->innerJoin('r.intervention', 'i')
            ->where('r.id = :id')
            ->andWhere('i.tenant = :tenant')
            ->setParameter('id', $id)
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve les rapports par tenant avec filtres
     */
    public function findByTenantWithFilters(
        ?Tenant $tenant,
        int $page = 1,
        int $limit = 10,
        string $search = '',
        string $satisfaction = '',
        string $sortBy = 'receptionDate',
        string $sortOrder = 'DESC'
    ): array {
        if (!$tenant) {
            return [];
        }

        $qb = $this->createQueryBuilder('r')
            ->innerJoin('r.intervention', 'i')
            ->innerJoin('i.vehicle', 'v')
            ->leftJoin('v.brand', 'b')
            ->leftJoin('v.model', 'm')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        // Filtre de recherche
        if (!empty($search)) {
            $qb->andWhere('(
                i.interventionNumber LIKE :search OR
                i.title LIKE :search OR
                v.plateNumber LIKE :search OR
                b.name LIKE :search OR
                m.name LIKE :search OR
                r.vehicleCondition LIKE :search OR
                r.workCompleted LIKE :search
            )')
            ->setParameter('search', '%' . $search . '%');
        }

        // Filtre par satisfaction client
        if (!empty($satisfaction)) {
            $qb->andWhere('r.customerSatisfaction = :satisfaction')
               ->setParameter('satisfaction', $satisfaction);
        }

        // Tri
        $allowedSortFields = ['receptionDate', 'customerSatisfaction', 'createdAt'];
        if (in_array($sortBy, $allowedSortFields)) {
            $qb->orderBy('r.' . $sortBy, $sortOrder);
        } else {
            $qb->orderBy('r.receptionDate', 'DESC');
        }

        // Pagination
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset)
           ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
    }

    /**
     * Compte les rapports par tenant avec filtres
     */
    public function countByTenantWithFilters(
        ?Tenant $tenant,
        string $search = '',
        string $satisfaction = ''
    ): int {
        if (!$tenant) {
            return 0;
        }

        $qb = $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->innerJoin('r.intervention', 'i')
            ->innerJoin('i.vehicle', 'v')
            ->leftJoin('v.brand', 'b')
            ->leftJoin('v.model', 'm')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        // Filtre de recherche
        if (!empty($search)) {
            $qb->andWhere('(
                i.interventionNumber LIKE :search OR
                i.title LIKE :search OR
                v.plateNumber LIKE :search OR
                b.name LIKE :search OR
                m.name LIKE :search OR
                r.vehicleCondition LIKE :search OR
                r.workCompleted LIKE :search
            )')
            ->setParameter('search', '%' . $search . '%');
        }

        // Filtre par satisfaction client
        if (!empty($satisfaction)) {
            $qb->andWhere('r.customerSatisfaction = :satisfaction')
               ->setParameter('satisfaction', $satisfaction);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * Trouve les rapports nécessitant un suivi
     */
    public function findReportsRequiringFollowUp(?Tenant $tenant): array
    {
        if (!$tenant) {
            return [];
        }

        return $this->createQueryBuilder('r')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('(
                r.remainingIssues IS NOT NULL AND r.remainingIssues != \'\' OR
                r.isVehicleReady = false OR
                r.customerSatisfaction = :poor
            )')
            ->setParameter('tenant', $tenant)
            ->setParameter('poor', 'poor')
            ->orderBy('r.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les rapports par période
     */
    public function findByDateRange(?Tenant $tenant, \DateTime $startDate, \DateTime $endDate): array
    {
        if (!$tenant) {
            return [];
        }

        return $this->createQueryBuilder('r')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('r.receptionDate >= :startDate')
            ->andWhere('r.receptionDate <= :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('r.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Calcule les statistiques de satisfaction
     */
    public function getStatistics(?Tenant $tenant): array
    {
        if (!$tenant) {
            return [];
        }

        $qb = $this->createQueryBuilder('r')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        // Total des rapports
        $totalReports = (int) $qb->getQuery()->getSingleScalarResult();

        // Répartition par satisfaction
        $satisfactionStats = $this->createQueryBuilder('r')
            ->select('r.customerSatisfaction, COUNT(r.id) as count')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->groupBy('r.customerSatisfaction')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getResult();

        $satisfactionBreakdown = [
            'excellent' => 0,
            'good' => 0,
            'fair' => 0,
            'poor' => 0
        ];

        foreach ($satisfactionStats as $stat) {
            $satisfactionBreakdown[$stat['customerSatisfaction']] = (int) $stat['count'];
        }

        // Moyenne de satisfaction
        $avgSatisfaction = $this->createQueryBuilder('r')
            ->select('AVG(
                CASE r.customerSatisfaction 
                    WHEN \'excellent\' THEN 5
                    WHEN \'good\' THEN 4
                    WHEN \'fair\' THEN 3
                    WHEN \'poor\' THEN 2
                    ELSE 3
                END
            ) as avgScore')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getSingleScalarResult();

        // Rapports nécessitant un suivi
        $followUpReports = (int) $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('(
                r.remainingIssues IS NOT NULL AND r.remainingIssues != \'\' OR
                r.isVehicleReady = false OR
                r.customerSatisfaction = :poor
            )')
            ->setParameter('tenant', $tenant)
            ->setParameter('poor', 'poor')
            ->getQuery()
            ->getSingleScalarResult();

        // Véhicules prêts
        $vehiclesReady = (int) $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('r.isVehicleReady = true')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getSingleScalarResult();

        return [
            'totalReports' => $totalReports,
            'satisfactionBreakdown' => $satisfactionBreakdown,
            'averageSatisfaction' => round((float) $avgSatisfaction, 2),
            'followUpRequired' => $followUpReports,
            'vehiclesReady' => $vehiclesReady,
            'vehiclesNotReady' => $totalReports - $vehiclesReady,
            'satisfactionRate' => $totalReports > 0 ? round((($satisfactionBreakdown['excellent'] + $satisfactionBreakdown['good']) / $totalReports) * 100, 2) : 0
        ];
    }

    /**
     * Trouve les rapports par intervention
     */
    public function findByIntervention(int $interventionId): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->orderBy('r.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve le dernier rapport pour une intervention
     */
    public function findLatestByIntervention(int $interventionId): ?InterventionReceptionReport
    {
        return $this->createQueryBuilder('r')
            ->where('r.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->orderBy('r.receptionDate', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve les rapports excellents
     */
    public function findExcellentReports(?Tenant $tenant, int $limit = 10): array
    {
        if (!$tenant) {
            return [];
        }

        return $this->createQueryBuilder('r')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('r.customerSatisfaction = :excellent')
            ->setParameter('tenant', $tenant)
            ->setParameter('excellent', 'excellent')
            ->orderBy('r.receptionDate', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les rapports problématiques
     */
    public function findProblematicReports(?Tenant $tenant): array
    {
        if (!$tenant) {
            return [];
        }

        return $this->createQueryBuilder('r')
            ->innerJoin('r.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('(
                r.customerSatisfaction = :poor OR
                r.isVehicleReady = false OR
                (r.remainingIssues IS NOT NULL AND r.remainingIssues != \'\')
            )')
            ->setParameter('tenant', $tenant)
            ->setParameter('poor', 'poor')
            ->orderBy('r.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }
}