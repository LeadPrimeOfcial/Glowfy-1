// src/services/clientBookingService.js
import apiClient from './api';

const getServicos = () => {
  return apiClient('servicos_read.php');
};

const getAvailability = (date, serviceId) => {
  return apiClient(`agendamentos_availability.php?date=${date}&serviceId=${serviceId}`);
};

const checkClientByCpf = (cpf) => {
  const numericCpf = cpf.replace(/\D/g, '');
  return apiClient(`clientes_read.php?cpf=${numericCpf}`);
};

// ----- FUNÇÃO MODIFICADA -----
// Agora ela espera receber 'formData' que já é um objeto FormData
const createAgendamento = (formData) => {
  // O objeto 'formData' já foi preparado em ClientBookingPage.jsx
  // com todos os campos necessários (cpf_cliente, id_servico, client_photo, etc.)

  // Passamos o formData diretamente para o apiClient.
  // Adicionamos uma propriedade 'isFormData: true' para que o apiClient saiba como tratar.
  return apiClient('agendamentos_create.php', {
    method: 'POST',
    body: formData, // Passa o FormData diretamente
    isFormData: true // Sinalizador para o apiClient
  });
};

const getTermosAtendimento = () => {
    return apiClient('config_geral_read.php');
};

export default {
  getServicos,
  getAvailability,
  checkClientByCpf,
  createAgendamento,
  getTermosAtendimento
};