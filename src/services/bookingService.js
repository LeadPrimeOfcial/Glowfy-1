// src/services/bookingService.js
import apiClient from './api';

// === FUNÇÕES PARA CLIENTES (ADMIN) ===
export const getClients = (searchTerm = "") => {
  let endpoint = 'clientes_read.php';
  if (searchTerm) {
    endpoint += `?searchTerm=${encodeURIComponent(searchTerm)}`;
  }
  return apiClient(endpoint, { method: 'GET' }, true);
};

export const saveClient = (clientFormData, isUpdating = false) => {
  const endpoint = isUpdating ? 'clientes_update.php' : 'clientes_create.php';
  return apiClient(endpoint, { method: 'POST', body: clientFormData, isFormData: true }, true);
};

export const deleteClient = (clientId) => {
  return apiClient('clientes_delete.php', { method: 'POST', body: { id: clientId } }, true);
};

// === FUNÇÕES PARA SERVIÇOS (ADMIN) ===
export const getAllServicesAdmin = () => {
    return apiClient('servicos_read.php', { method: 'GET' }, true);
};
export const getServices = getAllServicesAdmin; // Alias

export const saveService = (serviceData, isUpdating = false) => {
    const endpoint = isUpdating ? 'servicos_update.php' : 'servicos_create.php';
    return apiClient(endpoint, { method: 'POST', body: serviceData }, true);
};

export const deleteService = (serviceId) => {
    return apiClient('servicos_delete.php', { method: 'POST', body: { id: serviceId } }, true);
};

// === FUNÇÕES PARA AGENDAMENTOS (ADMIN) ===
export const getAppointmentsAdmin = (filters = {}) => { 
    let queryString = '';
    if (Object.keys(filters).length > 0) {
        queryString = '?' + new URLSearchParams(filters).toString();
    }
    return apiClient(`agendamentos_admin_read.php${queryString}`, { method: 'GET' }, true);
};

export const saveAppointmentAdmin = (appointmentData, isUpdating = false) => {
    const endpoint = isUpdating ? 'agendamentos_admin_update.php' : 'agendamentos_admin_create.php';
    return apiClient(endpoint, { method: 'POST', body: appointmentData }, true);
};

export const updateAppointmentStatusAdmin = (action, appointmentId, additionalData = {}) => {
    let endpoint = '';
    if (action === 'cancel') {
        endpoint = 'agendamentos_admin_cancel.php';
    } else if (action === 'finalize') {
        endpoint = 'agendamentos_admin_finalize.php';
    } else {
        return Promise.reject(new Error("Ação de status de agendamento inválida."));
    }
    const payload = { id_agendamento: appointmentId, ...additionalData };
    return apiClient(endpoint, { method: 'POST', body: payload }, true);
};

export const getAppointmentsForClientAdmin = (clienteId) => { 
    return apiClient(`clientes_agendamentos_read.php?id_cliente=${clienteId}`, { method: 'GET' }, true);
};

// === FUNÇÕES PARA CONFIGURAÇÕES GERAIS (ADMIN) ===
export const getSettingsAdmin = () => { 
    return apiClient('config_geral_read.php', { method: 'GET' }, true); 
};
export const saveSettingsAdmin = (settingsData) => { 
    return apiClient('config_geral_save.php', { method: 'POST', body: settingsData }, true);
};

// === FUNÇÕES PARA HORÁRIOS DE FUNCIONAMENTO (ADMIN) ===
export const getWorkingHoursAdmin = () => { 
    return apiClient('config_horarios_read.php', { method: 'GET' }, true);
};
export const saveWorkingHoursAdmin = (horariosData) => { 
    return apiClient('config_horarios_save.php', { method: 'POST', body: { horarios: horariosData } }, true);
};

