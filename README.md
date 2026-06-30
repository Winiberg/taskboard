Guia de Inicio Rapido - Proyecto Taskboard (Backend API & Ventas)
Este documento contiene el paso a paso detallado para descargar el proyecto, configurar el entorno local en Visual Studio Code, levantar la base de datos en Docker y ejecutar las pruebas del CRUD de productos y el flujo de seguridad multiusuario de ventas correspondientes a la evaluación.

Requisitos Previos
Para el correcto funcionamiento del proyecto se requiere la instalación de los siguientes componentes en el sistema operativo:

Visual Studio Code: Editor de texto para la visualización y gestión del código.

Node.js (Versión LTS): Entorno de ejecución para JavaScript y TypeScript.

Docker Desktop: Sistema de contenedores para inicializar la base de datos de manera aislada.

pnpm: Gestor de paquetes utilizado en el proyecto. En caso de no tenerlo instalado, abrir la terminal del sistema (CMD o PowerShell) y ejecutar el siguiente comando:

npm install -g pnpm

Paso 1: Descargar el Proyecto desde GitHub
Acceder al enlace del repositorio público provisto.

Hacer clic en el botón Code situado en la parte superior derecha de la lista de archivos.

Seleccionar la opción Download ZIP.

Extraer el contenido del archivo comprimido en un directorio local de preferencia.

Paso 2: Apertura e Instalación de Dependencias en VS Code
Iniciar Visual Studio Code.

Seleccionar la opción File, luego Open Folder y elegir la carpeta raíz del proyecto descomprimido denominada taskboard.

Desplegar una nueva terminal integrada mediante el menú Terminal y la opción New Terminal.

Cambiar el directorio de trabajo hacia la ubicación de la API con el siguiente comando:

cd apps/api

Ejecutar la instalación de los módulos necesarios con el comando:

pnpm install

Para el Frontend, abrir otra terminal (o retroceder directorios) e instalar sus módulos correspondientes:

cd ../../frontend
pnpm install

Paso 3: Inicialización de la Base de Datos en Docker
El servidor requiere que el motor de base de datos se encuentre activo antes de iniciar su ejecución:

Iniciar la aplicación Docker Desktop.

Dirigirse a la sección Containers en el panel lateral izquierdo.

Localizar el contenedor asociado al proyecto, denominado infra.

Hacer clic en el botón de inicio (Start / icono de reproducción). Verificar que el estado cambie a color verde indicando que se encuentra en ejecución.

Paso 4: Sincronización del Esquema de Datos con Prisma
Con la base de datos activa, se deben estructurar las tablas correspondientes en PostgreSQL. En la terminal de VS Code, dentro de la ruta apps/api, ejecutar el siguiente comando:

pnpm prisma db push

El proceso finalizará correctamente al desplegar el mensaje: Your database is now in sync with your Prisma schema.

En caso de que el proyecto cuente con los usuarios base de la prueba cargados en el script de seed, ejecutar:

pnpm prisma db seed

Cuentas de Acceso Pre-cargadas para la Evaluación
Vendedor 1: vendedor1@empresa.com (Contraseña: 123456) -> Registro de ventas propias y validación de autoría.

Vendedor 2: vendedor2@empresa.com (Contraseña: 123456) -> Simulación de intruso / Intento de hackeo de datos ajenos.

Administrador: admin@empresa.com (Contraseña: 123456) -> Auditoría global y visualización total de registros.

Paso 5: Lanzamiento de los Servidores de Desarrollo
Para iniciar la aplicación en modo de observación, ejecutar el siguiente comando en la terminal dentro de apps/api:

pnpm start:dev

Para levantar el entorno gráfico del Frontend, ejecutar en su respectiva terminal:

pnpm dev

Una vez finalizada la inicialización, los accesos activos del sistema serán:

Servidor de la API activo en: http://localhost:3000

Documentación de la API (Swagger UI) en: http://localhost:3000/api/docs

Aplicación Frontend Web activa en: http://localhost:5173

