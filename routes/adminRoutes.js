const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const Venta = require('../models/Venta');
const DetalleVenta = require('../models/DetalleVenta'); 
const Producto = require('../models/Producto');
const bcrypt = require('bcrypt');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// ==========================================
// REGISTRAR UN EMPLEADO
// ==========================================
router.post('/usuarios', verificarToken, esAdmin, async (req, res) => {
    try {
        const { username, nombre, password, role } = req.body;

        if (!username || !nombre || !password || !role) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const usuarioExistente = await Usuario.findOne({ where: { username } });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
        }

        const passwordHasheada = await bcrypt.hash(password, 10);

        const nuevoUsuario = await Usuario.create({
            username,
            nombre, 
            password: passwordHasheada,
            role 
        });

        res.status(201).json({ mensaje: `Usuario ${nuevoUsuario.username} creado.` });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ error: 'Error al registrar el empleado' });
    }
});

// ==========================================
// ELIMINAR UN USUARIO DEL SISTEMA
// ==========================================
router.delete('/usuarios/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (req.usuario && req.usuario.id == id) {
            return res.status(400).json({ error: 'No podés eliminar tu propia cuenta de administrador.' });
        }

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'El usuario no existe.' });
        }

        await usuario.destroy();
        res.json({ mensaje: 'Usuario removido con éxito del sistema.' });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
});

// ==========================================
// OBTENER TODOS LOS USUARIOS
// ==========================================
router.get('/usuarios', verificarToken, esAdmin, async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'username', 'role', 'createdAt']
        });
        res.json(usuarios);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: 'Error al acceder al despacho de administración' });
    }
});
// ==========================================
// 1. MONITOR GENERAL: Ventas globales (CORREGIDO ORDENAMIENTO)
// ==========================================
router.get('/ventas-globales', verificarToken, esAdmin, async (req, res) => {
    try {
        const ultimasVentas = await Venta.findAll({
            limit: 20,
            // CAMBIO AQUÍ: Ordenamos por 'fecha' que sí existe en tu base de datos
            order: [['fecha', 'DESC']] 
        });
        
        const mapeadas = ultimasVentas.map(v => {
            return {
                id: v.id,
                total: typeof v.total === 'number' ? v.total : parseFloat(v.total || 0),
                usuario: v.usuario || "Sistema", 
                fecha: v.fecha || new Date() // Mandamos la fecha real
            };
        });

        res.json(mapeadas);
    } catch (error) {
        console.error("Error en monitor global:", error);
        res.status(500).json({ error: 'Error en monitor global' });
    }
});

// ==========================================
// 2. DESPACHO ESPECÍFICO: KPIs y desglose
// ==========================================
router.get('/ventas/:username', verificarToken, esAdmin, async (req, res) => {
    try {
        const { username } = req.params;

        const ventasUser = await Venta.findAll({
            where: { usuario: username },
            // Agregamos ordenamiento por fecha aquí también por consistencia
            order: [['fecha', 'DESC']], 
            include: [{ 
                model: DetalleVenta, 
                include: [{ model: Producto, required: false }] 
            }]
        });

        let totalFacturado = 0;
        let itemsDesglosados = [];

        ventasUser.forEach(v => {
            totalFacturado += typeof v.total === 'number' ? v.total : parseFloat(v.total || 0);
            
            const detalles = v.DetalleVentas || v.detalle_ventas || v.DetalleVenta || [];
            
            detalles.forEach(d => {
                const productoData = d.Producto || d.producto;
                
                itemsDesglosados.push({
                    hora: v.fecha, // Usamos v.fecha en lugar de v.createdAt
                    producto: productoData ? productoData.nombre : 'Producto Eliminado',
                    cantidad: d.cantidad,
                    subtotal: typeof d.subtotal === 'number' ? d.subtotal : parseFloat(d.subtotal || 0)
                });
            });
        });

        const totalTransacciones = ventasUser.length;
        const ticketPromedio = totalTransacciones > 0 ? (totalFacturado / totalTransacciones) : 0;

        res.json({
            totalFacturado,
            totalTransacciones,
            ticketPromedio,
            items: itemsDesglosados
        });
    } catch (error) {
        console.error("Error al auditar al cliente:", error);
        res.status(500).json({ error: 'Error al auditar al cliente' });
    }
});
module.exports = router;