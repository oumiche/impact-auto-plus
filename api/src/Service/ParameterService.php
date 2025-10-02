<?php

namespace App\Service;

use App\Entity\SystemParameter;
use App\Entity\Tenant;
use App\Entity\User;
use App\Repository\SystemParameterRepository;
use Doctrine\ORM\EntityManagerInterface;

class ParameterService
{
    private EntityManagerInterface $entityManager;
    private SystemParameterRepository $parameterRepository;
    private array $parameters = [];
    private bool $loaded = false;

    public function __construct(
        EntityManagerInterface $entityManager,
        SystemParameterRepository $parameterRepository
    ) {
        $this->entityManager = $entityManager;
        $this->parameterRepository = $parameterRepository;
    }

    /**
     * Récupère un paramètre par sa clé
     */
    public function get(string $key, ?Tenant $tenant = null, $defaultValue = null)
    {
        $this->loadParameters();
        
        $parameter = $this->findParameter($key, $tenant);
        
        if ($parameter) {
            return $parameter->getTypedValue();
        }
        
        return $defaultValue;
    }

    /**
     * Récupère un paramètre global
     */
    public function getGlobal(string $key, $defaultValue = null)
    {
        return $this->get($key, null, $defaultValue);
    }

    /**
     * Récupère un paramètre spécifique à un tenant
     */
    public function getTenant(string $key, Tenant $tenant, $defaultValue = null)
    {
        return $this->get($key, $tenant, $defaultValue);
    }

    /**
     * Définit un paramètre
     */
    public function set(string $key, $value, ?Tenant $tenant = null, ?User $updatedBy = null): SystemParameter
    {
        $parameter = $this->findParameter($key, $tenant);
        
        if (!$parameter) {
            $parameter = new SystemParameter();
            $parameter->setTenant($tenant);
            $parameter->setKey($key);
            $parameter->setCategory($this->getCategoryFromKey($key));
        }

        $parameter->setTypedValue($value);
        $parameter->setUpdatedBy($updatedBy);
        $parameter->setUpdatedAt(new \DateTime());

        $this->entityManager->persist($parameter);
        $this->entityManager->flush();

        // Recharger les paramètres
        $this->loaded = false;
        $this->loadParameters();

        return $parameter;
    }

    /**
     * Définit un paramètre global
     */
    public function setGlobal(string $key, $value, ?User $updatedBy = null): SystemParameter
    {
        return $this->set($key, $value, null, $updatedBy);
    }

    /**
     * Définit un paramètre spécifique à un tenant
     */
    public function setTenant(string $key, $value, Tenant $tenant, ?User $updatedBy = null): SystemParameter
    {
        return $this->set($key, $value, $tenant, $updatedBy);
    }

    /**
     * Supprime un paramètre
     */
    public function delete(string $key, ?Tenant $tenant = null): bool
    {
        $parameter = $this->findParameter($key, $tenant);
        
        if ($parameter) {
            $this->entityManager->remove($parameter);
            $this->entityManager->flush();
            
            // Recharger les paramètres
            $this->loaded = false;
            $this->loadParameters();
            
            return true;
        }
        
        return false;
    }

    /**
     * Récupère tous les paramètres pour un tenant
     */
    public function getAllForTenant(Tenant $tenant): array
    {
        return $this->parameterRepository->findByTenant($tenant);
    }

    /**
     * Récupère tous les paramètres globaux
     */
    public function getAllGlobal(): array
    {
        return $this->parameterRepository->findGlobal();
    }

    /**
     * Récupère les paramètres par catégorie
     */
    public function getByCategory(string $category, ?Tenant $tenant = null): array
    {
        return $this->parameterRepository->findByCategory($category, $tenant);
    }

    /**
     * Vérifie si un paramètre existe
     */
    public function exists(string $key, ?Tenant $tenant = null): bool
    {
        return $this->findParameter($key, $tenant) !== null;
    }

    /**
     * Récupère les paramètres publics
     */
    public function getPublic(?Tenant $tenant = null): array
    {
        return $this->parameterRepository->findPublic($tenant);
    }

    /**
     * Initialise les paramètres par défaut
     */
    public function initializeDefaultParameters(?Tenant $tenant = null): void
    {
        $defaultParameters = [
            'system' => [
                'app_name' => 'Impact Auto',
                'app_version' => '1.0.0',
                'timezone' => 'Europe/Paris',
                'date_format' => 'd/m/Y',
                'time_format' => 'H:i',
                'currency' => 'XOF',
                'currency_symbol' => 'F',
                'language' => 'fr'
            ],
            'email' => [
                'smtp_host' => '',
                'smtp_port' => 587,
                'smtp_username' => '',
                'smtp_password' => '',
                'smtp_encryption' => 'tls',
                'from_email' => 'noreply@impactauto.com',
                'from_name' => 'Impact Auto'
            ],
            'notification' => [
                'email_enabled' => true,
                'sms_enabled' => false,
                'push_enabled' => true,
                'alert_email_recipients' => ''
            ],
            'maintenance' => [
                'alert_days_before' => 7,
                'auto_alert_enabled' => true,
                'maintenance_reminder_days' => 30
            ],
            'intervention' => [
                'auto_code_generation' => true,
                'quote_validity_days' => 30,
                'invoice_payment_days' => 30,
                'default_currency' => 'XOF'
            ],
            'vehicle' => [
                'auto_code_generation' => true,
                'default_fuel_type' => 'essence',
                'track_mileage' => true
            ]
        ];

        foreach ($defaultParameters as $category => $params) {
            foreach ($params as $key => $value) {
                if (!$this->exists($key, $tenant)) {
                    $this->set($key, $value, $tenant);
                }
            }
        }
    }

    /**
     * Recharge les paramètres depuis la base de données
     */
    private function loadParameters(): void
    {
        if ($this->loaded) {
            return;
        }

        $allParameters = $this->parameterRepository->findAll();
        
        foreach ($allParameters as $parameter) {
            $tenantId = $parameter->getTenant()?->getId();
            $this->parameters[$tenantId][$parameter->getKey()] = $parameter;
        }

        $this->loaded = true;
    }

    /**
     * Trouve un paramètre par clé et tenant
     */
    private function findParameter(string $key, ?Tenant $tenant = null): ?SystemParameter
    {
        $tenantId = $tenant?->getId();
        
        // D'abord chercher dans les paramètres du tenant
        if ($tenantId && isset($this->parameters[$tenantId][$key])) {
            return $this->parameters[$tenantId][$key];
        }
        
        // Si pas trouvé, chercher dans les paramètres globaux
        if (isset($this->parameters[null][$key])) {
            return $this->parameters[null][$key];
        }
        
        return null;
    }

    /**
     * Détermine la catégorie à partir de la clé
     */
    private function getCategoryFromKey(string $key): string
    {
        $categories = [
            'app_' => 'system',
            'smtp_' => 'email',
            'email_' => 'email',
            'notification_' => 'notification',
            'alert_' => 'notification',
            'maintenance_' => 'maintenance',
            'intervention_' => 'intervention',
            'vehicle_' => 'vehicle',
            'driver_' => 'vehicle',
            'supply_' => 'supply',
            'collaborateur_' => 'collaborateur'
        ];

        foreach ($categories as $prefix => $category) {
            if (strpos($key, $prefix) === 0) {
                return $category;
            }
        }

        return 'general';
    }
}
