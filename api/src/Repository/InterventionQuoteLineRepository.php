<?php

namespace App\Repository;

use App\Entity\InterventionQuoteLine;
use App\Entity\InterventionQuote;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionQuoteLine>
 */
class InterventionQuoteLineRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionQuoteLine::class);
    }

    public function findByQuote(InterventionQuote $quote): array
    {
        return $this->createQueryBuilder('ql')
            ->where('ql.quote = :quote')
            ->setParameter('quote', $quote)
            ->orderBy('ql.lineNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBySupply(int $supplyId): array
    {
        return $this->createQueryBuilder('ql')
            ->where('ql.supply = :supply')
            ->setParameter('supply', $supplyId)
            ->orderBy('ql.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getQuoteTotal(InterventionQuote $quote): float
    {
        $result = $this->createQueryBuilder('ql')
            ->select('SUM(ql.lineTotal) as total')
            ->where('ql.quote = :quote')
            ->setParameter('quote', $quote)
            ->getQuery()
            ->getSingleScalarResult();

        return $result ? (float) $result : 0.0;
    }

    public function getQuoteStatistics(InterventionQuote $quote): array
    {
        $qb = $this->createQueryBuilder('ql')
            ->select([
                'COUNT(ql.id) as totalLines',
                'SUM(ql.quantity) as totalQuantity',
                'SUM(ql.lineTotal) as totalAmount',
                'AVG(ql.unitPrice) as avgUnitPrice',
                'SUM(ql.discountAmount) as totalDiscount',
                'SUM(ql.taxRate) as totalTax'
            ])
            ->where('ql.quote = :quote')
            ->setParameter('quote', $quote);

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
