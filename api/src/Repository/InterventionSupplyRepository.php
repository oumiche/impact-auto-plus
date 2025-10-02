<?php

namespace App\Repository;

use App\Entity\InterventionSupply;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionSupply>
 *
 * @method InterventionSupply|null find($id, $lockMode = null, $lockVersion = null)
 * @method InterventionSupply|null findOneBy(array $criteria, array $orderBy = null)
 * @method InterventionSupply[]    findAll()
 * @method InterventionSupply[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class InterventionSupplyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionSupply::class);
    }
}
