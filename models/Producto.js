const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // O cómo tengas tu importación de la base de datos

const Producto = sequelize.define('Producto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    precioCosto: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    precio: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // 🌟 ESTA ES LA COLUMNA QUE FALTA AGREGAR AQUÍ:
    adminAsociado: {
        type: DataTypes.STRING,
        allowNull: true // Ponelo en true temporalmente para que no falle nada viejo
    }
}, {
    tableName: 'Productos',
    timestamps: false // O true, según cómo lo tengas configurado originalmente
});

module.exports = Producto;