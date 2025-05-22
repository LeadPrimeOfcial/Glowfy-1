// src/pages/admin/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Save, Clock, Scissors, FileText, ShieldCheck, PlusCircle, Trash2, DollarSign, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
// Importações ajustadas: getTerms e saveTerms removidos
import { 
    getSettingsAdmin, // <<< MUDOU DE getSettings para getSettingsAdmin
    saveSettingsAdmin, // <<< MUDOU DE saveSettings para saveSettingsAdmin
    getAllServicesAdmin, 
    saveService, 
    deleteService, 
    getWorkingHoursAdmin, // <<< MUDOU DE getWorkingHours para getWorkingHoursAdmin
    saveWorkingHoursAdmin, // <<< MUDOU DE saveWorkingHours para saveWorkingHoursAdmin
    getAllPaymentMethodsAdmin, 
    savePaymentMethod, // Idealmente seria savePaymentMethodAdmin
    deletePaymentMethod  // Idealmente seria deletePaymentMethodAdmin
} from '@/services/bookingService'; // getTerms e saveTerms removidos

const SettingsPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Estado para Configurações Gerais (incluindo termos)
  const [generalSettings, setGeneralSettings] = useState({ 
    nome_salao: "", 
    termos_atendimento: "", // Os termos virão aqui
    whatsapp_proprietaria: "",
    antecedencia_minima_agendamento_dia_horas: 3, // Valor padrão
    limite_atraso_minutos: 15, // Valor padrão
    permitir_agendamento_mesmo_dia: true, // Valor padrão
    fuso_horario: "America/Sao_Paulo" // Valor padrão
    // Adicione outros campos que vêm de config_geral_read.php
  });

  // Aba Serviços
  const [services, setServicesState] = useState([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState({ id: null, nome: '', duracao_minutos: '', preco: '', status: true });
  
  // Aba Horários
  const [workingHours, setWorkingHoursState] = useState({});
  
  // Aba Formas de Pagamento
  const [paymentMethods, setPaymentMethodsState] = useState([]);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState({ id: null, nome: '', active: true });

  // Função para buscar todos os dados iniciais
  const fetchAllAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        settingsData, 
        servicesData, 
        workingHoursData, 
        paymentMethodsData
      ] = await Promise.all([
        getSettingsAdmin(),
        getAllServicesAdmin(),
        getWorkingHoursAdmin()(),
        getAllPaymentMethodsAdmin() // Esta ainda é um placeholder no bookingService.js
      ]);

      setGeneralSettings({
        nome_salao: settingsData?.nome_salao || "Nome do Salão Padrão",
        termos_atendimento: settingsData?.termos_atendimento || "",
        whatsapp_proprietaria: settingsData?.whatsapp_proprietaria || "",
        antecedencia_minima_agendamento_dia_horas: settingsData?.antecedencia_minima_agendamento_dia_horas ?? 3,
        limite_atraso_minutos: settingsData?.limite_atraso_minutos ?? 15,
        permitir_agendamento_mesmo_dia: settingsData?.permitir_agendamento_mesmo_dia ?? true,
        fuso_horario: settingsData?.fuso_horario || 'America/Sao_Paulo'
      });
      setServicesState(servicesData?.records || []);
      setWorkingHoursState(workingHoursData || {}); 
      setPaymentMethodsState(paymentMethodsData?.records || []);

    } catch (error) {
      console.error("Erro ao carregar dados da SettingsPage:", error);
      toast({
        title: "Erro ao Carregar Configurações",
        description: error.message || "Não foi possível buscar as informações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  // Handlers para Aba Geral e Termos (usando o mesmo estado generalSettings)
  const handleGeneralSettingsChange = (e) => {
    const { id, value, type, checked } = e.target;
    // Para Textarea, o 'id' será o nome da propriedade em generalSettings
    const keyToUpdate = id === 'termsText' ? 'termos_atendimento' : id;
    setGeneralSettings(prev => ({ ...prev, [keyToUpdate]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveGeneralSettings = async () => {
    try {
      await saveSettingsAdmin(generalSettings);
      toast({ title: "Configurações Salvas!", description: "As informações gerais e termos foram atualizados." });
      fetchAllAdminData(); // Rebusca para confirmar e pegar timestamps atualizados se houver
    } catch (error) {
      toast({ title: "Erro", description: error.message || "Não foi possível salvar as configurações.", variant: "destructive"});
    }
  };
  
  // Handlers para Aba Serviços
  const handleServiceInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    let processedValue = value;
    if (type === 'checkbox') {
        processedValue = Boolean(checked);
    } else if (type === 'number') {
        processedValue = value === '' ? '' : parseFloat(value); // Permite campo vazio para número
        if (isNaN(processedValue)) processedValue = 0; // Ou mantenha como string vazia para validação
    }
    setCurrentService(prev => ({ ...prev, [id]: processedValue }));
  };

  const handleSaveCurrentService = async () => {
    if (!currentService.nome || !currentService.duracao_minutos || currentService.preco === undefined || currentService.preco < 0) {
        toast({ title: "Erro de Validação", description: "Nome, duração positiva e preço válido são obrigatórios.", variant: "destructive"});
        return;
    }
    const serviceToSave = {
        ...currentService,
        duracao_minutos: parseInt(currentService.duracao_minutos, 10),
        preco: parseFloat(currentService.preco),
        status: Boolean(currentService.status) // Garante booleano
    };
    try {
        await saveService(serviceToSave, !!currentService.id);
        toast({ title: "Serviço Salvo!", description: `Serviço ${currentService.nome} foi salvo.` });
        setIsServiceModalOpen(false);
        fetchAllAdminData(); // Rebusca
    } catch (error) {
        toast({ title: "Erro ao Salvar Serviço", description: error.message || "Não foi possível salvar o serviço.", variant: "destructive"});
    }
  };
  
  const handleEditService = (service) => {
    setCurrentService({
        id: service.id,
        nome: service.nome,
        duracao_minutos: service.duracao_minutos.toString(), // Inputs numéricos esperam string
        preco: service.preco.toString(),                   // Inputs numéricos esperam string
        status: service.status
    });
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = async (serviceId) => {
    try {
        await deleteService(serviceId);
        toast({ title: "Serviço Removido!", description: "O serviço foi removido." });
        fetchAllAdminData(); // Rebusca
    } catch (error) {
        toast({ title: "Erro ao Remover Serviço", description: error.message || "Não foi possível remover o serviço.", variant: "destructive" });
    }
  };
  
  const handleAddNewService = () => {
    setCurrentService({ id: null, nome: '', duracao_minutos: '60', preco: '0.00', status: true });
    setIsServiceModalOpen(true);
  };

  // Handlers para Aba Horários
  const handleWorkingHoursChange = (day, field, value, slotIndex = null) => { /* ... como antes ... */ };
  const addSlotToDay = (day) => { /* ... como antes ... */ };
  const removeSlotFromDay = (day, slotIndex) => { /* ... como antes ... */ };
  const handleSaveWorkingHours = async () => {
    try {
      await saveWorkingHours(workingHours);
      toast({ title: "Horários Salvos!", description: "Os horários de funcionamento foram atualizados." });
      fetchAllAdminData(); // Rebusca
    } catch (error) {
      toast({ title: "Erro ao Salvar Horários", description: error.message || "Não foi possível salvar os horários.", variant: "destructive"});
    }
  };
  
  // Handlers para Aba Formas de Pagamento
  const handlePaymentMethodInputChange = (e) => { /* ... como antes ... */ };
  const handleSaveCurrentPaymentMethod = async () => { /* ... como antes, mas com await e try/catch ... */ };
  const handleEditPaymentMethod = (pm) => { /* ... como antes ... */ };
  const handleDeletePaymentMethod = async (pmId) => { /* ... como antes, mas com await e try/catch ... */ };
  const handleAddNewPaymentMethod = () => { /* ... como antes ... */ };

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const daysOfWeekPT = { monday: "Segunda", tuesday: "Terça", wednesday: "Quarta", thursday: "Quinta", friday: "Sexta", saturday: "Sábado", sunday: "Domingo"};

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Carregando configurações...</p></div>;
  }

  return (
    <div className="space-y-6">
       <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent">Configurações</h1>
        <p className="text-glowfy-muted-foreground">Personalize o funcionamento do seu salão.</p>
      </motion.div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-glowfy-muted mb-6">
          <TabsTrigger value="general"><ShieldCheck className="mr-2 h-4 w-4" />Geral</TabsTrigger>
          <TabsTrigger value="services"><Scissors className="mr-2 h-4 w-4" />Serviços</TabsTrigger>
          <TabsTrigger value="hours"><Clock className="mr-2 h-4 w-4" />Horários</TabsTrigger>
          <TabsTrigger value="payments"><DollarSign className="mr-2 h-4 w-4" />Pagamentos</TabsTrigger>
          <TabsTrigger value="terms"><FileText className="mr-2 h-4 w-4" />Termos</TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="general">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais do Salão</CardTitle>
              <CardDescription>Atualize o nome do salão, WhatsApp e outras configurações básicas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome_salao">Nome do Salão</Label>
                <Input id="nome_salao" value={generalSettings.nome_salao} onChange={handleGeneralSettingsChange} className="bg-transparent"/>
              </div>
              <div>
                <Label htmlFor="whatsapp_proprietaria">WhatsApp da Proprietária (para notificações)</Label>
                <Input id="whatsapp_proprietaria" value={generalSettings.whatsapp_proprietaria} onChange={handleGeneralSettingsChange} className="bg-transparent" placeholder="5527999999999"/>
              </div>
              <div>
                <Label htmlFor="fuso_horario">Fuso Horário</Label>
                <Input id="fuso_horario" value={generalSettings.fuso_horario} onChange={handleGeneralSettingsChange} className="bg-transparent" placeholder="America/Sao_Paulo"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="antecedencia_minima_agendamento_dia_horas">Antecedência Mín. Agend. (horas no mesmo dia)</Label>
                  <Input id="antecedencia_minima_agendamento_dia_horas" type="number" value={generalSettings.antecedencia_minima_agendamento_dia_horas} onChange={handleGeneralSettingsChange} className="bg-transparent"/>
                </div>
                <div>
                  <Label htmlFor="limite_atraso_minutos">Tolerância Atraso (minutos)</Label>
                  <Input id="limite_atraso_minutos" type="number" value={generalSettings.limite_atraso_minutos} onChange={handleGeneralSettingsChange} className="bg-transparent"/>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="permitir_agendamento_mesmo_dia" checked={generalSettings.permitir_agendamento_mesmo_dia} onCheckedChange={(checked) => handleGeneralSettingsChange({target: {id: 'permitir_agendamento_mesmo_dia', type: 'checkbox', checked}})} />
                <Label htmlFor="permitir_agendamento_mesmo_dia">Permitir agendamento para o mesmo dia</Label>
              </div>
              <Button onClick={handleSaveGeneralSettings} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
                <Save className="mr-2 h-4 w-4" /> Salvar Informações Gerais
              </Button>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Aba Serviços */}
        <TabsContent value="services">
          {/* ... Seu JSX para Gerenciamento de Serviços ... */}
        </TabsContent>
        
        {/* Aba Horários */}
        <TabsContent value="hours">
           {/* ... Seu JSX para Horários de Funcionamento ... */}
        </TabsContent>

        {/* Aba Formas de Pagamento */}
        <TabsContent value="payments">
          {/* ... Seu JSX para Formas de Pagamento ... */}
        </TabsContent>

        {/* Aba Termos */}
        <TabsContent value="terms">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Termos de Atendimento</CardTitle>
              <CardDescription>Defina os termos que os clientes devem aceitar ao agendar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="termos_atendimento_input">Texto dos Termos</Label> {/* ID diferente para não conflitar */}
                <Textarea 
                    id="termos_atendimento" // Chave correta para o estado generalSettings
                    value={generalSettings.termos_atendimento} 
                    onChange={handleGeneralSettingsChange} // Reutiliza o handler geral
                    rows={10} 
                    className="bg-transparent"
                />
              </div>
              {/* O botão de salvar termos agora pode ser o mesmo das configurações gerais,
                  ou se você quiser um botão específico aqui, ele chamaria handleSaveGeneralSettings também. */}
              <Button onClick={handleSaveGeneralSettings} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
                <Save className="mr-2 h-4 w-4" /> Salvar Termos (e Config. Gerais)
              </Button>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Service Modal */}
      {/* ... Seu Dialog para Serviços ... */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-glowfy-card">
                <DialogHeader>
                    <DialogTitle>{currentService.id ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="nome">Nome do Serviço</Label>
                        <Input id="nome" value={currentService.nome} onChange={handleServiceInputChange} className="bg-transparent"/>
                    </div>
                    <div>
                        <Label htmlFor="duracao_minutos">Duração (minutos)</Label>
                        <Input id="duracao_minutos" type="number" value={currentService.duracao_minutos} onChange={handleServiceInputChange} className="bg-transparent"/>
                    </div>
                    <div>
                        <Label htmlFor="preco">Preço (R$)</Label>
                        <Input id="preco" type="number" step="0.01" value={currentService.preco} onChange={handleServiceInputChange} className="bg-transparent"/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status" checked={currentService.status} onCheckedChange={(checked) => handleServiceInputChange({target: {id: 'status', type: 'checkbox', checked: Boolean(checked)}})} />
                        <Label htmlFor="status">Ativo</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveCurrentService} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">Salvar Serviço</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

        {/* Payment Method Modal */}
        {/* ... Seu Dialog para Formas de Pagamento ... */}
        <Dialog open={isPaymentMethodModalOpen} onOpenChange={setIsPaymentMethodModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-glowfy-card">
                <DialogHeader>
                    <DialogTitle>{currentPaymentMethod.id ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" value={currentPaymentMethod.name} onChange={handlePaymentMethodInputChange} className="bg-transparent"/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="active" checked={currentPaymentMethod.active} onCheckedChange={(checked) => handlePaymentMethodInputChange({target: {id: 'active', type: 'checkbox', checked: Boolean(checked)}})} />
                        <Label htmlFor="active">Ativo</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveCurrentPaymentMethod} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default SettingsPage;