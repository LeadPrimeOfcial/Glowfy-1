<?php
// api/v1/controllers/agendamentos_availability.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Servico.php';
include_once __DIR__ . '/../models/HorarioFuncionamento.php';
include_once __DIR__ . '/../models/Agendamento.php';
include_once __DIR__ . '/../models/ConfiguracaoSalao.php';
include_once __DIR__ . '/../models/BloqueioAgenda.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503);
    echo json_encode(["message" => "Erro ao conectar ao banco de dados."]);
    exit();
}

// Obter parâmetros da URL
$data_selecionada_str = isset($_GET['date']) ? $_GET['date'] : null; // YYYY-MM-DD
$id_servico = isset($_GET['serviceId']) ? filter_var($_GET['serviceId'], FILTER_VALIDATE_INT) : null;

if (!$data_selecionada_str || !$id_servico) {
    http_response_code(400);
    echo json_encode(["message" => "Parâmetros 'date' e 'serviceId' são obrigatórios."]);
    exit();
}

try {
    $data_selecionada_obj = new DateTime($data_selecionada_str);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["message" => "Formato de data inválido. Use YYYY-MM-DD."]);
    exit();
}

// Buscar informações do serviço
$servicoModel = new Servico($db);
$servicoModel->id = $id_servico;
if (!$servicoModel->readOne() || !$servicoModel->status) { // Verifica se o serviço existe e está ativo
    http_response_code(404);
    echo json_encode(["message" => "Serviço não encontrado ou inativo."]);
    exit();
}
$duracao_servico_minutos = $servicoModel->duracao_minutos;

// Buscar configurações do salão
$configSalao = new ConfiguracaoSalao($db);
if (!$configSalao->read()) {
    http_response_code(500);
    echo json_encode(["message" => "Erro ao carregar configurações do salão."]);
    exit();
}
date_default_timezone_set($configSalao->fuso_horario ?: 'America/Sao_Paulo'); // Definir fuso horário

// --- Lógica de Cálculo de Disponibilidade ---
$dia_da_semana_php = strtoupper($data_selecionada_obj->format('l')); // MONDAY, TUESDAY...

$horarioFuncionamentoModel = new HorarioFuncionamento($db);
$stmtHorarios = $horarioFuncionamentoModel->readAll(); // Poderia otimizar para buscar só o dia_da_semana_php

$slots_funcionamento_dia = [];
while ($row = $stmtHorarios->fetch(PDO::FETCH_ASSOC)) {
    if ($row['dia_semana'] === $dia_da_semana_php && $row['ativo']) {
        $slots_funcionamento_dia[] = $row;
    }
}

if (empty($slots_funcionamento_dia)) {
    http_response_code(200); // Ou 404 se preferir
    echo json_encode(["availableTimes" => [], "message" => "Salão fechado neste dia."]);
    exit();
}

// Buscar agendamentos existentes para a data
$agendamentoModel = new Agendamento($db);
$stmtAgendamentosExistentes = $agendamentoModel->getByDate($data_selecionada_str);
$agendamentos_existentes = $stmtAgendamentosExistentes->fetchAll(PDO::FETCH_ASSOC);

$horarios_disponiveis = [];
$intervalo_minutos = 15; // Os clientes podem ver horários a cada 15 minutos

$agora = new DateTime(); // Hora atual
$data_selecionada_e_hoje = ($data_selecionada_obj->format('Y-m-d') === $agora->format('Y-m-d'));

$antecedencia_min_ag_dia_horas = $configSalao->permitir_agendamento_mesmo_dia ? (int)$configSalao->antecedencia_minima_agendamento_dia_horas : 24*1000; // Se não permite no mesmo dia, força uma antecedência enorme

foreach ($slots_funcionamento_dia as $slot_funcionamento) {
    $hora_inicio_slot_dt = new DateTime($data_selecionada_str . ' ' . $slot_funcionamento['hora_inicio']);
    $hora_fim_slot_dt = new DateTime($data_selecionada_str . ' ' . $slot_funcionamento['hora_fim']);
    
    $horario_atual_no_slot = clone $hora_inicio_slot_dt;

    while ($horario_atual_no_slot < $hora_fim_slot_dt) {
        $horario_fim_potencial_dt = (clone $horario_atual_no_slot)->modify("+" . $duracao_servico_minutos . " minutes");

        if ($horario_fim_potencial_dt > $hora_fim_slot_dt) {
            break; // Este serviço não cabe mais neste slot de funcionamento
        }
        
        // ---- NOVA VERIFICAÇÃO DE BLOQUEIO ----
if (BloqueioAgenda::isSlotBlocked($db, $horario_atual_no_slot, $horario_fim_potencial_dt)) {
    $horario_atual_no_slot->modify("+" . $intervalo_minutos . " minutes");
    continue; // Slot está bloqueado, pular para o próximo
}

        // Verificar regra de antecedência para agendamentos no mesmo dia
        if ($data_selecionada_e_hoje) {
            $horario_minimo_para_agendar_dt = (clone $agora)->modify("+" . $antecedencia_min_ag_dia_horas . " hours");
            if ($horario_atual_no_slot < $horario_minimo_para_agendar_dt) {
                $horario_atual_no_slot->modify("+" . $intervalo_minutos . " minutes");
                continue; // Horário muito próximo
            }
        }

        // Verificar se o horário está ocupado
        $ocupado = false;
        foreach ($agendamentos_existentes as $ag_existente) {
            $ag_inicio_dt = new DateTime($data_selecionada_str . ' ' . $ag_existente['hora_inicio']);
            $ag_fim_dt = new DateTime($data_selecionada_str . ' ' . $ag_existente['hora_fim']);

            // Verifica sobreposição
            if (($horario_atual_no_slot < $ag_fim_dt) && ($horario_fim_potencial_dt > $ag_inicio_dt)) {
                $ocupado = true;
                break;
            }
        }

        if (!$ocupado) {
            $horarios_disponiveis[] = $horario_atual_no_slot->format('H:i');
        }
        $horario_atual_no_slot->modify("+" . $intervalo_minutos . " minutes");
    }
}

// Remover duplicados e ordenar (se $intervalo_minutos for menor que a granularidade)
$horarios_disponiveis = array_unique($horarios_disponiveis);
sort($horarios_disponiveis);

http_response_code(200);
echo json_encode(["availableTimes" => $horarios_disponiveis]);

?>