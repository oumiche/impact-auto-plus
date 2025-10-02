<?php

namespace App\Repository;

use App\Entity\VehicleFuelLog;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VehicleFuelLog>
 */
class VehicleFuelLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VehicleFuelLog::class);
    }

    public function findByTenant(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('vfl')
            ->where('vfl.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('vfl.refuelDate', 'DESC');

        if (isset($filters['vehicle_id'])) {
            $qb->andWhere('vfl.vehicle = :vehicle')
               ->setParameter('vehicle', $filters['vehicle_id']);
        }

        if (isset($filters['driver_id'])) {
            $qb->andWhere('vfl.driver = :driver')
               ->setParameter('driver', $filters['driver_id']);
        }

        if (isset($filters['fuel_type'])) {
            $qb->andWhere('vfl.fuelType = :fuelType')
               ->setParameter('fuelType', $filters['fuel_type']);
        }

        if (isset($filters['date_from'])) {
            $qb->andWhere('vfl.refuelDate >= :dateFrom')
               ->setParameter('dateFrom', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $qb->andWhere('vfl.refuelDate <= :dateTo')
               ->setParameter('dateTo', $filters['date_to']);
        }

        if (isset($filters['station'])) {
            $qb->andWhere('vfl.stationName LIKE :station')
               ->setParameter('station', '%' . $filters['station'] . '%');
        }

        return $qb->getQuery()->getResult();
    }

    public function findFuelLogsByVehicle(Tenant $tenant, int $vehicleId): array
    {
        return $this->createQueryBuilder('vfl')
            ->where('vfl.tenant = :tenant')
            ->andWhere('vfl.vehicle = :vehicle')
            ->setParameter('tenant', $tenant)
            ->setParameter('vehicle', $vehicleId)
            ->orderBy('vfl.refuelDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findFuelLogsByDriver(Tenant $tenant, int $driverId): array
    {
        return $this->createQueryBuilder('vfl')
            ->where('vfl.tenant = :tenant')
            ->andWhere('vfl.driver = :driver')
            ->setParameter('tenant', $tenant)
            ->setParameter('driver', $driverId)
            ->orderBy('vfl.refuelDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getFuelStatistics(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('vfl')
            ->select([
                'COUNT(vfl.id) as totalRefuels',
                'SUM(vfl.quantity) as totalQuantity',
                'SUM(vfl.totalCost) as totalCost',
                'AVG(vfl.unitPrice) as avgUnitPrice',
                'AVG(vfl.fuelEfficiency) as avgFuelEfficiency',
                'SUM(vfl.kilometersDriven) as totalKilometers'
            ])
            ->where('vfl.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        if (isset($filters['vehicle_id'])) {
            $qb->andWhere('vfl.vehicle = :vehicle')
               ->setParameter('vehicle', $filters['vehicle_id']);
        }

        if (isset($filters['date_from'])) {
            $qb->andWhere('vfl.refuelDate >= :dateFrom')
               ->setParameter('dateFrom', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $qb->andWhere('vfl.refuelDate <= :dateTo')
               ->setParameter('dateTo', $filters['date_to']);
        }

        $result = $qb->getQuery()->getSingleResult();

        return [
            'totalRefuels' => (int) $result['totalRefuels'],
            'totalQuantity' => $result['totalQuantity'] ? (float) $result['totalQuantity'] : 0,
            'totalCost' => $result['totalCost'] ? (float) $result['totalCost'] : 0,
            'avgUnitPrice' => $result['avgUnitPrice'] ? (float) $result['avgUnitPrice'] : 0,
            'avgFuelEfficiency' => $result['avgFuelEfficiency'] ? (float) $result['avgFuelEfficiency'] : 0,
            'totalKilometers' => $result['totalKilometers'] ? (int) $result['totalKilometers'] : 0
        ];
    }

    public function getFuelEfficiencyByVehicle(Tenant $tenant, int $vehicleId): array
    {
        return $this->createQueryBuilder('vfl')
            ->select([
                'vfl.fuelEfficiency',
                'vfl.refuelDate',
                'vfl.kilometersDriven',
                'vfl.quantity'
            ])
            ->where('vfl.tenant = :tenant')
            ->andWhere('vfl.vehicle = :vehicle')
            ->andWhere('vfl.fuelEfficiency IS NOT NULL')
            ->setParameter('tenant', $tenant)
            ->setParameter('vehicle', $vehicleId)
            ->orderBy('vfl.refuelDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getMonthlyFuelConsumption(Tenant $tenant, int $year = null): array
    {
        $year = $year ?? (new \DateTime())->format('Y');
        
        return $this->createQueryBuilder('vfl')
            ->select([
                'MONTH(vfl.refuelDate) as month',
                'SUM(vfl.quantity) as totalQuantity',
                'SUM(vfl.totalCost) as totalCost',
                'AVG(vfl.fuelEfficiency) as avgEfficiency'
            ])
            ->where('vfl.tenant = :tenant')
            ->andWhere('YEAR(vfl.refuelDate) = :year')
            ->setParameter('tenant', $tenant)
            ->setParameter('year', $year)
            ->groupBy('month')
            ->orderBy('month', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getTopFuelStations(Tenant $tenant, int $limit = 10): array
    {
        return $this->createQueryBuilder('vfl')
            ->select([
                'vfl.stationName',
                'COUNT(vfl.id) as refuelCount',
                'SUM(vfl.quantity) as totalQuantity',
                'SUM(vfl.totalCost) as totalCost'
            ])
            ->where('vfl.tenant = :tenant')
            ->andWhere('vfl.stationName IS NOT NULL')
            ->setParameter('tenant', $tenant)
            ->groupBy('vfl.stationName')
            ->orderBy('refuelCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findRecentFuelLogs(Tenant $tenant, int $limit = 10): array
    {
        return $this->createQueryBuilder('vfl')
            ->where('vfl.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('vfl.refuelDate', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
