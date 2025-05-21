<?php
// api/v1/controllers/config_geral_save.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/ConfiguracaoSalao.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro ao conectar ao banco."]); exit(); }

$config = new ConfiguracaoSalao($db);
$data = json_decode(file_get_contents("php://input"));

if (is_object($data)) {
    // Atribuir valores se existirem no payload
    if (isset($data->nome_salao)) $config->nome_salao = $data->nome_salao;
    if (isset($data->termos_atendimento)) $config->termos_atendimento = $data->termos_atendimento;
    if (isset($data->whatsapp_proprietaria)) $config->whatsapp_proprietaria = $data->whatsapp_proprietaria;
    if (isset($data->antecedencia_minima_agendamento_dia_horas)) $config->antecedencia_minima_agendamento_dia_horas = (int)$data->antecedencia_minima_agendamento_dia_horas;
    if (isset($data->limite_atraso_minutos)) $config->limite_atraso_minutos = (int)$data->limite_atraso_minutos;
    if (isset($data->permitir_agendamento_mesmo_dia)) $config->permitir_agendamento_mesmo_dia = (bool)$data->permitir_agendamento_mesmo_dia;
    if (isset($data->fuso_horario)) $config->fuso_horario = $data->fuso_horario;


    // Antes de atualizar, precisamos ler os valores existentes para não sobrescrever com null se não forem enviados
    $currentConfig = new ConfiguracaoSalao($db);
    if ($currentConfig->read()) { // ID 1 é assumido
        // Preencher $config com valores atuais se não vierem no $data
        $config->nome_salao = $data->nome_salao ?? $currentConfig->nome_salao;
        $config->termos_atendimento = $data->termos_atendimento ?? $currentConfig->termos_atendimento;
        $config->whatsapp_proprietaria = $data->whatsapp_proprietaria ?? $currentConfig->whatsapp_proprietaria;
        $config->antecedencia_minima_agendamento_dia_horas = $data->antecedencia_minima_agendamento_dia_horas ?? $currentConfig->antecedencia_minima_agendamento_dia_horas;
        $config->limite_atraso_minutos = $data->limite_atraso_minutos ?? $currentConfig->limite_atraso_minutos;
        $config->permitir_agendamento_mesmo_dia = $data->permitir_agendamento_mesmo_dia ?? $currentConfig->permitir_agendamento_mesmo_dia;
        $config->fuso_horario = $data->fuso_horario ?? $currentConfig->fuso_horario;
    } else {
        // Se não houver config (ID 1), algo está errado, mas o update tentará inserir se a tabela estiver vazia com um ID 1.
        // O ideal é garantir que o registro ID 1 sempre exista.
    }
    $config->id = 1; // Garantir que estamos atualizando o registro correto.

    if ($config->update()) {
        http_response_code(200);
        echo json_encode(["message" => "Configurações gerais salvas com sucesso."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Não foi possível salvar as configurações gerais ou nenhum dado foi alterado."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Dados inválidos."]);
}
?>