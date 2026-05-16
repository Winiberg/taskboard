# Guia de Inicio Rapido - Proyecto Taskboard (Backend API)

Este documento contiene el paso a paso detallado para descargar el proyecto, configurar el entorno local en Visual Studio Code y ejecutar las pruebas del CRUD correspondientes a la evaluacion.

---

## Requisitos Previos

Para el correcto funcionamiento del proyecto se requiere la instalacion de los siguientes componentes en el sistema operativo:

1. Visual Studio Code: Editor de texto para la visualizacion y gestion del codigo.
2. Node.js (Version LTS): Entorno de ejecucion para JavaScript y TypeScript.
3. Docker Desktop: Sistema de contenedores para inicializar la base de datos de manera aislada.
4. pnpm: Gestor de paquetes utilizado en el proyecto. En caso de no tenerlo instalado, abrir la terminal del sistema (CMD o PowerShell) y ejecutar el siguiente comando:
   npm install -g pnpm

---

## Paso 1: Descargar el Proyecto desde GitHub

1. Acceder al enlace del repositorio publico provisto.
2. Hacer clic en el boton Code situado en la parte superior derecha de la lista de archivos.
3. Seleccionar la opcion Download ZIP.
4. Extraer el contenido del archivo comprimido en un directorio local de preferencia.

---

## Paso 2: Apertura e Instalacion de Dependencias en VS Code

1. Iniciar Visual Studio Code.
2. Seleccionar la opcion File, luego Open Folder y elegir la carpeta raiz del proyecto descomprimido denominada taskboard.
3. Desplegar una nueva terminal integrada mediante el menu Terminal y la opcion New Terminal.
4. Cambiar el directorio de trabajo hacia la ubicacion de la API con el siguiente comando:
   cd apps/api
5. Ejecutar la instalacion de los módulos necesarios con el comando:
   pnpm install

---

## Paso 3: Inicializacion de la Base de Datos en Docker

El servidor requiere que el motor de base de datos se encuentre activo antes de iniciar su ejecucion:

1. Iniciar la aplicacion Docker Desktop.
2. Dirigirse a la seccion Containers en el panel lateral izquierdo.
3. Localizar el contenedor asociado al proyecto, denominado infra.
4. Hacer clic en el boton de inicio (Start / icono de reproduccion). Verificar que el estado cambie a color verde indicando que se encuentra en ejecucion.

---

## Paso 4: Sincronizacion del Esquema de Datos con Prisma

Con la base de datos activa, se deben estructurar las tablas correspondientes en PostgreSQL. En la misma terminal de VS Code, dentro de la ruta apps/api, ejecutar el siguiente comando:

pnpm prisma db push

El proceso finalizara correctamente al desplegar el mensaje: Your database is now in sync with your Prisma schema.

---

## Paso 5: Lanzamiento del Servidor de Desarrollo

Para iniciar la aplicacion en modo de observacion, ejecutar el siguiente comando en la terminal:

pnpm start:dev

Una vez finalizada la compilacion inicial, la terminal indicara los accesos activos:
- Servidor local activo en: http://localhost:3000
- Documentacion de la API (Swagger) en: http://localhost:3000/api/docs

---

## Paso 6: Ejecucion de Pruebas en la Interfaz de Swagger

1. Abrir el navegador web e ingresar a la direccion: http://localhost:3000/api/docs
2. Localizar el controlador de productos denominado products.
3. Desplegar el metodo POST /products y seleccionar la opcion Try it out.
4. En el cuerpo de la peticion (Request body), reemplazar la estructura por el siguiente formato que utiliza la nomenclatura de fecha chilena (DD-MM-AAAA):

{
  "nombre_producto": "Triton",
  "descripcion": "Galleta de chocolate",
  "stock": 100,
  "precio": 1000,
  "fecha_vencimiento": "30-01-2027"
}

5. Hacer clic en el boton Execute. La plataforma debe retornar un codigo de estado 201 Created junto con el objeto guardado e indexado con un identificador unico.
6. Para comprobar las restricciones del sistema, realizar una prueba ingresando una fecha anterior a la actual (por ejemplo: 10-05-2020) o alterando el formato. El servidor respondera con un codigo 400 Bad Request detallando la infraccion en el idioma configurado.
7. Validar el funcionamiento del resto de las operaciones CRUD utilizando los metodos GET (ingresando parametros de paginacion skip y take), PATCH para modificaciones parciales y DELETE para remocion de registros.

---
Nota tecnica: El entorno ha sido fijado en la version 5.15.0 de Prisma CLI y Prisma Client para asegurar la total compatibilidad con las especificaciones de la entrega.
