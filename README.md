# Node7 TypeScript Backend

Backend completo desarrollado con Node.js, TypeScript, Express y MySQL usando Docker. Arquitectura modular con clases, controllers y routers bien estructurados.

## 🚀 Características

- **TypeScript**: Tipado estático para mayor seguridad y mantenibilidad
- **Express.js**: Framework web rápido y minimalista
- **MySQL 8**: Base de datos relacional robusta
- **Docker**: Containerización para desarrollo y producción
- **Arquitectura de Clases**: Modelos, controllers y servicios orientados a objetos
- **JWT Authentication**: Sistema de autenticación con tokens
- **Validación de Datos**: Validación robusta con express-validator
- **Manejo de Errores**: Middleware centralizado para manejo de errores
- **CORS y Seguridad**: Configuración de seguridad con Helmet
- **Logging**: Sistema de logs con Morgan

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── database.ts          # Configuración y conexión a MySQL
├── controllers/
│   ├── BaseController.ts    # Controller base con métodos comunes
│   ├── UserController.ts    # Controller de usuarios
│   ├── ProductController.ts # Controller de productos
│   ├── OrderController.ts   # Controller de órdenes
│   └── index.ts            # Exportaciones de controllers
├── interfaces/
│   └── index.ts            # Interfaces y tipos TypeScript
├── middlewares/
│   ├── auth.ts             # Middleware de autenticación JWT
│   ├── validation.ts       # Middlewares de validación
│   ├── error.ts            # Middleware de manejo de errores
│   └── index.ts            # Exportaciones de middlewares
├── models/
│   ├── BaseModel.ts        # Modelo base con métodos CRUD
│   ├── UserModel.ts        # Modelo de usuarios
│   ├── ProductModel.ts     # Modelo de productos
│   ├── OrderModel.ts       # Modelo de órdenes
│   └── index.ts            # Exportaciones de modelos
├── routes/
│   ├── userRoutes.ts       # Rutas de usuarios
│   ├── productRoutes.ts    # Rutas de productos
│   ├── orderRoutes.ts      # Rutas de órdenes
│   └── index.ts            # Router principal
├── app.ts                  # Configuración de la aplicación Express
└── server.ts               # Punto de entrada del servidor

docker/
├── mysql/
│   ├── init.sql            # Script de inicialización de BD
│   └── my.cnf              # Configuración de MySQL

Dockerfile                  # Imagen Docker de la aplicación
docker-compose.yml          # Servicios Docker (MySQL + Adminer)
tsconfig.json              # Configuración de TypeScript
.env                       # Variables de entorno (desarrollo)
.env.example               # Ejemplo de variables de entorno
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- Docker y Docker Compose
- Git

### 1. Clonar y configurar el proyecto

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus configuraciones:

```env
NODE_ENV=development
PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=node7_user
DB_PASSWORD=node7_password
DB_NAME=node7_db

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# Logs
LOG_LEVEL=debug
```

### 3. Iniciar servicios con Docker

```bash
# Levantar MySQL y Adminer
npm run docker:up

# Ver logs de los contenedores
npm run docker:logs

# Parar servicios
npm run docker:down
```

### 4. Ejecutar la aplicación

```bash
# Desarrollo (con hot reload)
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start
```

## 🐳 Docker

### Servicios disponibles

- **MySQL 8**: Puerto 3306
- **Adminer**: Puerto 8080 (interfaz web para MySQL)

### Comandos útiles

```bash
# Construir y levantar todos los servicios
npm run docker:up

# Solo levantar la base de datos
docker-compose up mysql -d

# Acceder al contenedor MySQL
docker-compose exec mysql mysql -u node7_user -p

# Ver logs en tiempo real
npm run docker:logs

# Parar todos los servicios
npm run docker:down
```

## 📚 API Endpoints

### Base URL: `http://localhost:3000/api/v1`

### 🔐 Autenticación

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/users/register` | Registrar usuario | No |
| POST | `/users/login` | Login de usuario | No |
| GET | `/users/profile` | Obtener perfil | Sí |
| PUT | `/users/profile` | Actualizar perfil | Sí |

### 👥 Usuarios

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/users` | Listar usuarios | Sí |
| GET | `/users/:id` | Obtener usuario | Sí |
| POST | `/users` | Crear usuario | Sí |
| PUT | `/users/:id` | Actualizar usuario | Sí |
| DELETE | `/users/:id` | Eliminar usuario | Sí |
| GET | `/users/search?q=term` | Buscar usuarios | Sí |
| GET | `/users/stats` | Estadísticas de usuarios | Sí |

