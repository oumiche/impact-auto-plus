<?php

namespace App\Repository;

use App\Entity\Model;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Model>
 */
class ModelRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Model::class);
    }

    public function save(Model $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Model $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Recherche des modèles avec pagination et filtres
     */
    public function findWithPagination(array $criteria = [], string $search = '', int $page = 1, int $limit = 10): array
    {
        $qb = $this->createQueryBuilder('m')
                   ->leftJoin('m.brand', 'b')
                   ->addSelect('b');
        
        // Appliquer les critères de base
        foreach ($criteria as $field => $value) {
            if ($field === 'brand') {
                $qb->andWhere('m.brand = :brandId')
                   ->setParameter('brandId', $value);
            } else {
                $qb->andWhere("m.{$field} = :{$field}")
                   ->setParameter($field, $value);
            }
        }
        
        // Appliquer la recherche textuelle
        if (!empty($search)) {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->like('LOWER(m.name)', ':search'),
                    $qb->expr()->like('LOWER(m.code)', ':search'),
                    $qb->expr()->like('LOWER(m.description)', ':search'),
                    $qb->expr()->like('LOWER(b.name)', ':search')
                )
            )->setParameter('search', '%' . strtolower($search) . '%');
        }
        
        // Tri par nom
        $qb->orderBy('m.name', 'ASC');
        
        // Pagination
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset)
           ->setMaxResults($limit);
        
        return $qb->getQuery()->getResult();
    }

    /**
     * Compter les modèles avec critères et recherche
     */
    public function countWithFilters(array $criteria = [], string $search = ''): int
    {
        $qb = $this->createQueryBuilder('m')
                   ->select('COUNT(m.id)')
                   ->leftJoin('m.brand', 'b');
        
        // Appliquer les critères de base
        foreach ($criteria as $field => $value) {
            if ($field === 'brand') {
                $qb->andWhere('m.brand = :brandId')
                   ->setParameter('brandId', $value);
            } else {
                $qb->andWhere("m.{$field} = :{$field}")
                   ->setParameter($field, $value);
            }
        }
        
        // Appliquer la recherche textuelle
        if (!empty($search)) {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->like('LOWER(m.name)', ':search'),
                    $qb->expr()->like('LOWER(m.code)', ':search'),
                    $qb->expr()->like('LOWER(m.description)', ':search'),
                    $qb->expr()->like('LOWER(b.name)', ':search')
                )
            )->setParameter('search', '%' . strtolower($search) . '%');
        }
        
        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
