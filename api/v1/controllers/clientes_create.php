<?php
// api/v1/controllers/clientes_create.php

// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
$auth->getDecodedToken(); 
// -----------------------------------------------------

// Instanciar banco de dados e conectar
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503);
    echo json_encode(array("message" => "Não foi possível conectar ao banco de dados."));
    exit();
}

// Instanciar objeto ClienteFinal
$cliente = new ClienteFinal($db);

// Obter dados postados (JSON)
$data = json_decode(file_get_contents("php://input"));

// Validar dados de entrada
if (
    is_object($data) &&
    !empty($data->nome_completo) &&
    !empty($data->cpf)
    // data_nascimento, instagram, telefone_whatsapp são opcionais conforme o modelo
) {
    // Atribuir valores ao objeto ClienteFinal
    $cliente->nome_completo = $data->nome_completo;
    $cliente->cpf = $data->cpf; // O model irá sanitizar
    
    // Atribuir campos opcionais se existirem
    $cliente->data_nascimento = isset($data->data_nascimento) && !empty($data->data_nascimento) ? $data->data_nascimento : null;
    $cliente->instagram = isset($data->instagram) && !empty($data->instagram) ? $data->instagram : null;
    $cliente->telefone_whatsapp = isset($data->telefone_whatsapp) && !empty($data->telefone_whatsapp) ? $data->telefone_whatsapp : null;

    // Tentar criar o cliente
    $createResult = $cliente->create();

    if ($createResult === true) {
        http_response_code(201); // 201 Created
        echo json_encode(array(
            "message" => "Cliente criado com sucesso.",
            "id" => $cliente->id,
            "nome_completo" => $cliente->nome_completo,
            "cpf" => $cliente->cpf,
            "data_nascimento" => $cliente->data_nascimento,
            "instagram" => $cliente->instagram,
            "telefone_whatsapp" => $cliente->telefone_whatsapp
        ));
    } elseif ($createResult === "CPF_EXISTS") {
        http_response_code(409); // 409 Conflict
        echo json_encode(array("message" => "Não foi possível criar o cliente. CPF já cadastrado."));
    } else {
        http_response_code(503); // Service Unavailable (ou 500 Internal Server Error)
        echo json_encode(array("message" => "Não foi possível criar o cliente. Verifique os logs do servidor."));
    }
} else {
    // Dados incompletos ou inválidos
    http_response_code(400); // Bad Request
    $missingFields = [];
    if (empty($data->nome_completo)) $missingFields[] = "nome_completo";
    if (empty($data->cpf)) $missingFields[] = "cpf";
    
    echo json_encode(array(
        "message" => "Não foi possível criar o cliente. Dados obrigatórios ausentes: " . implode(", ", $missingFields) . ". Certifique-se de enviar 'nome_completo' e 'cpf'.",
        "campos_obrigatorios" => ["nome_completo", "cpf"]
    ));
}
?>