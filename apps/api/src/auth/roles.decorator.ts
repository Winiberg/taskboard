import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Importamos el enum real de tu base de datos PostgreSQL

export const ROLES_KEY = 'roles';

/**
 * EVIDENCIA: Decorador Personalizado @Roles(...)
 * 
 * Defensa Académica: Este decorador actúa como un recolector de metadatos. Permite marcar 
 * endpoints específicos indicando qué roles del sistema POS tienen permitido el acceso.
 * Tipamos con 'Role[]' para asegurar que solo se puedan pasar valores válidos: Role.ADMIN o Role.VENDEDOR.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);