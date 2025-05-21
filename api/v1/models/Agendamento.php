<?php
// api/v1/models/Agendamento.php

class Agendamento {
    private $conn;
    private $table_name = "agendamentos";

    public $id;
    public $id_cliente_final;
    public $cpf_cliente_agendamento;
    public $nome_cliente_agendamento;
    public $id_servico;
    public $data_agendamento; // YYYY-MM-DD
    public $hora_inicio; // HH:MM:SS
    public $hora_fim; // HH:MM:SS
    public $status_agendamento;
    public $termos_aceitos;
    public $observacoes_cliente;
    public $observacoes_internas;
    public $hash_confirmacao;
    public $notificacao_lembrete_enviada;
    public $data_criacao;
    public $data_atualizacao;

    // Propriedades para join (opcional, mas útil para listagens)
    public $nome_cliente;
    public $nome_servico;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Método para buscar agendamentos em uma data específica
    public function getByDate($date) {
        $query = "SELECT id, id_servico, hora_inicio, hora_fim, status_agendamento 
                  FROM " . $this->table_name . " 
                  WHERE data_agendamento = :data_agendamento 
                  AND status_agendamento NOT IN ('cancelado_cliente', 'cancelado_salao', 'finalizado', 'nao_compareceu')"; // Considerar apenas agendamentos ativos/pendentes

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":data_agendamento", $date);
        $stmt->execute();
        return $stmt;
    }
    
    // Criar agendamento (será usado pelo endpoint de criação)
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET
                     id_cliente_final = :id_cliente_final,
                     cpf_cliente_agendamento = :cpf_cliente_agendamento,
                     nome_cliente_agendamento = :nome_cliente_agendamento,
                     id_servico = :id_servico,
                     data_agendamento = :data_agendamento,
                     hora_inicio = :hora_inicio,
                     hora_fim = :hora_fim,
                     status_agendamento = :status_agendamento,
                     termos_aceitos = :termos_aceitos,
                     observacoes_cliente = :observacoes_cliente,
                     hash_confirmacao = :hash_confirmacao";

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id_cliente_final = $this->id_cliente_final ? (int)$this->id_cliente_final : null;
        $this->cpf_cliente_agendamento = htmlspecialchars(strip_tags($this->cpf_cliente_agendamento));
        $this->nome_cliente_agendamento = $this->nome_cliente_agendamento ? htmlspecialchars(strip_tags($this->nome_cliente_agendamento)) : null;
        $this->id_servico = (int)$this->id_servico;
        $this->data_agendamento = htmlspecialchars(strip_tags($this->data_agendamento));
        $this->hora_inicio = htmlspecialchars(strip_tags($this->hora_inicio));
        $this->hora_fim = htmlspecialchars(strip_tags($this->hora_fim));
        $this->status_agendamento = htmlspecialchars(strip_tags($this->status_agendamento));
        $this->termos_aceitos = $this->termos_aceitos ? 1 : 0;
        $this->observacoes_cliente = $this->observacoes_cliente ? htmlspecialchars(strip_tags($this->observacoes_cliente)) : null;
        $this->hash_confirmacao = $this->hash_confirmacao ? htmlspecialchars(strip_tags($this->hash_confirmacao)) : null;

        if ($this->id_cliente_final === null) {
    $stmt->bindValue(":id_cliente_final", null, PDO::PARAM_NULL);
} else {
    $stmt->bindParam(":id_cliente_final", $this->id_cliente_final, PDO::PARAM_INT);
}
        $stmt->bindParam(":cpf_cliente_agendamento", $this->cpf_cliente_agendamento);
        $stmt->bindParam(":nome_cliente_agendamento", $this->nome_cliente_agendamento);
        $stmt->bindParam(":id_servico", $this->id_servico);
        $stmt->bindParam(":data_agendamento", $this->data_agendamento);
        $stmt->bindParam(":hora_inicio", $this->hora_inicio);
        $stmt->bindParam(":hora_fim", $this->hora_fim);
        $stmt->bindParam(":status_agendamento", $this->status_agendamento);
        $stmt->bindParam(":termos_aceitos", $this->termos_aceitos, PDO::PARAM_INT);
        $stmt->bindParam(":observacoes_cliente", $this->observacoes_cliente);
        $stmt->bindParam(":hash_confirmacao", $this->hash_confirmacao);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        error_log("Erro ao criar agendamento: " . implode(" | ", $stmt->errorInfo()));
        return false;
    }

    // (Outros métodos CRUD para admin virão depois: readAllAdmin, updateStatus, etc.)
    // ...

    // Dentro da classe Agendamento em api/v1/models/Agendamento.php

