<?php

namespace App\Repository;

use App\Entity\InterventionInvoice;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionInvoice>
 */
class InterventionInvoiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionInvoice::class);
    }

    public function save(InterventionInvoice $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InterventionInvoice $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIntervention(int $interventionId): ?InterventionInvoice
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByPaymentStatus(string $paymentStatus): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.paymentStatus = :paymentStatus')
            ->setParameter('paymentStatus', $paymentStatus)
            ->orderBy('ii.invoiceDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPaid(): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.paymentStatus = :paid')
            ->setParameter('paid', 'paid')
            ->orderBy('ii.paidAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPending(): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.paymentStatus = :pending')
            ->setParameter('pending', 'pending')
            ->orderBy('ii.invoiceDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOverdue(): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.paymentStatus = :overdue')
            ->setParameter('overdue', 'overdue')
            ->orderBy('ii.dueDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findCancelled(): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.paymentStatus = :cancelled')
            ->setParameter('cancelled', 'cancelled')
            ->orderBy('ii.invoiceDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOverdueInvoices(): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.dueDate < :now')
            ->andWhere('ii.paymentStatus IN (:statuses)')
            ->setParameter('now', new \DateTime())
            ->setParameter('statuses', ['pending', 'overdue'])
            ->orderBy('ii.dueDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findDueSoon(int $days = 7): array
    {
        $date = new \DateTime();
        $date->add(new \DateInterval('P' . $days . 'D'));

        return $this->createQueryBuilder('ii')
            ->andWhere('ii.dueDate <= :date')
            ->andWhere('ii.dueDate > :now')
            ->andWhere('ii.paymentStatus = :pending')
            ->setParameter('date', $date)
            ->setParameter('now', new \DateTime())
            ->setParameter('pending', 'pending')
            ->orderBy('ii.dueDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByDateRange(\DateTimeInterface $startDate, \DateTimeInterface $endDate): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.invoiceDate BETWEEN :startDate AND :endDate')
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('ii.invoiceDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByAmountRange(float $minAmount, float $maxAmount): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.totalAmount BETWEEN :minAmount AND :maxAmount')
            ->setParameter('minAmount', $minAmount)
            ->setParameter('maxAmount', $maxAmount)
            ->orderBy('ii.totalAmount', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByPaymentMethod(string $paymentMethod): array
    {
        return $this->createQueryBuilder('ii')
            ->andWhere('ii.paymentMethod = :paymentMethod')
            ->setParameter('paymentMethod', $paymentMethod)
            ->orderBy('ii.paidAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getStatistics(): array
    {
        $qb = $this->createQueryBuilder('ii')
            ->select([
                'COUNT(ii.id) as total',
                'SUM(CASE WHEN ii.paymentStatus = :paid THEN 1 ELSE 0 END) as paid',
                'SUM(CASE WHEN ii.paymentStatus = :pending THEN 1 ELSE 0 END) as pending',
                'SUM(CASE WHEN ii.paymentStatus = :overdue THEN 1 ELSE 0 END) as overdue',
                'SUM(CASE WHEN ii.paymentStatus = :cancelled THEN 1 ELSE 0 END) as cancelled',
                'SUM(ii.totalAmount) as totalAmount',
                'SUM(CASE WHEN ii.paymentStatus = :paid THEN ii.totalAmount ELSE 0 END) as paidAmount',
                'SUM(CASE WHEN ii.paymentStatus IN (:pending, :overdue) THEN ii.totalAmount ELSE 0 END) as pendingAmount',
                'AVG(ii.totalAmount) as avgAmount'
            ])
            ->setParameter('paid', 'paid')
            ->setParameter('pending', 'pending')
            ->setParameter('overdue', 'overdue')
            ->setParameter('cancelled', 'cancelled');

        return $qb->getQuery()->getSingleResult();
    }
}
