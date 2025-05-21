<?php
// api/v1/controllers/clientes_read.php

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
include_once __DIR__ . '/../models/ClienteFinal.php';

// -------------------- AUTENTICAÇÃO --------------------
$auth = new AuthMiddleware();
$auth->getDecodedToken(); // Protege o endpoint
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

// Verificar se um ID ou CPF foi passado na URL
$cliente_id = null;
$cliente_cpf = null;
$search_term = null;

if (isset($_GET['id'])) {
    $cliente_id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
} elseif (isset($_GET['cpf'])) {
    $cliente_cpf = htmlspecialchars(strip_tags($_GET['cpf']));
} elseif (isset($_GET['search'])) { // Para buscar por nome ou CPF
    $search_term = htmlspecialchars(strip_tags($_GET['search']));
}


if ($cliente_id) {
    // Buscar um único cliente por ID
    $cliente->id = $cliente_id;
    if ($cliente->readOne()) {
        $cliente_arr = array(
            "id" => $cliente->id,
            "nome_completo" => $cliente->nome_completo,
            "cpf" => $cliente->cpf,
            "data_nascimento" => $cliente->data_nascimento,
            "instagram" => $cliente->instagram,
            "telefone_whatsapp" => $cliente->telefone_whatsapp,
            "data_cadastro" => $cliente->data_cadastro
        );
        http_response_code(200); // OK
        echo json_encode($cliente_arr);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Cliente não encontrado com o ID fornecido."));
    }
} elseif ($cliente_cpf) {
    // Buscar um único cliente por CPF
    $cliente->cpf = $cliente_cpf;
    if ($cliente->readByCpf()) {
        $cliente_arr = array(
            "id" => $cliente->id,
            "nome_completo" => $cliente->nome_completo,
            "cpf" => $cliente->cpf,
            "data_nascimento" => $cliente->data_nascimento,
            "instagram" => $cliente->instagram,
            "telefone_whatsapp" => $cliente->telefone_whatsapp,
            "data_cadastro" => $cliente->data_cadastro
        );
        http_response_code(200); // OK
        echo json_encode($cliente_arr);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Cliente não encontrado com o CPF fornecido."));
    }
} else {
    // Listar todos os clientes ou buscar por termo
    // O método read no model já foi ajustado para aceitar um termo de busca
    $stmt = $cliente->read($search_term);
    $num = $stmt->rowCount();

    if ($num > 0) {
        $clientes_arr = array();
        $clientes_arr["records"] = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            extract($row);
            $cliente_item = array(
                "id" => $id,
                "nome_completo" => $nome_completo,
                "cpf" => $cpf,
                "data_nascimento" => $data_nascimento,
                "instagram" => $instagram,
                "telefone_whatsapp" => $telefone_whatsapp,
                "data_cadastro" => $data_cadastro
            );
            array_push($clientes_arr["records"], $cliente_item);
        }
        http_response_code(200); // OK
        echo json_encode($clientes_arr);
    } else {
        $message = $search_term ? "Nenhum cliente encontrado com o termo de busca." : "Nenhum cliente cadastrado.";
        http_response_code(404); // Not Found
        echo json_encode(array("message" => $message));
    }
}
?>