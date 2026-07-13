import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { $Enums } from '@prisma/client'; // Importación nativa de tipos de Prisma para control estricto de Enums
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  // Principio de Inyección de Dependencias: Traemos PrismaService para interactuar de forma segura con PostgreSQL
  constructor(private prisma: PrismaService) {}

  /**
   * EVIDENCIA: Método de Creación Segura de Usuarios
   *  
   * 1. Control de Unicidad: Antes de persistir, validamos la existencia del email para evitar excepciones descontroladas 
   * en el motor de base de datos. Si se duplica, disparamos un 'ConflictException' (HTTP 409) como exige la buena práctica RESTful.
   * 2. Criptografía Hashing: Aplicamos Bcrypt con 10 rondas de salado (salt) de forma asíncrona para que las contraseñas nunca queden 
   * expuestas en texto plano en la base de datos (Garantía de Seguridad).
   * 3. Principio de Menor Privilegio: Usamos '$Enums.Role.VENDEDOR' de manera fija en el código. Esto blinda el Punto de Venta evitando 
   * "Ataques de Escalada de Privilegios", asegurando que ningún usuario se registre como Administrador de forma maliciosa.
   */
  async create(email: string, password: string, name?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email ya está en uso');

    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: { 
        email, 
        passwordHash, 
        name, 
        role: $Enums.Role.VENDEDOR // Vinculación directa con el Enum oficial de nuestro schema.prisma
      },
    });
  }

  /**
   * EVIDENCIA: Buscador por Email Único
   * 
   * Este método desacopla la capa de persistencia. Es consumido directamente 
   * por el 'AuthService' durante el proceso de Login para verificar si la identidad existe 
   * antes de proceder con la comparación de hashes criptográficos.
   */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  } 

  /**
   * EVIDENCIA: Buscador por ID (cuid)
   * 
   * Requerido por nuestra estrategia de Passport/JWT Guard para re-validar la 
   * identidad en peticiones subsiguientes. Permite inyectar los datos frescos del usuario 
   * directamente en el objeto 'Request' de Express/NestJS (req.user).
   */
  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}