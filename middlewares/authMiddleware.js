const jwt = require('jsonwebtoken');

// 🔒 Tomamos la firma única y segura de tu archivo .env
const CLAVE_SECRETA = process.env.JWT_SECRET || "ClavePorDefectoSuperSecreta123";

// Middleware para verificar si el usuario inició sesión
const verificarToken = (req, res, next) => {
    // Buscamos el token en las cookies del navegador (o en headers si fuera necesario)
    const token = req.cookies['token'] || req.headers['authorization'];
    
    if (!token) {
        return res.redirect('/');
    }

    try {
        const tokenLimpio = token.split(" ")[1] || token;
        
        // Verificamos usando la clave del .env
        const verificado = jwt.verify(tokenLimpio, CLAVE_SECRETA);
        req.usuario = verificado; 
        next();
    } catch (error) {
        return res.redirect('/'); // Si falló la firma o expiró, al login
    }
};

// Middleware para verificar si el usuario es ADMINISTRADOR (Limpio y Seguro)
const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de Administrador.' });
    }
};

// Exportamos las funciones y la clave unificada
module.exports = { verificarToken, esAdmin, CLAVE_SECRETA };