Paso 6: Ejecución de Pruebas en la Interfaz de Swagger
Abra el navegador web e ingrese a la dirección: http://localhost:3000/api/docs

Escenario A: Gestión de Catálogo y Fechas Chilenas (Products)
Localizar el controlador de productos denominado products.

Desplegar el método POST /products y seleccionar la opción Try it out.

En el cuerpo de la petición (Request body), reemplazar la estructura por el siguiente formato que utiliza la nomenclatura de fecha chilena (DD-MM-AAAA):

{
"nombre_producto": "Triton",
"descripcion": "Galleta de chocolate",
"stock": 100,
"precio": 1000,
"fecha_vencimiento": "30-01-2027"
}

Hacer clic en el botón Execute. La plataforma debe retornar un código de estado 201 Created junto con el objeto guardado e indexado con un identificador único. Copie el ID del producto generado (id_producto).

Para comprobar las restricciones del sistema, realizar una prueba ingresando una fecha anterior a la actual (por ejemplo: 10-05-2020) o alterando el formato. El servidor responderá con un código 400 Bad Request detallando la infracción en el idioma configurado.

Validar el funcionamiento del resto de las operaciones CRUD utilizando los métodos GET (ingresando parámetros de paginación skip y take), PATCH para modificaciones parciales y DELETE para remoción de registros.

Escenario B: Control de Acceso y Aislamiento Multiusuario (Sales)
Para demostrar el resguardo de privacidad y aislamiento exigido por la rúbrica de evaluación, ejecute la siguiente secuencia:

Autenticar Vendedor 1: Diríjase al controlador auth, expanda POST /auth/login e ingrese las credenciales de vendedor1@empresa.com. Copie el token JWT recibido en la respuesta.

Autorizar en Swagger: Suba al inicio de la página, haga clic en el botón Authorize (icono de candado), pegue el token copiado y presione el botón Authorize.

Registrar Venta (POST /sales): Vaya al controlador sales, use el método POST /sales, presione Try it out y envíe el JSON del carrito sustituyendo el campo por el ID real del producto creado en el Escenario A:

{
"items": [
{
"id_producto": "PEGAR_AQUI_EL_ID_DEL_PRODUCTO",
"cantidad": 3
}
]
}

Haga clic en Execute (201 Created) y copie el ID de la venta (id) devuelto en el JSON de respuesta.
4. Simular Intrusión con Vendedor 2: Regrese a POST /auth/login e inicie sesión usando los accesos de vendedor2@empresa.com. Copie su nuevo token, presione el botón Authorize de arriba, haga clic en Logout para limpiar la sesión anterior, pegue el token del Vendedor 2 y active la autorización.
5. Comprobar Bloqueo de Seguridad: Intente consultar la venta del Vendedor 1 usando GET /sales/{id}, o intente modificarla con PATCH /sales/{id} (enviando el objeto vacío {} en el cuadro de texto) o eliminarla con DELETE /sales/{id} ingresando el ID de la venta guardada en el punto 3.

Resultado Esperado: La API bloqueará la petición devolviendo un código 404 Not Found o 403 Forbidden, demostrando que un vendedor tiene estrictamente prohibido manipular o conocer la existencia de registros ajenos.

Auditoría Global (ADMIN): Autentíquese con la cuenta admin@empresa.com y coloque su token en el candado de Swagger. Ejecute el método GET /sales de listar. El Administrador listará de forma transparente todas las ventas históricas del comercio para tareas de supervisión y cuadratura.

Escenario C: Comprobación en el Frontend
Ingrese a http://localhost:5173 desde su navegador web.

Al iniciar sesión con un Vendedor, corrobora que la interfaz oculta dinámicamente los gráficos financieros corporativos y el maestro de stock para evitar la competencia desleal y resguardar el inventario.

Al ingresar como Admin, el sistema habilitará automáticamente el Dashboard de KPIs de ventas totales y alertas de reaprovisionamiento.

Nota tecnica: El entorno ha sido fijado en la versión 5.15.0 de Prisma CLI y Prisma Client para asegurar la total compatibilidad con las especificaciones de la entrega.