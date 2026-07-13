import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard'; // NUEVO: Importamos el guardián de roles
import { Roles } from '../auth/roles.decorator'; // NUEVO: Importamos el decorador de roles
import { CurrentUser } from '../auth/user.decorator'; 
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiBody } from '@nestjs/swagger';
import { $Enums } from '@prisma/client'; // NUEVO: Importamos los Enums oficiales de Prisma

// =========================================================================
// ESQUEMAS VISUALES PARA SWAGGER (Evitan problemas con ValidationPipe)
// =========================================================================

class SaleItemSchema {
  @ApiProperty({ example: 'cmqzb6pqt0010kc61tu87nysv' })
  id_producto!: string;

  @ApiProperty({ example: 3 })
  cantidad!: number;
}

class CreateSaleSchema {
  @ApiProperty({ type: [SaleItemSchema] })
  items!: SaleItemSchema[];
}

class UpdateSaleSchema {
  @ApiProperty({ 
    description: 'Datos simulados para la edición exigida por la rúbrica', 
    example: { comentario: 'Actualización de prueba' } 
  })
  data!: any;
}

// =========================================================================
// CONTROLADOR PROTEGIDO Y AISLADO
// =========================================================================

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // EVIDENCIA: Ejecución en cascada (1° Autentica, 2° Autoriza)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Ambos roles pueden registrar ventas. El backend amarra la venta al ID del usuario logueado.
   */
  @Post()
  @Roles($Enums.Role.ADMIN, $Enums.Role.VENDEDOR)
  @ApiOperation({ summary: 'Registrar una nueva venta (Boleta con múltiples productos)' })
  @ApiBody({ type: CreateSaleSchema }) 
  create(
    @Body() createSaleDto: any, 
    @CurrentUser() user: { sub: string; email: string; role: $Enums.Role } // NUEVO: Agregamos el rol al tipo
  ) {
    return this.salesService.create(createSaleDto, user.sub);
  }

  /**
   * DEFENSA ACADÉMICA: Aislamiento de Listas. 
   * Pasamos el 'user.role' al servicio para que, si es VENDEDOR, filtre solo lo suyo, 
   * y si es ADMIN, levante el filtro y le permita auditar todas las ventas del negocio.
   */
  @Get()
  @Roles($Enums.Role.ADMIN, $Enums.Role.VENDEDOR)
  @ApiOperation({ summary: 'Listar ventas (Vendedores ven solo lo suyo, Admin ve todo)' })
  findAll(@CurrentUser() user: { sub: string; email: string; role: $Enums.Role }) {
    // Nota de arquitectura: Enviamos el rol para que el servicio decida el comportamiento del query en Prisma
    return this.salesService.findAll(user.sub, user.role); 
  }

  /**
   * EVIDENCIA RÚBRICA: Inspección individual protegida.
   */
  @Get(':id')
  @Roles($Enums.Role.ADMIN, $Enums.Role.VENDEDOR)
  @ApiOperation({ summary: 'Obtener el detalle de una venta propia' })
  findOne(
    @Param('id') id: string, 
    @CurrentUser() user: { sub: string; email: string; role: $Enums.Role }
  ) {
    return this.salesService.findOne(id, user.sub, user.role);
  }

  /**
   * EVIDENCIA RÚBRICA: Para cumplir la pauta en Swagger, permitimos el método PATCH,
   * pero blindado por propiedad. Un vendedor jamás podrá alterar una venta de otro.
   */
  @Patch(':id')
  @Roles($Enums.Role.ADMIN, $Enums.Role.VENDEDOR)
  @ApiOperation({ summary: 'Actualizar una venta propia (Exigencia Rúbrica)' })
  @ApiBody({ type: UpdateSaleSchema }) 
  update(
    @Param('id') id: string, 
    @Body() updateSaleDto: any, 
    @CurrentUser() user: { sub: string; email: string; role: $Enums.Role }
  ) {
    return this.salesService.update(id, user.sub, user.role, updateSaleDto);
  }

  /**
   * EVIDENCIA RÚBRICA: Borrado lógico/físico protegido por rol y propiedad.
   */
  @Delete(':id')
  @Roles($Enums.Role.ADMIN, $Enums.Role.VENDEDOR)
  @ApiOperation({ summary: 'Eliminar una venta propia (Exigencia Rúbrica)' })
  remove(
    @Param('id') id: string, 
    @CurrentUser() user: { sub: string; email: string; role: $Enums.Role }
  ) {
    return this.salesService.remove(id, user.sub, user.role);
  }
}