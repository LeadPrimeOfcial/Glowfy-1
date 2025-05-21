<?php
// api/v1/controllers/agendamentos_create.php

ini_set('display_errors', 1); // Mostrar erros na tela (APENAS PARA DEPURAÇÃO)
ini_set('display_startup_errors', 1); // Mostrar erros de inicialização
error_reporting(E_ALL); // Reportar todos os erros

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Agendamento.php';
include_once __DIR__ . '/../models/ClienteFinal.php';
include_once __DIR__ . '/../models/Servico.php';
include_once __DIR__ . '/../models/ConfiguracaoSalao.php';
include_once __DIR__ . '/../core/Notification.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503);
    echo json_encode(["message" => "Erro ao conectar ao banco de dados."]);
    exit();
}

$agendamento = new Agendamento($db);
$clienteFinal = new ClienteFinal($db);
$servicoModel = new Servico($db);
$configSalao = new ConfiguracaoSalao($db);

// Pega os dados postados
$data = json_decode(file_get_contents("php://input"));

// Validação básica dos dados de entrada
if (
    !is_object($data) ||
    empty($data->cpf_cliente) || // Do frontend virá como clientCpf
    empty($data->id_servico) ||
    empty($data->data_agendamento) || // YYYY-MM-DD
    empty($data->hora_inicio) || // HH:MM
    !isset($data->termos_aceitos) || $data->termos_aceitos !== true
) {
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos ou termos não aceitos. Campos obrigatórios: cpf_cliente, id_servico, data_agendamento, hora_inicio, termos_aceitos (true)."]);
    exit();
}

// --- Atribuir e Sanitizar Dados ---
$agendamento->cpf_cliente_agendamento = htmlspecialchars(strip_tags($data->cpf_cliente));
$agendamento->id_servico = (int)$data->id_servico;
$agendamento->data_agendamento = htmlspecialchars(strip_tags($data->data_agendamento));
$agendamento->hora_inicio = htmlspecialchars(strip_tags($data->hora_inicio)); // Ex: "10:00"
$agendamento->termos_aceitos = (bool)$data->termos_aceitos;
$agendamento->observacoes_cliente = isset($data->observacoes_cliente) ? htmlspecialchars(strip_tags($data->observacoes_cliente)) : null;
$agendamento->nome_cliente_agendamento = isset($data->nome_cliente) ? htmlspecialchars(strip_tags($data->nome_cliente)) : null; // Para novos clientes
$agendamento->status_agendamento = 'agendado'; // Status inicial

// Definir fuso horário para cálculos de data/hora
if ($configSalao->read()) {
    date_default_timezone_set($configSalao->fuso_horario ?: 'America/Sao_Paulo');
} else {
    http_response_code(500);
    echo json_encode(["message" => "Erro ao carregar configurações do salão para fuso horário."]);
    exit();
}

// --- Validações Adicionais ---
// 1. Validar formato da data e hora
try {
    $dataAgendamentoObj = new DateTime($agendamento->data_agendamento . ' ' . $agendamento->hora_inicio);
    $agora = new DateTime();
    if ($dataAgendamentoObj < $agora && $dataAgendamentoObj->format('Y-m-d') === $agora->format('Y-m-d')) {
        // Permite agendar no passado se for para fins de teste/admin, mas para cliente idealmente não
        // A lógica de availability já deve ter coberto isso, mas é um double check.
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["message" => "Formato de data ou hora inválido."]);
    exit();
}

// 2. Buscar informações do serviço para calcular hora_fim e validar
$servicoModel->id = $agendamento->id_servico;
if (!$servicoModel->readOne() || !$servicoModel->status) {
    http_response_code(404);
    echo json_encode(["message" => "Serviço selecionado não encontrado ou inativo."]);
    exit();
}
$duracao_servico_minutos = $servicoModel->duracao_minutos;
$agendamento->hora_fim = (clone $dataAgendamentoObj)->modify("+" . $duracao_servico_minutos . " minutes")->format('H:i:s');


