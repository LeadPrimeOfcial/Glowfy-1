<?php
// api/v1/models/Venda.php

class Venda {
    private $conn;
    private $table_name = "vendas";

    public $id;
    public $id_agendamento;
    public $id_cliente_final; // Pode ser null se não atrelado a cliente cadastrado
    public $cpf_cliente_venda; // CPF do cliente no momento da venda
    public $valor_total;
    public $valor_recebido;
    public $troco;
    public $id_forma_pagamento;
    public $data_venda; // TIMESTAMP
    public $observacoes;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
    $query = "INSERT INTO " . $this->table_name . "
              SET
                 id_agendamento = :id_agendamento,
                 id_cliente_final = :id_cliente_final,
                 cpf_cliente_venda = :cpf_cliente_venda,
                 valor_total = :valor_total,
                 valor_recebido = :valor_recebido,
                 troco = :troco,
                 id_forma_pagamento = :id_forma_pagamento,
                 observacoes = :observacoes";
                 // data_venda é DEFAULT CURRENT_TIMESTAMP no banco

    $stmt = $this->conn->prepare($query);

    // Sanitizar dados (como você já tinha)
    $this->id_agendamento = $this->id_agendamento ? (int)$this->id_agendamento : null;
    $this->id_cliente_final = $this->id_cliente_final ? (int)$this->id_cliente_final : null;
    $this->cpf_cliente_venda = $this->cpf_cliente_venda ? htmlspecialchars(strip_tags($this->cpf_cliente_venda)) : null;
    $this->valor_total = (float)$this->valor_total;
    $this->valor_recebido = isset($this->valor_recebido) ? (float)$this->valor_recebido : null; // Permite nulo se não enviado
    $this->troco = isset($this->troco) ? (float)$this->troco : null; // Permite nulo
    $this->id_forma_pagamento = (int)$this->id_forma_pagamento;
    $this->observacoes = $this->observacoes ? htmlspecialchars(strip_tags($this->observacoes)) : null;

    // Bind dos parâmetros CORRIGIDO para PHP 7.4
    if ($this->id_agendamento === null) {
        $stmt->bindValue(':id_agendamento', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindParam(':id_agendamento', $this->id_agendamento, PDO::PARAM_INT);
    }

    if ($this->id_cliente_final === null) {
        $stmt->bindValue(':id_cliente_final', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindParam(':id_cliente_final', $this->id_cliente_final, PDO::PARAM_INT);
    }

    // Para campos string que podem ser nulos, o bindParam padrão (PDO::PARAM_STR) geralmente lida bem com null.
    // Se quiser ser explícito:
    if ($this->cpf_cliente_venda === null) {
        $stmt->bindValue(':cpf_cliente_venda', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindParam(':cpf_cliente_venda', $this->cpf_cliente_venda, PDO::PARAM_STR);
    }

    $stmt->bindParam(':valor_total', $this->valor_total); // PDO trata float/decimal como string

    if ($this->valor_recebido === null) {
        $stmt->bindValue(':valor_recebido', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindParam(':valor_recebido', $this->valor_recebido);
    }

    if ($this->troco === null) {
        $stmt->bindValue(':troco', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindParam(':troco', $this->troco);
    }

    $stmt->bindParam(':id_forma_pagamento', $this->id_forma_pagamento, PDO::PARAM_INT);

    if ($this->observacoes === null) {
        $stmt->bindValue(':observacoes', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindParam(':observacoes', $this->observacoes, PDO::PARAM_STR);
    }

    if ($stmt->execute()) {
        $this->id = $this->conn->lastInsertId();
        return true;
    }
    error_log("Erro ao criar venda: " . implode(" | ", $stmt->errorInfo()));
    return false;
}
}

?>