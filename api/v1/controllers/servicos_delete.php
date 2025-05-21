<?php
// api/v1/controllers/servicos_delete.php

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
include_once __DIR__ . '/../models/Servico.php';

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

// Instanciar objeto Servico
$servico = new Servico($db);

// Obter dados postados (JSON) - esperamos um 'id'
$data = json_decode(file_get_contents("php://input"));

// Verificar se o ID do serviço foi enviado
if (
    is_object($data) &&
    !empty($data->id) && is_numeric($data->id)
) {
    $servico->id = (int)$data->id;

    // Tentar deletar o serviço
    // Opcional: verificar se o serviço existe antes de tentar deletar
    if ($servico->delete()) {
        // Verificar se alguma linha foi afetada para confirmar a deleção
        // O método delete no model deveria retornar true se a query for bem sucedida
        // E o rowCount() > 0 se algo foi deletado.
        // Para simplificar, se execute() retorna true, consideramos sucesso.
        http_response_code(200); // 200 OK (ou 204 No Content se preferir não retornar corpo)
        echo json_encode(array("message" => "Serviço deletado com sucesso."));
    } else {
        http_response_code(503); // Ou 404 se o model tratar "não encontrado"
        echo json_encode(array("message" => "Não foi possível deletar o serviço. Verifique se o ID é válido e os logs do servidor."));
    }
} else {
    // Dados incompletos ou inválidos
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Não foi possível deletar o serviço. ID do serviço ausente ou inválido."));
}
?>