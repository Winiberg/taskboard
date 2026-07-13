import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // Necesario para leer los metadatos del decorador
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client'; // Importamos tu enum real de la base de datos
import { ROLES_KEY } from './roles.decorator'; // Ajusta la ruta según tu estructura

@Injectable()
export class RolesGuard implements CanActivate {
  // Inyectamos el Reflector y mantenemos tu PrismaService para máxima seguridad
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extraer dinámicamente los roles permitidos para este endpoint o controlador
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint NO tiene el decorador @Roles, se asume que cualquier usuario autenticado puede pasar
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPayload = request.user; // Datos del payload que inyectó tu JwtAuthGuard

    if (!userPayload || !userPayload.sub) {
      throw new ForbiddenException('No autenticado o token inválido');
    }

    // 2. Mantenemos tu impecable estrategia de la Eval 2: Consultar el rol real en tiempo real
    const user = await this.prisma.user.findUnique({
      where: { id: userPayload.sub },
    });

    // 3. Validación Dinámica (Exigencia de la Evaluación 3):
    // Verificamos si el rol actual del usuario en la BD está incluido en los roles permitidos por el decorador
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Acceso denegado: Esta operación requiere privilegios de [${requiredRoles.join(', ')}]`,
      );
    }

    // Sincronizamos el rol real verificado por si el payload del token estaba desactualizado
    request.user.role = user.role;
    return true;
  }
}