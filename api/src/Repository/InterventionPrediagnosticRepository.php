<?php

namespace App\Repository;

use App\Entity\InterventionPrediagnostic;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionPrediagnostic>
 */
class InterventionPrediagnosticRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionPrediagnostic::class);
    }

    public function save(InterventionPrediagnostic $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InterventionPrediagnostic $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIntervention(int $interventionId): ?InterventionPrediagnostic
    {
        return $this->createQueryBuilder('ip')
            ->andWhere('ip.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findUrgent(): array
    {
        return $this->createQueryBuilder('ip')
            ->andWhere('ip.isUrgent = :urgent')
            ->setParameter('urgent', true)
            ->orderBy('ip.prediagnosticDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findRequiringQuote(): array
    {
        return $this->createQueryBuilder('ip')
            ->andWhere('ip.quoteRequired = :quoteRequired')
            ->setParameter('quoteRequired', true)
            ->orderBy('ip.prediagnosticDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findIncomplete(): array
    {
        return $this->createQueryBuilder('ip')
            ->andWhere('ip.problemDescription IS NULL OR ip.problemDescription = :empty')
            ->orWhere('ip.proposedSolution IS NULL OR ip.proposedSolution = :empty')
            ->orWhere('ip.estimatedCost IS NULL')
            ->setParameter('empty', '')
            ->orderBy('ip.prediagnosticDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findWithoutSignatures(): array
    {
        return $this->createQueryBuilder('ip')
            ->andWhere('ip.signatureExpert IS NULL OR ip.signatureExpert = :empty')
            ->orWhere('ip.signatureRepairer IS NULL OR ip.signatureRepairer = :empty')
            ->orWhere('ip.signatureInsured IS NULL OR ip.signatureInsured = :empty')
            ->setParameter('empty', '')
            ->orderBy('ip.prediagnosticDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByDateRange(\DateTimeInterface $startDate, \DateTimeInterface $endDate): array
    {
        return $this->createQueryBuilder('ip')
            ->andWhere('ip.prediagnosticDate BETWEEN :startDate AND :endDate')
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('ip.prediagnosticDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('ip')
            ->select([
                'COUNT(ip.id) as total',
                'SUM(CASE WHEN ip.isUrgent = true THEN 1 ELSE 0 END) as urgent',
                'SUM(CASE WHEN ip.quoteRequired = true THEN 1 ELSE 0 END) as requiringQuote',
                'AVG(ip.estimatedCost) as avgEstimatedCost',
                'AVG(ip.estimatedDurationDays) as avgDuration'
            ]);

        return $qb->getQuery()->getSingleResult();
    }
}
