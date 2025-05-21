<?php
// api/v1/controllers/config_horarios_save.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

$horarioModel = new HorarioFuncionamento($db);
$data = json_decode(file_get_contents("php://input"));

// Espera-se um array de objetos de horário, por exemplo, na chave "horarios"
if (is_object($data) && isset($data->horarios) && is_array($data->horarios)) {
    if ($horarioModel->saveAll($data->horarios)) {
        http_response_code(200);
        echo json_encode(["message" => "Horários de funcionamento salvos com sucesso."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Não foi possível salvar os horários de funcionamento. Verifique os dados enviados e os logs."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Dados inválidos. Envie um objeto JSON com uma chave 'horarios' contendo um array de horários."]);
}
?>