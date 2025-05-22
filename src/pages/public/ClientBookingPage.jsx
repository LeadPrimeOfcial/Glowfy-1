// src/pages/public/ClientBookingPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CalendarCheck, Clock, Info, UserPlus, Image as ImageIcon, AlertTriangle } from 'lucide-react'; // Adicionado AlertTriangle
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import clientBookingService from '@/services/clientBookingService';
import { formatCPF, formatTelefone, sanitizeTelefoneForAPI } from '@/lib/utils';

const ClientBookingPage = () => {
  const { toast } = useToast();
  const { slugEmpresa } = useParams(); // Obtém o slug da empresa da URL
  const navigate = useNavigate(); // Para redirecionamento

  const [empresaNomeFantasia, setEmpresaNomeFantasia] = useState('');
  const [empresaValida, setEmpresaValida] = useState(true); // Para controlar se a empresa é válida

  // ... (seus useState existentes) ...
  const [services, setServicesState] = useState([]);
  const [termsContent, setTermsContent] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectComponentKey, setSelectComponentKey] = useState(0);
  
  const [selectedServiceId, setSelectedServiceId] = useState(''); 
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  
  const [clientCpf, setClientCpf] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDob, setClientDob] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientInsta, setClientInsta] = useState('');
  const [clientPhotoFile, setClientPhotoFile] = useState(null);
  const [clientPhotoPreview, setClientPhotoPreview] = useState(null);

  const [showNewClientFields, setShowNewClientFields] = useState(false);
  const [isClientKnown, setIsClientKnown] = useState(false);
  const [clientDataFromCpfCheck, setClientDataFromCpfCheck] = useState(null);
  const [clientMessage, setClientMessage] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [isLoadingCpfCheck, setIsLoadingCpfCheck] = useState(false);

  const today = new Date();
  const minBirthDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split("T")[0];
  const maxBirthDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate()).toISOString().split("T")[0];

  useEffect(() => {
    if (!slugEmpresa) {
        toast({ title: "Erro de Rota", description: "Empresa não especificada na URL.", variant: "destructive" });
        setIsLoadingServices(false);
        setEmpresaValida(false);
        // Opcional: redirecionar para uma página de erro ou página inicial
        // navigate('/'); 
        return;
    }

    console.log(`Effect [MOUNT]: Carregando dados para empresa slug: ${slugEmpresa}`);
    setIsLoadingServices(true);
    setEmpresaValida(true); // Assume que é válida até que a API diga o contrário
	setEmpresaNomeFantasia('');
    // Limpar seleções anteriores ao mudar de empresa (se o componente for reutilizado)
    setSelectedServiceId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setAvailableTimes([]);

    Promise.all([
        clientBookingService.getServicos(slugEmpresa),
        clientBookingService.getTermosAtendimento(slugEmpresa) 
        // Poderíamos adicionar uma chamada para buscar o nome da empresa aqui se necessário para exibição
        // ex: clientBookingService.getEmpresaInfo(slugEmpresa) e então setEmpresaNome()
    ]).then(([servicosResponse, configData]) => { // Renomeado para configData para clareza
        console.log("[ClientBookingPage] Resposta getServicos:", servicosResponse);
        console.log("[ClientBookingPage] Resposta getTermos (configData):", configData);

        if (servicosResponse && servicosResponse.records) {
            const activeServices = servicosResponse.records.filter(s => s.status);
            setServicesState(activeServices);
        } else {
            console.warn("[ClientBookingPage] Resposta inválida da API de serviços.", servicosResponse);
            toast({ title: "Erro ao Carregar Serviços", description: servicosResponse?.message || "Empresa não encontrada ou sem serviços cadastrados.", variant: "destructive" });
            setServicesState([]);
            setEmpresaValida(false); // Empresa inválida se serviços não carregam
        }

        // Define o nome da empresa e os termos a partir de configData
        if (configData) {
            setEmpresaNomeFantasia(configData.nome_fantasia_empresa || configData.nome_salao || slugEmpresa); // << USA nome_fantasia_empresa
            setTermsContent(configData.termos_atendimento || "Termos de atendimento não disponíveis para esta empresa.");
            // Se configData não for encontrado, empresaValida já pode ter sido setada para false pela falha em getServicos,
            // ou podemos explicitamente verificar aqui também.
            if (!configData.id_empresa) { // Checa se a config retornou dados válidos da empresa
                 setEmpresaValida(false);
                 toast({ title: "Erro de Configuração", description: "Não foi possível carregar as configurações da empresa.", variant: "destructive" });
            }
        } else {
            toast({ title: "Erro de Configuração", description: "Não foi possível carregar termos e nome da empresa.", variant: "destructive" });
            setTermsContent("Falha ao carregar os termos.");
            setEmpresaValida(false); // Empresa inválida se config não carrega
        }

    }).catch(error => {
        console.error("[ClientBookingPage] Erro no Promise.all (serviços/termos):", error);
        toast({ title: "Erro ao Carregar Dados da Empresa", description: error?.message || "Verifique a URL ou tente mais tarde.", variant: "destructive" });
        setServicesState([]);
        setTermsContent("Falha ao carregar os termos.");
        setEmpresaValida(false);
    }).finally(() => {
        setIsLoadingServices(false);
    });
  }, [slugEmpresa, toast]);

  const serviceDisplayName = useMemo(() => {
    if (!selectedServiceId || services.length === 0) return undefined; 
    const service = services.find(s => s.id.toString() === selectedServiceId);
    if (service) return `${service.nome} (${service.duracao_minutos} min) - R$ ${parseFloat(service.preco).toFixed(2)}`;
    return undefined;
  }, [selectedServiceId, services]);
  
  const selectedService = useMemo(() => {
    if (!selectedServiceId || services.length === 0) return null;
    return services.find(s => s.id.toString() === selectedServiceId);
  }, [selectedServiceId, services]);

  useEffect(() => {
    if (selectedDate && selectedService?.id && slugEmpresa && empresaValida) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setIsLoadingAvailability(true); 
      setAvailableTimes([]); 
      clientBookingService.getAvailability(slugEmpresa, formattedDate, selectedService.id)
        .then(data => {
            setAvailableTimes(data.availableTimes || []);
        })
        .catch(error => {
          toast({ title: "Erro Horários", description: error?.message || "Não foi possível carregar horários.", variant: "destructive" });
          setAvailableTimes([]);
        })
        .finally(() => setIsLoadingAvailability(false));
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, selectedService, slugEmpresa, empresaValida, toast]);
  
  const handleServiceSelection = (newServiceId) => {
    const currentIdBeforeUpdate = selectedServiceId;
    if (newServiceId === "" && currentIdBeforeUpdate && currentIdBeforeUpdate !== "") {
      console.warn(`Select attempted to reset from "${currentIdBeforeUpdate}" to an empty string. IGNORING...`);
      setTimeout(() => { setSelectComponentKey(prevKey => prevKey + 1); }, 0);
      return; 
    }
    if (newServiceId !== currentIdBeforeUpdate) setSelectedServiceId(newServiceId);
  };
  
  const handleCpfInput = (e) => {
    const rawValue = e.target.value;
    const formatted = formatCPF(rawValue);
    setClientCpf(formatted); 
    if (formatted.length < 14) {
        if (clientMessage || showNewClientFields || isClientKnown) {
            setClientMessage(''); setShowNewClientFields(false); setIsClientKnown(false);
            setClientName(''); setClientDob(''); setClientPhone(''); setClientInsta(''); 
            setClientPhotoFile(null); setClientPhotoPreview(null);
            setClientDataFromCpfCheck(null);
        }
    }
  };

  const checkCpfOnBlur = useCallback(async () => {
    if (!slugEmpresa || !empresaValida) return; 
    if (clientCpf.length !== 14) { 
      if (clientCpf.length > 0) setClientMessage('CPF incompleto.'); else setClientMessage('');
      setShowNewClientFields(false); setIsClientKnown(false); setClientDataFromCpfCheck(null); return;
    }
    const numericCpf = clientCpf.replace(/\D/g, '');
    setIsLoadingCpfCheck(true); setClientMessage('Verificando CPF...');
    // Resetar campos antes da verificação
    setShowNewClientFields(false); setIsClientKnown(false);
    setClientName(''); setClientDob(''); setClientPhone(''); setClientInsta(''); 
    setClientPhotoFile(null); setClientPhotoPreview(null); setClientDataFromCpfCheck(null);

    try {
      const clientDataApi = await clientBookingService.checkClientByCpf(slugEmpresa, numericCpf); 
      if (clientDataApi && clientDataApi.id) { 
        setClientDataFromCpfCheck(clientDataApi);
        setClientName(clientDataApi.nome_completo || '');
        setClientDob(clientDataApi.data_nascimento || '');
        setClientPhone(clientDataApi.telefone_whatsapp ? formatTelefone(clientDataApi.telefone_whatsapp) : '');
        setClientInsta(clientDataApi.instagram || '');
        setIsClientKnown(true);
        setClientMessage(`Bem-vinda de volta, ${clientDataApi.nome_completo}!`);
        toast({ title: "Cliente Encontrado!", description: `Olá, ${clientDataApi.nome_completo}!`});
      } else { 
        setIsClientKnown(false); setShowNewClientFields(true); 
        setClientMessage('CPF não cadastrado nesta empresa. Por favor, complete seus dados abaixo.');
      }
    } catch (error) { 
      console.error("Erro ao verificar CPF:", error);
      setIsClientKnown(false); setShowNewClientFields(true); 
      setClientMessage(error?.message === "Cliente não encontrado." || error?.message === "CPF não cadastrado para esta empresa." 
        ? 'CPF não cadastrado nesta empresa. Por favor, complete seus dados.' 
        : 'Erro ao verificar CPF. Tente novamente.');
    } finally {
      setIsLoadingCpfCheck(false);
    }
  }, [clientCpf, slugEmpresa, empresaValida, toast]);

  const handlePhoneChange = (e) => setClientPhone(formatTelefone(e.target.value));
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setClientPhotoFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => { setClientPhotoPreview(reader.result); };
      reader.readAsDataURL(file);
    } else {
      setClientPhotoFile(null); setClientPhotoPreview(null);
      if (file) toast({ title: "Arquivo Inválido", description: "Selecione uma imagem.", variant: "destructive"});
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!slugEmpresa || !empresaValida) {
        toast({ title: "Erro de Configuração", description: "Não foi possível identificar a empresa válida. URL pode estar incorreta.", variant: "destructive" });
        return;
    }
    
    const numericCpf = clientCpf.replace(/\D/g, '');
    const sanitizedPhoneForApi = showNewClientFields ? sanitizeTelefoneForAPI(clientPhone) : (isClientKnown && clientDataFromCpfCheck && clientPhone ? sanitizeTelefoneForAPI(clientPhone) : null);

    if (!selectedServiceId || !selectedDate || !selectedTime || numericCpf.length !== 11 || !termsAccepted) {
      toast({ title: 'Campos Obrigatórios', description: 'Preencha CPF, Procedimento, Data, Horário e aceite os termos.', variant: 'destructive' }); return;
    }
    if (showNewClientFields && (!clientName.trim() || !clientDob.trim() || !sanitizedPhoneForApi)) {
      toast({ title: 'Dados para Novo Cadastro', description: 'Preencha Nome, Data de Nascimento e Telefone/WhatsApp.', variant: 'destructive' }); return;
    }
    if (showNewClientFields && sanitizedPhoneForApi && !/^55\d{10,11}$/.test(sanitizedPhoneForApi)) {
        toast({ title: 'Telefone Inválido', description: 'Telefone/WhatsApp: 55+DDD+Número (Ex: 5527999999999).', variant: 'destructive' }); return;
    }

    setIsLoadingBooking(true);
    const formData = new FormData();
    formData.append('slug_empresa', slugEmpresa); // Envia o slug da empresa
    formData.append('cpf_cliente', numericCpf);
    formData.append('id_servico', selectedServiceId);
    formData.append('data_agendamento', selectedDate.toISOString().split('T')[0]);
    formData.append('hora_inicio', selectedTime);
    formData.append('termos_aceitos', termsAccepted.toString());

    if (showNewClientFields) {
      formData.append('nome_cliente', clientName.trim());
      formData.append('data_nascimento_cliente', clientDob.trim());
      formData.append('telefone_whatsapp_cliente', sanitizedPhoneForApi);
      if (clientInsta.trim()) formData.append('instagram_cliente', clientInsta.trim());
      if (clientPhotoFile) formData.append('client_photo', clientPhotoFile, clientPhotoFile.name);
    } else if (isClientKnown && clientDataFromCpfCheck) {
      formData.append('nome_cliente', clientDataFromCpfCheck.nome_completo);
      // Lógica para enviar telefone atualizado apenas se modificado
      if (clientPhone && sanitizedPhoneForApi && clientDataFromCpfCheck.telefone_whatsapp && sanitizedPhoneForApi !== sanitizeTelefoneForAPI(clientDataFromCpfCheck.telefone_whatsapp)) {
          formData.append('telefone_whatsapp_cliente_update', sanitizedPhoneForApi);
      } else if (clientPhone && sanitizedPhoneForApi && !clientDataFromCpfCheck.telefone_whatsapp) {
          formData.append('telefone_whatsapp_cliente_update', sanitizedPhoneForApi); // Adiciona se antes não tinha
      }
    }
    
    try {
      const response = await clientBookingService.createAgendamento(formData);
      toast({
        title: 'Agendamento Confirmado!',
        description: `Seu horário para ${selectedService?.nome} no dia ${selectedDate?.toLocaleDateString('pt-BR')} às ${selectedTime} foi confirmado!`,
      });
      setSelectedServiceId(''); setSelectedDate(undefined); setSelectedTime('');
      setClientCpf(''); setClientName(''); setClientDob(''); setClientPhone(''); setClientInsta(''); 
      setClientPhotoFile(null); setClientPhotoPreview(null);
      setTermsAccepted(false); setShowNewClientFields(false); setIsClientKnown(false); setClientMessage('');
      setClientDataFromCpfCheck(null);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast({ title: "Erro no Agendamento", description: error.message || "Não foi possível concluir o agendamento.", variant: "destructive" });
    } finally {
      setIsLoadingBooking(false);
    }
  };
  
  const handleDateSelect = useCallback((date) => {
    if (date === undefined) {
        setSelectedDate(null); setSelectedTime(''); return;
    }
    const previousDate = selectedDate;
    if (!previousDate || (date && previousDate.getTime() !== date.getTime())) {
      setSelectedDate(date); setSelectedTime(''); 
    }
  }, [selectedDate]);

  const isDateDisabled = useCallback((date) => { const todayDt = new Date(); todayDt.setHours(0,0,0,0); return date < todayDt;  }, []);

  if (!empresaValida && !isLoadingServices) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-red-600">Empresa Não Encontrada</h1>
            <p className="text-glowfy-muted-foreground mt-2">
                A página de agendamento que você tentou acessar não está disponível ou a URL está incorreta.
            </p>
            <Button onClick={() => navigate('/')} className="mt-6">Voltar para o Início</Button>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="shadow-xl border-glowfy-primary/30 border-t-4">
                <CardHeader className="text-center">
                    <CalendarCheck className="mx-auto h-12 w-12 text-glowfy-primary mb-2" />
                    <CardTitle className="text-3xl">
                        {/* ALTERAÇÃO AQUI para usar empresaNomeFantasia */}
                        {isLoadingServices ? "Carregando Informações..." : (empresaNomeFantasia && empresaValida ? `Agende em ${empresaNomeFantasia}` : "Agende seu Horário")}
                    </CardTitle>
                    <CardDescription className="text-glowfy-muted-foreground">Preencha os dados para seu agendamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmitBooking} className="space-y-6">
                        <div>
                            <Label htmlFor="cpf">CPF <span className="text-pink-500">*</span></Label>
                            <Input id="cpf" placeholder="000.000.000-00" value={clientCpf} onChange={handleCpfInput} onBlur={checkCpfOnBlur} className="bg-transparent" maxLength="14" disabled={isLoadingCpfCheck || isLoadingServices || !empresaValida}/>
                            {isLoadingCpfCheck && <p className="text-xs text-glowfy-muted-foreground mt-1">Verificando...</p>}
                            {clientMessage && <p className={`text-xs mt-1 ${isClientKnown ? 'text-green-600' : (showNewClientFields ? 'text-blue-600' : 'text-red-600')}`}>{clientMessage}</p>}
                        </div>

                        <AnimatePresence>
                        {showNewClientFields && (
                            <motion.div 
                                key="newClientFields" initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }} className="space-y-4 mt-4 border-t border-glowfy-border pt-4"
                            >
                                <p className="text-sm text-glowfy-foreground font-medium">Complete seu cadastro:</p>
                                {/* ... Seus campos de Nome, Data Nasc, Tel, Insta, Foto ... */}
                                <div>
                                    <Label htmlFor="clientName">Nome Completo <span className="text-pink-500">*</span></Label>
                                    <Input id="clientName" placeholder="Seu nome completo" value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-transparent" required={showNewClientFields} />
                                </div>
                                <div>
                                    <Label htmlFor="clientDob">Data de Nascimento <span className="text-pink-500">*</span></Label>
                                    <Input id="clientDob" type="date" value={clientDob} onChange={(e) => setClientDob(e.target.value)} className="bg-transparent" required={showNewClientFields} min={minBirthDate} max={maxBirthDate}/>
                                </div>
                                <div>
                                    <Label htmlFor="clientPhone">Telefone/WhatsApp (Ex: 55279...) <span className="text-pink-500">*</span></Label>
                                    <Input id="clientPhone" type="tel" placeholder="5527999999999" value={clientPhone} onChange={handlePhoneChange} className="bg-transparent" required={showNewClientFields} maxLength={13}/>
                                </div>
                                <div>
                                    <Label htmlFor="clientInsta">Instagram (Opcional)</Label>
                                    <Input id="clientInsta" placeholder="@seuinstagram" value={clientInsta} onChange={(e) => setClientInsta(e.target.value)} className="bg-transparent" />
                                </div>
                                <div>
                                    <Label htmlFor="clientPhoto">Foto de Perfil (Opcional)</Label>
                                    <Input id="clientPhoto" type="file" accept="image/*" onChange={handlePhotoChange} className="bg-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-100 file:text-pink-600 hover:file:bg-pink-200 cursor-pointer"/>
                                    {clientPhotoPreview && <img src={clientPhotoPreview} alt="Preview" className="mt-2 h-20 w-20 rounded-full object-cover"/>}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                        
                        <div>
                            <Label htmlFor="service">Procedimento <span className="text-pink-500">*</span></Label>
                            <Select 
                                key={selectComponentKey}
                                onValueChange={handleServiceSelection}
                                value={selectedServiceId} 
                                disabled={!empresaValida || isLoadingServices || services.length === 0}
                            >
                                <SelectTrigger id="service" className="bg-transparent">
                                    <SelectValue placeholder={!empresaValida ? "Empresa inválida" : (isLoadingServices ? "Carregando..." : (services.length === 0 ? "Nenhum serviço disponível" : "Selecione o procedimento"))}>
                                        {serviceDisplayName}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map(proc => (
                                    <SelectItem key={proc.id} value={proc.id.toString()}>
                                        {proc.nome} ({proc.duracao_minutos} min) - R$ {parseFloat(proc.preco).toFixed(2)}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ... Resto do formulário (Calendar, Horários, Checkbox Termos, Botão Submit) ... */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Data <span className="text-pink-500">*</span></Label>
                                <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} className="rounded-md border p-2 w-full" disabled={isDateDisabled || !empresaValida}/>
                            </div>
                            <div>
                                <Label htmlFor="time">Horário <span className="text-pink-500">*</span> {isLoadingAvailability && (<span className="text-xs">(Carregando...)</span>)}</Label>
                                {(!selectedServiceId || !selectedDate) && <div className="text-xs text-glowfy-muted-foreground mt-2 p-2 border border-dashed border-glowfy-border rounded-md h-[200px] flex items-center justify-center"><Info className="inline h-4 w-4 mr-1" />Selecione procedimento e data.</div>}
                                {selectedServiceId && selectedDate && !isLoadingAvailability && availableTimes.length === 0 && 
                                    <div className="text-xs text-glowfy-muted-foreground mt-2 p-2 border border-dashed border-glowfy-border rounded-md h-[200px] flex items-center justify-center">
                                        <Info className="inline h-4 w-4 mr-1" />
                                        Nenhum horário disponível.
                                    </div>
                                }
                                {selectedServiceId && selectedDate && !isLoadingAvailability && availableTimes.length > 0 && (
                                    <ScrollArea className="h-[200px] w-full rounded-md border border-glowfy-border p-2 mt-2">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {availableTimes.map(time => (
                                                <Button key={time} variant={selectedTime === time ? "default" : "outline"} /* ... etc ... */ onClick={() => setSelectedTime(time)} type="button">
                                                    <Clock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 opacity-70"/> {time}
                                                </Button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </div>
                        <div className="items-top flex space-x-2 mt-4">
                            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} disabled={!empresaValida} />
                            {/* ... Diálogo de Termos ... */}
                             <div className="grid gap-1.5 leading-none">
                                <label htmlFor="terms" className={`text-sm font-medium leading-none ${!empresaValida ? 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70' : ''}`}>
                                    Li e aceito os termos de atendimento <span className="text-pink-500">*</span>
                                </label>
                                <Dialog>
                                    <DialogTrigger asChild>
        {/* SUBSTITUA O BOTÃO POR UM SIMPLES SPAN OU DIV PARA TESTE */}
        <span 
            role="button" // Para manter a semântica, se necessário
            tabIndex={0} // Para torná-lo focável
            className="p-0 h-auto text-xs text-glowfy-primary hover:text-glowfy-accent justify-start underline cursor-pointer" 
            // Adicione um estilo para parecer um link
            // Remova a prop 'disabled' por enquanto para este teste específico, 
            // ou certifique-se de que as condições não o desabilitariam.
        >
            Ver termos de atendimento
        </span>
    </DialogTrigger>
    <DialogContent className="sm:max-w-md bg-glowfy-card">
        {/* ... Conteúdo do Dialog permanece o mesmo ... */}
        <DialogHeader>
            <DialogTitle>Termos de Atendimento</DialogTitle>
            <DialogDescription>Por favor, leia atentamente nossos termos.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[250px] sm:h-[300px] w-full rounded-md border p-4 my-4">
            <pre className="text-sm text-glowfy-muted-foreground whitespace-pre-wrap font-sans">
                {termsContent || "Carregando termos..."}
            </pre>
        </ScrollArea>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" className="bg-glowfy-primary text-glowfy-primary-foreground hover:bg-glowfy-primary/90">Entendido</Button>
            </DialogClose>
        </DialogFooter>
    </DialogContent>
</Dialog>
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-glowfy-primary to-glowfy-accent hover:opacity-90 text-glowfy-primary-foreground text-lg py-3" 
                            disabled={!empresaValida || isLoadingBooking || !termsAccepted || !selectedServiceId || !selectedDate || !selectedTime || clientCpf.length !== 14 || (showNewClientFields && (!clientName.trim() || !clientDob.trim() || !sanitizeTelefoneForAPI(clientPhone) ))}>
                            {isLoadingBooking ? ( <motion.div className="h-5 w-5 border-2 border-transparent border-t-glowfy-primary-foreground rounded-full mr-2" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}/> ) : ( <Send className="mr-2 h-5 w-5" /> )}
                            {isLoadingBooking ? 'Agendando...' : 'Confirmar Agendamento'}
                        </Button>
                    </form>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-glowfy-muted-foreground text-center w-full">
                        Seu agendamento será confirmado via WhatsApp.
                    </p>
                </CardFooter>
            </Card>
        </motion.div>
    </div>
  );
};

export default ClientBookingPage;