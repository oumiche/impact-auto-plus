<?php

namespace App\Repository;

use App\Entity\Report;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Report>
 *
 * @method Report|null find($id, $lockMode = null, $lockVersion = null)
 * @method Report|null findOneBy(array $criteria, array $orderBy = null)
 * @method Report[]    findAll()
 * @method Report[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ReportRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Report::class);
    }

    /**
     * Trouve un rapport avec un cache valide
     */
    public function findWithValidCache(string $type, Tenant $tenant, array $parameters = []): ?Report
    {
        $qb = $this->createQueryBuilder('r')
            ->where('r.type = :type')
            ->andWhere('r.tenant = :tenant')
            ->andWhere('r.cachedUntil > :now')
            ->setParameter('type', $type)
            ->setParameter('tenant', $tenant)
            ->setParameter('now', new \DateTime())
            ->orderBy('r.generatedAt', 'DESC')
            ->setMaxResults(1);

        // Filtrer par paramètres si fournis
        if (!empty($parameters)) {
            $qb->andWhere('JSON_CONTAINS(r.parameters, :params) = 1')
               ->setParameter('params', json_encode($parameters));
        }

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * Trouve tous les rapports d'un tenant
     */
    public function findByTenant(Tenant $tenant, int $limit = 50): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('r.generatedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les rapports par type
     */
    public function findByType(string $type, Tenant $tenant, int $limit = 10): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.type = :type')
            ->andWhere('r.tenant = :tenant')
            ->setParameter('type', $type)
            ->setParameter('tenant', $tenant)
            ->orderBy('r.generatedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Supprime les rapports avec cache expiré
     */
    public function deleteExpiredCache(Tenant $tenant): int
    {
        return $this->createQueryBuilder('r')
            ->delete()
            ->where('r.tenant = :tenant')
            ->andWhere('r.cachedUntil < :now')
            ->setParameter('tenant', $tenant)
            ->setParameter('now', new \DateTime())
            ->getQuery()
            ->execute();
    }

    /**
     * Compte les rapports générés par type
     */
    public function countByType(Tenant $tenant): array
    {
        $results = $this->createQueryBuilder('r')
            ->select('r.type, COUNT(r.id) as count')
            ->where('r.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->groupBy('r.type')
            ->getQuery()
            ->getResult();

        $counts = [];
        foreach ($results as $result) {
            $counts[$result['type']] = (int) $result['count'];
        }

        return $counts;
    }

    /**
     * Trouve les rapports publics
     */
    public function findPublicReports(Tenant $tenant): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.tenant = :tenant')
            ->andWhere('r.isPublic = :isPublic')
            ->setParameter('tenant', $tenant)
            ->setParameter('isPublic', true)
            ->orderBy('r.generatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Invalide tous les caches d'un type
     */
    public function invalidateCacheByType(string $type, Tenant $tenant): int
    {
        return $this->createQueryBuilder('r')
            ->update()
            ->set('r.cachedUntil', ':null')
            ->set('r.cachedData', ':null')
            ->where('r.type = :type')
            ->andWhere('r.tenant = :tenant')
            ->setParameter('type', $type)
            ->setParameter('tenant', $tenant)
            ->setParameter('null', null)
            ->getQuery()
            ->execute();
    }

    /**
     * Recherche de rapports avec pagination
     */
    public function findWithPagination(
        Tenant $tenant,
        ?string $type = null,
        ?string $search = null,
        int $page = 1,
        int $limit = 20
    ): array {
        $qb = $this->createQueryBuilder('r')
            ->where('r.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        if ($type) {
            $qb->andWhere('r.type = :type')
               ->setParameter('type', $type);
        }

        if ($search) {
            $qb->andWhere('r.name LIKE :search OR r.description LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }

        $qb->orderBy('r.generatedAt', 'DESC')
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
    }

    /**
     * Compte les rapports avec filtres
     */
    public function countWithFilters(
        Tenant $tenant,
        ?string $type = null,
        ?string $search = null
    ): int {
        $qb = $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->where('r.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        if ($type) {
            $qb->andWhere('r.type = :type')
               ->setParameter('type', $type);
        }

        if ($search) {
            $qb->andWhere('r.name LIKE :search OR r.description LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}

