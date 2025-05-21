<?php
// api/v1/models/Relatorio.php

class Relatorio {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function gerarDRE($data_inicio, $data_fim) {
        $dre_data = [
            'periodo' => [
                'inicio' => $data_inicio,
                'fim' => $data_fim,
            ],
            'receitas' => [
                'servicos_agendados' => 0, // Vendas de agendamentos
                'outras_receitas_manuais' => 0, // Transações 'receita' sem id_venda
                'total_receitas_brutas' => 0,
            ],
            'custos_variaveis' => [ // Custos diretamente ligados à prestação do serviço ou venda
                'produtos_utilizados' => 0, // Exemplo, viria de transações 'despesa' com categoria 'Produtos'
                // Adicionar outras categorias de custos variáveis aqui
                'total_custos_variaveis' => 0,
            ],
            'despesas_operacionais' => [ // Despesas fixas e administrativas
                'aluguel' => 0,
                'contas_gerais' => 0, // Água, Luz, Internet
                'marketing' => 0,
                'salarios_comissoes' => 0, // Se aplicável
                'outras_despesas_operacionais' => 0,
                'total_despesas_operacionais' => 0,
            ],
            'resultado' => [
                'lucro_bruto' => 0,        // Total Receitas - Total Custos Variáveis
                'lucro_operacional' => 0,  // Lucro Bruto - Total Despesas Operacionais
                'lucro_liquido' => 0       // Lucro Operacional (pode ter impostos, etc., futuramente)
            ],
            'detalhamento_despesas_categoria' => [], // Para listar despesas por categoria
            'detalhamento_receitas_categoria' => []  // Para listar outras receitas por categoria
        ];

        // 1. Calcular Receitas de Serviços (da tabela Vendas)
        $queryReceitasServicos = "SELECT SUM(v.valor_total) as total
                                  FROM vendas v
                                  WHERE DATE(v.data_venda) BETWEEN :data_inicio AND :data_fim";
        $stmtRS = $this->conn->prepare($queryReceitasServicos);
        $stmtRS->bindParam(':data_inicio', $data_inicio);
        $stmtRS->bindParam(':data_fim', $data_fim);
        $stmtRS->execute();
        $rowRS = $stmtRS->fetch(PDO::FETCH_ASSOC);
        if ($rowRS && $rowRS['total']) {
            $dre_data['receitas']['servicos_agendados'] = (float)$rowRS['total'];
        }

        // 2. Calcular Outras Receitas (da tabela transacoes_financeiras) e detalhar por categoria
        $queryOutrasReceitas = "SELECT SUM(tf.valor) as total, tf.categoria
                                FROM transacoes_financeiras tf
                                WHERE tf.tipo_transacao = 'receita' 
                                AND tf.data_transacao BETWEEN :data_inicio AND :data_fim
                                AND tf.id_venda IS NULL
                                GROUP BY tf.categoria";
        $stmtOR = $this->conn->prepare($queryOutrasReceitas);
        $stmtOR->bindParam(':data_inicio', $data_inicio);
        $stmtOR->bindParam(':data_fim', $data_fim);
        $stmtOR->execute();
        while($rowOR = $stmtOR->fetch(PDO::FETCH_ASSOC)){
            $valor_receita = (float)$rowOR['total'];
            $categoria = $rowOR['categoria'] ?: 'Outras Receitas';
            $dre_data['receitas']['outras_receitas_manuais'] += $valor_receita;
            if (!isset($dre_data['detalhamento_receitas_categoria'][$categoria])) {
                $dre_data['detalhamento_receitas_categoria'][$categoria] = 0;
            }
            $dre_data['detalhamento_receitas_categoria'][$categoria] += $valor_receita;
        }
        
        $dre_data['receitas']['total_receitas_brutas'] = $dre_data['receitas']['servicos_agendados'] + $dre_data['receitas']['outras_receitas_manuais'];

        // 3. Calcular Despesas (agrupadas por categoria)
        $queryDespesas = "SELECT SUM(tf.valor) as total, tf.categoria
                          FROM transacoes_financeiras tf
                          WHERE tf.tipo_transacao = 'despesa'
                          AND tf.data_transacao BETWEEN :data_inicio AND :data_fim
                          GROUP BY tf.categoria";
        $stmtD = $this->conn->prepare($queryDespesas);
        $stmtD->bindParam(':data_inicio', $data_inicio);
        $stmtD->bindParam(':data_fim', $data_fim);
        $stmtD->execute();
        
        while($rowD = $stmtD->fetch(PDO::FETCH_ASSOC)){
            $valor_despesa = (float)$rowD['total'];
            $categoria = strtolower($rowD['categoria'] ?: 'outras');

            if (!isset($dre_data['detalhamento_despesas_categoria'][$rowD['categoria'] ?: 'Outras'])) {
                 $dre_data['detalhamento_despesas_categoria'][$rowD['categoria'] ?: 'Outras'] = 0;
            }
            $dre_data['detalhamento_despesas_categoria'][$rowD['categoria'] ?: 'Outras'] += $valor_despesa;

            // Classificar despesas para DRE
            if ($categoria === 'produtos' || $categoria === 'gasto com produtos') { 
                $dre_data['custos_variaveis']['produtos_utilizados'] += $valor_despesa;
            } elseif ($categoria === 'aluguel') {
                $dre_data['despesas_operacionais']['aluguel'] += $valor_despesa;
            } elseif (in_array($categoria, ['água', 'luz', 'internet', 'contas'])) {
                $dre_data['despesas_operacionais']['contas_gerais'] += $valor_despesa;
            } elseif ($categoria === 'marketing') {
                $dre_data['despesas_operacionais']['marketing'] += $valor_despesa;
            } elseif (in_array($categoria, ['salários', 'comissões'])) {
                 $dre_data['despesas_operacionais']['salarios_comissoes'] += $valor_despesa;
            }
            else {
                $dre_data['despesas_operacionais']['outras_despesas_operacionais'] += $valor_despesa;
            }
        }
        $dre_data['custos_variaveis']['total_custos_variaveis'] = $dre_data['custos_variaveis']['produtos_utilizados']; // Adicionar outros custos variáveis aqui
        $dre_data['despesas_operacionais']['total_despesas_operacionais'] = 
            $dre_data['despesas_operacionais']['aluguel'] +
            $dre_data['despesas_operacionais']['contas_gerais'] +
            $dre_data['despesas_operacionais']['marketing'] +
            $dre_data['despesas_operacionais']['salarios_comissoes'] +
            $dre_data['despesas_operacionais']['outras_despesas_operacionais'];

        // 4. Calcular Resultados
        $dre_data['resultado']['lucro_bruto'] = $dre_data['receitas']['total_receitas_brutas'] - $dre_data['custos_variaveis']['total_custos_variaveis'];
        $dre_data['resultado']['lucro_operacional'] = $dre_data['resultado']['lucro_bruto'] - $dre_data['despesas_operacionais']['total_despesas_operacionais'];
        $dre_data['resultado']['lucro_liquido'] = $dre_data['resultado']['lucro_operacional']; // Simplificado, sem impostos por enquanto

        return $dre_data;
    }
}
?>