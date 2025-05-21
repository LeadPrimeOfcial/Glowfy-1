<?php
// api/v1/controllers/servicos_update.php

// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Usaremos POST para update
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
$auth->getDecodedToken(); // Se o token for inválido, o script morrerá aqui
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

// Obter dados postados (JSON)
$data = json_decode(file_get_contents("php://input"));

// Verificar se o ID do serviço e os dados necessários foram enviados
if (
    is_object($data) &&
    !empty($data->id) && is_numeric($data->id) && // ID é crucial para update
    !empty($data->nome) &&
    isset($data->duracao_minutos) && is_numeric($data->duracao_minutos) && $data->duracao_minutos > 0 &&
    isset($data->preco) && is_numeric($data->preco) && $data->preco >= 0 &&
    isset($data->status)
) {
    // Atribuir valores ao objeto Servico
    $servico->id = (int)$data->id;
    $servico->nome = $data->nome;
    $servico->duracao_minutos = (int)$data->duracao_minutos;
    $servico->preco = (float)$data->preco;
    $servico->status = (bool)$data->status;

    // Tentar atualizar o serviço
    if ($servico->update()) {
        // Verificar se alguma linha foi realmente afetada (opcional, mas bom)
        // O método update no model deveria retornar true/false baseado no sucesso da query
        http_response_code(200); // 200 OK
        echo json_encode(array("message" => "Serviço atualizado com sucesso."));
    } else {
        // Pode ser que o serviço com o ID não exista, ou erro no DB
        // O model Servico->update() pode ser melhorado para diferenciar "não encontrado" de "erro DB"
        http_response_code(503); // Ou 404 se o ID não existir e o model tratar isso
        echo json_encode(array("message" => "Não foi possível atualizar o serviço. Verifique se o ID é válido e os logs do servidor."));
    }
} else {
    // Dados incompletos ou inválidos
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Não foi possível atualizar o serviço. Dados incompletos ou inválidos. Certifique-se de enviar 'id', 'nome', 'duracao_minutos', 'preco' e 'status'."));
}
?>