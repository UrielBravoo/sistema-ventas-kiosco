const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { CLAVE_SECRETA } = require('../middlewares/authMiddleware');

// ==========================================
// 1. REGISTRAR UN NUEVO USUARIO
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña obligatorios.' });
        }

        // Verificamos si el nombre de usuario ya existe en la base de datos
        const usuarioExistente = await Usuario.findOne({ where: { username } });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
        }

        // ENCRIPTACIÓN: Encriptamos la contraseña 10 veces para que sea súper segura
        const passwordEncriptada = await bcrypt.hash(password, 10);

        // Creamos el usuario en SQLite
        const nuevoUsuario = await Usuario.create({
            username,
            password: passwordEncriptada,
            role: role || 'usuario' // Si no se pasa rol, por defecto es empleado común
        });

        res.status(201).json({ 
            mensaje: 'Usuario registrado con éxito.', 
            usuario: { id: nuevoUsuario.id, username: nuevoUsuario.username, role: nuevoUsuario.role } 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. INICIAR SESIÓN (LOGIN)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña obligatorios.' });
        }

        // Buscamos al usuario por su nombre
        const usuario = await Usuario.findOne({ where: { username } });
        if (!usuario) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        // COMPARACIÓN: Comparamos la contraseña que ingresó con la encriptada en la BD
        const contraseñaValida = await bcrypt.compare(password, usuario.password);
        if (!contraseñaValida) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        // GENERACIÓN DEL TOKEN: Armamos el "pase digital" con sus datos clave
        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, role: usuario.role },
            CLAVE_SECRETA,
            { expiresIn: '24h' } // El token dura un día entero activo
        );

        // =========================================================================
        // 🍪 INYECCIÓN DE COOKIE SEGURA HTTPONLY (MEJOR PRÁCTICA)
        // =========================================================================
        // Al usar 'httpOnly: true', JavaScript en el frontend no puede leer esta cookie.
        // Esto protege completamente tu token contra robo de identidad por código malicioso (XSS).
        res.cookie('token', token, {
            httpOnly: true,                             // Súper seguro: invisible para el JS del cliente
            secure: process.env.NODE_ENV === 'production', // Solo viaja por HTTPS en producción
            sameSite: 'Strict',                         // Protege contra ataques CSRF
            maxAge: 24 * 60 * 60 * 1000                 // Expira en 24 horas (en milisegundos)
        });
        // =========================================================================

        // Devolvemos la respuesta al frontend (el token también viaja por si tus llamadas API aún lo usan)
        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: { username: usuario.username, role: usuario.role }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;