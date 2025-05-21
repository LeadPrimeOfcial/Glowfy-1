<?php
// api/v1/models/UsuarioAdmin.php

class UsuarioAdmin {
    // Conexão com o banco e nome da tabela
    private $conn;
    private $table_name = "usuarios_admin";

    // Propriedades do objeto
    public $id;
    public $nome;
    public $email;
    public $senha_hash; // No banco está senha_hash

    // Construtor com $db como conexão com o banco de dados
    public function __construct($db) {
        $this->conn = $db;
    }

    // Método para buscar um usuário pelo email
    public function getByEmail() {
        $query = "SELECT id, nome, email, senha_hash FROM " . $this->table_name . " WHERE email = :email LIMIT 0,1";

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->email = htmlspecialchars(strip_tags($this->email));

        // Bind do email
        $stmt->bindParam(':email', $this->email);

        $stmt->execute();

        $num = $stmt->rowCount();

        if ($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->nome = $row['nome'];
            $this->senha_hash = $row['senha_hash']; // Corrigido para pegar senha_hash
            // Não retornamos a senha_hash para o cliente, mas precisamos dela para verificar
            return true;
        }
        return false;
    }

    // Método para criar um usuário (exemplo, pode não ser usado diretamente pela API pública)
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET nome=:nome, email=:email, senha_hash=:senha_hash";
        $stmt = $this->conn->prepare($query);

        // Sanitizar dados
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->senha_hash = htmlspecialchars(strip_tags($this->senha_hash)); // O hash já é seguro

        // Bind dos valores
        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":senha_hash", $this->senha_hash); // Senha já deve estar "hasheada"

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
}
?>