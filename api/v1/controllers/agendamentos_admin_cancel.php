<?php
// api/v1/controllers/agendamentos_admin_cancel.php
include_once __DIR__ . '/../core/Notification.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Agendamento.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro ao conectar ao banco."]); exit(); }

$agendamentoModel = new Agendamento($db);
$data = json_decode(file_get_contents("php://input"));

if (!is_object($data) || empty($data->id_agendamento) || !is_numeric($data->id_agendamento)) {
    http_response_code(400);
    echo json_encode(["message" => "ID do agendamento é obrigatório."]);
    exit();
}

$agendamentoModel->id = (int)$data->id_agendamento;

// Verificar se o agendamento existe e seu status atual
$ag_info = $agendamentoModel->readOneAdmin(); // Usamos o método que já busca detalhes
if (!$ag_info) {
    http_response_code(404);
    echo json_encode(["message" => "Agendamento não encontrado."]);
    exit();
}

// Não permitir cancelar se já estiver finalizado ou cancelado
if ($ag_info['status_agendamento'] === 'finalizado' || 
    $ag_info['status_agendamento'] === 'cancelado_cliente' || 
    $ag_info['status_agendamento'] === 'cancelado_salao') {
     http_response_code(409); // Conflict
     echo json_encode(["message" => "Este agendamento não pode ser cancelado pois já está " . $ag_info['status_agendamento'] . "."]);
     exit();
}

// Definir o novo status
$agendamentoModel->status_agendamento = 'cancelado_salao'; // Administradora cancelando

if ($agendamentoModel->updateStatus()) { // Reutilizamos o método updateStatus do model
    // (Futuro) Disparar notificação para o cliente sobre o cancelamento
    Notification::enviarCancelamentoPeloSalaoCliente($db, $agendamentoModel->id);
    http_response_code(200);
    echo json_encode(["message" => "Agendamento cancelado com sucesso pelo salão."]);
} else {
    http_response_code(500); // Ou 404 se updateStatus indicasse que o ID não foi encontrado
    echo json_encode(["message" => "Não foi possível cancelar o agendamento. Verifique se o ID é válido."]);
}
?>