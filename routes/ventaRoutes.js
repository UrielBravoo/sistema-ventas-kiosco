const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const DetalleVenta = require('../models/DetalleVenta');
const Producto = require('../models/Producto');
const sequelize = require('../config/database'); 

// IMPORTAMOS LOS MIDDLEWARES DE SEGURIDAD
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

const peticionesEnProceso = new Set();

// ==========================================
// 1. CREAR UNA NUEVA VENTA (AISLADA POR KIOSCO)
// ==========================================
router.post('/', verificarToken, async (req, res) => {
    const huellaPeticion = JSON.stringify(req.body.items || req.body.productos || req.body.carrito);
    
    if (peticionesEnProceso.has(huellaPeticion)) {
        return res.status(200).json({ mensaje: 'Bloqueado', duplicado: true });
    }
    
    peticionesEnProceso.add(huellaPeticion);
    setTimeout(() => peticionesEnProceso.delete(huellaPeticion), 1000);

    const t = await sequelize.transaction();

    try {
        const productos = req.body.items || req.body.productos || req.body.carrito;
        if (!productos || productos.length === 0) {
            return res.status(400).json({ error: 'Carrito vacío.' });
        }

        // Obtener el identificador del kiosco desde el token
        const infoUsuario = req.usuario || req.user;
        const miKiosco = infoUsuario ? (infoUsuario.username || infoUsuario.email || infoUsuario.nombre) : 'lucas_cajero';

        let totalCalculado = 0;
        const itemsProcesados = [];

        for (const item of productos) {
            const pId = item.productoId || item.id;
            const cantidad = parseInt(item.cantidad || 1);
            if (!pId) continue;

            // Buscamos el producto asegurándonos de que pertenezca a este Kiosco específico
            const productoDb = await Producto.findOne({ 
                where: { id: pId, adminAsociado: miKiosco },
                transaction: t 
            });

            if (!productoDb) {
                return res.status(404).json({ error: `El producto ID ${pId} no pertenece a tu inventario.` });
            }

            const precioReal = parseFloat(productoDb.precio || 0);
            const subtotalItem = precioReal * cantidad;
            totalCalculado += subtotalItem;

            itemsProcesados.push({ id: pId, cantidad, precioReal, subtotalItem, db: productoDb });
        }

        // Guardamos la venta asociándola al Kiosco dueño
        const nuevaVenta = await Venta.create({ 
            total: totalCalculado, 
            fecha: new Date(),
            usuario: miKiosco,
            adminAsociado: miKiosco // 🌟 SELLO DEL KIOSCO PROPIETARIO
        }, { transaction: t });

        for (const item of itemsProcesados) {
            await DetalleVenta.create({
                ventaId: nuevaVenta.id,
                productoId: item.id,
                cantidad: item.cantidad,
                precioUnitario: item.precioReal,
                subtotal: item.subtotalItem
            }, { transaction: t });

            item.db.stock = Math.max(0, item.db.stock - item.cantidad);
            await item.db.save({ transaction: t });
        }

        await t.commit();
        res.status(201).json({ mensaje: 'Éxito', ventaId: nuevaVenta.id });
    } catch (error) {
        await t.rollback();
        console.error("ERROR EN VENTA:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. OBTENER VENTAS (CON FILTRO DE SEGURIDAD)
// ==========================================
router.get('/', verificarToken, async (req, res) => {
    try {
        const infoUsuario = req.usuario || req.user;
        const usuarioSesion = infoUsuario ? infoUsuario.username : null;
        
        let filtroWhere = {};
        
        // Si no es la cuenta raíz (SuperAdmin), se le obliga a ver SOLO sus ventas
        if (usuarioSesion !== 'urielbravo' && usuarioSesion !== 'admin') {
            filtroWhere.adminAsociado = usuarioSesion;
        } else if (req.query.usuario) {
            // Si sos vos auditando, podés pasar ?usuario=nelson_cajero por url
            filtroWhere.adminAsociado = req.query.usuario;
        }

        const ventas = await Venta.findAll({
            where: filtroWhere,
            order: [['fecha', 'DESC']],
            include: [{ model: DetalleVenta }]
        });

        res.json(ventas);
    } catch (error) {
        console.error("Error al obtener ventas:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 4. ESTADÍSTICAS FINANCIERAS SEGMENTADAS
// ==========================================
router.get('/estadisticas', verificarToken, async (req, res) => {
    try {
        const infoUsuario = req.usuario || req.user;
        const usuarioSesion = infoUsuario ? infoUsuario.username : null;
        
        let filtroWhere = {};
        
        // Protección de datos: Cada inquilino genera estadísticas únicamente de su negocio
        if (usuarioSesion !== 'urielbravo' && usuarioSesion !== 'admin') {
            filtroWhere.adminAsociado = usuarioSesion;
        } else if (req.query.usuario) {
            filtroWhere.adminAsociado = req.query.usuario;
        }

        const ventas = await Venta.findAll({
            where: filtroWhere
        });

        const hoyStr = new Date().toLocaleDateString('sv-SE');

        let ingresosHoy = 0, costosHoy = 0;
        const historialDias = {}; 
        const rankingProductos = {}; 

        for (const venta of ventas) {
            const fechaKey = new Date(venta.fecha).toLocaleDateString('sv-SE');
            let costoVenta = 0;

            const detalles = await DetalleVenta.findAll({ where: { ventaId: venta.id } });

            for (const detalle of detalles) {
                const prod = await Producto.findByPk(detalle.productoId);
                let costoUnitario = 0;
                let nombreProd = "Artículo Eliminado";

                if (prod) {
                    nombreProd = prod.nombre;
                    costoUnitario = parseFloat(prod.precioCosto || 0);
                }

                const totalCostoItem = costoUnitario * detalle.cantidad;
                costoVenta += totalCostoItem;

                const pId = detalle.productoId;
                if (!rankingProductos[pId]) {
                    rankingProductos[pId] = { nombre: nombreProd, unidades: 0, recaudado: 0, ganancia: 0 };
                }
                rankingProductos[pId].unidades += detalle.cantidad;
                rankingProductos[pId].recaudado += detalle.subtotal;
                rankingProductos[pId].ganancia += detalle.subtotal - totalCostoItem;
            }

            const gananciaVenta = venta.total - costoVenta;

            if (fechaKey === hoyStr) {
                ingresosHoy += venta.total;
                costosHoy += costoVenta;
            }

            if (!historialDias[fechaKey]) {
                historialDias[fechaKey] = { ingresos: 0, costs: 0, ganancias: 0 };
            }
            historialDias[fechaKey].ingresos += venta.total;
            historialDias[fechaKey].costs += costoVenta;
            historialDias[fechaKey].ganancias += gananciaVenta;
        }

        const historialArray = Object.keys(historialDias).map(fecha => ({
            fecha,
            ingresos: historialDias[fecha].ingresos,
            costos: historialDias[fecha].costs,
            ganancia: historialDias[fecha].ganancias
        })).sort((a, b) => b.fecha.localeCompare(a.fecha));

        const rankingArray = Object.keys(rankingProductos).map(id => ({
            id,
            nombre: rankingProductos[id].nombre,
            unidadesVendidas: rankingProductos[id].unidades,
            recaudado: rankingProductos[id].recaudado,
            gananciaNeta: rankingProductos[id].ganancia
        })).sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

        res.json({
            hoy: { ingresos: ingresosHoy, costos: costosHoy, ganancia: ingresosHoy - costosHoy },
            historialDias: historialArray,
            rankingProductos: rankingArray
        });

    } catch (error) {
        console.error("Error financiero:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 5. LIMPIAR HISTORIAL CORRUPTO (SÓLO SUPERADMIN)
// ==========================================
router.delete('/limpiar-todo-historial', verificarToken, esAdmin, async (req, res) => {
    try {
        await DetalleVenta.destroy({ where: {}, truncate: false });
        await Venta.destroy({ where: {}, truncate: false });
        res.json({ mensaje: "Historial corrupto limpiado con éxito." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;