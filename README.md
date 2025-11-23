# SICFOR - Sistema Integral de Gestión

Este proyecto es un Sistema Integral de Gestión para un Centro de Formación y Cursos (SICFOR), desarrollado con Node.js, Express y MySQL.

## 🚀 Inicio Rápido

Para iniciar el proyecto (Backend + Base de Datos), ejecuta:

```bash
npm run dev
```

Esto iniciará el servidor en [http://localhost:8080](http://localhost:8080).

---

## ⚙️ Configuración de Base de Datos

El proyecto utiliza una base de datos MySQL remota. A continuación se detallan las credenciales para configurarlas en el archivo `.env` o para acceder desde cualquier cliente SQL (Workbench, DBeaver, HeidiSQL, etc.).

### Credenciales de Acceso

| Parámetro | Valor |
|-----------|-------|
| **Host** | `34.134.51.120` |
| **Puerto** | `3306` |
| **Usuario** | `admin` |
| **Contraseña** | `admin` |
| **Base de Datos** | `SICFOR` |

### Archivo `.env`

Asegúrate de que tu archivo `.env` en la raíz del proyecto tenga el siguiente contenido:

```ini
# Base de datos
DB_HOST=34.134.51.120
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=SICFOR
DB_PORT=3306

# Servidor
PORT=8080
NODE_ENV=development
```

---

## 📂 Estructura del Proyecto

- **`server.js`**: Punto de entrada del servidor Express.
- **`start_all.js`**: Script de arranque unificado.
- **`config/db.js`**: Configuración de la conexión a MySQL.
- **`controllers/`**: Lógica de negocio y controladores.
- **`routes/`**: Definición de rutas de la API.
- **`public/`**: Archivos estáticos del Frontend (HTML, CSS, JS).
- **`scripts/`**: Scripts de utilidad (inicialización de DB, SQL manual).

## 🛠️ Scripts Disponibles

- `npm start`: Inicia solo el servidor backend.
- `npm run db:init`: Ejecuta el script de inicialización de base de datos (crear tablas/datos).
- `npm run dev`: Ejecuta la inicialización de DB y luego levanta el servidor (Recomendado).
