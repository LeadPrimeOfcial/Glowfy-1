<?php
// api/v1/models/ClienteFinal.php

class ClienteFinal {
    private $conn;
    private $table_name = "clientes_finais";

    public $id;
    public $nome_completo;
    public $cpf;
    public $data_nascimento; // YYYY-MM-DD
    public $instagram;
    public $telefone_whatsapp;
    public $data_cadastro;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Ler todos os clientes
    public function read($searchTerm = "") {
        $query = "SELECT id, nome_completo, cpf, data_nascimento, instagram, telefone_whatsapp, data_cadastro 
                  FROM " . $this->table_name;
        
        if (!empty($searchTerm)) {
            $searchTerm = htmlspecialchars(strip_tags($searchTerm));
            $query .= " WHERE nome_completo LIKE :searchTerm OR cpf LIKE :searchTerm";
        }
        $query .= " ORDER BY nome_completo ASC";

        $stmt = $this->conn->prepare($query);

        if (!empty($searchTerm)) {
            $searchTermWildcard = "%{$searchTerm}%";
            $stmt->bindParam(":searchTerm", $searchTermWildcard);
        }
        
        $stmt->execute();
        return $stmt;
    }

    // Ler um único cliente por ID
    public function readOne() {
        $query = "SELECT id, nome_completo, cpf, data_nascimento, instagram, telefone_whatsapp, data_cadastro 
                  FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $num = $stmt->rowCount();
        if ($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->nome_completo = $row['nome_completo'];
            $this->cpf = $row['cpf'];
            $this->data_nascimento = $row['data_nascimento'];
            $this->instagram = $row['instagram'];
            $this->telefone_whatsapp = $row['telefone_whatsapp'];
            $this->data_cadastro = $row['data_cadastro'];
            return true;
        }
        return false;
    }
    
    // Ler um único cliente por CPF
    public function readByCpf() {
        $query = "SELECT id, nome_completo, cpf, data_nascimento, instagram, telefone_whatsapp, data_cadastro 
                  FROM " . $this->table_name . " WHERE cpf = :cpf LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        
        $this->cpf = htmlspecialchars(strip_tags($this->cpf));
        $stmt->bindParam(':cpf', $this->cpf);
        $stmt->execute();

        $num = $stmt->rowCount();
        if ($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id']; // Popular o ID também
            $this->nome_completo = $row['nome_completo'];
            $this->data_nascimento = $row['data_nascimento'];
            $this->instagram = $row['instagram'];
            $this->telefone_whatsapp = $row['telefone_whatsapp'];
            $this->data_cadastro = $row['data_cadastro'];
            return true;
        }
        return false;
    }

    // Criar cliente
    public function create() {
        // Verificar se CPF já existe
        $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE cpf = :cpf LIMIT 0,1";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':cpf', $this->cpf);
        $checkStmt->execute();
        if ($checkStmt->rowCount() > 0) {
            return "CPF_EXISTS"; // Sinaliza que o CPF já existe
        }

        $query = "INSERT INTO " . $this->table_name . " 
                  SET nome_completo=:nome_completo, cpf=:cpf, data_nascimento=:data_nascimento, 
                      instagram=:instagram, telefone_whatsapp=:telefone_whatsapp";
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome_completo = htmlspecialchars(strip_tags($this->nome_completo));
        $this->cpf = htmlspecialchars(strip_tags($this->cpf));
        $this->data_nascimento = !empty($this->data_nascimento) ? htmlspecialchars(strip_tags($this->data_nascimento)) : null;
        $this->instagram = !empty($this->instagram) ? htmlspecialchars(strip_tags($this->instagram)) : null;
        $this->telefone_whatsapp = !empty($this->telefone_whatsapp) ? htmlspecialchars(strip_tags($this->telefone_whatsapp)) : null;

        $stmt->bindParam(":nome_completo", $this->nome_completo);
        $stmt->bindParam(":cpf", $this->cpf);
        $stmt->bindParam(":data_nascimento", $this->data_nascimento);
        $stmt->bindParam(":instagram", $this->instagram);
        $stmt->bindParam(":telefone_whatsapp", $this->telefone_whatsapp);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        error_log("Erro ao criar cliente: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Atualizar cliente
    public function update() {
        // Não permitimos atualização de CPF aqui, pois é um identificador. Se necessário, seria uma operação mais complexa.
        $query = "UPDATE " . $this->table_name . "
                  SET nome_completo = :nome_completo, data_nascimento = :data_nascimento, 
                      instagram = :instagram, telefone_whatsapp = :telefone_whatsapp
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome_completo = htmlspecialchars(strip_tags($this->nome_completo));
        $this->data_nascimento = !empty($this->data_nascimento) ? htmlspecialchars(strip_tags($this->data_nascimento)) : null;
        $this->instagram = !empty($this->instagram) ? htmlspecialchars(strip_tags($this->instagram)) : null;
        $this->telefone_whatsapp = !empty($this->telefone_whatsapp) ? htmlspecialchars(strip_tags($this->telefone_whatsapp)) : null;
        $this->id = (int)htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(':nome_completo', $this->nome_completo);
        $stmt->bindParam(':data_nascimento', $this->data_nascimento);
        $stmt->bindParam(':instagram', $this->instagram);
        $stmt->bindParam(':telefone_whatsapp', $this->telefone_whatsapp);
        $stmt->bindParam(':id', $this->id);

        if ($stmt->execute()) {
            // Verificar se alguma linha foi afetada para confirmar que o ID existia
            return $stmt->rowCount() > 0;
        }
        error_log("Erro ao atualizar cliente: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Deletar cliente
    public function delete() {
        // Considerar o que fazer com agendamentos/vendas associadas (ON DELETE SET NULL, ON DELETE CASCADE ou impedir)
        // Por agora, a tabela agendamentos tem ON DELETE SET NULL para id_cliente_final.
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = (int)htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        error_log("Erro ao deletar cliente: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // Ler agendamentos de um cliente específico
    public function readAppointments() {
        // Esta query junta agendamentos com serviços para pegar o nome do serviço
        $query = "SELECT 
                    a.id as agendamento_id, 
                    a.data_agendamento, 
                    a.hora_inicio, 
                    a.hora_fim, 
                    a.status_agendamento,
                    a.observacoes_cliente,
                    a.data_criacao as agendamento_data_criacao,
                    s.nome as nome_servico,
                    s.duracao_minutos,
                    s.preco as preco_servico
                  FROM agendamentos a
                  JOIN servicos s ON a.id_servico = s.id
                  WHERE a.id_cliente_final = :id_cliente_final
                  ORDER BY a.data_agendamento DESC, a.hora_inicio DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_cliente_final', $this->id);
        $stmt->execute();
        return $stmt;
    }
}
?>