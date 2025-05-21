<?php
// api/v1/models/BloqueioAgenda.php

class BloqueioAgenda {
    private $conn;
    private $table_name = "bloqueios_agenda";

    public $id;
    public $data_inicio; // Formato YYYY-MM-DD HH:MM:SS
    public $data_fim;    // Formato YYYY-MM-DD HH:MM:SS
    public $motivo;
    public $data_criacao;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Criar um novo bloqueio
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET data_inicio=:data_inicio, data_fim=:data_fim, motivo=:motivo";

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->data_inicio = htmlspecialchars(strip_tags($this->data_inicio));
        $this->data_fim = htmlspecialchars(strip_tags($this->data_fim));
        $this->motivo = $this->motivo ? htmlspecialchars(strip_tags($this->motivo)) : null;

        $stmt->bindParam(":data_inicio", $this->data_inicio);
        $stmt->bindParam(":data_fim", $this->data_fim);
        $stmt->bindParam(":motivo", $this->motivo);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        error_log("Erro ao criar bloqueio de agenda: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Ler todos os bloqueios (pode-se adicionar filtros de data no futuro se necessário)
    public function readAll() {
        $query = "SELECT id, data_inicio, data_fim, motivo, data_criacao 
                  FROM " . $this->table_name . " 
                  ORDER BY data_inicio ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Deletar um bloqueio por ID
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = (int)htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0; // Retorna true se alguma linha foi afetada
        }
        error_log("Erro ao deletar bloqueio de agenda: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Verificar se um determinado slot de tempo está bloqueado
    // $slotInicio é um objeto DateTime, $slotFim é um objeto DateTime
    public static function isSlotBlocked(PDO $db, DateTime $slotInicio, DateTime $slotFim) {
        $query = "SELECT id FROM bloqueios_agenda 
                  WHERE 
                    (data_inicio < :slot_fim AND data_fim > :slot_inicio)";
                    // Condição de sobreposição de intervalos:
                    // (StartA < EndB) and (EndA > StartB)

        $stmt = $db->prepare($query);

        $slotInicioStr = $slotInicio->format('Y-m-d H:i:s');
        $slotFimStr = $slotFim->format('Y-m-d H:i:s');

        $stmt->bindParam(':slot_inicio', $slotInicioStr);
        $stmt->bindParam(':slot_fim', $slotFimStr);

        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
?>