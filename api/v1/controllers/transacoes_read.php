<?php
// api/v1/controllers/transacoes_read.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/TransacaoFinanceira.php';

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro BD."]); exit(); }

$transacaoModel = new TransacaoFinanceira($db);

// Pegar parâmetros de filtro da URL
$data_inicio_filtro = isset($_GET['data_inicio']) ? $_GET['data_inicio'] : null;
$data_fim_filtro = isset($_GET['data_fim']) ? $_GET['data_fim'] : null;
$tipo_filtro = isset($_GET['tipo']) ? $_GET['tipo'] : null; // 'receita' ou 'despesa'

// Validar tipo se fornecido
if ($tipo_filtro && !in_array($tipo_filtro, ['receita', 'despesa'])) {
    http_response_code(400);
    echo json_encode(["message" => "Parâmetro 'tipo' inválido. Use 'receita' ou 'despesa'."]);
    exit();
}
// Validar datas se fornecidas (simples)
if (($data_inicio_filtro && !preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $data_inicio_filtro)) ||
    ($data_fim_filtro && !preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $data_fim_filtro))) {
    http_response_code(400);
    echo json_encode(["message" => "Formato de data inválido para filtros. Use YYYY-MM-DD."]);
    exit();
}


$stmt = $transacaoModel->read($data_inicio_filtro, $data_fim_filtro, $tipo_filtro);
$num = $stmt->rowCount();

if ($num > 0) {
    $transacoes_arr = ["records" => []];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $transacao_item = [
            "id" => $id,
            "descricao" => $descricao,
            "tipo_transacao" => $tipo_transacao,
            "valor" => $valor,
            "categoria" => $categoria,
            "id_venda" => $id_venda,
            "data_transacao" => $data_transacao,
            "data_criacao" => $data_criacao
        ];
        array_push($transacoes_arr["records"], $transacao_item);
    }
    http_response_code(200);
    echo json_encode($transacoes_arr);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Nenhuma transação financeira encontrada com os filtros aplicados."]);
}
?>