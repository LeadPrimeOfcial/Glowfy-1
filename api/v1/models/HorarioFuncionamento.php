<?php
// api/v1/models/HorarioFuncionamento.php

class HorarioFuncionamento {
    private $conn;
    private $table_name = "horarios_funcionamento";

    public $id;
    public $dia_semana; // ENUM('MONDAY', 'TUESDAY', ...)
    public $hora_inicio; // TIME
    public $hora_fim; // TIME
    public $ativo; // BOOLEAN
    public $observacao;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Ler todos os horários de funcionamento
    public function readAll() {
        $query = "SELECT id, dia_semana, hora_inicio, hora_fim, ativo, observacao 
                  FROM " . $this->table_name . " ORDER BY FIELD(dia_semana, 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'), hora_inicio ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Atualizar/Salvar um conjunto de horários
    // Esta função irá deletar todos os horários existentes e inserir os novos.
    // É uma abordagem simples para uma tela de configuração onde a semana toda é enviada.
    public function saveAll($horarios) {
        $this->conn->beginTransaction();
        try {
            // 1. Deletar todos os horários existentes
            $deleteQuery = "DELETE FROM " . $this->table_name;
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->execute();

            // 2. Inserir os novos horários
            $insertQuery = "INSERT INTO " . $this->table_name . " 
                            (dia_semana, hora_inicio, hora_fim, ativo, observacao) 
                            VALUES (:dia_semana, :hora_inicio, :hora_fim, :ativo, :observacao)";
            $insertStmt = $this->conn->prepare($insertQuery);

            foreach ($horarios as $horario) {
                // Sanitizar e validar cada campo do $horario
                $dia_semana_valido = in_array(strtoupper($horario->dia_semana), ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
                if (!$dia_semana_valido || !preg_match("/^(?:2[0-3]|[01][0-9]):[0-5][0-9](?::[0-5][0-9])?$/", $horario->hora_inicio) || !preg_match("/^(?:2[0-3]|[01][0-9]):[0-5][0-9](?::[0-5][0-9])?$/", $horario->hora_fim)) {
                    // Se algum dado for inválido, faz rollback e retorna erro
                    $this->conn->rollBack();
                    error_log("Dados de horário inválidos: " . print_r($horario, true));
                    return false; 
                }

                $dia = strtoupper(htmlspecialchars(strip_tags($horario->dia_semana)));
                $inicio = htmlspecialchars(strip_tags($horario->hora_inicio));
                $fim = htmlspecialchars(strip_tags($horario->hora_fim));
                $ativo = isset($horario->ativo) ? (bool)$horario->ativo : true; // Default para true se não especificado
                $observacao = isset($horario->observacao) ? htmlspecialchars(strip_tags($horario->observacao)) : null;

                $insertStmt->bindParam(":dia_semana", $dia);
                $insertStmt->bindParam(":hora_inicio", $inicio);
                $insertStmt->bindParam(":hora_fim", $fim);
                $insertStmt->bindParam(":ativo", $ativo, PDO::PARAM_BOOL);
                $insertStmt->bindParam(":observacao", $observacao);
                
                if (!$insertStmt->execute()) {
                    $this->conn->rollBack();
                    error_log("Erro ao inserir horário: " . implode(" | ", $insertStmt->errorInfo()) . " Dados: " . print_r($horario, true));
                    return false;
                }
            }

            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Erro ao salvar horários: " . $e->getMessage());
            return false;
        }
    }
}
?>