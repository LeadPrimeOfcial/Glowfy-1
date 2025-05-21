<?php
// api/v1/controllers/teste_protegido.php

// Headers CORS e Content-Type
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS"); // Permitir GET para este teste
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Incluir o middleware de autenticação
require_once __DIR__ . '/../core/AuthMiddleware.php'; // Ajuste o caminho se necessário

$auth = new AuthMiddleware();
$dadosToken = $auth->getDecodedToken(); // Se o token for inválido, o script morrerá aqui com erro 401

// Se chegou até aqui, o token é válido.
// $dadosToken contém o payload do JWT (incluindo os dados do usuário em $dadosToken->data)

http_response_code(200);
echo json_encode(array(
    "message" => "Acesso à rota protegida concedido!",
    "usuario_id" => isset($dadosToken->data->id) ? $dadosToken->data->id : 'ID não encontrado no token',
    "usuario_email" => isset($dadosToken->data->email) ? $dadosToken->data->email : 'Email não encontrado no token',
    "dados_completos_token" => $dadosToken // Para depuração, mostra todo o payload
));
?>
```