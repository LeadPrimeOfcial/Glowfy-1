<?php
// api/v1/cron/enviar_lembretes.php
// Este script será executado por um Cron Job

// Definir o diretório base para includes corretos
define('BASE_PATH', dirname(__DIR__)); // Isso será api/v1/

require_once BASE_PATH . '/config/Database.php';
require_once BASE_PATH . '/models/Agendamento.php'; // Se precisar de métodos do model Agendamento
require_once BASE_PATH . '/models/ConfiguracaoSalao.php';
require_once BASE_PATH . '/core/Notification.php'; // Nossa classe de notificação

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    error_log("Cron Lembretes: Erro ao conectar ao banco.");
    exit("DB Connection Error\n");
}

$configSalao = new ConfiguracaoSalao($db);
if ($configSalao->read()) {
    date_default_timezone_set($configSalao->fuso_horario ?: 'America/Sao_Paulo');
} else {
    error_log("Cron Lembretes: Erro ao carregar configurações do salão.");
    exit("Config Error\n");
}

$amanha = new DateTime('tomorrow');
$data_amanha_str = $amanha->format('Y-m-d');

error_log("Cron Lembretes: Iniciando para data " . $data_amanha_str);

// Buscar agendamentos para amanhã que ainda não receberam lembrete e estão 'agendado' ou 'confirmado_cliente'
$queryLembretes = "SELECT id FROM agendamentos 
                   WHERE data_agendamento = :data_amanha 
                   AND status_agendamento IN ('agendado', 'confirmado_cliente')
                   AND notificacao_lembrete_enviada = FALSE";

$stmt = $db->prepare($queryLembretes);
$stmt->bindParam(':data_amanha', $data_amanha_str);
$stmt->execute();

$agendamentosParaLembrete = $stmt->fetchAll(PDO::FETCH_ASSOC);
$contador = 0;

if ($agendamentosParaLembrete) {
    foreach ($agendamentosParaLembrete as $ag) {
        error_log("Cron Lembretes: Tentando enviar lembrete para agendamento ID: " . $ag['id']);
        if (Notification::enviarLembreteAgendamentoCliente($db, $ag['id'])) {
            $contador++;
            error_log("Cron Lembretes: Lembrete enviado para agendamento ID: " . $ag['id']);
        } else {
            error_log("Cron Lembretes: Falha ao enviar lembrete para agendamento ID: " . $ag['id']);
        }
        // Pequena pausa para não sobrecarregar o N8N/Evolution API (opcional)
        // sleep(1); 
    }
}
error_log("Cron Lembretes: Finalizado. $contador lembretes enviados para $data_amanha_str.");
echo "Cron Lembretes: Finalizado. $contador lembretes enviados para $data_amanha_str.\n";
?>