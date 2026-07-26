# 🏪 Sistema de Gestión, Ventas y Auditoría para Kioscos

Bienvenido a este proyecto de gestión integral para kioscos. La aplicación permite administrar productos, registrar ventas, gestionar usuarios y visualizar métricas de negocio en tiempo real mediante una arquitectura modular y desacoplada.

---

# 🚀 Características

- 📊 Panel de administración con monitoreo de ventas.
- 💰 Estadísticas de facturación y métricas del negocio.
- 👥 Gestión de usuarios con roles (`admin` y `cajero`).
- 🔐 Autenticación mediante JSON Web Tokens (JWT).
- 🍪 Manejo seguro de sesiones utilizando cookies `HttpOnly`.
- 🗃️ Base de datos SQLite mediante Sequelize ORM.
- ⚡ Backend desarrollado con Node.js y Express.
- 🌐 Frontend en HTML, CSS y JavaScript nativo.

---

# 🛠️ Tecnologías utilizadas

- **Node.js**
- **Express.js**
- **SQLite**
- **Sequelize ORM**
- **JSON Web Tokens (JWT)**
- **bcryptjs**
- **cookie-parser**
- **dotenv**

---

# 📁 Estructura del proyecto

```text
├── config/
│   └── database.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   ├── Usuario.js
│   ├── Producto.js
│   ├── Venta.js
│   └── DetalleVenta.js
├── routes/
├── public/
├── views/
├── index.js
├── package.json
└── kiosco.sqlite
```

## Descripción

### `config/`

Contiene la configuración de Sequelize y la conexión con la base de datos SQLite.

### `models/`

Define los modelos y relaciones de la base de datos:

- Usuario
- Producto
- Venta
- DetalleVenta

### `middlewares/`

Incluye el middleware encargado de verificar el JWT y controlar el acceso según el rol del usuario.

### `routes/`

Define todos los endpoints de la API.

### `views/` y `public/`

Contienen la interfaz gráfica de la aplicación desarrollada con HTML, CSS y JavaScript.

---

# 📦 Dependencias

| Dependencia | Descripción |
|-------------|-------------|
| express | Framework para crear el servidor HTTP |
| sequelize | ORM para SQLite |
| sqlite3 | Driver de SQLite |
| jsonwebtoken | Creación y validación de JWT |
| bcryptjs | Hash de contraseñas |
| cookie-parser | Lectura de cookies |
| dotenv | Variables de entorno |

---

# 🔒 Seguridad

La aplicación implementa varias medidas de seguridad:

## JWT en Cookies HttpOnly

Los tokens de autenticación se almacenan en cookies `HttpOnly`, evitando que puedan ser leídos desde JavaScript y reduciendo el riesgo de ataques XSS.

## Contraseñas Hasheadas

Las contraseñas nunca se almacenan en texto plano. Se utiliza **bcryptjs** para generar hashes seguros antes de guardarlas.

## Protección por Roles

El backend verifica que cada usuario tenga permisos suficientes antes de acceder a las rutas protegidas.

---

# 🚀 Instalación

## 1. Requisitos

- Node.js 18 o superior
- npm

Comprobar la instalación:

```bash
node -v
npm -v
```

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-repositorio-kiosco.git

