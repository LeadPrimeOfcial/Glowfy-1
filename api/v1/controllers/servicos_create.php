<?php
// api/v1/controllers/servicos_create.php

// Headers
header("Access-Control-Allow-Origin: *"); // Ou seu domínio do frontend em produção
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit();
}

// Incluir arquivos necessários
require_once __DIR__ . '/../core/AuthMiddleware.php'; // Middleware de Autenticação
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Servico.php';

// -------------------- AUTENTICAÇÃO --------------------
$auth = new AuthMiddleware();
$dadosUsuarioAutenticado = $auth->getDecodedToken(); // Se o token for inválido, o script morrerá aqui
// Se chegou aqui, $dadosUsuarioAutenticado contém os dados do usuário logado (ex: $dadosUsuarioAutenticado->data->id)
// Você pode adicionar verificações de permissão aqui se necessário no futuro
// -----------------------------------------------------

// Instanciar banco de dados e conectar
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503); // Service Unavailable
    echo json_encode(array("message" => "Não foi possível conectar ao banco de dados."));
    exit();
}

// Instanciar objeto Servico
$servico = new Servico($db);

// Obter dados postados (JSON)
$data = json_decode(file_get_contents("php://input"));

// Verificar se os dados necessários foram enviados e não estão vazios
if (
    is_object($data) &&
    !empty($data->nome) &&
    isset($data->duracao_minutos) && is_numeric($data->duracao_minutos) && $data->duracao_minutos > 0 &&
    isset($data->preco) && is_numeric($data->preco) && $data->preco >= 0 &&
    isset($data->status) // status pode ser true/false (ou 1/0)
) {
    // Atribuir valores ao objeto Servico
    $servico->nome = $data->nome;
    $servico->duracao_minutos = (int)$data->duracao_minutos;
    $servico->preco = (float)$data->preco;
    $servico->status = (bool)$data->status; // O model Servico.php converterá para 0/1

    // Tentar criar o serviço
    if ($servico->create()) {
        http_response_code(201); // 201 Created
        echo json_encode(array(
            "message" => "Serviço criado com sucesso.",
            "id" => $servico->id, // Retorna o ID do novo serviço
            "nome" => $servico->nome,
            "duracao_minutos" => $servico->duracao_minutos,
            "preco" => $servico->preco,
            "status" => $servico->status
        ));
    } else {
        http_response_code(503); // Service Unavailable (ou 500 Internal Server Error se for erro de SQL)
        echo json_encode(array("message" => "Não foi possível criar o serviço. Verifique os logs do servidor."));
    }
} else {
    // Dados incompletos ou inválidos
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Não foi possível criar o serviço. Dados incompletos ou inválidos. Certifique-se de enviar 'nome', 'duracao_minutos', 'preco' e 'status'."));
}
?>