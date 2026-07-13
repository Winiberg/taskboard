import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

// TTL por defecto para access tokens usados por JwtModule
const ACCESS_TTL = process.env.JWT_EXPIRES
  ? Number(process.env.JWT_EXPIRES)
  : 900;

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: ACCESS_TTL },
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [RolesGuard], // para usarlo desde otros módulos, ej. SalesModule / TasksModule
})
export class AuthModule {}