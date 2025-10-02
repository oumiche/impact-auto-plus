<?php

namespace App\Controller;

use App\Entity\Tenant;
use App\Service\TenantService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

abstract class AbstractTenantController extends AbstractController
{
    protected TenantService $tenantService;

    public function __construct(TenantService $tenantService)
    {
        $this->tenantService = $tenantService;
    }

    /**
     * Récupérer le tenant courant et vérifier l'accès
     */
    protected function getCurrentTenantOrFail(Request $request): Tenant
    {
        $currentTenant = $this->tenantService->getCurrentTenant($request, $this->getUser());
        
        if (!$currentTenant) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'Aucun tenant accessible trouvé'
            );
        }
        
        return $currentTenant;
    }

    /**
     * Créer une réponse d'erreur pour un tenant non accessible
     */
    protected function createTenantAccessErrorResponse(): JsonResponse
    {
        return new JsonResponse($this->tenantService->createTenantAccessErrorResponse(), 403);
    }

    /**
     * Créer une réponse d'erreur pour un accès non autorisé à une entité
     */
    protected function createEntityAccessErrorResponse(): JsonResponse
    {
        return new JsonResponse($this->tenantService->createEntityAccessErrorResponse(), 403);
    }

    /**
     * Vérifier l'authentification JWT
     */
    protected function checkAuthentication(): void
    {
        if (!$this->getUser()) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'JWT Token not found. Please login to access this resource.'
            );
        }
    }

    /**
     * Vérifier l'authentification et récupérer le tenant courant
     */
    protected function checkAuthAndGetTenant(Request $request): Tenant
    {
        $this->checkAuthentication();
        return $this->getCurrentTenantOrFail($request);
    }
}
