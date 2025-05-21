<?php
// api/v1/config/Database.php

class Database {
    private $host = "localhost";
    private $db_name = "u878650516_glowfydb";
    private $username = "u878650516_glowfydb";
    private $password = "Kk17171995@";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        } catch(PDOException $exception) {
            error_log("Erro de conexão com o BD via Database.php: " . $exception->getMessage());
            // Para o teste inicial, vamos retornar null e o script chamador vai lidar com isso.
            return null;
        }
        return $this->conn;
    }
}
?>