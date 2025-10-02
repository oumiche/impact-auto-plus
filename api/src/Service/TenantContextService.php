<?php

namespace App\Service;

use App\Entity\Tenant;
use App\Entity\User;
use App\Repository\TenantRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Security;

class TenantContextService
{
    private Security $security;
    private TenantRepository $tenantRepository;
    private RequestStack $requestStack;
    private ?Tenant $currentTenant = null;
    private ?User $currentUser = null;

    public function __construct(
        Security $security,
        TenantRepository $tenantRepository,
        RequestStack $requestStack
    ) {
        $this->security = $security;
        $this->tenantRepository = $tenantRepository;
        $this->requestStack = $requestStack;
    }

    /**
     * Récupère le tenant actuel
     */
    public function getCurrentTenant(): ?Tenant
    {
        if ($this->currentTenant !== null) {
            return $this->currentTenant;
        }

        $request = $this->requestStack->getCurrentRequest();
        if (!$request) {
            return null;
        }

        // 1. Vérifier les attributs de la requête
        $tenant = $request->attributes->get('_tenant');
        if ($tenant instanceof Tenant) {
            $this->currentTenant = $tenant;
            return $tenant;
        }

        // 2. Extraire l'ID du tenant depuis la requête
        $tenantId = $this->extractTenantIdFromRequest($request);
        if ($tenantId) {
            $tenant = $this->tenantRepository->find($tenantId);
            if ($tenant) {
                $this->currentTenant = $tenant;
                return $tenant;
            }
        }

        // 3. Utiliser le premier tenant de l'utilisateur connecté
        /** @var User $user */
        $user = $this->getCurrentUser();
        if ($user) {
            // Récupérer le premier tenant via le repository
            $userTenantPermissions = $this->tenantRepository->getEntityManager()
                ->getRepository(\App\Entity\UserTenantPermission::class)
                ->findBy(['user' => $user], ['id' => 'ASC'], 1);
            
            if (!empty($userTenantPermissions)) {
                $firstTenant = $userTenantPermissions[0]->getTenant();
                if ($firstTenant) {
                    $this->currentTenant = $firstTenant;
                    return $firstTenant;
                }
            }
        }

        return null;
    }

    /**
     * Définit le tenant actuel
     */
    public function setCurrentTenant(Tenant $tenant): void
    {
        $this->currentTenant = $tenant;
    }

    /**
     * Récupère l'utilisateur actuel
     */
    public function getCurrentUser(): ?User
    {
        if ($this->currentUser !== null) {
            return $this->currentUser;
        }

        $user = $this->security->getUser();
        if ($user instanceof User) {
            $this->currentUser = $user;
            return $user;
        }

        return null;
    }

    /**
     * Vérifie si un tenant est défini
     */
    public function hasTenant(): bool
    {
        return $this->getCurrentTenant() !== null;
    }

    /**
     * Vérifie si un utilisateur est connecté
     */
    public function hasUser(): bool
    {
        return $this->getCurrentUser() !== null;
    }

    /**
     * Récupère l'ID du tenant actuel
     */
    public function getCurrentTenantId(): ?int
    {
        $tenant = $this->getCurrentTenant();
        return $tenant?->getId();
    }

    /**
     * Récupère l'ID de l'utilisateur actuel
     */
    public function getCurrentUserId(): ?int
    {
        $user = $this->getCurrentUser();
        return $user?->getId();
    }

    /**
     * Extrait l'ID du tenant depuis la requête
     */
    private function extractTenantIdFromRequest(Request $request): ?int
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

        // 4. Vérifier les paramètres de route
        $tenantId = $request->attributes->get('tenant_id');
        if ($tenantId && is_numeric($tenantId)) {
            return (int) $tenantId;
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
        $tenant = $this->tenantRepository->findOneBy(['slug' => $subdomain]);
        return $tenant?->getId();
    }

    /**
     * Récupère le contexte complet
     */
    public function getContext(): array
    {
        return [
            'user' => $this->getCurrentUser(),
            'tenant' => $this->getCurrentTenant(),
            'user_id' => $this->getCurrentUserId(),
            'tenant_id' => $this->getCurrentTenantId(),
            'has_user' => $this->hasUser(),
            'has_tenant' => $this->hasTenant()
        ];
    }

    /**
     * Vérifie si le contexte est valide
     */
    public function isContextValid(): bool
    {
        return $this->hasUser() && $this->hasTenant();
    }

    /**
     * Récupère les informations de debug du contexte
     */
    public function getDebugInfo(): array
    {
        $request = $this->requestStack->getCurrentRequest();
        
        return [
            'context' => $this->getContext(),
            'request_info' => [
                'path' => $request?->getPathInfo(),
                'method' => $request?->getMethod(),
                'host' => $request?->getHost(),
                'headers' => [
                    'X-Tenant-ID' => $request?->headers->get('X-Tenant-ID'),
                    'Authorization' => $request?->headers->get('Authorization') ? 'Bearer ***' : null,
                ],
                'query_params' => $request?->query->all(),
            ]
        ];
    }

    /**
     * Réinitialise le contexte
     */
    public function reset(): void
    {
        $this->currentTenant = null;
        $this->currentUser = null;
    }
}
