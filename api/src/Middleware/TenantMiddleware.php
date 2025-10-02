<?php

namespace App\Middleware;

use App\Entity\Tenant;
use App\Entity\User;
use App\Service\TenantAccessService;
use App\Service\TenantContextService;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\HttpKernelInterface;

class TenantMiddleware implements HttpKernelInterface
{
    private HttpKernelInterface $app;
    private TenantAccessService $tenantAccessService;
    private TenantContextService $tenantContextService;
    private LoggerInterface $logger;

    public function __construct(
        HttpKernelInterface $app,
        TenantAccessService $tenantAccessService,
        TenantContextService $tenantContextService,
        LoggerInterface $logger
    ) {
        $this->app = $app;
        $this->tenantAccessService = $tenantAccessService;
        $this->tenantContextService = $tenantContextService;
        $this->logger = $logger;
    }

    public function handle(Request $request, int $type = self::MAIN_REQUEST, bool $catch = true): Response
    {
        // Ignorer les requêtes non-API
        if (!$this->isApiRequest($request)) {
            return $this->app->handle($request, $type, $catch);
        }

        try {
            // 1. Vérifier l'authentification
            $user = $this->tenantContextService->getCurrentUser();
            if (!$user) {
                return $this->createErrorResponse('Authentication required', 401);
            }

            // 2. Récupérer le tenant
            $tenant = $this->tenantContextService->getCurrentTenant();
            if (!$tenant) {
                return $this->createErrorResponse('Tenant context required', 400);
            }

            // 3. Vérifier l'accès au tenant
            if (!$this->tenantAccessService->canUserAccessTenant($user, $tenant)) {
                $this->logger->warning('Access denied to tenant', [
                    'user_id' => $user->getId(),
                    'tenant_id' => $tenant->getId(),
                    'ip' => $request->getClientIp()
                ]);
                
                return $this->createErrorResponse('Access denied to tenant', 403);
            }

            // 4. Définir le contexte dans la requête
            $request->attributes->set('_tenant', $tenant);
            $request->attributes->set('_user', $user);
            $request->attributes->set('_tenant_context', $this->tenantContextService->getContext());

            // 5. Log de l'accès
            $this->logger->info('Tenant access granted', [
                'user_id' => $user->getId(),
                'tenant_id' => $tenant->getId(),
                'path' => $request->getPathInfo(),
                'method' => $request->getMethod()
            ]);

            // 6. Continuer avec la requête
            return $this->app->handle($request, $type, $catch);

        } catch (\Exception $e) {
            $this->logger->error('Tenant middleware error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_path' => $request->getPathInfo()
            ]);

            return $this->createErrorResponse('Internal server error', 500);
        }
    }

    /**
     * Vérifie si la requête est une requête API
     */
    private function isApiRequest(Request $request): bool
    {
        $path = $request->getPathInfo();
        return str_starts_with($path, '/api/');
    }

    /**
     * Crée une réponse d'erreur JSON
     */
    private function createErrorResponse(string $message, int $statusCode): Response
    {
        $response = new Response(
            json_encode([
                'success' => false,
                'error' => $this->getErrorTitle($statusCode),
                'message' => $message,
                'code' => $statusCode
            ]),
            $statusCode
        );

        $response->headers->set('Content-Type', 'application/json');
        return $response;
    }

    /**
     * Récupère le titre d'erreur selon le code de statut
     */
    private function getErrorTitle(int $statusCode): string
    {
        return match ($statusCode) {
            401 => 'Unauthorized',
            403 => 'Forbidden',
            400 => 'Bad Request',
            500 => 'Internal Server Error',
            default => 'Error'
        };
    }
}
