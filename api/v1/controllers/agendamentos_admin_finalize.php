<?php
// api/v1/controllers/agendamentos_admin_finalize.php

ini_set('display_errors', 1); // Mostrar erros na tela (APENAS PARA DEPURAÇÃO)
ini_set('display_startup_errors', 1); // Mostrar erros de inicialização
error_reporting(E_ALL); // Reportar todos os erros

// ... resto dos headers e do código ...

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Agendamento.php';
include_once __DIR__ . '/../models/Venda.php';
include_once __DIR__ . '/../models/Servico.php'; // Para pegar o preço do serviço
include_once __DIR__ . '/../core/Notification.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro ao conectar ao banco."]); exit(); }

$agendamentoModel = new Agendamento($db);
$vendaModel = new Venda($db);
$servicoModel = new Servico($db);

$data = json_decode(file_get_contents("php://input"));

if (
    !is_object($data) ||
    empty($data->id_agendamento) || !is_numeric($data->id_agendamento) ||
    !isset($data->valor_recebido) || !is_numeric($data->valor_recebido) ||
    empty($data->id_forma_pagamento) || !is_numeric($data->id_forma_pagamento)
) {
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos. Necessário: id_agendamento, valor_recebido, id_forma_pagamento."]);
    exit();
}

$agendamentoModel->id = (int)$data->id_agendamento;
$agendamento_info = $agendamentoModel->readOneAdmin(); // Pega detalhes do agendamento

if (!$agendamento_info) {
    http_response_code(404);
    echo json_encode(["message" => "Agendamento não encontrado."]);
    exit();
}

if ($agendamento_info['status_agendamento'] === 'finalizado') {
    http_response_code(409); // Conflict
    echo json_encode(["message" => "Este agendamento já foi finalizado."]);
    exit();
}
if ($agendamento_info['status_agendamento'] === 'cancelado_cliente' || $agendamento_info['status_agendamento'] === 'cancelado_salao') {
    http_response_code(409); // Conflict
    echo json_encode(["message" => "Este agendamento está cancelado e não pode ser finalizado."]);
    exit();
}


$servicoModel->id = $agendamento_info['id_servico'];
if (!$servicoModel->readOne()) {
    http_response_code(404);
    echo json_encode(["message" => "Serviço associado ao agendamento não encontrado."]);
    exit();
}
$valor_total_servico = (float)$servicoModel->preco; // Preço do serviço do agendamento

// Iniciar transação
$db->beginTransaction();

try {
    // 1. Atualizar status do agendamento
    $agendamentoModel->status_agendamento = 'finalizado';
    if (!$agendamentoModel->updateStatus()) {
        throw new Exception("Não foi possível atualizar o status do agendamento.");
    }

    // 2. Criar a venda
    $vendaModel->id_agendamento = $agendamentoModel->id;
    $vendaModel->id_cliente_final = $agendamento_info['id_cliente_final'];
    $vendaModel->cpf_cliente_venda = $agendamento_info['cpf_cliente_agendamento'];
    $vendaModel->valor_total = $valor_total_servico;
    $vendaModel->valor_recebido = (float)$data->valor_recebido;
    $vendaModel->troco = $vendaModel->valor_recebido - $vendaModel->valor_total;
    if ($vendaModel->troco < 0) $vendaModel->troco = 0; // Não pode ter troco negativo
    $vendaModel->id_forma_pagamento = (int)$data->id_forma_pagamento;
    $vendaModel->observacoes = isset($data->observacoes_venda) ? htmlspecialchars(strip_tags($data->observacoes_venda)) : null;

    if (!$vendaModel->create()) {
        throw new Exception("Não foi possível registrar a venda.");
    }

    // 3. (Futuro) Disparar notificação para o cliente (cupom não fiscal)
    Notification::enviarCupomNaoFiscalCliente($db, $vendaModel->id);

    $db->commit();
    http_response_code(200);
    echo json_encode([
        "message" => "Agendamento finalizado e venda registrada com sucesso.",
        "venda_id" => $vendaModel->id,
        "troco_calculado" => $vendaModel->troco
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    error_log("Erro ao finalizar agendamento: " . $e->getMessage() . " para agendamento ID: " . $agendamentoModel->id);
    echo json_encode(["message" => "Erro ao finalizar agendamento: " . $e->getMessage()]);
}
?>