### 🛍️ Productos

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/products` | Listar productos | No |
| GET | `/products/:id` | Obtener producto | No |
| POST | `/products` | Crear producto | Sí |
| PUT | `/products/:id` | Actualizar producto | Sí |
| DELETE | `/products/:id` | Eliminar producto | Sí |
| GET | `/products/search?q=term` | Buscar productos | No |
| GET | `/products/categories` | Listar categorías | No |
| GET | `/products/category/:category` | Productos por categoría | No |
| GET | `/products/price-range?minPrice=0&maxPrice=100` | Productos por rango de precio | No |
| GET | `/products/low-stock?threshold=5` | Productos con stock bajo | No |
| PATCH | `/products/:id/stock` | Actualizar stock | Sí |
| GET | `/products/stats` | Estadísticas de productos | No |

### 📦 Órdenes

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/orders` | Listar órdenes | Sí |
| GET | `/orders/:id` | Obtener orden | Sí |
| GET | `/orders/:id/details` | Orden con items | Sí |
| POST | `/orders` | Crear orden | Sí |
| GET | `/orders/my-orders` | Mis órdenes | Sí |
| PATCH | `/orders/:id/cancel` | Cancelar mi orden | Sí |
| GET | `/orders/status/:status` | Órdenes por estado | Sí |
| GET | `/orders/user/:userId` | Órdenes de usuario | Sí |
| PATCH | `/orders/:id/status` | Actualizar estado | Sí |
| PATCH | `/orders/:id/cancel-admin` | Cancelar orden (admin) | Sí |
| GET | `/orders/stats` | Estadísticas de órdenes | Sí |

### 🏥 Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información de la API |
| GET | `/health` | Estado de salud |

## 🔑 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación. 

### Headers requeridos

```
Authorization: Bearer <tu-jwt-token>
Content-Type: application/json
```

### Ejemplo de login

```javascript
// Registro
const registerResponse = await fetch('/api/v1/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'MiPassword123',
    first_name: 'Juan',
    last_name: 'Pérez'
  })
});

// Login
const loginResponse = await fetch('/api/v1/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'MiPassword123'
  })
});

const { token } = await loginResponse.json();

// Usar token en peticiones protegidas
const profileResponse = await fetch('/api/v1/users/profile', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📊 Base de Datos

### Esquema de la Base de Datos

#### Tabla: users
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabla: products
```sql
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabla: orders
```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Tabla: order_items
```sql
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## 🧪 Pruebas de la API

### Usando curl

```bash
# Health Check
curl http://localhost:3000/api/v1/health

# Registro de usuario
curl -X POST http://localhost:3000/api/v1/users/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@ejemplo.com",
    "password": "Test123456",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/users/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@ejemplo.com",
    "password": "Test123456"
  }'

# Listar productos (sin autenticación)
curl http://localhost:3000/api/v1/products

# Crear producto (con autenticación)
curl -X POST http://localhost:3000/api/v1/products \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "name": "Laptop Gaming",
    "description": "Laptop para juegos de alta gama",
    "price": 1299.99,
    "stock": 5,
    "category": "Electronics"
  }'
```

## 🚀 Despliegue en Producción

### Variables de entorno para producción

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=your-production-db
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Usando Docker

```bash
# Construir imagen de producción
docker build -t node7-backend .

# Ejecutar contenedor
docker run -d \\
  --name node7-api \\
  -p 3000:3000 \\
  --env-file .env.production \\
  node7-backend
```

## 🔧 Desarrollo

### Scripts disponibles

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Ejecutar versión compilada
npm run clean        # Limpiar archivos compilados
npm run lint         # Verificar código con ESLint
npm run lint:fix     # Corregir errores de linting automáticamente
```

### Estructura de clases

El proyecto utiliza una arquitectura orientada a objetos:

- **BaseModel**: Clase base con métodos CRUD comunes
- **BaseController**: Controller base con métodos de respuesta HTTP
- **Modelos específicos**: UserModel, ProductModel, OrderModel
- **Controllers específicos**: UserController, ProductController, OrderController
- **Middlewares**: AuthMiddleware, ValidationMiddleware, ErrorMiddleware

## 📝 Licencia

ISC - UTN Tecnicatura

## 🤝 Contribuciones

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte y preguntas:
- Crear un issue en el repositorio
- Revisar la documentación de la API
- Verificar logs de la aplicación y base de datos

---

Desarrollado con ❤️ por UTN Tecnicatura usando TypeScript y Node.js