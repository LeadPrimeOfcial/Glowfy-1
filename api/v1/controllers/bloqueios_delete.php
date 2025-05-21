<?php
// api/v1/controllers/bloqueios_delete.php
header("Access-Control-Allow-Origin: *"); // etc.
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Usando POST para delete com corpo JSON
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

if (!is_object($data) || empty($data->id) || !is_numeric($data->id)) {
    http_response_code(400);
    echo json_encode(["message" => "ID do bloqueio é obrigatório."]);
    exit();
}
$bloqueio->id = (int)$data->id;

if ($bloqueio->delete()) {
    http_response_code(200);
    echo json_encode(["message" => "Bloqueio de agenda deletado com sucesso."]);
} else {
    http_response_code(404); // Ou 503 se for erro de DB
    echo json_encode(["message" => "Não foi possível deletar o bloqueio. Verifique se o ID é válido."]);
}
?>