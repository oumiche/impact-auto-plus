<?php

namespace App\Repository;

use App\Entity\CollaborateurTenant;
use App\Entity\Tenant;
use App\Entity\Collaborateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CollaborateurTenant>
 */
class CollaborateurTenantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CollaborateurTenant::class);
    }

    public function findByTenant(Tenant $tenant): array
    {
        return $this->createQueryBuilder('ct')
            ->where('ct.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('ct.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByCollaborateur(Collaborateur $collaborateur): array
    {
        return $this->createQueryBuilder('ct')
            ->where('ct.collaborateur = :collaborateur')
            ->setParameter('collaborateur', $collaborateur)
            ->orderBy('ct.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findActiveByTenant(Tenant $tenant): array
    {
        return $this->createQueryBuilder('ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.isActive = :active')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('ct.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPrimaryByCollaborateur(Collaborateur $collaborateur): ?CollaborateurTenant
    {
        return $this->createQueryBuilder('ct')
            ->where('ct.collaborateur = :collaborateur')
            ->andWhere('ct.isPrimary = :primary')
            ->andWhere('ct.isActive = :active')
            ->setParameter('collaborateur', $collaborateur)
            ->setParameter('primary', true)
            ->setParameter('active', true)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByRole(Tenant $tenant, string $role): array
    {
        return $this->createQueryBuilder('ct')
            ->where('ct.tenant = :tenant')
            ->andWhere('ct.role = :role')
            ->andWhere('ct.isActive = :active')
            ->setParameter('tenant', $tenant)
            ->setParameter('role', $role)
            ->setParameter('active', true)
            ->orderBy('ct.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