cd tu-repositorio-kiosco
```

> Si ya tenés el proyecto descargado, simplemente abrí la carpeta con Visual Studio Code.

---

## 3. Instalar dependencias

```bash
npm install
```

---

## 4. Crear el archivo `.env`

En la raíz del proyecto crear un archivo llamado `.env` con el siguiente contenido:

```env
PORT=3000
JWT_SECRET=Mi_Firma_Criptografica_Secreta_Para_Los_Tokens_2026
```

Podés cambiar el puerto y la clave secreta según tus necesidades.

---

## 5. Iniciar el servidor

```bash
node index.js
```

La primera vez que se ejecute, Sequelize creará automáticamente:

- la base de datos SQLite
- las tablas
- las relaciones entre ellas

---

## 6. Acceder a la aplicación

Abrí el navegador y visitá:

```
http://localhost:3000/login.html
```

---

# 🐳 Docker

## Dockerfile

Crear un archivo llamado `Dockerfile` en la raíz del proyecto:

```Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node","index.js"]
```

---

## .dockerignore

Crear un archivo `.dockerignore`:

```text
node_modules
npm-debug.log
.env
kiosco.sqlite
```

---

# Persistencia de SQLite

SQLite guarda toda la información en un único archivo (`kiosco.sqlite`).

Si ejecutás la aplicación dentro de Docker sin montar un volumen, los datos se perderán cuando el contenedor sea eliminado.

Para conservar la información, montá un volumen durante la ejecución del contenedor.

---

## Construir la imagen

```bash
docker build -t mi-app-kiosco .
```

---

## Ejecutar el contenedor

### Linux / macOS

```bash
docker run -d \
  -p 3000:3000 \
  -v /ruta/en/tu/servidor/datos:/usr/src/app/datos \
  --name contenedor-kiosco \
  mi-app-kiosco
```

### Windows (PowerShell)

```powershell
docker run -d `
-p 3000:3000 `
-v C:\Datos\Kiosco:/usr/src/app/datos `
--name contenedor-kiosco `
mi-app-kiosco
```

---

# 📌 Funcionalidades principales

- Gestión de productos.
- Registro de ventas.
- Gestión de usuarios.
- Administración de empleados.
- Panel de estadísticas.
- Autenticación mediante JWT.
- Control de acceso por roles.
- Persistencia con SQLite.

---

# 📄 Licencia

Este proyecto fue desarrollado con fines educativos y de aprendizaje. Podés modificarlo y adaptarlo libremente según tus necesidades.

# Guia de uso: iniciar programa con el comando  "node index.js" y entrar a localhost:3000
<img width="1301" height="953" alt="image" src="https://github.com/user-attachments/assets/1c321287-f329-4760-a0d3-1a582bc6ac09" />

# Ingreso al Panel de Admin y creacion del usuario richard

<img width="1914" height="858" alt="image" src="https://github.com/user-attachments/assets/119a75a7-1cd5-4796-b4c5-34490ad6a416" />

#Interfaz de usuario donde se puede hacer ventas solo utilizando el teclado

<img width="1915" height="853" alt="image" src="https://github.com/user-attachments/assets/c0e65bf8-905f-44f5-9d22-78cea5388d8a" />

# Carga de unidades que ingresen al stock donde podemos cambiar el nombre si asi deseamos agregamos el precio costo y nuevo precio venta con la cantidad de stock

<img width="1917" height="853" alt="image" src="https://github.com/user-attachments/assets/914442a0-9094-49b5-94c0-da53664d102e" />

# Creacion del producto 
<img width="1903" height="844" alt="image" src="https://github.com/user-attachments/assets/c6d1b270-a04a-4fb4-ac78-a653503d210c" />

# Historial de ventas

<img width="1913" height="856" alt="image" src="https://github.com/user-attachments/assets/55dab671-da29-4e4f-bef5-e618b6ffe601" />

# Resumen Diario
<img width="818" height="235" alt="image" src="https://github.com/user-attachments/assets/44769dad-9c08-4971-ad54-d574611b4f60" />

# Historial por dias 
<img width="816" height="275" alt="image" src="https://github.com/user-attachments/assets/2632b316-0a76-48bf-b7a4-db94ddb71936" />

# Cuadro de productos mas vendidos
<img width="805" height="466" alt="image" src="https://github.com/user-attachments/assets/fd1c1fe1-0cd6-4d71-8af9-63afef811838" />

# Cuadro que indica el stock actual,costo,venta, y si queda poco stock

<img width="1907" height="761" alt="image" src="https://github.com/user-attachments/assets/cb250ac6-c2f0-4b47-82c4-a05cc2371e9f" />













