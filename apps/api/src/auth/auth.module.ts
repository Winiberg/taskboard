import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule, // Importación del módulo que encapsula la persistencia de usuarios
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Firma criptográfica secreta
      signOptions: { 
        // Garantizamos que la expiración sea numérica y tenga un fallback seguro en segundos
        expiresIn: Number(process.env.JWT_EXPIRES ?? 86400) 
      },
    }),
  ],
  providers: [AuthService, JwtStrategy], // Registramos el servicio y la estrategia de Passport
  controllers: [AuthController],
})
export class AuthModule {}