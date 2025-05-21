<?php
// api/v1/core/Notification.php

// Incluir configurações se necessário (ex: URLs dos webhooks)
//require_once __DIR__ . '/../config/Settings.php'; // Se você armazenar URLs de webhook lá

class Notification {

    // Método genérico para enviar dados para um webhook
    private static function sendToWebhook($webhookUrl, $payload) {
        if (empty($webhookUrl)) {
            error_log("URL do webhook não configurada para notificação.");
            return false;
        }

        $ch = curl_init($webhookUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Content-Length: ' . strlen(json_encode($payload))
        ));
        // Adicionar timeout para não prender o script PHP
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 segundos de timeout
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // 5 segundos para conectar

        $response = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        if ($httpcode >= 200 && $httpcode < 300) {
            error_log("Webhook enviado com sucesso para " . $webhookUrl . ". Resposta: " . $response);
            return true;
        } else {
            error_log("Erro ao enviar webhook para " . $webhookUrl . ". HTTP Code: " . $httpcode . ". cURL Error: " . $curl_error . ". Resposta: " . $response);
            return false;
        }
    }

    // --- Notificações para o Cliente ---

    public static function enviarConfirmacaoAgendamentoCliente($db, $agendamentoId) {
        // Buscar dados completos do agendamento, cliente e serviço
        // Esta query é um exemplo, você pode adaptá-la ou criar métodos nos models
        $query = "SELECT 
                    a.data_agendamento, a.hora_inicio,
                    COALESCE(cf.nome_completo, a.nome_cliente_agendamento) as nome_cliente,
                    cf.telefone_whatsapp as whatsapp_cliente,
                    s.nome as nome_servico,
                    conf.termos_atendimento
                  FROM agendamentos a
                  LEFT JOIN clientes_finais cf ON a.id_cliente_final = cf.id
                  JOIN servicos s ON a.id_servico = s.id
                  JOIN configuracoes_salao conf ON conf.id = 1 -- Assumindo ID 1 para config
                  WHERE a.id = :agendamento_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':agendamento_id', $agendamentoId, PDO::PARAM_INT);
        $stmt->execute();
        $details = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($details && !empty($details['whatsapp_cliente'])) {
            $payload = [
                "tipo" => "confirmacao_agendamento_cliente",
                "whatsapp_destino" => $details['whatsapp_cliente'], // Número do cliente
                "nome_cliente" => $details['nome_cliente'],
                "nome_servico" => $details['nome_servico'],
                "data_agendamento" => date('d/m/Y', strtotime($details['data_agendamento'])),
                "hora_inicio" => date('H:i', strtotime($details['hora_inicio'])),
                "termos_atendimento" => $details['termos_atendimento']
                // Adicione mais dados se necessário para o N8N formatar a mensagem
            ];
            // Substitua pela URL real do seu webhook N8N/Evolution
            $webhookUrl = "https://n8n.steemit.com.br/webhook-test/b4ef0395-7c64-41c2-a824-eb3fa8d3a956"; 
            return self::sendToWebhook($webhookUrl, $payload);
        }
        error_log("Não foi possível enviar confirmação para cliente (ag ID: $agendamentoId): dados insuficientes ou WhatsApp não encontrado.");
        return false;
    }

    public static function enviarLembreteAgendamentoCliente($db, $agendamentoId) {
        // Similar a enviarConfirmacaoAgendamentoCliente, mas com mensagem de lembrete
        $query = "SELECT 
                    a.data_agendamento, a.hora_inicio,
                    COALESCE(cf.nome_completo, a.nome_cliente_agendamento) as nome_cliente,
                    cf.telefone_whatsapp as whatsapp_cliente,
                    s.nome as nome_servico,
                    conf.termos_atendimento
                  FROM agendamentos a
                  LEFT JOIN clientes_finais cf ON a.id_cliente_final = cf.id
                  JOIN servicos s ON a.id_servico = s.id
                  JOIN configuracoes_salao conf ON conf.id = 1
                  WHERE a.id = :agendamento_id AND a.notificacao_lembrete_enviada = FALSE"; // Só envia se não foi enviado
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':agendamento_id', $agendamentoId, PDO::PARAM_INT);
        $stmt->execute();
        $details = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($details && !empty($details['whatsapp_cliente'])) {
            $payload = [
                "tipo" => "lembrete_agendamento_cliente",
                "whatsapp_destino" => $details['whatsapp_cliente'],
                "nome_cliente" => $details['nome_cliente'],
                "nome_servico" => $details['nome_servico'],
                "data_agendamento" => date('d/m/Y', strtotime($details['data_agendamento'])),
                "hora_inicio" => date('H:i', strtotime($details['hora_inicio'])),
                "termos_atendimento" => $details['termos_atendimento'],
                "nome_salao" => $details['nome_salao']
            ];
            $webhookUrl = "https://n8n.steemit.com.br/webhook-test/1aa53eb3-1dbf-4f43-bd88-fde6ec705dbb";
            if (self::sendToWebhook($webhookUrl, $payload)) {
                // Marcar que o lembrete foi enviado
                $updateStmt = $db->prepare("UPDATE agendamentos SET notificacao_lembrete_enviada = TRUE WHERE id = :id");
                $updateStmt->bindParam(':id', $agendamentoId, PDO::PARAM_INT);
                $updateStmt->execute();
                return true;
            }
        }
        error_log("Não foi possível enviar lembrete para cliente (ag ID: $agendamentoId): dados insuficientes, WhatsApp não encontrado ou lembrete já enviado.");
        return false;
    }
    
    public static function enviarCupomNaoFiscalCliente($db, $vendaId) {
        // Buscar dados da venda, agendamento, cliente, serviço
        $query = "SELECT 
                    v.valor_total, v.valor_recebido, v.troco, v.data_venda,
                    fp.nome as forma_pagamento_nome,
                    COALESCE(cf.nome_completo, ag.nome_cliente_agendamento) as nome_cliente,
                    cf.telefone_whatsapp as whatsapp_cliente,
                    s.nome as nome_servico,
                    conf.nome_salao
                  FROM vendas v
                  JOIN agendamentos ag ON v.id_agendamento = ag.id
                  LEFT JOIN clientes_finais cf ON ag.id_cliente_final = cf.id
                  JOIN servicos s ON ag.id_servico = s.id
                  JOIN formas_pagamento fp ON v.id_forma_pagamento = fp.id
                  JOIN configuracoes_salao conf ON conf.id = 1
                  WHERE v.id = :venda_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':venda_id', $vendaId, PDO::PARAM_INT);
        $stmt->execute();
        $details = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($details && !empty($details['whatsapp_cliente'])) {
            $payload = [
                "tipo" => "cupom_nao_fiscal_cliente",
                "whatsapp_destino" => $details['whatsapp_cliente'],
                "nome_cliente" => $details['nome_cliente'],
                "nome_servico" => $details['nome_servico'],
                "valor_total" => number_format($details['valor_total'], 2, ',', '.'),
                "valor_recebido" => number_format($details['valor_recebido'], 2, ',', '.'),
                "troco" => number_format($details['troco'], 2, ',', '.'),
                "forma_pagamento" => $details['forma_pagamento_nome'],
                "data_venda" => date('d/m/Y H:i', strtotime($details['data_venda'])),
                "nome_salao" => $details['nome_salao']
            ];
            $webhookUrl = "https://webhook.steemit.com.br/webhook/82f3f48a-dd10-43d9-aaf9-1da80e932ac4";
            return self::sendToWebhook($webhookUrl, $payload);
        }
        error_log("Não foi possível enviar cupom não fiscal para cliente (venda ID: $vendaId): dados insuficientes ou WhatsApp não encontrado.");
        return false;
    }


    // --- Notificações para a Proprietária ---

    public static function notificarProprietariaNovoAgendamento($db, $agendamentoId) {
        // Buscar dados do agendamento, cliente, serviço e config para pegar o whats da proprietária
        $query = "SELECT 
                    a.data_agendamento, a.hora_inicio,
                    COALESCE(cf.nome_completo, a.nome_cliente_agendamento) as nome_cliente,
                    cf.cpf as cpf_cliente,
                    s.nome as nome_servico,
                    conf.whatsapp_proprietaria
                  FROM agendamentos a
                  LEFT JOIN clientes_finais cf ON a.id_cliente_final = cf.id
                  JOIN servicos s ON a.id_servico = s.id
                  JOIN configuracoes_salao conf ON conf.id = 1
                  WHERE a.id = :agendamento_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':agendamento_id', $agendamentoId, PDO::PARAM_INT);
        $stmt->execute();
        $details = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($details && !empty($details['whatsapp_proprietaria'])) {
            $payload = [
                "tipo" => "novo_agendamento_proprietaria",
                "whatsapp_destino" => $details['whatsapp_proprietaria'], // Número da proprietária
                "nome_cliente" => $details['nome_cliente'],
                "cpf_cliente" => $details['cpf_cliente'],
                "nome_servico" => $details['nome_servico'],
                "data_agendamento" => date('d/m/Y', strtotime($details['data_agendamento'])),
                "hora_inicio" => date('H:i', strtotime($details['hora_inicio']))
            ];
            $webhookUrl = "https://webhook.steemit.com.br/webhook/dc4b3dc9-1e07-4a9a-83c8-226f23fe495c";
            return self::sendToWebhook($webhookUrl, $payload);
        }
        error_log("Não foi possível notificar proprietária (ag ID: $agendamentoId): WhatsApp da proprietária não configurado ou dados insuficientes.");
        return false;
    }
}
?>