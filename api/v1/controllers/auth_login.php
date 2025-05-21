<?php
// api/v1/controllers/auth_login.php

// (ini_set, error_reporting e headers como antes)
ini_set('display_errors', 1); 
ini_set('display_startup_errors', 1); 
error_reporting(E_ALL); 

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Incluir autoload do Composer para carregar a biblioteca JWT
require_once __DIR__ . '/../../vendor/autoload.php'; // Ajuste o caminho se necessário
include_once '../config/Database.php';
include_once '../models/UsuarioAdmin.php';
include_once '../config/Settings.php'; // Inclui nossa chave secreta e configurações JWT

// Use o namespace da biblioteca JWT
use Firebase\JWT\JWT;

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503);
    echo json_encode(array("message" => "Não foi possível conectar ao banco de dados para login."));
    exit();
}

$usuarioAdmin = new UsuarioAdmin($db);
$data = json_decode(file_get_contents("php://input"));

if (
    is_object($data) &&
    isset($data->email) && !empty($data->email) &&
    isset($data->password) && !empty($data->password)
) {
    $usuarioAdmin->email = $data->email;
    if ($usuarioAdmin->getByEmail()) {
        if (password_verify($data->password, $usuarioAdmin->senha_hash)) {

            $issuedAt = time();
            $expirationTime = $issuedAt + JWT_EXPIRATION_TIME_SECONDS; 
            $payload = array(
                'iss' => JWT_ISSUER,         // Emissor do token
                'aud' => JWT_AUDIENCE,         // Público do token
                'iat' => $issuedAt,            // Hora que o token foi emitido
                'exp' => $expirationTime,      // Hora de expiração do token
                'data' => array(             // Dados do usuário no token
                    'id' => $usuarioAdmin->id,
                    'nome' => $usuarioAdmin->nome,
                    'email' => $usuarioAdmin->email
                )
            );

            $jwt = JWT::encode($payload, JWT_SECRET_KEY, 'HS256'); // Usando HS256 como algoritmo

            http_response_code(200);
            echo json_encode(array(
                "message" => "Login bem-sucedido.",
                "token" => $jwt,
                "expiresAt" => $expirationTime,
                "user" => array( // Opcional, mas útil para o frontend
                    "id" => $usuarioAdmin->id,
                    "nome" => $usuarioAdmin->nome,
                    "email" => $usuarioAdmin->email
                )
            ));

        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Login falhou. Senha incorreta."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Login falhou. Usuário não encontrado com o email fornecido."));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Não foi possível fazer login. Dados incompletos (email e/ou senha ausentes) ou formato de dados inválido.",
        "data_received_type" => gettype($data),
        "is_data_object" => is_object($data),
        "email_isset" => isset($data->email),
        "password_isset" => isset($data->password)
    ));
}
?>