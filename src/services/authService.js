// src/services/authService.js
import apiClient from './api';

const login = async (email, password) => {
  try {
    const data = await apiClient('auth_login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Se o login for bem-sucedido, a API retorna o token e dados do usuário
    if (data && data.token) {
      localStorage.setItem('glowfy_token', data.token);
      localStorage.setItem('glowfy_user', JSON.stringify(data.user)); // Armazena dados do usuário
      localStorage.setItem('glowfy_token_expires_at', data.expiresAt);
    }
    return data; // Retorna todos os dados da resposta (incluindo user, token, message)
  } catch (error) {
    // Limpa o token em caso de falha no login, se houver um antigo
    // localStorage.removeItem('glowfy_token');
    // localStorage.removeItem('glowfy_user');
    // localStorage.removeItem('glowfy_token_expires_at');
    console.error('Erro no serviço de login:', error);
    throw error; // Relança o erro para ser tratado no componente
  }
};

const logout = () => {
  localStorage.removeItem('glowfy_token');
  localStorage.removeItem('glowfy_user');
  localStorage.removeItem('glowfy_token_expires_at');
  // Poderia adicionar uma chamada a um endpoint de logout na API se existir
};

const getCurrentUser = () => {
  const user = localStorage.getItem('glowfy_user');
  return user ? JSON.parse(user) : null;
};

const getToken = () => {
  return localStorage.getItem('glowfy_token');
};

// Verifica se o token existe e não está expirado (simplificado)
const isAuthenticated = () => {
  const token = getToken();
  const expiresAt = localStorage.getItem('glowfy_token_expires_at');
  if (token && expiresAt) {
    return (Number(expiresAt) * 1000) > Date.now(); // Converte timestamp PHP (segundos) para JS (ms)
  }
  return false;
};


export default {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
};