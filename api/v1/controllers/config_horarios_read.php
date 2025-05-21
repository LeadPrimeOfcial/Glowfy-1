<?php
// api/v1/controllers/config_horarios_read.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/HorarioFuncionamento.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro ao conectar ao banco."]); exit(); }

$horario = new HorarioFuncionamento($db);
$stmt = $horario->readAll();
$num = $stmt->rowCount();

if ($num > 0) {
    $horarios_arr = ["records" => []];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $horario_item = [
            "id" => $id,
            "dia_semana" => $dia_semana,
            "hora_inicio" => $hora_inicio,
            "hora_fim" => $hora_fim,
            "ativo" => (bool)$ativo,
            "observacao" => $observacao
        ];
        array_push($horarios_arr["records"], $horario_item);
    }
    http_response_code(200);
    echo json_encode($horarios_arr);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Nenhum horário de funcionamento configurado."]);
}
?>