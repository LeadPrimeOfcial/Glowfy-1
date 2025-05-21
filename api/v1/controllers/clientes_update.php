<?php
// api/v1/controllers/clientes_update.php

// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Usaremos POST para update
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

// Verificar se o ID do cliente e os dados necessários foram enviados
// Não permitimos alteração de CPF aqui. Nome completo é obrigatório para update.
if (
    is_object($data) &&
    !empty($data->id) && is_numeric($data->id) &&
    !empty($data->nome_completo)
    // data_nascimento, instagram, telefone_whatsapp são opcionais
) {
    // Atribuir valores ao objeto ClienteFinal
    $cliente->id = (int)$data->id;
    $cliente->nome_completo = $data->nome_completo; // Model irá sanitizar

    // Atribuir campos opcionais se existirem (se não vierem, o model os manterá como null ou não os atualizará se o SQL for construído dinamicamente)
    // O model atualizado trata campos vazios como nulos se apropriado.
    $cliente->data_nascimento = isset($data->data_nascimento) ? $data->data_nascimento : null;
    $cliente->instagram = isset($data->instagram) ? $data->instagram : null;
    $cliente->telefone_whatsapp = isset($data->telefone_whatsapp) ? $data->telefone_whatsapp : null;
    // CPF não é atualizado aqui

    // Tentar atualizar o cliente
    if ($cliente->update()) { // O model->update() agora retorna true se rowCount > 0
        http_response_code(200); // OK
        echo json_encode(array("message" => "Cliente atualizado com sucesso."));
    } else {
        // Se rowCount for 0, o cliente com o ID fornecido pode não existir
        // Ou pode ter ocorrido um erro de banco (o model agora loga o erro)
        // Para diferenciar, precisaríamos que o model->update() retornasse um código específico ou que verificássemos a existência antes.
        // Por ora, uma mensagem genérica se update() retorna false.
        // Se o update() no model verificar a existência e retornar false se não encontrar, poderíamos usar 404.
        
        // Vamos testar se o cliente existe para dar um 404 mais preciso
        $testCliente = new ClienteFinal($db);
        $testCliente->id = $cliente->id;
        if (!$testCliente->readOne()) {
            http_response_code(404); // Not Found
            echo json_encode(array("message" => "Não foi possível atualizar. Cliente com o ID fornecido não encontrado."));
        } else {
            http_response_code(503); // Service Unavailable ou pode ser que nenhum dado foi alterado
            echo json_encode(array("message" => "Não foi possível atualizar o cliente ou nenhum dado foi alterado. Verifique os logs do servidor."));
        }
    }
} else {
    // Dados incompletos ou inválidos
    http_response_code(400); // Bad Request
    $missingOrInvalid = [];
    if (empty($data->id) || !is_numeric($data->id)) $missingOrInvalid[] = "ID do cliente (numérico)";
    if (empty($data->nome_completo)) $missingOrInvalid[] = "nome_completo";

    echo json_encode(array("message" => "Não foi possível atualizar o cliente. Dados obrigatórios ausentes ou inválidos: " . implode(", ", $missingOrInvalid)));
}
?>