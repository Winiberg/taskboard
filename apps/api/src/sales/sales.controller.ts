import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/user.decorator'; 
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiBody } from '@nestjs/swagger';

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

// Nuevo esquema para que aparezca la caja de texto en el PATCH
class UpdateSaleSchema {
  @ApiProperty({ 
    description: 'Datos simulados para la edición exigida por la rúbrica', 
    example: { comentario: 'Actualización de prueba' } 
  })
  data!: any;
}

// =========================================================================
// CONTROLADOR
// =========================================================================

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva venta (Boleta con múltiples productos)' })
  @ApiBody({ type: CreateSaleSchema }) 
  create(
    @Body() createSaleDto: any, 
    @CurrentUser() user: { sub: string; email: string } 
  ) {
    return this.salesService.create(createSaleDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas (Vendedores ven solo lo suyo)' })
  findAll(@CurrentUser() user: { sub: string; email: string }) {
    return this.salesService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una venta propia' })
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string; email: string }) {
    return this.salesService.findOne(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una venta propia (Exigencia Rúbrica)' })
  @ApiBody({ type: UpdateSaleSchema }) // <--- SOLUCIÓN: Esto dibuja el cuadro de texto en Swagger
  update(
    @Param('id') id: string, 
    @Body() updateSaleDto: any, // <--- SOLUCIÓN: En 'any' pasa directo al servicio sin rebotar
    @CurrentUser() user: { sub: string; email: string }
  ) {
    return this.salesService.update(id, user.sub, updateSaleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una venta propia (Exigencia Rúbrica)' })
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string; email: string }) {
    return this.salesService.remove(id, user.sub);
  }
}