// ... (métodos existentes como __construct, getByDate, create) ...

// Ler todos os agendamentos para o painel administrativo (com filtros)
public function readAllAdmin($data_filtro = null, $status_filtro = null, $cliente_filtro_id = null, $servico_filtro_id = null) {
    $query = "SELECT
                a.id,
                a.id_cliente_final,
                COALESCE(cf.nome_completo, a.nome_cliente_agendamento) as nome_cliente,
                a.cpf_cliente_agendamento,
                a.id_servico,
                s.nome as nome_servico,
                s.duracao_minutos,
                a.data_agendamento,
                a.hora_inicio,
                a.hora_fim,
                a.status_agendamento,
                a.termos_aceitos,
                a.observacoes_cliente,
                a.observacoes_internas,
                a.data_criacao
              FROM
                " . $this->table_name . " a
                LEFT JOIN clientes_finais cf ON a.id_cliente_final = cf.id
                JOIN servicos s ON a.id_servico = s.id
              WHERE 1=1"; // Condição base para facilitar a adição de filtros

    $params = [];

    if ($data_filtro) {
        $query .= " AND a.data_agendamento = :data_agendamento";
        $params[':data_agendamento'] = htmlspecialchars(strip_tags($data_filtro));
    }
    if ($status_filtro) {
        $query .= " AND a.status_agendamento = :status_agendamento";
        $params[':status_agendamento'] = htmlspecialchars(strip_tags($status_filtro));
    }
    if ($cliente_filtro_id) {
        $query .= " AND a.id_cliente_final = :id_cliente_final";
        $params[':id_cliente_final'] = (int)$cliente_filtro_id;
    }
    if ($servico_filtro_id) {
        $query .= " AND a.id_servico = :id_servico";
        $params[':id_servico'] = (int)$servico_filtro_id;
    }
    // Adicionar mais filtros conforme necessário (ex: por nome do cliente, etc.)

    $query .= " ORDER BY a.data_agendamento DESC, a.hora_inicio ASC";

    $stmt = $this->conn->prepare($query);
    
    // Bind dos parâmetros se existirem
    foreach ($params as $key => &$val) { // Passar por referência para bindParam
        if(is_int($val)) {
            $stmt->bindParam($key, $val, PDO::PARAM_INT);
        } else {
            $stmt->bindParam($key, $val);
        }
    }
    unset($val); // Quebrar a referência da última variável

    $stmt->execute();
    return $stmt;
}

// Método para atualizar o status de um agendamento
public function updateStatus() {
    $query = "UPDATE " . $this->table_name . "
              SET status_agendamento = :status_agendamento, data_atualizacao = CURRENT_TIMESTAMP
              WHERE id = :id";
    
    $stmt = $this->conn->prepare($query);

    $this->status_agendamento = htmlspecialchars(strip_tags($this->status_agendamento));
    $this->id = (int)$this->id;

    $stmt->bindParam(':status_agendamento', $this->status_agendamento);
    $stmt->bindParam(':id', $this->id);

    if ($stmt->execute()) {
        return $stmt->rowCount() > 0; // Retorna true se alguma linha foi afetada
    }
    error_log("Erro ao atualizar status do agendamento: " . implode(" | ", $stmt->errorInfo()));
    return false;
}

// Método para buscar um agendamento específico por ID (para admin)
public function readOneAdmin() {
     $query = "SELECT
                 a.id, a.id_cliente_final, COALESCE(cf.nome_completo, a.nome_cliente_agendamento) as nome_cliente,
                 a.cpf_cliente_agendamento, a.id_servico, s.nome as nome_servico, s.duracao_minutos, s.preco as preco_servico,
                 a.data_agendamento, a.hora_inicio, a.hora_fim, a.status_agendamento,
                 a.termos_aceitos, a.observacoes_cliente, a.observacoes_internas, a.data_criacao, a.data_atualizacao
               FROM " . $this->table_name . " a
               LEFT JOIN clientes_finais cf ON a.id_cliente_final = cf.id
               JOIN servicos s ON a.id_servico = s.id
               WHERE a.id = :id LIMIT 0,1";
     
     $stmt = $this->conn->prepare($query);
     $this->id = (int)$this->id;
     $stmt->bindParam(':id', $this->id);
     $stmt->execute();

     $num = $stmt->rowCount();
     if($num > 0) {
         $row = $stmt->fetch(PDO::FETCH_ASSOC);
         // Preencher propriedades do objeto se necessário, ou apenas retornar o array
         return $row; 
     }
     return null;
}
    
}
?>