<?php
// api/v1/controllers/servicos_read.php

header("Access-Control-Allow-Origin: *"); // Para desenvolvimento. Em produção, restrinja.
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Incluir arquivos de configuração e modelo
include_once '../config/Database.php';
include_once '../models/Servico.php';

// Instanciar banco de dados e conectar
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503); // Service Unavailable
    echo json_encode(array("message" => "Não foi possível conectar ao banco de dados."));
    exit();
}

// Instanciar objeto Servico
$servico = new Servico($db);

// Verificar se um ID foi passado na URL (para buscar um único serviço)
// Exemplo de URL para um serviço: servicos_read.php?id=1
$servico_id = null;
if (isset($_GET['id'])) {
    $servico_id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
}

if ($servico_id) {
    // Buscar um único serviço
    $servico->id = $servico_id;
    if ($servico->readOne()) {
        $servico_arr = array(
            "id" => $servico->id,
            "nome" => $servico->nome,
            "duracao_minutos" => $servico->duracao_minutos,
            "preco" => $servico->preco,
            "status" => $servico->status, // Já é booleano pelo model
            "data_criacao" => $servico->data_criacao,
            "data_atualizacao" => $servico->data_atualizacao
        );
        http_response_code(200); // OK
        echo json_encode($servico_arr);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Serviço não encontrado."));
    }
} else {
    // Listar todos os serviços
    $stmt = $servico->read();
    $num = $stmt->rowCount();

    if ($num > 0) {
        $servicos_arr = array();
        $servicos_arr["records"] = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            extract($row); // Extrai $id, $nome, etc.
            $servico_item = array(
                "id" => $id,
                "nome" => $nome,
                "duracao_minutos" => $duracao_minutos,
                "preco" => $preco,
                "status" => (bool)$status, // Garantir que seja booleano
                "data_criacao" => $data_criacao,
                "data_atualizacao" => $data_atualizacao
            );
            array_push($servicos_arr["records"], $servico_item);
        }
        http_response_code(200); // OK
        echo json_encode($servicos_arr);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Nenhum serviço encontrado."));
    }
}
?>