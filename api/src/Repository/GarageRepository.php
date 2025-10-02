<?php

namespace App\Repository;

use App\Entity\Garage;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Garage>
 */
class GarageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Garage::class);
    }

    public function findByTenant(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('g')
            ->where('g.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('g.name', 'ASC');

        if (isset($filters['is_active'])) {
            $qb->andWhere('g.isActive = :isActive')
               ->setParameter('isActive', $filters['is_active']);
        }

        if (isset($filters['search'])) {
            $qb->andWhere('(g.name LIKE :search OR g.contactPerson LIKE :search)')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }

        if (isset($filters['specialization'])) {
            $qb->andWhere('g.specializations LIKE :specialization')
               ->setParameter('specialization', '%' . $filters['specialization'] . '%');
        }

        return $qb->getQuery()->getResult();
    }

    public function findActiveGarages(Tenant $tenant): array
    {
        return $this->createQueryBuilder('g')
            ->where('g.tenant = :tenant')
            ->andWhere('g.isActive = :active')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('g.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBySpecialization(Tenant $tenant, string $specialization): array
    {
        return $this->createQueryBuilder('g')
            ->where('g.tenant = :tenant')
            ->andWhere('g.isActive = :active')
            ->andWhere('g.specializations LIKE :specialization')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->setParameter('specialization', '%' . $specialization . '%')
            ->orderBy('g.rating', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getTopRatedGarages(Tenant $tenant, int $limit = 10): array
    {
        return $this->createQueryBuilder('g')
            ->where('g.tenant = :tenant')
            ->andWhere('g.isActive = :active')
            ->andWhere('g.rating IS NOT NULL')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('g.rating', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getGarageStatistics(Tenant $tenant): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select([
                'COUNT(g.id) as total',
                'SUM(CASE WHEN g.isActive = :active THEN 1 ELSE 0 END) as active',
                'AVG(g.rating) as avgRating',
                'COUNT(DISTINCT g.specializations) as specializations'
            ])
            ->where('g.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true);

        $result = $qb->getQuery()->getSingleResult();

        return [
            'total' => (int) $result['total'],
            'active' => (int) $result['active'],
            'avgRating' => $result['avgRating'] ? (float) $result['avgRating'] : 0,
            'specializations' => (int) $result['specializations']
        ];
    }
}
