# Sistema de Inventario y Punto de Venta (Evaluación 3)

Este proyecto consiste en una aplicación web full-stack que implementa un sistema seguro de autenticación multiusuario utilizando una arquitectura basada en **NestJS, Prisma y JWT (Access Tokens con Refresh Tokens rotativos)** en el Backend, acoplada a una interfaz reactiva desarrollada en **React, Vite y TanStack Query** en el Frontend. La solución permite la segregación de funciones por roles y el control estricto de acceso a recursos protegidos.

## Requisitos Previos

Antes de proceder con la instalación, asegúrate de contar con las siguientes herramientas en tu equipo:
* **Node.js** (Versión 18 o superior recomendada)
* **pnpm** (Gestor de paquetes obligatorio para la administración de este monorepo)
* **Docker** (Requerido para inicializar el contenedor de la base de datos relacional)

---

## Guía de Instalación y Configuración Local

Sigue detenidamente estos pasos en el orden indicado para clonar, configurar y desplegar el entorno de desarrollo:

### 1. Clonar el repositorio e instalar dependencias
Abre tu terminal y ejecuta los siguientes comandos de Git y del gestor de paquetes:
```bash
# Clonar el proyecto localmente
git clone <URL_DE_ESTE_REPOSITORIO>

# Acceder al directorio raíz del proyecto
cd <NOMBRE_DE_LA_CARPETA>

# Instalar todas las dependencias del monorepo
pnpm install
```

### 2. Configurar las Variables de Entorno (`.env`)
El proyecto se encuentra organizado como un espacio de trabajo modular (monorepo) compuesto por las aplicaciones `apps/api` y `apps/web`. Debes crear de forma manual un archivo `.env` en la raíz de cada una de estas aplicaciones para asegurar su correcto inicio.

#### 🔐 Backend: Configuración del archivo `apps/api/.env`
Crea el archivo en la ruta correspondiente y define las siguientes variables esenciales para la base de datos y la firma segura de claves criptográficas:
```env
# URL de conexión a la base de datos PostgreSQL local
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"

# Configuración de seguridad para el ciclo de vida de los tokens JWT
JWT_SECRET=dev_access_secret
JWT_EXPIRES=900
JWT_REFRESH_SECRET=dev_refresh_secret
JWT_REFRESH_EXPIRES=1209600
```

#### 🌐 Frontend: Configuración del archivo `apps/web/.env`
Crea el archivo en la ruta correspondiente para enlazar el cliente con la dirección HTTP de tu servidor backend:
```env
VITE_API_URL=http://localhost:3000
```

### 3. Sincronizar la Base de Datos (Docker + Prisma)
1. Inicia el servicio de base de datos relacional desde tu contenedor de **Docker**.
2. Desde la terminal en el directorio raíz del proyecto, ejecuta el siguiente comando para aplicar las migraciones de Prisma y actualizar el esquema en la base de datos activa:
```bash
pnpm --filter api prisma migrate dev
```

### 4. Ejecutar el Entorno de Desarrollo
Para poner en marcha de forma simultánea tanto la API del servidor como la interfaz gráfica, abre **dos terminales independientes** situadas en la raíz del proyecto y ejecuta los siguientes comandos:

* **Terminal 1 - Servidor Backend (API):**
  ```bash
  pnpm -C apps/api start:dev
  ```
* **Terminal 2 - Cliente Frontend (Web):**
  ```bash
  pnpm -C apps/web dev
  ```

Una vez completados los despliegues, podrás acceder a la documentación interactiva y pruebas de endpoints de la API en `http://localhost:3000/api/docs` (Swagger UI), y navegar por la aplicación web reactiva desde tu navegador en `http://localhost:5173`.

---

## 👥 Resumen de Capacidades de Autenticación y Control Evaluadas

La aplicación cubre rigurosamente los siguientes lineamientos técnicos y de seguridad exigidos en la rúbrica de evaluación del producto computacional terminado:
* **Flujo de Acceso Multiusuario**: Registro de usuarios (`signup`) con encriptación de credenciales mediante bcrypt, inicio de sesión seguro (`login`) y recuperación del estado del usuario autenticado (`me`).
* **Seguridad Avanzada mediante Tokens**: Implementación de Access Tokens de corta duración emparejados con Refresh Tokens de larga duración. El sistema persiste únicamente el hash SHA-256 de los tokens de refresco en la base de datos, mitigando la exposición de credenciales legibles en texto plano.
* **Mecanismo de Rotación Automatizado**: Cada vez que se solicita una renovación de sesión, el token de refresco antiguo es revocado y enlazado a un nuevo JTI en la base de datos, detectando y bloqueando de inmediato cualquier intento de reutilización maliciosa.
* **Control de Acceso por Roles (RBAC)**: Restricción selectiva de recursos tanto en el backend mediante Guards especializados como en el frontend de forma dinámica. Los usuarios con rol `ADMIN` acceden a herramientas de gestión de stock e historiales de auditoría global, mientras que los usuarios con rol `VENDEDOR` operan estrictamente sobre sus propios carritos de compra y registros de turno.
* **Cierre de Sesión Seguro y Resiliencia**: Endpoint `/auth/logout` para la invalidación lógica e inmediata de los tokens en el servidor. Adicionalmente, el frontend cuenta con interceptores de respuesta en Axios que capturan de forma inteligente errores `401 Unauthorized` para renovar la sesión de fondo o, en su defecto, limpiar la memoria y forzar la redirección al inicio de sesión.