// 3. Verificar/Criar Cliente Final
$clienteFinal->cpf = $agendamento->cpf_cliente_agendamento;
if ($clienteFinal->readByCpf()) {
    $agendamento->id_cliente_final = $clienteFinal->id;
    // Se o cliente já existe, o nome_cliente_agendamento pode ser atualizado se fornecido ou mantido
    $agendamento->nome_cliente_agendamento = $agendamento->nome_cliente_agendamento ?? $clienteFinal->nome_completo;
} else {
    // Se o cliente não existe, tenta criar
    if (!empty($agendamento->nome_cliente_agendamento)) {
        $clienteFinal->nome_completo = $agendamento->nome_cliente_agendamento;
        // Outros campos (telefone, etc.) podem vir do frontend também
        $clienteFinal->telefone_whatsapp = isset($data->telefone_whatsapp_cliente) ? htmlspecialchars(strip_tags($data->telefone_whatsapp_cliente)) : null;
        
        $createClienteResult = $clienteFinal->create(); // O model já trata CPF duplicado, mas aqui o readByCpf já falhou
        if ($createClienteResult === true) {
            $agendamento->id_cliente_final = $clienteFinal->id;
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao tentar criar novo cliente."]);
            exit();
        }
    } else {
        // CPF não encontrado e nome não fornecido para novo cadastro
        http_response_code(400);
        echo json_encode(["message" => "CPF não cadastrado. Por favor, forneça o nome completo para o primeiro agendamento."]);
        exit();
    }
}

// 4. Double-check de disponibilidade (simplificado, a lógica principal está no availability)
//    Verificar se já existe um agendamento para este cliente no mesmo dia
$stmtAgClienteDia = $db->prepare("SELECT id FROM agendamentos WHERE (id_cliente_final = :id_cliente OR cpf_cliente_agendamento = :cpf) AND data_agendamento = :data_ag AND status_agendamento NOT IN ('cancelado_cliente', 'cancelado_salao')");
if ($agendamento->id_cliente_final === null) {
    $stmtAgClienteDia->bindValue(':id_cliente', null, PDO::PARAM_NULL);
} else {
    // Garanta que id_cliente_final é tratado como inteiro se não for nulo
    $idClienteFinalParaBind = (int) $agendamento->id_cliente_final;
    $stmtAgClienteDia->bindParam(':id_cliente', $idClienteFinalParaBind, PDO::PARAM_INT);
}
$stmtAgClienteDia->bindParam(':cpf', $agendamento->cpf_cliente_agendamento);
$stmtAgClienteDia->bindParam(':data_ag', $agendamento->data_agendamento);
$stmtAgClienteDia->execute();
if ($stmtAgClienteDia->rowCount() > 0) {
    http_response_code(409); // Conflict
    echo json_encode(["message" => "Você já possui um agendamento para este dia. Para marcar outro horário, escolha um dia diferente ou contate o salão."]);
    exit();
}
// Poderia adicionar uma verificação mais detalhada de sobreposição de horário aqui também, mas o frontend já usou o availability.

// 5. Gerar hash de confirmação (opcional)
$agendamento->hash_confirmacao = md5(uniqid(rand(), true));


// --- Tentar Criar o Agendamento ---
if ($agendamento->create()) {
    error_log("Agendamentos_create.php: Agendamento ID " . $agendamento->id . " criado. Tentando enviar notificações...");
    // --- Disparar Notificações (Placeholder) ---
   Notification::enviarConfirmacaoAgendamentoCliente($db, $agendamento->id);
   Notification::notificarProprietariaNovoAgendamento($db, $agendamento->id);

    http_response_code(201); // Created
    echo json_encode([
        "message" => "Agendamento realizado com sucesso!",
        "agendamento_id" => $agendamento->id,
        "data" => $agendamento->data_agendamento,
        "hora" => $agendamento->hora_inicio,
        "servico" => $servicoModel->nome
    ]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Não foi possível realizar o agendamento. Tente novamente mais tarde."]);
}

?>