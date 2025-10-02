<?php

namespace App\Repository;

use App\Entity\Collaborateur;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Collaborateur>
 */
class CollaborateurRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Collaborateur::class);
    }

    public function findByTenant(Tenant $tenant, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('c')
            ->join('c.collaborateurTenants', 'ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.isActive = :active')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('c.lastName', 'ASC');

        if (isset($filters['department'])) {
            $qb->andWhere('c.department = :department')
               ->setParameter('department', $filters['department']);
        }

        if (isset($filters['position'])) {
            $qb->andWhere('c.position = :position')
               ->setParameter('position', $filters['position']);
        }

        if (isset($filters['specialization'])) {
            $qb->andWhere('c.specialization = :specialization')
               ->setParameter('specialization', $filters['specialization']);
        }

        if (isset($filters['is_active'])) {
            $qb->andWhere('c.isActive = :isActive')
               ->setParameter('isActive', $filters['is_active']);
        }

        if (isset($filters['search'])) {
            $qb->andWhere('(c.firstName LIKE :search OR c.lastName LIKE :search OR c.email LIKE :search)')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }

        return $qb->getQuery()->getResult();
    }

    public function findActiveCollaborateurs(Tenant $tenant): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.collaborateurTenants', 'ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.isActive = :active')
            ->andWhere('c.isActive = :collaborateurActive')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->setParameter('collaborateurActive', true)
            ->orderBy('c.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBySpecialization(Tenant $tenant, string $specialization): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.collaborateurTenants', 'ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.isActive = :active')
            ->andWhere('c.specialization = :specialization')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->setParameter('specialization', $specialization)
            ->orderBy('c.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findWithExpiringLicenses(Tenant $tenant, int $days = 30): array
    {
        $dateFrom = new \DateTime();
        $dateTo = (new \DateTime())->modify("+{$days} days");

        return $this->createQueryBuilder('c')
            ->join('c.collaborateurTenants', 'ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.isActive = :active')
            ->andWhere('c.licenseExpiryDate BETWEEN :dateFrom AND :dateTo')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->setParameter('dateFrom', $dateFrom)
            ->setParameter('dateTo', $dateTo)
            ->orderBy('c.licenseExpiryDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getCollaborateurStatistics(Tenant $tenant): array
    {
        $qb = $this->createQueryBuilder('c')
            ->select([
                'COUNT(c.id) as total',
                'SUM(CASE WHEN c.isActive = :active THEN 1 ELSE 0 END) as active',
                'SUM(CASE WHEN c.isActive = :inactive THEN 1 ELSE 0 END) as inactive',
                'COUNT(DISTINCT c.department) as departments',
                'COUNT(DISTINCT c.specialization) as specializations',
                'AVG(c.experienceYears) as avgExperience'
            ])
            ->join('c.collaborateurTenants', 'ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.isActive = :tenantActive')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->setParameter('inactive', false)
            ->setParameter('tenantActive', true);

        $result = $qb->getQuery()->getSingleResult();

        return [
            'total' => (int) $result['total'],
            'active' => (int) $result['active'],
            'inactive' => (int) $result['inactive'],
            'departments' => (int) $result['departments'],
            'specializations' => (int) $result['specializations'],
            'avgExperience' => $result['avgExperience'] ? (float) $result['avgExperience'] : 0
        ];
    }

    public function findByDepartment(Tenant $tenant, string $department): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.collaborateurTenants', 'ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.isActive = :active')
            ->andWhere('c.department = :department')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->setParameter('department', $department)
            ->orderBy('c.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
