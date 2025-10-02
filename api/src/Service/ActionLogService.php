<?php

namespace App\Service;

use App\Entity\ActionLog;
use App\Entity\Tenant;
use App\Entity\User;
use App\Repository\ActionLogRepository;
use Doctrine\ORM\EntityManagerInterface;

class ActionLogService
{
    private EntityManagerInterface $entityManager;
    private ActionLogRepository $actionLogRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        ActionLogRepository $actionLogRepository
    ) {
        $this->entityManager = $entityManager;
        $this->actionLogRepository = $actionLogRepository;
    }

    /**
     * Enregistre une action utilisateur
     */
    public function logAction(
        Tenant $tenant,
        User $user,
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        array $details = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $sessionId = null
    ): ActionLog {
        $actionLog = new ActionLog();
        $actionLog->setTenant($tenant);
        $actionLog->setUser($user);
        $actionLog->setAction($action);
        $actionLog->setEntityType($entityType);
        $actionLog->setEntityId($entityId);
        $actionLog->setDetails($details);
        $actionLog->setIpAddress($ipAddress);
        $actionLog->setUserAgent($userAgent);
        $actionLog->setSessionId($sessionId);

        $this->entityManager->persist($actionLog);
        $this->entityManager->flush();

        return $actionLog;
    }

    /**
     * Enregistre une action de création
     */
    public function logCreate(
        Tenant $tenant,
        User $user,
        string $entityType,
        int $entityId,
        array $details = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $sessionId = null
    ): ActionLog {
        return $this->logAction(
            $tenant,
            $user,
            'create',
            $entityType,
            $entityId,
            $details,
            $ipAddress,
            $userAgent,
            $sessionId
        );
    }

    /**
     * Enregistre une action de mise à jour
     */
    public function logUpdate(
        Tenant $tenant,
        User $user,
        string $entityType,
        int $entityId,
        array $oldValues = [],
        array $newValues = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $sessionId = null
    ): ActionLog {
        $details = [
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'changed_fields' => array_keys(array_diff_assoc($newValues, $oldValues))
        ];

        return $this->logAction(
            $tenant,
            $user,
            'update',
            $entityType,
            $entityId,
            $details,
            $ipAddress,
            $userAgent,
            $sessionId
        );
    }

    /**
     * Enregistre une action de suppression
     */
    public function logDelete(
        Tenant $tenant,
        User $user,
        string $entityType,
        int $entityId,
        array $details = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $sessionId = null
    ): ActionLog {
        return $this->logAction(
            $tenant,
            $user,
            'delete',
            $entityType,
            $entityId,
            $details,
            $ipAddress,
            $userAgent,
            $sessionId
        );
    }

    /**
     * Enregistre une action de connexion
     */
    public function logLogin(
        Tenant $tenant,
        User $user,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $sessionId = null
    ): ActionLog {
        return $this->logAction(
            $tenant,
            $user,
            'login',
            null,
            null,
            ['login_time' => (new \DateTime())->format('Y-m-d H:i:s')],
            $ipAddress,
            $userAgent,
            $sessionId
        );
    }

    /**
     * Enregistre une action de déconnexion
     */
    public function logLogout(
        Tenant $tenant,
        User $user,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $sessionId = null
    ): ActionLog {
        return $this->logAction(
            $tenant,
            $user,
            'logout',
            null,
            null,
            ['logout_time' => (new \DateTime())->format('Y-m-d H:i:s')],
            $ipAddress,
            $userAgent,
            $sessionId
        );
    }

    /**
     * Récupère les logs d'actions pour un tenant
     */
    public function getLogsForTenant(Tenant $tenant, array $filters = []): array
    {
        return $this->actionLogRepository->findByTenant($tenant, $filters);
    }

    /**
     * Récupère les logs d'actions pour un utilisateur
     */
    public function getLogsForUser(User $user, array $filters = []): array
    {
        return $this->actionLogRepository->findByUser($user, $filters);
    }

    /**
     * Récupère les logs d'actions pour une entité
     */
    public function getLogsForEntity(string $entityType, int $entityId, array $filters = []): array
    {
        return $this->actionLogRepository->findByEntity($entityType, $entityId, $filters);
    }

    /**
     * Nettoie les anciens logs
     */
    public function cleanOldLogs(int $daysToKeep = 90): int
    {
        $cutoffDate = new \DateTime();
        $cutoffDate->modify("-{$daysToKeep} days");

        return $this->actionLogRepository->deleteOlderThan($cutoffDate);
    }
}
