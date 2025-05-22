// src/pages/admin/ClientsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Filter, Edit, Trash2, Instagram, History, Image as ImageIcon } from 'lucide-react'; // Adicionado ImageIcon
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
// As funções agora vêm do bookingService.js refatorado
import bookingService from '@/services/bookingService'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCPF, sanitizeTelefoneForAPI, formatTelefone } from '@/lib/utils'; // Supondo que você tenha formatTelefone

const ClientItem = ({ client, onEdit, onDelete, onViewHistory }) => {
  // Monta a URL da foto. Ajuste o prefixo do domínio se necessário.
  // Se caminho_foto_perfil já for a URL completa, não precisa do prefixo.
  // Se for apenas o caminho relativo como 'uploads/fotos_perfil/nome.jpg':
  const fotoUrl = client.caminho_foto_perfil
                  ? `https://glowfy.leadprime.com.br/${client.caminho_foto_perfil}` 
                  : "https://via.placeholder.com/150/f0f0f0/999999?text=Sem+Foto"; // Placeholder

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between p-4 border border-glowfy-border rounded-lg bg-glowfy-card mb-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center">
         <img  
            alt={`Avatar de ${client.nome_completo}`} 
            className="h-10 w-10 rounded-full mr-4 object-cover" 
            src={fotoUrl} 
            onError={(e) => { e.target.src = "https://via.placeholder.com/150/f0f0f0/999999?text=Erro"; }} // Fallback em caso de erro
          />
        <div>
          <p className="font-semibold text-glowfy-primary">{client.nome_completo}</p>
          <p className="text-xs text-glowfy-muted-foreground">CPF: {client.cpf}</p> {/* O CPF vem do BD */}
          {client.instagram && (
            <a href={`https://instagram.com/${client.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-glowfy-accent hover:underline flex items-center">
              <Instagram className="h-3 w-3 mr-1" /> {client.instagram}
            </a>
          )}
        </div>
      </div>
      <div className="flex space-x-1 sm:space-x-2">
        <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500/10 h-8 w-8" onClick={() => onViewHistory(client)}><History className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="text-glowfy-accent hover:bg-glowfy-accent/10 h-8 w-8" onClick={() => onEdit(client)}><Edit className="h-4 w-4" /></Button>
        {/* onDelete agora deve usar o ID numérico do cliente, não o CPF */}
        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10 h-8 w-8" onClick={() => onDelete(client.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </motion.div>
  );
};

const ClientsPage = () => {
  const { toast } = useToast();
  const [clients, setClientsState] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Para feedback de carregamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null); // Para edição
  const [clientHistory, setClientHistory] = useState([]);
  
  const [clientData, setClientData] = useState({
    id: null, // ID numérico do banco
    nome_completo: '', 
    cpf: '', 
    data_nascimento: '', 
    instagram: '',
    telefone_whatsapp: '',
    caminho_foto_perfil: null // Para preview da foto
  });
  const [clientPhotoFile, setClientPhotoFile] = useState(null); // Para o arquivo da foto
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = useCallback(async (term = "") => {
    setIsLoading(true);
    try {
      const response = await bookingService.getClients(term); // bookingService agora é assíncrono
      setClientsState(response.records || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível carregar os clientes.", variant: "destructive" });
      setClientsState([]); // Limpa em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients(searchTerm);
  }, [fetchClients, searchTerm]); // Adicionado searchTerm como dependência para buscar ao digitar

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setClientData(prev => ({ ...prev, [id]: value }));
    if (id === 'cpf') {
        setClientData(prev => ({ ...prev, cpf: formatCPF(value) }));
    }
    if (id === 'telefone_whatsapp') {
        setClientData(prev => ({...prev, telefone_whatsapp: formatTelefone(value)}));
    }
  };

  const handlePhotoInputChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
        setClientPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => { 
            // Para preview, se desejar, você pode usar um estado separado
            // setClientData(prev => ({ ...prev, caminho_foto_perfil: reader.result })); // Isso mostra o base64
        };
        reader.readAsDataURL(file);
    } else {
        setClientPhotoFile(null);
        // setClientData(prev => ({ ...prev, caminho_foto_perfil: currentClient?.caminho_foto_perfil || null }));
        if (file) toast({ title: "Arquivo Inválido", description: "Selecione uma imagem.", variant: "destructive"});
    }
  };

  const handleSubmitClient = async () => {
    // Validação básica
    if (!clientData.nome_completo || !clientData.cpf) {
      toast({ title: "Erro de Validação", description: "Nome e CPF são obrigatórios.", variant: "destructive" });
      return;
    }
    const isUpdating = !!clientData.id;

    const formData = new FormData();
    formData.append('nome_completo', clientData.nome_completo.trim());
    formData.append('cpf', clientData.cpf.replace(/\D/g, '')); // Enviar CPF numérico ou com máscara se o backend espera
                                                              // O model ClienteFinal.php espera com máscara no campo cpf.
                                                              // Mas para verificação de duplicidade, ele usa numérico.
                                                              // Vamos enviar com máscara, o backend/model sanitiza.
    formData.append('cpf', clientData.cpf);


    if (clientData.data_nascimento) formData.append('data_nascimento', clientData.data_nascimento);
    if (clientData.instagram) formData.append('instagram', clientData.instagram.trim());
    if (clientData.telefone_whatsapp) formData.append('telefone_whatsapp', sanitizeTelefoneForAPI(clientData.telefone_whatsapp));
    
    if (isUpdating && clientData.id) {
        formData.append('id', clientData.id);
    }
    if (clientPhotoFile) {
        formData.append('caminho_foto_perfil', clientPhotoFile, clientPhotoFile.name);
    } else if (isUpdating && clientData.caminho_foto_perfil === null && currentClient?.caminho_foto_perfil) {
        // Se o admin limpou a foto (caminho_foto_perfil é null mas antes tinha uma)
        // Adicionar um campo para indicar remoção se o backend suportar
        // formData.append('remover_foto_perfil', '1');
    }


    try {
      await bookingService.saveClient(formData, isUpdating); // saveClient agora é assíncrono e usa FormData
      toast({ title: "Sucesso!", description: `Cliente ${isUpdating ? 'atualizado' : 'salvo'} com sucesso.` });
      setIsModalOpen(false);
      setCurrentClient(null);
      setClientData({ id: null, nome_completo: '', cpf: '', data_nascimento: '', instagram: '', telefone_whatsapp: '', caminho_foto_perfil: null });
      setClientPhotoFile(null);
      fetchClients(searchTerm); // Rebusca a lista de clientes do backend
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar o cliente.", variant: "destructive" });
    }
  };

  const handleEditClient = (client) => {
    setCurrentClient(client); // Guarda o cliente original para referência (ex: foto antiga)
    setClientData({ 
        id: client.id, // <<< USA O ID NUMÉRICO DO BANCO
        nome_completo: client.nome_completo, 
        cpf: client.cpf, // CPF já formatado do banco
        data_nascimento: client.data_nascimento || '', 
        instagram: client.instagram || '',
        telefone_whatsapp: client.telefone_whatsapp ? formatTelefone(client.telefone_whatsapp) : '',
        caminho_foto_perfil: client.caminho_foto_perfil || null // Para preview se houver
    });
    setClientPhotoFile(null); // Limpa seleção de arquivo anterior
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId) => { // Agora recebe o ID numérico
    try {
        await bookingService.deleteClient(clientId); // deleteClient agora é assíncrono
        toast({ title: "Cliente Removido", description: "O cliente foi removido com sucesso." });
        fetchClients(searchTerm); // Rebusca a lista
    } catch (error) {
        console.error("Erro ao deletar cliente:", error);
        toast({ title: "Erro ao Remover", description: error.message || "Não foi possível remover o cliente.", variant: "destructive" });
    }
  };
  
  const handleViewHistory = (client) => {
    setCurrentClient(client);
    // bookingService.getAppointmentsForClient deve ser uma chamada de API agora
    // e filtrar por id_empresa no backend.
    // setClientHistory(bookingService.getAppointmentsForClient(client.cpf)); // Exemplo, se ainda usar localStorage ou mock
    bookingService.getAppointmentsForClient(client.id) // Supondo que a API use o ID do cliente
        .then(data => setClientHistory(data.records || []))
        .catch(error => {
            toast({title: "Erro Histórico", description: "Não foi possível carregar o histórico.", variant: "destructive"});
            setClientHistory([]);
        });
    setIsHistoryModalOpen(true);
  };

  const openNewClientModal = () => {
    setCurrentClient(null);
    setClientData({ id: null, nome_completo: '', cpf: '', data_nascimento: '', instagram: '', telefone_whatsapp: '', caminho_foto_perfil: null });
    setClientPhotoFile(null);
    setIsModalOpen(true);
  };
  
  // O filtro no frontend é temporário até a busca no backend estar 100%
  // const filteredClients = clients.filter(client => 
  //   (client.nome_completo && client.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
  //   (client.cpf && client.cpf.includes(searchTerm))
  // );
  // Com fetchClients(searchTerm), a filtragem principal ocorre no backend.
  // Se getClients já retorna filtrado, filteredClients pode ser apenas 'clients'.

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent">Clientes</h1>
          <p className="text-glowfy-muted-foreground">Gerencie sua base de clientes.</p>
        </div>
        <Button onClick={openNewClientModal} className="mt-4 sm:mt-0 bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Nova Cliente
        </Button>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Input 
              type="search" 
              placeholder="Buscar cliente por nome ou CPF..." 
              className="max-w-sm bg-transparent" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {/* O botão de filtro pode ser usado para filtros mais avançados no futuro */}
            {/* <Button variant="outline" className="border-glowfy-border text-glowfy-foreground hover:bg-glowfy-muted">
              <Filter className="mr-2 h-4 w-4" /> Filtrar
            </Button> */}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center text-glowfy-muted-foreground py-4">Carregando clientes...</p>}
          {!isLoading && clients.length === 0 && <p className="text-center text-glowfy-muted-foreground py-4">Nenhum cliente encontrado.</p>}
          {!isLoading && clients.length > 0 && clients.map((client) => (
            <ClientItem 
              key={client.id} // <<< USA O ID NUMÉRICO COMO CHAVE
              client={client} 
              onEdit={handleEditClient} 
              onDelete={handleDeleteClient} 
              onViewHistory={handleViewHistory} 
            />
          ))}
        </CardContent>
      </Card>

      {/* Client Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-glowfy-card">
          <DialogHeader>
            <DialogTitle>{currentClient ? 'Editar Cliente' : 'Nova Cliente'}</DialogTitle>
            <DialogDescription>Preencha os dados da cliente abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Campo de Foto */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="caminho_foto_perfil_input" className="text-right">Foto</Label>
                <Input 
                    id="caminho_foto_perfil_input" 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoInputChange} 
                    className="col-span-3 bg-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-100 file:text-pink-600 hover:file:bg-pink-200 cursor-pointer"
                />
            </div>
            {/* Preview da foto (se houver no clientData.caminho_foto_perfil ou clientPhotoFile) */}
            { (clientData.caminho_foto_perfil || clientPhotoFile) &&
                <div className="col-span-4 flex justify-center">
                    <img 
                        src={clientPhotoFile ? URL.createObjectURL(clientPhotoFile) : (clientData.caminho_foto_perfil?.startsWith('uploads/') ? `https://glowfy.leadprime.com.br/${clientData.caminho_foto_perfil}` : clientData.caminho_foto_perfil || "https://via.placeholder.com/150/f0f0f0/999999?text=Sem+Foto")} 
                        alt="Preview" 
                        className="h-24 w-24 rounded-full object-cover"
                    />
                </div>
            }

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome_completo" className="text-right">Nome</Label>
              <Input id="nome_completo" value={clientData.nome_completo} onChange={handleInputChange} className="col-span-3 bg-transparent" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf" className="text-right">CPF</Label>
              <Input id="cpf" value={clientData.cpf} onChange={handleInputChange} className="col-span-3 bg-transparent" disabled={!!currentClient} placeholder="000.000.000-00" maxLength="14"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data_nascimento" className="text-right">Data Nasc.</Label>
              <Input id="data_nascimento" type="date" value={clientData.data_nascimento} onChange={handleInputChange} className="col-span-3 bg-transparent" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone_whatsapp" className="text-right">Telefone</Label>
              <Input id="telefone_whatsapp" type="tel" value={clientData.telefone_whatsapp} onChange={handleInputChange} className="col-span-3 bg-transparent" placeholder="5527999999999" maxLength="15"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instagram" className="text-right">Instagram</Label>
              <Input id="instagram" value={clientData.instagram} onChange={handleInputChange} className="col-span-3 bg-transparent" placeholder="@usuario" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSubmitClient} className="bg-glowfy-primary text-glowfy-primary-foreground hover:bg-glowfy-primary/90">{currentClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
            {/* ... Seu modal de histórico, certifique-se que getAppointmentsForClient usa o ID numérico do cliente ... */}
            <DialogContent className="sm:max-w-md bg-glowfy-card">
                <DialogHeader>
                    <DialogTitle>Histórico de {currentClient?.nome_completo}</DialogTitle>
                    <DialogDescription>Agendamentos anteriores e futuros.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full rounded-md border p-2 my-2">
                    {clientHistory.length > 0 ? (
                        clientHistory.map(app => (
                            <div key={app.agendamento_id} className="p-2 mb-2 border-b border-glowfy-border last:border-b-0">
                                <p className="text-sm font-semibold text-glowfy-primary">{new Date(app.data_agendamento).toLocaleDateString('pt-BR')} às {app.hora_inicio}</p>
                                <p className="text-xs text-glowfy-foreground">Serviço: {app.nome_servico}</p>
                                <p className="text-xs text-glowfy-muted-foreground">Status: <span className={`font-medium ${app.status_agendamento === 'finalizado' ? 'text-green-500' : (app.status_agendamento === 'cancelado_cliente' || app.status_agendamento === 'cancelado_salao') ? 'text-red-500' : 'text-blue-500'}`}>{app.status_agendamento}</span></p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-glowfy-muted-foreground py-4">Nenhum histórico de agendamento para esta cliente.</p>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={() => setIsHistoryModalOpen(false)} className="bg-glowfy-primary text-glowfy-primary-foreground hover:bg-glowfy-primary/90">Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default ClientsPage;