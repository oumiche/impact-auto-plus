<?php

namespace App\Repository;

use App\Entity\SupplyCategory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SupplyCategory>
 */
class SupplyCategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SupplyCategory::class);
    }

    public function save(SupplyCategory $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(SupplyCategory $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findRootCategories(): array
    {
        return $this->createQueryBuilder('sc')
            ->andWhere('sc.parent IS NULL')
            ->orderBy('sc.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByParent(?SupplyCategory $parent): array
    {
        return $this->createQueryBuilder('sc')
            ->andWhere('sc.parent = :parent')
            ->setParameter('parent', $parent)
            ->orderBy('sc.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findLeafCategories(): array
    {
        return $this->createQueryBuilder('sc')
            ->leftJoin('sc.children', 'c')
            ->andWhere('c.id IS NULL')
            ->orderBy('sc.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findWithSupplies(): array
    {
        return $this->createQueryBuilder('sc')
            ->leftJoin('sc.supplies', 's')
            ->andWhere('s.id IS NOT NULL')
            ->groupBy('sc.id')
            ->orderBy('sc.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByName(string $name): ?SupplyCategory
    {
        return $this->createQueryBuilder('sc')
            ->andWhere('sc.name = :name')
            ->setParameter('name', $name)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByNameContaining(string $name): array
    {
        return $this->createQueryBuilder('sc')
            ->andWhere('sc.name LIKE :name')
            ->setParameter('name', '%' . $name . '%')
            ->orderBy('sc.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getCategoryTree(): array
    {
        $rootCategories = $this->findRootCategories();
        $tree = [];

        foreach ($rootCategories as $category) {
            $tree[] = $this->buildCategoryNode($category);
        }

        return $tree;
    }

    private function buildCategoryNode(SupplyCategory $category): array
    {
        $node = [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'description' => $category->getDescription(),
            'icon' => $category->getIcon(),
            'level' => $category->getLevel(),
            'path' => $category->getPath(),
            'suppliesCount' => $category->getSuppliesCount(),
            'totalSuppliesCount' => $category->getTotalSuppliesCount(),
            'isLeaf' => $category->isLeaf(),
            'children' => []
        ];

        foreach ($category->getChildren() as $child) {
            $node['children'][] = $this->buildCategoryNode($child);
        }

        return $node;
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('sc')
            ->select([
                'COUNT(sc.id) as total',
                'SUM(CASE WHEN sc.parent IS NULL THEN 1 ELSE 0 END) as rootCategories',
                'SUM(CASE WHEN sc.parent IS NOT NULL THEN 1 ELSE 0 END) as subCategories',
                'AVG(sc.suppliesCount) as avgSuppliesPerCategory'
            ])
            ->leftJoin('sc.supplies', 's')
            ->groupBy('sc.id');

        return $qb->getQuery()->getSingleResult();
    }
}
