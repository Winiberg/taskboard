import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard'; 
import { Roles } from '../auth/roles.decorator'; // Importamos el decorador del Instructivo 6
import { $Enums } from '@prisma/client'; // Importamos el enum nativo de Prisma

@ApiTags('Productos') 
@ApiBearerAuth() 
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard) // EVIDENCIA: Aplicamos ambos Guards en cascada para todo el controlador
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles($Enums.Role.ADMIN) // Restricción exclusiva para el Administrador
  @ApiOperation({ summary: 'Crear un nuevo producto en el inventario (Solo Admin)' })
  create(@Body() createProductDto: CreateProductDto) {
    return {
      message: 'Producto creado de forma segura en el inventario global',
      data: this.productsService.create(createProductDto)
    };
  }

  @Get()
  @Roles($Enums.Role.ADMIN, $Enums.Role.VENDEDOR) // Ambos roles VENDEDOR Y ADMIN necesitan ver el catálogo en el POS
  @ApiOperation({ summary: 'Obtener lista de todos los productos globales con paginación' })
  @ApiQuery({ name: 'skip', required: false, description: 'Número de registros a saltar', default: 0 })
  @ApiQuery({ name: 'take', required: false, description: 'Número de registros a traer', default: 10 })
  findAll(
    @Query('skip') skip = '0',
    @Query('take') take = '10',
  ) {
    return this.productsService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  @Roles($Enums.Role.ADMIN, $Enums.Role.VENDEDOR) // Ambos roles pueden inspeccionar un producto individual
  @ApiOperation({ summary: 'Buscar un producto por su id_producto' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles($Enums.Role.ADMIN) //Modificación del stock crítico centralizado solo por ADMIN
  @ApiOperation({ summary: 'Actualizar los datos de un producto por ID (Solo Admin)' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles($Enums.Role.ADMIN) // Acción destructiva bloqueada para mitigar pérdidas
  @ApiOperation({ summary: 'Eliminar un producto del inventario (Solo Admin)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}