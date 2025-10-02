<?php

namespace App\Service;

use App\Entity\Tenant;
use App\Repository\TenantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\User\UserInterface;

class TenantService
{
    private EntityManagerInterface $entityManager;
    private TenantRepository $tenantRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        TenantRepository $tenantRepository
    ) {
        $this->entityManager = $entityManager;
        $this->tenantRepository = $tenantRepository;
    }

    /**
     * Récupérer le tenant courant de l'utilisateur connecté
     */
    public function getCurrentTenant(Request $request, UserInterface $user): ?Tenant
    {
        try {
            // Récupérer le tenant depuis la requête ou les headers
            $tenantId = $request->query->get('tenant_id') ?? $request->headers->get('X-Tenant-ID');
            
            if ($tenantId) {
                $tenant = $this->tenantRepository->find($tenantId);
                if (!$tenant) {
                    return null;
                }
                
                // Vérifier que l'utilisateur a accès à ce tenant
                if (!$this->hasUserAccessToTenant($user, $tenant)) {
                    return null;
                }
                
                return $tenant;
            } else {
                // Utiliser le premier tenant disponible pour l'utilisateur
                $userTenants = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                    ->findBy(['user' => $user, 'isActive' => true], ['id' => 'ASC'], 1);
                
                if (empty($userTenants)) {
                    return null;
                }
                
                return $userTenants[0]->getTenant();
            }
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Vérifier si l'utilisateur a accès à un tenant spécifique
     */
    public function hasUserAccessToTenant(UserInterface $user, Tenant $tenant): bool
    {
        try {
            $userTenant = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                ->findOneBy(['user' => $user, 'tenant' => $tenant, 'isActive' => true]);
            
            return $userTenant !== null;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Récupérer tous les tenants accessibles par l'utilisateur
     */
    public function getUserTenants(UserInterface $user): array
    {
        try {
            $userTenants = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                ->findBy(['user' => $user, 'isActive' => true]);

            return array_map(function($userTenant) {
                $tenant = $userTenant->getTenant();
                return [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'is_primary' => $userTenant->isPrimary(),
                    'permissions' => $userTenant->getPermissions(),
                    'assigned_at' => $userTenant->getAssignedAt()->format('Y-m-d H:i:s'),
                    'is_active' => $userTenant->isActive()
                ];
            }, $userTenants);
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Récupérer le tenant principal de l'utilisateur
     */
    public function getPrimaryTenant(UserInterface $user): ?Tenant
    {
        try {
            $userTenant = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                ->findOneBy(['user' => $user, 'isActive' => true, 'isPrimary' => true]);
            
            return $userTenant ? $userTenant->getTenant() : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Valider qu'un garage appartient au tenant courant
     */
    public function validateGarageOwnership($garage, Tenant $currentTenant): bool
    {
        if (!$garage || !$garage->getTenant()) {
            return false;
        }
        
        return $garage->getTenant()->getId() === $currentTenant->getId();
    }

    /**
     * Valider qu'une entité appartient au tenant courant
     */
    public function validateEntityOwnership($entity, Tenant $currentTenant, string $tenantProperty = 'tenant'): bool
    {
        if (!$entity) {
            return false;
        }
        
        $getter = 'get' . ucfirst($tenantProperty);
        if (!method_exists($entity, $getter)) {
            return false;
        }
        
        $entityTenant = $entity->$getter();
        if (!$entityTenant) {
            return false;
        }
        
        return $entityTenant->getId() === $currentTenant->getId();
    }

    /**
     * Créer une réponse d'erreur pour un tenant non accessible
     */
    public function createTenantAccessErrorResponse(): array
    {
        return [
            'success' => false,
            'message' => 'Aucun tenant accessible trouvé',
            'code' => 403
        ];
    }

    /**
     * Créer une réponse d'erreur pour un accès non autorisé à une entité
     */
    public function createEntityAccessErrorResponse(): array
    {
        return [
            'success' => false,
            'message' => 'Accès non autorisé à cette ressource',
            'code' => 403
        ];
    }
}
