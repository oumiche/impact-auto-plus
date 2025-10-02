<?php

namespace App\Repository;

use App\Entity\InterventionWorkAuthorizationLine;
use App\Entity\InterventionWorkAuthorization;
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

    public function findByAuthorization(InterventionWorkAuthorization $authorization): array
    {
        return $this->createQueryBuilder('wal')
            ->where('wal.authorization = :authorization')
            ->setParameter('authorization', $authorization)
            ->orderBy('wal.lineNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBySupply(int $supplyId): array
    {
        return $this->createQueryBuilder('wal')
            ->where('wal.supply = :supply')
            ->setParameter('supply', $supplyId)
            ->orderBy('wal.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getAuthorizationTotal(InterventionWorkAuthorization $authorization): float
    {
        $result = $this->createQueryBuilder('wal')
            ->select('SUM(wal.lineTotal) as total')
            ->where('wal.authorization = :authorization')
            ->setParameter('authorization', $authorization)
            ->getQuery()
            ->getSingleScalarResult();

        return $result ? (float) $result : 0.0;
    }

    public function getAuthorizationStatistics(InterventionWorkAuthorization $authorization): array
    {
        $qb = $this->createQueryBuilder('wal')
            ->select([
                'COUNT(wal.id) as totalLines',
                'SUM(wal.quantity) as totalQuantity',
                'SUM(wal.lineTotal) as totalAmount',
                'AVG(wal.unitPrice) as avgUnitPrice',
                'SUM(wal.discountAmount) as totalDiscount',
                'SUM(wal.taxRate) as totalTax'
            ])
            ->where('wal.authorization = :authorization')
            ->setParameter('authorization', $authorization);

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
