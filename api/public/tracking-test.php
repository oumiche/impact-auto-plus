<?php
/**
 * Fichier de test pour simuler l'API de tracking
 * À utiliser uniquement en développement
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Simuler des données de tracking
$mockData = [
    'TRK001' => [
        'id' => 'TRK001',
        'mileage' => 125000,
        'lastUpdate' => '2025-01-01T12:00:00Z',
        'status' => 'active',
        'location' => [
            'lat' => 48.8566,
            'lng' => 2.3522,
            'address' => 'Paris, France'
        ],
        'fuelLevel' => 75,
        'engineStatus' => 'running',
        'speed' => 0
    ],
    'TRK002' => [
        'id' => 'TRK002',
        'mileage' => 89000,
        'lastUpdate' => '2025-01-01T11:30:00Z',
        'status' => 'active',
        'location' => [
            'lat' => 45.7640,
            'lng' => 4.8357,
            'address' => 'Lyon, France'
        ],
        'fuelLevel' => 60,
        'engineStatus' => 'stopped',
        'speed' => 0
    ]
];

// Extraire l'ID du véhicule depuis l'URL
preg_match('/\/vehicles\/([^\/]+)(?:\/([^\/]+))?/', $requestUri, $matches);
$vehicleId = $matches[1] ?? null;
$endpoint = $matches[2] ?? null;

if (!$vehicleId) {
    http_response_code(400);
    echo json_encode(['error' => 'Vehicle ID required']);
    exit;
}

if (!isset($mockData[$vehicleId])) {
    http_response_code(404);
    echo json_encode(['error' => 'Vehicle not found']);
    exit;
}

$vehicleData = $mockData[$vehicleId];

// Endpoint spécifique pour le kilométrage
if ($endpoint === 'mileage') {
    echo json_encode(['mileage' => $vehicleData['mileage']]);
    exit;
}

// Endpoint général pour les informations du véhicule
if ($method === 'GET') {
    echo json_encode($vehicleData);
    exit;
}

// Autres méthodes non supportées
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
