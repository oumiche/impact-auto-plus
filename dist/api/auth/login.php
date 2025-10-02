<?php

/**
 * Endpoint d'authentification Impact Auto - Version Simple
 * 
 * Ce fichier fournit un endpoint d'authentification simple
 * qui fonctionne indépendamment du système de routage FileGator.
 */

// Désactiver l'affichage des erreurs pour éviter la pollution JSON
error_reporting(0);
ini_set('display_errors', 0);

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée',
        'code' => 405
    ]);
    exit;
}

try {
    // Récupérer les données POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Email et mot de passe requis',
            'code' => 400
        ]);
        exit;
    }

    $email = $input['email'];
    $password = $input['password'];

    // Connexion directe à la base de données
    $dsn = 'mysql:host=localhost;port=3306;dbname=db_impact_auto_plus;charset=utf8mb4';
    $pdo = new PDO($dsn, 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Vérifier les informations de connexion
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Email ou mot de passe incorrect',
            'code' => 401
        ]);
        exit;
    }

    // Créer une session
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+2 hours'));
    
    $stmt = $pdo->prepare("
        INSERT INTO user_sessions 
        (user_id, tenant_id, session_token, ip_address, user_agent, expires_at, is_active, is_admin, can_switch_tenants) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        1, // Tenant par défaut
        $sessionToken,
        $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
        $_SERVER['HTTP_USER_AGENT'] ?? '',
        $expiresAt,
        1,
        $user['user_type'] === 'super_admin' ? 1 : 0,
        $user['user_type'] === 'super_admin' ? 1 : 0
    ]);

    // Mettre à jour la dernière connexion
    $stmt = $pdo->prepare("UPDATE users SET last_login_at = ? WHERE id = ?");
    $stmt->execute([date('Y-m-d H:i:s'), $user['id']]);

    // Récupérer les tenants disponibles
    $stmt = $pdo->prepare("
        SELECT t.*, utp.permissions, utp.is_primary 
        FROM tenants t 
        JOIN user_tenant_permissions utp ON t.id = utp.tenant_id 
        WHERE utp.user_id = ? AND utp.is_active = 1
    ");
    $stmt->execute([$user['id']]);
    $tenants = $stmt->fetchAll();

    // Réponse de succès
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Connexion réussie',
        'data' => [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'user_type' => $user['user_type']
            ],
            'session' => [
                'token' => $sessionToken,
                'expires_at' => $expiresAt
            ],
            'tenants' => $tenants
        ],
        'code' => 200
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de connexion au serveur',
        'error' => $e->getMessage(),
        'code' => 500
    ]);
}