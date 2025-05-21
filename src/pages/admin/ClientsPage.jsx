import React, { useState, useEffect } from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { PlusCircle, Filter, Edit, Trash2, Instagram, Eye, History } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
    import { useToast } from '@/components/ui/use-toast';
    import { getClients, saveClient, deleteClient, getAppointmentsForClient } from '@/services/bookingService';
    import { ScrollArea } from '@/components/ui/scroll-area';

    const ClientItem = ({ client, onEdit, onDelete, onViewHistory }) => (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between p-4 border border-glowfy-border rounded-lg bg-glowfy-card mb-3 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center">
           <img  alt={`Avatar de ${client.name}`} className="h-10 w-10 rounded-full mr-4 object-cover" src="https://images.unsplash.com/photo-1658204212985-e0126040f88f" />
          <div>
            <p className="font-semibold text-glowfy-primary">{client.name}</p>
            <p className="text-xs text-glowfy-muted-foreground">CPF: {client.cpf}</p>
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
          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10 h-8 w-8" onClick={() => onDelete(client.cpf)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </motion.div>
    );

    const ClientsPage = () => {
      const { toast } = useToast();
      const [clients, setClientsState] = useState([]);
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
      const [currentClient, setCurrentClient] = useState(null);
      const [clientHistory, setClientHistory] = useState([]);
      const [clientData, setClientData] = useState({
        name: '', cpf: '', dob: '', instagram: '', id: null
      });
      const [searchTerm, setSearchTerm] = useState('');

      useEffect(() => {
        setClientsState(getClients());
      }, []);

      const handleInputChange = (e) => {
        const { id, value } = e.target;
        setClientData(prev => ({ ...prev, [id]: value }));
      };

      const handleSubmitClient = () => {
        if (!clientData.name || !clientData.cpf) {
          toast({ title: "Erro", description: "Nome e CPF são obrigatórios.", variant: "destructive" });
          return;
        }
        saveClient(clientData);
        setClientsState(getClients());
        setIsModalOpen(false);
        setCurrentClient(null);
        setClientData({ name: '', cpf: '', dob: '', instagram: '', id: null});
        toast({ title: "Sucesso", description: `Cliente ${clientData.id ? 'atualizado' : 'salvo'} com sucesso.` });
      };

      const handleEditClient = (client) => {
        setCurrentClient(client);
        setClientData({ 
            name: client.name, 
            cpf: client.cpf, 
            dob: client.dob || '', 
            instagram: client.instagram || '',
            id: client.cpf // Use CPF as ID for localStorage simplicity
        });
        setIsModalOpen(true);
      };

      const handleDeleteClient = (cpf) => {
        deleteClient(cpf);
        setClientsState(getClients());
        toast({ title: "Cliente Removido", description: "O cliente foi removido com sucesso." });
      };
      
      const handleViewHistory = (client) => {
        setCurrentClient(client);
        setClientHistory(getAppointmentsForClient(client.cpf));
        setIsHistoryModalOpen(true);
      };

      const openNewClientModal = () => {
        setCurrentClient(null);
        setClientData({ name: '', cpf: '', dob: '', instagram: '', id: null });
        setIsModalOpen(true);
      };
      
      const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf.includes(searchTerm)
      );

      return (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
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
                <Input type="search" placeholder="Buscar cliente por nome ou CPF..." className="max-w-sm bg-transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Button variant="outline" className="border-glowfy-border text-glowfy-foreground hover:bg-glowfy-muted">
                  <Filter className="mr-2 h-4 w-4" /> Filtrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredClients.length > 0 ? filteredClients.map((client) => <ClientItem key={client.cpf} client={client} onEdit={handleEditClient} onDelete={handleDeleteClient} onViewHistory={handleViewHistory} />) : <p className="text-center text-glowfy-muted-foreground py-4">Nenhum cliente encontrado.</p>}
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input id="name" value={clientData.name} onChange={handleInputChange} className="col-span-3 bg-transparent" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cpf" className="text-right">CPF</Label>
                  <Input id="cpf" value={clientData.cpf} onChange={handleInputChange} className="col-span-3 bg-transparent" disabled={!!currentClient} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dob" className="text-right">Data Nasc.</Label>
                  <Input id="dob" type="date" value={clientData.dob} onChange={handleInputChange} className="col-span-3 bg-transparent" />
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
            <DialogContent className="sm:max-w-md bg-glowfy-card">
                <DialogHeader>
                    <DialogTitle>Histórico de {currentClient?.name}</DialogTitle>
                    <DialogDescription>Agendamentos anteriores e futuros.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full rounded-md border p-2 my-2">
                    {clientHistory.length > 0 ? (
                        clientHistory.map(app => (
                            <div key={app.id} className="p-2 mb-2 border-b border-glowfy-border last:border-b-0">
                                <p className="text-sm font-semibold text-glowfy-primary">{new Date(app.date).toLocaleDateString('pt-BR')} às {app.time}</p>
                                <p className="text-xs text-glowfy-foreground">Serviço: {app.serviceName}</p>
                                <p className="text-xs text-glowfy-muted-foreground">Status: <span className={`font-medium ${app.status === 'completed' ? 'text-green-500' : app.status === 'canceled' ? 'text-red-500' : 'text-blue-500'}`}>{app.status}</span></p>
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