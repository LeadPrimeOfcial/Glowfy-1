<?php
// api/v1/core/AuthMiddleware.php

// Incluir autoload do Composer para carregar a biblioteca JWT
require_once __DIR__ . '/../../vendor/autoload.php'; // Ajuste se o vendor estiver em outro local relativo
require_once __DIR__ . '/../config/Settings.php'; // Nossa chave secreta JWT e configurações

use Firebase\JWT\JWT;
use Firebase\JWT\Key; // Importante para a v6+ da firebase/php-jwt
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Firebase\JWT\BeforeValidException;

class AuthMiddleware {
    private $secretKey;

    public function __construct() {
        $this->secretKey = JWT_SECRET_KEY;
    }

    public function getDecodedToken() {
        $authHeader = null;

        // Tenta pegar o header de autorização de várias formas comuns
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) { // Para algumas configs de Apache
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : null);
        }
        
        if (!$authHeader) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acesso negado. Token de autorização não fornecido."));
            exit();
        }

        // O header deve ser no formato "Bearer <token>"
        $arr = explode(" ", $authHeader);
        if (count($arr) < 2 || $arr[0] !== 'Bearer') {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acesso negado. Formato do token inválido. Use: Bearer [token]"));
            exit();
        }
        
        $jwt = $arr[1];

        if ($jwt) {
            try {
                // Para firebase/php-jwt v6+, use new Key()
                // Para v5.x, o terceiro argumento é apenas a chave secreta ($this->secretKey)
                // e o quarto é um array de algoritmos (ex: ['HS256'])
                // Verifique a versão da sua biblioteca firebase/php-jwt instalada.
                // Se você usou "firebase/php-jwt": "^v5.5.1", então o decode é diferente:
                // $decoded = JWT::decode($jwt, $this->secretKey, array('HS256'));
                
                // Para v6.0 em diante:
                $decoded = JWT::decode($jwt, $this->secretKey, array('HS256'));
                
                return $decoded;

            } catch (ExpiredException $e) {
                http_response_code(401); // Unauthorized
                echo json_encode(array("message" => "Acesso negado. Token expirado.", "error" => $e->getMessage()));
                exit();
            } catch (SignatureInvalidException $e) {
                http_response_code(401); // Unauthorized
                echo json_encode(array("message" => "Acesso negado. Assinatura do token inválida.", "error" => $e->getMessage()));
                exit();
            } catch (BeforeValidException $e) {
                http_response_code(401); // Unauthorized
                echo json_encode(array("message" => "Acesso negado. Token ainda não é válido (before valid).", "error" => $e->getMessage()));
                exit();
            } catch (Exception $e) { // Outras exceções da biblioteca JWT ou genéricas
                http_response_code(401); // Unauthorized
                echo json_encode(array("message" => "Acesso negado. Token inválido ou erro na decodificação.", "error" => $e->getMessage()));
                exit();
            }
        } else {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acesso negado. Token não encontrado no header."));
            exit();
        }
    }
}
?>