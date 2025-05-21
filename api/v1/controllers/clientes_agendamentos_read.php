<?php
// api/v1/controllers/clientes_agendamentos_read.php

// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Incluir arquivos necessários
require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/ClienteFinal.php'; // Precisamos do ClienteFinal para chamar o método

// -------------------- AUTENTICAÇÃO --------------------
$auth = new AuthMiddleware();
$auth->getDecodedToken();
// -----------------------------------------------------

// Instanciar banco de dados e conectar
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503); // Service Unavailable
    echo json_encode(array("message" => "Não foi possível conectar ao banco de dados."));
    exit();
}

// Instanciar objeto ClienteFinal
$cliente = new ClienteFinal($db);

// Verificar se um ID de cliente foi passado na URL
$cliente_id = null;
if (isset($_GET['id_cliente'])) { // Usaremos id_cliente para clareza
    $cliente_id = filter_var($_GET['id_cliente'], FILTER_VALIDATE_INT);
}

if ($cliente_id) {
    $cliente->id = $cliente_id;

    // Verificar se o cliente existe (opcional, mas bom)
    if (!$cliente->readOne()) {
        http_response_code(404);
        echo json_encode(array("message" => "Cliente com o ID fornecido não encontrado."));
        exit();
    }

    // Listar agendamentos do cliente
    $stmt = $cliente->readAppointments();
    $num = $stmt->rowCount();

    if ($num > 0) {
        $agendamentos_arr = array();
        $agendamentos_arr["records"] = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Extrair os campos como definidos na query do model ClienteFinal->readAppointments()
            // Ex: agendamento_id, data_agendamento, nome_servico, etc.
            extract($row);
            $agendamento_item = array(
                "agendamento_id" => $agendamento_id,
                "data_agendamento" => $data_agendamento,
                "hora_inicio" => $hora_inicio,
                "hora_fim" => $hora_fim,
                "status_agendamento" => $status_agendamento,
                "observacoes_cliente" => $observacoes_cliente,
                "agendamento_data_criacao" => $agendamento_data_criacao,
                "nome_servico" => $nome_servico,
                "duracao_minutos_servico" => $duracao_minutos, // nome da coluna no SQL
                "preco_servico" => $preco_servico
            );
            array_push($agendamentos_arr["records"], $agendamento_item);
        }
        http_response_code(200); // OK
        echo json_encode($agendamentos_arr);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Nenhum agendamento encontrado para este cliente."));
    }
} else {
    // ID do cliente não fornecido ou inválido
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "ID do cliente não fornecido ou inválido. Use ?id_cliente=<numero>."));
}
?>