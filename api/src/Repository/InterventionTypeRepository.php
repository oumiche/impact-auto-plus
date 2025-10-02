<?php

namespace App\Repository;

use App\Entity\InterventionType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionType>
 *
 * @method InterventionType|null find($id, $lockMode = null, $lockVersion = null)
 * @method InterventionType|null findOneBy(array $criteria, array $orderBy = null)
 * @method InterventionType[]    findAll()
 * @method InterventionType[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class InterventionTypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionType::class);
    }

    public function save(InterventionType $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InterventionType $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Trouve tous les types d'intervention actifs
     */
    public function findActive(): array
    {
        return $this->createQueryBuilder('it')
            ->where('it.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('it.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Recherche les types d'intervention par nom
     */
    public function searchByName(string $search): array
    {
        return $this->createQueryBuilder('it')
            ->where('it.name LIKE :search')
            ->andWhere('it.isActive = :active')
            ->setParameter('search', '%' . $search . '%')
            ->setParameter('active', true)
            ->orderBy('it.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
