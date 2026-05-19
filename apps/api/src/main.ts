import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. CONFIGURACIÓN DE VALIDACIONES GLOBALES
  // Esto hace que NestJS revise automáticamente las reglas de tus productos
  app.useGlobalPipes(
    new ValidationPipe({//Asegura que solo pasen los datos definidos
      whitelist: true, // Filtra datos no definidos en DTOs
      transform: true, // Convierte los tipos de datos automáticamente (ej: texto a número)
    }),
  );

  // 2. CONFIGURACIÓN DE CORS
  // Permite que Frontend (Vite en puerto 5173) pueda pedirle datos al Backend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // 3. CONFIGURACIÓN DE SWAGGER (DOCUMENTACIÓN INTERACTIVA)
  const config = new DocumentBuilder()
    .setTitle('Sistema de Inventario')
    .setDescription('Endpoints para la gestión y control del inventario de productos')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Inicia el servidor en el puerto 3000
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Servidor corriendo en: http://localhost:3000`);
  console.log(`Documentación de Swagger en: http://localhost:3000/api/docs`);
}
bootstrap();