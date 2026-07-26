require('dotenv').config();
const express = require('express');
const path = require('path');
const sequelize = require('./config/database'); 
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES DE SEGURIDAD
// ==========================================
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
// RELACIONES EN LA BASE DE DATOS
// ==========================================
Venta.hasMany(DetalleVenta, { foreignKey: 'ventaId' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'ventaId' });

Producto.hasMany(DetalleVenta, { foreignKey: 'productoId' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'productoId' });

Usuario.hasMany(Venta, { foreignKey: 'usuarioId' });
Venta.belongsTo(Usuario, { foreignKey: 'usuarioId' });

const app = express();
const PORT = 3000;

// Middlewares obligatorios
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// ==========================================
// 🛡️ ENRUTADORES DE LA API
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); 

app.use('/api/admin', adminRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);

// ==========================================
// 🛡️ VISTAS Y CONTROL DE NAVEGACIÓN
// ==========================================

// Vista principal (Login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Panel del Kiosco (Protegido para usuarios logueados)
app.get('/kiosco.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kiosco.html'));
});

// Panel de Administración (Soporta /admin y /admin.html)
app.get(['/admin', '/admin.html'], verificarToken, esAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// ==========================================
// INICIALIZACIÓN DE BASE DE DATOS Y SERVIDOR
// ==========================================
sequelize.sync({ force: false }) 
    .then(async () => {
        console.log('¡Base de datos SQLite conectada y tablas creadas en /models con éxito!');
        
        try {
            const usernameAdmin = process.env.ADMIN_USER;
            const passwordAdmin = process.env.ADMIN_PASS;

            if (usernameAdmin && passwordAdmin) {
                const adminExiste = await Usuario.findOne({ where: { username: usernameAdmin } });
                
                if (!adminExiste) {
                    console.log('🚀 Creando superusuario administrador en privado desde .env...');
                    
                    const salt = await bcrypt.genSalt(10);
                    const passwordEncriptada = await bcrypt.hash(passwordAdmin, salt);

                    await Usuario.create({
                        nombre: 'Administrador Global',
                        username: usernameAdmin,
                        password: passwordEncriptada,
                        role: 'admin'
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

        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error al conectar la base de datos:', err);
    });