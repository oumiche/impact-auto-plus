<?php

namespace App\Repository;

use App\Entity\Supplier;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Supplier>
 */
class SupplierRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Supplier::class);
    }

    public function save(Supplier $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Supplier $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByTenant(int $tenantId): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findActive(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findReliable(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.rating >= :minRating')
            ->setParameter('minRating', '4.0')
            ->orderBy('s.rating', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByRating(float $minRating, float $maxRating = 5.0): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.rating BETWEEN :minRating AND :maxRating')
            ->setParameter('minRating', (string) $minRating)
            ->setParameter('maxRating', (string) $maxRating)
            ->orderBy('s.rating', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByName(string $name): ?Supplier
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.name = :name')
            ->setParameter('name', $name)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByNameContaining(string $name): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.name LIKE :name')
            ->setParameter('name', '%' . $name . '%')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByCity(string $city): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.city = :city')
            ->setParameter('city', $city)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByCountry(string $country): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.country = :country')
            ->setParameter('country', $country)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findWithSupplies(): array
    {
        return $this->createQueryBuilder('s')
            ->leftJoin('s.supplies', 'supplies')
            ->andWhere('supplies.id IS NOT NULL')
            ->groupBy('s.id')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByDeliveryTime(int $maxDays): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.deliveryTimeDays <= :maxDays')
            ->setParameter('maxDays', $maxDays)
            ->orderBy('s.deliveryTimeDays', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('s')
            ->select([
                'COUNT(s.id) as total',
                'SUM(CASE WHEN s.isActive = true THEN 1 ELSE 0 END) as active',
                'SUM(CASE WHEN s.isActive = false THEN 1 ELSE 0 END) as inactive',
                'AVG(s.rating) as avgRating',
                'MIN(s.rating) as minRating',
                'MAX(s.rating) as maxRating',
                'AVG(s.deliveryTimeDays) as avgDeliveryTime'
            ]);

        return $qb->getQuery()->getSingleResult();
    }

    public function getTopRated(int $limit = 10): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('s.rating', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getFastestDelivery(int $limit = 10): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->andWhere('s.deliveryTimeDays IS NOT NULL')
            ->setParameter('active', true)
            ->orderBy('s.deliveryTimeDays', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
