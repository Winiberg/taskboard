import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Mantener tu importación de base de datos
import { AuthModule } from '../auth/auth.module'; // Importación para el RolesGuard y JwtAuthGuard

@Module({
  imports: [
    PrismaModule, // Requerido para la persistencia de datos de ventas
    AuthModule    // Requerido para la seguridad, interceptores y guardianes de roles
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}