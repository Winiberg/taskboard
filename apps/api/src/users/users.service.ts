import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  // Mediante Inyección de Dependencias, traemos PrismaService para interactuar con la Base de Datos
  constructor(private prisma: PrismaService) {}

  /**
   * REGLAS (a) y (b): Registro seguro de un nuevo usuario en el sistema.
   */
  async create(email: string, password: string, name?: string) {
    // REGLA (a): Validación de Identidad Duplicada. 
    // Buscamos si el email ya existe para garantizar la restricción de unicidad antes de persistir.
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      // Si existe, rompemos el flujo lanzando la excepción HTTP 409 (Conflict) exigida por la pauta.
      throw new ConflictException('Email ya está en uso');
    }

    // REGLA (b): Criptografía y Seguridad.
    // Aplicamos un algoritmo de hash asimétrico (Bcrypt) con 10 rondas de salado (salt)
    // para encriptar la contraseña y mitigar ataques de fuerza bruta.
    const passwordHash = await bcrypt.hash(password, 10);

    // Almacenamos el registro en la tabla 'user' mapeando la contraseña encriptada en 'passwordHash'.
    return this.prisma.user.create({ 
      data: { email, passwordHash, name } 
    });
  }

  /**
   * REGLA (c): Exposición del método 'findByEmail'.
   * Requerido estratégicamente por el módulo de autenticación (AuthService) 
   * para validar las credenciales de los usuarios durante el proceso de Login.
   */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * REGLA (c): Exposición del método 'findById'.
   * Requerido por la estrategia de Passport (JwtStrategy) para inyectar 
   * la identidad completa del usuario autenticado dentro del objeto Request (req.user).
   */
  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}