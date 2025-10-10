<?php

namespace App\Repository;

use App\Entity\InterventionWorkAuthorization;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InterventionWorkAuthorization>
 */
class InterventionWorkAuthorizationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InterventionWorkAuthorization::class);
    }

    /**
     * Trouve toutes les autorisations de travail pour un tenant donné
     */
    public function findByTenant(Tenant $tenant): array
    {
        return $this->createQueryBuilder('iwa')
            ->join('iwa.intervention', 'vi')
            ->where('vi.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('iwa.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve une autorisation par ID et tenant
     */
    public function findByIdAndTenant(int $id, Tenant $tenant): ?InterventionWorkAuthorization
    {
        return $this->createQueryBuilder('iwa')
            ->join('iwa.intervention', 'vi')
            ->where('iwa.id = :id')
            ->andWhere('vi.tenant = :tenant')
            ->setParameter('id', $id)
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve les autorisations pour une intervention donnée
     */
    public function findByIntervention(int $interventionId): array
    {
        return $this->createQueryBuilder('iwa')
            ->where('iwa.intervention = :interventionId')
            ->setParameter('interventionId', $interventionId)
            ->orderBy('iwa.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }


    /**
     * Trouve les autorisations expirées
     */
    public function findExpiredByTenant(Tenant $tenant, int $validityDays = 30): array
    {
        $expiryDate = new \DateTime();
        $expiryDate->modify('-' . $validityDays . ' days');

        return $this->createQueryBuilder('iwa')
            ->join('iwa.intervention', 'vi')
            ->where('vi.tenant = :tenant')
            ->andWhere('iwa.authorizationDate < :expiryDate')
            ->setParameter('tenant', $tenant)
            ->setParameter('expiryDate', $expiryDate)
            ->orderBy('iwa.authorizationDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Compte les autorisations par statut pour un tenant
     */
    public function countByStatusForTenant(Tenant $tenant): array
    {
        $total = $this->createQueryBuilder('iwa')
            ->select('COUNT(iwa.id)')
            ->join('iwa.intervention', 'vi')
            ->where('vi.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getSingleScalarResult();

        $expired = $this->findExpiredByTenant($tenant);
        $expiredCount = count($expired);

        return [
            'total' => $total,
            'expired' => $expiredCount,
            'active' => $total - $expiredCount
        ];
    }
}