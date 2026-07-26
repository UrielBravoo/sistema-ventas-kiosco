const jwt = require('jsonwebtoken');

// 🔒 Tomamos la firma única y segura de tu archivo .env
const CLAVE_SECRETA = process.env.JWT_SECRET || "ClavePorDefectoSuperSecreta123";

// Middleware para verificar si el usuario inició sesión
const verificarToken = (req, res, next) => {
    // 1. Buscamos el token en las cookies (req.cookies) o en los headers (Authorization)
    const tokenCookie = req.cookies ? req.cookies.token : null;
    const authHeader = req.headers['authorization'];
    
    let token = tokenCookie || authHeader;

    if (!token) {
        // Si la petición viene de un fetch/API, devolvemos JSON 401
        if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api')) {
            return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
        }
        return res.redirect('/login.html');
    }

    try {
        // Limpiamos el prefijo 'Bearer ' si viene desde los headers
        const tokenLimpio = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        
        // Verificamos usando la clave del .env
        const verificado = jwt.verify(tokenLimpio, CLAVE_SECRETA);
        req.usuario = verificado; 
        next();
    } catch (error) {
        if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api')) {
            return res.status(401).json({ error: 'Token inválido o expirado.' });
        }
        return res.redirect('/login.html');
    }
};

// Middleware para verificar si el usuario es ADMINISTRADOR
const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de Administrador.' });
    }
};

// Exportamos las funciones y la clave unificada
module.exports = { verificarToken, esAdmin, CLAVE_SECRETA };