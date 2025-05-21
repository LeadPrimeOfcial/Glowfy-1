// src/services/api.js

const API_BASE_URL = 'https://glowfy.leadprime.com.br/api/v1/controllers/';

const apiClient = async (endpoint, options = {}, isProtected = false) => {
  const baseHeaders = {
    'Accept': 'application/json',
  };

  const finalHeaders = { ...baseHeaders, ...options.headers };
  let bodyToSend = options.body;

  if (options.body instanceof FormData || options.isFormData) {
    delete finalHeaders['Content-Type'];
  } else if (options.body && typeof options.body === 'object' && options.body !== null) {
    finalHeaders['Content-Type'] = 'application/json';
    bodyToSend = JSON.stringify(options.body);
  } else if (options.body) {
    if (!finalHeaders['Content-Type'] && options.method && options.method.toUpperCase() !== 'GET' && options.method.toUpperCase() !== 'HEAD') {
        finalHeaders['Content-Type'] = 'application/json';
    }
  }

  if (isProtected) {
    const token = localStorage.getItem('glowfy_token');
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('Tentando acessar rota protegida sem token.');
    }
  }

  const config = {
    ...options,
    headers: finalHeaders,
    body: bodyToSend,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Se o status for 204 (No Content), não há corpo para ler.
    if (response.status === 204) {
        return null;
    }

    // Lê o corpo como texto primeiro, pois isso sempre funciona.
    const responseText = await response.text();

    if (!response.ok) {
        // Tenta parsear o texto como JSON se for um erro, pois a API pode retornar JSON de erro.
        let errorData = { message: `Erro ${response.status}: ${response.statusText}`, details: responseText };
        try {
            const parsedJsonError = JSON.parse(responseText);
            // Se a mensagem da API estiver no JSON, use-a
            if (parsedJsonError && parsedJsonError.message) {
                errorData = { ...parsedJsonError, originalStatus: response.status };
            }
        } catch (e) {
            // Não era JSON, mantenha o erro com base no texto.
        }
        return Promise.reject(errorData);
    }

    // Se a resposta for OK, tenta parsear como JSON.
    try {
        return JSON.parse(responseText);
    } catch (e) {
        // Se a resposta for OK mas não for JSON válido (o que seria inesperado para esta API),
        // retorna o texto puro.
        console.warn("API respondeu com status OK, mas o corpo não é JSON válido:", responseText);
        return responseText;
    }

  } catch (error) // Erros de rede ou outros erros do fetch
  {
    console.error('Erro na chamada da API (apiClient - catch geral):', error);
    const errorMessage = error.message || 'Erro desconhecido na comunicação com a API.';
    return Promise.reject({ message: errorMessage, originalError: error });
  }
};

export default apiClient;