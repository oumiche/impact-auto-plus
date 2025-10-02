<?php

namespace App\EventListener;

use App\Entity\User;
use App\Entity\Tenant;
use App\Entity\UserSession;
use App\Repository\TenantRepository;
use App\Repository\UserSessionRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

class TenantEventListener
{
    private Security $security;
    private TenantRepository $tenantRepository;
    private UserSessionRepository $userSessionRepository;

    public function __construct(
        Security $security,
        TenantRepository $tenantRepository,
        UserSessionRepository $userSessionRepository
    ) {
        $this->security = $security;
        $this->tenantRepository = $tenantRepository;
        $this->userSessionRepository = $userSessionRepository;
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        // Ignorer les requêtes non-API
        if (!$this->isApiRequest($request)) {
            return;
        }

        try {
            // 1. Vérifier l'authentification
            $user = $this->security->getUser();
            if (!$user instanceof User) {
                return; // Laisser Symfony gérer l'authentification
            }

            // 2. Extraire l'ID du tenant
            $tenantId = $this->extractTenantId($request);

            // 3. Vérifier l'accès au tenant
            if ($tenantId) {
                $tenant = $this->tenantRepository->find($tenantId);
                if (!$tenant) {
                    throw new AccessDeniedException('Tenant non trouvé');
                }

                if (!$this->canUserAccessTenant($user, $tenant)) {
                    throw new AccessDeniedException('Accès non autorisé à ce tenant');
                }

                // Définir le tenant dans les attributs de la requête
                $request->attributes->set('_tenant', $tenant);
            }

            // 4. Vérifier la session utilisateur
            $this->validateUserSession($user, $request);

            // 5. Définir le contexte global
            $request->attributes->set('_user', $user);

        } catch (AccessDeniedException $e) {
            $event->setResponse(new \Symfony\Component\HttpFoundation\JsonResponse([
                'success' => false,
                'error' => 'Access Denied',
                'message' => $e->getMessage(),
                'code' => 403
            ], 403));
        } catch (AuthenticationException $e) {
            $event->setResponse(new \Symfony\Component\HttpFoundation\JsonResponse([
                'success' => false,
                'error' => 'Authentication Required',
                'message' => $e->getMessage(),
                'code' => 401
            ], 401));
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
     * Extrait l'ID du tenant depuis la requête
     */
    private function extractTenantId(Request $request): ?int
    {
        // 1. Vérifier l'en-tête X-Tenant-ID
        $tenantId = $request->headers->get('X-Tenant-ID');
        if ($tenantId && is_numeric($tenantId)) {
            return (int) $tenantId;
        }

        // 2. Vérifier les paramètres de requête
        $tenantId = $request->query->get('tenant_id');
        if ($tenantId && is_numeric($tenantId)) {
            return (int) $tenantId;
        }

        // 3. Vérifier le sous-domaine
        $host = $request->getHost();
        $subdomain = $this->extractSubdomain($host);
        if ($subdomain && $subdomain !== 'www' && $subdomain !== 'admin') {
            return $this->getTenantIdFromSubdomain($subdomain);
        }

        // 4. Utiliser le premier tenant de l'utilisateur si aucun n'est spécifié
        $user = $this->security->getUser();
        if ($user instanceof User) {
            $userTenantPermissions = $this->tenantRepository->getEntityManager()
                ->getRepository(\App\Entity\UserTenantPermission::class)
                ->findBy(['user' => $user], ['id' => 'ASC'], 1);
            
            if (!empty($userTenantPermissions)) {
                return $userTenantPermissions[0]->getTenant()?->getId();
            }
        }

        return null;
    }

    /**
     * Extrait le sous-domaine depuis l'host
     */
    private function extractSubdomain(string $host): ?string
    {
        $parts = explode('.', $host);
        if (count($parts) >= 3) {
            return $parts[0];
        }
        return null;
    }

    /**
     * Obtient l'ID du tenant depuis le sous-domaine
     */
    private function getTenantIdFromSubdomain(string $subdomain): ?int
    {
        // Rechercher le tenant par slug
        $tenant = $this->tenantRepository->findOneBy(['slug' => $subdomain]);
        return $tenant?->getId();
    }

    /**
     * Vérifie si l'utilisateur peut accéder au tenant
     */
    private function canUserAccessTenant(User $user, Tenant $tenant): bool
    {
        // Vérifier les permissions spécifiques
        $permissions = $this->tenantRepository->getEntityManager()
            ->getRepository(\App\Entity\UserTenantPermission::class)
            ->findBy(['user' => $user, 'tenant' => $tenant, 'isActive' => true]);
        
        return !empty($permissions);
    }

    /**
     * Valide la session utilisateur
     */
    private function validateUserSession(User $user, Request $request): void
    {
        $sessionToken = $this->extractSessionToken($request);
        
        if ($sessionToken) {
            $session = $this->userSessionRepository->findOneBy([
                'sessionToken' => $sessionToken,
                'user' => $user,
                'isActive' => true
            ]);

            if (!$session) {
                throw new AuthenticationException('Session invalide');
            }

            if ($session->isExpired()) {
                $session->setIsActive(false);
                $this->userSessionRepository->save($session);
                throw new AuthenticationException('Session expirée');
            }

            // Mettre à jour l'activité de la session
            $session->updateActivity();
            $this->userSessionRepository->save($session);
        }
    }

    /**
     * Extrait le token de session depuis la requête
     */
    private function extractSessionToken(Request $request): ?string
    {
        // 1. Vérifier l'en-tête Authorization
        $authHeader = $request->headers->get('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            return substr($authHeader, 7);
        }

        // 2. Vérifier les cookies
        $sessionToken = $request->cookies->get('session_token');
        if ($sessionToken) {
            return $sessionToken;
        }

        // 3. Vérifier les paramètres de requête
        $sessionToken = $request->query->get('session_token');
        if ($sessionToken) {
            return $sessionToken;
        }

        return null;
    }
}
