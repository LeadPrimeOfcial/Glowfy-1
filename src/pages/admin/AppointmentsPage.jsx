// src/pages/admin/AppointmentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter, Edit, Ban, CheckCircle, XCircle, CalendarDays, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
// Ajustado para importar as funções corretas e renomeadas do bookingService
import bookingService from '@/services/bookingService';
import { Calendar } from '@/components/ui/calendar';
import { formatCPF } from '@/lib/utils'; // Importar formatCPF se necessário

// Componente AppointmentItem (sem grandes mudanças, mas depende de 'clients' no estado da página)
const AppointmentItem = ({ appointment, onFinalize, onCancel, onEdit, clients }) => {
    const statusClasses = {
      agendado: 'bg-blue-100 text-blue-700 border-blue-300', // 'scheduled' no seu código original
      finalizado: 'bg-green-100 text-green-700 border-green-300', // 'completed'
      cancelado_salao: 'bg-red-100 text-red-700 border-red-300', // 'canceled'
      cancelado_cliente: 'bg-orange-100 text-orange-700 border-orange-300',
      nao_compareceu: 'bg-gray-100 text-gray-700 border-gray-300'
      // Adicione outros status se necessário
    };
    const statusIcons = {
      agendado: <CalendarDays className="h-4 w-4 mr-1" />,
      finalizado: <CheckCircle className="h-4 w-4 mr-1" />,
      cancelado_salao: <XCircle className="h-4 w-4 mr-1" />,
      cancelado_cliente: <XCircle className="h-4 w-4 mr-1" />,
      nao_compareceu: <XCircle className="h-4 w-4 mr-1" />
    };
  
    // Tenta encontrar o nome do cliente. appointment.nome_cliente já deve vir do backend.
    const clientName = appointment.nome_cliente || appointment.cpf_cliente_agendamento || 'Desconhecido';
  
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 border border-glowfy-border rounded-lg bg-glowfy-card mb-3 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-2 sm:mb-0">
            <p className="font-semibold text-glowfy-primary">{appointment.hora_inicio.substring(0,5)} - {clientName}</p>
            <p className="text-sm text-glowfy-muted-foreground">{appointment.nome_servico}</p>
            <p className="text-xs text-glowfy-muted-foreground">Data: {new Date(appointment.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-0 flex-wrap">
            <span className={cn('px-2 py-1 text-xs font-medium rounded-full flex items-center mb-1 sm:mb-0', statusClasses[appointment.status_agendamento] || 'bg-gray-100 text-gray-700 border-gray-300')}>
              {statusIcons[appointment.status_agendamento] || <CalendarDays className="h-4 w-4 mr-1" />}
              {appointment.status_agendamento.charAt(0).toUpperCase() + appointment.status_agendamento.slice(1).replace('_', ' ')}
            </span>
            {appointment.status_agendamento === 'agendado' || appointment.status_agendamento === 'confirmado_cliente' ? (
              <>
                <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 h-8" onClick={() => onFinalize(appointment)}><DollarSign className="h-4 w-4 mr-1" />Finalizar</Button>
                <Button variant="ghost" size="icon" className="text-glowfy-accent hover:bg-glowfy-accent/10 h-8 w-8" onClick={() => onEdit(appointment)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10 h-8 w-8" onClick={() => onCancel(appointment.id)}><Ban className="h-4 w-4" /></Button>
              </>
            ) : (
                 <Button variant="ghost" size="icon" className="text-glowfy-muted-foreground h-8 w-8" disabled><Edit className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </motion.div>
    );
};
  
const AppointmentsPage = () => {
    const { toast } = useToast();
    const [appointments, setAppointmentsState] = useState([]);
    const [services, setServicesState] = useState([]);
    const [clients, setClientsState] = useState([]); // Para popular select de clientes no modal
    const [paymentMethods, setPaymentMethodsState] = useState([]); // Para popular select de forma de pgto

    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); // Renomeado de isNewAppointmentModalOpen
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null); // Para edição e finalização

    const [appointmentData, setAppointmentData] = useState({ // Renomeado de newAppointmentData
      id_cliente_final: '', // Armazenará o ID do cliente selecionado
      id_servico: '', 
      data_agendamento: null, 
      hora_inicio: '',
      // Campos como cpf e nome_cliente não são necessários aqui se o select de cliente for por nome/ID
      // e o backend resolver o restante.
      // Se precisar de um campo de busca de CPF para popular o select de cliente:
      cpf_busca_cliente: '', 
      observacoes_cliente: '',
      id: null // Para saber se é edição
    });

    const [finalizeData, setFinalizeData] = useState({
      valor_recebido: '', 
      id_forma_pagamento: '', 
      observacoes_venda: ''
      // troco será calculado
    });
    
    const [availableTimesModal, setAvailableTimesModal] = useState([]);
    const [isLoadingAvailabilityModal, setIsLoadingAvailabilityModal] = useState(false);


    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
          const [apptsData, servicesData, clientsData, paymentMethodsData] = await Promise.all([
            bookingService.getAppointments(), 
            bookingService.getAllServicesAdmin(), 
            bookingService.getClients(),
            bookingService.getPaymentMethods() 
          ]);
          
          setAppointmentsState(apptsData.records || []);
          setServicesState(servicesData.records || []);
          setClientsState(clientsData.records || []);
          setPaymentMethodsState(paymentMethodsData.records || []);

        } catch (error) {
          console.error("Erro ao carregar dados da AppointmentsPage:", error);
          toast({ 
            title: "Erro ao carregar dados", 
            description: error.message || "Não foi possível buscar informações.", 
            variant: "destructive" 
          });
        } finally {
          setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
      fetchInitialData();
    }, [fetchInitialData]);
    
    // Buscar horários disponíveis para o modal de novo/editar agendamento
    useEffect(() => {
        if (appointmentData.data_agendamento && appointmentData.id_servico) {
            setIsLoadingAvailabilityModal(true);
            // Para buscar disponibilidade, precisamos do slug da empresa.
            // No painel admin, o backend pode inferir a empresa pelo token do admin.
            // Ou, o clientBookingService.getAvailability precisaria ser adaptado
            // para não exigir slug quando chamado do admin, ou o admin teria um slug padrão.
            // Por agora, vamos assumir que o backend de availability do admin não precisa de slug.
            // Se precisar, a lógica de como o admin informa qual empresa está gerenciando precisa ser revista.
            // Temporariamente, não vamos chamar getAvailability aqui para evitar erros se ele espera slug.
            // Você precisará de um clientBookingService.getAvailabilityAdmin() que não precise de slug.
            // OU, se o seu painel admin é SEMPRE para UMA empresa específica, você pode ter um slug fixo.
            // console.log("Buscando horários para o modal...");
            // clientBookingService.getAvailability(SLUG_DA_EMPRESA_ADMIN, appointmentData.date.toISOString().split('T')[0], appointmentData.serviceId)
            //   .then(data => setAvailableTimesModal(data.availableTimes || []))
            //   .catch(() => setAvailableTimesModal([]))
            //   .finally(() => setIsLoadingAvailabilityModal(false));
            setAvailableTimesModal(['09:00', '09:30', '10:00', '10:30']); // Placeholder
            setIsLoadingAvailabilityModal(false);
        } else {
            setAvailableTimesModal([]);
        }
    }, [appointmentData.data_agendamento, appointmentData.id_servico]);


    const handleInputChange = (e, formType) => {
        const { id, value } = e.target;
        if (formType === 'appointment') {
            let processedValue = value;
            if (id === 'cpf_busca_cliente') {
                processedValue = formatCPF(value);
            }
            setAppointmentData(prev => ({ ...prev, [id]: processedValue }));
        } else if (formType === 'finalize') {
            setFinalizeData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSelectChange = (value, fieldName, formType) => {
         if (formType === 'appointment') {
            setAppointmentData(prev => ({ ...prev, [fieldName]: value }));
             if (fieldName === 'id_cliente_final' && value) {
                const client = clients.find(c => c.id.toString() === value);
                if (client) {
                    setAppointmentData(prev => ({ ...prev, cpf_busca_cliente: client.cpf }));
                }
            }
        } else if (formType === 'finalize') {
            setFinalizeData(prev => ({ ...prev, [fieldName]: value }));
        }
    };
    
    const handleDateChange = (date, fieldName, formType) => {
        if (formType === 'appointment') {
            setAppointmentData(prev => ({ ...prev, [fieldName]: date, hora_inicio: '' })); // Reseta hora ao mudar data
        }
    };


    const handleSubmitAppointment = async () => {
        if (!appointmentData.id_cliente_final || !appointmentData.id_servico || !appointmentData.data_agendamento || !appointmentData.hora_inicio) {
            toast({ title: "Erro", description: "Cliente, serviço, data e horário são obrigatórios.", variant: "destructive" });
            return;
        }
        
        const payload = {
            id_agendamento: appointmentData.id || null, // Envia ID para update, null para create
            id_cliente_final: parseInt(appointmentData.id_cliente_final),
            id_servico: parseInt(appointmentData.id_servico),
            data_agendamento: appointmentData.data_agendamento.toISOString().split('T')[0],
            hora_inicio: appointmentData.hora_inicio,
            // Backend calculará hora_fim, status, termos_aceitos (admin não precisa aceitar)
            observacoes_cliente: appointmentData.observacoes_cliente || null
        };

        try {
            // saveAppointment precisa ser uma função que chama o endpoint de admin apropriado
            await bookingService.saveAppointment(payload, !!appointmentData.id);
            toast({ title: "Sucesso", description: `Agendamento ${appointmentData.id ? 'atualizado' : 'criado'} com sucesso.` });
            setIsModalOpen(false);
            fetchInitialData(); // Rebusca todos os dados
        } catch (error) {
            console.error("Erro ao salvar agendamento:", error);
            toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar o agendamento.", variant: "destructive" });
        }
    };

    const handleFinalizeAppointment = async () => {
        if(!currentAppointment || !finalizeData.id_forma_pagamento || isNaN(parseFloat(finalizeData.valor_recebido))) {
            toast({ title: "Erro", description: "Forma de pagamento e valor recebido são obrigatórios.", variant: "destructive" });
            return;
        }
        const service = services.find(s => s.id === currentAppointment.id_servico);
        const saleAmount = service ? parseFloat(service.preco) : 0;

        if(parseFloat(finalizeData.valor_recebido) < saleAmount) {
            toast({ title: "Erro", description: "Valor recebido não pode ser menor que o valor do serviço.", variant: "destructive" });
            return;
        }
        
        const payload = {
            id_agendamento: currentAppointment.id,
            valor_recebido: parseFloat(finalizeData.valor_recebido),
            id_forma_pagamento: parseInt(finalizeData.id_forma_pagamento),
            observacoes_venda: finalizeData.observacoes_venda || null
        };

        try {
            // updateAppointmentStatus agora aponta para o controller de finalizar
            await bookingService.updateAppointmentStatus('finalize', currentAppointment.id, payload);
            toast({ title: "Sucesso", description: "Atendimento finalizado e venda registrada." });
            setIsFinalizeModalOpen(false);
            setCurrentAppointment(null);
            fetchInitialData(); 
        } catch (error) {
            console.error("Erro ao finalizar agendamento:", error);
            toast({ title: "Erro ao Finalizar", description: error.message || "Não foi possível finalizar o agendamento.", variant: "destructive" });
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        try {
            // updateAppointmentStatus agora aponta para o controller de cancelar
            await bookingService.updateAppointmentStatus('cancel', appointmentId);
            toast({ title: "Agendamento Cancelado", description: "O agendamento foi marcado como cancelado." });
            fetchInitialData();
        } catch (error) {
            console.error("Erro ao cancelar agendamento:", error);
            toast({ title: "Erro ao Cancelar", description: error.message || "Não foi possível cancelar o agendamento.", variant: "destructive" });
        }
    };

    const openModalForNew = () => {
      setCurrentAppointment(null);
      setAppointmentData({ id_cliente_final: '', id_servico: '', data_agendamento: null, hora_inicio: '', observacoes_cliente: '', id: null, cpf_busca_cliente: '' });
      setIsModalOpen(true);
    };

    const openEditModal = (appointment) => {
      setCurrentAppointment(appointment);
      const client = clients.find(c => c.id === appointment.id_cliente_final);
      setAppointmentData({
          id: appointment.id,
          id_cliente_final: appointment.id_cliente_final.toString(),
          cpf_busca_cliente: client ? client.cpf : appointment.cpf_cliente_agendamento, // Para exibição, se necessário
          id_servico: appointment.id_servico.toString(),
          data_agendamento: new Date(appointment.data_agendamento + "T00:00:00"), // Ajustar para objeto Date
          hora_inicio: appointment.hora_inicio.substring(0,5),
          observacoes_cliente: appointment.observacoes_cliente || ''
      });
      setIsModalOpen(true);
    };
    
    const openFinalizeModal = (appointment) => {
      setCurrentAppointment(appointment);
      const service = services.find(s => s.id === appointment.id_servico);
      setFinalizeData({ valor_recebido: service ? service.preco.toString() : '', id_forma_pagamento: '', observacoes_venda: '' });
      setIsFinalizeModalOpen(true);
    };
    
    const calculateChange = () => {
      if(!currentAppointment || !services.length) return '0.00';
      const service = services.find(s => s.id === currentAppointment.id_servico);
      const saleAmount = service ? parseFloat(service.preco) : 0;
      const amountReceived = parseFloat(finalizeData.valor_recebido) || 0;
      return Math.max(0, amountReceived - saleAmount).toFixed(2);
    };
    
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Filtragem no frontend - pode ser otimizada ou movida para backend se a lista for grande
    const getFilteredAppointments = (apps, tab) => {
        if (tab === 'today') return apps.filter(app => app.data_agendamento === todayFormatted && (app.status_agendamento === 'agendado' || app.status_agendamento === 'confirmado_cliente'));
        if (tab === 'upcoming') return apps.filter(app => app.data_agendamento > todayFormatted && (app.status_agendamento === 'agendado' || app.status_agendamento === 'confirmado_cliente'));
        if (tab === 'past') return apps.filter(app => app.data_agendamento < todayFormatted || ['finalizado', 'cancelado_cliente', 'cancelado_salao', 'nao_compareceu'].includes(app.status_agendamento));
        return apps;
    };

    const [activeTab, setActiveTab] = useState('today');
    const displayedAppointments = getFilteredAppointments(appointments, activeTab);


    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Carregando agendamentos...</div>;
    }

    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent">Agendamentos</h1>
            <p className="text-glowfy-muted-foreground">Gerencie os horários dos seus clientes.</p>
          </div>
          <Button onClick={openModalForNew} className="mt-4 sm:mt-0 bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Novo Agendamento
          </Button>
        </motion.div>

        <Card>
          <CardHeader>
            {/* ... Filtros ... (Input de busca e botão de filtro podem ser implementados depois) */}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 mb-4 bg-glowfy-muted">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                <TabsTrigger value="past">Anteriores</TabsTrigger>
              </TabsList>
              {['today', 'upcoming', 'past'].map(tabValue => (
                <TabsContent key={tabValue} value={tabValue}>
                    {displayedAppointments.length > 0 ? 
                        displayedAppointments.map((appt) => (
                            <AppointmentItem 
                                key={appt.id} 
                                appointment={appt} 
                                onFinalize={openFinalizeModal} 
                                onCancel={handleCancelAppointment} 
                                onEdit={openEditModal}
                                clients={clients} // Passa a lista de clientes para o item
                            />
                        )) : 
                        <p className="text-center text-glowfy-muted-foreground py-4">
                            Nenhum agendamento para exibir nesta categoria.
                        </p>
                    }
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal para Novo/Editar Agendamento */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg bg-glowfy-card"> {/* Aumentado o tamanho do modal */}
            <DialogHeader>
              <DialogTitle>{appointmentData.id ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
              <DialogDescription>Preencha os detalhes do agendamento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2"> {/* Scroll interno no modal */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id_cliente_final" className="text-right">Cliente</Label>
                <Select onValueChange={(value) => handleSelectChange(value, 'id_cliente_final', 'appointment')} value={appointmentData.id_cliente_final}>
                  <SelectTrigger id="id_cliente_final" className="col-span-3 bg-transparent">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nome_completo} ({c.cpf})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Opcional: Mostrar CPF do cliente selecionado ou permitir busca por CPF */}
              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cpf_busca_cliente" className="text-right">CPF (Busca)</Label>
                <Input id="cpf_busca_cliente" value={appointmentData.cpf_busca_cliente} onChange={(e) => handleInputChange(e, 'appointment')} className="col-span-3 bg-transparent" placeholder="Digite CPF para buscar"/>
              </div> */}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id_servico" className="text-right">Serviço</Label>
                <Select onValueChange={(value) => handleSelectChange(value, 'id_servico', 'appointment')} value={appointmentData.id_servico}>
                  <SelectTrigger id="id_servico" className="col-span-3 bg-transparent">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.nome} ({s.duracao_minutos} min)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data_agendamento" className="text-right">Data</Label>
                <Calendar 
                    mode="single" 
                    selected={appointmentData.data_agendamento} 
                    onSelect={(date) => handleDateChange(date, 'data_agendamento', 'appointment')} 
                    className="col-span-3 rounded-md border border-glowfy-border p-0" // p-0 para melhor ajuste
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Desabilita dias passados
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hora_inicio" className="text-right">Horário</Label>
                <Select onValueChange={(value) => handleSelectChange(value, 'hora_inicio', 'appointment')} value={appointmentData.hora_inicio} disabled={isLoadingAvailabilityModal || availableTimesModal.length === 0}>
                    <SelectTrigger id="hora_inicio" className="col-span-3 bg-transparent">
                        <SelectValue placeholder={isLoadingAvailabilityModal ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableTimesModal.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="observacoes_cliente" className="text-right">Observações</Label>
                <Input id="observacoes_cliente" value={appointmentData.observacoes_cliente} onChange={(e) => handleInputChange(e, 'appointment')} className="col-span-3 bg-transparent" placeholder="Ex: preferência por esmalte claro"/>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleSubmitAppointment} className="bg-glowfy-primary text-glowfy-primary-foreground hover:bg-glowfy-primary/90">{appointmentData.id ? 'Salvar Alterações' : 'Criar Agendamento'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para Finalizar Atendimento */}
        <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-glowfy-card">
              <DialogHeader>
                <DialogTitle>Finalizar Atendimento</DialogTitle>
                <DialogDescription>Registre os detalhes do pagamento.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm">Cliente: <span className="font-semibold text-glowfy-primary">{currentAppointment?.nome_cliente}</span></p>
                <p className="text-sm">Serviço: <span className="font-semibold text-glowfy-primary">{currentAppointment?.nome_servico}</span></p>
                <p className="text-sm">Valor Total: <span className="font-semibold text-glowfy-primary">R$ {currentAppointment && services.find(s => s.id === currentAppointment.id_servico)?.preco.toFixed(2)}</span></p>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="id_forma_pagamento" className="text-right">Forma Pgto.</Label>
                  <Select onValueChange={(value) => handleSelectChange(value, 'id_forma_pagamento', 'finalize')} value={finalizeData.id_forma_pagamento}>
                    <SelectTrigger id="id_forma_pagamento" className="col-span-3 bg-transparent">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.filter(pm => pm.active).map(pm => <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valor_recebido" className="text-right">Valor Recebido</Label>
                  <Input id="valor_recebido" type="number" value={finalizeData.valor_recebido} onChange={(e) => handleInputChange(e, 'finalize')} className="col-span-3 bg-transparent" placeholder="Ex: 100.00"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="observacoes_venda" className="text-right">Obs. Venda</Label>
                    <Input id="observacoes_venda" value={finalizeData.observacoes_venda} onChange={(e) => handleInputChange(e, 'finalize')} className="col-span-3 bg-transparent" placeholder="Observações da venda"/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="change" className="text-right">Troco</Label>
                  <Input id="change" type="text" value={`R$ ${calculateChange()}`} readOnly className="col-span-3 bg-glowfy-muted border-glowfy-border"/>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleFinalizeAppointment} className="bg-green-600 text-white hover:bg-green-700">Confirmar Pagamento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      </div>
    );
};

export default AppointmentsPage;