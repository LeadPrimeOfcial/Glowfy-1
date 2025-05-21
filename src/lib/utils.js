// src/lib/utils.js

// Função para ajudar a concatenar classes do Tailwind (você pode manter a sua original se usa clsx/tailwind-merge)
export function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}

export function formatCPF(value) {
  if (!value) return "";
  let apenasNumeros = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
  
  // Limita a 11 dígitos para não aplicar máscara errada durante a digitação
  if (apenasNumeros.length > 11) apenasNumeros = apenasNumeros.substring(0, 11);

  let formatado = apenasNumeros;
  if (apenasNumeros.length > 9) {
    formatado = apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  } else if (apenasNumeros.length > 6) {
    formatado = apenasNumeros.replace(/(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
  } else if (apenasNumeros.length > 3) {
    formatado = apenasNumeros.replace(/(\d{3})(\d{1,3})$/, "$1.$2");
  }
  return formatado;
}

// Função para formatar o telefone para exibição (Ex: +55 (27) 99999-9999)
export function formatTelefone(value) {
  if (!value) return "";
  let apenasNumeros = value.replace(/\D/g, "");

  if (apenasNumeros.startsWith("55")) {
    if (apenasNumeros.length > 13) apenasNumeros = apenasNumeros.slice(0, 13); // 55 + DD + 9 digitos
    if (apenasNumeros.length > 4) { // 55DD...
        if (apenasNumeros.length > 9) { // 55DDNNNNN.... (celular com 9)
            return apenasNumeros.replace(/^(\d{2})(\d{2})(\d{1})(\d{4})(\d{4})$/, "+$1 ($2) $3 $4-$5");
        } else if (apenasNumeros.length > 7) { // 55DDNNNN.... (fixo ou celular sem 9)
             return apenasNumeros.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})$/, "+$1 ($2) $3-$4");
        } else if (apenasNumeros.length > 4){
             return apenasNumeros.replace(/^(\d{2})(\d{2})(\d{0,5})$/, "+$1 ($2) $3");
        }
    } else if (apenasNumeros.length > 2) {
        return apenasNumeros.replace(/^(\d{2})(\d*)$/, "+$1 ($2");
    }
     return `+${apenasNumeros}`;

  } else { // Sem DDI 55 no início
    if (apenasNumeros.length > 11) apenasNumeros = apenasNumeros.slice(0, 11); // DD + 9 digitos
    if (apenasNumeros.length > 6) { // DDNNNN...
        if (apenasNumeros.length > 10) { // DD9NNNNNNNN
            return apenasNumeros.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1) $2 $3-$4");
        } else if (apenasNumeros.length > 6) { // DDNNNNNNNN
            return apenasNumeros.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
        }
    } else if (apenasNumeros.length > 2) {
        return apenasNumeros.replace(/^(\d{2})(\d*)$/, "($1) $2");
    }
    return apenasNumeros;
  }
}

// Função para enviar apenas os números do telefone para a API, GARANTINDO o DDI 55
export function sanitizeTelefoneForAPI(value) {
    if (!value) return null;
    let apenasNumeros = value.replace(/\D/g, "");
    
    // Se já começa com 55 e tem o tamanho correto (12 ou 13 dígitos)
    if (apenasNumeros.startsWith("55") && (apenasNumeros.length === 12 || apenasNumeros.length === 13)) {
        return apenasNumeros;
    }
    // Se não começa com 55, mas tem tamanho de DDD + número (10 ou 11 dígitos)
    if (!apenasNumeros.startsWith("55") && (apenasNumeros.length === 10 || apenasNumeros.length === 11)) {
        return "55" + apenasNumeros;
    }
    // Caso contrário, pode ser um formato inválido para a API
    return null; 
}