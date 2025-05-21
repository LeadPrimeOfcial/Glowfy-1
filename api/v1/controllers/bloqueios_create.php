<?php
// api/v1/controllers/bloqueios_create.php
header("Access-Control-Allow-Origin: *"); // etc.
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
// ... (resto dos headers CORS e preflight) ...
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/BloqueioAgenda.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro BD."]); exit(); }

$bloqueio = new BloqueioAgenda($db);
$data = json_decode(file_get_contents("php://input"));

if (!is_object($data) || empty($data->data_inicio) || empty($data->data_fim)) {
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos. 'data_inicio' (YYYY-MM-DD HH:MM:SS) e 'data_fim' (YYYY-MM-DD HH:MM:SS) são obrigatórios."]);
    exit();
}

// Validar formato de data/hora (simples)
try {
    new DateTime($data->data_inicio);
    new DateTime($data->data_fim);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["message" => "Formato de data/hora inválido. Use YYYY-MM-DD HH:MM:SS."]);
    exit();
}
if (new DateTime($data->data_inicio) >= new DateTime($data->data_fim)) {
    http_response_code(400);
    echo json_encode(["message" => "A data/hora de início deve ser anterior à data/hora de fim."]);
    exit();
}


$bloqueio->data_inicio = $data->data_inicio;
$bloqueio->data_fim = $data->data_fim;
$bloqueio->motivo = isset($data->motivo) ? $data->motivo : null;

if ($bloqueio->create()) {
    http_response_code(201);
    echo json_encode(["message" => "Bloqueio de agenda criado com sucesso.", "id" => $bloqueio->id]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Não foi possível criar o bloqueio."]);
}
?>