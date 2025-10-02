<?php

namespace App\Repository;

use App\Entity\VehicleInsurance;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VehicleInsurance>
 */
class VehicleInsuranceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VehicleInsurance::class);
    }

    public function findByTenant(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('vi')
            ->where('vi.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('vi.endDate', 'DESC');

        if (isset($filters['status'])) {
            $qb->andWhere('vi.status = :status')
               ->setParameter('status', $filters['status']);
        }

        if (isset($filters['coverage_type'])) {
            $qb->andWhere('vi.coverageType = :coverageType')
               ->setParameter('coverageType', $filters['coverage_type']);
        }

        if (isset($filters['vehicle_id'])) {
            $qb->andWhere('vi.vehicle = :vehicle')
               ->setParameter('vehicle', $filters['vehicle_id']);
        }

        if (isset($filters['company'])) {
            $qb->andWhere('vi.insuranceCompany LIKE :company')
               ->setParameter('company', '%' . $filters['company'] . '%');
        }

        return $qb->getQuery()->getResult();
    }

    public function findActiveInsurances(Tenant $tenant): array
    {
        return $this->createQueryBuilder('vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('vi.status = :status')
            ->andWhere('vi.endDate > :today')
            ->setParameter('tenant', $tenant)
            ->setParameter('status', 'active')
            ->setParameter('today', new \DateTime())
            ->orderBy('vi.endDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findExpiringInsurances(Tenant $tenant, int $days = 30): array
    {
        $dateFrom = new \DateTime();
        $dateTo = (new \DateTime())->modify("+{$days} days");

        return $this->createQueryBuilder('vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('vi.status = :status')
            ->andWhere('vi.endDate BETWEEN :dateFrom AND :dateTo')
            ->setParameter('tenant', $tenant)
            ->setParameter('status', 'active')
            ->setParameter('dateFrom', $dateFrom)
            ->setParameter('dateTo', $dateTo)
            ->orderBy('vi.endDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findExpiredInsurances(Tenant $tenant): array
    {
        return $this->createQueryBuilder('vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('vi.endDate < :today')
            ->setParameter('tenant', $tenant)
            ->setParameter('today', new \DateTime())
            ->orderBy('vi.endDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getInsuranceStatistics(Tenant $tenant): array
    {
        $qb = $this->createQueryBuilder('vi')
            ->select([
                'COUNT(vi.id) as total',
                'SUM(CASE WHEN vi.status = :active THEN 1 ELSE 0 END) as active',
                'SUM(CASE WHEN vi.status = :expired THEN 1 ELSE 0 END) as expired',
                'SUM(CASE WHEN vi.status = :cancelled THEN 1 ELSE 0 END) as cancelled',
                'SUM(CASE WHEN vi.status = :pendingRenewal THEN 1 ELSE 0 END) as pendingRenewal',
                'SUM(CASE WHEN vi.coverageType = :comprehensive THEN 1 ELSE 0 END) as comprehensive',
                'SUM(CASE WHEN vi.coverageType = :thirdParty THEN 1 ELSE 0 END) as thirdParty',
                'AVG(vi.premiumAmount) as avgPremium',
                'SUM(vi.premiumAmount) as totalPremium'
            ])
            ->where('vi.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', 'active')
            ->setParameter('expired', 'expired')
            ->setParameter('cancelled', 'cancelled')
            ->setParameter('pendingRenewal', 'pending_renewal')
            ->setParameter('comprehensive', 'comprehensive')
            ->setParameter('thirdParty', 'third_party');

        $result = $qb->getQuery()->getSingleResult();

        return [
            'total' => (int) $result['total'],
            'active' => (int) $result['active'],
            'expired' => (int) $result['expired'],
            'cancelled' => (int) $result['cancelled'],
            'pendingRenewal' => (int) $result['pendingRenewal'],
            'comprehensive' => (int) $result['comprehensive'],
            'thirdParty' => (int) $result['thirdParty'],
            'avgPremium' => $result['avgPremium'] ? (float) $result['avgPremium'] : 0,
            'totalPremium' => $result['totalPremium'] ? (float) $result['totalPremium'] : 0
        ];
    }

    public function findInsuranceByVehicle(Tenant $tenant, int $vehicleId): array
    {
        return $this->createQueryBuilder('vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('vi.vehicle = :vehicle')
            ->setParameter('tenant', $tenant)
            ->setParameter('vehicle', $vehicleId)
            ->orderBy('vi.endDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findCurrentInsurance(Tenant $tenant, int $vehicleId): ?VehicleInsurance
    {
        return $this->createQueryBuilder('vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('vi.vehicle = :vehicle')
            ->andWhere('vi.status = :status')
            ->andWhere('vi.endDate > :today')
            ->setParameter('tenant', $tenant)
            ->setParameter('vehicle', $vehicleId)
            ->setParameter('status', 'active')
            ->setParameter('today', new \DateTime())
            ->orderBy('vi.endDate', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
