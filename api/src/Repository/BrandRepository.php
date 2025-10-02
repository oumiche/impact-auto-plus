<?php

namespace App\Repository;

use App\Entity\Brand;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Brand>
 */
class BrandRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Brand::class);
    }

    public function save(Brand $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Brand $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Recherche des marques avec pagination et filtres
     */
    public function findWithPagination(array $criteria = [], string $search = '', int $page = 1, int $limit = 10): array
    {
        $qb = $this->createQueryBuilder('b');
        
        // Appliquer les critères de base
        foreach ($criteria as $field => $value) {
            $qb->andWhere("b.{$field} = :{$field}")
               ->setParameter($field, $value);
        }
        
        // Appliquer la recherche textuelle
        if (!empty($search)) {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->like('LOWER(b.name)', ':search'),
                    $qb->expr()->like('LOWER(b.code)', ':search'),
                    $qb->expr()->like('LOWER(b.description)', ':search')
                )
            )->setParameter('search', '%' . strtolower($search) . '%');
        }
        
        // Tri par nom
        $qb->orderBy('b.name', 'ASC');
        
        // Pagination
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset)
           ->setMaxResults($limit);
        
        return $qb->getQuery()->getResult();
    }

    /**
     * Compter les marques avec critères et recherche
     */
    public function countWithFilters(array $criteria = [], string $search = ''): int
    {
        $qb = $this->createQueryBuilder('b')
                   ->select('COUNT(b.id)');
        
        // Appliquer les critères de base
        foreach ($criteria as $field => $value) {
            $qb->andWhere("b.{$field} = :{$field}")
               ->setParameter($field, $value);
        }
        
        // Appliquer la recherche textuelle
        if (!empty($search)) {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->like('LOWER(b.name)', ':search'),
                    $qb->expr()->like('LOWER(b.code)', ':search'),
                    $qb->expr()->like('LOWER(b.description)', ':search')
                )
            )->setParameter('search', '%' . strtolower($search) . '%');
        }
        
        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}