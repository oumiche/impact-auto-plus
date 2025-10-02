<?php

namespace App\Repository;

use App\Entity\InterventionWorkAuthorization;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionWorkAuthorization>
 */
class InterventionWorkAuthorizationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionWorkAuthorization::class);
    }

    public function save(InterventionWorkAuthorization $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InterventionWorkAuthorization $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIntervention(int $interventionId): ?InterventionWorkAuthorization
    {
        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->orderBy('iwa.authorizationDate', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findUrgent(): array
    {
        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.isUrgent = :urgent')
            ->setParameter('urgent', true)
            ->orderBy('iwa.authorizationDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findValidated(): array
    {
        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.authorizationDate IS NOT NULL')
            ->orderBy('iwa.authorizationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPending(): array
    {
        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.authorizationDate IS NULL')
            ->orderBy('iwa.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findExpired(int $validityDays = 30): array
    {
        $date = new \DateTime();
        $date->sub(new \DateInterval('P' . $validityDays . 'D'));

        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.authorizationDate < :date')
            ->setParameter('date', $date)
            ->orderBy('iwa.authorizationDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByAuthorizedBy(int $authorizedBy): array
    {
        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.authorizedBy = :authorizedBy')
            ->setParameter('authorizedBy', $authorizedBy)
            ->orderBy('iwa.authorizationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByDateRange(\DateTimeInterface $startDate, \DateTimeInterface $endDate): array
    {
        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.authorizationDate BETWEEN :startDate AND :endDate')
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('iwa.authorizationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByBudgetRange(float $minAmount, float $maxAmount): array
    {
        return $this->createQueryBuilder('iwa')
            ->andWhere('iwa.maxAmount BETWEEN :minAmount AND :maxAmount')
            ->setParameter('minAmount', $minAmount)
            ->setParameter('maxAmount', $maxAmount)
            ->orderBy('iwa.maxAmount', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('iwa')
            ->select([
                'COUNT(iwa.id) as total',
                'SUM(CASE WHEN iwa.isUrgent = true THEN 1 ELSE 0 END) as urgent',
                'SUM(CASE WHEN iwa.authorizationDate IS NOT NULL THEN 1 ELSE 0 END) as validated',
                'SUM(CASE WHEN iwa.authorizationDate IS NULL THEN 1 ELSE 0 END) as pending',
                'AVG(iwa.maxAmount) as avgMaxAmount'
            ]);

        return $qb->getQuery()->getSingleResult();
    }
}
