const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Venta = require('./Venta');
const Producto = require('./Producto');

const DetalleVenta = sequelize.define('DetalleVenta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ventaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    precioUnitario: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    subtotal: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    tableName: 'detalle_ventas',
    timestamps: false
});

// Forzar relaciones de Sequelize explícitas
DetalleVenta.belongsTo(Producto, { foreignKey: 'productoId' });
Producto.hasMany(DetalleVenta, { foreignKey: 'productoId' });

module.exports = DetalleVenta;