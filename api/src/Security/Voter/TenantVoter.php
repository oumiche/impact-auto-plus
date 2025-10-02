<?php

namespace App\Security\Voter;

use App\Entity\Tenant;
use App\Entity\User;
use App\Service\TenantAccessService;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class TenantVoter extends Voter
{
    private TenantAccessService $tenantAccessService;

    public function __construct(TenantAccessService $tenantAccessService)
    {
        $this->tenantAccessService = $tenantAccessService;
    }

    protected function supports(string $attribute, $subject): bool
    {
        // Vérifier si l'attribut concerne un tenant
        if (!str_starts_with($attribute, 'TENANT_')) {
            return false;
        }

        // Vérifier si le sujet est un Tenant ou contient un Tenant
        return $subject instanceof Tenant || 
               (is_array($subject) && isset($subject['tenant']) && $subject['tenant'] instanceof Tenant);
    }

    protected function voteOnAttribute(string $attribute, $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        // Si l'utilisateur n'est pas connecté, refuser l'accès
        if (!$user instanceof User) {
            return false;
        }

        // Extraire le tenant du sujet
        $tenant = $subject instanceof Tenant ? $subject : $subject['tenant'];

        // Vérifier l'accès au tenant
        if (!$this->tenantAccessService->canUserAccessTenant($user, $tenant)) {
            return false;
        }

        // Vérifier les permissions spécifiques selon l'attribut
        return match ($attribute) {
            'TENANT_READ' => $this->tenantAccessService->canRead($user, $tenant, 'tenant'),
            'TENANT_UPDATE' => $this->tenantAccessService->canUpdate($user, $tenant, 'tenant'),
            'TENANT_DELETE' => $this->tenantAccessService->canDelete($user, $tenant, 'tenant'),
            'TENANT_MANAGE_USERS' => $this->tenantAccessService->canManageUsers($user, $tenant),
            'TENANT_MANAGE_SETTINGS' => $this->tenantAccessService->canManageSettings($user, $tenant),
            'TENANT_ADMIN' => $this->tenantAccessService->isTenantAdmin($user, $tenant),
            'TENANT_SUPER_ADMIN' => $this->tenantAccessService->isSuperAdmin($user),
            default => false,
        };
    }
}
