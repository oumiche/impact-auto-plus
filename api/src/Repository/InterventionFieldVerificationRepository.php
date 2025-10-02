<?php

namespace App\Repository;

use App\Entity\InterventionFieldVerification;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionFieldVerification>
 */
class InterventionFieldVerificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionFieldVerification::class);
    }

    public function save(InterventionFieldVerification $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InterventionFieldVerification $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIntervention(int $interventionId): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->orderBy('ifv.verificationDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByVerificationType(string $verificationType): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.verificationType = :verificationType')
            ->setParameter('verificationType', $verificationType)
            ->orderBy('ifv.verificationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findSatisfactory(): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.isSatisfactory = :satisfactory')
            ->setParameter('satisfactory', true)
            ->orderBy('ifv.verificationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findUnsatisfactory(): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.isSatisfactory = :satisfactory')
            ->setParameter('satisfactory', false)
            ->orderBy('ifv.verificationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPending(): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.isSatisfactory IS NULL')
            ->orderBy('ifv.verificationDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findWithPhotos(): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.photosTaken > :zero')
            ->setParameter('zero', 0)
            ->orderBy('ifv.photosTaken', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByVerifiedBy(int $verifiedBy): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.verifiedBy = :verifiedBy')
            ->setParameter('verifiedBy', $verifiedBy)
            ->orderBy('ifv.verificationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByDateRange(\DateTimeInterface $startDate, \DateTimeInterface $endDate): array
    {
        return $this->createQueryBuilder('ifv')
            ->andWhere('ifv.verificationDate BETWEEN :startDate AND :endDate')
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('ifv.verificationDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('ifv')
            ->select([
                'COUNT(ifv.id) as total',
                'SUM(CASE WHEN ifv.isSatisfactory = true THEN 1 ELSE 0 END) as satisfactory',
                'SUM(CASE WHEN ifv.isSatisfactory = false THEN 1 ELSE 0 END) as unsatisfactory',
                'SUM(CASE WHEN ifv.isSatisfactory IS NULL THEN 1 ELSE 0 END) as pending',
                'AVG(ifv.photosTaken) as avgPhotos',
                'SUM(ifv.photosTaken) as totalPhotos'
            ]);

        return $qb->getQuery()->getSingleResult();
    }
}
