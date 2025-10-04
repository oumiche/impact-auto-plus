<?php

namespace App\Repository;

use App\Entity\InterventionWorkAuthorizationLine;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionWorkAuthorizationLine>
 */
class InterventionWorkAuthorizationLineRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionWorkAuthorizationLine::class);
    }

    /**
     * Trouve toutes les lignes d'une autorisation
     */
    public function findByAuthorization(int $authorizationId): array
    {
        return $this->createQueryBuilder('iwal')
            ->where('iwal.authorization = :authorizationId')
            ->setParameter('authorizationId', $authorizationId)
            ->orderBy('iwal.lineNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve une ligne par son numéro dans une autorisation
     */
    public function findByAuthorizationAndLineNumber(int $authorizationId, int $lineNumber): ?InterventionWorkAuthorizationLine
    {
        return $this->createQueryBuilder('iwal')
            ->where('iwal.authorization = :authorizationId')
            ->andWhere('iwal.lineNumber = :lineNumber')
            ->setParameter('authorizationId', $authorizationId)
            ->setParameter('lineNumber', $lineNumber)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Calcule le total des lignes d'une autorisation
     */
    public function calculateTotalForAuthorization(int $authorizationId): float
    {
        $result = $this->createQueryBuilder('iwal')
            ->select('SUM(iwal.lineTotal)')
            ->where('iwal.authorization = :authorizationId')
            ->setParameter('authorizationId', $authorizationId)
            ->getQuery()
            ->getSingleScalarResult();

        return $result ? (float) $result : 0.0;
    }
}