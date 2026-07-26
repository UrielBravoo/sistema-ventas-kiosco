const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { verificarToken } = require('../middlewares/authMiddleware');

// FUNCIÓN AUXILIAR PARA EXTRAER EL USUARIO ACTUAL
const obtenerKioscoUsuario = (req) => {
    const info = req.usuario || req.user;
    if (!info) return 'lucas_cajero';
    const name = info.username || info.email || info.nombre || 'lucas_cajero';
    return name.trim();
};

// ==========================================
// 1. OBTENER PRODUCTOS FILTRADOS POR KIOSCO
// ==========================================
router.get('/', verificarToken, async (req, res) => {
    try {
        const miKiosco = obtenerKioscoUsuario(req);

        const productos = await Producto.findAll({
            where: { adminAsociado: miKiosco }
        });

        const respuesta = productos.map(p => ({
            id: p.id,
            nombre: p.nombre,
            stock: p.stock,
            costo: p.precioCosto,
            venta: p.precio,
            precioCosto: p.precioCosto,
            precio: p.precio
        }));

        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos: ' + error.message });
    }
});

// ==========================================
// 2. CREAR UN NUEVO PRODUCTO
// ==========================================
router.post('/', verificarToken, async (req, res) => {
    try {
        const nombre = req.body.nombre;
        const precioCosto = req.body.precioCosto !== undefined ? req.body.precioCosto : req.body.costo;
        const precio = req.body.precio !== undefined ? req.body.precio : req.body.venta;
        const stock = req.body.stock;
        
        const miKiosco = obtenerKioscoUsuario(req);

        if (!nombre || precioCosto === undefined || precio === undefined) {
            return res.status(400).json({ error: 'Campos incompletos.' });
        }
        
        const nuevo = await Producto.create({ 
            nombre: nombre, 
            precioCosto: parseFloat(precioCosto) || 0, 
            precio: parseFloat(precio) || 0, 
            stock: parseInt(stock) || 0,
            adminAsociado: miKiosco
        });
        
        res.status(201).json(nuevo);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// ==========================================
// 3. ACTUALIZAR PRODUCTO POR ID (PUT)
// ==========================================
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const miKiosco = obtenerKioscoUsuario(req);
        const { nuevoNombre, precioCosto, precio, stock } = req.body;

        // Buscamos rigurosamente por ID y asegurando pertenencia al inquilino
        const prod = await Producto.findOne({
            where: { id: req.params.id, adminAsociado: miKiosco }
        });
        
        if (!prod) return res.status(404).json({ error: 'No se encontró el producto o no tenés permisos.' });

        // Si mandaste texto en el campo nuevo nombre, se actualiza
        if (nuevoNombre && nuevoNombre.trim() !== "") {
            prod.nombre = nuevoNombre.trim();
        }
        
        // Modificamos costos y precios de venta si se enviaron valores
        if (precioCosto !== undefined) prod.precioCosto = parseFloat(precioCosto);
        if (precio !== undefined) prod.precio = parseFloat(precio);
        
        // Sumamos las unidades al stock actual (si mandaron 0, queda intacto)
        prod.stock += parseInt(stock) || 0;

        await prod.save();
        res.json(prod);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto: ' + error.message });
    }
});

module.exports = router;