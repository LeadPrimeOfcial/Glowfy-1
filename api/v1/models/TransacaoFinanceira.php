<?php
// api/v1/models/TransacaoFinanceira.php

class TransacaoFinanceira {
    private $conn;
    private $table_name = "transacoes_financeiras";

    public $id;
    public $descricao;
    public $tipo_transacao; // ENUM('receita', 'despesa')
    public $valor;          // DECIMAL
    public $categoria;      // VARCHAR (opcional)
    public $id_venda;       // INT (opcional, para vincular a uma venda de serviço/produto)
    public $data_transacao; // DATE
    public $data_criacao;   // TIMESTAMP

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET descricao=:descricao, tipo_transacao=:tipo_transacao, valor=:valor, 
                      categoria=:categoria, id_venda=:id_venda, data_transacao=:data_transacao";
        
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->tipo_transacao = htmlspecialchars(strip_tags($this->tipo_transacao));
        $this->valor = (float)$this->valor;
        $this->categoria = $this->categoria ? htmlspecialchars(strip_tags($this->categoria)) : null;
        $this->id_venda = $this->id_venda ? (int)$this->id_venda : null;
        $this->data_transacao = htmlspecialchars(strip_tags($this->data_transacao));

        $stmt->bindParam(":descricao", $this->descricao);
        $stmt->bindParam(":tipo_transacao", $this->tipo_transacao);
        $stmt->bindParam(":valor", $this->valor);
        $stmt->bindParam(":categoria", $this->categoria);
        
        if ($this->id_venda === null) {
            $stmt->bindValue(":id_venda", null, PDO::PARAM_NULL);
        } else {
            $stmt->bindParam(":id_venda", $this->id_venda, PDO::PARAM_INT);
        }
        $stmt->bindParam(":data_transacao", $this->data_transacao);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        error_log("Erro ao criar transação financeira: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Ler transações (com filtros de data e tipo)
    public function read($data_inicio = null, $data_fim = null, $tipo = null) {
        $query = "SELECT id, descricao, tipo_transacao, valor, categoria, id_venda, data_transacao, data_criacao
                  FROM " . $this->table_name . " WHERE 1=1 ";
        
        $params = [];
        if ($data_inicio) {
            $query .= " AND data_transacao >= :data_inicio ";
            $params[':data_inicio'] = $data_inicio;
        }
        if ($data_fim) {
            $query .= " AND data_transacao <= :data_fim ";
            $params[':data_fim'] = $data_fim;
        }
        if ($tipo) {
            $query .= " AND tipo_transacao = :tipo ";
            $params[':tipo'] = $tipo;
        }
        $query .= " ORDER BY data_transacao DESC, id DESC";

        $stmt = $this->conn->prepare($query);
        // Bind dos parâmetros
        foreach ($params as $key => &$val) {
            $stmt->bindParam($key, $val);
        }
        unset($val);

        $stmt->execute();
        return $stmt;
    }
    
    // Outros métodos CRUD (update, delete) podem ser adicionados se necessário
}
?>