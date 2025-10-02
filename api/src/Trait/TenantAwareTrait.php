<?php

namespace App\Trait;

use App\Entity\Tenant;
use App\Entity\User;
use App\Service\TenantAccessService;
use App\Service\TenantContextService;
use Symfony\Component\HttpFoundation\JsonResponse;

trait TenantAwareTrait
{
    private TenantAccessService $tenantAccessService;
    private TenantContextService $tenantContextService;

    /**
     * Récupère l'utilisateur actuel
     */
    protected function getCurrentUser(): ?User
    {
        return $this->tenantContextService->getCurrentUser();
    }

    /**
     * Récupère le tenant actuel
     */
    protected function getCurrentTenant(): ?Tenant
    {
        return $this->tenantContextService->getCurrentTenant();
    }

    /**
     * Vérifie si l'utilisateur a une permission spécifique
     */
    protected function hasPermission(string $permission): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->hasPermission($user, $tenant, $permission);
    }

    /**
     * Vérifie si l'utilisateur est administrateur du tenant
     */
    protected function isTenantAdmin(): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->isTenantAdmin($user, $tenant);
    }

    /**
     * Vérifie si l'utilisateur est super administrateur
     */
    protected function isSuperAdmin(): bool
    {
        $user = $this->getCurrentUser();
        
        if (!$user) {
            return false;
        }

        return $this->tenantAccessService->isSuperAdmin($user);
    }

    /**
     * Vérifie si l'utilisateur peut créer une ressource
     */
    protected function canCreate(string $resourceType): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->canCreate($user, $tenant, $resourceType);
    }

    /**
     * Vérifie si l'utilisateur peut lire une ressource
     */
    protected function canRead(string $resourceType): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->canRead($user, $tenant, $resourceType);
    }

    /**
     * Vérifie si l'utilisateur peut modifier une ressource
     */
    protected function canUpdate(string $resourceType): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->canUpdate($user, $tenant, $resourceType);
    }

    /**
     * Vérifie si l'utilisateur peut supprimer une ressource
     */
    protected function canDelete(string $resourceType): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->canDelete($user, $tenant, $resourceType);
    }

    /**
     * Vérifie si l'utilisateur peut gérer les utilisateurs
     */
    protected function canManageUsers(): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->canManageUsers($user, $tenant);
    }

    /**
     * Vérifie si l'utilisateur peut gérer les paramètres
     */
    protected function canManageSettings(): bool
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user || !$tenant) {
            return false;
        }

        return $this->tenantAccessService->canManageSettings($user, $tenant);
    }

    /**
     * Vérifie le contexte tenant et retourne une erreur si invalide
     */
    protected function validateTenantContext(): ?JsonResponse
    {
        $user = $this->getCurrentUser();
        $tenant = $this->getCurrentTenant();

        if (!$user) {
            return $this->json([
                'success' => false,
                'error' => 'Authentication required',
                'message' => 'Utilisateur non authentifié'
            ], 401);
        }

        if (!$tenant) {
            return $this->json([
                'success' => false,
                'error' => 'Tenant context required',
                'message' => 'Contexte tenant manquant'
            ], 400);
        }

        return null;
    }

    /**
     * Vérifie une permission et retourne une erreur si refusée
     */
    protected function checkPermission(string $permission): ?JsonResponse
    {
        $contextError = $this->validateTenantContext();
        if ($contextError) {
            return $contextError;
        }

        if (!$this->hasPermission($permission)) {
            return $this->json([
                'success' => false,
                'error' => 'Permission denied',
                'message' => "Permission '{$permission}' requise"
            ], 403);
        }

        return null;
    }

    /**
     * Vérifie une permission de ressource et retourne une erreur si refusée
     */
    protected function checkResourcePermission(string $action, string $resourceType): ?JsonResponse
    {
        $contextError = $this->validateTenantContext();
        if ($contextError) {
            return $contextError;
        }

        $method = 'can' . ucfirst($action);
        if (!method_exists($this, $method)) {
            return $this->json([
                'success' => false,
                'error' => 'Invalid permission check',
                'message' => "Action '{$action}' non supportée"
            ], 400);
        }

        if (!$this->$method($resourceType)) {
            return $this->json([
                'success' => false,
                'error' => 'Permission denied',
                'message' => "Permission '{$action}_{$resourceType}' requise"
            ], 403);
        }

        return null;
    }

    /**
     * Récupère le contexte complet
     */
    protected function getContext(): array
    {
        return $this->tenantContextService->getContext();
    }

    /**
     * Récupère les informations de debug
     */
    protected function getDebugInfo(): array
    {
        return $this->tenantContextService->getDebugInfo();
    }
}
