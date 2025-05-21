<?php
// api/v1/controllers/bloqueios_read.php
header("Access-Control-Allow-Origin: *"); // etc.
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$bloqueioModel = new BloqueioAgenda($db);
$stmt = $bloqueioModel->readAll();
$num = $stmt->rowCount();

if ($num > 0) {
    $bloqueios_arr = ["records" => []];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $bloqueio_item = [
            "id" => $id,
            "data_inicio" => $data_inicio,
            "data_fim" => $data_fim,
            "motivo" => $motivo,
            "data_criacao" => $data_criacao
        ];
        array_push($bloqueios_arr["records"], $bloqueio_item);
    }
    http_response_code(200);
    echo json_encode($bloqueios_arr);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Nenhum bloqueio de agenda encontrado."]);
}
?>