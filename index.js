require('dotenv').config();
const express = require('express');
const path = require('path');
const sequelize = require('./config/database'); 
const bcrypt = require('bcrypt'); // Añadido para poder encriptar tu contraseña de forma segura
const cookieParser = require('cookie-parser'); // Importación de cookie-parser

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES DE SEGURIDAD
// ==========================================
// Desestructuramos las funciones exactas exportadas en tu authMiddleware.js
const { verificarToken, esAdmin } = require('./middlewares/authMiddleware');

// Importación de Rutas de la API
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');

// Importación de Modelos
const Producto = require('./models/Producto');  
const Venta = require('./models/Venta');
const DetalleVenta = require('./models/DetalleVenta');
const Usuario = require('./models/Usuario');

// ==========================================
// CORRECCIÓN DE RELACIONES EN LA BASE DE DATOS
// ==========================================
// Una Venta (Ticket) tiene muchos detalles de productos
Venta.hasMany(DetalleVenta, { foreignKey: 'ventaId' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'ventaId' });

// Un Producto puede aparecer en muchos detalles de diferentes tickets
Producto.hasMany(DetalleVenta, { foreignKey: 'productoId' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'productoId' });

// Relacion entre usuario id y ventas
Usuario.hasMany(Venta, { foreignKey: 'usuarioId' });
Venta.belongsTo(Usuario, { foreignKey: 'usuarioId' });
// ==========================================

const app = express();
const PORT = 3000;

// Middlewares obligatorios
app.use(express.json());
app.use(cookieParser()); // 🍪 ACTIVADO: Permite que Express lea las cookies de autenticación
app.use(express.static('public'));

// 🛡️ CONTROL DE ACCESO GLOBAL ÚNICO PARA LA RAÍZ 
// Al entrar a localhost:3000/ sirve directo el login sin buscar index.html fantasmas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Enrutadores de la API
app.use('/api/admin', adminRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/auth', authRoutes);

// ==========================================
// 🛡️ RUTA PROTEGIDA PARA SERVIR EL PANEL DE ADMIN
// ==========================================
// El archivo está en /views/admin.html, fuera del alcance del público general.
// Ahora usa correctamente 'verificarToken' y 'esAdmin' en orden como middlewares.
app.get('/admin', verificarToken, esAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

/* 
Importante para que no se borren los datos y persistan: 
el valor de force acá abajo después de sequelize.sync tiene que estar en false.
Si ponés true, cada vez que guardes el código se te reinicia la base de datos de cero.
*/
sequelize.sync({ force: false }) 
    .then(async () => {
        console.log('¡Base de datos SQLite conectada y tablas creadas en /models con éxito!');
        
        // =========================================================================
        // 🔒 SISTEMA DE CONTROL DE ADMINISTRADOR PRIVADO (DESDE VARIABLES DE ENTORNO)
        // =========================================================================
        try {
            const usernameAdmin = process.env.ADMIN_USER;
            const passwordAdmin = process.env.ADMIN_PASS;

            if (usernameAdmin && passwordAdmin) {
                // Buscamos si ya existís en la base de datos para no duplicar el registro
                const adminExiste = await Usuario.findOne({ where: { username: usernameAdmin } });
                
                if (!adminExiste) {
                    console.log('🚀 Creando superusuario administrador en privado desde .env...');
                    
                    const salt = await bcrypt.genSalt(10);
                    const passwordEncriptada = await bcrypt.hash(passwordAdmin, salt);

                    await Usuario.create({
                        nombre: 'Administrador Global',
                        username: usernameAdmin,
                        password: passwordEncriptada,
                        role: 'admin' // Privilegios globales de administrador
                    });
                    
                    console.log('✅ ¡Usuario administrador inyectado y protegido con éxito!');
                } else {
                    console.log('🔒 El administrador central ya está activo y protegido en la base de datos.');
                }
            } else {
                console.log('⚠️ Alerta: No se encontraron las credenciales ADMIN_USER o ADMIN_PASS en tu archivo .env');
            }
        } catch (err) {
            console.error('❌ Error al inicializar el administrador oculto:', err);
        }
        // =========================================================================

        // Levantar el servidor una vez verificada la base de datos y el administrador
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error al conectar la base de datos:', err);
    });