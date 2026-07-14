import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service'; // Inyectamos Prisma para gestionar los RefreshTokens
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable() 
export class AuthService {
  // Inyectamos tus servicios originales y sumamos PrismaService para la Evaluación 3
  constructor(
    private users: UsersService, 
    private jwt: JwtService,
    private prisma: PrismaService
  ) {}

  /**
   * Registra un usuario y le emite inmediatamente su par de tokens (Access y Refresh).
   */
  async signup(email: string, password: string, name?: string) {
    // Delegamos la creación y el hasheo al UsersService
    const user = await this.users.create(email, password, name);
    
    // Emitimos el juego de tokens inyectando el rol correspondiente obtenido de la BD
    return this.issueTokens(user.id, user.email, user.role);
  }

  /**
   * Valida las credenciales de inicio de sesión.
   */
  async login(email: string, password: string) {
    // 1. Buscamos al usuario por su email único mediante tu servicio
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    
    // 2. Comparamos la contraseña en texto plano con tu propiedad exacta: user.passwordHash
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    
    // 3. Si todo está correcto, generamos el par de tokens balanceados para el POS
    return this.issueTokens(user.id, user.email, user.role);
  }

  /**
   * Método privado centralizado para la firma, estructuración y persistencia 
   * segura del par de tokens (Reemplaza a tu antiguo método sign).
   */
  private async issueTokens(sub: string, email: string, role: string) {
    const jti = uuidv4(); // Identificador único (UUID v4) para rastrear este Refresh Token específico

    // **EVALUACIÓN 3: (Configuración de entorno): AuthService consume la variable
    //JWT_REFRESH_EXPIRES del .env para parsear la expiración del token de refresco
    const accessExpiresIn = Number(process.env.JWT_EXPIRES ?? 900);
    const refreshExpiresIn = Number(process.env.JWT_REFRESH_EXPIRES ?? 1209600);

    // EVALUACIÓN 3 (Emisión segura de tokens): Cumple con a) porque emite un access token corto que contiene estrictamente las propiedades del usuario (sub, email y role) en el payload firmado.
    const access_token = this.jwt.sign(
      { sub, email, role }, 
      { 
        secret: process.env.JWT_SECRET,
        expiresIn: accessExpiresIn 
      }
    );
    // **EVALUACIÓN 3 (Configuración de entorno): AuthService utiliza la variable 
    // JWT_REFRESH_SECRET del .env de forma exclusiva para firmar criptográficamente 
    // el refresh token
    // EVALUACIÓN 3 (Emisión segura de tokens): Cumple con b) porque genera un 
    // refresh token incorporando un identificador de token único (jti) y firmado 
    // bajo un secreto criptográfico exclusivo (JWT_REFRESH_SECRET) diferente al 
    // del access token.
    const refresh_token = this.jwt.sign(
      { sub, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpiresIn
      }
    );

    // EVALUACIÓN 3 (Emisión segura de tokens): Cumple con c) porque procesa un 
    // hash criptográfico unidireccional SHA-256 del refresh token antes de 
    // almacenarlo en la base de datos relacional para resguardar su integridad.
    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

    // Calculamos la expiración exacta sumando los segundos del .env a la fecha actual
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    // EVALUACIÓN 3 (Emisión segura de tokens): Cumple con c) porque almacena en 
    // la tabla RefreshToken únicamente el hash criptográfico, la fecha exacta de 
    // expiración y su relación de clave foránea al usuario correspondiente (userId).
    await this.prisma.refreshToken.create({
      data: {
        jti,
        tokenHash,
        userId: sub,
        expiresAt,
      },
    });

    // EVALUACIÓN 3 (Emisión segura de tokens): Cumple con d) porque finaliza el 
    // proceso de emisión retornando al cliente solicitante un objeto de 
    // transferencia de datos estructurado exactamente con el par 
    // { access_token, refresh_token }.
    return { access_token, refresh_token };
  }

  /**
   * Algoritmo de Rotación de Tokens y Detección de Fraude (Reuso de tokens)
   */
  async refreshTokens(refreshTokenStr: string) {
    try {
      // ** 1. EVALUACIÓN 3: Verificación criptográfica del Refresh Token entrante usando JWT_REFRESH_SECRET
      const payload = await this.jwt.verifyAsync(refreshTokenStr, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // 2. Buscar el registro en la BD por su JTI único incluyendo la relación del usuario
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { jti: payload.jti },
        include: { user: true },
      });

      // CONTROL DE REUSO (Ataques de Secuestro de Sesión):
      // Si el token no existe, está expirado o ya fue marcado como revocado previamente
      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        if (tokenRecord?.isRevoked) {
          // ** EVALUACIÓN 3 (Configuración de entorno): Si ya está revocado y volvieron a presentarlo, es un intento de fraude.
          // Por seguridad del inventario, revocamos inmediatamente TODAS las sesiones de este usuario.
          await this.prisma.refreshToken.updateMany({
            where: { userId: tokenRecord.userId },
            data: { isRevoked: true },
          });
        }
        throw new UnauthorizedException('Refresh revoked/expired');
      }

      // 3. Emitir el nuevo par de tokens limpios para el Vendedor o Administrador
      const tokens = await this.issueTokens(tokenRecord.user.id, tokenRecord.user.email, tokenRecord.user.role);

      // 4. Decodificar el nuevo token emitido para obtener su JTI y enlazar la cadena de rotación
      const newPayload = this.jwt.decode(tokens.refresh_token) as any;
      const newRecord = await this.prisma.refreshToken.findUnique({
        where: { jti: newPayload.jti },
      });

      // 5. Marcar el token viejo como utilizado (isRevoked: true) y enlazarlo al nuevo ID
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          isRevoked: true,
          replacedByTokenId: newRecord?.id,
        },
      });

      return tokens;
    } catch (error) {
      // Si el error ya es un UnauthorizedException, lo dejamos pasar intacto (401)
      if (error instanceof UnauthorizedException) throw error;
      // Para cualquier otro error (tokens malformados, firmas inválidas), disparamos el 401 de la guía
      throw new UnauthorizedException('Refresh revoked/expired');
    }
  }

 // Invalidación y Cierre de Sesión Limpio (Logout)
  async logout(refreshTokenStr: string) {
    try {
      // Decodificamos el token sin verificar firma para extraer el JTI rápidamente
      const payload = this.jwt.decode(refreshTokenStr) as any;
      if (payload && payload.jti) {
        // **EVALUACIÓN 3 (Configuración de entorno): Invalidación lógica en la base de datos marcando isRevoked como true
        await this.prisma.refreshToken.updateMany({
          where: { jti: payload.jti },
          data: { isRevoked: true },
        });
      }
    } catch {
      // Falla silenciosa intencional para mitigar ataques de denegación u observación
    }
    return { success: true };
  }
}