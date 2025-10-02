<?php

namespace App\Repository;

use App\Entity\UserTenantPermission;
use App\Entity\User;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserTenantPermission>
 *
 * @method UserTenantPermission|null find($id, $lockMode = null, $lockVersion = null)
 * @method UserTenantPermission|null findOneBy(array $criteria, array $orderBy = null)
 * @method UserTenantPermission[]    findAll()
 * @method UserTenantPermission[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class UserTenantPermissionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserTenantPermission::class);
    }

    /**
     * Trouve les permissions d'un utilisateur pour un tenant spécifique
     */
    public function findByUserAndTenant(User $user, Tenant $tenant): array
    {
        return $this->createQueryBuilder('utp')
            ->andWhere('utp.user = :user')
            ->andWhere('utp.tenant = :tenant')
            ->andWhere('utp.isActive = :active')
            ->setParameter('user', $user)
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('utp.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve toutes les permissions d'un utilisateur
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('utp')
            ->andWhere('utp.user = :user')
            ->andWhere('utp.isActive = :active')
            ->setParameter('user', $user)
            ->setParameter('active', true)
            ->orderBy('utp.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve toutes les permissions d'un tenant
     */
    public function findByTenant(Tenant $tenant): array
    {
        return $this->createQueryBuilder('utp')
            ->andWhere('utp.tenant = :tenant')
            ->andWhere('utp.isActive = :active')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('utp.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les utilisateurs ayant une permission spécifique sur un tenant
     */
    public function findUsersWithPermission(Tenant $tenant, string $permission): array
    {
        return $this->createQueryBuilder('utp')
            ->andWhere('utp.tenant = :tenant')
            ->andWhere('utp.isActive = :active')
            ->andWhere('JSON_CONTAINS(utp.permissions, :permission) = 1')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->setParameter('permission', json_encode($permission))
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les permissions actives d'un utilisateur pour un tenant
     */
    public function findActivePermissions(User $user, Tenant $tenant): ?UserTenantPermission
    {
        return $this->createQueryBuilder('utp')
            ->andWhere('utp.user = :user')
            ->andWhere('utp.tenant = :tenant')
            ->andWhere('utp.isActive = :active')
            ->setParameter('user', $user)
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->orderBy('utp.assignedAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve les tenants où un utilisateur a des permissions
     */
    public function findTenantsForUser(User $user): array
    {
        return $this->createQueryBuilder('utp')
            ->select('t')
            ->join('utp.tenant', 't')
            ->andWhere('utp.user = :user')
            ->andWhere('utp.isActive = :active')
            ->setParameter('user', $user)
            ->setParameter('active', true)
            ->orderBy('utp.assignedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Désactive toutes les permissions d'un utilisateur pour un tenant
     */
    public function deactivateUserTenantPermissions(User $user, Tenant $tenant): int
    {
        return $this->createQueryBuilder('utp')
            ->update()
            ->set('utp.isActive', ':inactive')
            ->set('utp.updatedAt', ':now')
            ->andWhere('utp.user = :user')
            ->andWhere('utp.tenant = :tenant')
            ->setParameter('user', $user)
            ->setParameter('tenant', $tenant)
            ->setParameter('inactive', false)
            ->setParameter('now', new \DateTime())
            ->getQuery()
            ->execute();
    }

    /**
     * Trouve les permissions expirées ou inactives
     */
    public function findInactivePermissions(): array
    {
        return $this->createQueryBuilder('utp')
            ->andWhere('utp.isActive = :inactive')
            ->setParameter('inactive', false)
            ->orderBy('utp.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    //    /**
    //     * @return UserTenantPermission[] Returns an array of UserTenantPermission objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('u.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?UserTenantPermission
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
