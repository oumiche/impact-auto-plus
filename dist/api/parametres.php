<?php
/**
 * API des Paramètres - Impact Auto
 * CRUD complet pour les paramètres système
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Inclure la configuration de la base de données
require_once '../../database_config.php';

try {
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8",
        $db_config['username'],
        $db_config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));

    // Vérifier l'authentification
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token d\'authentification requis']);
        exit;
    }

    $token = $matches[1];
    
    // Vérifier le token (simulation - à remplacer par une vraie vérification)
    if (!$token || $token === 'invalid') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token invalide']);
        exit;
    }

    switch ($method) {
        case 'GET':
            handleGetParameters($pdo);
            break;
        case 'POST':
            handleCreateParameter($pdo);
            break;
        case 'PUT':
            handleUpdateParameter($pdo);
            break;
        case 'DELETE':
            handleDeleteParameter($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}

function handleGetParameters($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, param_key, param_value, description, category, type, is_active, created_at, updated_at
            FROM system_parameters 
            ORDER BY category, param_key
        ");
        $stmt->execute();
        $parameters = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Formater les données
        $formattedParameters = array_map(function($param) {
            return [
                'id' => (int)$param['id'],
                'key' => $param['param_key'],
                'value' => $param['param_value'],
                'description' => $param['description'],
                'category' => $param['category'],
                'type' => $param['type'],
                'is_active' => (bool)$param['is_active'],
                'created_at' => $param['created_at'],
                'updated_at' => $param['updated_at']
            ];
        }, $parameters);

        echo json_encode([
            'success' => true,
            'data' => $formattedParameters
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la récupération des paramètres: ' . $e->getMessage()
        ]);
    }
}

function handleCreateParameter($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['key']) || !isset($input['value'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Données manquantes']);
            return;
        }

        // Vérifier si la clé existe déjà
        $stmt = $pdo->prepare("SELECT id FROM system_parameters WHERE param_key = ?");
        $stmt->execute([$input['key']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Cette clé de paramètre existe déjà']);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO system_parameters 
            (param_key, param_value, description, category, type, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $input['key'],
            $input['value'],
            $input['description'] ?? '',
            $input['category'] ?? 'general',
            $input['type'] ?? 'string',
            $input['is_active'] ? 1 : 0
        ]);

        $parameterId = $pdo->lastInsertId();

        // Récupérer le paramètre créé
        $stmt = $pdo->prepare("
            SELECT id, param_key, param_value, description, category, type, is_active, created_at, updated_at
            FROM system_parameters WHERE id = ?
        ");
        $stmt->execute([$parameterId]);
        $parameter = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Paramètre créé avec succès',
            'data' => [
                'id' => (int)$parameter['id'],
                'key' => $parameter['param_key'],
                'value' => $parameter['param_value'],
                'description' => $parameter['description'],
                'category' => $parameter['category'],
                'type' => $parameter['type'],
                'is_active' => (bool)$parameter['is_active'],
                'created_at' => $parameter['created_at'],
                'updated_at' => $parameter['updated_at']
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la création du paramètre: ' . $e->getMessage()
        ]);
    }
}

function handleUpdateParameter($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID du paramètre manquant']);
            return;
        }

        $stmt = $pdo->prepare("
            UPDATE system_parameters 
            SET param_value = ?, description = ?, category = ?, type = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['value'],
            $input['description'] ?? '',
            $input['category'] ?? 'general',
            $input['type'] ?? 'string',
            $input['is_active'] ? 1 : 0,
            $input['id']
        ]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Paramètre non trouvé']);
            return;
        }

        // Récupérer le paramètre mis à jour
        $stmt = $pdo->prepare("
            SELECT id, param_key, param_value, description, category, type, is_active, created_at, updated_at
            FROM system_parameters WHERE id = ?
        ");
        $stmt->execute([$input['id']]);
        $parameter = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Paramètre modifié avec succès',
            'data' => [
                'id' => (int)$parameter['id'],
                'key' => $parameter['param_key'],
                'value' => $parameter['param_value'],
                'description' => $parameter['description'],
                'category' => $parameter['category'],
                'type' => $parameter['type'],
                'is_active' => (bool)$parameter['is_active'],
                'created_at' => $parameter['created_at'],
                'updated_at' => $parameter['updated_at']
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la modification du paramètre: ' . $e->getMessage()
        ]);
    }
}

function handleDeleteParameter($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID du paramètre manquant']);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM system_parameters WHERE id = ?");
        $stmt->execute([$input['id']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Paramètre non trouvé']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Paramètre supprimé avec succès'
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la suppression du paramètre: ' . $e->getMessage()
        ]);
    }
}
?>
