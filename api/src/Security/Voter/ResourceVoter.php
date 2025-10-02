<?php

namespace App\Security\Voter;

use App\Entity\Tenant;
use App\Entity\User;
use App\Service\TenantAccessService;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class ResourceVoter extends Voter
{
    private TenantAccessService $tenantAccessService;

    public function __construct(TenantAccessService $tenantAccessService)
    {
        $this->tenantAccessService = $tenantAccessService;
    }

    protected function supports(string $attribute, $subject): bool
    {
        // Vérifier si l'attribut concerne une ressource
        if (!str_starts_with($attribute, 'RESOURCE_')) {
            return false;
        }

        // Le sujet doit être un tableau avec tenant et resource_type
        return is_array($subject) && 
               isset($subject['tenant']) && 
               $subject['tenant'] instanceof Tenant &&
               isset($subject['resource_type']) &&
               is_string($subject['resource_type']);
    }

    protected function voteOnAttribute(string $attribute, $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        // Si l'utilisateur n'est pas connecté, refuser l'accès
        if (!$user instanceof User) {
            return false;
        }

        $tenant = $subject['tenant'];
        $resourceType = $subject['resource_type'];

        // Vérifier l'accès au tenant
        if (!$this->tenantAccessService->canUserAccessTenant($user, $tenant)) {
            return false;
        }

        // Vérifier les permissions spécifiques selon l'attribut
        return match ($attribute) {
            'RESOURCE_READ' => $this->tenantAccessService->canRead($user, $tenant, $resourceType),
            'RESOURCE_CREATE' => $this->tenantAccessService->canCreate($user, $tenant, $resourceType),
            'RESOURCE_UPDATE' => $this->tenantAccessService->canUpdate($user, $tenant, $resourceType),
            'RESOURCE_DELETE' => $this->tenantAccessService->canDelete($user, $tenant, $resourceType),
            default => false,
        };
    }
}
