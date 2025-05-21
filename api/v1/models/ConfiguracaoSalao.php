<?php
// api/v1/models/ConfiguracaoSalao.php

class ConfiguracaoSalao {
    private $conn;
    private $table_name = "configuracoes_salao";

    // Assumindo que sempre haverá apenas UM registro de configuração (ID 1, por exemplo)
    // ou que não usaremos ID e sempre pegaremos o primeiro/único registro.
    // Para simplicidade, vamos assumir que a configuração tem id = 1.
    public $id = 1; 
    public $nome_salao;
    public $termos_atendimento;
    public $whatsapp_proprietaria;
    public $antecedencia_minima_agendamento_dia_horas;
    public $limite_atraso_minutos;
    public $permitir_agendamento_mesmo_dia;
    public $fuso_horario; // Adicionado na tabela

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT nome_salao, termos_atendimento, whatsapp_proprietaria, 
                         antecedencia_minima_agendamento_dia_horas, limite_atraso_minutos, 
                         permitir_agendamento_mesmo_dia, fuso_horario
                  FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();
        
        $num = $stmt->rowCount();
        if ($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->nome_salao = $row['nome_salao'];
            $this->termos_atendimento = $row['termos_atendimento'];
            $this->whatsapp_proprietaria = $row['whatsapp_proprietaria'];
            $this->antecedencia_minima_agendamento_dia_horas = (int)$row['antecedencia_minima_agendamento_dia_horas'];
            $this->limite_atraso_minutos = (int)$row['limite_atraso_minutos'];
            $this->permitir_agendamento_mesmo_dia = (bool)$row['permitir_agendamento_mesmo_dia'];
            $this->fuso_horario = $row['fuso_horario'];
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET nome_salao = :nome_salao, termos_atendimento = :termos_atendimento, 
                      whatsapp_proprietaria = :whatsapp_proprietaria, 
                      antecedencia_minima_agendamento_dia_horas = :antecedencia_minima,
                      limite_atraso_minutos = :limite_atraso,
                      permitir_agendamento_mesmo_dia = :permitir_ag_dia,
                      fuso_horario = :fuso_horario
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome_salao = htmlspecialchars(strip_tags($this->nome_salao));
        $this->termos_atendimento = strip_tags($this->termos_atendimento, '<br><p><a><ul><ol><li><strong><em>'); // Permite algumas tags HTML seguras
        $this->whatsapp_proprietaria = htmlspecialchars(strip_tags($this->whatsapp_proprietaria));
        $this->antecedencia_minima_agendamento_dia_horas = (int)$this->antecedencia_minima_agendamento_dia_horas;
        $this->limite_atraso_minutos = (int)$this->limite_atraso_minutos;
        $this->permitir_agendamento_mesmo_dia = $this->permitir_agendamento_mesmo_dia ? 1 : 0;
        $this->fuso_horario = htmlspecialchars(strip_tags($this->fuso_horario));


        $stmt->bindParam(":nome_salao", $this->nome_salao);
        $stmt->bindParam(":termos_atendimento", $this->termos_atendimento);
        $stmt->bindParam(":whatsapp_proprietaria", $this->whatsapp_proprietaria);
        $stmt->bindParam(":antecedencia_minima", $this->antecedencia_minima_agendamento_dia_horas, PDO::PARAM_INT);
        $stmt->bindParam(":limite_atraso", $this->limite_atraso_minutos, PDO::PARAM_INT);
        $stmt->bindParam(":permitir_ag_dia", $this->permitir_agendamento_mesmo_dia, PDO::PARAM_INT);
        $stmt->bindParam(":fuso_horario", $this->fuso_horario);
        $stmt->bindParam(":id", $this->id);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0; // Retorna true se algo foi atualizado
        }
        error_log("Erro ao atualizar configurações do salão: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }
}
?>