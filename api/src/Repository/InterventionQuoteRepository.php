<?php

namespace App\Repository;

use App\Entity\InterventionQuote;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionQuote>
 */
class InterventionQuoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionQuote::class);
    }

    /**
     * Trouve tous les devis pour un tenant donné
     */
    public function findByTenant(Tenant $tenant): array
    {
        return $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('q.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les devis par statut d'approbation
     */
    public function findByApprovalStatus(Tenant $tenant, bool $isApproved): array
    {
        return $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('q.isApproved = :isApproved')
            ->setParameter('tenant', $tenant)
            ->setParameter('isApproved', $isApproved)
            ->orderBy('q.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les devis expirés
     */
    public function findExpiredQuotes(Tenant $tenant): array
    {
        return $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('q.validUntil < :now')
            ->andWhere('q.isApproved = false')
            ->setParameter('tenant', $tenant)
            ->setParameter('now', new \DateTime())
            ->orderBy('q.validUntil', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les devis par intervention
     */
    public function findByIntervention(int $interventionId): array
    {
        return $this->createQueryBuilder('q')
            ->where('q.intervention = :intervention')
            ->setParameter('intervention', $interventionId)
            ->orderBy('q.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les devis par période
     */
    public function findByDateRange(Tenant $tenant, \DateTime $startDate, \DateTime $endDate): array
    {
        return $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('q.quoteDate >= :startDate')
            ->andWhere('q.quoteDate <= :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('q.quoteDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les devis par montant
     */
    public function findByAmountRange(Tenant $tenant, float $minAmount, float $maxAmount): array
    {
        return $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('q.totalAmount >= :minAmount')
            ->andWhere('q.totalAmount <= :maxAmount')
            ->setParameter('tenant', $tenant)
            ->setParameter('minAmount', $minAmount)
            ->setParameter('maxAmount', $maxAmount)
            ->orderBy('q.totalAmount', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Statistiques des devis
     */
    public function getStatistics(Tenant $tenant): array
    {
        $qb = $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        // Total des devis
        $totalQuotes = $qb->select('COUNT(q.id)')
            ->getQuery()
            ->getSingleScalarResult();

        // Devis approuvés
        $approvedQuotes = $qb->select('COUNT(q.id)')
            ->andWhere('q.isApproved = true')
            ->getQuery()
            ->getSingleScalarResult();

        // Devis en attente
        $pendingQuotes = $qb->select('COUNT(q.id)')
            ->andWhere('q.isApproved = false')
            ->getQuery()
            ->getSingleScalarResult();

        // Devis expirés
        $expiredQuotes = $qb->select('COUNT(q.id)')
            ->andWhere('q.validUntil < :now')
            ->andWhere('q.isApproved = false')
            ->setParameter('now', new \DateTime())
            ->getQuery()
            ->getSingleScalarResult();

        // Montant total des devis
        $totalAmount = $qb->select('SUM(q.totalAmount)')
            ->getQuery()
            ->getSingleScalarResult();

        // Montant total des devis approuvés
        $approvedAmount = $qb->select('SUM(q.totalAmount)')
            ->andWhere('q.isApproved = true')
            ->getQuery()
            ->getSingleScalarResult();

        return [
            'totalQuotes' => (int) $totalQuotes,
            'approvedQuotes' => (int) $approvedQuotes,
            'pendingQuotes' => (int) $pendingQuotes,
            'expiredQuotes' => (int) $expiredQuotes,
            'totalAmount' => (float) $totalAmount,
            'approvedAmount' => (float) $approvedAmount,
        ];
    }

    /**
     * Trouve les devis récents
     */
    public function findRecentQuotes(Tenant $tenant, int $limit = 10): array
    {
        return $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('q.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve le prochain numéro de devis disponible
     */
    public function findNextQuoteNumber(Tenant $tenant): string
    {
        $year = date('Y');
        $prefix = "DEV-{$year}-";

        $lastQuote = $this->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('q.quoteNumber LIKE :prefix')
            ->setParameter('tenant', $tenant)
            ->setParameter('prefix', $prefix . '%')
            ->orderBy('q.quoteNumber', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if (!$lastQuote) {
            return $prefix . '0001';
        }

        $lastNumber = (int) substr($lastQuote->getQuoteNumber(), -4);
        $nextNumber = $lastNumber + 1;

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}