<?php
// api/v1/controllers/agendamentos_admin_read.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Agendamento.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro ao conectar ao banco."]); exit(); }

$agendamentoModel = new Agendamento($db);

// Pegar parâmetros de filtro da URL
$data_filtro = isset($_GET['data']) ? $_GET['data'] : null;
$status_filtro = isset($_GET['status']) ? $_GET['status'] : null;
$cliente_filtro_id = isset($_GET['id_cliente']) ? filter_var($_GET['id_cliente'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE) : null;
$servico_filtro_id = isset($_GET['id_servico']) ? filter_var($_GET['id_servico'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE) : null;
$agendamento_id_unico = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE) : null;


if ($agendamento_id_unico) {
    $agendamentoModel->id = $agendamento_id_unico;
    $ag_data = $agendamentoModel->readOneAdmin();
    if ($ag_data) {
        // Converter termos_aceitos para booleano para o JSON
        $ag_data['termos_aceitos'] = (bool)$ag_data['termos_aceitos'];
        http_response_code(200);
        echo json_encode($ag_data);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Agendamento não encontrado."]);
    }
} else {
    $stmt = $agendamentoModel->readAllAdmin($data_filtro, $status_filtro, $cliente_filtro_id, $servico_filtro_id);
    $num = $stmt->rowCount();

    if ($num > 0) {
        $agendamentos_arr = ["records" => []];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            extract($row);
            $agendamento_item = [
                "id" => $id,
                "id_cliente_final" => $id_cliente_final,
                "nome_cliente" => $nome_cliente,
                "cpf_cliente_agendamento" => $cpf_cliente_agendamento,
                "id_servico" => $id_servico,
                "nome_servico" => $nome_servico,
                "duracao_minutos" => $duracao_minutos,
                "data_agendamento" => $data_agendamento,
                "hora_inicio" => $hora_inicio,
                "hora_fim" => $hora_fim,
                "status_agendamento" => $status_agendamento,
                "termos_aceitos" => (bool)$termos_aceitos,
                "observacoes_cliente" => $observacoes_cliente,
                "observacoes_internas" => $observacoes_internas,
                "data_criacao" => $data_criacao
            ];
            array_push($agendamentos_arr["records"], $agendamento_item);
        }
        http_response_code(200);
        echo json_encode($agendamentos_arr);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Nenhum agendamento encontrado com os filtros aplicados."]);
    }
}
?>