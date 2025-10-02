<?php

namespace App\Repository;

use App\Entity\InterventionInvoiceLine;
use App\Entity\InterventionInvoice;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionInvoiceLine>
 */
class InterventionInvoiceLineRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionInvoiceLine::class);
    }

    public function findByInvoice(InterventionInvoice $invoice): array
    {
        return $this->createQueryBuilder('il')
            ->where('il.invoice = :invoice')
            ->setParameter('invoice', $invoice)
            ->orderBy('il.lineNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBySupply(int $supplyId): array
    {
        return $this->createQueryBuilder('il')
            ->where('il.supply = :supply')
            ->setParameter('supply', $supplyId)
            ->orderBy('il.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getInvoiceTotal(InterventionInvoice $invoice): float
    {
        $result = $this->createQueryBuilder('il')
            ->select('SUM(il.lineTotal) as total')
            ->where('il.invoice = :invoice')
            ->setParameter('invoice', $invoice)
            ->getQuery()
            ->getSingleScalarResult();

        return $result ? (float) $result : 0.0;
    }

    public function getInvoiceStatistics(InterventionInvoice $invoice): array
    {
        $qb = $this->createQueryBuilder('il')
            ->select([
                'COUNT(il.id) as totalLines',
                'SUM(il.quantity) as totalQuantity',
                'SUM(il.lineTotal) as totalAmount',
                'AVG(il.unitPrice) as avgUnitPrice',
                'SUM(il.discountAmount) as totalDiscount',
                'SUM(il.taxRate) as totalTax'
            ])
            ->where('il.invoice = :invoice')
            ->setParameter('invoice', $invoice);

        $result = $qb->getQuery()->getSingleResult();

        return [
            'totalLines' => (int) $result['totalLines'],
            'totalQuantity' => $result['totalQuantity'] ? (float) $result['totalQuantity'] : 0,
            'totalAmount' => $result['totalAmount'] ? (float) $result['totalAmount'] : 0,
            'avgUnitPrice' => $result['avgUnitPrice'] ? (float) $result['avgUnitPrice'] : 0,
            'totalDiscount' => $result['totalDiscount'] ? (float) $result['totalDiscount'] : 0,
            'totalTax' => $result['totalTax'] ? (float) $result['totalTax'] : 0
        ];
    }
}
