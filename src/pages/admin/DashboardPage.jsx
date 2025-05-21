
    import React from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { ArrowUpRight, Users, CalendarDays, DollarSign, Settings } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Link } from 'react-router-dom';

    const StatCard = ({ title, value, icon, trend, linkTo, color }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.03, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)"}}
        className="transform transition-all"
      >
        <Card className={`overflow-hidden border-l-4 ${color || 'border-glowfy-primary'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-glowfy-foreground">{title}</CardTitle>
            {icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-glowfy-primary">{value}</div>
            {trend && <p className="text-xs text-glowfy-muted-foreground">{trend}</p>}
             {linkTo && (
              <Link to={linkTo}>
                <Button variant="link" className="p-0 h-auto text-xs text-glowfy-primary hover:text-glowfy-accent mt-2">
                  Ver Detalhes <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );

    const DashboardPage = () => {
      const stats = [
        { title: "Agendamentos Hoje", value: "12", icon: <CalendarDays className="h-5 w-5 text-glowfy-secondary" />, trend: "+5% vs ontem", linkTo: "/admin/appointments", color: "border-glowfy-secondary" },
        { title: "Novos Clientes (Mês)", value: "34", icon: <Users className="h-5 w-5 text-glowfy-accent" />, trend: "+15% vs mês passado", linkTo: "/admin/clients", color: "border-glowfy-accent" },
        { title: "Faturamento (Mês)", value: "R$ 7.580", icon: <DollarSign className="h-5 w-5 text-green-500" />, trend: "+8% vs mês passado", linkTo: "/admin/financials", color: "border-green-500" },
        { title: "Procedimentos Populares", value: "Manutenção", icon: <Settings className="h-5 w-5 text-purple-500" />, trend: "Esmaltação em segundo", linkTo: "/admin/settings", color: "border-purple-500" },
      ];

      return (
        <div className="space-y-6">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent"
          >
            Painel Principal
          </motion.h1>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Agendamentos</CardTitle>
                  <CardDescription>Visão rápida dos seus próximos compromissos.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Placeholder for upcoming appointments list */}
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-3 bg-glowfy-muted/30 rounded-md hover:bg-glowfy-muted/50 transition-colors">
                      <div>
                        <p className="font-semibold text-glowfy-foreground">Ana Silva</p>
                        <p className="text-xs text-glowfy-muted-foreground">Manutenção - 10:00</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-glowfy-primary text-glowfy-primary hover:bg-glowfy-primary/10">Detalhes</Button>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-glowfy-muted/30 rounded-md hover:bg-glowfy-muted/50 transition-colors">
                      <div>
                        <p className="font-semibold text-glowfy-foreground">Beatriz Costa</p>
                        <p className="text-xs text-glowfy-muted-foreground">1ª Aplicação - 13:30</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-glowfy-primary text-glowfy-primary hover:bg-glowfy-primary/10">Detalhes</Button>
                    </li>
                  </ul>
                  <Link to="/admin/appointments">
                    <Button variant="link" className="mt-4 text-glowfy-primary hover:text-glowfy-accent p-0">Ver todos agendamentos <ArrowUpRight className="ml-1 h-4 w-4" /></Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Últimas ações no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Placeholder for recent activity feed */}
                   <ul className="space-y-2 text-sm text-glowfy-muted-foreground">
                    <li><span className="font-semibold text-glowfy-primary">Novo agendamento:</span> Carla Souza - Esmaltação (Amanhã, 15:00)</li>
                    <li><span className="font-semibold text-glowfy-secondary">Cliente cadastrada:</span> Fernanda Lima</li>
                    <li><span className="font-semibold text-green-500">Venda finalizada:</span> R$ 120,00 - Manutenção c/ Decoração</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      );
    };

    export default DashboardPage;
  