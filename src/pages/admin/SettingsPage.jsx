import React, { useState, useEffect } from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
    import { getSettings, saveSettings, getAllServicesAdmin, saveService, deleteService, getWorkingHours, saveWorkingHours, getTerms, saveTerms, getAllPaymentMethodsAdmin, savePaymentMethod, deletePaymentMethod } from '@/services/bookingService';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

    const SettingsPage = () => {
      const { toast } = useToast();
      const [generalSettings, setGeneralSettings] = useState({ salonName: "Meu Salão Glowfy" });
      const [services, setServicesState] = useState([]);
      const [workingHours, setWorkingHoursState] = useState({});
      const [terms, setTermsState] = useState("");
      const [paymentMethods, setPaymentMethodsState] = useState([]);

      const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
      const [currentService, setCurrentService] = useState({ id: null, name: '', duration: '', price: '', active: true });
      
      const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
      const [currentPaymentMethod, setCurrentPaymentMethod] = useState({ id: null, name: '', active: true });

      useEffect(() => {
        setGeneralSettings(getSettings());
        setServicesState(getAllServicesAdmin());
        setWorkingHoursState(getWorkingHours());
        setTermsState(getTerms());
        setPaymentMethodsState(getAllPaymentMethodsAdmin());
      }, []);

      const handleSaveGeneralSettings = () => {
        saveSettings(generalSettings);
        toast({ title: "Configurações Salvas!", description: "As informações gerais foram atualizadas." });
      };

      const handleServiceInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        setCurrentService(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value) }));
      };
      

      const handleSaveCurrentService = () => {
        if (!currentService.name || !currentService.duration || currentService.price === undefined) {
            toast({ title: "Erro", description: "Preencha nome, duração e preço do serviço.", variant: "destructive"});
            return;
        }
        saveService(currentService);
        setServicesState(getAllServicesAdmin());
        setIsServiceModalOpen(false);
        toast({ title: "Serviço Salvo!", description: `Serviço ${currentService.name} foi salvo.` });
      };
      
      const handleEditService = (service) => {
        setCurrentService(service);
        setIsServiceModalOpen(true);
      };

      const handleDeleteService = (serviceId) => {
        deleteService(serviceId);
        setServicesState(getAllServicesAdmin());
        toast({ title: "Serviço Removido!", description: "O serviço foi removido." });
      };
      
      const handleAddNewService = () => {
        setCurrentService({ id: null, name: '', duration: '', price: '', active: true });
        setIsServiceModalOpen(true);
      };

      const handleWorkingHoursChange = (day, field, value, slotIndex = null) => {
        setWorkingHoursState(prev => {
          const newHours = { ...prev };
          if (!newHours[day]) newHours[day] = { enabled: false, slots: [] };
          if (slotIndex !== null) {
            if (!newHours[day].slots[slotIndex]) newHours[day].slots[slotIndex] = { start: '', end: '' };
            newHours[day].slots[slotIndex][field] = value;
          } else {
            newHours[day][field] = value;
          }
          return newHours;
        });
      };
      
      const addSlotToDay = (day) => {
        setWorkingHoursState(prev => {
            const newHours = { ...prev };
            if (!newHours[day]) newHours[day] = { enabled: false, slots: [] };
            newHours[day].slots.push({ start: '09:00', end: '18:00' });
            return newHours;
        });
      };

      const removeSlotFromDay = (day, slotIndex) => {
        setWorkingHoursState(prev => {
            const newHours = { ...prev };
            newHours[day].slots.splice(slotIndex, 1);
            return newHours;
        });
      };

      const handleSaveWorkingHours = () => {
        saveWorkingHours(workingHours);
        toast({ title: "Horários Salvos!", description: "Os horários de funcionamento foram atualizados." });
      };
      
      const handleSaveTerms = () => {
        saveTerms(terms);
        toast({ title: "Termos Salvos!", description: "Os termos de atendimento foram atualizados." });
      };

      const handlePaymentMethodInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        setCurrentPaymentMethod(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
      };

      const handleSaveCurrentPaymentMethod = () => {
        if(!currentPaymentMethod.name) {
            toast({ title: "Erro", description: "Nome da forma de pagamento é obrigatório.", variant: "destructive"});
            return;
        }
        savePaymentMethod(currentPaymentMethod);
        setPaymentMethodsState(getAllPaymentMethodsAdmin());
        setIsPaymentMethodModalOpen(false);
        toast({ title: "Forma de Pagamento Salva!", description: `Forma de pagamento ${currentPaymentMethod.name} salva.` });
      };

      const handleEditPaymentMethod = (pm) => {
        setCurrentPaymentMethod(pm);
        setIsPaymentMethodModalOpen(true);
      };

      const handleDeletePaymentMethod = (pmId) => {
        deletePaymentMethod(pmId);
        setPaymentMethodsState(getAllPaymentMethodsAdmin());
        toast({ title: "Forma de Pagamento Removida!"});
      }
      
      const handleAddNewPaymentMethod = () => {
        setCurrentPaymentMethod({id: null, name: '', active: true});
        setIsPaymentMethodModalOpen(true);
      }

      const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const daysOfWeekPT = { monday: "Segunda", tuesday: "Terça", wednesday: "Quarta", thursday: "Quinta", friday: "Sexta", saturday: "Sábado", sunday: "Domingo"};

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

            <TabsContent value="general">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais do Salão</CardTitle>
                  <CardDescription>Atualize o nome e outras informações básicas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="salonName">Nome do Salão</Label>
                    <Input id="salonName" value={generalSettings.salonName} onChange={(e) => setGeneralSettings({...generalSettings, salonName: e.target.value})} className="bg-transparent"/>
                  </div>
                  <Button onClick={handleSaveGeneralSettings} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
                    <Save className="mr-2 h-4 w-4" /> Salvar Informações
                  </Button>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="services">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gerenciamento de Serviços</CardTitle>
                        <CardDescription>Adicione, edite ou remova os serviços oferecidos.</CardDescription>
                    </div>
                    <Button onClick={handleAddNewService} variant="outline" className="border-glowfy-primary text-glowfy-primary hover:bg-glowfy-primary/10"><PlusCircle className="mr-2 h-4 w-4"/>Novo Serviço</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border border-glowfy-border rounded-md bg-glowfy-card hover:shadow-sm transition-shadow">
                      <div>
                        <p className="font-medium text-glowfy-foreground">{service.name} <span className={cn("text-xs", service.active ? "text-green-500" : "text-red-500")}>{service.active ? "(Ativo)" : "(Inativo)"}</span></p>
                        <p className="text-xs text-glowfy-muted-foreground">Duração: {service.duration} min | Preço: R$ {Number(service.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditService(service)} className="text-glowfy-accent hover:bg-glowfy-accent/10"><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                   {services.length === 0 && <p className="text-sm text-center text-glowfy-muted-foreground py-4">Nenhum serviço cadastrado.</p>}
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="hours">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Funcionamento</CardTitle>
                  <CardDescription>Configure os dias e horários de atendimento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {daysOfWeek.map(day => (
                    <Card key={day} className="p-4 bg-glowfy-card border border-glowfy-border">
                        <div className="flex items-center justify-between mb-3">
                            <Label htmlFor={`${day}Enabled`} className="font-semibold text-lg text-glowfy-primary">{daysOfWeekPT[day]}</Label>
                            <Checkbox id={`${day}Enabled`} checked={workingHours[day]?.enabled || false} onCheckedChange={(checked) => handleWorkingHoursChange(day, 'enabled', checked)} />
                        </div>
                        {workingHours[day]?.enabled && (
                            <div className="space-y-2">
                                {workingHours[day].slots.map((slot, slotIndex) => (
                                    <div key={slotIndex} className="flex items-center gap-2">
                                        <Input type="time" value={slot.start} onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value, slotIndex)} className="bg-transparent w-full"/>
                                        <span className="text-glowfy-muted-foreground">-</span>
                                        <Input type="time" value={slot.end} onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value, slotIndex)} className="bg-transparent w-full"/>
                                        <Button variant="ghost" size="icon" onClick={() => removeSlotFromDay(day, slotIndex)} className="text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => addSlotToDay(day)} className="border-glowfy-accent text-glowfy-accent hover:bg-glowfy-accent/10"><PlusCircle className="h-4 w-4 mr-1"/>Adicionar Horário</Button>
                            </div>
                        )}
                    </Card>
                ))}
                  <Button onClick={handleSaveWorkingHours} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground mt-4">
                    <Save className="mr-2 h-4 w-4" /> Salvar Horários
                  </Button>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="payments">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Formas de Pagamento</CardTitle>
                        <CardDescription>Gerencie as formas de pagamento aceitas.</CardDescription>
                    </div>
                    <Button onClick={handleAddNewPaymentMethod} variant="outline" className="border-glowfy-primary text-glowfy-primary hover:bg-glowfy-primary/10"><PlusCircle className="mr-2 h-4 w-4"/>Nova Forma</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className="flex items-center justify-between p-3 border border-glowfy-border rounded-md bg-glowfy-card hover:shadow-sm transition-shadow">
                      <div>
                         <p className="font-medium text-glowfy-foreground">{pm.name} <span className={cn("text-xs", pm.active ? "text-green-500" : "text-red-500")}>{pm.active ? "(Ativo)" : "(Inativo)"}</span></p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditPaymentMethod(pm)} className="text-glowfy-accent hover:bg-glowfy-accent/10"><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePaymentMethod(pm.id)} className="text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                   {paymentMethods.length === 0 && <p className="text-sm text-center text-glowfy-muted-foreground py-4">Nenhuma forma de pagamento cadastrada.</p>}
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="terms">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Termos de Atendimento</CardTitle>
                  <CardDescription>Defina os termos que os clientes devem aceitar ao agendar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="termsText">Texto dos Termos</Label>
                    <Textarea id="termsText" value={terms} onChange={(e) => setTermsState(e.target.value)} rows={10} className="bg-transparent"/>
                  </div>
                  <Button onClick={handleSaveTerms} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
                    <Save className="mr-2 h-4 w-4" /> Salvar Termos
                  </Button>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Service Modal */}
          <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-glowfy-card">
                <DialogHeader>
                    <DialogTitle>{currentService.id ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="name">Nome do Serviço</Label>
                        <Input id="name" value={currentService.name} onChange={handleServiceInputChange} className="bg-transparent"/>
                    </div>
                    <div>
                        <Label htmlFor="duration">Duração (minutos)</Label>
                        <Input id="duration" type="number" value={currentService.duration} onChange={handleServiceInputChange} className="bg-transparent"/>
                    </div>
                    <div>
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input id="price" type="number" step="0.01" value={currentService.price} onChange={handleServiceInputChange} className="bg-transparent"/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="active" checked={currentService.active} onCheckedChange={(checked) => setCurrentService(prev => ({...prev, active: Boolean(checked)}))} />
                        <Label htmlFor="active">Ativo</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveCurrentService} className="bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">Salvar Serviço</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

            {/* Payment Method Modal */}
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
                            <Checkbox id="active" checked={currentPaymentMethod.active} onCheckedChange={(checked) => setCurrentPaymentMethod(prev => ({...prev, active: Boolean(checked)}))} />
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