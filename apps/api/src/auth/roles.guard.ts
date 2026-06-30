import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajusta la ruta a tu PrismaService si es necesario

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userPayload = request.user; // Viene del JwtAuthGuard

    if (!userPayload || !userPayload.sub) {
      throw new ForbiddenException('No autenticado o token inválido');
    }

    // Buscamos el usuario en la DB para verificar su rol real actual
    const user = await this.prisma.user.findUnique({
      where: { id: userPayload.sub },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Acceso denegado: Se requieren permisos de Administrador');
    }

    // Si es ADMIN, adjuntamos el rol a la petición por si acaso y dejamos pasar
    request.user.role = user.role;
    return true;
  }
}