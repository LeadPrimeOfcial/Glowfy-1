<?php
// api/v1/models/Servico.php

class Servico {
    private $conn;
    private $table_name = "servicos";

    public $id;
    public $nome;
    public $duracao_minutos;
    public $preco;
    public $status; // BOOLEAN (TRUE para ativo, FALSE para inativo)
    public $data_criacao;
    public $data_atualizacao;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Ler todos os serviços
    public function read() {
        $query = "SELECT id, nome, duracao_minutos, preco, status, data_criacao, data_atualizacao 
                  FROM " . $this->table_name . " ORDER BY nome ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Ler um único serviço por ID
    public function readOne() {
        $query = "SELECT id, nome, duracao_minutos, preco, status, data_criacao, data_atualizacao 
                  FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $num = $stmt->rowCount();
        if ($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->nome = $row['nome'];
            $this->duracao_minutos = $row['duracao_minutos'];
            $this->preco = $row['preco'];
            $this->status = (bool)$row['status']; // Converter para booleano
            $this->data_criacao = $row['data_criacao'];
            $this->data_atualizacao = $row['data_atualizacao'];
            return true;
        }
        return false;
    }

    // Criar serviço
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET nome=:nome, duracao_minutos=:duracao_minutos, preco=:preco, status=:status";
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->duracao_minutos = (int)htmlspecialchars(strip_tags($this->duracao_minutos));
        $this->preco = (float)htmlspecialchars(strip_tags($this->preco));
        $this->status = $this->status ? 1 : 0; // Converter booleano para inteiro (1 ou 0) para o BD

        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":duracao_minutos", $this->duracao_minutos);
        $stmt->bindParam(":preco", $this->preco);
        $stmt->bindParam(":status", $this->status, PDO::PARAM_INT); // Especificar tipo para booleano/int

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        // Log do erro se a execução falhar
        error_log("Erro ao criar serviço: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Atualizar serviço
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET nome = :nome, duracao_minutos = :duracao_minutos, preco = :preco, status = :status
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->duracao_minutos = (int)htmlspecialchars(strip_tags($this->duracao_minutos));
        $this->preco = (float)htmlspecialchars(strip_tags($this->preco));
        $this->status = $this->status ? 1 : 0;
        $this->id = (int)htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':duracao_minutos', $this->duracao_minutos);
        $stmt->bindParam(':preco', $this->preco);
        $stmt->bindParam(':status', $this->status, PDO::PARAM_INT);
        $stmt->bindParam(':id', $this->id);

        if ($stmt->execute()) {
            return true;
        }
        error_log("Erro ao atualizar serviço: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Deletar serviço
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = (int)htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        if ($stmt->execute()) {
            return true;
        }
        error_log("Erro ao deletar serviço: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }
}
?>