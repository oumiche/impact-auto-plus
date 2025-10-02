<?php

namespace App\Controller;

use App\Trait\TenantAwareTrait;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/tenant-test')]
#[IsGranted('ROLE_USER')]
class TenantTestController extends AbstractController
{
    use TenantAwareTrait;

    public function __construct(
        \App\Service\TenantAccessService $tenantAccessService,
        \App\Service\TenantContextService $tenantContextService
    ) {
        $this->tenantAccessService = $tenantAccessService;
        $this->tenantContextService = $tenantContextService;
    }

    /**
     * Test du contexte tenant
     */
    #[Route('/context', name: 'tenant_test_context', methods: ['GET'])]
    public function testContext(): JsonResponse
    {
        return $this->json([
            'success' => true,
            'context' => $this->getContext(),
            'debug_info' => $this->getDebugInfo()
        ]);
    }

    /**
     * Test des permissions
     */
    #[Route('/permissions', name: 'tenant_test_permissions', methods: ['GET'])]
    public function testPermissions(): JsonResponse
    {
        $contextError = $this->validateTenantContext();
        if ($contextError) {
            return $contextError;
        }

        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        return $this->json([
            'success' => true,
            'user_id' => $user->getId(),
            'tenant_id' => $tenant->getId(),
            'permissions' => [
                'is_super_admin' => $this->isSuperAdmin(),
                'is_tenant_admin' => $this->isTenantAdmin(),
                'can_create_vehicles' => $this->canCreate('vehicles'),
                'can_read_vehicles' => $this->canRead('vehicles'),
                'can_update_vehicles' => $this->canUpdate('vehicles'),
                'can_delete_vehicles' => $this->canDelete('vehicles'),
                'can_manage_users' => $this->canManageUsers(),
                'can_manage_settings' => $this->canManageSettings(),
            ],
            'all_permissions' => $this->tenantAccessService->getUserTenantPermissions($user, $tenant)
        ]);
    }

    /**
     * Test d'accès protégé
     */
    #[Route('/protected', name: 'tenant_test_protected', methods: ['GET'])]
    public function testProtected(): JsonResponse
    {
        $permissionError = $this->checkPermission('admin');
        if ($permissionError) {
            return $permissionError;
        }

        return $this->json([
            'success' => true,
            'message' => 'Accès autorisé - vous avez la permission admin'
        ]);
    }

    /**
     * Test de permission de ressource
     */
    #[Route('/resource-test', name: 'tenant_test_resource', methods: ['GET'])]
    public function testResourcePermission(): JsonResponse
    {
        $permissionError = $this->checkResourcePermission('create', 'vehicles');
        if ($permissionError) {
            return $permissionError;
        }

        return $this->json([
            'success' => true,
            'message' => 'Accès autorisé - vous pouvez créer des véhicules'
        ]);
    }

    /**
     * Test de tous les tenants accessibles
     */
    #[Route('/accessible-tenants', name: 'tenant_test_accessible', methods: ['GET'])]
    public function testAccessibleTenants(): JsonResponse
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->json(['error' => 'User not found'], 401);
        }

        $accessibleTenants = $this->tenantAccessService->getUserAccessibleTenants($user);

        return $this->json([
            'success' => true,
            'accessible_tenants' => array_map(function ($item) {
                return [
                    'tenant_id' => $item['tenant']->getId(),
                    'tenant_name' => $item['tenant']->getName(),
                    'permissions' => $item['permissions'],
                    'is_primary' => $item['is_primary']
                ];
            }, $accessibleTenants)
        ]);
    }

    /**
     * Test du tenant principal
     */
    #[Route('/primary-tenant', name: 'tenant_test_primary', methods: ['GET'])]
    public function testPrimaryTenant(): JsonResponse
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->json(['error' => 'User not found'], 401);
        }

        $primaryTenant = $this->tenantAccessService->getUserPrimaryTenant($user);

        return $this->json([
            'success' => true,
            'primary_tenant' => $primaryTenant ? [
                'id' => $primaryTenant->getId(),
                'name' => $primaryTenant->getName(),
                'slug' => $primaryTenant->getSlug()
            ] : null
        ]);
    }
}
