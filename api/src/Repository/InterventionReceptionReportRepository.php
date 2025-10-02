<?php

namespace App\Repository;

use App\Entity\InterventionReceptionReport;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionReceptionReport>
 */
class InterventionReceptionReportRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionReceptionReport::class);
    }

    public function save(InterventionReceptionReport $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InterventionReceptionReport $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIntervention(int $interventionId): ?InterventionReceptionReport
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findBySatisfaction(string $satisfaction): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.customerSatisfaction = :satisfaction')
            ->setParameter('satisfaction', $satisfaction)
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findSatisfactory(): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.customerSatisfaction IN (:satisfactory)')
            ->setParameter('satisfactory', ['excellent', 'good'])
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findUnsatisfactory(): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.customerSatisfaction IN (:unsatisfactory)')
            ->setParameter('unsatisfactory', ['fair', 'poor'])
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findWithRemainingIssues(): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.remainingIssues IS NOT NULL')
            ->andWhere('irr.remainingIssues != :empty')
            ->setParameter('empty', '')
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findNotReady(): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.isVehicleReady = :ready')
            ->setParameter('ready', false)
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findRequiringFollowUp(): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.customerSatisfaction = :poor OR irr.isVehicleReady = :ready OR irr.remainingIssues IS NOT NULL')
            ->setParameter('poor', 'poor')
            ->setParameter('ready', false)
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByReceivedBy(int $receivedBy): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.receivedBy = :receivedBy')
            ->setParameter('receivedBy', $receivedBy)
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByDateRange(\DateTimeInterface $startDate, \DateTimeInterface $endDate): array
    {
        return $this->createQueryBuilder('irr')
            ->andWhere('irr.receptionDate BETWEEN :startDate AND :endDate')
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('irr.receptionDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('irr')
            ->select([
                'COUNT(irr.id) as total',
                'SUM(CASE WHEN irr.customerSatisfaction = :excellent THEN 1 ELSE 0 END) as excellent',
                'SUM(CASE WHEN irr.customerSatisfaction = :good THEN 1 ELSE 0 END) as good',
                'SUM(CASE WHEN irr.customerSatisfaction = :fair THEN 1 ELSE 0 END) as fair',
                'SUM(CASE WHEN irr.customerSatisfaction = :poor THEN 1 ELSE 0 END) as poor',
                'SUM(CASE WHEN irr.isVehicleReady = true THEN 1 ELSE 0 END) as ready',
                'SUM(CASE WHEN irr.remainingIssues IS NOT NULL AND irr.remainingIssues != :empty THEN 1 ELSE 0 END) as withIssues',
                'AVG(CASE irr.customerSatisfaction WHEN :excellent THEN 5 WHEN :good THEN 4 WHEN :fair THEN 3 WHEN :poor THEN 2 END) as avgScore'
            ])
            ->setParameter('excellent', 'excellent')
            ->setParameter('good', 'good')
            ->setParameter('fair', 'fair')
            ->setParameter('poor', 'poor')
            ->setParameter('empty', '');

        return $qb->getQuery()->getSingleResult();
    }
}
