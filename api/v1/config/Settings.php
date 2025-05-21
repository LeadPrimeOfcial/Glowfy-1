<?php
// api/v1/config/Settings.php

// ATENÇÃO: Mantenha esta chave secreta e segura!
// Gere uma chave aleatória forte para produção.
define('JWT_SECRET_KEY', 'aa19f723efab804484c57450e5757e30f6a3bb6634d20b8ab16bd157e7044a3e');
define('JWT_ISSUER', 'https://glowfy.leadprime.com.br'); // O emissor do token (seu domínio)
define('JWT_AUDIENCE', 'https://glowfy.leadprime.com.br'); // A audiência do token
define('JWT_EXPIRATION_TIME_SECONDS', 3600); // Expiração do token (ex: 1 hora = 3600s)
?>