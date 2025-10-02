<?php

namespace App\Repository;

use App\Entity\VehicleMaintenance;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VehicleMaintenance>
 */
class VehicleMaintenanceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VehicleMaintenance::class);
    }

    public function findByTenant(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('vm')
            ->where('vm.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('vm.scheduledDate', 'DESC');

        if (isset($filters['status'])) {
            $qb->andWhere('vm.status = :status')
               ->setParameter('status', $filters['status']);
        }

        if (isset($filters['type'])) {
            $qb->andWhere('vm.type = :type')
               ->setParameter('type', $filters['type']);
        }

        if (isset($filters['vehicle_id'])) {
            $qb->andWhere('vm.vehicle = :vehicle')
               ->setParameter('vehicle', $filters['vehicle_id']);
        }

        if (isset($filters['date_from'])) {
            $qb->andWhere('vm.scheduledDate >= :dateFrom')
               ->setParameter('dateFrom', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $qb->andWhere('vm.scheduledDate <= :dateTo')
               ->setParameter('dateTo', $filters['date_to']);
        }

        return $qb->getQuery()->getResult();
    }

    public function findUpcomingMaintenance(Tenant $tenant, int $days = 30): array
    {
        $dateFrom = new \DateTime();
        $dateTo = (new \DateTime())->modify("+{$days} days");

        return $this->createQueryBuilder('vm')
            ->where('vm.tenant = :tenant')
            ->andWhere('vm.status IN (:statuses)')
            ->andWhere('vm.scheduledDate BETWEEN :dateFrom AND :dateTo')
            ->setParameter('tenant', $tenant)
            ->setParameter('statuses', ['scheduled', 'in_progress'])
            ->setParameter('dateFrom', $dateFrom)
            ->setParameter('dateTo', $dateTo)
            ->orderBy('vm.scheduledDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOverdueMaintenance(Tenant $tenant): array
    {
        return $this->createQueryBuilder('vm')
            ->where('vm.tenant = :tenant')
            ->andWhere('vm.status IN (:statuses)')
            ->andWhere('vm.scheduledDate < :today')
            ->setParameter('tenant', $tenant)
            ->setParameter('statuses', ['scheduled', 'in_progress'])
            ->setParameter('today', new \DateTime())
            ->orderBy('vm.scheduledDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getMaintenanceStatistics(Tenant $tenant): array
    {
        $qb = $this->createQueryBuilder('vm')
            ->select([
                'COUNT(vm.id) as total',
                'SUM(CASE WHEN vm.status = :completed THEN 1 ELSE 0 END) as completed',
                'SUM(CASE WHEN vm.status = :scheduled THEN 1 ELSE 0 END) as scheduled',
                'SUM(CASE WHEN vm.status = :inProgress THEN 1 ELSE 0 END) as inProgress',
                'SUM(CASE WHEN vm.status = :cancelled THEN 1 ELSE 0 END) as cancelled',
                'SUM(CASE WHEN vm.type = :preventive THEN 1 ELSE 0 END) as preventive',
                'SUM(CASE WHEN vm.type = :corrective THEN 1 ELSE 0 END) as corrective',
                'AVG(vm.cost) as avgCost',
                'SUM(vm.cost) as totalCost'
            ])
            ->where('vm.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->setParameter('completed', 'completed')
            ->setParameter('scheduled', 'scheduled')
            ->setParameter('inProgress', 'in_progress')
            ->setParameter('cancelled', 'cancelled')
            ->setParameter('preventive', 'preventive')
            ->setParameter('corrective', 'corrective');

        $result = $qb->getQuery()->getSingleResult();

        return [
            'total' => (int) $result['total'],
            'completed' => (int) $result['completed'],
            'scheduled' => (int) $result['scheduled'],
            'inProgress' => (int) $result['inProgress'],
            'cancelled' => (int) $result['cancelled'],
            'preventive' => (int) $result['preventive'],
            'corrective' => (int) $result['corrective'],
            'avgCost' => $result['avgCost'] ? (float) $result['avgCost'] : 0,
            'totalCost' => $result['totalCost'] ? (float) $result['totalCost'] : 0
        ];
    }

    public function findMaintenanceByVehicle(Tenant $tenant, int $vehicleId): array
    {
        return $this->createQueryBuilder('vm')
            ->where('vm.tenant = :tenant')
            ->andWhere('vm.vehicle = :vehicle')
            ->setParameter('tenant', $tenant)
            ->setParameter('vehicle', $vehicleId)
            ->orderBy('vm.scheduledDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findRecurringMaintenance(Tenant $tenant): array
    {
        return $this->createQueryBuilder('vm')
            ->where('vm.tenant = :tenant')
            ->andWhere('vm.isRecurring = :recurring')
            ->setParameter('tenant', $tenant)
            ->setParameter('recurring', true)
            ->orderBy('vm.scheduledDate', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
