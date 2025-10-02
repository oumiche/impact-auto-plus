<?php

namespace App\Repository;

use App\Entity\Supply;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Supply>
 */
class SupplyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Supply::class);
    }

    public function save(Supply $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Supply $entity, bool $flush = false): void
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

    public function findByCategory(int $categoryId): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.category = :categoryId')
            ->setParameter('categoryId', $categoryId)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBySupplier(int $supplierId): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.supplier = :supplierId')
            ->setParameter('supplierId', $supplierId)
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

    public function findInStock(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.stockQuantity > :zero')
            ->setParameter('zero', 0)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOutOfStock(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.stockQuantity = :zero')
            ->setParameter('zero', 0)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findLowStock(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.stockQuantity <= s.minStockLevel')
            ->andWhere('s.stockQuantity > :zero')
            ->setParameter('zero', 0)
            ->orderBy('s.stockQuantity', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOverstocked(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.maxStockLevel > :zero')
            ->andWhere('s.stockQuantity > s.maxStockLevel')
            ->setParameter('zero', 0)
            ->orderBy('s.stockQuantity', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findConsumables(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isConsumable = :consumable')
            ->setParameter('consumable', true)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByBrand(string $brand): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.brand = :brand')
            ->setParameter('brand', $brand)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByReference(string $reference): ?Supply
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.reference = :reference')
            ->setParameter('reference', $reference)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByOemReference(string $oemReference): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.oemReference = :oemReference')
            ->setParameter('oemReference', $oemReference)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
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

    public function findByPriceRange(float $minPrice, float $maxPrice): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.unitPrice BETWEEN :minPrice AND :maxPrice')
            ->setParameter('minPrice', $minPrice)
            ->setParameter('maxPrice', $maxPrice)
            ->orderBy('s.unitPrice', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByLocation(string $location): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.location = :location')
            ->setParameter('location', $location)
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findNeedingReorder(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.stockQuantity <= s.minStockLevel')
            ->andWhere('s.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('s.stockQuantity', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByModelCompatibility(string $model): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('JSON_CONTAINS(s.modelCompatibility, :model) = 1')
            ->setParameter('model', json_encode($model))
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('s')
            ->select([
                'COUNT(s.id) as total',
                'SUM(CASE WHEN s.isActive = true THEN 1 ELSE 0 END) as active',
                'SUM(CASE WHEN s.stockQuantity > 0 THEN 1 ELSE 0 END) as inStock',
                'SUM(CASE WHEN s.stockQuantity = 0 THEN 1 ELSE 0 END) as outOfStock',
                'SUM(CASE WHEN s.stockQuantity <= s.minStockLevel AND s.stockQuantity > 0 THEN 1 ELSE 0 END) as lowStock',
                'SUM(CASE WHEN s.isConsumable = true THEN 1 ELSE 0 END) as consumables',
                'AVG(s.unitPrice) as avgPrice',
                'SUM(s.stockQuantity * s.unitPrice) as totalValue',
                'SUM(s.stockQuantity) as totalQuantity'
            ]);

        return $qb->getQuery()->getSingleResult();
    }

    public function getTopSupplies(int $limit = 10): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('s.stockQuantity', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getMostExpensive(int $limit = 10): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('s.unitPrice', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getCheapest(int $limit = 10): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->andWhere('s.unitPrice > :zero')
            ->setParameter('active', true)
            ->setParameter('zero', 0)
            ->orderBy('s.unitPrice', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function search(string $query): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.name LIKE :query OR s.description LIKE :query OR s.reference LIKE :query OR s.brand LIKE :query')
            ->setParameter('query', '%' . $query . '%')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
