<?php
// api/v1/controllers/relatorio_dre.php

ini_set('display_errors', 1); // Mostrar erros na tela (APENAS PARA DEPURAÇÃO)
ini_set('display_startup_errors', 1); // Mostrar erros de inicialização
error_reporting(E_ALL); // Reportar todos os erros

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); // DRE é uma leitura
// ... (outros headers CORS e preflight) ...

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once __DIR__ . '/../core/AuthMiddleware.php';
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Relatorio.php'; // Ou Relatorio.php

$auth = new AuthMiddleware();
$auth->getDecodedToken();

$database = new Database();
$db = $database->getConnection();
if (!$db) { http_response_code(503); echo json_encode(["message" => "Erro BD."]); exit(); }

$relatorioModel = new Relatorio($db); // Ou new Relatorio($db)

// Validar datas de entrada
$data_inicio = isset($_GET['data_inicio']) ? $_GET['data_inicio'] : null;
$data_fim = isset($_GET['data_fim']) ? $_GET['data_fim'] : null;

if (!$data_inicio || !$data_fim) {
    http_response_code(400);
    echo json_encode(["message" => "Parâmetros 'data_inicio' e 'data_fim' (YYYY-MM-DD) são obrigatórios."]);
    exit();
}

// Validar formato das datas (simples)
if (!preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $data_inicio) ||
    !preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $data_fim)) {
    http_response_code(400);
    echo json_encode(["message" => "Formato de data inválido. Use YYYY-MM-DD."]);
    exit();
}

$dre = $relatorioModel->gerarDRE($data_inicio, $data_fim);

if ($dre) {
    http_response_code(200);
    echo json_encode($dre);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Erro ao gerar relatório DRE."]);
}
?>