<?php

namespace App\Service;

use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\UserTenantPermission;
use App\Repository\UserTenantPermissionRepository;

class TenantAccessService
{
    private UserTenantPermissionRepository $permissionRepository;

    public function __construct(UserTenantPermissionRepository $permissionRepository)
    {
        $this->permissionRepository = $permissionRepository;
    }

    /**
     * Vérifie si l'utilisateur peut accéder au tenant
     */
    public function canUserAccessTenant(User $user, Tenant $tenant): bool
    {
        // Vérifier si l'utilisateur est associé au tenant
        foreach ($user->getTenants() as $userTenant) {
            if ($userTenant->getId() === $tenant->getId()) {
                return true;
            }
        }

        // Vérifier les permissions spécifiques
        $permissions = $this->permissionRepository->findByUserAndTenant($user, $tenant);
        foreach ($permissions as $permission) {
            if ($permission->isActive()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Vérifie si l'utilisateur a une permission spécifique dans le tenant
     */
    public function hasPermission(User $user, Tenant $tenant, string $permission): bool
    {
        $userPermission = $this->permissionRepository->findOneBy([
            'user' => $user,
            'tenant' => $tenant,
            'isActive' => true
        ]);

        if (!$userPermission) {
            return false;
        }

        return $userPermission->hasPermission($permission) || $userPermission->hasPermission('all');
    }

    /**
     * Vérifie si l'utilisateur est administrateur du tenant
     */
    public function isTenantAdmin(User $user, Tenant $tenant): bool
    {
        return $this->hasPermission($user, $tenant, 'admin') || 
               $this->hasPermission($user, $tenant, 'tenant_admin');
    }

    /**
     * Vérifie si l'utilisateur est super administrateur
     */
    public function isSuperAdmin(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Récupère toutes les permissions de l'utilisateur pour le tenant
     */
    public function getUserTenantPermissions(User $user, Tenant $tenant): array
    {
        $userPermission = $this->permissionRepository->findOneBy([
            'user' => $user,
            'tenant' => $tenant,
            'isActive' => true
        ]);

        return $userPermission ? $userPermission->getPermissions() : [];
    }

    /**
     * Récupère tous les tenants accessibles par l'utilisateur
     */
    public function getUserAccessibleTenants(User $user): array
    {
        $tenants = [];

        // Tenants directs
        foreach ($user->getTenants() as $tenant) {
            $tenants[] = [
                'tenant' => $tenant,
                'permissions' => $this->getUserTenantPermissions($user, $tenant),
                'is_primary' => false // À implémenter selon la logique métier
            ];
        }

        // Tenants via permissions
        $permissions = $this->permissionRepository->findByUser($user);
        foreach ($permissions as $permission) {
            if ($permission->isActive() && $permission->getTenant()) {
                $tenant = $permission->getTenant();
                
                // Vérifier si le tenant n'est pas déjà dans la liste
                $alreadyExists = false;
                foreach ($tenants as $existing) {
                    if ($existing['tenant']->getId() === $tenant->getId()) {
                        $alreadyExists = true;
                        break;
                    }
                }

                if (!$alreadyExists) {
                    $tenants[] = [
                        'tenant' => $tenant,
                        'permissions' => $permission->getPermissions(),
                        'is_primary' => $permission->isPrimary()
                    ];
                }
            }
        }

        return $tenants;
    }

    /**
     * Récupère le tenant principal de l'utilisateur
     */
    public function getUserPrimaryTenant(User $user): ?Tenant
    {
        $permissions = $this->permissionRepository->findByUser($user);
        
        foreach ($permissions as $permission) {
            if ($permission->isActive() && $permission->isPrimary()) {
                return $permission->getTenant();
            }
        }

        // Si aucun tenant principal n'est défini, retourner le premier
        $firstTenant = $user->getTenants()->first();
        return $firstTenant;
    }

    /**
     * Vérifie si l'utilisateur peut créer des ressources dans le tenant
     */
    public function canCreate(User $user, Tenant $tenant, string $resourceType): bool
    {
        return $this->hasPermission($user, $tenant, 'create_' . $resourceType) ||
               $this->hasPermission($user, $tenant, 'create') ||
               $this->isTenantAdmin($user, $tenant);
    }

    /**
     * Vérifie si l'utilisateur peut lire des ressources dans le tenant
     */
    public function canRead(User $user, Tenant $tenant, string $resourceType): bool
    {
        return $this->hasPermission($user, $tenant, 'read_' . $resourceType) ||
               $this->hasPermission($user, $tenant, 'read') ||
               $this->isTenantAdmin($user, $tenant);
    }

    /**
     * Vérifie si l'utilisateur peut modifier des ressources dans le tenant
     */
    public function canUpdate(User $user, Tenant $tenant, string $resourceType): bool
    {
        return $this->hasPermission($user, $tenant, 'update_' . $resourceType) ||
               $this->hasPermission($user, $tenant, 'update') ||
               $this->isTenantAdmin($user, $tenant);
    }

    /**
     * Vérifie si l'utilisateur peut supprimer des ressources dans le tenant
     */
    public function canDelete(User $user, Tenant $tenant, string $resourceType): bool
    {
        return $this->hasPermission($user, $tenant, 'delete_' . $resourceType) ||
               $this->hasPermission($user, $tenant, 'delete') ||
               $this->isTenantAdmin($user, $tenant);
    }

    /**
     * Vérifie si l'utilisateur peut gérer les utilisateurs du tenant
     */
    public function canManageUsers(User $user, Tenant $tenant): bool
    {
        return $this->hasPermission($user, $tenant, 'manage_users') ||
               $this->hasPermission($user, $tenant, 'admin') ||
               $this->isSuperAdmin($user);
    }

    /**
     * Vérifie si l'utilisateur peut gérer les paramètres du tenant
     */
    public function canManageSettings(User $user, Tenant $tenant): bool
    {
        return $this->hasPermission($user, $tenant, 'manage_settings') ||
               $this->hasPermission($user, $tenant, 'admin') ||
               $this->isSuperAdmin($user);
    }

    /**
     * Récupère les permissions par défaut pour un nouveau tenant
     */
    public function getDefaultTenantPermissions(): array
    {
        return [
            'read',
            'create',
            'update',
            'delete'
        ];
    }

    /**
     * Récupère les permissions d'administrateur de tenant
     */
    public function getTenantAdminPermissions(): array
    {
        return [
            'admin',
            'manage_users',
            'manage_settings',
            'read',
            'create',
            'update',
            'delete'
        ];
    }

    /**
     * Récupère les permissions de super administrateur
     */
    public function getSuperAdminPermissions(): array
    {
        return [
            'super_admin',
            'admin',
            'manage_users',
            'manage_settings',
            'manage_tenants',
            'read',
            'create',
            'update',
            'delete'
        ];
    }
}
