<?php

namespace App\Repository;

use App\Entity\Vehicle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Vehicle>
 */
class VehicleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Vehicle::class);
    }

    public function save(Vehicle $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Vehicle $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByTenant(int $tenantId): array
    {
        return $this->createQueryBuilder('v')
            ->andWhere('v.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('v.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByStatus(string $status, int $tenantId): array
    {
        return $this->createQueryBuilder('v')
            ->andWhere('v.status = :status')
            ->andWhere('v.tenant = :tenantId')
            ->setParameter('status', $status)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('v.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findExpiringInsurance(int $days = 30, int $tenantId): array
    {
        $date = new \DateTime();
        $date->add(new \DateInterval('P' . $days . 'D'));

        return $this->createQueryBuilder('v')
            ->andWhere('v.insuranceExpiry <= :date')
            ->andWhere('v.insuranceExpiry > :now')
            ->andWhere('v.tenant = :tenantId')
            ->setParameter('date', $date)
            ->setParameter('now', new \DateTime())
            ->setParameter('tenantId', $tenantId)
            ->orderBy('v.insuranceExpiry', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findExpiringTechnicalInspection(int $days = 30, int $tenantId): array
    {
        $date = new \DateTime();
        $date->add(new \DateInterval('P' . $days . 'D'));

        return $this->createQueryBuilder('v')
            ->andWhere('v.technicalInspectionExpiry <= :date')
            ->andWhere('v.technicalInspectionExpiry > :now')
            ->andWhere('v.tenant = :tenantId')
            ->setParameter('date', $date)
            ->setParameter('now', new \DateTime())
            ->setParameter('tenantId', $tenantId)
            ->orderBy('v.technicalInspectionExpiry', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
