<?php

namespace App\Repository;

use App\Entity\InterventionInvoice;
use App\Entity\Tenant;
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

    /**
     * Trouve une facture par ID et tenant
     */
    public function findByIdAndTenant(int $id, ?Tenant $tenant): ?InterventionInvoice
    {
        if (!$tenant) {
            return null;
        }

        return $this->createQueryBuilder('i')
            ->innerJoin('i.intervention', 'vi')
            ->where('i.id = :id')
            ->andWhere('vi.tenant = :tenant')
            ->setParameter('id', $id)
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve les factures par tenant avec filtres
     */
    public function findByTenantWithFilters(
        ?Tenant $tenant,
        int $page = 1,
        int $limit = 10,
        string $search = '',
        string $status = '',
        string $sortBy = 'invoiceDate',
        string $sortOrder = 'DESC'
    ): array {
        if (!$tenant) {
            return [];
        }

        $qb = $this->createQueryBuilder('i')
            ->innerJoin('i.intervention', 'vi')
            ->innerJoin('vi.vehicle', 'v')
            ->leftJoin('v.brand', 'b')
            ->leftJoin('v.model', 'm')
            ->leftJoin('i.quote', 'q')
            ->where('vi.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        // Filtre de recherche
        if (!empty($search)) {
            $qb->andWhere('(
                i.invoiceNumber LIKE :search OR
                vi.interventionNumber LIKE :search OR
                vi.title LIKE :search OR
                v.plateNumber LIKE :search OR
                b.name LIKE :search OR
                m.name LIKE :search
            )')
            ->setParameter('search', '%' . $search . '%');
        }

        // Filtre par statut de paiement
        if (!empty($status)) {
            $qb->andWhere('i.paymentStatus = :status')
               ->setParameter('status', $status);
        }

        // Tri
        $allowedSortFields = ['invoiceDate', 'dueDate', 'totalAmount', 'paymentStatus', 'invoiceNumber'];
        if (in_array($sortBy, $allowedSortFields)) {
            $qb->orderBy('i.' . $sortBy, $sortOrder);
        } else {
            $qb->orderBy('i.invoiceDate', 'DESC');
        }

        // Pagination
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset)
           ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
    }

    /**
     * Compte les factures par tenant avec filtres
     */
    public function countByTenantWithFilters(
        ?Tenant $tenant,
        string $search = '',
        string $status = ''
    ): int {
        if (!$tenant) {
            return 0;
        }

        $qb = $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->innerJoin('i.intervention', 'vi')
            ->innerJoin('vi.vehicle', 'v')
            ->leftJoin('v.brand', 'b')
            ->leftJoin('v.model', 'm')
            ->where('vi.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        // Filtre de recherche
        if (!empty($search)) {
            $qb->andWhere('(
                i.invoiceNumber LIKE :search OR
                vi.interventionNumber LIKE :search OR
                vi.title LIKE :search OR
                v.plateNumber LIKE :search OR
                b.name LIKE :search OR
                m.name LIKE :search
            )')
            ->setParameter('search', '%' . $search . '%');
        }

        // Filtre par statut de paiement
        if (!empty($status)) {
            $qb->andWhere('i.paymentStatus = :status')
               ->setParameter('status', $status);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * Trouve les factures en retard de paiement
     */
    public function findOverdueInvoices(?Tenant $tenant): array
    {
        if (!$tenant) {
            return [];
        }

        return $this->createQueryBuilder('i')
            ->innerJoin('i.intervention', 'vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('i.paymentStatus = :status')
            ->andWhere('i.dueDate < :today')
            ->setParameter('tenant', $tenant)
            ->setParameter('status', 'pending')
            ->setParameter('today', new \DateTime())
            ->orderBy('i.dueDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les factures par période
     */
    public function findByDateRange(?Tenant $tenant, \DateTime $startDate, \DateTime $endDate): array
    {
        if (!$tenant) {
            return [];
        }

        return $this->createQueryBuilder('i')
            ->innerJoin('i.intervention', 'vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('i.invoiceDate >= :startDate')
            ->andWhere('i.invoiceDate <= :endDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('i.invoiceDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Calcule le total des factures par statut
     */
    public function getTotalByStatus(?Tenant $tenant, string $status): float
    {
        if (!$tenant) {
            return 0.0;
        }

        $result = $this->createQueryBuilder('i')
            ->select('SUM(i.totalAmount)')
            ->innerJoin('i.intervention', 'vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('i.paymentStatus = :status')
            ->setParameter('tenant', $tenant)
            ->setParameter('status', $status)
            ->getQuery()
            ->getSingleScalarResult();

        return (float) ($result ?? 0);
    }

    /**
     * Trouve les factures par intervention
     */
    public function findByIntervention(int $interventionId): array
    {
        return $this->createQueryBuilder('i')
            ->where('i.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->orderBy('i.invoiceDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve la dernière facture par numéro
     */
    public function findLastInvoiceByNumber(string $numberPrefix): ?InterventionInvoice
    {
        return $this->createQueryBuilder('i')
            ->where('i.invoiceNumber LIKE :prefix')
            ->setParameter('prefix', $numberPrefix . '%')
            ->orderBy('i.invoiceNumber', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}