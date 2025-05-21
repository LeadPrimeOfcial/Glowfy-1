<?php
// api/v1/controllers/transacoes_create.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/TransacaoFinanceira.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro BD."]); exit(); }

$transacao = new TransacaoFinanceira($db);
$data = json_decode(file_get_contents("php://input"));

if (
    !is_object($data) || empty($data->descricao) || empty($data->tipo_transacao) ||
    !isset($data->valor) || !is_numeric($data->valor) || empty($data->data_transacao)
) {
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos. Necessário: descricao, tipo_transacao (receita/despesa), valor, data_transacao."]);
    exit();
}
if (!in_array($data->tipo_transacao, ['receita', 'despesa'])) {
    http_response_code(400);
    echo json_encode(["message" => "Tipo de transação inválido. Use 'receita' ou 'despesa'."]);
    exit();
}

$transacao->descricao = $data->descricao;
$transacao->tipo_transacao = $data->tipo_transacao;
$transacao->valor = $data->valor;
$transacao->data_transacao = $data->data_transacao;
$transacao->categoria = isset($data->categoria) ? $data->categoria : null;
$transacao->id_venda = isset($data->id_venda) && is_numeric($data->id_venda) ? (int)$data->id_venda : null;

if ($transacao->create()) {
    http_response_code(201);
    echo json_encode(["message" => "Transação financeira registrada.", "id" => $transacao->id]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Não foi possível registrar a transação."]);
}
?>