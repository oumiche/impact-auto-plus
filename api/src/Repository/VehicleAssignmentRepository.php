<?php

namespace App\Repository;

use App\Entity\VehicleAssignment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VehicleAssignment>
 */
class VehicleAssignmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VehicleAssignment::class);
    }

    public function save(VehicleAssignment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(VehicleAssignment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByTenant(int $tenantId): array
    {
        return $this->createQueryBuilder('va')
            ->andWhere('va.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('va.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByVehicle(int $vehicleId, int $tenantId): array
    {
        return $this->createQueryBuilder('va')
            ->andWhere('va.vehicle = :vehicleId')
            ->andWhere('va.tenant = :tenantId')
            ->setParameter('vehicleId', $vehicleId)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('va.assignedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByDriver(int $driverId, int $tenantId): array
    {
        return $this->createQueryBuilder('va')
            ->andWhere('va.driver = :driverId')
            ->andWhere('va.tenant = :tenantId')
            ->setParameter('driverId', $driverId)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('va.assignedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findActiveByVehicle(int $vehicleId, int $tenantId): ?VehicleAssignment
    {
        return $this->createQueryBuilder('va')
            ->andWhere('va.vehicle = :vehicleId')
            ->andWhere('va.tenant = :tenantId')
            ->andWhere('va.status = :status')
            ->setParameter('vehicleId', $vehicleId)
            ->setParameter('tenantId', $tenantId)
            ->setParameter('status', 'active')
            ->orderBy('va.assignedDate', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findActiveByDriver(int $driverId, int $tenantId): ?VehicleAssignment
    {
        return $this->createQueryBuilder('va')
            ->andWhere('va.driver = :driverId')
            ->andWhere('va.tenant = :tenantId')
            ->andWhere('va.status = :status')
            ->setParameter('driverId', $driverId)
            ->setParameter('tenantId', $tenantId)
            ->setParameter('status', 'active')
            ->orderBy('va.assignedDate', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByStatus(string $status, int $tenantId): array
    {
        return $this->createQueryBuilder('va')
            ->andWhere('va.status = :status')
            ->andWhere('va.tenant = :tenantId')
            ->setParameter('status', $status)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('va.assignedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findActiveAssignments(int $tenantId): array
    {
        return $this->createQueryBuilder('va')
            ->andWhere('va.status = :status')
            ->andWhere('va.tenant = :tenantId')
            ->setParameter('status', 'active')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('va.assignedDate', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
