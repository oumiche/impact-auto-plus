<?php

namespace App\Repository;

use App\Entity\CodeFormat;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CodeFormat>
 *
 * @method CodeFormat|null find($id, $lockMode = null, $lockVersion = null)
 * @method CodeFormat|null findOneBy(array $criteria, array $orderBy = null)
 * @method CodeFormat[]    findAll()
 * @method CodeFormat[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CodeFormatRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CodeFormat::class);
    }

    /**
     * Trouve un format de code par type d'entité et tenant
     */
    public function findByEntityTypeAndTenant(string $entityType, Tenant $tenant): ?CodeFormat
    {
        return $this->createQueryBuilder('cf')
            ->andWhere('cf.entityType = :entityType')
            ->andWhere('cf.tenant = :tenant')
            ->andWhere('cf.isActive = :active')
            ->setParameter('entityType', $entityType)
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('cf.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve un format de code global (sans tenant) par type d'entité
     */
    public function findGlobalByEntityType(string $entityType): ?CodeFormat
    {
        return $this->createQueryBuilder('cf')
            ->andWhere('cf.entityType = :entityType')
            ->andWhere('cf.tenant IS NULL')
            ->andWhere('cf.isActive = :active')
            ->setParameter('entityType', $entityType)
            ->setParameter('active', true)
            ->orderBy('cf.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve tous les formats de code pour un tenant
     */
    public function findByTenant(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('cf')
            ->andWhere('cf.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('cf.entityType', 'ASC');

        if (isset($filters['entityType'])) {
            $qb->andWhere('cf.entityType = :entityType')
                ->setParameter('entityType', $filters['entityType']);
        }

        if (isset($filters['isActive'])) {
            $qb->andWhere('cf.isActive = :active')
                ->setParameter('active', $filters['isActive']);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Trouve tous les formats de code pour un type d'entité
     */
    public function findByEntityType(string $entityType, Tenant $tenant): array
    {
        return $this->createQueryBuilder('cf')
            ->andWhere('cf.entityType = :entityType')
            ->andWhere('(cf.tenant = :tenant OR cf.tenant IS NULL)')
            ->setParameter('entityType', $entityType)
            ->setParameter('tenant', $tenant)
            ->orderBy('cf.tenant', 'DESC') // Prioriser les formats spécifiques au tenant
            ->addOrderBy('cf.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
