<?php
// api/v1/controllers/config_geral_read.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// GET não precisa de autenticação para ler termos (cliente pode precisar ver)
// Mas para ler outras configs como whatsapp_proprietaria, talvez precise.
// Vamos deixar aberto por enquanto, mas pode ser protegido se necessário.

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/ConfiguracaoSalao.php';

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro ao conectar ao banco."]); exit(); }

$config = new ConfiguracaoSalao($db);

if ($config->read()) { // O ID 1 é assumido no model
    $config_arr = [
        "nome_salao" => $config->nome_salao,
        "termos_atendimento" => $config->termos_atendimento,
        "whatsapp_proprietaria" => $config->whatsapp_proprietaria,
        "antecedencia_minima_agendamento_dia_horas" => $config->antecedencia_minima_agendamento_dia_horas,
        "limite_atraso_minutos" => $config->limite_atraso_minutos,
        "permitir_agendamento_mesmo_dia" => $config->permitir_agendamento_mesmo_dia,
        "fuso_horario" => $config->fuso_horario
    ];
    http_response_code(200);
    echo json_encode($config_arr);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Configurações do salão não encontradas."]);
}
?>