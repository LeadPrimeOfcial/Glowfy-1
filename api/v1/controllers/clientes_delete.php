<?php
// api/v1/controllers/clientes_delete.php

// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Usaremos POST para delete
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Incluir arquivos necessários
require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/ClienteFinal.php';

// -------------------- AUTENTICAÇÃO --------------------
$auth = new AuthMiddleware();
$auth->getDecodedToken();
// -----------------------------------------------------

// Instanciar banco de dados e conectar
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503);
    echo json_encode(array("message" => "Não foi possível conectar ao banco de dados."));
    exit();
}

// Instanciar objeto ClienteFinal
$cliente = new ClienteFinal($db);

// Obter dados postados (JSON) - esperamos um 'id'
$data = json_decode(file_get_contents("php://input"));

// Verificar se o ID do cliente foi enviado
if (
    is_object($data) &&
    !empty($data->id) && is_numeric($data->id)
) {
    $cliente->id = (int)$data->id;

    // Tentar deletar o cliente
    if ($cliente->delete()) { // O model->delete() agora retorna true se rowCount > 0
        http_response_code(200); // OK (ou 204 No Content se não retornar corpo)
        echo json_encode(array("message" => "Cliente deletado com sucesso."));
    } else {
        // Se rowCount for 0, o cliente com o ID fornecido pode não existir
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Não foi possível deletar o cliente. Cliente com o ID fornecido não encontrado ou erro no servidor."));
    }
} else {
    // Dados incompletos ou inválidos
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Não foi possível deletar o cliente. ID do cliente ausente ou inválido."));
}
?>