// src/services/clientBookingService.js
import apiClient from './api';

// Função para buscar serviços de uma empresa específica
const getServicos = (slugEmpresa) => {
  if (!slugEmpresa) {
    // Lançar um erro ou retornar uma promessa rejeitada se o slug não for fornecido
    return Promise.reject(new Error("Slug da empresa é obrigatório para buscar serviços."));
  }
  return apiClient(`servicos_read.php?slug_empresa=${slugEmpresa}`);
};

// Função para buscar horários disponíveis de uma empresa específica
const getAvailability = (slugEmpresa, date, serviceId) => {
  if (!slugEmpresa) {
    return Promise.reject(new Error("Slug da empresa é obrigatório para buscar disponibilidade."));
  }
  return apiClient(`agendamentos_availability.php?slug_empresa=${slugEmpresa}&date=${date}&serviceId=${serviceId}`);
};

// Função para verificar cliente por CPF em uma empresa específica
const checkClientByCpf = (slugEmpresa, cpf) => {
  if (!slugEmpresa) {
    return Promise.reject(new Error("Slug da empresa é obrigatório para verificar CPF."));
  }
  const numericCpf = cpf.replace(/\D/g, ''); // CPF já é numérico do ClientBookingPage
  return apiClient(`clientes_read.php?slug_empresa=${slugEmpresa}&cpf=${numericCpf}`);
};

// Função para criar agendamento (já espera formData que inclui slug_empresa)
const createAgendamento = (formData) => {
  // ClientBookingPage.jsx já deve ter adicionado 'slug_empresa' ao formData.
  // O apiClient (em api.js) já foi ajustado para tratar 'isFormData: true'
  // e não definir Content-Type, permitindo que o navegador o faça para multipart/form-data.
  return apiClient('agendamentos_create.php', {
    method: 'POST',
    body: formData,
    isFormData: true // Sinalizador para o apiClient
  });
};

// Função para buscar termos de atendimento de uma empresa específica
const getTermosAtendimento = (slugEmpresa) => {
  if (!slugEmpresa) {
    return Promise.reject(new Error("Slug da empresa é obrigatório para buscar termos."));
  }
  // O endpoint config_geral_read.php já foi ajustado para receber slug_empresa
  return apiClient(`config_geral_read.php?slug_empresa=${slugEmpresa}`);
};

export default {
  getServicos,
  getAvailability,
  checkClientByCpf,
  createAgendamento,
  getTermosAtendimento
};