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

        const usuarioExistente = await Usuario.findOne({ where: { username } });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);

        const nuevoUsuario = await Usuario.create({
            username,
            password: passwordEncriptada,
            role: role || 'cajero'
        });

        return res.status(201).json({ 
            mensaje: 'Usuario registrado con éxito.', 
            usuario: { id: nuevoUsuario.id, username: nuevoUsuario.username, role: nuevoUsuario.role } 
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
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

        const usuario = await Usuario.findOne({ where: { username } });
        if (!usuario) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        const contraseñaValida = await bcrypt.compare(password, usuario.password);
        if (!contraseñaValida) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, role: usuario.role },
            CLAVE_SECRETA,
            { expiresIn: '24h' }
        );

        // Configuramos la cookie de forma flexible para evitar bloqueos en localhost
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Respuesta limpia en formato JSON
        return res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: { 
                id: usuario.id, 
                username: usuario.username, 
                role: usuario.role 
            }
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;