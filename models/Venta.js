const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venta = sequelize.define('Venta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW // Guarda automáticamente día y hora de la venta
    },
    usuario: {
        type: DataTypes.STRING,
        allowNull: false // Obligatorio para saber qué cliente hizo la venta
    },
    // 🌟 AGREGAMOS ESTE CAMPO IGUAL QUE EN PRODUCTOS
    adminAsociado: {
        type: DataTypes.STRING,
        allowNull: false // Para saber a qué Kiosco/Negocio pertenece esta venta
    }
}, {
    timestamps: false
});

module.exports = Venta;