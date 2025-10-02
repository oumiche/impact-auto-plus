<?php

namespace App\Service;

use App\Entity\Alert;
use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\Vehicle;
use App\Entity\Driver;
use App\Entity\VehicleMaintenance;
use App\Entity\VehicleInsurance;
use App\Entity\Collaborateur;
use App\Repository\AlertRepository;
use Doctrine\ORM\EntityManagerInterface;

class AlertService
{
    private EntityManagerInterface $entityManager;
    private AlertRepository $alertRepository;
    private ParameterService $parameterService;
    private NotificationService $notificationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        AlertRepository $alertRepository,
        ParameterService $parameterService,
        NotificationService $notificationService
    ) {
        $this->entityManager = $entityManager;
        $this->alertRepository = $alertRepository;
        $this->parameterService = $parameterService;
        $this->notificationService = $notificationService;
    }

    /**
     * Crée une nouvelle alerte
     */
    public function createAlert(
        Tenant $tenant,
        string $type,
        string $severity,
        string $title,
        ?string $message = null,
        ?string $entityType = null,
        ?int $entityId = null,
        array $metadata = []
    ): Alert {
        $alert = new Alert();
        $alert->setTenant($tenant);
        $alert->setType($type);
        $alert->setSeverity($severity);
        $alert->setTitle($title);
        $alert->setMessage($message);
        $alert->setEntityType($entityType);
        $alert->setEntityId($entityId);
        $alert->setMetadata($metadata);

        $this->entityManager->persist($alert);
        $this->entityManager->flush();

        // Envoyer la notification si activée
        $this->notificationService->sendAlertNotification($alert);

        return $alert;
    }

    /**
     * Crée une alerte de maintenance due
     */
    public function createMaintenanceDueAlert(VehicleMaintenance $maintenance): Alert
    {
        $vehicle = $maintenance->getVehicle();
        $tenant = $vehicle->getTenant();

        $title = "Maintenance due pour le véhicule {$vehicle->getLicensePlate()}";
        $message = "La maintenance '{$maintenance->getType()}' est due le {$maintenance->getDueDate()->format('d/m/Y')}";

        return $this->createAlert(
            $tenant,
            'maintenance_due',
            'warning',
            $title,
            $message,
            'VehicleMaintenance',
            $maintenance->getId(),
            [
                'vehicle_id' => $vehicle->getId(),
                'maintenance_type' => $maintenance->getType(),
                'due_date' => $maintenance->getDueDate()->format('Y-m-d')
            ]
        );
    }

    /**
     * Crée une alerte d'assurance expirée
     */
    public function createInsuranceExpiredAlert(VehicleInsurance $insurance): Alert
    {
        $vehicle = $insurance->getVehicle();
        $tenant = $vehicle->getTenant();

        $title = "Assurance expirée pour le véhicule {$vehicle->getLicensePlate()}";
        $message = "L'assurance expire le {$insurance->getEndDate()->format('d/m/Y')}";

        return $this->createAlert(
            $tenant,
            'insurance_expired',
            'critical',
            $title,
            $message,
            'VehicleInsurance',
            $insurance->getId(),
            [
                'vehicle_id' => $vehicle->getId(),
                'insurance_type' => $insurance->getType(),
                'end_date' => $insurance->getEndDate()->format('Y-m-d')
            ]
        );
    }

    /**
     * Crée une alerte de permis expiré
     */
    public function createLicenseExpiredAlert(Driver $driver): Alert
    {
        $tenant = $driver->getTenant();

        $title = "Permis expiré pour {$driver->getFirstName()} {$driver->getLastName()}";
        $message = "Le permis de conduire expire le {$driver->getLicenseExpiryDate()->format('d/m/Y')}";

        return $this->createAlert(
            $tenant,
            'license_expired',
            'critical',
            $title,
            $message,
            'Driver',
            $driver->getId(),
            [
                'driver_name' => $driver->getFirstName() . ' ' . $driver->getLastName(),
                'license_number' => $driver->getLicenseNumber(),
                'expiry_date' => $driver->getLicenseExpiryDate()->format('Y-m-d')
            ]
        );
    }

    /**
     * Crée une alerte de certificat expiré pour un collaborateur
     */
    public function createCertificationExpiredAlert(Collaborateur $collaborateur): Alert
    {
        $tenant = $collaborateur->getCollaborateurTenants()->first()?->getTenant();
        if (!$tenant) {
            throw new \InvalidArgumentException('Collaborateur non associé à un tenant');
        }

        $title = "Certificat expiré pour {$collaborateur->getFirstName()} {$collaborateur->getLastName()}";
        $message = "Le certificat '{$collaborateur->getCertificationLevel()}' expire le {$collaborateur->getLicenseExpiryDate()->format('d/m/Y')}";

        return $this->createAlert(
            $tenant,
            'certification_expired',
            'warning',
            $title,
            $message,
            'Collaborateur',
            $collaborateur->getId(),
            [
                'collaborateur_name' => $collaborateur->getFirstName() . ' ' . $collaborateur->getLastName(),
                'certification_level' => $collaborateur->getCertificationLevel(),
                'expiry_date' => $collaborateur->getLicenseExpiryDate()->format('Y-m-d')
            ]
        );
    }

    /**
     * Marque une alerte comme lue
     */
    public function markAsRead(Alert $alert, User $user): Alert
    {
        $alert->markAsRead($user);
        $this->entityManager->flush();

        return $alert;
    }

    /**
     * Rejette une alerte
     */
    public function dismissAlert(Alert $alert, User $user): Alert
    {
        $alert->dismiss($user);
        $this->entityManager->flush();

        return $alert;
    }

    /**
     * Récupère les alertes actives pour un tenant
     */
    public function getActiveAlerts(Tenant $tenant, array $filters = []): array
    {
        return $this->alertRepository->findActiveByTenant($tenant, $filters);
    }

    /**
     * Récupère les alertes non lues pour un tenant
     */
    public function getUnreadAlerts(Tenant $tenant): array
    {
        return $this->alertRepository->findUnreadByTenant($tenant);
    }

    /**
     * Nettoie les anciennes alertes
     */
    public function cleanOldAlerts(int $daysToKeep = 30): int
    {
        $cutoffDate = new \DateTime();
        $cutoffDate->modify("-{$daysToKeep} days");

        return $this->alertRepository->deleteOlderThan($cutoffDate);
    }

    /**
     * Vérifie et crée les alertes automatiques
     */
    public function checkAndCreateAutomaticAlerts(Tenant $tenant): int
    {
        $alertsCreated = 0;

        // Vérifier les maintenances dues
        $alertsCreated += $this->checkMaintenanceAlerts($tenant);

        // Vérifier les assurances expirées
        $alertsCreated += $this->checkInsuranceAlerts($tenant);

        // Vérifier les permis expirés
        $alertsCreated += $this->checkLicenseAlerts($tenant);

        // Vérifier les certificats expirés
        $alertsCreated += $this->checkCertificationAlerts($tenant);

        return $alertsCreated;
    }

    private function checkMaintenanceAlerts(Tenant $tenant): int
    {
        // Implémentation pour vérifier les maintenances dues
        return 0;
    }

    private function checkInsuranceAlerts(Tenant $tenant): int
    {
        // Implémentation pour vérifier les assurances expirées
        return 0;
    }

    private function checkLicenseAlerts(Tenant $tenant): int
    {
        // Implémentation pour vérifier les permis expirés
        return 0;
    }

    private function checkCertificationAlerts(Tenant $tenant): int
    {
        // Implémentation pour vérifier les certificats expirés
        return 0;
    }
}
