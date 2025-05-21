import React, { useState, useEffect } from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { PlusCircle, Filter, Edit, Trash2, CheckCircle, XCircle, CalendarDays, DollarSign, Ban } from 'lucide-react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
    import { motion } from 'framer-motion';
    import { cn } from '@/lib/utils';
    import { useToast } from '@/components/ui/use-toast';
    import { getAppointments, saveAppointment, updateAppointmentStatus, getServices, getClients, saveSale, getPaymentMethods } from '@/services/bookingService';
    import { Calendar } from '@/components/ui/calendar';

    const AppointmentItem = ({ appointment, onFinalize, onCancel, onEdit }) => {
      const statusClasses = {
        scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
        completed: 'bg-green-100 text-green-700 border-green-300',
        canceled: 'bg-red-100 text-red-700 border-red-300',
      };
      const statusIcons = {
        scheduled: <CalendarDays className="h-4 w-4 mr-1" />,
        completed: <CheckCircle className="h-4 w-4 mr-1" />,
        canceled: <XCircle className="h-4 w-4 mr-1" />,
      };
      const client = getClients().find(c => c.cpf === appointment.cpf);

      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 border border-glowfy-border rounded-lg bg-glowfy-card mb-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-2 sm:mb-0">
              <p className="font-semibold text-glowfy-primary">{appointment.time} - {client ? client.name : appointment.cpf}</p>
              <p className="text-sm text-glowfy-muted-foreground">{appointment.serviceName}</p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-0 flex-wrap">
              <span className={cn('px-2 py-1 text-xs font-medium rounded-full flex items-center mb-1 sm:mb-0', statusClasses[appointment.status] || 'bg-gray-100 text-gray-700 border-gray-300')}>
                {statusIcons[appointment.status]}
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
              {appointment.status === 'scheduled' && (
                <>
                  <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 h-8" onClick={() => onFinalize(appointment)}><DollarSign className="h-4 w-4 mr-1" />Finalizar</Button>
                  <Button variant="ghost" size="icon" className="text-glowfy-accent hover:bg-glowfy-accent/10 h-8 w-8" onClick={() => onEdit(appointment)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10 h-8 w-8" onClick={() => onCancel(appointment.id)}><Ban className="h-4 w-4" /></Button>
                </>
              )}
               {appointment.status === 'completed' && (
                 <Button variant="ghost" size="icon" className="text-glowfy-accent hover:bg-glowfy-accent/10 h-8 w-8" disabled><Edit className="h-4 w-4" /></Button>
               )}
               {appointment.status === 'canceled' && (
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
      const [clients, setClientsState] = useState([]);
      const [paymentMethods, setPaymentMethodsState] = useState([]);
      
      const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
      const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
      const [currentAppointment, setCurrentAppointment] = useState(null);

      const [newAppointmentData, setNewAppointmentData] = useState({
        cpf: '', clientName: '', serviceId: '', date: null, time: ''
      });
      const [finalizeData, setFinalizeData] = useState({
        amountReceived: '', paymentMethod: '', change: 0
      });

      useEffect(() => {
        setAppointmentsState(getAppointments());
        setServicesState(getServices());
        setClientsState(getClients());
        setPaymentMethodsState(getPaymentMethods());
      }, []);

      const handleAddNewAppointment = () => {
        if (!newAppointmentData.cpf || !newAppointmentData.serviceId || !newAppointmentData.date || !newAppointmentData.time) {
            toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
            return;
        }
        const service = services.find(s => s.id === newAppointmentData.serviceId);
        const newApp = {
            id: `app_${Date.now()}`,
            cpf: newAppointmentData.cpf,
            serviceId: service.id,
            serviceName: service.name,
            date: newAppointmentData.date.toISOString().split('T')[0],
            time: newAppointmentData.time,
            duration: service.duration,
            status: 'scheduled',
        };
        saveAppointment(newApp);
        setAppointmentsState(getAppointments());
        setIsNewAppointmentModalOpen(false);
        setNewAppointmentData({ cpf: '', clientName: '', serviceId: '', date: null, time: '' });
        toast({ title: "Sucesso", description: "Novo agendamento criado." });
      };

      const handleFinalizeAppointment = () => {
        if(!currentAppointment) return;
        const service = services.find(s => s.id === currentAppointment.serviceId);
        const saleAmount = service ? service.price : 0;

        if(!finalizeData.paymentMethod || isNaN(parseFloat(finalizeData.amountReceived)) || parseFloat(finalizeData.amountReceived) < saleAmount) {
            toast({ title: "Erro", description: "Valor recebido inválido ou forma de pagamento não selecionada.", variant: "destructive" });
            return;
        }
        
        const sale = {
            id: `sale_${Date.now()}`,
            appointmentId: currentAppointment.id,
            clientId: currentAppointment.cpf,
            serviceId: currentAppointment.serviceId,
            amount: saleAmount,
            amountReceived: parseFloat(finalizeData.amountReceived),
            change: parseFloat(finalizeData.amountReceived) - saleAmount,
            paymentMethod: finalizeData.paymentMethod,
            date: new Date().toISOString(),
        };
        saveSale(sale);
        updateAppointmentStatus(currentAppointment.id, 'completed');
        setAppointmentsState(getAppointments());
        setIsFinalizeModalOpen(false);
        setCurrentAppointment(null);
        setFinalizeData({ amountReceived: '', paymentMethod: '', change: 0 });
        toast({ title: "Sucesso", description: "Atendimento finalizado e venda registrada." });
      };

      const handleCancelAppointment = (appointmentId) => {
        updateAppointmentStatus(appointmentId, 'canceled');
        setAppointmentsState(getAppointments());
        toast({ title: "Agendamento Cancelado", description: "O agendamento foi marcado como cancelado." });
      };

      const openFinalizeModal = (appointment) => {
        setCurrentAppointment(appointment);
        const service = services.find(s => s.id === appointment.serviceId);
        setFinalizeData({ amountReceived: service ? service.price.toString() : '', paymentMethod: '', change: 0 });
        setIsFinalizeModalOpen(true);
      };
      
      const openEditModal = (appointment) => {
        const client = clients.find(c => c.cpf === appointment.cpf);
        setNewAppointmentData({
            cpf: appointment.cpf,
            clientName: client ? client.name : '',
            serviceId: appointment.serviceId,
            date: new Date(appointment.date),
            time: appointment.time,
            id: appointment.id // For editing existing
        });
        setIsNewAppointmentModalOpen(true);
      };

      const handleCpfChange = (e) => {
        const cpf = e.target.value;
        setNewAppointmentData(prev => ({...prev, cpf}));
        const client = clients.find(c => c.cpf === cpf);
        if (client) {
            setNewAppointmentData(prev => ({...prev, clientName: client.name}));
        } else {
            setNewAppointmentData(prev => ({...prev, clientName: ''}));
        }
      };
      
      const calculateChange = () => {
        if(!currentAppointment) return 0;
        const service = services.find(s => s.id === currentAppointment.serviceId);
        const saleAmount = service ? service.price : 0;
        const amountReceived = parseFloat(finalizeData.amountReceived) || 0;
        return Math.max(0, amountReceived - saleAmount).toFixed(2);
      };
      
      const filteredAppointments = (status) => appointments.filter(app => app.status === status);
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(app => app.date === today && app.status === 'scheduled');
      const upcomingAppointments = appointments.filter(app => app.date > today && app.status === 'scheduled');
      const pastAppointments = appointments.filter(app => app.date < today || app.status === 'completed' || app.status === 'canceled');


      return (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent">Agendamentos</h1>
              <p className="text-glowfy-muted-foreground">Gerencie os horários dos seus clientes.</p>
            </div>
            <Dialog open={isNewAppointmentModalOpen} onOpenChange={setIsNewAppointmentModalOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
                  <PlusCircle className="mr-2 h-5 w-5" /> Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-glowfy-card">
                <DialogHeader>
                  <DialogTitle>{newAppointmentData.id ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
                  <DialogDescription>Preencha os dados abaixo.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cpf" className="text-right">CPF Cliente</Label>
                    <Input id="cpf" value={newAppointmentData.cpf} onChange={handleCpfChange} className="col-span-3 bg-transparent" placeholder="000.000.000-00"/>
                  </div>
                  {newAppointmentData.clientName && <p className="text-sm text-glowfy-muted-foreground col-span-4 text-right -mt-2 pr-1">Cliente: {newAppointmentData.clientName}</p>}
                  {!newAppointmentData.clientName && newAppointmentData.cpf.length > 3 && <p className="text-sm text-red-500 col-span-4 text-right -mt-2 pr-1">Cliente não cadastrado. Cadastre na aba Clientes.</p>}
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="service" className="text-right">Serviço</Label>
                    <Select onValueChange={(value) => setNewAppointmentData({...newAppointmentData, serviceId: value})} value={newAppointmentData.serviceId}>
                      <SelectTrigger id="service" className="col-span-3 bg-transparent">
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Data</Label>
                    <Calendar mode="single" selected={newAppointmentData.date} onSelect={(date) => setNewAppointmentData({...newAppointmentData, date})} className="col-span-3 rounded-md border border-glowfy-border p-2"/>
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="time" className="text-right">Horário</Label>
                    <Input id="time" type="time" value={newAppointmentData.time} onChange={(e) => setNewAppointmentData({...newAppointmentData, time: e.target.value})} className="col-span-3 bg-transparent"/>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAddNewAppointment} className="bg-glowfy-primary text-glowfy-primary-foreground hover:bg-glowfy-primary/90">{newAppointmentData.id ? 'Salvar Alterações' : 'Criar Agendamento'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Input type="search" placeholder="Buscar por cliente ou serviço..." className="max-w-sm bg-transparent" />
                <Button variant="outline" className="border-glowfy-border text-glowfy-foreground hover:bg-glowfy-muted">
                  <Filter className="mr-2 h-4 w-4" /> Filtrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 mb-4 bg-glowfy-muted">
                  <TabsTrigger value="today">Hoje ({todayAppointments.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Próximos ({upcomingAppointments.length})</TabsTrigger>
                  <TabsTrigger value="past">Anteriores ({pastAppointments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="today">
                  {todayAppointments.length > 0 ? todayAppointments.map((appt) => <AppointmentItem key={appt.id} appointment={appt} onFinalize={openFinalizeModal} onCancel={handleCancelAppointment} onEdit={openEditModal}/>) : <p className="text-center text-glowfy-muted-foreground py-4">Nenhum agendamento para hoje.</p>}
                </TabsContent>
                <TabsContent value="upcoming">
                  {upcomingAppointments.length > 0 ? upcomingAppointments.map((appt) => <AppointmentItem key={appt.id} appointment={appt} onFinalize={openFinalizeModal} onCancel={handleCancelAppointment} onEdit={openEditModal} />) : <p className="text-center text-glowfy-muted-foreground py-4">Nenhum agendamento futuro.</p>}
                </TabsContent>
                <TabsContent value="past">
                  {pastAppointments.length > 0 ? pastAppointments.map((appt) => <AppointmentItem key={appt.id} appointment={appt} onFinalize={openFinalizeModal} onCancel={handleCancelAppointment} onEdit={openEditModal} />) : <p className="text-center text-glowfy-muted-foreground py-4">Nenhum agendamento anterior.</p>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Finalize Appointment Modal */}
          <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-glowfy-card">
              <DialogHeader>
                <DialogTitle>Finalizar Atendimento</DialogTitle>
                <DialogDescription>Registre os detalhes do pagamento.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm">Serviço: <span className="font-semibold text-glowfy-primary">{currentAppointment?.serviceName}</span></p>
                <p className="text-sm">Valor Total: <span className="font-semibold text-glowfy-primary">R$ {services.find(s => s.id === currentAppointment?.serviceId)?.price.toFixed(2)}</span></p>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paymentMethod" className="text-right">Forma Pgto.</Label>
                  <Select onValueChange={(value) => setFinalizeData({...finalizeData, paymentMethod: value})} value={finalizeData.paymentMethod}>
                    <SelectTrigger id="paymentMethod" className="col-span-3 bg-transparent">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amountReceived" className="text-right">Valor Recebido</Label>
                  <Input id="amountReceived" type="number" value={finalizeData.amountReceived} onChange={(e) => setFinalizeData({...finalizeData, amountReceived: e.target.value})} className="col-span-3 bg-transparent" placeholder="Ex: 100.00"/>
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