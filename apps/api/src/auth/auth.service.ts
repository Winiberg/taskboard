import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable() 
export class AuthService {
  // Inyectamos el servicio de usuarios y el JwtService propio de NestJS
  constructor(
    private users: UsersService, 
    private jwt: JwtService
  ) {}

  /**
   * Registra un usuario y le emite inmediatamente su token de acceso.
   */
  async signup(email: string, password: string, name?: string) {
    // Delegamos la creación y el hasheo al UsersService
    const user = await this.users.create(email, password, name);
    
    // Emitimos el token inyectando el rol correspondiente obtenido de la BD
    return this.sign(user.id, user.email, user.role);
  }

  /**
   * Valida las credenciales de inicio de sesión.
   */
  async login(email: string, password: string) {
    // 1. Buscamos al usuario por su email único
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    
    // 2. Comparamos la contraseña en texto plano con el hash usando Bcrypt de forma asíncrona
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    
    // 3. Si todo está correcto, firmamos el payload incluyendo su rol
    return this.sign(user.id, user.email, user.role);
  }

  /**
   * Método privado centralizado para la firma y estructuración del JWT.
   */
  private sign(sub: string, email: string, role: string) {
    // Construimos el reclamo (payload) que viajará encriptado dentro del token
    const access_token = this.jwt.sign(
      { sub, email, role }, 
      { 
        // Leemos la firma desde las variables de entorno
        secret: process.env.JWT_SECRET,
        // Garantizamos un valor numérico seguro en segundos, evitando fallos de tipo NaN
        expiresIn: Number(process.env.JWT_EXPIRES ?? 86400) 
      }
    );
    
    return { access_token };
  }
}