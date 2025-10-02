<?php

namespace App\Repository;

use App\Entity\EntityCode;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EntityCode>
 *
 * @method EntityCode|null find($id, $lockMode = null, $lockVersion = null)
 * @method EntityCode|null findOneBy(array $criteria, array $orderBy = null)
 * @method EntityCode[]    findAll()
 * @method EntityCode[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class EntityCodeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EntityCode::class);
    }

    /**
     * Trouve un code existant pour une entité
     */
    public function findByEntity(string $entityType, int $entityId, Tenant $tenant): ?EntityCode
    {
        return $this->createQueryBuilder('ec')
            ->andWhere('ec.entityType = :entityType')
            ->andWhere('ec.entityId = :entityId')
            ->andWhere('ec.tenant = :tenant')
            ->setParameter('entityType', $entityType)
            ->setParameter('entityId', $entityId)
            ->setParameter('tenant', $tenant)
            ->orderBy('ec.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve tous les codes pour un tenant
     */
    public function findByTenant(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('ec')
            ->andWhere('ec.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('ec.createdAt', 'DESC');

        if (isset($filters['entityType'])) {
            $qb->andWhere('ec.entityType = :entityType')
                ->setParameter('entityType', $filters['entityType']);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Trouve tous les codes pour un type d'entité
     */
    public function findByEntityType(string $entityType, Tenant $tenant): array
    {
        return $this->createQueryBuilder('ec')
            ->andWhere('ec.entityType = :entityType')
            ->andWhere('ec.tenant = :tenant')
            ->setParameter('entityType', $entityType)
            ->setParameter('tenant', $tenant)
            ->orderBy('ec.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