// === FUNÇÕES PARA FORMAS DE PAGAMENTO (ADMIN) ===
export const getAllPaymentMethodsAdmin = () => { 
    console.warn("getAllPaymentMethodsAdmin chamado. Endpoint PHP 'formas_pagamento_admin_read.php' precisa ser implementado/ajustado.");
    return apiClient('formas_pagamento_admin_read.php', { method: 'GET' }, true); 
};
export const savePaymentMethodAdmin = (paymentMethodData, isUpdating = false) => {
    const endpoint = isUpdating ? 'formas_pagamento_admin_update.php' : 'formas_pagamento_admin_create.php';
    console.warn(`savePaymentMethodAdmin chamado. Endpoint ${endpoint} precisa ser implementado/ajustado.`);
    return apiClient(endpoint, { method: 'POST', body: paymentMethodData}, true);
};
export const deletePaymentMethodAdmin = (paymentMethodId) => {
    console.warn("deletePaymentMethodAdmin chamado. Endpoint 'formas_pagamento_admin_delete.php' precisa ser implementado/ajustado.");
    return apiClient('formas_pagamento_admin_delete.php', { method: 'POST', body: {id: paymentMethodId}}, true);
};

// === FUNÇÕES PÚBLICAS (Usadas por ClientBookingPage.jsx) ===
export const getServicosPublic = (slugEmpresa) => {
  if (!slugEmpresa) return Promise.reject(new Error("Slug da empresa é obrigatório."));
  return apiClient(`servicos_read.php?slug_empresa=${slugEmpresa}`);
};

export const getAvailabilityPublic = (slugEmpresa, date, serviceId) => {
  if (!slugEmpresa) return Promise.reject(new Error("Slug da empresa é obrigatório."));
  return apiClient(`agendamentos_availability.php?slug_empresa=${slugEmpresa}&date=${date}&serviceId=${serviceId}`);
};

export const checkClientByCpfPublic = (slugEmpresa, cpf) => {
  if (!slugEmpresa) return Promise.reject(new Error("Slug da empresa é obrigatório."));
  const numericCpf = cpf.replace(/\D/g, '');
  return apiClient(`clientes_read.php?slug_empresa=${slugEmpresa}&cpf=${numericCpf}`);
};

export const createAgendamentoPublic = (formData) => { 
  return apiClient('agendamentos_create.php', { method: 'POST', body: formData, isFormData: true });
};

export const getTermosAtendimentoPublic = (slugEmpresa) => {
  if (!slugEmpresa) return Promise.reject(new Error("Slug da empresa é obrigatório."));
  return apiClient(`config_geral_read.php?slug_empresa=${slugEmpresa}`);
};

// =============================================================
// EXPORT DEFAULT: Agrupa todas as funções para importação padrão
// =============================================================
const bookingService = {
  // Funções do Admin
  getClients,
  saveClient,
  deleteClient,
  getAllServicesAdmin,
  getServices: getAllServicesAdmin, // Alias para admin
  saveService,
  deleteService,
  getAppointments: getAppointmentsAdmin, // Alias para admin
  saveAppointment: saveAppointmentAdmin, 
  updateAppointmentStatus: updateAppointmentStatusAdmin, 
  getAppointmentsForClient: getAppointmentsForClientAdmin, 
  getSettings: getSettingsAdmin, // Alias para admin
  saveSettings: saveSettingsAdmin, 
  getWorkingHours: getWorkingHoursAdmin, // Alias para admin
  saveWorkingHours: saveWorkingHoursAdmin,
  // Corrigindo a disponibilização de getAllPaymentMethodsAdmin no default export
  getPaymentMethods: getAllPaymentMethodsAdmin, // Alias para admin
  getAllPaymentMethodsAdmin, // <<< ADICIONADO getAllPaymentMethodsAdmin diretamente aqui também

  savePaymentMethod: savePaymentMethodAdmin, 
  deletePaymentMethod: deletePaymentMethodAdmin,

  // Funções Públicas - Se ClientBookingPage.jsx importar 'bookingService' como default
  // e chamar bookingService.getServicosPublic(), elas precisam estar aqui.
  // Caso contrário, ClientBookingPage.jsx deve importar nomeadamente.
  // Para manter a separação, ClientBookingPage.jsx deve ter seu próprio clientBookingService.js
  // ou importar nomeadamente as funções públicas daqui.
  // Por agora, vou adicionar as públicas aqui também para garantir que funcionem se você tiver unificado.
  getServicosPublic,
  getAvailabilityPublic,
  checkClientByCpfPublic,
  createAgendamentoPublic,
  getTermosAtendimentoPublic,
};

export default bookingService;