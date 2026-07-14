import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

// EVALUACIÓN 3: Extrae y valida la expiración del Access Token desde el .env
const ACCESS_TTL = process.env.JWT_EXPIRES
  ? Number(process.env.JWT_EXPIRES)
  : 900;

@Module({
  imports: [
    UsersModule,
    // EVALUACIÓN3: Registro del JwtModule utilizando las variables de entorno
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Mapea JWT_SECRET del .env para firmas rutinarias
      signOptions: { expiresIn: ACCESS_TTL }, // Asigna la expiración basada en JWT_EXPIRES
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [RolesGuard], // para usarlo desde otros módulos, ej. SalesModule
})
export class AuthModule {}