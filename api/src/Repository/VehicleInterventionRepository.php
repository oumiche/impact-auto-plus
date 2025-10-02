<?php

namespace App\Repository;

use App\Entity\VehicleIntervention;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VehicleIntervention>
 */
class VehicleInterventionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VehicleIntervention::class);
    }

    public function save(VehicleIntervention $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(VehicleIntervention $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByTenant(int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByVehicle(int $vehicleId, int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.vehicle = :vehicleId')
            ->andWhere('vi.tenant = :tenantId')
            ->setParameter('vehicleId', $vehicleId)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.reportedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByStatus(string $status, int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.currentStatus = :status')
            ->andWhere('vi.tenant = :tenantId')
            ->setParameter('status', $status)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.reportedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findActive(int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.tenant = :tenantId')
            ->andWhere('vi.closedDate IS NULL')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.priority', 'DESC')
            ->addOrderBy('vi.reportedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOverdue(int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.tenant = :tenantId')
            ->andWhere('vi.closedDate IS NULL')
            ->andWhere('vi.startedDate IS NOT NULL')
            ->andWhere('vi.completedDate IS NULL')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.reportedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByPriority(string $priority, int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.priority = :priority')
            ->andWhere('vi.tenant = :tenantId')
            ->setParameter('priority', $priority)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.reportedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByProblemType(string $problemType, int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.problemType = :problemType')
            ->andWhere('vi.tenant = :tenantId')
            ->setParameter('problemType', $problemType)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.reportedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findAssignedTo(int $assignedTo, int $tenantId): array
    {
        return $this->createQueryBuilder('vi')
            ->andWhere('vi.assignedTo = :assignedTo')
            ->andWhere('vi.tenant = :tenantId')
            ->setParameter('assignedTo', $assignedTo)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('vi.priority', 'DESC')
            ->addOrderBy('vi.reportedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(int $tenantId): array
    {
        $qb = $this->createQueryBuilder('vi')
            ->select([
                'COUNT(vi.id) as total',
                'SUM(CASE WHEN vi.closedDate IS NULL THEN 1 ELSE 0 END) as active',
                'SUM(CASE WHEN vi.completedDate IS NOT NULL THEN 1 ELSE 0 END) as completed',
                'SUM(CASE WHEN vi.closedDate IS NOT NULL THEN 1 ELSE 0 END) as closed',
                'AVG(vi.actualDurationDays) as avgDuration'
            ])
            ->andWhere('vi.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId);

        return $qb->getQuery()->getSingleResult();
    }
}
