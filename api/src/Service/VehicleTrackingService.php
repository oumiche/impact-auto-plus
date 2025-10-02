<?php

namespace App\Service;

class VehicleTrackingService
{
    private array $trackingConfig;

    public function __construct()
    {
        // Configuration par défaut - à remplacer par l'injection de dépendances
        $this->trackingConfig = [
            'api_url' => $_ENV['TRACKING_API_URL'] ?? null,
            'api_key' => $_ENV['TRACKING_API_KEY'] ?? null,
        ];
    }

    /**
     * Récupère le kilométrage actuel d'un véhicule depuis le dispositif de tracking
     */
    public function getVehicleMileage(string $vehicleTrackingId): ?int
    {
        try {
            $apiUrl = $this->trackingConfig['api_url'] ?? null;
            $apiKey = $this->trackingConfig['api_key'] ?? null;

            if (!$apiUrl || !$apiKey) {
                error_log('Configuration de tracking manquante');
                return null;
            }

            $url = $apiUrl . '/vehicles/' . $vehicleTrackingId . '/mileage';
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => [
                        'Authorization: Bearer ' . $apiKey,
                        'Content-Type: application/json'
                    ],
                    'timeout' => 10
                ]
            ]);

            $response = file_get_contents($url, false, $context);
            
            if ($response === false) {
                error_log('Erreur lors de l\'appel API tracking');
                return null;
            }

            $data = json_decode($response, true);
            return $data['mileage'] ?? null;

        } catch (\Exception $e) {
            error_log('Erreur lors de la récupération du kilométrage: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Récupère les informations complètes du véhicule depuis le tracking
     */
    public function getVehicleInfo(string $vehicleTrackingId): ?array
    {
        try {
            $apiUrl = $this->trackingConfig['api_url'] ?? null;
            $apiKey = $this->trackingConfig['api_key'] ?? null;

            if (!$apiUrl || !$apiKey) {
                return null;
            }

            $url = $apiUrl . '/vehicles/' . $vehicleTrackingId;
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => [
                        'Authorization: Bearer ' . $apiKey,
                        'Content-Type: application/json'
                    ],
                    'timeout' => 10
                ]
            ]);

            $response = file_get_contents($url, false, $context);
            
            if ($response === false) {
                return null;
            }

            return json_decode($response, true);

        } catch (\Exception $e) {
            error_log('Erreur lors de la récupération des infos véhicule: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Met à jour le kilométrage du véhicule depuis le tracking
     */
    public function updateVehicleMileageFromTracking(int $vehicleId, string $vehicleTrackingId): bool
    {
        try {
            $mileage = $this->getVehicleMileage($vehicleTrackingId);
            
            if ($mileage !== null) {
                // Ici vous pouvez injecter le VehicleRepository et mettre à jour la base de données
                // $this->vehicleRepository->updateMileage($vehicleId, $mileage);
                return true;
            }

            return false;

        } catch (\Exception $e) {
            error_log('Erreur lors de la mise à jour du kilométrage: ' . $e->getMessage());
            return false;
        }
    }
}
