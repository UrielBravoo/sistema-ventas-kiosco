const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './kiosco.sqlite', 
    logging: false 
});

module.exports = sequelize;