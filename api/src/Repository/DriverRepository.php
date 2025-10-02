<?php

namespace App\Repository;

use App\Entity\Driver;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Driver>
 */
class DriverRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Driver::class);
    }

    public function save(Driver $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Driver $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByTenant(int $tenantId): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('d.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByStatus(string $status, int $tenantId): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.status = :status')
            ->andWhere('d.tenant = :tenantId')
            ->setParameter('status', $status)
            ->setParameter('tenantId', $tenantId)
            ->orderBy('d.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findExpiringLicenses(int $days = 30, int $tenantId): array
    {
        $date = new \DateTime();
        $date->add(new \DateInterval('P' . $days . 'D'));

        return $this->createQueryBuilder('d')
            ->andWhere('d.licenseExpiryDate <= :date')
            ->andWhere('d.licenseExpiryDate > :now')
            ->andWhere('d.tenant = :tenantId')
            ->setParameter('date', $date)
            ->setParameter('now', new \DateTime())
            ->setParameter('tenantId', $tenantId)
            ->orderBy('d.licenseExpiryDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findExpiredLicenses(int $tenantId): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.licenseExpiryDate < :now')
            ->andWhere('d.tenant = :tenantId')
            ->setParameter('now', new \DateTime())
            ->setParameter('tenantId', $tenantId)
            ->orderBy('d.licenseExpiryDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findActiveDrivers(int $tenantId): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.status = :status')
            ->andWhere('d.tenant = :tenantId')
            ->setParameter('status', 'active')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('d.firstName', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
