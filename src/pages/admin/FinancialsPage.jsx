
    import React from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { DollarSign, TrendingUp, TrendingDown, FileText, PlusCircle } from 'lucide-react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { motion } from 'framer-motion';

    const FinancialStatCard = ({ title, value, icon, trend, color }) => (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="transform transition-all"
        whileHover={{ scale: 1.03, boxShadow: "0px 5px 15px rgba(0,0,0,0.05)"}}
      >
      <Card className={`border-l-4 ${color || 'border-glowfy-primary'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-glowfy-foreground">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-glowfy-foreground">{value}</div>
          {trend && <p className="text-xs text-glowfy-muted-foreground">{trend}</p>}
        </CardContent>
      </Card>
      </motion.div>
    );
    
    const TransactionItem = ({ description, amount, type, date }) => (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-between items-center p-3 border-b border-glowfy-border last:border-b-0 hover:bg-glowfy-muted/30 transition-colors"
      >
        <div>
          <p className="font-medium text-glowfy-foreground">{description}</p>
          <p className="text-xs text-glowfy-muted-foreground">{date}</p>
        </div>
        <p className={`font-semibold ${type === 'revenue' ? 'text-green-500' : 'text-red-500'}`}>
          {type === 'revenue' ? '+' : '-'} R$ {Math.abs(amount).toFixed(2)}
        </p>
      </motion.div>
    );

    const FinancialsPage = () => {
      const stats = [
        { title: "Faturamento Bruto (Mês)", value: "R$ 8.250,00", icon: <DollarSign className="h-5 w-5 text-green-500" />, trend: "+12% vs mês anterior", color: "border-green-500" },
        { title: "Despesas (Mês)", value: "R$ 1.870,50", icon: <TrendingDown className="h-5 w-5 text-red-500" />, trend: "-5% vs mês anterior", color: "border-red-500" },
        { title: "Lucro Líquido (Mês)", value: "R$ 6.379,50", icon: <TrendingUp className="h-5 w-5 text-blue-500" />, trend: "+18% vs mês anterior", color: "border-blue-500" },
      ];

      const transactions = [
        { description: "Venda - Manutenção (Ana P.)", amount: 150.00, type: 'revenue', date: '15/05/2025' },
        { description: "Compra - Esmaltes Cores Novas", amount: -85.90, type: 'expense', date: '14/05/2025' },
        { description: "Venda - 1ª Aplicação (Carla M.)", amount: 220.00, type: 'revenue', date: '14/05/2025' },
        { description: "Pagamento - Aluguel Espaço", amount: -1200.00, type: 'expense', date: '10/05/2025' },
      ];


      return (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent">Financeiro</h1>
              <p className="text-glowfy-muted-foreground">Acompanhe suas receitas, despesas e lucros.</p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button variant="outline" className="border-glowfy-border text-glowfy-foreground hover:bg-glowfy-muted">
                <FileText className="mr-2 h-4 w-4" /> Gerar DRE
              </Button>
              <Button className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Transação
              </Button>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, index) => (
              <FinancialStatCard key={index} {...stat} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Visualize suas últimas movimentações financeiras.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-glowfy-muted mb-4">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="revenue">Receitas</TabsTrigger>
                  <TabsTrigger value="expenses">Despesas</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  {transactions.map((t, i) => <TransactionItem key={i} {...t} />)}
                </TabsContent>
                <TabsContent value="revenue">
                  {transactions.filter(t => t.type === 'revenue').map((t, i) => <TransactionItem key={i} {...t} />)}
                </TabsContent>
                <TabsContent value="expenses">
                  {transactions.filter(t => t.type === 'expense').map((t, i) => <TransactionItem key={i} {...t} />)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      );
    };

    export default FinancialsPage;
  